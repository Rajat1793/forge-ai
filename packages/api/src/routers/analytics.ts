import { z } from "zod";

import { router, workspaceProcedure } from "../trpc";

export const analyticsRouter = router({
  overview: workspaceProcedure
    .input(z.object({ workspaceSlug: z.string() }))
    .query(async ({ ctx }) => {
      const wsid = ctx.workspace.id;
      const since30 = new Date(Date.now() - 30 * 86_400_000);

      const [statusGroups, total, shipped, typeGroups, shippedFeatures, throughput30, blockingIssues] =
        await Promise.all([
          ctx.prisma.featureRequest.groupBy({
            by: ["status"],
            where: { workspaceId: wsid },
            _count: { _all: true },
          }),
          ctx.prisma.featureRequest.count({ where: { workspaceId: wsid } }),
          ctx.prisma.featureRequest.count({
            where: { workspaceId: wsid, status: "SHIPPED" },
          }),
          ctx.prisma.task.groupBy({
            by: ["type"],
            where: { feature: { workspaceId: wsid } },
            _count: { _all: true },
          }),
          ctx.prisma.featureRequest.findMany({
            where: { workspaceId: wsid, status: "SHIPPED", shippedAt: { not: null } },
            select: { createdAt: true, shippedAt: true },
          }),
          ctx.prisma.featureRequest.count({
            where: { workspaceId: wsid, status: "SHIPPED", shippedAt: { gte: since30 } },
          }),
          ctx.prisma.draftIssue.count({
            where: {
              severity: "BLOCKING",
              draft: { feature: { workspaceId: wsid } },
            },
          }),
        ]);

      const cycleHours = shippedFeatures
        .map((f) => (f.shippedAt!.getTime() - f.createdAt.getTime()) / 3_600_000)
        .filter((h) => h >= 0)
        .sort((a, b) => a - b);
      const avgCycleHours = cycleHours.length
        ? cycleHours.reduce((a, b) => a + b, 0) / cycleHours.length
        : null;
      const medianCycleHours = cycleHours.length
        ? cycleHours[Math.floor(cycleHours.length / 2)]
        : null;

      return {
        total,
        shipped,
        completionRate: total > 0 ? shipped / total : 0,
        statusCounts: Object.fromEntries(
          statusGroups.map((g) => [g.status, g._count._all]),
        ) as Record<string, number>,
        taskTypeCounts: Object.fromEntries(
          typeGroups.map((g) => [g.type, g._count._all]),
        ) as Record<string, number>,
        avgCycleHours,
        medianCycleHours,
        throughput30,
        blockingIssues,
      };
    }),
});
