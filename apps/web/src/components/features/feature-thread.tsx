"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ChevronDown,
  FileCode,
  Loader2,
  Pencil,
  Plus,
  Rocket,
  Sparkles,
  StopCircle,
  Trash2,
  User,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@forge-ai/api";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PrdView } from "@/components/prd/prd-view";
import { statusLabel, statusVariant } from "@/lib/feature-status";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type Feature = RouterOutputs["feature"]["byId"];
type Task = Feature["tasks"][number];
type CodeDraft = Feature["codeDrafts"][number];
type DraftIssue = CodeDraft["issues"][number];
type PrdVersion = Feature["prds"][number]["versions"][number];

const TERMINAL = new Set(["SHIPPED", "REJECTED", "DUPLICATE"]);
const AI_WORKING = new Set(["NEW", "CLARIFYING", "PRD_APPROVED", "IN_REVIEW"]);

// Plain-language "what happens next" hints so the flow guides itself.
const GUIDANCE: Record<string, string> = {
  NEW: "Forge AI is reading your request…",
  CLARIFYING: "Answer below to help Forge AI — or skip ahead with “Mark ready for PRD”.",
  READY_FOR_PRD: "Discovery’s done. Generate the PRD to keep going.",
  PRD_DRAFT: "Review the PRD above. Approve it to plan tasks, or reply with changes.",
  PRD_APPROVED: "Planning the tasks…",
  TASKS_PLANNED: "Review the tasks, tweak if needed, then generate code.",
  PLAN_APPROVED: "Review the tasks, tweak if needed, then generate code.",
  IN_PROGRESS: "Generate code when the tasks look right.",
  IN_REVIEW: "Forge AI is generating and reviewing the code — progress shows above. This can take a moment; stop it any time.",
  FIX_NEEDED: "Address the issues above, then regenerate the code.",
  READY_FOR_HUMAN: "Looks ready. Approve to lock it in.",
  APPROVED: "All set — ship it to deploy and generate release notes.",
};

function fmt(date: Date | string) {
  return new Date(date).toLocaleString();
}

// -----------------------------------------------------------------------------
// Root
// -----------------------------------------------------------------------------

