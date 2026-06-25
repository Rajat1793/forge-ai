"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Github, Loader2, Plus } from "lucide-react";
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
import { trpc } from "@/lib/trpc/client";

export function RepoConnect({
  workspaceSlug,
  disabled,
}: {
  workspaceSlug: string;
  disabled: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const available = trpc.repository.available.useQuery(
    { workspaceSlug },
    { enabled: open && !disabled },
  );
  const connect = trpc.repository.connect.useMutation({
    onSuccess() {
      toast.success("Repository connected");
      setOpen(false);
      router.refresh();
    },
    onError(err) {
      toast.error(err.message);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled}>
          <Plus className="mr-2 size-4" />
          Connect repository
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Connect a GitHub repository</DialogTitle>
          <DialogDescription>
            Pick a repository to track pull requests and run AI reviews on.
          </DialogDescription>
        </DialogHeader>
        {available.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Loader2 className="size-4 animate-spin" />
            Loading repos…
          </div>
        ) : available.data && available.data.length > 0 ? (
          <ul className="max-h-80 space-y-2 overflow-y-auto">
            {available.data.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-md border border-white/10 bg-slate-950/50 px-3 py-2 text-sm"
              >
                <span className="flex items-center gap-2">
                  <Github className="size-4 text-slate-400" />
                  {r.owner}/{r.name}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={connect.isPending}
                  onClick={() =>
                    connect.mutate({
                      workspaceSlug,
                      githubId: r.id,
                      owner: r.owner,
                      name: r.name,
                      defaultBranch: r.default_branch,
                    })
                  }
                >
                  Connect
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">
            No repositories returned. Make sure your GitHub token has <code>repo</code> scope.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
