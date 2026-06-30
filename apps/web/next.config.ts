import type { NextConfig } from "next";
import { PrismaPlugin } from "@prisma/nextjs-monorepo-workaround-plugin";

const nextConfig: NextConfig = {
  experimental: {
    typedRoutes: false,
  },
  transpilePackages: [
    "@forge-ai/ai",
    "@forge-ai/api",
    "@forge-ai/auth",
    "@forge-ai/billing",
    "@forge-ai/db",
    "@forge-ai/github",
    "@forge-ai/inngest",
  ],
  // Prisma is imported through the transpiled @forge-ai/db workspace package,
  // so Next bundles it into the server chunks. This official plugin copies the
  // native query-engine binary (libquery_engine-debian-openssl-3.0.x.so.node)
  // next to the bundle so it resolves at runtime on Render.
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins = [...config.plugins, new PrismaPlugin()];
    }
    return config;
  },
};

export default nextConfig;