export function FeatureThread({
  workspaceSlug,
  featureId,
}: {
  workspaceSlug: string;
  featureId: string;
}) {
  const utils = trpc.useUtils();
  const query = trpc.feature.byId.useQuery(
    { workspaceSlug, id: featureId },
    {
      refetchInterval: (q) => {
        const s = q.state.data?.status;
        if (!s || TERMINAL.has(s)) return false;
        return 4000;
      },
    },
  );

  const bottomRef = useRef<HTMLDivElement>(null);
  const feature = query.data;
  const msgCount = feature?.clarifyMessages.length ?? 0;
  const draftCount = feature?.codeDrafts.length ?? 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgCount, draftCount, feature?.status]);

  const invalidate = () => utils.feature.byId.invalidate({ workspaceSlug, id: featureId });

  if (query.isLoading) {
    return (
      <div className="grid place-items-center py-24 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }
  if (!feature) {
    return <p className="py-24 text-center text-muted-foreground">Feature not found.</p>;
  }

  const prd = feature.prds[0] ?? null;
  const versions = prd?.versions ?? [];
  const latestVersion = versions[0] ?? null;
  const prdApproved = Boolean(prd?.approvedAt);
  const aiWorking = AI_WORKING.has(feature.status);

  return (
    <div className="mx-auto flex h-[calc(100vh-7rem)] max-w-3xl flex-col">
      <FeatureHeader feature={feature} />

      <div className="flex-1 space-y-4 overflow-y-auto px-1 py-4">
        {/* Original request */}
        <ThreadBubble author="USER" timestamp={feature.createdAt} name="Request">
          <p className="text-sm font-medium text-foreground">{feature.title}</p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
            {feature.description}
          </p>
        </ThreadBubble>

        {/* Discovery */}
        {feature.clarifyMessages.map((m) => (
          <ThreadBubble
            key={m.id}
            author={m.author}
            timestamp={m.createdAt}
            name={m.author === "AI" ? "Forge AI" : "You"}
          >
            <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">{m.body}</p>
          </ThreadBubble>
        ))}

        {/* PRD */}
        {latestVersion ? (
          <ThreadCard
            icon={<Sparkles className="size-4" />}
            title={`PRD · v${latestVersion.version}`}
            badge={
              prdApproved ? (
                <Badge variant="success">Approved</Badge>
              ) : (
                <Badge variant="info">Draft</Badge>
              )
            }
          >
            <PrdDiff versions={versions} />
            <PrdView prd={latestVersion} />
          </ThreadCard>
        ) : null}

        {/* Tasks */}
        {feature.tasks.length > 0 ? (
          <ThreadCard
            icon={<FileCode className="size-4" />}
            title={`Tasks · ${feature.tasks.length}`}
          >
            <TaskList
              workspaceSlug={workspaceSlug}
              featureId={featureId}
              tasks={feature.tasks}
              editable={!TERMINAL.has(feature.status) && feature.status !== "APPROVED"}
              onChange={invalidate}
            />
          </ThreadCard>
        ) : null}

        {/* Code drafts */}
        {feature.codeDrafts.map((draft) => (
          <ThreadCard
            key={draft.id}
            icon={<Wand2 className="size-4" />}
            title="Code draft"
            badge={
              draft.coverageScore != null ? (
                <Badge variant="outline">
                  {Math.round(draft.coverageScore * 100)}% PRD coverage
                </Badge>
              ) : undefined
            }
          >
            <CodeDraftCard
              workspaceSlug={workspaceSlug}
              draft={draft}
              onChange={invalidate}
            />
          </ThreadCard>
        ))}

        {/* Release notes */}
        {feature.releaseNotes ? (
          <ThreadCard
            icon={<Rocket className="size-4" />}
            title="Release notes"
            badge={<Badge variant="success">Shipped</Badge>}
          >
            <pre className="whitespace-pre-wrap font-sans text-sm leading-6 text-foreground">
              {feature.releaseNotes}
            </pre>
          </ThreadCard>
        ) : null}

        {aiWorking ? (
          <div className="flex items-center gap-2 px-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Forge AI is working…
          </div>
        ) : null}

        <div ref={bottomRef} />
      </div>

      <Composer
        workspaceSlug={workspaceSlug}
        featureId={featureId}
        feature={feature}
        hasPrd={Boolean(latestVersion)}
        prdApproved={prdApproved}
        onChange={invalidate}
      />
    </div>
  );
}

// -----------------------------------------------------------------------------
// Header
// -----------------------------------------------------------------------------

function FeatureHeader({ feature }: { feature: Feature }) {
  return (
    <header className="border-b border-border pb-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <span>{feature.project.name}</span>
        <span>·</span>
        <span>{feature.source}</span>
      </div>
      <div className="mt-1 flex items-center justify-between gap-3">
        <h1 className="truncate text-2xl font-semibold">{feature.title}</h1>
        <Badge variant={statusVariant(feature.status)}>{statusLabel[feature.status]}</Badge>
      </div>
    </header>
  );
}

// -----------------------------------------------------------------------------
// Timeline primitives
// -----------------------------------------------------------------------------

function ThreadBubble({
  author,
  name,
  timestamp,
  children,
}: {
  author: "AI" | "USER";
  name: string;
  timestamp: Date | string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-full",
          author === "AI" ? "bg-brand/20 text-brand" : "bg-secondary text-foreground",
        )}
      >
        {author === "AI" ? <Bot className="size-4" /> : <User className="size-4" />}
      </div>
      <div className="flex-1 rounded-lg border border-border bg-card p-3">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
          {name} · {fmt(timestamp)}
        </p>
        <div className="mt-1">{children}</div>
      </div>
    </div>
  );
}

