import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { EVENTS, inngest } from "@forge-ai/inngest";

import { router, workspaceProcedure } from "../trpc";

const sourceEnum = z.enum(["EMAIL", "TICKET", "CALL", "MANUAL"]);

export const featureRouter = router({
  list: workspaceProcedure
    .input(z.object({ workspaceSlug: z.string() }))
    .query(({ ctx }) =>
      ctx.prisma.featureRequest.findMany({
        where: { workspaceId: ctx.workspace.id },
        include: { project: true },
        orderBy: { updatedAt: "desc" },
      }),
    ),

  byId: workspaceProcedure
    .input(z.object({ workspaceSlug: z.string(), id: z.string() }))
    .query(async ({ ctx, input }) => {
      const feature = await ctx.prisma.featureRequest.findFirst({
        where: { id: input.id, workspaceId: ctx.workspace.id },
        include: {
          project: true,
          clarifyMessages: { orderBy: { createdAt: "asc" } },
          prds: { include: { versions: { orderBy: { version: "desc" } } } },
          tasks: { orderBy: { position: "asc" } },
          pullRequests: { include: { repository: true }, orderBy: { openedAt: "desc" } },
          codeDrafts: {
            orderBy: { createdAt: "desc" },
            include: { issues: { orderBy: { createdAt: "asc" } } },
          },
        },
      });
      if (!feature) throw new TRPCError({ code: "NOT_FOUND" });
      return feature;
    }),

  create: workspaceProcedure
    .input(
      z.object({
        workspaceSlug: z.string(),
        projectId: z.string().optional(),
        title: z.string().min(4).max(140),
        description: z.string().min(10).max(4000),
        source: sourceEnum.default("MANUAL"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      let projectId = input.projectId;
      if (!projectId) {
        const project = await ctx.prisma.project.findFirst({
          where: { workspaceId: ctx.workspace.id },
          orderBy: { createdAt: "asc" },
        });
        projectId =
          project?.id ??
          (
            await ctx.prisma.project.create({
              data: {
                workspaceId: ctx.workspace.id,
                name: "Default",
                description: "Auto-created project",
              },
            })
          ).id;
      }
      const feature = await ctx.prisma.featureRequest.create({
        data: {
          workspaceId: ctx.workspace.id,
          projectId,
          title: input.title,
          description: input.description,
          source: input.source,
          status: "NEW",
        },
      });
      await inngest.send({
        name: EVENTS.FEATURE_CLARIFY,
        data: { featureId: feature.id },
      });
      return feature;
    }),

  reply: workspaceProcedure
    .input(
      z.object({
        workspaceSlug: z.string(),
        featureId: z.string(),
        body: z.string().min(1).max(4000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const feature = await ctx.prisma.featureRequest.findFirst({
        where: { id: input.featureId, workspaceId: ctx.workspace.id },
      });
      if (!feature) throw new TRPCError({ code: "NOT_FOUND" });
      await ctx.prisma.clarifyMessage.create({
        data: { featureId: input.featureId, author: "USER", body: input.body },
      });
      await inngest.send({
        name: EVENTS.FEATURE_CLARIFY,
        data: { featureId: input.featureId },
      });
      return { ok: true };
    }),

  markReadyForPrd: workspaceProcedure
    .input(z.object({ workspaceSlug: z.string(), featureId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.featureRequest.updateMany({
        where: { id: input.featureId, workspaceId: ctx.workspace.id },
        data: { status: "READY_FOR_PRD" },
      });
      return { ok: true };
    }),

  generateCode: workspaceProcedure
    .input(z.object({ workspaceSlug: z.string(), featureId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const feature = await ctx.prisma.featureRequest.findFirst({
        where: { id: input.featureId, workspaceId: ctx.workspace.id },
        include: { tasks: { select: { id: true } } },
      });
      if (!feature) throw new TRPCError({ code: "NOT_FOUND" });
      if (feature.tasks.length === 0)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Generate tasks before generating code.",
        });
      await ctx.prisma.featureRequest.update({
        where: { id: feature.id },
        data: { status: "IN_REVIEW" },
      });
      await inngest.send({
        name: EVENTS.CODE_GENERATE,
        data: { featureId: feature.id },
      });
      return { ok: true };
    }),

  approveCode: workspaceProcedure
    .input(z.object({ workspaceSlug: z.string(), featureId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const role = ctx.role;
      if (role !== "OWNER" && role !== "ADMIN" && role !== "REVIEWER")
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only owners, admins, or reviewers can approve.",
        });
      const feature = await ctx.prisma.featureRequest.findFirst({
        where: { id: input.featureId, workspaceId: ctx.workspace.id },
      });
      if (!feature) throw new TRPCError({ code: "NOT_FOUND" });
      await ctx.prisma.task.updateMany({
        where: { featureId: feature.id },
        data: { status: "DONE" },
      });
      await ctx.prisma.featureRequest.update({
        where: { id: feature.id },
        data: { status: "APPROVED" },
      });
      return { ok: true };
    }),

  ship: workspaceProcedure
    .input(z.object({ workspaceSlug: z.string(), featureId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const feature = await ctx.prisma.featureRequest.findFirst({
        where: { id: input.featureId, workspaceId: ctx.workspace.id },
      });
      if (!feature) throw new TRPCError({ code: "NOT_FOUND" });
      await inngest.send({
        name: EVENTS.RELEASE_SHIP,
        data: { featureId: feature.id },
      });
      return { ok: true };
    }),
});
