import { inngest } from "../index";

export const releaseFeature = inngest.createFunction(
  { id: "feature-release" },
  { event: "feature/release.requested" },
  async ({ event }: { event: { data: { featureRequestId: string } } }) => ({ ok: true, featureRequestId: event.data.featureRequestId })
);
