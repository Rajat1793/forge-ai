# Forge AI — Build Todo

> Hackathon deadline: **30 Jun 2026** · Solo build · Target: full 5-phase loop deployed live.

Legend: `[ ]` todo · `[~]` in progress · `[x]` done · `(P0)` blocker · `(P1)` important · `(P2)` polish

---

## Day 0 — Pre-flight (do today)
- [ ] (P0) Create public GitHub repo `forge-ai`
- [ ] (P0) Post launch announcement on **LinkedIn** + **X/Twitter**
  - Tag: `@ChaiCode`, `@Hiteshdotcom` (Hitesh Sir), `@piyushgarg_dev` (Piyush)
  - Hashtag: `#chaicode`
  - End line: `Builder Mode On | iPhone Giveaway Hackathon`
- [ ] (P0) Create accounts: Neon, Vercel, Inngest Cloud, OpenAI, Razorpay (test), GitHub OAuth/App
- [ ] (P0) Save all API keys in a local `.env.local` (use `.env.example` as template)

---

## Phase 0 — Monorepo Setup (Day 1 AM)
- [ ] (P0) `pnpm dlx create-turbo@latest forge-ai --package-manager pnpm`
- [ ] (P0) Delete starter apps/packages, scaffold our structure:
  - [ ] `apps/web` (Next.js 15 App Router, TS, Tailwind)
  - [ ] `packages/db` (Prisma)
  - [ ] `packages/api` (tRPC v11 server)
  - [ ] `packages/auth` (BetterAuth)
  - [ ] `packages/ai` (Vercel AI SDK)
  - [ ] `packages/inngest` (Inngest functions)
  - [ ] `packages/github` (Octokit)
  - [ ] `packages/billing` (Razorpay)
  - [ ] `packages/ui` (Shadcn shared components)
  - [ ] `packages/config` (tsconfig, eslint, tailwind presets)
- [ ] (P0) Configure root `turbo.json` (pipelines: `build`, `dev`, `lint`, `typecheck`, `db:generate`, `db:push`)
- [ ] (P0) Set up shared `tsconfig.base.json` + `eslint.config.js`
- [ ] (P0) Init Shadcn in `apps/web` (`pnpm dlx shadcn@latest init`)
- [ ] (P0) Commit `.env.example` + `.gitignore`
- [ ] (P1) Configure Prettier + lint-staged + Husky pre-commit

---

## Phase 1 — Auth, Workspaces, Multi-Tenancy (Day 1 PM)
- [ ] (P0) Prisma models: `User`, `Account`, `Session`, `Verification` (BetterAuth tables)
- [ ] (P0) Prisma models: `Workspace`, `Membership` (role: OWNER/ADMIN/MEMBER/REVIEWER)
- [ ] (P0) Run first migration: `pnpm db migrate dev --name init`
- [ ] (P0) BetterAuth config: email/password + GitHub OAuth provider
- [ ] (P0) `apps/web/app/api/auth/[...all]/route.ts` handler
- [ ] (P0) `apps/web/app/api/trpc/[trpc]/route.ts` handler
- [ ] (P0) Sign in / Sign up pages (Shadcn forms)
- [ ] (P0) Post-signup onboarding: auto-create personal Workspace
- [ ] (P0) Workspace switcher (header dropdown, Linear/Vercel style)
- [ ] (P0) tRPC `workspaceProcedure` middleware (injects `ctx.workspace` + `ctx.role`)
- [ ] (P1) Invite-by-email flow (token link, 7-day expiry)
- [ ] (P1) Settings → Members page (list, role change, remove)
- [ ] (P2) Danger zone (delete workspace, transfer ownership)

---

## Phase 2 — Feature Requests & Discovery (Day 2 AM)
- [ ] (P0) Prisma models: `Project`, `FeatureRequest` (status enum), `ClarifyMessage`
- [ ] (P0) Migration
- [ ] (P0) Feature request submission form (title, description, source: EMAIL/TICKET/CALL/MANUAL)
- [ ] (P0) Feature list page (table with status badges)
- [ ] (P0) Feature detail page with conversation thread UI
- [ ] (P0) Inngest fn `feature.clarify`:
  - [ ] Decide via AI: needs more info / duplicate / ready for PRD
  - [ ] Persist AI clarifying questions as `ClarifyMessage`
