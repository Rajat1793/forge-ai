import { EVENTS, inngest } from "../client";

export const releaseFeature = inngest.createFunction(
  { id: "feature-release", name: "Ship feature" },
  { event: EVENTS.RELEASE_SHIP },
  async ({ event }) => ({ ok: true, featureId: (event.data as { featureId: string }).featureId }),
);
