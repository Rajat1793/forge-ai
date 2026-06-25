"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

type Plan = {
  key: "FREE" | "PRO" | "TEAM";
  name: string;
  priceInr: number;
  reviewsPerMonth: number;
  repositories: number;
  seats: number;
  highlights: string[];
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export function BillingPlans({
  workspaceSlug,
  currentPlan,
  plans,
  razorpayConfigured,
}: {
  workspaceSlug: string;
  currentPlan: "FREE" | "PRO" | "TEAM";
  plans: Plan[];
  razorpayConfigured: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  const createOrder = trpc.billing.createOrder.useMutation();
  const confirm = trpc.billing.confirmPayment.useMutation({
    onSuccess() {
      toast.success("Plan upgraded — credits granted");
      router.refresh();
    },
    onError(err) {
      toast.error(err.message);
    },
  });
  const cancel = trpc.billing.cancel.useMutation({
    onSuccess() {
      toast.success("Subscription will cancel at the end of the current period");
      router.refresh();
    },
    onError(err) {
      toast.error(err.message);
    },
  });

  const checkout = async (plan: Plan) => {
    setPending(plan.key);
    try {
      const order = await createOrder.mutateAsync({ workspaceSlug, plan: plan.key });
      if (!razorpayConfigured || typeof window === "undefined" || !window.Razorpay) {
        // Dev fallback — just confirm locally with a synthetic signature.
        await confirm.mutateAsync({
          workspaceSlug,
          plan: plan.key,
          orderId: order.orderId,
          paymentId: `pay_dev_${Date.now()}`,
          signature: "dev",
        });
        setPending(null);
        return;
      }
      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "Forge AI",
        description: `${plan.name} plan`,
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          await confirm.mutateAsync({
            workspaceSlug,
            plan: plan.key,
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          });
          setPending(null);
        },
        modal: { ondismiss: () => setPending(null) },
        theme: { color: "#10b981" },
      });
      rzp.open();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Checkout failed");
      setPending(null);
    }
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((p) => {
          const active = p.key === currentPlan;
          return (
            <Card
              key={p.key}
              className={cn(
                "border-white/10 bg-slate-900/50",
                active && "border-emerald-300/40 bg-emerald-500/5",
              )}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{p.name}</CardTitle>
                  {active ? <Badge variant="success">Current</Badge> : null}
                </div>
                <CardDescription className="text-slate-300">
                  <span className="text-2xl font-semibold text-white">₹{p.priceInr}</span>
                  <span className="text-slate-400"> / month</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm text-slate-200">
                  {p.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-emerald-300" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
                {active ? (
                  p.key !== "FREE" ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={cancel.isPending}
                      onClick={() => cancel.mutate({ workspaceSlug })}
                    >
                      Cancel at period end
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full" disabled>
                      Current plan
                    </Button>
                  )
                ) : p.key === "FREE" ? (
                  <Button variant="outline" className="w-full" disabled>
                    Downgrade via support
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    disabled={pending === p.key}
                    onClick={() => checkout(p)}
                  >
                    {pending === p.key ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Processing…
                      </>
                    ) : (
                      `Upgrade to ${p.name}`
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
