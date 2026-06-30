import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@forge-ai/auth";
import { prisma } from "@forge-ai/db";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() }).catch(() => null);
}

export async function requireUser() {
  const session = await getSession();
  if (!session?.user) redirect("/sign-in");
  return session.user;
}

export async function requireWorkspace(slug: string) {
  const user = await requireUser();
  const workspace = await prisma.workspace.findFirst({
    where: { slug, memberships: { some: { userId: user.id } } },
    include: { memberships: { where: { userId: user.id } } },
  });
  if (!workspace) redirect("/dashboard");
  return {
    user,
    workspace,
    membership: workspace.memberships[0],
    role: workspace.memberships[0].role,
  };
}

export async function getPrimaryWorkspace(userId: string) {
  return prisma.workspace.findFirst({
    where: { memberships: { some: { userId } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function getOrCreatePrimaryWorkspace(user: {
  id: string;
  name?: string | null;
  email?: string | null;
}) {
  const existing = await getPrimaryWorkspace(user.id);
  if (existing) return existing;

  const name = user.name ? `${user.name}'s workspace` : "My workspace";
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 32) || `ws-${Date.now()}`;
  let slug = base;
  let i = 1;
  while (await prisma.workspace.findUnique({ where: { slug } })) {
    slug = `${base}-${i++}`;
  }

  return prisma.workspace.create({
    data: {
      name,
      slug,
      memberships: { create: { userId: user.id, role: "OWNER" } },
    },
  });
}
