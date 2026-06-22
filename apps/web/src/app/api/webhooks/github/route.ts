import { NextResponse } from "next/server";

import { prisma } from "@forge-ai/db";
import { EVENTS, inngest } from "@forge-ai/inngest";
import {
  verifyGitHubSignature,
  type GitHubPullRequestPayload,
} from "@forge-ai/github";

export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("x-hub-signature-256");
  const event = req.headers.get("x-github-event");

  if (!verifyGitHubSignature(raw, sig, process.env.GITHUB_WEBHOOK_SECRET)) {
    return NextResponse.json({ ok: false, error: "bad signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  if (event !== "pull_request") {
    return NextResponse.json({ ok: true, ignored: event });
  }

  const pr = payload as GitHubPullRequestPayload;
  const repo = await prisma.repository.findFirst({
    where: { owner: pr.repository.owner.login, name: pr.repository.name },
  });
  if (!repo) {
    return NextResponse.json({ ok: true, ignored: "unknown-repo" });
  }

  const state = pr.pull_request.merged
    ? "MERGED"
    : pr.pull_request.state === "open"
      ? "OPEN"
      : "CLOSED";

  // Branch convention: `forge-ai/task-<taskId>` links PR → task → feature.
  const taskMatch = pr.pull_request.head.ref.match(/forge-ai\/task-([a-z0-9]+)/i);
  const task = taskMatch
    ? await prisma.task.findFirst({
        where: { id: taskMatch[1], feature: { workspaceId: repo.workspaceId } },
      })
    : null;

  const saved = await prisma.pullRequest.upsert({
    where: { repositoryId_number: { repositoryId: repo.id, number: pr.pull_request.number } },
    update: {
      title: pr.pull_request.title,
      body: pr.pull_request.body ?? null,
      state,
      headSha: pr.pull_request.head.sha,
      mergedAt: pr.pull_request.merged_at ? new Date(pr.pull_request.merged_at) : null,
      closedAt: pr.pull_request.closed_at ? new Date(pr.pull_request.closed_at) : null,
    },
    create: {
      workspaceId: repo.workspaceId,
      repositoryId: repo.id,
      featureId: task?.featureId ?? null,
      taskId: task?.id ?? null,
      number: pr.pull_request.number,
      title: pr.pull_request.title,
      body: pr.pull_request.body ?? null,
      state,
      baseBranch: pr.pull_request.base.ref,
      headBranch: pr.pull_request.head.ref,
      headSha: pr.pull_request.head.sha,
      authorLogin: pr.pull_request.user.login,
      htmlUrl: pr.pull_request.html_url,
      openedAt: new Date(pr.pull_request.created_at),
      mergedAt: pr.pull_request.merged_at ? new Date(pr.pull_request.merged_at) : null,
      closedAt: pr.pull_request.closed_at ? new Date(pr.pull_request.closed_at) : null,
    },
  });

  if (task && state === "OPEN") {
    await prisma.task.update({
      where: { id: task.id },
      data: { status: "IN_REVIEW" },
    });
  }
  if (task && state === "MERGED") {
    await prisma.task.update({
      where: { id: task.id },
      data: { status: "DONE" },
    });
  }

  if (pr.action === "opened" || pr.action === "synchronize" || pr.action === "ready_for_review") {
    await inngest.send({
      name: EVENTS.PR_REVIEW,
      data: { pullRequestId: saved.id },
    });
  }

  return NextResponse.json({ ok: true, pullRequestId: saved.id });
}
