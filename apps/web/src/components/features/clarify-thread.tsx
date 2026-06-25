"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, User } from "lucide-react";
import { toast } from "sonner";
import type { FeatureRequestStatus } from "@forge-ai/db";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  author: "AI" | "USER";
  body: string;
  createdAt: string;
};

export function ClarifyThread({
  workspaceSlug,
  featureId,
  initial,
  status,
}: {
  workspaceSlug: string;
  featureId: string;
  initial: Message[];
  status: FeatureRequestStatus;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");

  const reply = trpc.feature.reply.useMutation({
    onSuccess() {
      setBody("");
      router.refresh();
    },
    onError(err) {
      toast.error(err.message);
    },
  });
  const markReady = trpc.feature.markReadyForPrd.useMutation({
    onSuccess() {
      toast.success("Marked ready for PRD");
      router.refresh();
    },
    onError(err) {
      toast.error(err.message);
    },
  });

  const locked =
    status === "SHIPPED" || status === "REJECTED" || status === "DUPLICATE";

  return (
    <div className="space-y-4">
      {initial.length === 0 ? (
        <p className="rounded-md border border-dashed border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
          Waiting for the AI to triage this request…
        </p>
      ) : (
        <ul className="space-y-3">
          {initial.map((m) => (
            <li
              key={m.id}
              className={cn(
                "flex gap-3 rounded-md border border-white/10 bg-slate-950/50 p-4",
                m.author === "AI" ? "border-emerald-300/20" : "border-white/10",
              )}
            >
              <div
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-full text-xs",
                  m.author === "AI"
                    ? "bg-emerald-500/20 text-emerald-200"
                    : "bg-slate-700/50 text-slate-200",
                )}
              >
                {m.author === "AI" ? <Bot className="size-4" /> : <User className="size-4" />}
              </div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wider text-slate-400">
                  {m.author === "AI" ? "Forge AI" : "You"} · {new Date(m.createdAt).toLocaleString()}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-100">{m.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!locked ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!body.trim()) return;
            reply.mutate({ workspaceSlug, featureId, body });
          }}
          className="space-y-3"
        >
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Reply with the missing details…"
            rows={4}
            className="border-white/10 bg-slate-950/60 text-slate-100"
          />
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={markReady.isPending || status === "READY_FOR_PRD"}
              onClick={() => markReady.mutate({ workspaceSlug, featureId })}
              className="text-slate-300 hover:text-white"
            >
              {status === "READY_FOR_PRD" ? "Ready for PRD" : "Mark ready for PRD"}
            </Button>
            <Button type="submit" disabled={reply.isPending || !body.trim()}>
              {reply.isPending ? "Sending…" : "Send reply"}
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
