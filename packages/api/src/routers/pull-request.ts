import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { router, workspaceProcedure } from "../trpc";

const stateEnum = z.enum(["OPEN", "CLOSED", "MERGED"]);

export const pullRequestRouter = router({
  list: workspaceProcedure
    .input(
      z.object({
        workspaceSlug: z.string(),
        state: stateEnum.optional(),
        repositoryId: z.string().optional(),
      }),
    )
    .query(({ ctx, input }) =>
      ctx.prisma.pullRequest.findMany({
        where: {
          workspaceId: ctx.workspace.id,
          ...(input.state ? { state: input.state } : {}),
          ...(input.repositoryId ? { repositoryId: input.repositoryId } : {}),
        },
        include: {
          repository: true,
          feature: { select: { id: true, title: true } },
          task: { select: { id: true, title: true } },
          reviews: { orderBy: { createdAt: "desc" }, take: 1 },
        },
        orderBy: { openedAt: "desc" },
        take: 100,
      }),
    ),

  byId: workspaceProcedure
    .input(z.object({ workspaceSlug: z.string(), id: z.string() }))
    .query(async ({ ctx, input }) => {
      const pr = await ctx.prisma.pullRequest.findFirst({
        where: { id: input.id, workspaceId: ctx.workspace.id },
        include: {
          repository: true,
          files: true,
          reviews: { orderBy: { createdAt: "desc" } },
          feature: true,
          task: true,
        },
      });
      if (!pr) throw new TRPCError({ code: "NOT_FOUND" });
      return pr;
    }),
});
