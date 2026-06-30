import { requireWorkspace } from "@/lib/auth";
import { ActivityFeed } from "@/components/workspace/activity-feed";
import { Card, CardContent } from "@/components/ui/card";

type Props = { params: Promise<{ workspace: string }> };

export default async function ActivityPage({ params }: Props) {
  const { workspace: slug } = await params;
  await requireWorkspace(slug);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Activity</h1>
        <p className="text-sm text-muted-foreground">
          Every step the agents and your team take, newest first.
        </p>
      </div>
      <Card>
        <CardContent className="p-5">
          <ActivityFeed workspaceSlug={slug} limit={100} />
        </CardContent>
      </Card>
    </div>
  );
}
