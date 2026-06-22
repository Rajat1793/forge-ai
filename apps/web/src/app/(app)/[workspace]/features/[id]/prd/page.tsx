import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PRDActions } from "@/components/prd/prd-actions";
import { statusLabel, statusVariant } from "@/lib/feature-status";
import { requireWorkspace } from "@/lib/auth";
import { prisma } from "@forge-ai/db";

type Props = { params: Promise<{ workspace: string; id: string }> };

type UserStory = { persona: string; iWant: string; soThat: string };
type AC = { given: string; when: string; then: string };

export default async function PrdPage({ params }: Props) {
  const { workspace: slug, id } = await params;
  const { workspace } = await requireWorkspace(slug);

  const feature = await prisma.featureRequest.findFirst({
    where: { id, workspaceId: workspace.id },
    include: {
      prds: {
        include: { versions: { orderBy: { version: "desc" }, take: 1 } },
        take: 1,
      },
    },
  });
  if (!feature) notFound();

  const prd = feature.prds[0] ?? null;
  const latest = prd?.versions[0] ?? null;
  const approved = Boolean(prd?.approvedAt);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex items-center justify-between">
        <div className="space-y-2">
          <Link
            href={`/${slug}/features/${feature.id}`}
            className="text-xs uppercase tracking-wider text-slate-400 hover:text-slate-200"
          >
            ← Back to feature
          </Link>
          <h1 className="text-3xl font-semibold">PRD · {feature.title}</h1>
          <div className="flex items-center gap-2">
            <Badge variant={statusVariant(feature.status)}>{statusLabel[feature.status]}</Badge>
            {latest ? (
              <Badge variant="secondary">v{latest.version}</Badge>
            ) : null}
            {approved ? <Badge variant="success">Approved</Badge> : null}
          </div>
        </div>
        <PRDActions
          workspaceSlug={slug}
          featureId={feature.id}
          hasPrd={Boolean(latest)}
          approved={approved}
        />
      </header>

      {!latest ? (
        <Card className="border-dashed border-white/10 bg-slate-900/30">
          <CardHeader>
            <CardTitle className="text-base">No PRD yet</CardTitle>
            <CardDescription className="text-slate-400">
              Generate the first draft once discovery is complete.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="border-white/10 bg-slate-900/50">
            <CardHeader>
              <CardTitle className="text-base">Problem statement</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-7 text-slate-200">
                {latest.problemStatement}
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-white/10 bg-slate-900/50">
              <CardHeader>
                <CardTitle className="text-base">Goals</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-slate-200">
                  {latest.goals.map((g, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-emerald-300">→</span>
                      <span>{g}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-slate-900/50">
              <CardHeader>
                <CardTitle className="text-base">Non-goals</CardTitle>
              </CardHeader>
              <CardContent>
                {latest.nonGoals.length === 0 ? (
                  <p className="text-sm text-slate-500">None.</p>
                ) : (
                  <ul className="space-y-2 text-sm text-slate-200">
                    {latest.nonGoals.map((g, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-rose-300">×</span>
                        <span>{g}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-white/10 bg-slate-900/50">
            <CardHeader>
              <CardTitle className="text-base">User stories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(latest.userStories as unknown as UserStory[]).map((s, i) => (
                <div
                  key={i}
                  className="rounded-md border border-white/5 bg-slate-950/40 p-3 text-sm leading-6 text-slate-200"
                >
                  <span className="font-medium text-emerald-200">As a {s.persona}</span>, I want{" "}
                  <span className="text-slate-100">{s.iWant}</span> so that{" "}
                  <span className="text-slate-300">{s.soThat}</span>.
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-slate-900/50">
            <CardHeader>
              <CardTitle className="text-base">Acceptance criteria</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(latest.acceptanceCriteria as unknown as AC[]).map((ac, i) => (
                <div key={i} className="rounded-md border border-white/5 bg-slate-950/40 p-3 text-sm leading-6">
                  <p className="text-slate-300">
                    <span className="text-amber-200">Given</span> {ac.given}
                  </p>
                  <p className="text-slate-300">
                    <span className="text-amber-200">When</span> {ac.when}
                  </p>
                  <p className="text-slate-300">
                    <span className="text-amber-200">Then</span> {ac.then}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-white/10 bg-slate-900/50">
              <CardHeader>
                <CardTitle className="text-base">Edge cases</CardTitle>
              </CardHeader>
              <CardContent>
                {latest.edgeCases.length === 0 ? (
                  <p className="text-sm text-slate-500">None captured.</p>
                ) : (
                  <ul className="list-disc space-y-1 pl-5 text-sm text-slate-200">
                    {latest.edgeCases.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-slate-900/50">
              <CardHeader>
                <CardTitle className="text-base">Success metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-1 pl-5 text-sm text-slate-200">
                  {latest.successMetrics.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
