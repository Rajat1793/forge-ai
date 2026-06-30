import { generateObject } from "ai";

import { prisma } from "@forge-ai/db";
import {
  hasAIKey,
  heavyModel,
  MODEL_HEAVY,
  reviewResultSchema,
  type ReviewResult,
} from "@forge-ai/ai";
import {
  createGitHubClient,
  getPullRequestFiles,
  hasGitHubAuth,
  postPullRequestComment,
} from "@forge-ai/github";

import { EVENTS, inngest } from "../client";

const fallbackReview = (): ReviewResult => ({
  overallSummary:
    "AI review skipped — no MISTRAL_API_KEY configured. PR is queued for human review.",
  prdCoverageScore: 0.5,
  readyForHumanReview: true,
  issues: [],
});

const truncatePatch = (patch: string | null, max = 2500) =>
  !patch ? "" : patch.length > max ? patch.slice(0, max) + "\n…(truncated)" : patch;

export const reviewPullRequest = inngest.createFunction(
  { id: "pr-ai-review", name: "Run AI review on pull request" },
  { event: EVENTS.PR_REVIEW },
  async ({ event, step }) => {
    const pullRequestId = (event.data as { pullRequestId: string }).pullRequestId;
    const startedAt = Date.now();

    const pr = await step.run("load-pr", () =>
      prisma.pullRequest.findUnique({
        where: { id: pullRequestId },
        include: {
          repository: true,
          feature: {
            include: {
              prds: {
                include: { versions: { orderBy: { version: "desc" }, take: 1 } },
                take: 1,
              },
            },
          },
        },
      }),
    );
    if (!pr) return { skipped: true, reason: "pr-not-found" };

    const files = await step.run("fetch-files", async () => {
      if (!hasGitHubAuth()) return [];
      try {
        const client = createGitHubClient();
        const list = await getPullRequestFiles(
          client,
          pr.repository.owner,
          pr.repository.name,
          pr.number,
        );
        await prisma.pullRequestFile.deleteMany({ where: { pullRequestId: pr.id } });
        await prisma.pullRequestFile.createMany({
          data: list.map((f) => ({
            pullRequestId: pr.id,
            filename: f.filename,
            status: f.status,
            additions: f.additions,
            deletions: f.deletions,
            patch: f.patch,
          })),
        });
        return list;
      } catch {
        return [];
      }
    });

    const result = await step.run("ai-review", async () => {
      if (!hasAIKey()) return fallbackReview();
      const version = pr.feature?.prds[0]?.versions[0];
      const prdContext = version
        ? `Problem:\n${version.problemStatement}\n\nGoals:\n- ${version.goals.join(
            "\n- ",
          )}\n\nAcceptance criteria:\n${JSON.stringify(
            version.acceptanceCriteria,
            null,
            2,
          )}`
        : "No linked PRD.";
      const diffs = files
        .slice(0, 25)
        .map((f) => `### ${f.filename} (+${f.additions} -${f.deletions})\n${truncatePatch(f.patch)}`)
        .join("\n\n");

      const { object } = await generateObject({
        model: heavyModel(),
        schema: reviewResultSchema,
        system:
          "You are a meticulous senior engineer reviewing a pull request. " +
          "Compare the diff against the linked PRD. Flag PRD-coverage gaps, " +
          "security issues, performance regressions, and quality smells. " +
          "Cite file paths and line numbers when possible.",
        prompt: `PR: ${pr.title}\n${pr.body ?? ""}\n\nPRD context:\n${prdContext}\n\nDiff:\n${diffs || "(no files)"}`,
      });
      return object;
    });

    const saved = await step.run("persist-review", async () => {
      const review = await prisma.aIReview.create({
        data: {
          workspaceId: pr.workspaceId,
          pullRequestId: pr.id,
          headSha: pr.headSha,
          overallSummary: result.overallSummary,
          prdCoverageScore: result.prdCoverageScore,
          readyForHumanReview: result.readyForHumanReview,
          modelName: MODEL_HEAVY,
          durationMs: Date.now() - startedAt,
          issues: {
            create: result.issues.map((i) => ({
              severity: i.severity,
              category: i.category,
              title: i.title,
              description: i.description,
              file: i.file ?? null,
              line: i.line ?? null,
              suggestion: i.suggestion ?? null,
            })),
          },
        },
      });
      return review;
    });

    await step.run("debit-credit", async () => {
      const last = await prisma.creditLedger.findFirst({
        where: { workspaceId: pr.workspaceId },
        orderBy: { createdAt: "desc" },
      });
      const balance = last?.balance ?? 0;
      await prisma.creditLedger.create({
        data: {
          workspaceId: pr.workspaceId,
          event: "REVIEW_RUN",
          delta: -1,
          balance: balance - 1,
          reason: `AI review on PR #${pr.number}`,
        },
      });
      return { balance: balance - 1 };
    });

    await step.run("comment-on-pr", async () => {
      if (!hasGitHubAuth()) return { skipped: true };
      try {
        const client = createGitHubClient();
        const blocking = result.issues.filter((i) => i.severity === "BLOCKING");
        const body =
          `**Forge AI review** — coverage ${Math.round(result.prdCoverageScore * 100)}% · ` +
          `${blocking.length} blocking issue${blocking.length === 1 ? "" : "s"}\n\n` +
          `${result.overallSummary}\n\n` +
          (result.issues.length
            ? result.issues
                .map(
                  (i) =>
                    `- **[${i.severity}/${i.category}]** ${i.title}${
                      i.file ? ` _(${i.file}${i.line ? `:${i.line}` : ""})_` : ""
                    }`,
                )
                .join("\n")
            : "_No issues detected._");
        await postPullRequestComment(client, pr.repository.owner, pr.repository.name, pr.number, body);
        return { ok: true };
      } catch {
        return { skipped: true };
      }
    });

    return { reviewId: saved.id, issues: result.issues.length };
  },
);
