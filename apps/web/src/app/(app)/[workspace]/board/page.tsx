import { TaskBoard } from "@/components/board/task-board";
import { requireWorkspace } from "@/lib/auth";
import { prisma } from "@forge-ai/db";

type Props = { params: Promise<{ workspace: string }> };

export default async function BoardPage({ params }: Props) {
  const { workspace: slug } = await params;
  const { workspace } = await requireWorkspace(slug);

  const tasks = await prisma.task.findMany({
    where: { feature: { workspaceId: workspace.id } },
    include: { feature: { select: { id: true, title: true } } },
    orderBy: [{ status: "asc" }, { position: "asc" }],
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">Board</h1>
        <p className="text-sm text-muted-foreground">
          Tasks generated from approved PRDs. Drag-free for now — click a column tag to move.
        </p>
      </header>
      <TaskBoard
        workspaceSlug={slug}
        initial={tasks.map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          type: t.type,
          estimateHours: t.estimateHours,
          featureId: t.feature.id,
          featureTitle: t.feature.title,
        }))}
      />
    </div>
  );
}
