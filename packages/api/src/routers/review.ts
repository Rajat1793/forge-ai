import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { EVENTS, inngest } from "@forge-ai/inngest";

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
});
