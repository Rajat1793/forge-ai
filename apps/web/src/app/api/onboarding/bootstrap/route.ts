import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@forge-ai/auth";
import { prisma } from "@forge-ai/db";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const existing = await prisma.membership.findFirst({
    where: { userId: session.user.id },
    include: { workspace: true },
  });
  if (existing) {
    return NextResponse.json({ workspace: existing.workspace });
  }
  let workspaceName: string | undefined;
  try {
    const body = (await req.json()) as { name?: string };
    workspaceName = body?.name?.trim();
  } catch {
    // no body
  }
  const fallback = session.user.name
    ? `${session.user.name}'s workspace`
    : "My workspace";
  const finalName = workspaceName && workspaceName.length >= 2 ? workspaceName : fallback;
  const base = finalName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
  let slug = base || `ws-${Date.now()}`;
  let i = 1;
  while (await prisma.workspace.findUnique({ where: { slug } })) {
    slug = `${base}-${i++}`;
  }
  const workspace = await prisma.workspace.create({
    data: {
      name: finalName,
      slug,
      memberships: { create: { userId: session.user.id, role: "OWNER" } },
    },
  });
  return NextResponse.json({ workspace });
}
