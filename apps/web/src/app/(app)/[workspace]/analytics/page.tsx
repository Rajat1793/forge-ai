import { requireWorkspace } from "@/lib/auth";
import { AnalyticsView } from "@/components/analytics/analytics-view";

type Props = { params: Promise<{ workspace: string }> };

export default async function AnalyticsPage({ params }: Props) {
  const { workspace: slug } = await params;
  await requireWorkspace(slug);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Delivery throughput and cycle time across this workspace.
        </p>
      </div>
      <AnalyticsView workspaceSlug={slug} />
    </div>
  );
}
