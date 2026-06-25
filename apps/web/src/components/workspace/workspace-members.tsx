"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, ShieldCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc/client";

type Member = {
  id: string;
  role: string;
  user: { id: string; name: string | null; email: string; image: string | null };
};

type Invite = {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
};

export function WorkspaceMembers({
  workspaceSlug,
  canManage,
  members,
  invites,
}: {
  workspaceSlug: string;
  canManage: boolean;
  members: Member[];
  invites: Invite[];
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "MEMBER" | "REVIEWER">("MEMBER");

  const invite = trpc.workspace.invite.useMutation({
    onSuccess() {
      toast.success(`Invite sent to ${email}`);
      setEmail("");
      router.refresh();
    },
    onError(err) {
      toast.error(err.message);
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <ShieldCheck className="size-3.5" /> Members
        </div>
        <ul className="divide-y divide-border overflow-hidden rounded-md border border-border bg-card">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <p className="font-medium text-foreground">
                  {m.user.name ?? m.user.email}
                </p>
                <p className="text-xs text-muted-foreground">{m.user.email}</p>
              </div>
              <Badge
                variant={m.role === "OWNER" ? "success" : "secondary"}
                className="text-[10px] uppercase tracking-wider"
              >
                {m.role}
              </Badge>
            </li>
          ))}
        </ul>
      </div>

      {invites.length > 0 ? (
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <Mail className="size-3.5" /> Pending invites
          </div>
          <ul className="divide-y divide-border overflow-hidden rounded-md border border-border bg-card">
            {invites.map((i) => (
              <li key={i.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-foreground">{i.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Expires {new Date(i.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
                  {i.role}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {canManage ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!email) return;
            invite.mutate({ workspaceSlug, email, role });
          }}
          className="grid gap-3 sm:grid-cols-[1fr_auto_auto]"
        >
          <div className="space-y-1.5">
            <Label htmlFor="invite-email" className="text-xs uppercase tracking-wider text-muted-foreground">
              Invite by email
            </Label>
            <Input
              id="invite-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@company.com"
              className="border-border bg-card text-foreground"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invite-role" className="text-xs uppercase tracking-wider text-muted-foreground">
              Role
            </Label>
            <select
              id="invite-role"
              value={role}
              onChange={(e) => setRole(e.target.value as typeof role)}
              className="h-10 rounded-md border border-border bg-card px-3 text-sm text-foreground"
            >
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
              <option value="REVIEWER">Reviewer</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={invite.isPending || !email}>
              <UserPlus className="mr-2 size-4" />
              {invite.isPending ? "Sending…" : "Invite"}
            </Button>
          </div>
        </form>
      ) : (
        <p className="text-xs text-muted-foreground">
          Only owners and admins can invite new members.
        </p>
      )}
    </div>
  );
}
