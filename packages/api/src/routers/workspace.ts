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

  rename: workspaceProcedure
    .input(
      z.object({
        workspaceSlug: z.string(),
        name: z.string().min(2).max(60),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.role !== "OWNER" && ctx.role !== "ADMIN") {
        throw new Error("Only owners and admins can rename the workspace.");
      }
      return ctx.prisma.workspace.update({
        where: { id: ctx.workspace.id },
        data: { name: input.name },
      });
    }),

  invite: workspaceProcedure
    .input(
      z.object({
        workspaceSlug: z.string(),
        email: z.string().email(),
        role: z.enum(["ADMIN", "MEMBER", "REVIEWER"]).default("MEMBER"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.role !== "OWNER" && ctx.role !== "ADMIN") {
        throw new Error("Only owners and admins can invite members.");
      }
      const token = `inv_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      return ctx.prisma.invite.create({
        data: {
          workspaceId: ctx.workspace.id,
          invitedById: ctx.user.id,
          email: input.email,
          role: input.role,
          token,
          expiresAt,
        },
      });
    }),

  invites: workspaceProcedure
    .input(z.object({ workspaceSlug: z.string() }))
    .query(async ({ ctx }) => {
      return ctx.prisma.invite.findMany({
        where: { workspaceId: ctx.workspace.id, acceptedAt: null },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          role: true,
          expiresAt: true,
          createdAt: true,
        },
      });
    }),
});
