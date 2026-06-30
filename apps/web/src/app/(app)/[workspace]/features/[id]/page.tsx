import { notFound } from "next/navigation";

import { FeatureThread } from "@/components/features/feature-thread";
import { requireWorkspace } from "@/lib/auth";
import { prisma } from "@forge-ai/db";

type Props = { params: Promise<{ workspace: string; id: string }> };

export default async function FeaturePage({ params }: Props) {
  const { workspace: slug, id } = await params;
  const { workspace } = await requireWorkspace(slug);

  const exists = await prisma.featureRequest.findFirst({
    where: { id, workspaceId: workspace.id },
    select: { id: true },
  });
  if (!exists) notFound();

  return <FeatureThread workspaceSlug={slug} featureId={id} />;
}
