import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BillingPlans } from "@/components/billing/billing-plans";
import { CreditHistory } from "@/components/billing/credit-history";
import { requireWorkspace } from "@/lib/auth";
import { prisma } from "@forge-ai/db";
import { PLANS, hasRazorpayConfig, planList, type BillingPlanKey } from "@forge-ai/billing";

type Props = { params: Promise<{ workspace: string }> };

export default async function BillingPage({ params }: Props) {
  const { workspace: slug } = await params;
  const { workspace } = await requireWorkspace(slug);

  const [sub, lastLedger, ledger] = await Promise.all([
    prisma.subscription.findUnique({ where: { workspaceId: workspace.id } }),
    prisma.creditLedger.findFirst({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.creditLedger.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
  ]);

  const planKey = ((sub?.plan as BillingPlanKey) ?? "FREE") as BillingPlanKey;
  const plan = PLANS[planKey];
  const balance = lastLedger?.balance ?? 0;
  const usageRatio = plan.reviewsPerMonth > 0 ? Math.max(0, Math.min(1, balance / plan.reviewsPerMonth)) : 0;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">Billing</h1>
        <p className="text-sm text-muted-foreground">
          Manage your plan, AI review credits, and Razorpay subscription.
        </p>
      </header>

      <Card className="border-border bg-secondary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Current plan</CardTitle>
              <CardDescription className="text-muted-foreground">
                {sub?.currentPeriodEnd
                  ? `Renews ${new Date(sub.currentPeriodEnd).toLocaleDateString()}`
                  : "No active subscription"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={planKey === "FREE" ? "secondary" : "success"}>{plan.name}</Badge>
              {sub?.cancelAtPeriodEnd ? <Badge variant="warning">Cancels at period end</Badge> : null}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">AI review credits</span>
              <span className="font-mono text-foreground">
                {balance} / {plan.reviewsPerMonth}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-brand/70"
                style={{ width: `${Math.round(usageRatio * 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Each AI review on a pull request consumes 1 credit. Credits refresh on every
              successful billing cycle.
            </p>
          </div>
        </CardContent>
      </Card>

      <BillingPlans
        workspaceSlug={slug}
        currentPlan={planKey}
        plans={planList()}
        razorpayConfigured={hasRazorpayConfig()}
      />

      <Card className="border-border bg-secondary">
        <CardHeader>
          <CardTitle className="text-base">Credit history</CardTitle>
          <CardDescription className="text-muted-foreground">
            Recent grants, purchases, and AI review usage.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreditHistory
            entries={ledger.map((e) => ({
              id: e.id,
              event: e.event,
              delta: e.delta,
              balance: e.balance,
              reason: e.reason,
              createdAt: e.createdAt.toISOString(),
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
