"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, LogOut, Plus } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@forge-ai/auth/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NotificationsBell } from "@/components/workspace/notifications-bell";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

type Workspace = { id: string; name: string; slug: string };

export function WorkspaceTopbar({
  user,
  currentSlug,
  workspaces,
  role,
}: {
  user: { name: string; email: string; image: string | null };
  currentSlug: string;
  workspaces: Workspace[];
  role: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const wsRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const current = workspaces.find((w) => w.slug === currentSlug);

  const createWorkspace = trpc.workspace.create.useMutation({
    onSuccess(workspace) {
      setOpen(false);
      setCreating(false);
      setNewName("");
      router.push(`/${workspace.slug}/dashboard`);
      router.refresh();
    },
    onError(err) {
      toast.error(err.message);
    },
  });

  useEffect(() => {
    function handlePointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (wsRef.current && !wsRef.current.contains(target)) {
        setOpen(false);
        setCreating(false);
      }
      if (userRef.current && !userRef.current.contains(target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-6 py-3 backdrop-blur">
      <div className="relative" ref={wsRef}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 rounded-md border border-border bg-secondary px-3 py-1.5 text-sm hover:bg-accent"
        >
          <span className="font-medium">{current?.name ?? currentSlug}</span>
          <span className="rounded-full border border-brand/20 bg-brand/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-brand">
            {role}
          </span>
          <ChevronsUpDown className="size-3.5 opacity-60" />
        </button>
        {open ? (
          <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-lg border border-border bg-popover p-1 shadow-2xl">
            {workspaces.map((w) => (
              <Link
                key={w.id}
                href={`/${w.slug}/dashboard`}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center justify-between rounded-md px-3 py-2 text-sm text-foreground hover:bg-accent",
                  w.slug === currentSlug && "bg-secondary text-foreground",
                )}
              >
                <span>{w.name}</span>
                {w.slug === currentSlug ? <Check className="size-4 text-brand" /> : null}
              </Link>
            ))}
            <div className="mt-1 border-t border-border pt-1">
              {creating ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const name = newName.trim();
                    if (name.length < 2) return;
                    createWorkspace.mutate({ name });
                  }}
                  className="space-y-2 p-2"
                >
                  <Input
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Workspace name"
                    className="h-8 border-border bg-secondary text-foreground"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      size="sm"
                      className="flex-1"
                      disabled={createWorkspace.isPending || newName.trim().length < 2}
                    >
                      {createWorkspace.isPending ? "Creating…" : "Create"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setCreating(false);
                        setNewName("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setCreating(true)}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-brand hover:bg-accent"
                >
                  <Plus className="size-4" />
                  New workspace
                </button>
              )}
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <NotificationsBell workspaceSlug={currentSlug} />
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-md border border-border bg-secondary px-3 py-1.5 text-sm hover:bg-accent"
          >
            <span className="hidden text-foreground md:inline">{user.name || user.email}</span>
            <span className="grid size-7 place-items-center rounded-full bg-brand/20 text-brand">
              {(user.name || user.email).slice(0, 1).toUpperCase()}
            </span>
          </button>
          {menuOpen ? (
            <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-border bg-popover p-1 shadow-2xl">
              <div className="px-3 py-2 text-xs text-muted-foreground">{user.email}</div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="w-full justify-start text-foreground hover:bg-accent"
              >
                <LogOut className="size-4" />
                Sign out
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
