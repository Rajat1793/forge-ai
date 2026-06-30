import { generateObject } from "ai";
import { z } from "zod";
import { logActivity, notifyWorkspace, prisma } from "@forge-ai/db";
import { cheapModel, hasAIKey } from "@forge-ai/ai";

import { EVENTS, inngest } from "../client";

const clarifySchema = z.object({
  decision: z.enum(["NEEDS_INFO", "READY_FOR_PRD", "DUPLICATE"]),
  question: z.string().describe("The single next clarifying question to ask. Empty unless decision is NEEDS_INFO."),
  reasoning: z.string(),
});

// Keep discovery short and low-friction: ask at most a question or two, then move on.
const MAX_QUESTIONS = 2;

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

    const askedCount = feature.clarifyMessages.filter((m) => m.author === "AI").length;

    const result = await step.run("ai-decide", async () => {
      if (!hasAIKey()) {
        return {
          decision: "READY_FOR_PRD" as const,
          question: "",
          reasoning: "AI key not configured — proceeding without clarification.",
        };
      }
      if (askedCount >= MAX_QUESTIONS) {
        return {
          decision: "READY_FOR_PRD" as const,
          question: "",
          reasoning: "Reached the clarifying-question limit — proceeding to PRD.",
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
          "Your goal is to reach a PRD as fast as possible with minimal friction for the requester. " +
          "Only ask a clarifying question when it is genuinely blocking — i.e. you truly cannot draft a sensible PRD without the answer. " +
          "Strongly prefer making reasonable, stated assumptions over asking. Never ask about nice-to-haves, edge cases, or anything you can reasonably infer. " +
          "Ask at most one short question at a time, and never repeat anything already asked or answered. " +
          "As soon as you can write a useful PRD (assumptions are fine), decide READY_FOR_PRD with an empty question. " +
          "If it clearly duplicates existing work, decide DUPLICATE.",
        prompt: `Feature: ${feature.title}\n\nDescription:\n${feature.description}\n\nConversation so far:\n${transcript || "(none)"}`,
      });
      return object;
    });

    const question = result.question?.trim() ?? "";

    if (result.decision === "NEEDS_INFO" && question.length > 0) {
      await step.run("post-question", () =>
        prisma.clarifyMessage.create({
          data: { featureId, author: "AI", body: question },
        }),
      );
      await step.run("notify-question", () =>
        notifyWorkspace(prisma, {
          workspaceId: feature.workspaceId,
          featureId,
          type: "CLARIFY_QUESTION",
          title: `New question: ${feature.title}`,
          body: question,
        }),
      );
      await step.run("log-question", () =>
        logActivity(prisma, {
          workspaceId: feature.workspaceId,
          featureId,
          type: "CLARIFY_QUESTION",
          message: `Forge AI asked: "${question}"`,
        }),
      );
    } else if (result.decision === "DUPLICATE") {
      await step.run("mark-duplicate", () =>
        prisma.featureRequest.update({
          where: { id: featureId },
          data: { status: "DUPLICATE" },
        }),
      );
    } else {
      // READY_FOR_PRD, or NEEDS_INFO with no concrete question to ask.
      await step.run("mark-ready", () =>
        prisma.featureRequest.update({
          where: { id: featureId },
          data: { status: "READY_FOR_PRD" },
        }),
      );
    }

    return { featureId, ...result };
  },
);
