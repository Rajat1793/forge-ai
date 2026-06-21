import { inngest } from "../index";

export const generatePrd = inngest.createFunction(
  { id: "prd-generate" },
  { event: "prd/generate.requested" },
  async ({ event }: { event: { data: { featureRequestId: string } } }) => ({ ok: true, featureRequestId: event.data.featureRequestId })
);
