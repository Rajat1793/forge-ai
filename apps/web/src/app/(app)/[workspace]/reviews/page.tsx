import Link from "next/link";
import { AlertTriangle, CheckCircle2, ExternalLink, GitPullRequest } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireWorkspace } from "@/lib/auth";
import { prisma } from "@forge-ai/db";

type Props = { params: Promise<{ workspace: string }> };

export default async function ReviewsPage({ params }: Props) {
  const { workspace: slug } = await params;
  const { workspace } = await requireWorkspace(slug);

  const reviews = await prisma.aIReview.findMany({
    where: { workspaceId: workspace.id },
    include: {
      issues: { select: { severity: true } },
      pullRequest: {
        include: {
          repository: { select: { owner: true, name: true } },
          feature: { select: { id: true, title: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">AI reviews</h1>
        <p className="text-sm text-muted-foreground">
          Every pull request gets an automated PRD-aware review before a human takes a look.
        </p>
      </header>

      {reviews.length === 0 ? (
        <Card className="border-dashed border-border bg-secondary">
          <CardHeader>
            <CardTitle className="text-base">No reviews yet</CardTitle>
            <CardDescription className="text-muted-foreground">
              Open a pull request against a connected repository to trigger the first review.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => {
            const blocking = r.issues.filter((i) => i.severity === "BLOCKING").length;
            const total = r.issues.length;
            const coverage = Math.round(r.prdCoverageScore * 100);
            return (
              <li key={r.id}>
                <Link
                  href={`/${slug}/reviews/${r.id}`}
                  className="block rounded-lg border border-border bg-secondary p-4 transition hover:border-brand/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                        <GitPullRequest className="size-3.5" />
                        <span>
                          {r.pullRequest.repository.owner}/{r.pullRequest.repository.name}#
                          {r.pullRequest.number}
                        </span>
                        <span>·</span>
                        <span>{new Date(r.createdAt).toLocaleString()}</span>
                      </div>
                      <h3 className="truncate text-base font-medium text-foreground">
                        {r.pullRequest.title}
                      </h3>
                      {r.pullRequest.feature ? (
                        <p className="text-xs text-muted-foreground">
                          ← {r.pullRequest.feature.title}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <Badge variant={blocking > 0 ? "danger" : total > 0 ? "warning" : "success"}>
                        {blocking > 0 ? (
                          <>
                            <AlertTriangle className="mr-1 size-3" />
                            {blocking} blocking
                          </>
                        ) : total > 0 ? (
                          `${total} suggestions`
                        ) : (
                          <>
                            <CheckCircle2 className="mr-1 size-3" />
                            Clean
                          </>
                        )}
                      </Badge>
                      <Badge variant="outline">{coverage}% PRD coverage</Badge>
                    </div>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{r.overallSummary}</p>
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    <a
                      href={r.pullRequest.htmlUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 hover:text-muted-foreground"
                    >
                      View PR on GitHub <ExternalLink className="size-3" />
                    </a>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
