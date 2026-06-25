"use client";

import { useRouter } from "next/navigation";
import { RotateCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";

export function RerunReviewButton({
  workspaceSlug,
  pullRequestId,
}: {
  workspaceSlug: string;
  pullRequestId: string;
}) {
  const router = useRouter();
  const rerun = trpc.review.rerun.useMutation({
    onSuccess() {
      toast.success("Review re-queued");
      setTimeout(() => router.refresh(), 1500);
    },
    onError(err) {
      toast.error(err.message);
    },
  });

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={rerun.isPending}
      onClick={() => rerun.mutate({ workspaceSlug, pullRequestId })}
    >
      <RotateCw className="mr-2 size-4" />
      Re-run review
    </Button>
  );
}
