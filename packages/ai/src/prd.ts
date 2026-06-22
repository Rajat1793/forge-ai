import { z } from "zod";

export const userStorySchema = z.object({
  persona: z.string(),
  iWant: z.string(),
  soThat: z.string(),
});

export const acceptanceCriterionSchema = z.object({
  given: z.string(),
  when: z.string(),
  then: z.string(),
});

export const prdSchema = z.object({
  problemStatement: z.string().min(20),
  goals: z.array(z.string()).min(1).max(6),
  nonGoals: z.array(z.string()).max(6).default([]),
  userStories: z.array(userStorySchema).min(1).max(8),
  acceptanceCriteria: z.array(acceptanceCriterionSchema).min(1).max(12),
  edgeCases: z.array(z.string()).max(10).default([]),
  successMetrics: z.array(z.string()).min(1).max(6),
});

export type PRDPayload = z.infer<typeof prdSchema>;
export type UserStory = z.infer<typeof userStorySchema>;
export type AcceptanceCriterion = z.infer<typeof acceptanceCriterionSchema>;
