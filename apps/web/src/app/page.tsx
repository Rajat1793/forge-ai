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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_60%),_radial-gradient(circle_at_bottom,_rgba(99,102,241,0.10),_transparent_60%)] text-slate-100">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <div className="flex items-center gap-2">
          <div className="grid size-9 place-items-center rounded-lg border border-emerald-300/30 bg-emerald-300/10 text-emerald-300">
            <Sparkles className="size-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Forge AI</span>
        </div>
        <nav className="hidden items-center gap-7 text-sm text-slate-300 md:flex">
          <Link href="#workflow" className="hover:text-white">Workflow</Link>
          <Link href="#features" className="hover:text-white">Features</Link>
          <Link href="#pricing" className="hover:text-white">Pricing</Link>
          <Link
            href="https://github.com/Rajat1793/forge-ai"
            target="_blank"
            className="hover:text-white"
            rel="noreferrer"
          >
            GitHub
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="hidden text-sm text-slate-300 hover:text-white sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-400 px-3.5 py-2 text-sm font-medium text-slate-950 transition-colors hover:bg-emerald-300"
          >
            Start free <ArrowRight className="size-4" />
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 pb-16 pt-10 lg:px-10 lg:pb-24 lg:pt-16">
        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.25em] text-emerald-200">
              Multi-tenant SaaS · Built for product teams
            </span>
            <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight text-white md:text-6xl">
              Ship features from <span className="text-emerald-300">idea to production</span> with an AI delivery workflow.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
              Forge AI is the single tool that takes a feature request, turns it into a PRD, breaks it into tasks,
              reviews the resulting pull requests, and gates the release — all backed by your GitHub repo.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 rounded-md bg-emerald-400 px-5 py-3 text-sm font-medium text-slate-950 transition-colors hover:bg-emerald-300"
              >
                Start free — 25 reviews / mo <ArrowRight className="size-4" />
              </Link>
              <Link
                href="#workflow"
                className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-slate-100 transition-colors hover:bg-white/10"
              >
                See the workflow
              </Link>
            </div>
            <dl className="mt-10 grid max-w-xl grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-4">
              {proof.map((p) => (
                <div key={p.label}>
                  <dt className="text-xs uppercase tracking-wider text-slate-500">{p.label}</dt>
                  <dd className="mt-1 font-semibold text-white">{p.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative">
            <div className="absolute inset-0 -z-10 rounded-[2rem] bg-gradient-to-br from-emerald-400/20 via-transparent to-indigo-500/20 blur-2xl" />
            <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-5 shadow-2xl backdrop-blur">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-rose-400/70" />
                  <span className="size-2.5 rounded-full bg-amber-300/70" />
                  <span className="size-2.5 rounded-full bg-emerald-300/70" />
                </div>
                <span className="text-xs text-slate-500">acme · feature #128</span>
              </div>
              <div className="mt-4 space-y-3">
                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <p className="text-xs uppercase tracking-wider text-emerald-300">PRD draft generated</p>
                  <p className="mt-1 text-sm text-slate-200">Add Razorpay checkout for Pro plan upgrade</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <p className="text-xs uppercase tracking-wider text-indigo-300">8 tasks created</p>
                  <p className="mt-1 text-sm text-slate-200">Schema · Order API · Checkout UI · Webhook · QA</p>
                </div>
                <div className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-3">
                  <p className="text-xs uppercase tracking-wider text-emerald-200">AI review · PR #412</p>
                  <p className="mt-1 text-sm text-emerald-100">2 blocking issues found, 1 suggestion. PRD acceptance ✓</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="workflow" className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-24">
        <div className="mb-12">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300/80">The Forge AI loop</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold text-white md:text-4xl">
            A single workflow, from raw request to shipped release.
          </h2>
        </div>
        <ol className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {phases.map((p, i) => (
            <li
              key={p.name}
              className="rounded-2xl border border-white/10 bg-slate-950/50 p-5 transition-colors hover:border-emerald-300/30"
            >
              <div className="text-xs font-medium uppercase tracking-wider text-emerald-300/80">
                Stage {String(i + 1).padStart(2, "0")}
              </div>
              <div className="mt-2 text-lg font-semibold text-white">{p.name}</div>
              <p className="mt-2 text-sm leading-6 text-slate-400">{p.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-24">
        <div className="mb-12 max-w-2xl">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300/80">Why Forge AI</p>
          <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
            Not another chat box. A real delivery system.
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {features.map((f) => (
            <article
              key={f.title}
              className="rounded-2xl border border-white/10 bg-slate-950/50 p-6 transition-colors hover:border-emerald-300/30"
            >
              <div className="grid size-10 place-items-center rounded-lg border border-emerald-300/20 bg-emerald-300/10 text-emerald-300">
                <f.icon className="size-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-24">
        <div className="mb-12 max-w-2xl">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300/80">Pricing</p>
          <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">Simple monthly plans, billed in INR.</h2>
          <p className="mt-3 text-sm text-slate-400">
            Every plan includes the full workflow. You only pay for AI review volume.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.key}
              className={`rounded-2xl border p-6 transition-colors ${
                plan.key === "PRO"
                  ? "border-emerald-300/40 bg-emerald-300/5"
                  : "border-white/10 bg-slate-950/50"
              }`}
            >
              <div className="flex items-baseline justify-between">
                <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                {plan.key === "PRO" ? (
                  <span className="rounded-full border border-emerald-300/40 bg-emerald-300/10 px-2.5 py-0.5 text-xs text-emerald-200">
                    Popular
                  </span>
                ) : null}
              </div>
              <p className="mt-3 text-3xl font-semibold text-white">
                ₹{plan.priceInr.toLocaleString("en-IN")}
                <span className="ml-1 text-sm font-normal text-slate-400">/ month</span>
              </p>
              <p className="mt-2 text-sm text-slate-400">{plan.reviewsPerMonth} AI reviews / month</p>
              <ul className="mt-5 space-y-2 text-sm text-slate-300">
                {plan.highlights.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 flex-none text-emerald-300" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/sign-up"
                className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
                  plan.key === "PRO"
                    ? "bg-emerald-400 text-slate-950 hover:bg-emerald-300"
                    : "border border-white/15 bg-white/5 text-slate-100 hover:bg-white/10"
                }`}
              >
                {plan.key === "FREE" ? "Start free" : `Choose ${plan.name}`}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-10">
        <div className="rounded-[2rem] border border-emerald-300/20 bg-gradient-to-br from-emerald-300/10 via-transparent to-indigo-500/10 p-10 text-center shadow-2xl">
          <h2 className="text-3xl font-semibold text-white md:text-4xl">
            Stop juggling 5 tools. Ship from one workflow.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-300">
            Create a workspace, drop in a feature request, and watch Forge AI take it through PRD, tasks, code review,
            and release approval.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 rounded-md bg-emerald-400 px-5 py-3 text-sm font-medium text-slate-950 transition-colors hover:bg-emerald-300"
            >
              Create a free workspace <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-slate-100 transition-colors hover:bg-white/10"
            >
              I already have an account
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 px-6 py-8 text-sm text-slate-400 sm:flex-row sm:items-center lg:px-10">
          <p>© {new Date().getFullYear()} Forge AI — Built for the ChaiCode SaaS Hackathon.</p>
          <div className="flex gap-5">
            <Link href="#pricing" className="hover:text-white">Pricing</Link>
            <Link href="/sign-in" className="hover:text-white">Sign in</Link>
            <Link
              href="https://github.com/Rajat1793/forge-ai"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white"
            >
              GitHub
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
