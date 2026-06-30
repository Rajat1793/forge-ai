import { generateObject } from "ai";

import { logActivity, notifyWorkspace, prisma } from "@forge-ai/db";
import { heavyModel, hasAIKey, prdSchema, type PRDPayload } from "@forge-ai/ai";

import { EVENTS, inngest } from "../client";

const fallbackPrd = (title: string, description: string): PRDPayload => ({
  problemStatement: `We need to deliver: ${title}. Context: ${description.slice(0, 240)}`,
  goals: ["Ship the feature end-to-end", "Maintain delivery quality bar"],
  nonGoals: ["Address unrelated tech debt"],
  userStories: [
    {
      persona: "End user",
      iWant: title,
      soThat: "I get the described value",
    },
  ],
  acceptanceCriteria: [
    {
      given: "The feature is shipped",
      when: "A user exercises the primary flow",
      then: "It works as described in the request",
    },
  ],
  edgeCases: [],
  successMetrics: ["Feature usage > 0 within 7 days of launch"],
});

export const generatePrd = inngest.createFunction(
  { id: "prd-generate", name: "Generate PRD" },
  { event: EVENTS.PRD_GENERATE },
  async ({ event, step }) => {
    const featureId = (event.data as { featureId: string }).featureId;

    const feature = await step.run("load-feature", () =>
      prisma.featureRequest.findUnique({
        where: { id: featureId },
        include: { clarifyMessages: { orderBy: { createdAt: "asc" } } },
      }),
    );
    if (!feature) return { skipped: true, reason: "not-found" };

    const payload = await step.run("ai-generate", async () => {
      if (!hasAIKey()) return fallbackPrd(feature.title, feature.description);
      const transcript = feature.clarifyMessages
        .map((m) => `${m.author}: ${m.body}`)
        .join("\n");
      const { object } = await generateObject({
        model: heavyModel(),
        schema: prdSchema,
        system:
          "You are a senior product manager writing a clear, shippable PRD. " +
          "Use crisp language. Avoid filler. Cover edge cases.",
        prompt: `Title: ${feature.title}\n\nDescription:\n${feature.description}\n\nClarifying Q&A:\n${transcript || "(none)"}`,
      });
      return object;
    });

    const prd = await step.run("persist", async () => {
      const created = await prisma.pRD.upsert({
        where: { id: feature.id + ":prd" }, // sentinel for upsert (id collision-safe)
        // A freshly (re)generated draft is no longer approved — clear any prior
        // approval so the feature returns to a reviewable PRD_DRAFT state and the
        // "Approve PRD" action reappears.
        update: { approvedAt: null, approvedBy: null },
        create: { id: feature.id + ":prd", featureId: feature.id },
      });
      const lastVersion = await prisma.pRDVersion.findFirst({
        where: { prdId: created.id },
        orderBy: { version: "desc" },
      });
      const nextVersion = (lastVersion?.version ?? 0) + 1;
      await prisma.pRDVersion.create({
        data: {
          prdId: created.id,
          version: nextVersion,
          problemStatement: payload.problemStatement,
          goals: payload.goals,
          nonGoals: payload.nonGoals,
          userStories: payload.userStories,
          acceptanceCriteria: payload.acceptanceCriteria,
          edgeCases: payload.edgeCases,
          successMetrics: payload.successMetrics,
        },
      });
      await prisma.featureRequest.update({
        where: { id: feature.id },
        data: { status: "PRD_DRAFT" },
      });
      return { prdId: created.id, version: nextVersion };
    });

    await step.run("notify", () =>
      notifyWorkspace(prisma, {
        workspaceId: feature.workspaceId,
        featureId: feature.id,
        type: "PRD_READY",
        title: `PRD ready for review: ${feature.title}`,
        body: "A draft PRD has been generated and is ready for your review and approval.",
      }),
    );
    await step.run("log", () =>
      logActivity(prisma, {
        workspaceId: feature.workspaceId,
        featureId: feature.id,
        type: "PRD_GENERATED",
        message: `PRD v${prd.version} generated`,
      }),
    );

    return { featureId, ...prd };
  },
);
