import { router } from "./trpc";
import { workspaceRouter } from "./routers/workspace";
import { projectRouter } from "./routers/project";
import { featureRouter } from "./routers/feature";
import { prdRouter } from "./routers/prd";
import { taskRouter } from "./routers/task";
import { repositoryRouter } from "./routers/repository";
import { pullRequestRouter } from "./routers/pull-request";

export const appRouter = router({
  workspace: workspaceRouter,
  project: projectRouter,
  feature: featureRouter,
  prd: prdRouter,
  task: taskRouter,
  repository: repositoryRouter,
  pullRequest: pullRequestRouter,
});

export type AppRouter = typeof appRouter;
