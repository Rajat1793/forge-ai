"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc/client";

type Project = { id: string; name: string };

export function NewFeatureForm({
  workspaceSlug,
  projects,
}: {
  workspaceSlug: string;
  projects: Project[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [source, setSource] = useState<"MANUAL" | "EMAIL" | "TICKET" | "CALL">("MANUAL");
  const [error, setError] = useState<string | null>(null);

  const create = trpc.feature.create.useMutation({
    onSuccess(feature) {
      toast.success("Feature request submitted — AI is running discovery…");
      router.push(`/${workspaceSlug}/features/${feature.id}`);
      router.refresh();
    },
    onError(err) {
      setError(err.message);
      toast.error(err.message);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    create.mutate({
      workspaceSlug,
      title,
      description,
      source,
      projectId: projectId || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title" className="text-foreground">Title</Label>
        <Input
          id="title"
          required
          minLength={4}
          maxLength={140}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add Slack notifications when a review completes"
          className="border-border bg-secondary text-foreground"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description" className="text-foreground">Description</Label>
        <Textarea
          id="description"
          required
          minLength={10}
          rows={8}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Context, user persona, expected behaviour…"
          className="border-border bg-secondary text-foreground"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {projects.length > 1 ? (
          <div className="space-y-2">
            <Label htmlFor="project" className="text-foreground">Project</Label>
            <select
              id="project"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-secondary px-3 text-sm text-foreground"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="source" className="text-foreground">Source</Label>
          <select
            id="source"
            value={source}
            onChange={(e) => setSource(e.target.value as typeof source)}
            className="h-10 w-full rounded-md border border-border bg-secondary px-3 text-sm text-foreground"
          >
            <option value="MANUAL">Manual</option>
            <option value="EMAIL">Email</option>
            <option value="TICKET">Ticket</option>
            <option value="CALL">Call</option>
          </select>
        </div>
      </div>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <Button type="submit" disabled={create.isPending} className="w-full">
        {create.isPending ? "Submitting…" : "Submit feature"}
      </Button>
    </form>
  );
}
