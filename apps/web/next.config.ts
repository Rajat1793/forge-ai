import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    typedRoutes: false,
  },
  // Keep Prisma out of the server bundle so its native query-engine binary
  // stays next to the client in node_modules at runtime (otherwise Render
  // throws "could not locate the Query Engine for runtime debian-openssl-3.0.x").
  serverExternalPackages: ["@prisma/client", ".prisma/client", "prisma"],
  transpilePackages: [
    "@forge-ai/ai",
    "@forge-ai/api",
    "@forge-ai/auth",
    "@forge-ai/billing",
    "@forge-ai/db",
    "@forge-ai/github",
    "@forge-ai/inngest",
  ],
};

export default nextConfig;
