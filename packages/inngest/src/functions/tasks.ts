import { EVENTS, inngest } from "../client";

export const generateTasks = inngest.createFunction(
  { id: "tasks-generate", name: "Generate tasks" },
  { event: EVENTS.TASKS_GENERATE },
  async ({ event }) => ({ ok: true, featureId: (event.data as { featureId: string }).featureId }),
);