- [ ] (P0) User-reply form posts answer → re-triggers `feature.clarify`
- [ ] (P1) "Mark ready for PRD" manual override
- [ ] (P1) Duplicate detection (vector search optional; keyword match fallback)

---

## Phase 3 — PRD Generation & Editor (Day 2 PM)
- [ ] (P0) Prisma models: `PRD`, `PRDVersion`
- [ ] (P0) Zod schema for PRD: `problemStatement`, `goals[]`, `nonGoals[]`, `userStories[]`, `acceptanceCriteria[]`, `edgeCases[]`, `successMetrics[]`
- [ ] (P0) Inngest fn `prd.generate` using AI SDK `generateObject` with Zod schema
- [ ] (P0) PRD editor page — collapsible sections, in-place edit
- [ ] (P0) "Save as new version" → new `PRDVersion` row
- [ ] (P0) "Approve PRD" button → unlocks Tasks
- [ ] (P1) Version diff view (side-by-side)
- [ ] (P2) Stream PRD generation to UI (`streamObject`) for Cursor-like feel

---

## Phase 4 — Tasks & Kanban (Day 3 AM)
- [ ] (P0) Prisma models: `Task` (status, type: FE/BE/INFRA/QA, estimateHours, acceptanceCriteria[])
- [ ] (P0) Inngest fn `tasks.generate` from approved PRD
- [ ] (P0) Kanban board: Backlog / Todo / In Progress / In Review / Done
- [ ] (P0) Drag-and-drop with `@dnd-kit/core`
- [ ] (P0) Task detail drawer (Shadcn Sheet) with linked PRD section
- [ ] (P0) "Approve Plan" → unlocks Development phase
- [ ] (P1) Manual task add/edit/delete
- [ ] (P2) Task templates (bug, feature, chore)

---

## Phase 5 — GitHub Integration (Day 3 PM + Day 4)
- [ ] (P0) Decide: GitHub OAuth (faster) vs GitHub App (cleaner) — recommend OAuth first
- [ ] (P0) GitHub OAuth scopes: `repo`, `read:user`, `admin:repo_hook`
- [ ] (P0) Connect repo flow: list user repos via Octokit → pick → install webhook
- [ ] (P0) Prisma models: `Repository`, `PullRequest`, `PullRequestFile`
- [ ] (P0) Webhook handler `apps/web/app/api/webhooks/github/route.ts`
- [ ] (P0) HMAC signature verification (reject if invalid)
- [ ] (P0) Handle events: `pull_request.opened`, `pull_request.synchronize`, `pull_request.closed`, `push`
- [ ] (P0) Persist PR + changed files + diffs
- [ ] (P0) Link Task ↔ PR via PR description keywords (e.g., `Closes FORGE-123`)
- [ ] (P1) PR list page (per repo / per feature)
- [ ] (P2) Real-time PR status badges

---

## Phase 6 — AI Review Loop (Day 5)
- [ ] (P0) Prisma models: `AIReview`, `ReviewIssue` (severity: BLOCKING/NON_BLOCKING; category: PRD/SECURITY/PERF/EDGE_CASE/QUALITY)
- [ ] (P0) Zod schema for review output: `issues[]`, `overallSummary`, `prdCoverageScore`, `readyForHumanReview`
- [ ] (P0) Inngest fn `pr.ai_review`:
  - [ ] Fetch PR diff + changed files (Octokit)
  - [ ] Load related PRD + tasks + acceptance criteria
  - [ ] Run `generateObject` with PRD context + diff
  - [ ] Persist `AIReview` + `ReviewIssue` rows
  - [ ] Post review on PR via Octokit (summary + inline comments where line known)
  - [ ] Transition feature state: BLOCKING → `FIX_NEEDED`, else `READY_FOR_HUMAN`
- [ ] (P0) Re-review on `pull_request.synchronize` (track history)
- [ ] (P0) Review history timeline UI per feature
- [ ] (P1) Issue → "Suggest fix" expandable (AI suggestion)
- [ ] (P2) Inline diff viewer with issue annotations

---

