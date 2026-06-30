import { generateObject } from "ai";

import { logActivity, notifyWorkspace, prisma } from "@forge-ai/db";
import {
  codeDraftSchema,
  draftReviewSchema,
  hasAIKey,
  heavyModel,
  type CodeDraftPayload,
  type DraftReviewPayload,
} from "@forge-ai/ai";

import { EVENTS, inngest } from "../client";

const fallbackDraft = (title: string): CodeDraftPayload => ({
  summary: `Scaffolding for "${title}". Add MISTRAL_API_KEY for a full AI-generated diff.`,
  filesChanged: 1,
  diff:
    `--- a/README.md\n+++ b/README.md\n@@\n+ ## ${title}\n+ Implementation pending.\n`,
});

const fallbackReview = (): DraftReviewPayload => ({
  overallSummary:
    "AI review skipped — no MISTRAL_API_KEY configured. Queued for human review.",
  prdCoverageScore: 0.5,
  readyForHuman: true,
  issues: [],
});

export const generateCode = inngest.createFunction(
  {
    id: "code-generate",
    name: "Generate code draft",
    // Surface failures quickly instead of letting the feature sit in
    // "In review" through the default 4 retries.
    retries: 1,
    // Let the user stop a run: a matching cancel event for the same feature
    // halts the function mid-flight.
    cancelOn: [
      {
        event: EVENTS.CODE_CANCEL,
        if: "event.data.featureId == async.data.featureId",
      },
    ],
    // If every attempt fails, don't leave the feature stuck in "In review" —
    // reset it so the action buttons come back, and tell the user why.
    onFailure: async ({ event, step }) => {
      const original = (
        event.data as { event?: { data?: { featureId?: string } } }
      ).event;
      const featureId = original?.data?.featureId;
      if (!featureId) return;
      await step.run("reset-after-failure", async () => {
        const feature = await prisma.featureRequest.findUnique({
          where: { id: featureId },
          include: { codeDrafts: { select: { id: true }, take: 1 } },
        });
        if (!feature || feature.status !== "IN_REVIEW") return;
        await prisma.featureRequest.update({
          where: { id: featureId },
          data: {
            status: feature.codeDrafts.length > 0 ? "READY_FOR_HUMAN" : "PLAN_APPROVED",
          },
        });
        await prisma.clarifyMessage.create({
          data: {
            featureId,
            author: "AI",
            body: "Code generation failed and was stopped. You can try generating again.",
          },
        });
      });
    },
  },
  { event: EVENTS.CODE_GENERATE },
  async ({ event, step }) => {
    const featureId = (event.data as { featureId: string }).featureId;

    const feature = await step.run("load", () =>
      prisma.featureRequest.findUnique({
        where: { id: featureId },
        include: {
          tasks: { orderBy: { position: "asc" } },
          prds: {
            include: { versions: { orderBy: { version: "desc" }, take: 1 } },
            take: 1,
          },
        },
      }),
    );
    if (!feature) return { skipped: true, reason: "not-found" };

    // Progress: surface what's happening in the thread as we go.
    await step.run("progress-drafting", () =>
      prisma.clarifyMessage.create({
        data: {
          featureId: feature.id,
          author: "AI",
          body: `Drafting the implementation from ${feature.tasks.length} task(s)…`,
        },
      }),
    );

    const version = feature.prds[0]?.versions[0] ?? null;

    const draft = await step.run("ai-generate-code", async () => {
      if (!hasAIKey()) return fallbackDraft(feature.title);
      const tasksList = feature.tasks
        .map((t) => `- [${t.type}] ${t.title}: ${t.description}`)
        .join("\n");
      const prdContext = version
        ? `Problem: ${version.problemStatement}\nGoals:\n- ${version.goals.join("\n- ")}`
        : "No PRD.";
      const { object } = await generateObject({
        model: heavyModel(),
        schema: codeDraftSchema,
        system:
          "You are a senior engineer implementing a feature. Produce a realistic " +
          "unified diff (git patch) that implements the tasks against a typical " +
          "web codebase. Keep it focused and correct.",
        prompt: `Feature: ${feature.title}\n\n${prdContext}\n\nTasks:\n${tasksList}`,
      });
      return object;
    });

    await step.run("progress-reviewing", () =>
      prisma.clarifyMessage.create({
        data: {
          featureId: feature.id,
          author: "AI",
          body: `Draft ready (${draft.filesChanged} file(s) changed). Reviewing it against the PRD…`,
        },
      }),
    );

    const review = await step.run("ai-review-code", async () => {
      if (!hasAIKey()) return fallbackReview();
      const prdContext = version
        ? `Problem: ${version.problemStatement}\n\nAcceptance criteria:\n${JSON.stringify(
            version.acceptanceCriteria,
            null,
            2,
          )}`
        : "No linked PRD.";
      const { object } = await generateObject({
        model: heavyModel(),
        schema: draftReviewSchema,
        system:
          "You are a meticulous senior engineer reviewing a proposed code diff " +
          "against its PRD. Flag PRD-coverage gaps, security, performance, and " +
          "quality issues. Be concise.",
        prompt: `PRD context:\n${prdContext}\n\nProposed diff:\n${draft.diff.slice(0, 6000)}`,
      });
      return object;
    });

    const saved = await step.run("persist", async () => {
      const created = await prisma.codeDraft.create({
        data: {
          featureId: feature.id,
          summary: draft.summary,
          diff: draft.diff,
          filesChanged: draft.filesChanged,
          reviewSummary: review.overallSummary,
          coverageScore: review.prdCoverageScore,
          readyForHuman: review.readyForHuman,
          issues: {
            create: review.issues.map((i) => ({
              severity: i.severity,
              category: i.category,
              title: i.title,
              description: i.description,
              file: i.file ?? null,
              suggestion: i.suggestion ?? null,
            })),
          },
        },
      });
      const hasBlocking = review.issues.some((i) => i.severity === "BLOCKING");
      await prisma.featureRequest.update({
        where: { id: feature.id },
        data: { status: hasBlocking ? "FIX_NEEDED" : "READY_FOR_HUMAN" },
      });
      return { draftId: created.id, hasBlocking };
    });

    await step.run("notify", () =>
      notifyWorkspace(prisma, {
        workspaceId: feature.workspaceId,
        featureId: feature.id,
        type: saved.hasBlocking ? "REVIEW_BLOCKING" : "READY_FOR_HUMAN",
        title: saved.hasBlocking
          ? `Review found blocking issues: ${feature.title}`
          : `Ready for your review: ${feature.title}`,
        body: review.overallSummary,
      }),
    );

    await step.run("log", () =>
      logActivity(prisma, {
        workspaceId: feature.workspaceId,
        featureId: feature.id,
        type: saved.hasBlocking ? "REVIEW_BLOCKING" : "CODE_GENERATED",
        message: saved.hasBlocking
          ? `Code draft generated with blocking review issues`
          : `Code draft generated and passed AI review`,
      }),
    );

    return { featureId, ...saved };
  },
);
