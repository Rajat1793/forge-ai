import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  PLANS,
  createRazorpayOrder,
  getPlan,
  hasRazorpayConfig,
  planList,
  verifyRazorpayPaymentSignature,
  type BillingPlanKey,
} from "@forge-ai/billing";

import { router, workspaceProcedure } from "../trpc";

const planEnum = z.enum(["FREE", "PRO", "TEAM"]);

async function currentBalance(prisma: {
  creditLedger: {
    findFirst: (args: {
      where: { workspaceId: string };
      orderBy: { createdAt: "desc" };
    }) => Promise<{ balance: number } | null>;
  };
}, workspaceId: string): Promise<number> {
  const last = await prisma.creditLedger.findFirst({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
  });
  return last?.balance ?? 0;
}

export const billingRouter = router({
  plans: workspaceProcedure
    .input(z.object({ workspaceSlug: z.string() }))
    .query(() => planList()),

  current: workspaceProcedure
    .input(z.object({ workspaceSlug: z.string() }))
    .query(async ({ ctx }) => {
      const sub = await ctx.prisma.subscription.findUnique({
        where: { workspaceId: ctx.workspace.id },
      });
      const balance = await currentBalance(ctx.prisma, ctx.workspace.id);
      const plan = getPlan((sub?.plan as BillingPlanKey) ?? "FREE");
      return {
        subscription: sub,
        plan,
        balance,
        razorpayConfigured: hasRazorpayConfig(),
      };
    }),

  ledger: workspaceProcedure
    .input(
      z.object({
        workspaceSlug: z.string(),
        limit: z.number().int().min(1).max(200).default(50),
      }),
    )
    .query(({ ctx, input }) =>
      ctx.prisma.creditLedger.findMany({
        where: { workspaceId: ctx.workspace.id },
        orderBy: { createdAt: "desc" },
        take: input.limit,
      }),
    ),

  /** Create a Razorpay order for a plan upgrade. Falls back to a dev order in local. */
  createOrder: workspaceProcedure
    .input(z.object({ workspaceSlug: z.string(), plan: planEnum }))
    .mutation(async ({ ctx, input }) => {
      if (input.plan === "FREE") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Free plan needs no order" });
      }
      const plan = PLANS[input.plan];
      // Razorpay caps the receipt at 40 chars, so keep it short and bounded.
      const receipt = `${ctx.workspace.slug.slice(0, 18)}-${input.plan.toLowerCase()}-${Date.now().toString(36)}`.slice(
        0,
        40,
      );
      const order = await createRazorpayOrder({
        amountInPaise: plan.priceInr * 100,
        currency: "INR",
        receipt,
        notes: { workspaceId: ctx.workspace.id, plan: input.plan },
      });
      return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        plan: input.plan,
        keyId: process.env.RAZORPAY_KEY_ID ?? null,
        razorpayConfigured: hasRazorpayConfig(),
      };
    }),

  /**
   * Confirm a successful payment from the Razorpay Checkout client callback.
   * Verifies the signature and activates the subscription locally.
   */
  confirmPayment: workspaceProcedure
    .input(
      z.object({
        workspaceSlug: z.string(),
        plan: planEnum,
        orderId: z.string(),
        paymentId: z.string(),
        signature: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (hasRazorpayConfig()) {
        const ok = verifyRazorpayPaymentSignature({
          orderId: input.orderId,
          paymentId: input.paymentId,
          signature: input.signature,
        });
        if (!ok) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid payment signature" });
        }
      }
      const plan = PLANS[input.plan];
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setDate(periodEnd.getDate() + 30);

      const sub = await ctx.prisma.subscription.upsert({
        where: { workspaceId: ctx.workspace.id },
        update: {
          plan: input.plan,
          status: "ACTIVE",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
        },
        create: {
          workspaceId: ctx.workspace.id,
          plan: input.plan,
          status: "ACTIVE",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      });

      const balance = await currentBalance(ctx.prisma, ctx.workspace.id);
      const grant = plan.reviewsPerMonth;
      await ctx.prisma.creditLedger.create({
        data: {
          workspaceId: ctx.workspace.id,
          event: "GRANT_MONTHLY",
          delta: grant,
          balance: balance + grant,
          reason: `Plan upgrade to ${plan.name}`,
        },
      });

      return { ok: true, plan: sub.plan };
    }),

  cancel: workspaceProcedure
    .input(z.object({ workspaceSlug: z.string() }))
    .mutation(async ({ ctx }) => {
      const sub = await ctx.prisma.subscription.findUnique({
        where: { workspaceId: ctx.workspace.id },
      });
      if (!sub) throw new TRPCError({ code: "NOT_FOUND" });
      return ctx.prisma.subscription.update({
        where: { workspaceId: ctx.workspace.id },
        data: { cancelAtPeriodEnd: true },
      });
    }),
});
