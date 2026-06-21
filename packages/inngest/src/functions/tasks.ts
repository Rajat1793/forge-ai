import { inngest } from "../index";

export const generateTasks = inngest.createFunction(
  { id: "tasks-generate" },
  { event: "tasks/generate.requested" },
  async ({ event }: { event: { data: { featureRequestId: string } } }) => ({ ok: true, featureRequestId: event.data.featureRequestId })
);
