import { z } from "zod";

import { router, workspaceProcedure } from "../trpc";

export const activityRouter = router({
  list: workspaceProcedure
    .input(
      z.object({
        workspaceSlug: z.string(),
        featureId: z.string().optional(),
        limit: z.number().min(1).max(100).default(30),
      }),
    )
    .query(({ ctx, input }) =>
      ctx.prisma.activityLog.findMany({
        where: {
          workspaceId: ctx.workspace.id,
          ...(input.featureId ? { featureId: input.featureId } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
        include: { feature: { select: { id: true, title: true } } },
      }),
    ),
});
