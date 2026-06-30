import Link from "next/link";
import { ArrowRight, MessagesSquare } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { NewFeatureChat } from "@/components/features/new-feature-chat";
import { statusLabel, statusVariant } from "@/lib/feature-status";
import { requireWorkspace } from "@/lib/auth";
import { prisma } from "@forge-ai/db";

type Props = { params: Promise<{ workspace: string }> };

function formatRelative(date: Date) {
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

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
    <div className="mx-auto max-w-3xl space-y-10">
      <div className="space-y-5 text-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">What do you want to build?</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Describe it in plain words — Forge AI runs discovery, drafts the PRD, plans tasks,
            writes the code, and ships it.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 text-left shadow-xl sm:p-6">
          <NewFeatureChat workspaceSlug={slug} projects={projects} />
        </div>
      </div>

      {features.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <MessagesSquare className="size-4" />
            Recent threads
          </div>
          <ul className="space-y-2">
            {features.map((f) => (
              <li key={f.id}>
                <Link
                  href={`/${slug}/features/${f.id}`}
                  className="group flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-brand/40"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{f.title}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {f.project.name} · {f.source.toLowerCase()} · {formatRelative(f.updatedAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Badge variant={statusVariant(f.status)}>{statusLabel[f.status]}</Badge>
                    <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
