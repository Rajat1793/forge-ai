import type { NotificationType, PrismaClient } from "@prisma/client";

export type NotifyInput = {
  workspaceId: string;
  featureId?: string | null;
  type: NotificationType;
  title: string;
  body: string;
};

/**
 * Send a transactional email via Resend. No-ops gracefully when
 * RESEND_API_KEY is not configured so the app works without email set up.
 */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; skipped?: boolean }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, skipped: true };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? "Forge AI <onboarding@resend.dev>",
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
      }),
    });
    return { ok: res.ok };
  } catch {
    return { ok: false };
  }
}

/**
 * Create an in-app notification for every member of a workspace and
 * (best-effort) email them. Safe to call from Inngest steps.
 */
export async function notifyWorkspace(
  prisma: PrismaClient,
  input: NotifyInput,
): Promise<{ notified: number }> {
  const members = await prisma.membership.findMany({
    where: { workspaceId: input.workspaceId },
    include: { user: { select: { id: true, email: true } } },
  });
  if (members.length === 0) return { notified: 0 };

  await prisma.notification.createMany({
    data: members.map((m) => ({
      workspaceId: input.workspaceId,
      userId: m.userId,
      featureId: input.featureId ?? null,
      type: input.type,
      title: input.title,
      body: input.body,
    })),
  });

  await Promise.allSettled(
    members.map((m) =>
      sendEmail({
        to: m.user.email,
        subject: input.title,
        html: `<p>${input.body}</p>`,
      }),
    ),
  );

  return { notified: members.length };
}
