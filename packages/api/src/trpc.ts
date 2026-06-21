import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import type { Context } from "./context";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const middleware = t.middleware;
export const publicProcedure = t.procedure;

const isAuthed = middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in required" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const protectedProcedure = t.procedure.use(isAuthed);

const inWorkspace = middleware(async ({ ctx, next, getRawInput }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in required" });
  }
  const rawInput = (await getRawInput()) as
    | { workspaceSlug?: string; workspaceId?: string }
    | undefined;
  const slug = rawInput?.workspaceSlug;
  const id = rawInput?.workspaceId;

  if (!slug && !id) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "workspaceSlug or workspaceId required",
    });
  }

  const workspace = await ctx.prisma.workspace.findFirst({
    where: slug ? { slug } : { id },
    include: {
      memberships: { where: { userId: ctx.user.id } },
    },
  });

  if (!workspace) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Workspace not found" });
  }
  const membership = workspace.memberships[0];
  if (!membership) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Not a member" });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      workspace,
      membership,
      role: membership.role,
    },
  });
});

export const workspaceProcedure = t.procedure.use(inWorkspace);
