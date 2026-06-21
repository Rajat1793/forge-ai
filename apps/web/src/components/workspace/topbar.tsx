"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, LogOut, Plus } from "lucide-react";
import { authClient } from "@forge-ai/auth/client";

import { Button } from "@/components/ui/button";
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

  const current = workspaces.find((w) => w.slug === currentSlug);

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between border-b border-white/10 bg-slate-950/80 px-6 py-3 backdrop-blur">
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 rounded-md border border-white/10 bg-slate-900/60 px-3 py-1.5 text-sm hover:bg-slate-900"
        >
          <span className="font-medium">{current?.name ?? currentSlug}</span>
          <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-emerald-200">
            {role}
          </span>
          <ChevronsUpDown className="size-3.5 opacity-60" />
        </button>
        {open ? (
          <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-lg border border-white/10 bg-slate-950/95 p-1 shadow-2xl">
            {workspaces.map((w) => (
              <Link
                key={w.id}
                href={`/${w.slug}/dashboard`}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center justify-between rounded-md px-3 py-2 text-sm text-slate-200 hover:bg-white/5",
                  w.slug === currentSlug && "bg-white/5 text-white",
                )}
              >
                <span>{w.name}</span>
                {w.slug === currentSlug ? <Check className="size-4 text-emerald-300" /> : null}
              </Link>
            ))}
            <div className="mt-1 border-t border-white/10 pt-1">
              <Link
                href="/onboarding"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-emerald-300 hover:bg-white/5"
              >
                <Plus className="size-4" />
                New workspace
              </Link>
            </div>
          </div>
        ) : null}
      </div>

      <div className="relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 rounded-md border border-white/10 bg-slate-900/60 px-3 py-1.5 text-sm hover:bg-slate-900"
        >
          <span className="hidden text-slate-200 md:inline">{user.name || user.email}</span>
          <span className="grid size-7 place-items-center rounded-full bg-emerald-500/20 text-emerald-200">
            {(user.name || user.email).slice(0, 1).toUpperCase()}
          </span>
        </button>
        {menuOpen ? (
          <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-white/10 bg-slate-950/95 p-1 shadow-2xl">
            <div className="px-3 py-2 text-xs text-slate-400">{user.email}</div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="w-full justify-start text-slate-200 hover:bg-white/5"
            >
              <LogOut className="size-4" />
              Sign out
            </Button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
