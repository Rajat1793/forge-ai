import { clarifyFeatureRequest } from "./functions/clarify";
import { generatePrd } from "./functions/prd";
import { generateTasks } from "./functions/tasks";
import { generateCode } from "./functions/codegen";
import { reviewPullRequest } from "./functions/review";
import { releaseFeature } from "./functions/release";

export { inngest, EVENTS } from "./client";

export const functions = [
  clarifyFeatureRequest,
  generatePrd,
  generateTasks,
  generateCode,
  reviewPullRequest,
  releaseFeature,
];
