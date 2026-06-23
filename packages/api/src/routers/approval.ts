import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { EVENTS, inngest } from "@forge-ai/inngest";
import {
  createGitHubClient,
  hasGitHubAuth,
  postPullRequestComment,
} from "@forge-ai/github";

import { router, workspaceProcedure } from "../trpc";

export const approvalRouter = router({
  /** Human approves the AI review for a PR. Sets the feature to READY_FOR_HUMAN → APPROVED. */
  approvePullRequest: workspaceProcedure
    .input(z.object({ workspaceSlug: z.string(), pullRequestId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const pr = await ctx.prisma.pullRequest.findFirst({
        where: { id: input.pullRequestId, workspaceId: ctx.workspace.id },
        include: { repository: true, feature: true },
      });
      if (!pr) throw new TRPCError({ code: "NOT_FOUND" });

      if (pr.feature) {
        await ctx.prisma.featureRequest.update({
          where: { id: pr.feature.id },
          data: { status: "APPROVED" },
        });
      }
      if (pr.taskId) {
        await ctx.prisma.task.update({
          where: { id: pr.taskId },
          data: { status: "DONE" },
        });
      }

      if (hasGitHubAuth()) {
        try {
          const client = createGitHubClient();
          await postPullRequestComment(
            client,
            pr.repository.owner,
            pr.repository.name,
            pr.number,
            `✅ Approved by **${ctx.user.name ?? ctx.user.email}** via Forge AI.`,
          );
        } catch {
          /* non-fatal */
        }
      }

      return { ok: true };
    }),

  /** Human requests changes on a PR. Marks feature FIX_NEEDED so engineering iterates. */
  requestChanges: workspaceProcedure
    .input(
      z.object({
        workspaceSlug: z.string(),
        pullRequestId: z.string(),
        note: z.string().min(3).max(2000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const pr = await ctx.prisma.pullRequest.findFirst({
        where: { id: input.pullRequestId, workspaceId: ctx.workspace.id },
        include: { repository: true, feature: true },
      });
      if (!pr) throw new TRPCError({ code: "NOT_FOUND" });

      if (pr.feature) {
        await ctx.prisma.featureRequest.update({
          where: { id: pr.feature.id },
          data: { status: "FIX_NEEDED" },
        });
      }

      if (hasGitHubAuth()) {
        try {
          const client = createGitHubClient();
          await postPullRequestComment(
            client,
            pr.repository.owner,
            pr.repository.name,
            pr.number,
            `🛠️ Changes requested by **${ctx.user.name ?? ctx.user.email}**:\n\n${input.note}`,
          );
        } catch {
          /* non-fatal */
        }
      }

      return { ok: true };
    }),

  /** Ship the feature: queues release Inngest function. */
  shipFeature: workspaceProcedure
    .input(z.object({ workspaceSlug: z.string(), featureId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const feature = await ctx.prisma.featureRequest.findFirst({
        where: { id: input.featureId, workspaceId: ctx.workspace.id },
      });
      if (!feature) throw new TRPCError({ code: "NOT_FOUND" });
      if (feature.status !== "APPROVED" && feature.status !== "IN_PROGRESS") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Feature must be APPROVED before shipping",
        });
      }
      await inngest.send({
        name: EVENTS.RELEASE_SHIP,
        data: { featureId: feature.id },
      });
      return { ok: true };
    }),

  /** Reject the feature outright (e.g. won't fix). */
  rejectFeature: workspaceProcedure
    .input(z.object({ workspaceSlug: z.string(), featureId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const feature = await ctx.prisma.featureRequest.findFirst({
        where: { id: input.featureId, workspaceId: ctx.workspace.id },
      });
      if (!feature) throw new TRPCError({ code: "NOT_FOUND" });
      await ctx.prisma.featureRequest.update({
        where: { id: feature.id },
        data: { status: "REJECTED" },
      });
      return { ok: true };
    }),
});
