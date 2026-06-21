import { EVENTS, inngest } from "../client";

export const generatePrd = inngest.createFunction(
  { id: "prd-generate", name: "Generate PRD" },
  { event: EVENTS.PRD_GENERATE },
  async ({ event }) => ({ ok: true, featureId: (event.data as { featureId: string }).featureId }),
);
