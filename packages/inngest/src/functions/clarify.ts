import { inngest } from "../index";

export const clarifyFeatureRequest = inngest.createFunction(
  { id: "feature-clarify" },
  { event: "feature/clarify.requested" },
  async ({ event }: { event: { data: { featureRequestId: string } } }) => ({ ok: true, featureRequestId: event.data.featureRequestId })
);
