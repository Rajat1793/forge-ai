import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClarifyThread } from "@/components/features/clarify-thread";
import { FeatureShipActions } from "@/components/features/feature-ship-actions";
import { FeatureTabs } from "@/components/features/feature-tabs";
import { PRDActions } from "@/components/prd/prd-actions";
import { PrdView } from "@/components/prd/prd-view";
import { statusLabel, statusVariant } from "@/lib/feature-status";
import { requireWorkspace } from "@/lib/auth";
import { prisma } from "@forge-ai/db";

type Props = { params: Promise<{ workspace: string; id: string }> };

export default async function FeaturePage({ params }: Props) {
  const { workspace: slug, id } = await params;
  const { workspace } = await requireWorkspace(slug);

  const feature = await prisma.featureRequest.findFirst({
    where: { id, workspaceId: workspace.id },
    include: {
      project: true,
      clarifyMessages: { orderBy: { createdAt: "asc" } },
      prds: {
        include: { versions: { orderBy: { version: "desc" }, take: 1 } },
        take: 1,
      },
      tasks: { orderBy: [{ status: "asc" }, { position: "asc" }] },
    },
  });
  if (!feature) notFound();

  const prd = feature.prds[0] ?? null;
  const latest = prd?.versions[0] ?? null;
  const approved = Boolean(prd?.approvedAt);

  const defaultTab =
    feature.tasks.length > 0 ? "tasks" : latest ? "prd" : "discovery";

  const discovery = (
    <ClarifyThread
      workspaceSlug={slug}
      featureId={feature.id}
      initial={feature.clarifyMessages.map((m) => ({
        id: m.id,
        author: m.author,
        body: m.body,
        createdAt: m.createdAt.toISOString(),
      }))}
      status={feature.status}
    />
  );

  const prdSection = (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {latest ? <Badge variant="secondary">v{latest.version}</Badge> : null}
          {approved ? <Badge variant="success">Approved</Badge> : null}
        </div>
        <PRDActions
          workspaceSlug={slug}
          featureId={feature.id}
          hasPrd={Boolean(latest)}
          approved={approved}
        />
      </div>

      {latest ? (
        <PrdView prd={latest} />
      ) : (
        <Card className="border-dashed border-border bg-secondary">
          <CardHeader>
            <CardTitle className="text-base">No PRD yet</CardTitle>
            <CardDescription className="text-muted-foreground">
              Generate the first draft once discovery is complete — it appears here.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );

  const tasksSection =
    feature.tasks.length > 0 ? (
      <ul className="space-y-2">
        {feature.tasks.map((t) => (
          <li
            key={t.id}
            className="flex items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2 text-sm"
          >
            <div className="flex items-center gap-2">
              <Badge variant="outline">{t.type}</Badge>
              <span className="text-foreground">{t.title}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {t.estimateHours != null ? <span>{t.estimateHours}h</span> : null}
              <Badge variant="secondary">{t.status.toLowerCase().replace("_", " ")}</Badge>
            </div>
          </li>
        ))}
      </ul>
    ) : (
      <Card className="border-dashed border-border bg-secondary">
        <CardHeader>
          <CardTitle className="text-base">No tasks yet</CardTitle>
          <CardDescription className="text-muted-foreground">
            Tasks are planned automatically once the PRD is approved.
          </CardDescription>
        </CardHeader>
      </Card>
    );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="space-y-3">
        <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
          <span>{feature.project.name}</span>
          <span>·</span>
          <span>{feature.source}</span>
        </div>
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-3xl font-semibold">{feature.title}</h1>
          <FeatureShipActions
            workspaceSlug={slug}
            featureId={feature.id}
            status={feature.status}
          />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant(feature.status)}>{statusLabel[feature.status]}</Badge>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
          {feature.description}
        </p>
      </header>

      <FeatureTabs
        defaultTab={defaultTab}
        taskCount={feature.tasks.length}
        discovery={discovery}
        prd={prdSection}
        tasks={tasksSection}
      />
    </div>
  );
}
