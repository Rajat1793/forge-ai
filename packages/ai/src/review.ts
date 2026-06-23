import { z } from "zod";

export const reviewSeverityEnum = z.enum(["BLOCKING", "NON_BLOCKING"]);
export const reviewCategoryEnum = z.enum([
  "PRD",
  "SECURITY",
  "PERFORMANCE",
  "EDGE_CASE",
  "QUALITY",
]);

export const reviewIssueSchema = z.object({
  severity: reviewSeverityEnum,
  category: reviewCategoryEnum,
  title: z.string().min(3).max(140),
  description: z.string().min(10),
  file: z.string().nullable().optional(),
  line: z.number().int().min(1).nullable().optional(),
  suggestion: z.string().nullable().optional(),
});

export const reviewResultSchema = z.object({
  overallSummary: z.string().min(20),
  prdCoverageScore: z.number().min(0).max(1),
  readyForHumanReview: z.boolean(),
  issues: z.array(reviewIssueSchema).max(20),
});

export type ReviewResult = z.infer<typeof reviewResultSchema>;
export type ReviewIssue = z.infer<typeof reviewIssueSchema>;
