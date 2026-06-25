/**
 * Demo seed script.
 *
 * Usage:
 *   pnpm --filter @forge-ai/db db:seed
 *
 * Populates a single demo workspace ("Acme Inc") with a project, a sample
 * feature request, a clarifying thread, a PRD, tasks, a fake repository,
 * a pull request, and an AI review — enough to make the dashboard feel alive
 * in a demo without needing real GitHub/AI credentials.
 *
 * Safe to re-run — uses deterministic ids + upserts where possible.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_USER_ID = "demo_user_1";
const DEMO_WORKSPACE_ID = "demo_ws_acme";
const DEMO_PROJECT_ID = "demo_proj_portal";
const DEMO_FEATURE_ID = "demo_feat_dark_mode";
const DEMO_PRD_ID = "demo_prd_dark_mode";
const DEMO_REPO_ID = "demo_repo_acme_portal";
const DEMO_PR_ID = "demo_pr_412";
const DEMO_REVIEW_ID = "demo_review_412";

async function main() {
  console.log("→ Seeding demo data…");

  const user = await prisma.user.upsert({
    where: { id: DEMO_USER_ID },
    update: {},
    create: {
      id: DEMO_USER_ID,
      email: "demo@forge-ai.dev",
      name: "Demo Founder",
      emailVerified: true,
    },
  });

  const workspace = await prisma.workspace.upsert({
    where: { id: DEMO_WORKSPACE_ID },
    update: { name: "Acme Inc" },
    create: {
      id: DEMO_WORKSPACE_ID,
      slug: "acme",
      name: "Acme Inc",
      memberships: {
        create: { userId: user.id, role: "OWNER" },
      },
    },
  });

  const project = await prisma.project.upsert({
    where: { id: DEMO_PROJECT_ID },
    update: {},
    create: {
      id: DEMO_PROJECT_ID,
      workspaceId: workspace.id,
      name: "Customer Portal",
      description: "The main customer-facing dashboard.",
    },
  });

  const feature = await prisma.featureRequest.upsert({
    where: { id: DEMO_FEATURE_ID },
    update: {},
    create: {
      id: DEMO_FEATURE_ID,
      workspaceId: workspace.id,
      projectId: project.id,
      title: "Add dark mode toggle to customer portal",
      description:
        "Multiple customers have asked for a dark theme on the portal. " +
        "Should respect system preference by default and persist per user.",
      source: "EMAIL",
      status: "READY_FOR_HUMAN",
    },
  });

  await prisma.clarifyMessage.createMany({
    data: [
      {
        featureId: feature.id,
        author: "AI",
        body: "Should the toggle persist per user account, or per browser session?",
      },
      {
        featureId: feature.id,
        author: "USER",
        body: "Per user account — synced across devices.",
      },
      {
        featureId: feature.id,
        author: "AI",
        body: "Got it. I have enough context to draft a PRD.",
      },
    ],
    skipDuplicates: true,
  });

  const prd = await prisma.pRD.upsert({
    where: { id: DEMO_PRD_ID },
    update: {},
    create: {
      id: DEMO_PRD_ID,
      featureId: feature.id,
      approvedAt: new Date(),
      approvedBy: user.id,
      versions: {
        create: {
          version: 1,
          problemStatement:
            "Customers on the portal cannot switch to a dark theme, hurting accessibility and night-time use.",
          goals: [
            "Let users toggle between light, dark, and system themes.",
            "Persist the choice per account across devices.",
          ],
          nonGoals: ["Theming the marketing site.", "Custom user colour palettes."],
          userStories: [
            {
              persona: "Portal user",
              story: "As a user, I want to switch to dark mode so the portal is easier on the eyes at night.",
            },
          ],
          acceptanceCriteria: [
            { id: "AC1", text: "User can toggle theme from settings." },
            { id: "AC2", text: "Choice persists across browsers via API." },
            { id: "AC3", text: "Default = system preference." },
          ],
          edgeCases: ["First-time login on a new device.", "User on a browser without prefers-color-scheme support."],
          successMetrics: ["≥ 30% of weekly active users opt into dark mode within 30 days."],
        },
      },
    },
  });

  await prisma.task.createMany({
    data: [
      {
        featureId: feature.id,
        prdId: prd.id,
        title: "Add theme column to UserPreference",
        description: "Migration + Prisma schema update.",
        type: "BE",
        status: "DONE",
        estimateHours: 1,
        acceptanceCriteria: ["Schema migrated", "Default = SYSTEM"],
      },
      {
        featureId: feature.id,
        prdId: prd.id,
        title: "Theme toggle UI in settings",
        description: "Light / Dark / System radio group.",
        type: "FE",
        status: "DONE",
        estimateHours: 2,
        acceptanceCriteria: ["Three options visible", "Selection persists"],
      },
      {
        featureId: feature.id,
        prdId: prd.id,
        title: "Wire theme to tailwind class",
        description: "Toggle `dark` class on <html>.",
        type: "FE",
        status: "IN_REVIEW",
        estimateHours: 1.5,
        acceptanceCriteria: ["Flips immediately", "No layout shift"],
      },
      {
        featureId: feature.id,
        prdId: prd.id,
        title: "QA across breakpoints",
        description: "Verify dark mode on mobile + desktop.",
        type: "QA",
        status: "TODO",
        estimateHours: 1,
        acceptanceCriteria: ["No contrast issues", "All charts legible"],
      },
    ],
    skipDuplicates: true,
  });

  const repo = await prisma.repository.upsert({
    where: { id: DEMO_REPO_ID },
    update: {},
    create: {
      id: DEMO_REPO_ID,
      workspaceId: workspace.id,
      githubId: BigInt(999000111),
      owner: "acme-inc",
      name: "customer-portal",
      defaultBranch: "main",
    },
  });

  const pr = await prisma.pullRequest.upsert({
    where: { id: DEMO_PR_ID },
    update: {},
    create: {
      id: DEMO_PR_ID,
      workspaceId: workspace.id,
      repositoryId: repo.id,
      featureId: feature.id,
      number: 412,
      title: "feat: dark mode toggle",
      authorLogin: "demo-eng",
      state: "OPEN",
      headSha: "abc1234",
      baseBranch: "main",
      headBranch: "forge-ai/task-demo_task_1",
      htmlUrl: "https://github.com/acme-inc/customer-portal/pull/412",
      openedAt: new Date(),
    },
  });

  await prisma.aIReview.upsert({
    where: { id: DEMO_REVIEW_ID },
    update: {},
    create: {
      id: DEMO_REVIEW_ID,
      workspaceId: workspace.id,
      pullRequestId: pr.id,
      headSha: "abc1234",
      modelName: "gpt-4o",
      durationMs: 4200,
      overallSummary:
        "Toggle UI looks great. Theme isn't persisted to the backend yet — see AC2.",
      prdCoverageScore: 72,
      readyForHumanReview: false,
      issues: {
        create: [
          {
            severity: "BLOCKING",
            category: "PRD",
            file: "apps/portal/src/components/theme-toggle.tsx",
            line: 42,
            title: "Theme choice not persisted to backend",
            description:
              "Selection is only stored in localStorage. PRD AC2 requires persistence per user via the API.",
            suggestion:
              "Call `trpc.user.updatePreferences.useMutation` on change so the choice syncs across devices.",
          },
          {
            severity: "NON_BLOCKING",
            category: "QUALITY",
            file: "apps/portal/src/components/theme-toggle.tsx",
            line: 18,
            title: "Magic string for theme value",
            description: "Magic string 'dark' — extract to enum to match backend.",
          },
        ],
      },
    },
  });

  await prisma.subscription.upsert({
    where: { workspaceId: workspace.id },
    update: { plan: "FREE", status: "ACTIVE" },
    create: {
      workspaceId: workspace.id,
      plan: "FREE",
      status: "ACTIVE",
    },
  });

  const existingLedger = await prisma.creditLedger.count({
    where: { workspaceId: workspace.id },
  });
  if (existingLedger === 0) {
    await prisma.creditLedger.create({
      data: {
        workspaceId: workspace.id,
        event: "GRANT_MONTHLY",
        delta: 25,
        balance: 25,
        reason: "Monthly FREE plan grant",
      },
    });
    await prisma.creditLedger.create({
      data: {
        workspaceId: workspace.id,
        event: "REVIEW_RUN",
        delta: -1,
        balance: 24,
        reason: "AI review for PR #412",
      },
    });
  }

  console.log("✓ Seeded workspace 'acme' with demo feature, PRD, tasks, PR, and AI review.");
  console.log("  Visit http://localhost:3000/acme/dashboard after signing in as demo@forge-ai.dev");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
