import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireWorkspace } from "@/lib/auth";
import { prisma } from "@forge-ai/db";

type Props = { params: Promise<{ workspace: string }> };

export default async function DashboardPage({ params }: Props) {
  const { workspace: slug } = await params;
  const { workspace } = await requireWorkspace(slug);

  const [featureCount, openFeatures, prCount, reviewCount] = await Promise.all([
    prisma.featureRequest.count({ where: { workspaceId: workspace.id } }),
    prisma.featureRequest.count({
      where: {
        workspaceId: workspace.id,
        status: { notIn: ["SHIPPED", "REJECTED", "DUPLICATE"] },
      },
    }),
    prisma.pullRequest.count({ where: { workspaceId: workspace.id, state: "OPEN" } }),
    prisma.aIReview.count({ where: { workspaceId: workspace.id } }),
  ]);

  const stats = [
    { label: "Total features", value: featureCount, href: `/${slug}/features` },
    { label: "Open features", value: openFeatures, href: `/${slug}/features` },
    { label: "Open PRs", value: prCount, href: `/${slug}/repos` },
    { label: "AI reviews", value: reviewCount, href: `/${slug}/reviews` },
  ];

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-300/80">
          {workspace.name}
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Delivery control center</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Feature requests, PRDs, tasks, repos, AI reviews, and approvals — all in one workspace.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="border-white/10 bg-slate-900/50 transition-colors hover:bg-slate-900/80">
              <CardHeader>
                <CardDescription className="text-slate-400">{s.label}</CardDescription>
                <CardTitle className="text-4xl font-semibold">{s.value}</CardTitle>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="border-white/10 bg-slate-900/50">
          <CardHeader>
            <CardTitle>Next step</CardTitle>
            <CardDescription className="text-slate-400">
              Submit a feature request to start the AI workflow.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href={`/${slug}/features/new`}
              className="inline-flex items-center gap-2 text-sm font-medium text-emerald-300 hover:underline"
            >
              New feature request <ArrowRight className="size-4" />
            </Link>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-slate-900/50">
          <CardHeader>
            <CardTitle>Connect a repo</CardTitle>
            <CardDescription className="text-slate-400">
              Link GitHub so Forge AI can read PRs and post reviews.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href={`/${slug}/repos`}
              className="inline-flex items-center gap-2 text-sm font-medium text-emerald-300 hover:underline"
            >
              Manage repositories <ArrowRight className="size-4" />
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
