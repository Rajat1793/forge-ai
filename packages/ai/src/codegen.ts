import { generateText } from "ai";
import { z } from "zod";

import { hasAIKey, heavyModel } from "./models";
import { reviewCategoryEnum, reviewSeverityEnum } from "./review";

// -----------------------------------------------------------------------------
// AI-generated code drafts (unified diff, reviewed in-app, no GitHub push)
// -----------------------------------------------------------------------------

export const codeDraftSchema = z.object({
  summary: z.string().min(10).describe("One-paragraph summary of the implementation approach."),
  filesChanged: z.number().int().min(0).max(100),
  diff: z
    .string()
    .min(1)
    .describe("A unified diff (git patch format) implementing the tasks."),
});
export type CodeDraftPayload = z.infer<typeof codeDraftSchema>;

export const draftIssueSchema = z.object({
  severity: reviewSeverityEnum,
  category: reviewCategoryEnum,
  title: z.string().min(3).max(140),
  description: z.string().min(10),
  file: z.string().nullable().optional(),
  suggestion: z.string().nullable().optional(),
});

export const draftReviewSchema = z.object({
  overallSummary: z.string().min(20),
  prdCoverageScore: z.number().min(0).max(1),
  readyForHuman: z.boolean(),
  issues: z.array(draftIssueSchema).max(20),
});
export type DraftReviewPayload = z.infer<typeof draftReviewSchema>;

/** Generate a concrete suggested fix for a single review issue, on demand. */
export async function suggestIssueFix(input: {
  issueTitle: string;
  issueDescription: string;
  file?: string | null;
  diff?: string;
  prdContext?: string;
}): Promise<string> {
  if (!hasAIKey()) {
    return "AI key not configured — add MISTRAL_API_KEY to generate a suggested fix.";
  }
  const { text } = await generateText({
    model: heavyModel(),
    system:
      "You are a senior engineer. Given a code review issue, propose a concrete, " +
      "minimal fix. Respond with a one-line explanation followed by a code snippet " +
      "or unified diff when helpful. Keep it short.",
    prompt:
      `Issue: ${input.issueTitle}\n\nDetails: ${input.issueDescription}\n` +
      `${input.file ? `File: ${input.file}\n` : ""}` +
      `${input.prdContext ? `\nPRD context:\n${input.prdContext}\n` : ""}` +
      `${input.diff ? `\nRelevant diff:\n${input.diff.slice(0, 3000)}` : ""}`,
  });
  return text;
}

/** Generate Markdown release notes from the PRD + delivered tasks. */
export async function generateReleaseNotes(input: {
  title: string;
  problemStatement?: string;
  goals?: string[];
  tasks?: { title: string; type: string }[];
}): Promise<string> {
  if (!hasAIKey()) {
    return `## ${input.title}\n\nShipped via Forge AI.`;
  }
  const { text } = await generateText({
    model: heavyModel(),
    system:
      "You write concise, friendly product release notes in Markdown. " +
      "Start with a one-sentence intro, then a bulleted \"What's new\" list. No fluff.",
    prompt:
      `Feature: ${input.title}\n` +
      `Problem: ${input.problemStatement ?? ""}\n` +
      `Goals:\n- ${(input.goals ?? []).join("\n- ")}\n` +
      `Tasks delivered:\n${(input.tasks ?? [])
        .map((t) => `- [${t.type}] ${t.title}`)
        .join("\n")}`,
  });
  return text;
}
