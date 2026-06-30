import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { EVENTS, inngest } from "@forge-ai/inngest";

import { router, workspaceProcedure } from "../trpc";

const statusEnum = z.enum(["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]);
const typeEnum = z.enum(["FE", "BE", "INFRA", "QA"]);

export const taskRouter = router({
  board: workspaceProcedure
    .input(z.object({ workspaceSlug: z.string(), projectId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const tasks = await ctx.prisma.task.findMany({
        where: {
          feature: {
            workspaceId: ctx.workspace.id,
            ...(input.projectId ? { projectId: input.projectId } : {}),
          },
        },
        include: {
          feature: { select: { id: true, title: true, projectId: true } },
        },
        orderBy: [{ status: "asc" }, { position: "asc" }],
      });
      return tasks;
    }),

  byFeature: workspaceProcedure
    .input(z.object({ workspaceSlug: z.string(), featureId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.task.findMany({
        where: { featureId: input.featureId, feature: { workspaceId: ctx.workspace.id } },
        orderBy: [{ status: "asc" }, { position: "asc" }],
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
        name: EVENTS.TASKS_GENERATE,
        data: { featureId: feature.id },
      });
      return { ok: true };
    }),

  updateStatus: workspaceProcedure
    .input(
      z.object({
        workspaceSlug: z.string(),
        taskId: z.string(),
        status: statusEnum,
        position: z.number().int().min(0).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.prisma.task.findFirst({
        where: { id: input.taskId, feature: { workspaceId: ctx.workspace.id } },
      });
      if (!task) throw new TRPCError({ code: "NOT_FOUND" });
      return ctx.prisma.task.update({
        where: { id: task.id },
        data: {
          status: input.status,
          ...(input.position != null ? { position: input.position } : {}),
        },
      });
    }),

  create: workspaceProcedure
    .input(
      z.object({
        workspaceSlug: z.string(),
        featureId: z.string(),
        title: z.string().min(3),
        description: z.string().min(3),
        type: typeEnum.default("BE"),
        estimateHours: z.number().min(0.5).max(40).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const feature = await ctx.prisma.featureRequest.findFirst({
        where: { id: input.featureId, workspaceId: ctx.workspace.id },
        include: { prds: { select: { id: true }, take: 1 } },
      });
      if (!feature) throw new TRPCError({ code: "NOT_FOUND" });
      const last = await ctx.prisma.task.findFirst({
        where: { featureId: feature.id, status: "BACKLOG" },
        orderBy: { position: "desc" },
      });
      return ctx.prisma.task.create({
        data: {
          featureId: feature.id,
          prdId: feature.prds[0]?.id ?? null,
          title: input.title,
          description: input.description,
          type: input.type,
          estimateHours: input.estimateHours,
          acceptanceCriteria: [],
          position: (last?.position ?? -1) + 1,
        },
      });
    }),

  update: workspaceProcedure
    .input(
      z.object({
        workspaceSlug: z.string(),
        taskId: z.string(),
        title: z.string().min(3).optional(),
        description: z.string().min(3).optional(),
        type: typeEnum.optional(),
        estimateHours: z.number().min(0.5).max(40).nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.prisma.task.findFirst({
        where: { id: input.taskId, feature: { workspaceId: ctx.workspace.id } },
      });
      if (!task) throw new TRPCError({ code: "NOT_FOUND" });
      return ctx.prisma.task.update({
        where: { id: task.id },
        data: {
          ...(input.title != null ? { title: input.title } : {}),
          ...(input.description != null ? { description: input.description } : {}),
          ...(input.type != null ? { type: input.type } : {}),
          ...(input.estimateHours !== undefined
            ? { estimateHours: input.estimateHours }
            : {}),
        },
      });
    }),

  delete: workspaceProcedure
    .input(z.object({ workspaceSlug: z.string(), taskId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.prisma.task.findFirst({
        where: { id: input.taskId, feature: { workspaceId: ctx.workspace.id } },
      });
      if (!task) throw new TRPCError({ code: "NOT_FOUND" });
      await ctx.prisma.task.delete({ where: { id: task.id } });
      return { ok: true };
    }),
});
