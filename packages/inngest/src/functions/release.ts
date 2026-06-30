import { logActivity, notifyWorkspace, prisma } from "@forge-ai/db";
import { generateReleaseNotes } from "@forge-ai/ai";
import {
  createGitHubClient,
  hasGitHubAuth,
  postPullRequestComment,
} from "@forge-ai/github";

import { EVENTS, inngest } from "../client";

export const releaseFeature = inngest.createFunction(
  { id: "feature-release", name: "Ship feature" },
  { event: EVENTS.RELEASE_SHIP },
  async ({ event, step }) => {
    const featureId = (event.data as { featureId: string }).featureId;

    const feature = await step.run("load", () =>
      prisma.featureRequest.findUnique({
        where: { id: featureId },
        include: {
          tasks: true,
          pullRequests: { include: { repository: true } },
          prds: {
            include: { versions: { orderBy: { version: "desc" }, take: 1 } },
            take: 1,
          },
        },
      }),
    );
    if (!feature) return { skipped: true };

    const allDone = feature.tasks.every((t) => t.status === "DONE");

    const result = await step.run("mark-shipped", () =>
      prisma.featureRequest.update({
        where: { id: feature.id },
        data: {
          status: allDone ? "SHIPPED" : "APPROVED",
          ...(allDone ? { shippedAt: new Date() } : {}),
        },
      }),
    );

    if (result.status === "SHIPPED") {
      const version = feature.prds[0]?.versions[0] ?? null;
      const notes = await step.run("release-notes", () =>
        generateReleaseNotes({
          title: feature.title,
          problemStatement: version?.problemStatement,
          goals: version?.goals,
          tasks: feature.tasks.map((t) => ({ title: t.title, type: t.type })),
        }),
      );
      await step.run("save-notes", () =>
        prisma.featureRequest.update({
          where: { id: feature.id },
          data: { releaseNotes: notes },
        }),
      );
      await step.run("notify-shipped", () =>
        notifyWorkspace(prisma, {
          workspaceId: feature.workspaceId,
          featureId: feature.id,
          type: "SHIPPED",
          title: `Shipped: ${feature.title}`,
          body: notes.slice(0, 500),
        }),
      );
      await step.run("log-shipped", () =>
        logActivity(prisma, {
          workspaceId: feature.workspaceId,
          featureId: feature.id,
          type: "SHIPPED",
          message: `Feature shipped 🚀`,
        }),
      );
    }

    await step.run("celebrate-on-prs", async () => {
      if (!hasGitHubAuth() || result.status !== "SHIPPED") return { skipped: true };
      const client = createGitHubClient();
      const merged = feature.pullRequests.filter((p) => p.state === "MERGED");
      await Promise.allSettled(
        merged.map((pr) =>
          postPullRequestComment(
            client,
            pr.repository.owner,
            pr.repository.name,
            pr.number,
            `🚀 Shipped as part of feature **${feature.title}**. Thanks for the contribution!`,
          ),
        ),
      );
      return { ok: true, prs: merged.length };
    });

    return { featureId, status: result.status };
  },
);
