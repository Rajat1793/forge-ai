import { EVENTS, inngest } from "../client";

export const reviewPullRequest = inngest.createFunction(
  { id: "pr-ai-review", name: "Run AI review on pull request" },
  { event: EVENTS.PR_REVIEW },
  async ({ event }) => ({
    ok: true,
    pullRequestId: (event.data as { pullRequestId: string }).pullRequestId,
  }),
);
