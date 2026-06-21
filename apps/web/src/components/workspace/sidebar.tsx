"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ListChecks,
  KanbanSquare,
  GitBranch,
  ShieldCheck,
  CreditCard,
  Settings,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/features", label: "Features", icon: ListChecks },
  { href: "/board", label: "Board", icon: KanbanSquare },
  { href: "/repos", label: "Repos", icon: GitBranch },
  { href: "/reviews", label: "Reviews", icon: ShieldCheck },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function WorkspaceSidebar({ slug }: { slug: string }) {
  const pathname = usePathname();
  const base = `/${slug}`;
  return (
    <aside className="hidden w-60 shrink-0 border-r border-white/10 bg-slate-950/80 px-4 py-6 md:flex md:flex-col">
      <div className="mb-8 flex items-center gap-2 px-2 text-lg font-semibold">
        <Sparkles className="size-5 text-emerald-300" />
        Forge AI
      </div>
      <nav className="space-y-1">
        {items.map((item) => {
          const href = `${base}${item.href}`;
          const active = pathname === href || pathname.startsWith(`${href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-emerald-500/15 text-emerald-200"
                  : "text-slate-300 hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
