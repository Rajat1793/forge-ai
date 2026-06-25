import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RepoConnect } from "@/components/repos/repo-connect";
import { requireWorkspace } from "@/lib/auth";
import { prisma } from "@forge-ai/db";
import { hasGitHubAuth } from "@forge-ai/github";

type Props = { params: Promise<{ workspace: string }> };

export default async function ReposPage({ params }: Props) {
  const { workspace: slug } = await params;
  const { workspace } = await requireWorkspace(slug);

  const repos = await prisma.repository.findMany({
    where: { workspaceId: workspace.id },
    include: { _count: { select: { pullRequests: true } } },
    orderBy: { installedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Repositories</h1>
          <p className="text-sm text-muted-foreground">
            Link GitHub repositories so Forge AI can review pull requests automatically.
          </p>
        </div>
        <RepoConnect workspaceSlug={slug} disabled={!hasGitHubAuth()} />
      </header>

      {!hasGitHubAuth() ? (
        <Card className="border-amber-400/30 bg-amber-400/5">
          <CardHeader>
            <CardTitle className="text-base text-amber-200">GitHub not configured</CardTitle>
            <CardDescription className="text-amber-100/70">
              Set <code>GITHUB_OAUTH_TOKEN</code> (or install the GitHub App) to fetch your repos.
              You can still receive webhooks at <code>/api/webhooks/github</code>.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {repos.length === 0 ? (
        <Card className="border-dashed border-border bg-secondary">
          <CardHeader>
            <CardTitle className="text-base">No repositories connected</CardTitle>
            <CardDescription className="text-muted-foreground">
              Connect a repository to start receiving pull request events.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {repos.map((r) => (
            <Card key={r.id} className="border-border bg-secondary">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {r.owner}/{r.name}
                  </CardTitle>
                  <Badge variant="outline">{r.defaultBranch}</Badge>
                </div>
                <CardDescription className="text-muted-foreground">
                  Connected {new Date(r.installedAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{r._count.pullRequests} PRs tracked</span>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/${slug}/reviews`}>View reviews</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
