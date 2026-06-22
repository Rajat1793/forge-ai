import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createGitHubClient, hasGitHubAuth, listRepos } from "@forge-ai/github";

import { router, workspaceProcedure } from "../trpc";

export const repositoryRouter = router({
  list: workspaceProcedure
    .input(z.object({ workspaceSlug: z.string() }))
    .query(({ ctx }) =>
      ctx.prisma.repository.findMany({
        where: { workspaceId: ctx.workspace.id },
        orderBy: { installedAt: "desc" },
      }),
    ),

  available: workspaceProcedure
    .input(z.object({ workspaceSlug: z.string() }))
    .query(async () => {
      if (!hasGitHubAuth()) return [];
      try {
        const client = createGitHubClient();
        return await listRepos(client);
      } catch {
        return [];
      }
    }),

  connect: workspaceProcedure
    .input(
      z.object({
        workspaceSlug: z.string(),
        githubId: z.number().int(),
        owner: z.string(),
        name: z.string(),
        defaultBranch: z.string().default("main"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.repository.findUnique({
        where: { owner_name: { owner: input.owner, name: input.name } },
      });
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Repository already connected" });
      }
      return ctx.prisma.repository.create({
        data: {
          workspaceId: ctx.workspace.id,
          githubId: BigInt(input.githubId),
          owner: input.owner,
          name: input.name,
          defaultBranch: input.defaultBranch,
        },
      });
    }),

  disconnect: workspaceProcedure
    .input(z.object({ workspaceSlug: z.string(), id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const repo = await ctx.prisma.repository.findFirst({
        where: { id: input.id, workspaceId: ctx.workspace.id },
      });
      if (!repo) throw new TRPCError({ code: "NOT_FOUND" });
      await ctx.prisma.repository.delete({ where: { id: repo.id } });
      return { ok: true };
    }),
});
