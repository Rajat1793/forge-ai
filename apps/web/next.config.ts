import type { NextConfig } from "next";

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
};

export default nextConfig;
