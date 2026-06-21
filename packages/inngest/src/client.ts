import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: process.env.INNGEST_APP_ID ?? "forge-ai",
  eventKey: process.env.INNGEST_EVENT_KEY,
});

// Strongly-typed event names emitted across the system.
export const EVENTS = {
  FEATURE_CLARIFY: "feature/clarify.requested",
  PRD_GENERATE: "prd/generate.requested",
  TASKS_GENERATE: "tasks/generate.requested",
  PR_REVIEW: "pr/ai_review.requested",
  RELEASE_SHIP: "release/ship.requested",
} as const;
