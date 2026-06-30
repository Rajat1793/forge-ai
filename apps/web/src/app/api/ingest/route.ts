import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

import { logActivity, prisma } from "@forge-ai/db";
import { EVENTS, inngest } from "@forge-ai/inngest";

export const dynamic = "force-dynamic";

type IngestBody = {
  workspaceSlug?: string;
  title?: string;
  description?: string;
  source?: "EMAIL" | "TICKET" | "CALL" | "MANUAL";
  projectId?: string;
};

function secretMatches(provided: string | null): boolean {
  const expected = process.env.INGEST_SECRET;
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Inbound feature ingestion from external systems (email parsers, ticketing,
 * call transcribers). Authenticated with a shared secret header so it can be
 * wired to Zapier/Make/n8n or a mail webhook. Creates a feature request and
 * kicks off AI discovery — exactly like the in-app form.
 *
 * Example:
 *   POST /api/ingest
 *   x-forge-ingest-secret: <INGEST_SECRET>
 *   { "workspaceSlug": "acme", "title": "...", "description": "...", "source": "TICKET" }
 */
export async function POST(req: Request) {
  if (!process.env.INGEST_SECRET) {
    return NextResponse.json(
      { ok: false, error: "ingestion-not-configured" },
      { status: 503 },
    );
  }
  if (!secretMatches(req.headers.get("x-forge-ingest-secret"))) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: IngestBody;
  try {
    body = (await req.json()) as IngestBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid-json" }, { status: 400 });
  }

  const title = body.title?.trim();
  const description = body.description?.trim();
  if (!body.workspaceSlug || !title || title.length < 4 || !description || description.length < 10) {
    return NextResponse.json(
      { ok: false, error: "workspaceSlug, title (>=4) and description (>=10) required" },
      { status: 422 },
    );
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug: body.workspaceSlug },
    select: { id: true },
  });
  if (!workspace) {
    return NextResponse.json({ ok: false, error: "workspace-not-found" }, { status: 404 });
  }

  let projectId = body.projectId;
  if (projectId) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, workspaceId: workspace.id },
      select: { id: true },
    });
    if (!project) projectId = undefined;
  }
  if (!projectId) {
    const project = await prisma.project.findFirst({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    projectId =
      project?.id ??
      (
        await prisma.project.create({
          data: {
            workspaceId: workspace.id,
            name: "Inbound",
            description: "Auto-created for ingested requests",
          },
        })
      ).id;
  }

  const feature = await prisma.featureRequest.create({
    data: {
      workspaceId: workspace.id,
      projectId,
      title,
      description,
      source: body.source ?? "TICKET",
      status: "NEW",
    },
  });

  await inngest.send({
    name: EVENTS.FEATURE_CLARIFY,
    data: { featureId: feature.id },
  });
  await logActivity(prisma, {
    workspaceId: workspace.id,
    featureId: feature.id,
    type: "FEATURE_CREATED",
    message: `Ingested "${title}" via ${body.source ?? "TICKET"}`,
  });

  return NextResponse.json({ ok: true, featureId: feature.id });
}
