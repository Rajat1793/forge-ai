import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NewFeatureChat } from "@/components/features/new-feature-chat";
import { requireWorkspace } from "@/lib/auth";
import { prisma } from "@forge-ai/db";

type Props = { params: Promise<{ workspace: string }> };

export default async function NewFeaturePage({ params }: Props) {
  const { workspace: slug } = await params;
  const { workspace } = await requireWorkspace(slug);

  const projects = await prisma.project.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Start a feature</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Just describe what you want. Forge AI runs discovery, drafts the PRD, plans tasks,
          writes the code, and ships it — guiding you step by step.
        </p>
      </header>
      <Card className="border-border bg-secondary">
        <CardHeader>
          <CardTitle>What do you want to build?</CardTitle>
          <CardDescription className="text-muted-foreground">
            One message is enough — no forms to fill out.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewFeatureChat
            workspaceSlug={slug}
            projects={projects.map((p) => ({ id: p.id, name: p.name }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
