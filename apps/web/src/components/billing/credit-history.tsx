import { Badge } from "@/components/ui/badge";

type Entry = {
  id: string;
  event: "GRANT_MONTHLY" | "PURCHASE" | "REVIEW_RUN" | "REFUND" | "ADJUSTMENT";
  delta: number;
  balance: number;
  reason: string | null;
  createdAt: string;
};

const eventVariant = (e: Entry["event"]) =>
  ({
    GRANT_MONTHLY: "success" as const,
    PURCHASE: "info" as const,
    REVIEW_RUN: "secondary" as const,
    REFUND: "warning" as const,
    ADJUSTMENT: "outline" as const,
  })[e];

export function CreditHistory({ entries }: { entries: Entry[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No credit activity yet. Upgrade or run an AI review to see entries here.
      </p>
    );
  }
  return (
    <ul className="divide-y divide-border">
      {entries.map((e) => (
        <li key={e.id} className="flex items-center justify-between gap-3 py-2 text-sm">
          <div className="flex items-center gap-2">
            <Badge variant={eventVariant(e.event)}>{e.event.replace("_", " ")}</Badge>
            <span className="text-foreground">{e.reason ?? "—"}</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span
              className={
                e.delta >= 0 ? "font-mono text-brand" : "font-mono text-destructive"
              }
            >
              {e.delta >= 0 ? "+" : ""}
              {e.delta}
            </span>
            <span className="font-mono text-muted-foreground">bal {e.balance}</span>
            <span className="text-muted-foreground">{new Date(e.createdAt).toLocaleString()}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
