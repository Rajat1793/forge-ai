import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { router, workspaceProcedure } from "../trpc";

export const notificationRouter = router({
  list: workspaceProcedure
    .input(z.object({ workspaceSlug: z.string(), limit: z.number().min(1).max(50).default(20) }))
    .query(({ ctx, input }) =>
      ctx.prisma.notification.findMany({
        where: { userId: ctx.user.id, workspaceId: ctx.workspace.id },
        orderBy: { createdAt: "desc" },
        take: input.limit,
      }),
    ),

  unreadCount: workspaceProcedure
    .input(z.object({ workspaceSlug: z.string() }))
    .query(({ ctx }) =>
      ctx.prisma.notification.count({
        where: { userId: ctx.user.id, workspaceId: ctx.workspace.id, readAt: null },
      }),
    ),

  markAllRead: workspaceProcedure
    .input(z.object({ workspaceSlug: z.string() }))
    .mutation(async ({ ctx }) => {
      await ctx.prisma.notification.updateMany({
        where: { userId: ctx.user.id, workspaceId: ctx.workspace.id, readAt: null },
        data: { readAt: new Date() },
      });
      return { ok: true };
    }),

  markRead: workspaceProcedure
    .input(z.object({ workspaceSlug: z.string(), id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const notif = await ctx.prisma.notification.findFirst({
        where: { id: input.id, userId: ctx.user.id },
      });
      if (!notif) throw new TRPCError({ code: "NOT_FOUND" });
      await ctx.prisma.notification.update({
        where: { id: notif.id },
        data: { readAt: new Date() },
      });
      return { ok: true };
    }),
});
