import { notFound } from "next/navigation";
import Link from "next/link";
import { FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClarifyThread } from "@/components/features/clarify-thread";
import { FeatureShipActions } from "@/components/features/feature-ship-actions";
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
      prds: { select: { id: true, approvedAt: true }, take: 1 },
      tasks: { orderBy: [{ status: "asc" }, { position: "asc" }] },
    },
  });
  if (!feature) notFound();
  const hasPrd = feature.prds.length > 0;

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
          <div className="flex items-center gap-2">
            <FeatureShipActions
              workspaceSlug={slug}
              featureId={feature.id}
              status={feature.status}
            />
            <Button asChild size="sm" variant="outline">
              <Link href={`/${slug}/features/${feature.id}/prd`}>
                <FileText className="mr-2 size-4" />
                {hasPrd ? "View PRD" : "Open PRD"}
              </Link>
            </Button>
          </div>
        </div>
        <Badge variant={statusVariant(feature.status)}>{statusLabel[feature.status]}</Badge>
      </header>

      <Card className="border-border bg-secondary">
        <CardHeader>
          <CardTitle className="text-base">Original description</CardTitle>
          <CardDescription className="text-muted-foreground">
            Submitted {new Date(feature.createdAt).toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm leading-7 text-foreground">
            {feature.description}
          </p>
        </CardContent>
      </Card>

      <Card className="border-border bg-secondary">
        <CardHeader>
          <CardTitle className="text-base">Discovery conversation</CardTitle>
          <CardDescription className="text-muted-foreground">
            AI clarifying questions and your replies.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>

      {feature.tasks.length > 0 ? (
        <Card className="border-border bg-secondary">
          <CardHeader>
            <CardTitle className="text-base">Tasks ({feature.tasks.length})</CardTitle>
            <CardDescription className="text-muted-foreground">
              Engineering breakdown from the approved PRD.
            </CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      ) : null}
      </Card>
    </div>
  );
}
