"use client";

import { useRouter } from "next/navigation";
import { Rocket, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";

export function FeatureShipActions({
  workspaceSlug,
  featureId,
  status,
}: {
  workspaceSlug: string;
  featureId: string;
  status: string;
}) {
  const router = useRouter();
  const ship = trpc.approval.shipFeature.useMutation({
    onSuccess() {
      toast.success("🚀 Release queued — great work!");
      setTimeout(() => router.refresh(), 1000);
    },
    onError(err) {
      toast.error(err.message);
    },
  });
  const reject = trpc.approval.rejectFeature.useMutation({
    onSuccess() {
      toast.success("Feature request rejected");
      router.refresh();
    },
    onError(err) {
      toast.error(err.message);
    },
  });

  const shippable = status === "APPROVED" || status === "IN_PROGRESS";
  const terminal = status === "SHIPPED" || status === "REJECTED";

  if (terminal) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {shippable ? (
        <Button
          size="sm"
          disabled={ship.isPending}
          onClick={() => ship.mutate({ workspaceSlug, featureId })}
        >
          <Rocket className="mr-2 size-4" />
          Ship feature
        </Button>
      ) : null}
      <Button
        size="sm"
        variant="outline"
        disabled={reject.isPending}
        onClick={() => {
          if (confirm("Reject this feature request?")) {
            reject.mutate({ workspaceSlug, featureId });
          }
        }}
      >
        <XCircle className="mr-2 size-4" />
        Reject
      </Button>
    </div>
  );
}
