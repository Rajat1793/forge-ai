import {
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  Clock,
  CreditCard,
  FileText,
  GitPullRequest,
  Lightbulb,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireWorkspace } from "@/lib/auth";
import { getPlan } from "@forge-ai/billing";
import { prisma } from "@forge-ai/db";

type Props = { params: Promise<{ workspace: string }> };

const STATUS_LABEL: Record<string, string> = {
  NEW: "New",
  CLARIFYING: "Clarifying",
  READY_FOR_PRD: "Ready for PRD",
  PRD_DRAFT: "PRD draft",
  PRD_APPROVED: "PRD approved",
  TASKS_PLANNED: "Tasks planned",
  PLAN_APPROVED: "Plan approved",
  IN_PROGRESS: "In progress",
  IN_REVIEW: "In review",
  FIX_NEEDED: "Fix needed",
  READY_FOR_HUMAN: "Awaiting approval",
  APPROVED: "Approved",
  SHIPPED: "Shipped",
  REJECTED: "Rejected",
  DUPLICATE: "Duplicate",
};

const STATUS_ORDER = [
  "NEW",
  "CLARIFYING",
  "READY_FOR_PRD",
  "PRD_DRAFT",
  "PRD_APPROVED",
  "TASKS_PLANNED",
  "PLAN_APPROVED",
  "IN_PROGRESS",
  "IN_REVIEW",
  "FIX_NEEDED",
  "READY_FOR_HUMAN",
  "APPROVED",
  "SHIPPED",
];

