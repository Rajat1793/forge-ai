import { auth, type Session } from "@forge-ai/auth";
import { prisma } from "@forge-ai/db";

export interface CreateContextOptions {
  headers: Headers;
}

export async function createTRPCContext({ headers }: CreateContextOptions) {
  const session: Session | null = await auth.api
    .getSession({ headers })
    .catch(() => null);

  return {
    prisma,
    headers,
    session,
    user: session?.user ?? null,
  };
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;
