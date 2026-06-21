import { z } from "zod";

import { protectedProcedure, router, workspaceProcedure } from "../trpc";

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export const workspaceRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const memberships = await ctx.prisma.membership.findMany({
      where: { userId: ctx.user.id },
      include: { workspace: true },
      orderBy: { createdAt: "asc" },
    });
    return memberships.map((m) => ({
      ...m.workspace,
      role: m.role,
    }));
  }),

  current: workspaceProcedure
    .input(z.object({ workspaceSlug: z.string() }))
    .query(({ ctx }) => ({
      ...ctx.workspace,
      role: ctx.role,
    })),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(2).max(60) }))
    .mutation(async ({ ctx, input }) => {
      const baseSlug = slugify(input.name) || `ws-${Date.now()}`;
      let slug = baseSlug;
      let i = 1;
      while (await ctx.prisma.workspace.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${i++}`;
      }
      const workspace = await ctx.prisma.workspace.create({
        data: {
          name: input.name,
          slug,
          memberships: {
            create: { userId: ctx.user.id, role: "OWNER" },
          },
        },
      });
      return workspace;
    }),

  members: workspaceProcedure
    .input(z.object({ workspaceSlug: z.string() }))
    .query(async ({ ctx }) => {
      return ctx.prisma.membership.findMany({
        where: { workspaceId: ctx.workspace.id },
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
        orderBy: { createdAt: "asc" },
      });
    }),
});
