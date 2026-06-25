"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

type TaskStatus = "BACKLOG" | "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
type TaskType = "FE" | "BE" | "INFRA" | "QA";

type Card = {
  id: string;
  title: string;
  status: TaskStatus;
  type: TaskType;
  estimateHours: number | null;
  featureId: string;
  featureTitle: string;
};

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: "BACKLOG", label: "Backlog" },
  { id: "TODO", label: "To do" },
  { id: "IN_PROGRESS", label: "In progress" },
  { id: "IN_REVIEW", label: "In review" },
  { id: "DONE", label: "Done" },
];

const typeColor: Record<TaskType, string> = {
  FE: "info",
  BE: "success",
  INFRA: "warning",
  QA: "secondary",
};

export function TaskBoard({
  workspaceSlug,
  initial,
}: {
  workspaceSlug: string;
  initial: Card[];
}) {
  const router = useRouter();
  const [cards, setCards] = useState(initial);
  const [, startTransition] = useTransition();
  const [dragId, setDragId] = useState<string | null>(null);

  const update = trpc.task.updateStatus.useMutation({
    onSuccess() {
      startTransition(() => router.refresh());
    },
    onError(err) {
      toast.error(err.message);
      startTransition(() => router.refresh());
    },
  });

  const move = (taskId: string, status: TaskStatus) => {
    setCards((prev) =>
      prev.map((c) => (c.id === taskId ? { ...c, status } : c)),
    );
    update.mutate({ workspaceSlug, taskId, status });
  };

  if (cards.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-secondary p-10 text-center text-sm text-muted-foreground">
        No tasks yet. Approve a PRD and tasks will appear here.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-5">
      {COLUMNS.map((col) => {
        const colCards = cards.filter((c) => c.status === col.id);
        return (
          <div
            key={col.id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragId) move(dragId, col.id);
              setDragId(null);
            }}
            className="flex min-h-[300px] flex-col rounded-lg border border-border bg-secondary p-3"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {col.label}
              </h2>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">
                {colCards.length}
              </span>
            </div>
            <ul className="space-y-2">
              {colCards.map((c) => (
                <li
                  key={c.id}
                  draggable
                  onDragStart={() => setDragId(c.id)}
                  className={cn(
                    "cursor-grab rounded-md border border-border bg-card p-3 text-sm shadow-sm transition hover:border-brand/40",
                    dragId === c.id && "opacity-50",
                  )}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <Badge variant={typeColor[c.type] as never}>{c.type}</Badge>
                    {c.estimateHours != null ? (
                      <span className="text-[10px] text-muted-foreground">{c.estimateHours}h</span>
                    ) : null}
                  </div>
                  <p className="font-medium leading-snug text-foreground">{c.title}</p>
                  <Link
                    href={`/${workspaceSlug}/features/${c.featureId}`}
                    className="mt-2 line-clamp-1 block text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    {c.featureTitle}
                  </Link>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {COLUMNS.filter((x) => x.id !== c.status).map((x) => (
                      <button
                        key={x.id}
                        type="button"
                        onClick={() => move(c.id, x.id)}
                        className="rounded-sm border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground hover:border-brand/40 hover:text-brand"
                      >
                        → {x.label}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
