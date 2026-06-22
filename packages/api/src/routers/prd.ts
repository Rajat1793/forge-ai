import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { EVENTS, inngest } from "@forge-ai/inngest";
import { prdSchema } from "@forge-ai/ai";

import { router, workspaceProcedure } from "../trpc";

export const prdRouter = router({
  byFeature: workspaceProcedure
    .input(z.object({ workspaceSlug: z.string(), featureId: z.string() }))
    .query(async ({ ctx, input }) => {
      const feature = await ctx.prisma.featureRequest.findFirst({
        where: { id: input.featureId, workspaceId: ctx.workspace.id },
        select: { id: true },
      });
      if (!feature) throw new TRPCError({ code: "NOT_FOUND" });
      return ctx.prisma.pRD.findFirst({
        where: { featureId: feature.id },
        include: { versions: { orderBy: { version: "desc" } } },
      });
    }),

  generate: workspaceProcedure
    .input(z.object({ workspaceSlug: z.string(), featureId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const feature = await ctx.prisma.featureRequest.findFirst({
        where: { id: input.featureId, workspaceId: ctx.workspace.id },
      });
      if (!feature) throw new TRPCError({ code: "NOT_FOUND" });
      await inngest.send({
        name: EVENTS.PRD_GENERATE,
        data: { featureId: feature.id },
      });
      return { ok: true };
    }),

  saveVersion: workspaceProcedure
    .input(
      z.object({
        workspaceSlug: z.string(),
        featureId: z.string(),
        payload: prdSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const feature = await ctx.prisma.featureRequest.findFirst({
        where: { id: input.featureId, workspaceId: ctx.workspace.id },
      });
      if (!feature) throw new TRPCError({ code: "NOT_FOUND" });
      const prd = await ctx.prisma.pRD.upsert({
        where: { id: feature.id + ":prd" },
        update: {},
        create: { id: feature.id + ":prd", featureId: feature.id },
      });
      const lastVersion = await ctx.prisma.pRDVersion.findFirst({
        where: { prdId: prd.id },
        orderBy: { version: "desc" },
      });
      const next = (lastVersion?.version ?? 0) + 1;
      return ctx.prisma.pRDVersion.create({
        data: {
          prdId: prd.id,
          version: next,
          problemStatement: input.payload.problemStatement,
          goals: input.payload.goals,
          nonGoals: input.payload.nonGoals,
          userStories: input.payload.userStories,
          acceptanceCriteria: input.payload.acceptanceCriteria,
          edgeCases: input.payload.edgeCases,
          successMetrics: input.payload.successMetrics,
          authorId: ctx.user.id,
        },
      });
    }),

  approve: workspaceProcedure
    .input(z.object({ workspaceSlug: z.string(), featureId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const feature = await ctx.prisma.featureRequest.findFirst({
        where: { id: input.featureId, workspaceId: ctx.workspace.id },
        include: { prds: true },
      });
      if (!feature) throw new TRPCError({ code: "NOT_FOUND" });
      const prd = feature.prds[0];
      if (!prd) throw new TRPCError({ code: "BAD_REQUEST", message: "No PRD to approve" });
      await ctx.prisma.pRD.update({
        where: { id: prd.id },
        data: { approvedAt: new Date(), approvedBy: ctx.user.id },
      });
      await ctx.prisma.featureRequest.update({
        where: { id: feature.id },
        data: { status: "PRD_APPROVED" },
      });
      return { ok: true };
    }),
});
