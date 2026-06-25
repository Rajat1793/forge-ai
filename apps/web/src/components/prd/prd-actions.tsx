"use client";

import { useRouter } from "next/navigation";
import { Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";

export function PRDActions({
  workspaceSlug,
  featureId,
  hasPrd,
  approved,
}: {
  workspaceSlug: string;
  featureId: string;
  hasPrd: boolean;
  approved: boolean;
}) {
  const router = useRouter();
  const generate = trpc.prd.generate.useMutation({
    onSuccess() {
      toast.success("PRD generation queued");
      setTimeout(() => router.refresh(), 1500);
    },
    onError(err) {
      toast.error(err.message);
    },
  });
  const approve = trpc.prd.approve.useMutation({
    onSuccess() {
      toast.success("PRD approved — generating tasks…");
      router.refresh();
    },
    onError(err) {
      toast.error(err.message);
    },
  });

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={generate.isPending}
        onClick={() => generate.mutate({ workspaceSlug, featureId })}
      >
        <Sparkles className="mr-2 size-4" />
        {hasPrd ? "Regenerate" : "Generate PRD"}
      </Button>
      {hasPrd && !approved ? (
        <Button
          size="sm"
          disabled={approve.isPending}
          onClick={() => approve.mutate({ workspaceSlug, featureId })}
        >
          <CheckCircle2 className="mr-2 size-4" />
          Approve PRD
        </Button>
      ) : null}
    </div>
  );
}
