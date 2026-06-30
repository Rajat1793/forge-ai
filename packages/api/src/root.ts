import { router } from "./trpc";
import { workspaceRouter } from "./routers/workspace";
import { projectRouter } from "./routers/project";
import { featureRouter } from "./routers/feature";
import { prdRouter } from "./routers/prd";
import { taskRouter } from "./routers/task";
import { repositoryRouter } from "./routers/repository";
import { pullRequestRouter } from "./routers/pull-request";
import { reviewRouter } from "./routers/review";
import { approvalRouter } from "./routers/approval";
import { billingRouter } from "./routers/billing";
import { notificationRouter } from "./routers/notification";

export const appRouter = router({
  workspace: workspaceRouter,
  project: projectRouter,
  feature: featureRouter,
  prd: prdRouter,
  task: taskRouter,
  repository: repositoryRouter,
  pullRequest: pullRequestRouter,
  review: reviewRouter,
  approval: approvalRouter,
  billing: billingRouter,
  notification: notificationRouter,
});

export type AppRouter = typeof appRouter;
