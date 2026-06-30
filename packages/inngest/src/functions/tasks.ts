import { generateObject } from "ai";

import { notifyWorkspace, prisma } from "@forge-ai/db";
import { hasAIKey, heavyModel, taskBreakdownSchema, type TaskBreakdown } from "@forge-ai/ai";

import { EVENTS, inngest } from "../client";

const fallback = (title: string): TaskBreakdown => ({
  tasks: [
    {
      title: `Implement ${title}`,
      description: "Implementation work for the feature.",
      type: "BE",
      estimateHours: 4,
      acceptanceCriteria: ["Behavior matches the PRD"],
    },
    {
      title: `Write tests for ${title}`,
      description: "Add unit and integration test coverage.",
      type: "QA",
      estimateHours: 2,
      acceptanceCriteria: ["All acceptance criteria are covered by tests"],
    },
  ],
});

export const generateTasks = inngest.createFunction(
  { id: "tasks-generate", name: "Generate tasks" },
  { event: EVENTS.TASKS_GENERATE },
  async ({ event, step }) => {
    const featureId = (event.data as { featureId: string }).featureId;

    const data = await step.run("load", () =>
      prisma.featureRequest.findUnique({
        where: { id: featureId },
        include: {
          prds: {
            include: { versions: { orderBy: { version: "desc" }, take: 1 } },
            take: 1,
          },
        },
      }),
    );
    if (!data) return { skipped: true };
    const prd = data.prds[0];
    const version = prd?.versions[0];
    if (!prd || !version) return { skipped: true, reason: "no-prd" };

    const breakdown = await step.run("ai-breakdown", async () => {
      if (!hasAIKey()) return fallback(data.title);
      const { object } = await generateObject({
        model: heavyModel(),
        schema: taskBreakdownSchema,
        system:
          "You are a tech lead breaking a PRD into shippable engineering tasks. " +
          "Split by layer (FE/BE/INFRA/QA). Keep tasks small (<= 8 hours).",
        prompt:
          `Feature: ${data.title}\n\nProblem: ${version.problemStatement}\n\n` +
          `Goals:\n- ${version.goals.join("\n- ")}\n\n` +
          `Acceptance criteria:\n${JSON.stringify(version.acceptanceCriteria, null, 2)}`,
      });
      return object;
    });

    const result = await step.run("persist", async () => {
      // Replace existing BACKLOG tasks for this PRD so regenerating is idempotent.
      await prisma.task.deleteMany({
        where: { featureId: data.id, status: "BACKLOG" },
      });
      const created = await Promise.all(
        breakdown.tasks.map((t, i) =>
          prisma.task.create({
            data: {
              featureId: data.id,
              prdId: prd.id,
              title: t.title,
              description: t.description,
              type: t.type,
              estimateHours: t.estimateHours,
              acceptanceCriteria: t.acceptanceCriteria,
              position: i,
            },
          }),
        ),
      );
      await prisma.featureRequest.update({
        where: { id: data.id },
        data: { status: "IN_PROGRESS" },
      });
      return { count: created.length };
    });

    await step.run("notify", () =>
      notifyWorkspace(prisma, {
        workspaceId: data.workspaceId,
        featureId: data.id,
        type: "TASKS_READY",
        title: `Tasks planned: ${data.title}`,
        body: `${result.count} tasks were generated. You can refine them, then generate code.`,
      }),
    );

    return { featureId, ...result };
  },
);
