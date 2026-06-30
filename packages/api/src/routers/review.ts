import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { EVENTS, inngest } from "@forge-ai/inngest";
import { suggestIssueFix } from "@forge-ai/ai";

import { router, workspaceProcedure } from "../trpc";

export const reviewRouter = router({
  list: workspaceProcedure
    .input(
      z.object({
        workspaceSlug: z.string(),
        onlyOpen: z.boolean().default(false),
      }),
    )
    .query(({ ctx, input }) =>
      ctx.prisma.aIReview.findMany({
        where: {
          workspaceId: ctx.workspace.id,
          ...(input.onlyOpen
            ? { pullRequest: { state: "OPEN" } }
            : {}),
        },
        include: {
          pullRequest: {
            include: {
              repository: { select: { owner: true, name: true } },
              feature: { select: { id: true, title: true } },
            },
          },
          issues: true,
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ),

  byId: workspaceProcedure
    .input(z.object({ workspaceSlug: z.string(), id: z.string() }))
    .query(async ({ ctx, input }) => {
      const review = await ctx.prisma.aIReview.findFirst({
        where: { id: input.id, workspaceId: ctx.workspace.id },
        include: {
          issues: true,
          pullRequest: {
            include: {
              repository: true,
              feature: true,
              files: true,
            },
          },
        },
      });
      if (!review) throw new TRPCError({ code: "NOT_FOUND" });
      return review;
    }),

  rerun: workspaceProcedure
    .input(z.object({ workspaceSlug: z.string(), pullRequestId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const pr = await ctx.prisma.pullRequest.findFirst({
        where: { id: input.pullRequestId, workspaceId: ctx.workspace.id },
      });
      if (!pr) throw new TRPCError({ code: "NOT_FOUND" });
      await inngest.send({
        name: EVENTS.PR_REVIEW,
        data: { pullRequestId: pr.id },
      });
      return { ok: true };
    }),

  suggestFix: workspaceProcedure
    .input(z.object({ workspaceSlug: z.string(), draftIssueId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const issue = await ctx.prisma.draftIssue.findFirst({
        where: {
          id: input.draftIssueId,
          draft: { feature: { workspaceId: ctx.workspace.id } },
        },
        include: {
          draft: {
            include: {
              feature: {
                include: {
                  prds: {
                    include: {
                      versions: { orderBy: { version: "desc" }, take: 1 },
                    },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      });
      if (!issue) throw new TRPCError({ code: "NOT_FOUND" });
      const version = issue.draft.feature.prds[0]?.versions[0] ?? null;
      const suggestion = await suggestIssueFix({
        issueTitle: issue.title,
        issueDescription: issue.description,
        file: issue.file,
        diff: issue.draft.diff,
        prdContext: version
          ? `Problem: ${version.problemStatement}\nGoals: ${version.goals.join(", ")}`
          : undefined,
      });
      await ctx.prisma.draftIssue.update({
        where: { id: issue.id },
        data: { suggestion },
      });
      return { suggestion };
    }),
});
