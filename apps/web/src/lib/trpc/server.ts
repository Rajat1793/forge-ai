import { cache } from "react";
import { headers as nextHeaders } from "next/headers";
import { appRouter, createTRPCContext } from "@forge-ai/api";

export const getServerCaller = cache(async () => {
  const ctx = await createTRPCContext({ headers: await nextHeaders() });
  return appRouter.createCaller(ctx);
});
