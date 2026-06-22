import { router } from "./trpc";
import { workspaceRouter } from "./routers/workspace";
import { projectRouter } from "./routers/project";
import { featureRouter } from "./routers/feature";
import { prdRouter } from "./routers/prd";

export const appRouter = router({
  workspace: workspaceRouter,
  project: projectRouter,
  feature: featureRouter,
  prd: prdRouter,
});

export type AppRouter = typeof appRouter;
