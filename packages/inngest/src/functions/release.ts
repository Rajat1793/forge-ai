import { prisma } from "@forge-ai/db";
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
        },
      }),
    );
    if (!feature) return { skipped: true };

    const allDone = feature.tasks.every((t) => t.status === "DONE");

    const result = await step.run("mark-shipped", () =>
      prisma.featureRequest.update({
        where: { id: feature.id },
        data: { status: allDone ? "SHIPPED" : "APPROVED" },
      }),
    );

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