function ThreadCard({
  icon,
  title,
  badge,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-brand/20 bg-card">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <span className="text-brand">{icon}</span>
          {title}
        </div>
        {badge}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// PRD diff
// -----------------------------------------------------------------------------

function PrdDiff({ versions }: { versions: PrdVersion[] }) {
  const [open, setOpen] = useState(false);
  if (versions.length < 2) return null;
  const next = versions[0];
  const prev = versions[1];
  const added = next.goals.filter((g) => !prev.goals.includes(g));
  const removed = prev.goals.filter((g) => !next.goals.includes(g));

  return (
    <div className="mb-4 rounded-md border border-border bg-secondary">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2 text-xs text-muted-foreground"
      >
        <span>Changes since v{prev.version}</span>
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <div className="space-y-1 px-3 pb-3 text-sm">
          {added.length === 0 && removed.length === 0 ? (
            <p className="text-muted-foreground">No goal changes.</p>
          ) : (
            <>
              {added.map((g, i) => (
                <p key={`a${i}`} className="text-brand">
                  + {g}
                </p>
              ))}
              {removed.map((g, i) => (
                <p key={`r${i}`} className="text-red-300 line-through">
                  − {g}
                </p>
              ))}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Tasks
// -----------------------------------------------------------------------------

const TASK_TYPES = ["FE", "BE", "INFRA", "QA"] as const;

function TaskList({
  workspaceSlug,
  featureId,
  tasks,
  editable,
  onChange,
}: {
  workspaceSlug: string;
  featureId: string;
  tasks: Task[];
  editable: boolean;
  onChange: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<(typeof TASK_TYPES)[number]>("BE");

  const create = trpc.task.create.useMutation({
    onSuccess() {
      setTitle("");
      setDescription("");
      setAdding(false);
      onChange();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-2">
      <ul className="space-y-2">
        {tasks.map((t) => (
          <TaskRow
            key={t.id}
            workspaceSlug={workspaceSlug}
            task={t}
            editable={editable}
            onChange={onChange}
          />
        ))}
      </ul>

      {editable ? (
        adding ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (title.trim().length < 3 || description.trim().length < 3) return;
              create.mutate({ workspaceSlug, featureId, title, description, type });
            }}
            className="space-y-2 rounded-md border border-border bg-secondary p-3"
          >
            <Input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              className="bg-card"
            />
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              rows={2}
              className="bg-card"
            />
            <div className="flex items-center gap-2">
              <select
                value={type}
                onChange={(e) => setType(e.target.value as (typeof TASK_TYPES)[number])}
                className="h-9 rounded-md border border-border bg-card px-2 text-sm"
              >
                {TASK_TYPES.map((tt) => (
                  <option key={tt} value={tt}>
                    {tt}
                  </option>
                ))}
              </select>
              <Button type="submit" size="sm" disabled={create.isPending}>
                Add task
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setAdding(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setAdding(true)}>
            <Plus className="size-4" /> Add task
          </Button>
        )
      ) : null}
    </div>
  );
}

function TaskRow({
  workspaceSlug,
  task,
  editable,
  onChange,
}: {
  workspaceSlug: string;
  task: Task;
  editable: boolean;
  onChange: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);

  const update = trpc.task.update.useMutation({
    onSuccess() {
      setEditing(false);
      onChange();
    },
    onError: (e) => toast.error(e.message),
  });
  const remove = trpc.task.delete.useMutation({
    onSuccess: onChange,
    onError: (e) => toast.error(e.message),
  });

  if (editing) {
    return (
      <li className="space-y-2 rounded-md border border-border bg-secondary p-3">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-card" />
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="bg-card"
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            disabled={update.isPending}
            onClick={() =>
              update.mutate({ workspaceSlug, taskId: task.id, title, description })
            }
          >
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
      </li>
    );
  }

  return (
    <li className="flex items-start justify-between gap-3 rounded-md border border-border bg-secondary px-3 py-2">
      <div className="flex items-start gap-2">
        <Badge variant="outline">{task.type}</Badge>
        <div>
          <p className="text-sm text-foreground">{task.title}</p>
          <p className="text-xs text-muted-foreground">{task.description}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Badge variant="secondary">{task.status.toLowerCase().replace("_", " ")}</Badge>
        {editable ? (
          <>
            <button
              onClick={() => setEditing(true)}
              className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent"
              aria-label="Edit task"
            >
              <Pencil className="size-3.5" />
            </button>
            <button
              onClick={() => remove.mutate({ workspaceSlug, taskId: task.id })}
              className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent"
              aria-label="Delete task"
            >
              <Trash2 className="size-3.5" />
            </button>
          </>
        ) : null}
      </div>
    </li>
  );
}

// -----------------------------------------------------------------------------
// Code draft
// -----------------------------------------------------------------------------

function CodeDraftCard({
  workspaceSlug,
  draft,
  onChange,
}: {
  workspaceSlug: string;
  draft: CodeDraft;
  onChange: () => void;
}) {
  const [showDiff, setShowDiff] = useState(false);
  return (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-foreground">{draft.summary}</p>

      {draft.reviewSummary ? (
        <div className="rounded-md border border-border bg-secondary p-3">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            AI review
          </p>
          <p className="mt-1 text-sm leading-6 text-foreground">{draft.reviewSummary}</p>
        </div>
      ) : null}

      {draft.issues.length > 0 ? (
        <div className="space-y-2">
          {draft.issues.map((issue) => (
            <IssueRow
              key={issue.id}
              workspaceSlug={workspaceSlug}
              issue={issue}
              onChange={onChange}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No issues found.</p>
      )}

      <div>
        <button
          onClick={() => setShowDiff((v) => !v)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ChevronDown className={cn("size-4 transition-transform", showDiff && "rotate-180")} />
          {draft.filesChanged} file{draft.filesChanged === 1 ? "" : "s"} changed
        </button>
        {showDiff ? <DiffView diff={draft.diff} /> : null}
      </div>
    </div>
  );
}

function IssueRow({
  workspaceSlug,
  issue,
  onChange,
}: {
  workspaceSlug: string;
  issue: DraftIssue;
  onChange: () => void;
}) {
  const suggest = trpc.review.suggestFix.useMutation({
    onSuccess() {
      onChange();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="rounded-md border border-border bg-secondary p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant={issue.severity === "BLOCKING" ? "danger" : "warning"}>
            {issue.severity === "BLOCKING" ? (
              <AlertTriangle className="mr-1 size-3" />
            ) : null}
            {issue.severity.toLowerCase().replace("_", " ")}
          </Badge>
          <Badge variant="outline">{issue.category}</Badge>
        </div>
        <Button
          size="sm"
          variant="ghost"
          disabled={suggest.isPending}
          onClick={() => suggest.mutate({ workspaceSlug, draftIssueId: issue.id })}
        >
          {suggest.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Wand2 className="size-4" />
          )}
          {issue.suggestion ? "Regenerate fix" : "Suggest fix"}
        </Button>
      </div>
      <p className="mt-2 text-sm font-medium text-foreground">{issue.title}</p>
      <p className="mt-0.5 text-sm leading-6 text-muted-foreground">{issue.description}</p>
      {issue.file ? (
        <p className="mt-1 text-xs text-muted-foreground">File: {issue.file}</p>
      ) : null}
      {issue.suggestion ? (
        <div className="mt-2 rounded-md border border-brand/20 bg-card p-2">
          <p className="text-xs uppercase tracking-wider text-brand">Suggested fix</p>
          <pre className="mt-1 whitespace-pre-wrap font-sans text-sm leading-6 text-foreground">
            {issue.suggestion}
          </pre>
        </div>
      ) : null}
    </div>
  );
}

function DiffView({ diff }: { diff: string }) {
  return (
    <pre className="mt-2 max-h-96 overflow-auto rounded-md border border-border bg-[#0b0b0f] p-3 text-xs leading-5">
      {diff.split("\n").map((line, i) => {
        const color = line.startsWith("+")
          ? "text-brand"
          : line.startsWith("-")
            ? "text-red-300"
            : line.startsWith("@@")
              ? "text-sky-300"
              : "text-muted-foreground";
        return (
          <div key={i} className={color}>
            {line || " "}
          </div>
        );
      })}
    </pre>
  );
}

// -----------------------------------------------------------------------------
// Composer + contextual action
// -----------------------------------------------------------------------------

function Composer({
  workspaceSlug,
  featureId,
  feature,
  hasPrd,
  prdApproved,
  onChange,
}: {
  workspaceSlug: string;
  featureId: string;
  feature: Feature;
  hasPrd: boolean;
  prdApproved: boolean;
  onChange: () => void;
}) {
  const [body, setBody] = useState("");
  // Optimistic "working" lock: the action mutations only enqueue a background
  // job and resolve instantly, so we keep the clicked button (and its siblings)
  // in a working/disabled state until the server advances the feature's status.
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const status = feature.status;

  // Once the status transitions, the relevant action set changes — release the
  // lock so the new buttons are clickable again.
  useEffect(() => {
    setPendingAction(null);
  }, [status]);

  const fail = (e: { message: string }) => {
    setPendingAction(null);
    toast.error(e.message);
  };

  const reply = trpc.feature.reply.useMutation({
    onSuccess() {
      setBody("");
      onChange();
    },
    onError: (e) => toast.error(e.message),
  });

  const markReady = trpc.feature.markReadyForPrd.useMutation({ onSuccess: onChange, onError: fail });
  const genPrd = trpc.prd.generate.useMutation({
    onSuccess() {
      toast.success("Generating PRD…");
      onChange();
    },
    onError: fail,
  });
  const approvePrd = trpc.prd.approve.useMutation({
    onSuccess() {
      toast.success("PRD approved — planning tasks…");
      onChange();
    },
    onError: fail,
  });
  const genTasks = trpc.task.generate.useMutation({ onSuccess: onChange, onError: fail });
  const genCode = trpc.feature.generateCode.useMutation({
    onSuccess() {
      toast.success("Generating code…");
      onChange();
    },
    onError: fail,
  });
  const approveCode = trpc.feature.approveCode.useMutation({
    onSuccess() {
      toast.success("Approved");
      onChange();
    },
    onError: fail,
  });
  const ship = trpc.feature.ship.useMutation({
    onSuccess() {
      toast.success("Shipping…");
      onChange();
    },
    onError: fail,
  });
  const cancelGen = trpc.feature.cancelGeneration.useMutation({
    onSuccess() {
      toast.success("Generation stopped");
      onChange();
    },
    onError: fail,
  });

  const terminal = TERMINAL.has(status);

  const actions = useMemo(() => {
    const list: { label: string; icon: React.ReactNode; run: () => void; pending: boolean; variant?: "default" | "outline" }[] = [];
    if (status === "CLARIFYING" || status === "NEW") {
      list.push({
        label: "Mark ready for PRD",
        icon: <CheckCircle2 className="size-4" />,
        run: () => markReady.mutate({ workspaceSlug, featureId }),
        pending: markReady.isPending,
        variant: "outline",
      });
    }
    if (status === "READY_FOR_PRD") {
      list.push({
        label: "Generate PRD",
        icon: <Sparkles className="size-4" />,
        run: () => genPrd.mutate({ workspaceSlug, featureId }),
        pending: genPrd.isPending,
      });
    }
    if (status === "PRD_DRAFT" && hasPrd) {
      // At PRD_DRAFT the draft is always awaiting approval — surface "Approve
      // PRD" as the primary next step so the flow never dead-ends on regenerate.
      list.push({
        label: "Approve PRD",
        icon: <CheckCircle2 className="size-4" />,
        run: () => approvePrd.mutate({ workspaceSlug, featureId }),
        pending: approvePrd.isPending,
      });
      list.push({
        label: "Regenerate PRD",
        icon: <Sparkles className="size-4" />,
        run: () => genPrd.mutate({ workspaceSlug, featureId }),
        pending: genPrd.isPending,
        variant: "outline",
      });
    }
    if (status === "TASKS_PLANNED" || status === "PLAN_APPROVED" || status === "IN_PROGRESS") {
      list.push({
        label: "Regenerate tasks",
        icon: <FileCode className="size-4" />,
        run: () => genTasks.mutate({ workspaceSlug, featureId }),
        pending: genTasks.isPending,
        variant: "outline",
      });
      list.push({
        label: "Generate code",
        icon: <Wand2 className="size-4" />,
        run: () => genCode.mutate({ workspaceSlug, featureId }),
        pending: genCode.isPending,
      });
    }
    if (status === "FIX_NEEDED") {
      list.push({
        label: "Regenerate code",
        icon: <Wand2 className="size-4" />,
        run: () => genCode.mutate({ workspaceSlug, featureId }),
        pending: genCode.isPending,
      });
    }
    if (status === "READY_FOR_HUMAN") {
      list.push({
        label: "Regenerate code",
        icon: <Wand2 className="size-4" />,
        run: () => genCode.mutate({ workspaceSlug, featureId }),
        pending: genCode.isPending,
        variant: "outline",
      });
      list.push({
        label: "Approve",
        icon: <CheckCircle2 className="size-4" />,
        run: () => approveCode.mutate({ workspaceSlug, featureId }),
        pending: approveCode.isPending,
      });
    }
    if (status === "APPROVED") {
      list.push({
        label: "Ship / Deploy",
        icon: <Rocket className="size-4" />,
        run: () => ship.mutate({ workspaceSlug, featureId }),
        pending: ship.isPending,
      });
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, hasPrd, prdApproved, markReady.isPending, genPrd.isPending, approvePrd.isPending, genTasks.isPending, genCode.isPending, approveCode.isPending, ship.isPending]);

  if (terminal) {
    return (
      <div className="border-t border-border py-4 text-center text-sm text-muted-foreground">
        This feature is {statusLabel[status].toLowerCase()}.
      </div>
    );
  }

  return (
    <div className="space-y-3 border-t border-border pt-3">
      {GUIDANCE[status] ? (
        <p className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
          <Sparkles className="size-3.5 text-brand" />
          {GUIDANCE[status]}
        </p>
      ) : null}
      {status === "IN_REVIEW" ? (
        <Button
          size="sm"
          variant="destructive"
          disabled={cancelGen.isPending}
          onClick={() => cancelGen.mutate({ workspaceSlug, featureId })}
        >
          {cancelGen.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <StopCircle className="size-4" />
          )}
          Stop generation
        </Button>
      ) : null}
      {actions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {actions.map((a) => {
            const working = a.pending || pendingAction === a.label;
            return (
              <Button
                key={a.label}
                size="sm"
                variant={a.variant ?? "default"}
                disabled={pendingAction !== null || a.pending}
                onClick={() => {
                  setPendingAction(a.label);
                  a.run();
                }}
              >
                {working ? <Loader2 className="size-4 animate-spin" /> : a.icon}
                {working ? "Working…" : a.label}
              </Button>
            );
          })}
        </div>
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!body.trim()) return;
          reply.mutate({ workspaceSlug, featureId, body });
        }}
        className="flex items-end gap-2"
      >
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              if (body.trim()) reply.mutate({ workspaceSlug, featureId, body });
            }
          }}
          placeholder="Reply, add detail, or answer the AI…"
          rows={2}
          className="flex-1 resize-none bg-card"
        />
        <Button type="submit" disabled={reply.isPending || !body.trim()}>
          {reply.isPending ? <Loader2 className="size-4 animate-spin" /> : "Send"}
        </Button>
      </form>
    </div>
  );
}
