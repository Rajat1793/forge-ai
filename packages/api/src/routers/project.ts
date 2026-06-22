import { z } from "zod";

import { router, workspaceProcedure } from "../trpc";

export const projectRouter = router({
  list: workspaceProcedure
    .input(z.object({ workspaceSlug: z.string() }))
    .query(({ ctx }) =>
      ctx.prisma.project.findMany({
        where: { workspaceId: ctx.workspace.id },
        orderBy: { createdAt: "asc" },
      }),
    ),

  create: workspaceProcedure
    .input(
      z.object({
        workspaceSlug: z.string(),
        name: z.string().min(2).max(80),
        description: z.string().max(500).optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.project.create({
        data: {
          workspaceId: ctx.workspace.id,
          name: input.name,
          description: input.description,
        },
      }),
    ),

  ensureDefault: workspaceProcedure
    .input(z.object({ workspaceSlug: z.string() }))
    .mutation(async ({ ctx }) => {
      const existing = await ctx.prisma.project.findFirst({
        where: { workspaceId: ctx.workspace.id },
        orderBy: { createdAt: "asc" },
      });
      if (existing) return existing;
      return ctx.prisma.project.create({
        data: {
          workspaceId: ctx.workspace.id,
          name: "Default",
          description: "Auto-created project",
        },
      });
    }),
});
