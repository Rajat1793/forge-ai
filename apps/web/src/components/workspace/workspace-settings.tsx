"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc/client";

export function WorkspaceSettings({
  workspaceSlug,
  initialName,
  canEdit,
}: {
  workspaceSlug: string;
  initialName: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);

  const rename = trpc.workspace.rename.useMutation({
    onSuccess() {
      toast.success("Workspace renamed");
      router.refresh();
    },
    onError(err) {
      toast.error(err.message);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!canEdit) return;
        rename.mutate({ workspaceSlug, name });
      }}
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
    >
      <div className="flex-1 space-y-2">
        <Label htmlFor="ws-name" className="text-slate-200">
          Display name
        </Label>
        <Input
          id="ws-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={!canEdit || rename.isPending}
          minLength={2}
          maxLength={60}
          className="border-white/10 bg-slate-950/60 text-slate-100"
        />
      </div>
      <Button
        type="submit"
        disabled={!canEdit || rename.isPending || name.trim() === initialName.trim()}
      >
        {rename.isPending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
