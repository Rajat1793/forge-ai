import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkspaceSettings } from "@/components/workspace/workspace-settings";
import { WorkspaceMembers } from "@/components/workspace/workspace-members";
import { requireWorkspace } from "@/lib/auth";
import { prisma } from "@forge-ai/db";

type Props = { params: Promise<{ workspace: string }> };

export default async function SettingsPage({ params }: Props) {
  const { workspace: slug } = await params;
  const { workspace, role } = await requireWorkspace(slug);

  const [memberships, invites] = await Promise.all([
    prisma.membership.findMany({
      where: { workspaceId: workspace.id },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.invite.findMany({
      where: { workspaceId: workspace.id, acceptedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        role: true,
        expiresAt: true,
        createdAt: true,
      },
    }),
  ]);

  const canManage = role === "OWNER" || role === "ADMIN";

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-300/80">
          Settings
        </p>
        <h1 className="mt-2 text-3xl font-semibold">{workspace.name}</h1>
        <p className="mt-2 text-sm text-slate-400">
          Manage workspace details, members, and integrations.
        </p>
      </header>

      <Card className="border-white/10 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-base">Workspace details</CardTitle>
          <CardDescription className="text-slate-400">
            Slug <code className="text-emerald-300">{workspace.slug}</code> · created{" "}
            {new Date(workspace.createdAt).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WorkspaceSettings
            workspaceSlug={workspace.slug}
            initialName={workspace.name}
            canEdit={canManage}
          />
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-base">Members & invites</CardTitle>
          <CardDescription className="text-slate-400">
            {memberships.length} member{memberships.length === 1 ? "" : "s"} · {invites.length} pending invite{invites.length === 1 ? "" : "s"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WorkspaceMembers
            workspaceSlug={workspace.slug}
            canManage={canManage}
            members={memberships.map((m) => ({
              id: m.id,
              role: m.role,
              user: m.user,
            }))}
            invites={invites.map((i) => ({
              id: i.id,
              email: i.email,
              role: i.role,
              expiresAt: i.expiresAt.toISOString(),
            }))}
          />
        </CardContent>
      </Card>

      <Card className="border-amber-300/20 bg-amber-300/5">
        <CardHeader>
          <CardTitle className="text-base text-amber-200">Danger zone</CardTitle>
          <CardDescription className="text-amber-200/80">
            Workspace deletion is permanent and not yet self-serve — contact support to remove a workspace.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