function formatRelative(date: Date | null | undefined) {
  if (!date) return "—";
  const diffMs = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default async function DashboardPage({ params }: Props) {
  const { workspace: slug } = await params;
  const { workspace } = await requireWorkspace(slug);

  const [
    featureCount,
    openFeatures,
    shippedFeatures,
    awaitingApproval,
    openPRs,
    reviewCount,
    taskOpen,
    statusGroups,
    recentFeatures,
    recentReviews,
    recentPRs,
    latestCredit,
    subscription,
    memberCount,
  ] = await Promise.all([
    prisma.featureRequest.count({ where: { workspaceId: workspace.id } }),
    prisma.featureRequest.count({
      where: {
        workspaceId: workspace.id,
        status: { notIn: ["SHIPPED", "REJECTED", "DUPLICATE"] },
      },
    }),
    prisma.featureRequest.count({
      where: { workspaceId: workspace.id, status: "SHIPPED" },
    }),
    prisma.featureRequest.count({
      where: { workspaceId: workspace.id, status: "READY_FOR_HUMAN" },
    }),
    prisma.pullRequest.count({ where: { workspaceId: workspace.id, state: "OPEN" } }),
    prisma.aIReview.count({ where: { workspaceId: workspace.id } }),
    prisma.task.count({
      where: { feature: { workspaceId: workspace.id }, status: { not: "DONE" } },
    }),
    prisma.featureRequest.groupBy({
      by: ["status"],
      where: { workspaceId: workspace.id },
      _count: { _all: true },
    }),
    prisma.featureRequest.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { id: true, title: true, status: true, updatedAt: true },
    }),
    prisma.aIReview.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: {
        pullRequest: { select: { id: true, title: true, number: true } },
      },
    }),
    prisma.pullRequest.findMany({
      where: { workspaceId: workspace.id, state: "OPEN" },
      orderBy: { updatedAt: "desc" },
      take: 4,
      select: { id: true, title: true, number: true, updatedAt: true },
    }),
    prisma.creditLedger.findFirst({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: "desc" },
      select: { balance: true },
    }),
    prisma.subscription.findUnique({
      where: { workspaceId: workspace.id },
      select: { plan: true, status: true, currentPeriodEnd: true },
    }),
    prisma.membership.count({ where: { workspaceId: workspace.id } }),
  ]);

  const plan = getPlan(subscription?.plan ?? "FREE");
  const creditBalance = latestCredit?.balance ?? 0;
  const creditUsedPct = Math.min(
    100,
    Math.round(((plan.reviewsPerMonth - creditBalance) / plan.reviewsPerMonth) * 100),
  );

  const statusMap = Object.fromEntries(
    statusGroups.map((g) => [g.status, g._count._all]),
  ) as Record<string, number>;

  const stats = [
    {
      label: "Total features",
      value: featureCount,
      href: `/${slug}/features`,
      icon: Lightbulb,
    },
    {
      label: "In flight",
      value: openFeatures,
      href: `/${slug}/features`,
      icon: CircleDashed,
    },
    {
      label: "Open PRs",
      value: openPRs,
      href: `/${slug}/repos`,
      icon: GitPullRequest,
    },
    {
      label: "Shipped",
      value: shippedFeatures,
      href: `/${slug}/features`,
      icon: ShieldCheck,
    },
  ];

  const hasAnyActivity = featureCount > 0 || reviewCount > 0 || openPRs > 0;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-brand/80">
            {workspace.name}
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Delivery control center</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Feature requests, PRDs, tasks, repos, AI reviews, and approvals — all in one workspace.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/${slug}/features/new`}
            className="inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition-all hover:brightness-110"
          >
            <Sparkles className="size-4" /> New feature request
          </Link>
          <Link
            href={`/${slug}/board`}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Open board
          </Link>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="border-border bg-secondary transition-colors hover:border-brand/40 hover:bg-accent/80">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-muted-foreground">{s.label}</CardDescription>
                  <s.icon className="size-4 text-muted-foreground" />
                </div>
                <CardTitle className="text-4xl font-semibold">{s.value}</CardTitle>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card className="border-border bg-secondary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4 text-brand" /> Pipeline by status
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Feature requests grouped by current workflow stage.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasAnyActivity ? (
              <div className="space-y-3">
                {STATUS_ORDER.map((status) => {
                  const count = statusMap[status] ?? 0;
                  const pct =
                    featureCount > 0 ? Math.round((count / featureCount) * 100) : 0;
                  return (
                    <div key={status} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{STATUS_LABEL[status] ?? status}</span>
                        <span className="text-muted-foreground">{count}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-brand"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                title="No feature requests yet"
                body="Create your first feature request to see the pipeline come alive."
                cta={{ href: `/${slug}/features/new`, label: "Create feature" }}
              />
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-secondary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="size-4 text-brand" /> Credits & plan
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {plan.name} plan · {plan.reviewsPerMonth} reviews / month
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-semibold">{creditBalance}</span>
                <span className="text-xs text-muted-foreground">credits left</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full bg-brand"
                  style={{ width: `${creditUsedPct}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{creditUsedPct}% used this period</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Members</p>
                <p className="mt-1 font-semibold">{memberCount}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Open tasks</p>
                <p className="mt-1 font-semibold">{taskOpen}</p>
              </div>
            </div>
            <Link
              href={`/${slug}/billing`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-border bg-secondary py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              Manage billing <ArrowRight className="size-4" />
            </Link>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border bg-secondary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="size-4 text-brand" /> Recent features
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentFeatures.length === 0 ? (
              <EmptyState
                title="No features yet"
                body="Capture an idea and let Forge AI run discovery."
                cta={{ href: `/${slug}/features/new`, label: "New request" }}
              />
            ) : (
              <ul className="space-y-3 text-sm">
                {recentFeatures.map((f) => (
                  <li key={f.id} className="flex items-start justify-between gap-3">
                    <Link
                      href={`/${slug}/features/${f.id}`}
                      className="line-clamp-1 text-foreground hover:text-foreground"
                    >
                      {f.title}
                    </Link>
                    <Badge variant="secondary" className="shrink-0 text-[10px]">
                      {STATUS_LABEL[f.status] ?? f.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-secondary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <GitPullRequest className="size-4 text-brand" /> Open PR queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentPRs.length === 0 ? (
              <EmptyState
                title="No open PRs"
                body="Connect a repo and Forge AI will start reading PRs."
                cta={{ href: `/${slug}/repos`, label: "Connect repo" }}
              />
            ) : (
              <ul className="space-y-3 text-sm">
                {recentPRs.map((pr) => (
                  <li key={pr.id} className="flex items-start justify-between gap-3">
                    <span className="line-clamp-1 text-foreground">
                      <span className="text-muted-foreground">#{pr.number}</span> {pr.title}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatRelative(pr.updatedAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-secondary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="size-4 text-brand" /> Latest AI reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentReviews.length === 0 ? (
              <EmptyState
                title="No reviews yet"
                body="AI reviews appear here when PRs are opened."
                cta={{ href: `/${slug}/reviews`, label: "View reviews" }}
              />
            ) : (
              <ul className="space-y-3 text-sm">
                {recentReviews.map((r) => (
                  <li key={r.id} className="flex items-start justify-between gap-3">
                    <Link
                      href={`/${slug}/reviews/${r.id}`}
                      className="line-clamp-1 text-foreground hover:text-foreground"
                    >
                      {r.pullRequest
                        ? `#${r.pullRequest.number} ${r.pullRequest.title}`
                        : "AI review"}
                    </Link>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      <Clock className="mr-1 inline size-3" />
                      {formatRelative(r.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      {awaitingApproval > 0 ? (
        <section>
          <Card className="border-brand/30 bg-brand/5">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <p className="text-sm font-medium text-brand">
                  {awaitingApproval} feature{awaitingApproval === 1 ? "" : "s"} awaiting your approval
                </p>
                <p className="mt-1 text-xs text-brand/80">
                  Review the AI sign-off and ship when ready.
                </p>
              </div>
              <Link
                href={`/${slug}/features`}
                className="inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition-all hover:brightness-110"
              >
                Review now <ArrowRight className="size-4" />
              </Link>
            </CardContent>
          </Card>
        </section>
      ) : null}
    </div>
  );
}

function EmptyState({
  title,
  body,
  cta,
}: {
  title: string;
  body: string;
  cta?: { href: string; label: string };
}) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-secondary p-5 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{body}</p>
      {cta ? (
        <Link
          href={cta.href}
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-brand hover:underline"
        >
          {cta.label} <ArrowRight className="size-3" />
        </Link>
      ) : null}
    </div>
  );
}
