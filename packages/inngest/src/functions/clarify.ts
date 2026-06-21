import { generateObject } from "ai";
import { z } from "zod";
import { prisma } from "@forge-ai/db";
import { cheapModel, hasAIKey } from "@forge-ai/ai";

import { EVENTS, inngest } from "../client";

const clarifySchema = z.object({
  decision: z.enum(["NEEDS_INFO", "READY_FOR_PRD", "DUPLICATE"]),
  questions: z.array(z.string()).max(5),
  reasoning: z.string(),
});

export const clarifyFeatureRequest = inngest.createFunction(
  { id: "feature-clarify", name: "Clarify feature request" },
  { event: EVENTS.FEATURE_CLARIFY },
  async ({ event, step }) => {
    const featureId = (event.data as { featureId: string }).featureId;

    const feature = await step.run("load-feature", async () =>
      prisma.featureRequest.findUnique({
        where: { id: featureId },
        include: { clarifyMessages: { orderBy: { createdAt: "asc" } } },
      }),
    );
    if (!feature) return { skipped: true, reason: "not-found" };

    await step.run("mark-clarifying", () =>
      prisma.featureRequest.update({
        where: { id: featureId },
        data: { status: "CLARIFYING" },
      }),
    );

    const result = await step.run("ai-decide", async () => {
      if (!hasAIKey()) {
        return {
          decision: "READY_FOR_PRD" as const,
          questions: [],
          reasoning: "AI key not configured — proceeding without clarification.",
        };
      }
      const transcript = feature.clarifyMessages
        .map((m) => `${m.author}: ${m.body}`)
        .join("\n");
      const { object } = await generateObject({
        model: cheapModel(),
        schema: clarifySchema,
        system:
          "You are a senior product manager triaging an incoming feature request. " +
          "Decide if it needs clarifying questions, is ready for a PRD, or is a duplicate.",
        prompt: `Feature: ${feature.title}\n\nDescription:\n${feature.description}\n\nConversation so far:\n${transcript || "(none)"}`,
      });
      return object;
    });

    if (result.decision === "NEEDS_INFO" && result.questions.length > 0) {
      await step.run("post-questions", () =>
        prisma.$transaction([
          ...result.questions.map((q) =>
            prisma.clarifyMessage.create({
              data: { featureId, author: "AI", body: q },
            }),
          ),
        ]),
      );
    } else if (result.decision === "READY_FOR_PRD") {
      await step.run("mark-ready", () =>
        prisma.featureRequest.update({
          where: { id: featureId },
          data: { status: "READY_FOR_PRD" },
        }),
      );
    } else if (result.decision === "DUPLICATE") {
      await step.run("mark-duplicate", () =>
        prisma.featureRequest.update({
          where: { id: featureId },
          data: { status: "DUPLICATE" },
        }),
      );
    }

    return { featureId, ...result };
  },
);
