import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NewFeatureForm } from "@/components/features/new-feature-form";
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
        <h1 className="text-2xl font-semibold">New feature request</h1>
        <p className="mt-1 text-sm text-slate-400">
          The AI will read it, decide if it needs clarifying questions, and post them back here.
        </p>
      </header>
      <Card className="border-white/10 bg-slate-900/50">
        <CardHeader>
          <CardTitle>Tell us what to build</CardTitle>
          <CardDescription className="text-slate-400">
            Short title, then a paragraph or two of context.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewFeatureForm
            workspaceSlug={slug}
            projects={projects.map((p) => ({ id: p.id, name: p.name }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
