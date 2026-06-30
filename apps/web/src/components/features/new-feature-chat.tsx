"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, Bot, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc/client";

type Project = { id: string; name: string };

// Derive a short title from the user's free-form prompt so they only have to
// type one thing. We prefer the first sentence, falling back to the first line.
function deriveTitle(prompt: string) {
  const firstLine = prompt.trim().split("\n")[0]?.trim() ?? "";
  const firstSentence = firstLine.split(/(?<=[.!?])\s/)[0]?.trim() ?? firstLine;
  const base = firstSentence.length >= 4 ? firstSentence : firstLine;
  return base.slice(0, 140);
}

export function NewFeatureChat({
  workspaceSlug,
  projects,
}: {
  workspaceSlug: string;
  projects: Project[];
}) {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [debouncedTitle, setDebouncedTitle] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedTitle(deriveTitle(prompt)), 400);
    return () => clearTimeout(t);
  }, [prompt]);

  const similar = trpc.feature.findSimilar.useQuery(
    { workspaceSlug, title: debouncedTitle },
    { enabled: debouncedTitle.length >= 4, staleTime: 30000 },
  );

  const create = trpc.feature.create.useMutation({
    onSuccess(feature) {
      toast.success("On it — running discovery…");
      router.push(`/${workspaceSlug}/features/${feature.id}`);
      router.refresh();
    },
    onError: (err) => toast.error(err.message),
  });

  const trimmed = prompt.trim();
  const canSend = trimmed.length >= 12 && !create.isPending;

  function send() {
    if (!canSend) return;
    create.mutate({
      workspaceSlug,
      title: deriveTitle(trimmed),
      description: trimmed,
      source: "MANUAL",
      projectId: projectId || undefined,
    });
  }

  return (
    <div className="space-y-4">
      {/* Assistant intro */}
      <div className="flex gap-3">
        <div className="grid size-8 shrink-0 place-items-center rounded-full bg-brand/20 text-brand">
          <Bot className="size-4" />
        </div>
        <div className="flex-1 rounded-lg border border-border bg-card p-3 text-sm leading-6 text-foreground">
          Tell me what you want to build, in plain words. I&apos;ll take it from there —
          discovery → PRD → tasks → code → ship — and only ask a question if I genuinely need one.
        </div>
      </div>

      {similar.data && similar.data.length > 0 ? (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3">
          <p className="flex items-center gap-2 text-sm font-medium text-amber-200">
            <AlertTriangle className="size-4" />
            Possible duplicate{similar.data.length > 1 ? "s" : ""}
          </p>
          <ul className="mt-2 space-y-1">
            {similar.data.map((f) => (
              <li key={f.id} className="text-sm">
                <Link
                  href={`/${workspaceSlug}/features/${f.id}`}
                  target="_blank"
                  className="text-amber-100 underline-offset-2 hover:underline"
                >
                  {f.title}
                </Link>
                <span className="text-muted-foreground"> · {Math.round(f.score * 100)}% match</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">
            You can still continue — this is just a heads-up.
          </p>
        </div>
      ) : null}

      <div className="space-y-2">
        <Textarea
          autoFocus
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              send();
            }
          }}
          rows={6}
          placeholder="e.g. When a code review finishes, notify the author in Slack with a short summary and a link to the PR."
          className="resize-none border-border bg-secondary text-foreground"
        />
        <div className="flex items-center justify-between gap-3">
          {projects.length > 1 ? (
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="h-10 rounded-md border border-border bg-secondary px-3 text-sm text-foreground"
              aria-label="Project"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs text-muted-foreground">⌘/Ctrl + Enter to send</span>
          )}
          <Button onClick={send} disabled={!canSend}>
            {create.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Start building
          </Button>
        </div>
      </div>
    </div>
  );
}
