"use client";

import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  FileText,
  ListChecks,
  MessageSquare,
  Rocket,
  Sparkles,
  Wand2,
  XCircle,
} from "lucide-react";
import Link from "next/link";

import { trpc } from "@/lib/trpc/client";

type ActivityType =
  | "FEATURE_CREATED"
  | "CLARIFY_QUESTION"
  | "USER_REPLIED"
  | "READY_FOR_PRD"
  | "PRD_GENERATED"
  | "PRD_APPROVED"
  | "TASKS_GENERATED"
  | "CODE_GENERATED"
  | "REVIEW_BLOCKING"
  | "READY_FOR_HUMAN"
  | "APPROVED"
  | "SHIPPED"
  | "REJECTED"
  | "DUPLICATE_DETECTED";

const META: Record<ActivityType, { icon: typeof Sparkles; color: string }> = {
  FEATURE_CREATED: { icon: Sparkles, color: "text-brand" },
  CLARIFY_QUESTION: { icon: Bot, color: "text-sky-300" },
  USER_REPLIED: { icon: MessageSquare, color: "text-foreground" },
  READY_FOR_PRD: { icon: CheckCircle2, color: "text-sky-300" },
  PRD_GENERATED: { icon: FileText, color: "text-brand" },
  PRD_APPROVED: { icon: CheckCircle2, color: "text-brand" },
  TASKS_GENERATED: { icon: ListChecks, color: "text-brand" },
  CODE_GENERATED: { icon: Wand2, color: "text-brand" },
  REVIEW_BLOCKING: { icon: AlertTriangle, color: "text-red-300" },
  READY_FOR_HUMAN: { icon: CheckCircle2, color: "text-amber-200" },
  APPROVED: { icon: CheckCircle2, color: "text-brand" },
  SHIPPED: { icon: Rocket, color: "text-brand" },
  REJECTED: { icon: XCircle, color: "text-red-300" },
  DUPLICATE_DETECTED: { icon: AlertTriangle, color: "text-amber-200" },
};

function timeAgo(date: Date | string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function ActivityFeed({
  workspaceSlug,
  featureId,
  limit = 30,
  showFeatureLink = true,
}: {
  workspaceSlug: string;
  featureId?: string;
  limit?: number;
  showFeatureLink?: boolean;
}) {
  const q = trpc.activity.list.useQuery(
    { workspaceSlug, featureId, limit },
    { refetchInterval: 15000 },
  );

  if (q.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading activity…</p>;
  }
  if (!q.data || q.data.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border bg-secondary p-4 text-sm text-muted-foreground">
        No activity yet.
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {q.data.map((a) => {
        const meta = META[a.type as ActivityType] ?? META.FEATURE_CREATED;
        const Icon = meta.icon;
        return (
          <li key={a.id} className="flex gap-3">
            <div className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border border-border bg-secondary">
              <Icon className={`size-3.5 ${meta.color}`} />
            </div>
            <div className="flex-1">
              <p className="text-sm text-foreground">{a.message}</p>
              <p className="text-xs text-muted-foreground">
                {timeAgo(a.createdAt)}
                {showFeatureLink && a.feature ? (
                  <>
                    {" · "}
                    <Link
                      href={`/${workspaceSlug}/features/${a.feature.id}`}
                      className="text-brand hover:underline"
                    >
                      {a.feature.title}
                    </Link>
                  </>
                ) : null}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
