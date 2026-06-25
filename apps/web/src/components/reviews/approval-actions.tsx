"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, MessageSquareWarning } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc/client";

export function ApprovalActions({
  workspaceSlug,
  pullRequestId,
}: {
  workspaceSlug: string;
  pullRequestId: string;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [open, setOpen] = useState(false);

  const approve = trpc.approval.approvePullRequest.useMutation({
    onSuccess() {
      toast.success("PR approved");
      router.refresh();
    },
    onError(err) {
      toast.error(err.message);
    },
  });
  const requestChanges = trpc.approval.requestChanges.useMutation({
    onSuccess() {
      toast.success("Feedback posted to the PR");
      setOpen(false);
      setNote("");
      router.refresh();
    },
    onError(err) {
      toast.error(err.message);
    },
  });

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        disabled={approve.isPending}
        onClick={() => approve.mutate({ workspaceSlug, pullRequestId })}
      >
        <CheckCircle2 className="mr-2 size-4" />
        Approve
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline">
            <MessageSquareWarning className="mr-2 size-4" />
            Request changes
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request changes</DialogTitle>
            <DialogDescription>
              Your note will be posted as a comment on the pull request.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What needs to change?"
            rows={5}
            className="border-border bg-card text-foreground"
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              disabled={requestChanges.isPending || note.trim().length < 3}
              onClick={() =>
                requestChanges.mutate({ workspaceSlug, pullRequestId, note })
              }
            >
              Send feedback
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

