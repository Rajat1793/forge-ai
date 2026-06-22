import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { statusLabel, statusVariant } from "@/lib/feature-status";
import { requireWorkspace } from "@/lib/auth";
import { prisma } from "@forge-ai/db";

type Props = { params: Promise<{ workspace: string }> };

export default async function FeaturesPage({ params }: Props) {
  const { workspace: slug } = await params;
  const { workspace } = await requireWorkspace(slug);

  const features = await prisma.featureRequest.findMany({
    where: { workspaceId: workspace.id },
    include: { project: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Feature requests</h1>
          <p className="mt-1 text-sm text-slate-400">
            Every idea your team is shaping into a shippable feature.
          </p>
        </div>
        <Button asChild>
          <Link href={`/${slug}/features/new`}>
            <Plus className="size-4" /> New feature
          </Link>
        </Button>
      </div>

      {features.length === 0 ? (
        <Card className="border-white/10 bg-slate-900/50">
          <CardHeader>
            <CardTitle>No feature requests yet</CardTitle>
            <CardDescription className="text-slate-400">
              Capture one to kick off discovery, PRD, tasks, code, and review.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href={`/${slug}/features/new`}>Add the first request</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-lg border border-white/10">
          <table className="min-w-full divide-y divide-white/10 text-sm">
            <thead className="bg-slate-900/60 text-left text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3 text-right" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 bg-slate-950/60">
              {features.map((f) => (
                <tr key={f.id} className="hover:bg-white/5">
                  <td className="px-4 py-3 font-medium">{f.title}</td>
                  <td className="px-4 py-3 text-slate-400">{f.project.name}</td>
                  <td className="px-4 py-3 text-slate-400">{f.source}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant(f.status)}>{statusLabel[f.status]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {new Date(f.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/${slug}/features/${f.id}`}
                      className="inline-flex items-center gap-1 text-emerald-300 hover:underline"
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
