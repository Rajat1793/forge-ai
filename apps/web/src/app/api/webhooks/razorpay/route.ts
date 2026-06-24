import { NextResponse } from "next/server";

import { prisma } from "@forge-ai/db";
import {
  PLANS,
  verifyRazorpaySignature,
  type BillingPlanKey,
} from "@forge-ai/billing";

type RazorpayWebhookBody = {
  event: string;
  payload: {
    subscription?: {
      entity: {
        id: string;
        customer_id?: string;
        status: string;
        current_start: number;
        current_end: number;
        notes?: Record<string, string>;
      };
    };
    payment?: {
      entity: {
        id: string;
        order_id: string;
        status: string;
        amount: number;
        notes?: Record<string, string>;
      };
    };
  };
};

async function grantPlanCredits(workspaceId: string, plan: BillingPlanKey, reason: string) {
  const last = await prisma.creditLedger.findFirst({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
  });
  const grant = PLANS[plan].reviewsPerMonth;
  await prisma.creditLedger.create({
    data: {
      workspaceId,
      event: "GRANT_MONTHLY",
      delta: grant,
      balance: (last?.balance ?? 0) + grant,
      reason,
    },
  });
}

export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!verifyRazorpaySignature(raw, signature)) {
    return NextResponse.json({ ok: false, error: "bad signature" }, { status: 401 });
  }

  let body: RazorpayWebhookBody;
  try {
    body = JSON.parse(raw) as RazorpayWebhookBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  switch (body.event) {
    case "subscription.activated":
    case "subscription.charged": {
      const sub = body.payload.subscription?.entity;
      if (!sub) return NextResponse.json({ ok: true, ignored: "no-sub" });
      const workspaceId = sub.notes?.workspaceId;
      const planKey = (sub.notes?.plan as BillingPlanKey | undefined) ?? "PRO";
      if (!workspaceId) return NextResponse.json({ ok: true, ignored: "no-workspace" });

      await prisma.subscription.upsert({
        where: { workspaceId },
        update: {
          plan: planKey,
          status: "ACTIVE",
          razorpaySubscriptionId: sub.id,
          razorpayCustomerId: sub.customer_id ?? null,
          currentPeriodStart: new Date(sub.current_start * 1000),
          currentPeriodEnd: new Date(sub.current_end * 1000),
        },
        create: {
          workspaceId,
          plan: planKey,
          status: "ACTIVE",
          razorpaySubscriptionId: sub.id,
          razorpayCustomerId: sub.customer_id ?? null,
          currentPeriodStart: new Date(sub.current_start * 1000),
          currentPeriodEnd: new Date(sub.current_end * 1000),
        },
      });

      if (body.event === "subscription.charged") {
        await grantPlanCredits(workspaceId, planKey, "Monthly plan credit grant");
      }
      return NextResponse.json({ ok: true });
    }

    case "subscription.cancelled":
    case "subscription.halted": {
      const sub = body.payload.subscription?.entity;
      if (!sub) return NextResponse.json({ ok: true });
      await prisma.subscription.updateMany({
        where: { razorpaySubscriptionId: sub.id },
        data: { status: "CANCELLED" },
      });
      return NextResponse.json({ ok: true });
    }

    case "payment.captured": {
      const payment = body.payload.payment?.entity;
      if (!payment) return NextResponse.json({ ok: true });
      const workspaceId = payment.notes?.workspaceId;
      const planKey = payment.notes?.plan as BillingPlanKey | undefined;
      if (workspaceId && planKey) {
        await grantPlanCredits(workspaceId, planKey, `Payment captured (${payment.id})`);
      }
      return NextResponse.json({ ok: true });
    }

    default:
      return NextResponse.json({ ok: true, ignored: body.event });
  }
}

