import { router } from "./trpc";
import { workspaceRouter } from "./routers/workspace";
import { projectRouter } from "./routers/project";
import { featureRouter } from "./routers/feature";

export const appRouter = router({
  workspace: workspaceRouter,
  project: projectRouter,
  feature: featureRouter,
});

export type AppRouter = typeof appRouter;
