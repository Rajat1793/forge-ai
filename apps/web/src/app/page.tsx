import { ArrowRight, CheckCircle2, GitPullRequest, Sparkles, Workflow } from "lucide-react";
import Link from "next/link";

import { planList } from "@forge-ai/billing";

const phases = [
  { name: "Request", body: "Capture raw ideas from anyone in the org." },
  { name: "Discovery", body: "AI clarifies scope, flags duplicates, scores fit." },
  { name: "PRD", body: "Structured goals, stories, acceptance criteria." },
  { name: "Tasks", body: "Auto-broken into a kanban-ready board." },
  { name: "Review", body: "AI reads PRs against the PRD, not just lint." },
  { name: "Approval", body: "Humans stay in control of release gates." },
  { name: "Release", body: "Ship with traceability from request to merge." },
];

const features = [
  {
    icon: Sparkles,
    title: "AI discovery + PRDs",
    body: "Turn a one-line request into a structured PRD with goals, user stories, acceptance criteria, edge cases, and metrics.",
  },
  {
    icon: Workflow,
    title: "Plan → tasks → board",
    body: "Approved PRDs explode into prioritized tasks on a drag-and-drop Kanban board, ready for engineers to pick up.",
  },
  {
    icon: GitPullRequest,
    title: "PR-aware AI reviews",
    body: "Connect GitHub once. Forge AI reads every PR's diff against the PRD and posts actionable, contextual review comments.",
  },
  {
    icon: CheckCircle2,
    title: "Approval + release",
    body: "Stakeholders approve, QA signs off, and shipping is one click — with full audit trail per feature.",
  },
];

const proof = [
  { label: "Workflow stages", value: "7" },
  { label: "AI handoffs", value: "5" },
  { label: "Webhook surfaces", value: "GitHub + Razorpay" },
  { label: "Built on", value: "Next.js · tRPC · Inngest" },
];

