import crypto from "node:crypto";

export type BillingPlanKey = "FREE" | "PRO" | "TEAM";

export type PlanDefinition = {
  key: BillingPlanKey;
  name: string;
  priceInr: number;
  reviewsPerMonth: number;
  repositories: number;
  seats: number;
  highlights: string[];
  razorpayPlanId?: string;
};

export const PLANS: Record<BillingPlanKey, PlanDefinition> = {
  FREE: {
    key: "FREE",
    name: "Free",
    priceInr: 0,
    reviewsPerMonth: 25,
    repositories: 1,
    seats: 2,
    highlights: [
      "25 AI reviews / month",
      "1 connected repository",
      "Up to 2 workspace members",
    ],
  },
  PRO: {
    key: "PRO",
    name: "Pro",
    priceInr: 1499,
    reviewsPerMonth: 500,
    repositories: 10,
    seats: 5,
    razorpayPlanId: process.env.RAZORPAY_PLAN_PRO,
    highlights: [
      "500 AI reviews / month",
      "10 connected repositories",
      "Up to 5 workspace members",
      "Priority AI model",
    ],
  },
  TEAM: {
    key: "TEAM",
    name: "Team",
    priceInr: 4999,
    reviewsPerMonth: 2500,
    repositories: 50,
    seats: 25,
    razorpayPlanId: process.env.RAZORPAY_PLAN_TEAM,
    highlights: [
      "2,500 AI reviews / month",
      "50 connected repositories",
      "Up to 25 workspace members",
      "Custom model selection",
    ],
  },
};

export const planList = (): PlanDefinition[] => Object.values(PLANS);

export function getPlan(key: BillingPlanKey): PlanDefinition {
  return PLANS[key];
}

export function hasRazorpayConfig(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

/**
 * Verify a Razorpay webhook signature (HMAC-SHA256, hex-encoded).
 * In non-production environments without a secret, returns true so the
 * webhook is processable in local dev.
 */
export function verifyRazorpaySignature(
  payload: string,
  signature: string | null,
  secret = process.env.RAZORPAY_WEBHOOK_SECRET,
): boolean {
  if (!secret) return process.env.NODE_ENV !== "production";
  if (!signature) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload, "utf8")
    .digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

/**
 * Verify the payment success handoff signature used on the Razorpay Checkout
 * client callback (order_id + "|" + payment_id, signed with key secret).
 */
export function verifyRazorpayPaymentSignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
  secret?: string;
}): boolean {
  const secret = input.secret ?? process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${input.orderId}|${input.paymentId}`, "utf8")
    .digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(input.signature),
    );
  } catch {
    return false;
  }
}

export type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
  receipt?: string;
  status: string;
};

/**
 * Lightweight Razorpay REST client — keeps us off the heavyweight SDK
 * (which pulls in `request`, `nyc`, etc.) and lets us swap in dev fakes.
 */
export async function createRazorpayOrder(input: {
  amountInPaise: number;
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrder> {
  if (!hasRazorpayConfig()) {
    return {
      id: `order_dev_${Date.now()}`,
      amount: input.amountInPaise,
      currency: input.currency ?? "INR",
      receipt: input.receipt,
      status: "created",
    };
  }
  const auth = Buffer.from(
    `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`,
  ).toString("base64");
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: input.amountInPaise,
      currency: input.currency ?? "INR",
      receipt: input.receipt,
      notes: input.notes,
    }),
  });
  if (!res.ok) {
    throw new Error(`Razorpay order failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as RazorpayOrder;
}