## Phase 7 — Human Approval & Release (Day 6 AM)
- [ ] (P0) Reviewer page: PRD + tasks + PR link + full AI review history + outstanding issues
- [ ] (P0) Approve / Reject buttons (Reject = comment + back to `FIX_NEEDED`)
- [ ] (P0) On approve → "Ship" button enabled
- [ ] (P0) "Ship" → status `SHIPPED` + optional GitHub release tag via Octokit
- [ ] (P1) Reviewer-only role gating (only OWNER/ADMIN/REVIEWER can approve)
- [ ] (P2) Release notes auto-generated from PRD + merged PR

---

## Phase 8 — Billing (Razorpay) (Day 6 PM)
- [ ] (P0) Prisma models: `Subscription`, `CreditLedger`
- [ ] (P0) Plan definitions in `packages/billing`:
  - Free: 3 AI reviews/mo, 1 repo
  - Pro (₹999/mo): 100 reviews, 10 repos
  - Team (₹2999/mo): unlimited
- [ ] (P0) Razorpay Checkout integration (upgrade flow)
- [ ] (P0) Webhook `apps/web/app/api/webhooks/razorpay/route.ts` (signature verify)
- [ ] (P0) Credit decrement on each `pr.ai_review` run; block when 0
- [ ] (P0) Billing page: current plan, usage meter, upgrade CTA
- [ ] (P1) Invoice history list
- [ ] (P2) Auto-downgrade on payment failure

---

## Phase 9 — Polish & SaaS Feel (Day 7)
- [ ] (P0) Landing page: hero, features grid, "how it works" diagram, pricing, FAQ, footer
- [ ] (P0) Dashboard: open features, PRs awaiting review, credits left, recent activity
- [ ] (P0) Inngest workflow status surfaced in UI (polling tRPC query on run state)
- [ ] (P0) Toast notifications (`sonner`)
- [ ] (P0) Loading skeletons + empty states everywhere
- [ ] (P0) Dark mode (Shadcn default)
- [ ] (P1) Framer Motion micro-animations on landing
- [ ] (P1) 404 + 500 pages
- [ ] (P1) Basic SEO meta + OG image
- [ ] (P2) Command palette (`cmd-k`) — `cmdk` lib

---

## Phase 10 — Deploy & Submit (Day 8–10)
- [ ] (P0) Provision Neon prod DB; run `prisma migrate deploy`
- [ ] (P0) Deploy `apps/web` to Vercel (link repo, set env vars)
- [ ] (P0) Inngest Cloud production env wired
- [ ] (P0) Register GitHub OAuth/App with prod callback URLs
- [ ] (P0) Razorpay live or test keys (test mode acceptable per brief)
- [ ] (P0) Smoke test full E2E flow on prod URL
- [ ] (P0) Write `README.md` per brief checklist
- [ ] (P0) Record 3–5 min demo video (use `DEMO_SCRIPT.md`)
- [ ] (P0) Upload demo to YouTube (unlisted OK)
- [ ] (P0) Final submission post on LinkedIn + X with live URL + repo + demo
- [ ] (P1) Submit to hackathon dashboard
- [ ] (P2) Buffer day for hotfixes

---

## Verification Checklist (run before submission)
- [ ] Local E2E: request → clarify → PRD → tasks → repo connect → PR → AI review → approve → ship (no errors)
- [ ] Bad HMAC signature is rejected on both webhooks
- [ ] Bad PR flagged BLOCKING; good PR `readyForHumanReview=true`
- [ ] Cross-workspace data isolation (2 workspaces can't read each other)
- [ ] Razorpay test card upgrade decrements credits via webhook
- [ ] Inngest dashboard: all functions visible, no zombie runs
- [ ] Vercel prod build is green
- [ ] README has all 9 required sections (overview, stack, architecture, setup, envs, schema, GitHub setup, Inngest explanation, AI features)
- [ ] Demo video uploaded + linked in README
- [ ] Public repo accessible (no private fork by accident)

---

## Stretch (only if ahead of schedule)
- [ ] Slack notification on PR review complete
- [ ] Vector search for duplicate feature detection (pgvector on Neon)
- [ ] PRD export as Markdown/PDF
- [ ] Public API + API key management
- [ ] Audit log per workspace
