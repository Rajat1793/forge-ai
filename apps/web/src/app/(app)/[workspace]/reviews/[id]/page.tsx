import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, ShieldAlert, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RerunReviewButton } from "@/components/reviews/rerun-review-button";
import { requireWorkspace } from "@/lib/auth";
import { prisma } from "@forge-ai/db";

type Props = { params: Promise<{ workspace: string; id: string }> };

const severityVariant = (s: "BLOCKING" | "NON_BLOCKING") =>
  s === "BLOCKING" ? ("danger" as const) : ("warning" as const);
const categoryVariant = (c: string) => ({
  PRD: "info" as const,
  SECURITY: "danger" as const,
  PERFORMANCE: "warning" as const,
  EDGE_CASE: "secondary" as const,
  QUALITY: "outline" as const,
})[c as "PRD" | "SECURITY" | "PERFORMANCE" | "EDGE_CASE" | "QUALITY"] ?? ("outline" as const);

export default async function ReviewPage({ params }: Props) {
  const { workspace: slug, id } = await params;
  const { workspace } = await requireWorkspace(slug);

  const review = await prisma.aIReview.findFirst({
    where: { id, workspaceId: workspace.id },
    include: {
      issues: { orderBy: [{ severity: "asc" }, { createdAt: "asc" }] },
      pullRequest: {
        include: {
          repository: true,
          feature: { select: { id: true, title: true } },
          files: { orderBy: { filename: "asc" } },
        },
      },
    },
  });
  if (!review) notFound();

  const blocking = review.issues.filter((i) => i.severity === "BLOCKING");
  const coverage = Math.round(review.prdCoverageScore * 100);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-3">
        <Link
          href={`/${slug}/reviews`}
          className="text-xs uppercase tracking-wider text-slate-400 hover:text-slate-200"
        >
          ← All reviews
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">{review.pullRequest.title}</h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span>
                {review.pullRequest.repository.owner}/{review.pullRequest.repository.name}#
                {review.pullRequest.number}
              </span>
              <span>·</span>
              <span>{review.pullRequest.headSha.slice(0, 8)}</span>
              <span>·</span>
              <span>by @{review.pullRequest.authorLogin}</span>
              <a
                href={review.pullRequest.htmlUrl}
                target="_blank"
                rel="noreferrer"
                className="ml-1 flex items-center gap-1 text-slate-300 hover:text-emerald-300"
              >
                Open on GitHub <ExternalLink className="size-3" />
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={blocking.length ? "danger" : "success"}>
                {blocking.length ? (
                  <>
                    <ShieldAlert className="mr-1 size-3" />
                    {blocking.length} blocking
                  </>
                ) : (
                  <>
                    <ShieldCheck className="mr-1 size-3" />
                    Ready for human review
                  </>
                )}
              </Badge>
              <Badge variant="outline">{coverage}% PRD coverage</Badge>
              <Badge variant="secondary">{review.modelName}</Badge>
              <span className="text-xs text-slate-500">
                {(review.durationMs / 1000).toFixed(1)}s
              </span>
            </div>
          </div>
          <RerunReviewButton workspaceSlug={slug} pullRequestId={review.pullRequest.id} />
        </div>
      </header>

      <Card className="border-white/10 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-base">Summary</CardTitle>
          <CardDescription className="text-slate-400">
            {new Date(review.createdAt).toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm leading-7 text-slate-200">
            {review.overallSummary}
          </p>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-base">Issues ({review.issues.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {review.issues.length === 0 ? (
            <p className="text-sm text-slate-400">No issues raised. 🎉</p>
          ) : (
            <ul className="space-y-3">
              {review.issues.map((i) => (
                <li
                  key={i.id}
                  className="rounded-md border border-white/5 bg-slate-950/40 p-4"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge variant={severityVariant(i.severity)}>{i.severity}</Badge>
                    <Badge variant={categoryVariant(i.category)}>{i.category}</Badge>
                    {i.file ? (
                      <code className="rounded bg-white/5 px-1.5 py-0.5 text-[11px] text-slate-300">
                        {i.file}
                        {i.line ? `:${i.line}` : ""}
                      </code>
                    ) : null}
                  </div>
                  <p className="text-sm font-medium text-slate-100">{i.title}</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-300">
                    {i.description}
                  </p>
                  {i.suggestion ? (
                    <pre className="mt-2 overflow-x-auto rounded bg-black/40 p-2 text-xs text-emerald-200">
                      {i.suggestion}
                    </pre>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {review.pullRequest.files.length > 0 ? (
        <Card className="border-white/10 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="text-base">
              Files changed ({review.pullRequest.files.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {review.pullRequest.files.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center justify-between rounded px-2 py-1 text-slate-300 hover:bg-white/5"
                >
                  <code className="truncate text-xs">{f.filename}</code>
                  <span className="text-[11px] text-slate-500">
                    <span className="text-emerald-300">+{f.additions}</span>{" "}
                    <span className="text-rose-300">-{f.deletions}</span>
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
