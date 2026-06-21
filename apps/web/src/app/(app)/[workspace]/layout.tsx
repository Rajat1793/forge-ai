import { TRPCProvider } from "@/lib/trpc/client";
import { WorkspaceSidebar } from "@/components/workspace/sidebar";
import { WorkspaceTopbar } from "@/components/workspace/topbar";
import { requireWorkspace } from "@/lib/auth";
import { prisma } from "@forge-ai/db";

type Props = {
  children: React.ReactNode;
  params: Promise<{ workspace: string }>;
};

export default async function WorkspaceLayout({ children, params }: Props) {
  const { workspace: slug } = await params;
  const { user, workspace, role } = await requireWorkspace(slug);

  const memberships = await prisma.membership.findMany({
    where: { userId: user.id },
    include: { workspace: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <TRPCProvider>
      <div className="flex min-h-screen bg-slate-950 text-slate-100">
        <WorkspaceSidebar slug={workspace.slug} />
        <div className="flex flex-1 flex-col">
          <WorkspaceTopbar
            user={{ name: user.name, email: user.email, image: user.image ?? null }}
            currentSlug={workspace.slug}
            workspaces={memberships.map((m) => ({
              id: m.workspace.id,
              name: m.workspace.name,
              slug: m.workspace.slug,
            }))}
            role={role}
          />
          <main className="flex-1 px-6 py-8">{children}</main>
        </div>
      </div>
    </TRPCProvider>
  );
}

export const dynamic = "force-dynamic";
