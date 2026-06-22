"use client";

import { useRouter } from "next/navigation";
import { Sparkles, CheckCircle2 } from "lucide-react";

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
      setTimeout(() => router.refresh(), 1500);
    },
  });
  const approve = trpc.prd.approve.useMutation({
    onSuccess() {
      router.refresh();
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
