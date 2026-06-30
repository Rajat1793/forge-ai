"use client";

import { Activity, CheckCircle2, Clock, Layers, Rocket, ShieldAlert } from "lucide-react";

import { ActivityFeed } from "@/components/workspace/activity-feed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { statusLabel } from "@/lib/feature-status";
import type { FeatureRequestStatus } from "@forge-ai/db";
import { trpc } from "@/lib/trpc/client";

const TASK_TYPE_LABEL: Record<string, string> = {
  FE: "Frontend",
  BE: "Backend",
  INFRA: "Infrastructure",
  QA: "QA",
};

function formatDuration(hours: number | null) {
  if (hours == null) return "—";
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 48) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-5">
        <div className="grid size-9 place-items-center rounded-md bg-brand/15 text-brand">
          <Icon className="size-4" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold">{value}</p>
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}

export function AnalyticsView({ workspaceSlug }: { workspaceSlug: string }) {
  const q = trpc.analytics.overview.useQuery({ workspaceSlug });

  if (q.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading analytics…</p>;
  }
  if (!q.data) {
    return <p className="text-sm text-muted-foreground">No analytics available.</p>;
  }

  const d = q.data;
  const statusEntries = Object.entries(d.statusCounts).sort((a, b) => b[1] - a[1]);
  const maxStatus = Math.max(1, ...statusEntries.map(([, n]) => n));
  const taskEntries = Object.entries(d.taskTypeCounts);
  const taskTotal = taskEntries.reduce((s, [, n]) => s + n, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat icon={Layers} label="Total features" value={String(d.total)} />
        <Stat
          icon={Rocket}
          label="Shipped"
          value={String(d.shipped)}
          hint={`${Math.round(d.completionRate * 100)}% completion`}
        />
        <Stat
          icon={Clock}
          label="Avg cycle time"
          value={formatDuration(d.avgCycleHours)}
          hint={d.medianCycleHours != null ? `median ${formatDuration(d.medianCycleHours)}` : undefined}
        />
        <Stat
          icon={CheckCircle2}
          label="Shipped (30d)"
          value={String(d.throughput30)}
          hint="rolling throughput"
        />
        <Stat
          icon={ShieldAlert}
          label="Blocking issues"
          value={String(d.blockingIssues)}
          hint="open in code drafts"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {statusEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No features yet.</p>
            ) : (
              statusEntries.map(([status, count]) => (
                <div key={status}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span>{statusLabel[status as FeatureRequestStatus] ?? status}</span>
                    <span className="text-muted-foreground">{count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${(count / maxStatus) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Task mix</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {taskEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks generated yet.</p>
            ) : (
              taskEntries.map(([type, count]) => (
                <div key={type}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span>{TASK_TYPE_LABEL[type] ?? type}</span>
                    <span className="text-muted-foreground">
                      {count} · {Math.round((count / Math.max(1, taskTotal)) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${(count / Math.max(1, taskTotal)) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="size-4 text-brand" />
            Recent activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityFeed workspaceSlug={workspaceSlug} limit={15} />
        </CardContent>
      </Card>
    </div>
  );
}
