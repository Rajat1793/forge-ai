import { inngest } from "../index";

export const reviewPullRequest = inngest.createFunction(
  { id: "pr-ai-review" },
  { event: "pr/review.requested" },
  async ({ event }: { event: { data: { pullRequestId: string } } }) => ({ ok: true, pullRequestId: event.data.pullRequestId })
);
