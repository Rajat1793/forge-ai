import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FeatureQuickAdd } from "@/components/features/feature-quick-add";
import { statusLabel, statusVariant } from "@/lib/feature-status";
import { requireWorkspace } from "@/lib/auth";
import { prisma } from "@forge-ai/db";

type Props = { params: Promise<{ workspace: string }> };

export default async function FeaturesPage({ params }: Props) {
  const { workspace: slug } = await params;
  const { workspace } = await requireWorkspace(slug);

  const [features, projects] = await Promise.all([
    prisma.featureRequest.findMany({
      where: { workspaceId: workspace.id },
      include: { project: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.project.findMany({
      where: { workspaceId: workspace.id },
      select: { id: true, name: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Feature requests</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every idea your team is shaping into a shippable feature.
          </p>
        </div>
        <div className="shrink-0">
          <FeatureQuickAdd workspaceSlug={slug} projects={projects} />
        </div>
      </div>

      {features.length === 0 ? (
        <Card className="border-border bg-secondary">
          <CardHeader>
            <CardTitle>No feature requests yet</CardTitle>
            <CardDescription className="text-muted-foreground">
              Hit “New feature” above to kick off discovery, PRD, tasks, code, and review.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-secondary text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3 text-right" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {features.map((f) => (
                <tr key={f.id} className="hover:bg-accent">
                  <td className="px-4 py-3 font-medium">{f.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{f.project.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{f.source}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant(f.status)}>{statusLabel[f.status]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(f.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/${slug}/features/${f.id}`}
                      className="inline-flex items-center gap-1 text-brand hover:underline"
                    >
                      Open <ArrowRight className="size-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
