import type { ActivityType, PrismaClient } from "@prisma/client";

export type ActivityInput = {
  workspaceId: string;
  featureId?: string | null;
  actorId?: string | null;
  type: ActivityType;
  message: string;
};

/**
 * Append an entry to the workspace activity feed / audit log.
 * Best-effort: never throws, so it can be safely called inside mutations
 * and Inngest steps without risking the primary operation.
 */
export async function logActivity(
  prisma: PrismaClient,
  input: ActivityInput,
): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        workspaceId: input.workspaceId,
        featureId: input.featureId ?? null,
        actorId: input.actorId ?? null,
        type: input.type,
        message: input.message,
      },
    });
  } catch {
    /* non-fatal: activity logging must never break the main flow */
  }
}
