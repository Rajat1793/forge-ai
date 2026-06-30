<div align="center">

# Forge AI

**Ship features from idea to production with an AI delivery workflow.**

Forge AI is a multi-tenant SaaS that takes a raw feature request, runs AI discovery,
generates a structured PRD, breaks it into tasks, reviews the resulting GitHub pull
requests against the PRD, and gates the final release with human approval.

[![Built with Next.js](https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs)](https://nextjs.org/)
[![tRPC](https://img.shields.io/badge/tRPC-11-2596be?logo=trpc&logoColor=white)](https://trpc.io/)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma)](https://www.prisma.io/)
[![BetterAuth](https://img.shields.io/badge/Auth-BetterAuth-10b981)](https://www.better-auth.com/)
[![Inngest](https://img.shields.io/badge/Inngest-workflows-7c3aed)](https://www.inngest.com/)
[![Razorpay](https://img.shields.io/badge/Billing-Razorpay-0c2451)](https://razorpay.com/)

</div>

---

Live Demo: https://forge-ai-web.onrender.com/
Product demo: https://youtu.be/PRbckd1L3Kc

## The Forge AI loop

```text
 Request → Discovery → PRD → Tasks → Code → AI Review → Fixes → Approval → Ship
```

Each transition is backed by a real artifact in the database, a real webhook surface,
and an audit trail so nothing happens "off-platform".

---

## Features

| Phase | What Forge AI does |
| --- | --- |
| **Discovery** | AI clarifies scope, asks follow-up questions, detects duplicates. |
| **PRD** | `generateObject` produces a typed PRD (problem, goals, user stories, acceptance criteria, edge cases, metrics). Inline editor with versions. |
| **Tasks** | Approved PRD explodes into FE/BE/INFRA/QA tasks on a drag-and-drop Kanban board. |
| **GitHub** | OAuth-connect a repo. Webhook-driven PR tracking. Branch convention `forge-ai/task-<id>` links code → task. |
| **AI Review** | On every PR open/sync, the QA agent reads the diff against the PRD and posts a structured review (BLOCKING / NON-BLOCKING, with PRD references and inline suggestions). |
| **Approval** | Human reviewer dashboard with full history. Approve, request changes, or reject. |
| **Release** | One-click ship — flips status, creates a release tag back in GitHub. |
| **Billing** | Razorpay subscriptions in INR. Per-workspace credit ledger. Webhook-driven grants. |
| **Multi-tenant** | Every business entity scoped to a `workspaceId`. RBAC: `OWNER` / `ADMIN` / `MEMBER` / `REVIEWER`. |

---

## Tech Stack

| Layer | Choice |
| --- | --- |
| Monorepo | Turborepo + pnpm |
| Web app | Next.js 15 (App Router, RSC, Server Actions) |
| API | tRPC v11 |
| Auth | BetterAuth (GitHub OAuth) |
| Database | PostgreSQL (Neon-friendly) |
| ORM | Prisma 5 |
| UI | Tailwind CSS + Shadcn UI + Sonner toasts |
| AI | Vercel AI SDK (OpenAI by default, swap-friendly) |
| Async workflows | Inngest |
| GitHub | Octokit + signed webhooks |
| Billing | Razorpay subscriptions + HMAC-verified webhooks |
| Deploy | Vercel + Neon + Inngest Cloud |

---

## Monorepo Layout

```text
forge-ai/
├── apps/
│   └── web/                 # Next.js app — UI, route handlers, webhooks
├── packages/
│   ├── ai/                  # Zod schemas + AI prompt contracts
│   ├── api/                 # Shared tRPC routers + context
│   ├── auth/                # BetterAuth server + client helpers
│   ├── billing/             # Plan metadata + Razorpay helpers + HMAC verify
│   ├── db/                  # Prisma schema + client
│   ├── github/              # Octokit wrapper + webhook signature verify
│   └── inngest/             # Inngest client + workflow functions
├── ARCHITECTURE.md          # System topology, data flow, decisions log
├── DEMO_SCRIPT.md           # 4-minute demo walkthrough
└── README.md
```

---

## Quickstart

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL 15+ (or a Neon database)
- (Optional for full AI flow) An OpenAI API key
- (Optional for GitHub flow) A GitHub OAuth app + webhook secret
- (Optional for billing flow) Razorpay test credentials

> Forge AI is designed to **gracefully degrade**: missing OpenAI/GitHub/Razorpay credentials
> trigger built-in dev fallbacks so you can still click through the whole flow locally.

### 1. Install

```bash
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
# fill in DATABASE_URL + BETTER_AUTH_SECRET at minimum
```

See [`.env.example`](.env.example) for the full list of variables (database, auth,
GitHub, OpenAI, Inngest, Razorpay, encryption).

### 3. Set up the database

```bash
pnpm db:generate
pnpm db:push           # or: pnpm --filter @forge-ai/db db:migrate
```

### 4. Run the app

```bash
pnpm dev               # starts Next.js on http://localhost:3000
```

Then in a second terminal, start the Inngest dev server (handles async workflows):

```bash
npx inngest-cli@latest dev -u http://localhost:3000/api/inngest
```

---

## Scripts

```bash
pnpm dev               # Next.js dev server
pnpm dev:all           # Turborepo: run dev across all packages
pnpm build             # Production build (all packages)
pnpm lint              # ESLint
pnpm typecheck         # tsc --noEmit across the monorepo
pnpm format            # Prettier --write
pnpm db:generate       # prisma generate
pnpm db:push           # prisma db push
pnpm db:studio         # prisma studio
```

---

## Deployment

### Web app — Vercel

1. Import the repo in Vercel.
2. Set the root directory to the repo root; Vercel auto-detects Turborepo + Next.js.
3. Add every variable from `.env.example` to the Vercel project's **Environment Variables**.
4. Set `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` to your Vercel production URL.

### Database — Neon

1. Create a Neon project, then create a database.
2. Copy the **Pooled connection** string into `DATABASE_URL`.
3. Copy the **Direct connection** string into `DIRECT_URL` (used by Prisma migrations).
4. Run `pnpm db:deploy` from CI (or `pnpm db:push` for the hackathon path).

### Async — Inngest Cloud

1. Create an app at <https://app.inngest.com> and grab the **event** and **signing** keys.
2. Add them as `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` in Vercel.
3. Point Inngest at `https://<your-domain>/api/inngest`.

### Billing — Razorpay

1. Toggle the dashboard to **Test Mode**.
2. Create a Razorpay app key + secret (`RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`).
3. Create monthly plans for Pro (₹1,499) and Team (₹4,999); paste IDs into `RAZORPAY_PLAN_PRO` / `RAZORPAY_PLAN_TEAM`.
4. Create a webhook → `https://<your-domain>/api/webhooks/razorpay` with the
   `subscription.activated`, `subscription.charged`, `subscription.cancelled`,
   `subscription.halted`, and `payment.captured` events. Copy the secret into `RAZORPAY_WEBHOOK_SECRET`.

### GitHub — OAuth + Webhooks

1. Create an OAuth app at <https://github.com/settings/developers>.
2. Callback URL: `https://<your-domain>/api/auth/callback/github`.
3. Scopes: `repo`, `read:user`, `user:email`, `admin:repo_hook`.
4. Each connected repo gets a webhook pointed at
   `https://<your-domain>/api/webhooks/github`, signed with `GITHUB_WEBHOOK_SECRET`.

---

## Security highlights

- Every business entity is filtered by `workspaceId` at the tRPC `workspaceProcedure`
  middleware boundary — no cross-tenant reads possible.
- Webhook payloads (GitHub + Razorpay) are HMAC-SHA256 verified with timing-safe
  comparison in [`packages/github`](packages/github/src/index.ts) and
  [`packages/billing`](packages/billing/src/index.ts).
- AI outputs are validated through Zod schemas via `generateObject`, so the model
  can't escape the structured contract.
- Secrets, GitHub tokens, and webhook signatures are never logged.
- Auth pages, app routes, and tRPC mutations are gated by BetterAuth sessions
  (SameSite=Lax cookies).

See [`ARCHITECTURE.md`](ARCHITECTURE.md) §9 for the full security matrix.

---

## Documentation

- [`ARCHITECTURE.md`](ARCHITECTURE.md) — system topology, data model, runtime boundaries, decisions log.
- [`DEMO_SCRIPT.md`](DEMO_SCRIPT.md) — 4-minute demo walkthrough used for the submission video.
- [`.env.example`](.env.example) — every environment variable with comments.

---

## Built for

The **ChaiCode SaaS Hackathon (2026)** — Hitesh Sir & Piyush Sir.

**Builder Mode On.**

---

## License

Internal hackathon project.