export default function HomePage() {
  const plans = planList();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <div className="flex items-center gap-2">
          <div className="grid size-9 place-items-center rounded-lg border border-brand/30 bg-brand/10 text-brand">
            <Sparkles className="size-5" />
          </div>
          <span className="font-headline text-lg font-semibold tracking-tight">Forge AI</span>
        </div>
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <Link href="#workflow" className="transition-colors hover:text-foreground">Workflow</Link>
          <Link href="#features" className="transition-colors hover:text-foreground">Features</Link>
          <Link href="#pricing" className="transition-colors hover:text-foreground">Pricing</Link>
          <Link
            href="https://github.com/Rajat1793/forge-ai"
            target="_blank"
            className="transition-colors hover:text-foreground"
            rel="noreferrer"
          >
            GitHub
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:brightness-110 active:scale-[0.98]"
          >
            Start free <ArrowRight className="size-4" />
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 pb-16 pt-10 lg:px-10 lg:pb-24 lg:pt-16">
        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.25em] text-brand">
              Multi-tenant SaaS · Built for product teams
            </span>
            <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight text-foreground md:text-6xl">
              Ship features from <span className="text-brand">idea to production</span> with an AI delivery workflow.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
              Forge AI is the single tool that takes a feature request, turns it into a PRD, breaks it into tasks,
              reviews the resulting pull requests, and gates the release — all backed by your GitHub repo.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:brightness-110 active:scale-[0.98]"
              >
                Start free — 25 reviews / mo <ArrowRight className="size-4" />
              </Link>
              <Link
                href="#workflow"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                See the workflow
              </Link>
            </div>
            <dl className="mt-10 grid max-w-xl grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-4">
              {proof.map((p) => (
                <div key={p.label}>
                  <dt className="text-xs uppercase tracking-wider text-muted-foreground">{p.label}</dt>
                  <dd className="mt-1 font-semibold text-foreground">{p.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative">
            <div className="absolute inset-0 -z-10 rounded-[2rem] bg-brand/15 blur-2xl" />
            <div className="rounded-[1.5rem] border border-border bg-card p-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-destructive/70" />
                  <span className="size-2.5 rounded-full bg-amber-400/70" />
                  <span className="size-2.5 rounded-full bg-brand/70" />
                </div>
                <span className="text-xs text-muted-foreground">acme · feature #128</span>
              </div>
              <div className="mt-4 space-y-3">
                <div className="rounded-lg border border-border bg-secondary p-3">
                  <p className="text-xs uppercase tracking-wider text-brand">PRD draft generated</p>
                  <p className="mt-1 text-sm text-foreground">Add Razorpay checkout for Pro plan upgrade</p>
                </div>
                <div className="rounded-lg border border-border bg-secondary p-3">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">8 tasks created</p>
                  <p className="mt-1 text-sm text-foreground">Schema · Order API · Checkout UI · Webhook · QA</p>
                </div>
                <div className="rounded-lg border border-brand/20 bg-brand/10 p-3">
                  <p className="text-xs uppercase tracking-wider text-brand">AI review · PR #412</p>
                  <p className="mt-1 text-sm text-foreground">2 blocking issues found, 1 suggestion. PRD acceptance ✓</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="workflow" className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-24">
        <div className="mb-12">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-brand">The Forge AI loop</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold text-foreground md:text-4xl">
            A single workflow, from raw request to shipped release.
          </h2>
        </div>
        <ol className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {phases.map((p, i) => (
            <li
              key={p.name}
              className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-brand/40"
            >
              <div className="text-xs font-medium uppercase tracking-wider text-brand">
                Stage {String(i + 1).padStart(2, "0")}
              </div>
              <div className="mt-2 text-lg font-semibold text-foreground">{p.name}</div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{p.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-24">
        <div className="mb-12 max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-brand">Why Forge AI</p>
          <h2 className="mt-3 text-3xl font-semibold text-foreground md:text-4xl">
            Not another chat box. A real delivery system.
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {features.map((f) => (
            <article
              key={f.title}
              className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-brand/40"
            >
              <div className="grid size-10 place-items-center rounded-lg border border-brand/20 bg-brand/10 text-brand">
                <f.icon className="size-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-24">
        <div className="mb-12 max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-brand">Pricing</p>
          <h2 className="mt-3 text-3xl font-semibold text-foreground md:text-4xl">Simple monthly plans, billed in INR.</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Every plan includes the full workflow. You only pay for AI review volume.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.key}
              className={`rounded-2xl border p-6 transition-colors ${
                plan.key === "PRO"
                  ? "border-brand/40 bg-brand/5"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-baseline justify-between">
                <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                {plan.key === "PRO" ? (
                  <span className="rounded-full border border-brand/40 bg-brand/10 px-2.5 py-0.5 text-xs text-brand">
                    Popular
                  </span>
                ) : null}
              </div>
              <p className="mt-3 text-3xl font-semibold text-foreground">
                ₹{plan.priceInr.toLocaleString("en-IN")}
                <span className="ml-1 text-sm font-normal text-muted-foreground">/ month</span>
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{plan.reviewsPerMonth} AI reviews / month</p>
              <ul className="mt-5 space-y-2 text-sm text-foreground">
                {plan.highlights.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 flex-none text-brand" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/sign-up"
                className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all active:scale-[0.98] ${
                  plan.key === "PRO"
                    ? "bg-brand text-brand-foreground hover:brightness-110"
                    : "border border-border bg-card text-foreground hover:bg-accent"
                }`}
              >
                {plan.key === "FREE" ? "Start free" : `Choose ${plan.name}`}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-10">
        <div className="rounded-[2rem] border border-brand/20 bg-brand/5 p-10 text-center shadow-xl">
          <h2 className="text-3xl font-semibold text-foreground md:text-4xl">
            Stop juggling 5 tools. Ship from one workflow.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Create a workspace, drop in a feature request, and watch Forge AI take it through PRD, tasks, code review,
            and release approval.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:brightness-110 active:scale-[0.98]"
            >
              Create a free workspace <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              I already have an account
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 px-6 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center lg:px-10">
          <p>© {new Date().getFullYear()} Forge AI — Built for the ChaiCode SaaS Hackathon.</p>
          <div className="flex gap-5">
            <Link href="#pricing" className="transition-colors hover:text-foreground">Pricing</Link>
            <Link href="/sign-in" className="transition-colors hover:text-foreground">Sign in</Link>
            <Link
              href="https://github.com/Rajat1793/forge-ai"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-foreground"
            >
              GitHub
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
