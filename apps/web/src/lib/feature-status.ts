import type { FeatureRequestStatus } from "@forge-ai/db";

export const statusLabel: Record<FeatureRequestStatus, string> = {
  NEW: "New",
  CLARIFYING: "Clarifying",
  READY_FOR_PRD: "Ready for PRD",
  PRD_DRAFT: "PRD draft",
  PRD_APPROVED: "PRD approved",
  TASKS_PLANNED: "Tasks planned",
  PLAN_APPROVED: "Plan approved",
  IN_PROGRESS: "In progress",
  IN_REVIEW: "In review",
  FIX_NEEDED: "Fix needed",
  READY_FOR_HUMAN: "Ready for human",
  APPROVED: "Approved",
  SHIPPED: "Shipped",
  REJECTED: "Rejected",
  DUPLICATE: "Duplicate",
};

export function statusVariant(
  s: FeatureRequestStatus,
): "default" | "info" | "warning" | "success" | "danger" | "outline" {
  switch (s) {
    case "NEW":
    case "CLARIFYING":
      return "info";
    case "READY_FOR_PRD":
    case "PRD_DRAFT":
    case "PRD_APPROVED":
    case "TASKS_PLANNED":
    case "PLAN_APPROVED":
    case "IN_PROGRESS":
    case "IN_REVIEW":
      return "default";
    case "FIX_NEEDED":
      return "warning";
    case "READY_FOR_HUMAN":
    case "APPROVED":
      return "success";
    case "SHIPPED":
      return "success";
    case "REJECTED":
    case "DUPLICATE":
      return "danger";
    default:
      return "outline";
  }
}
