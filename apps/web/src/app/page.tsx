import {
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  FileText,
  GitPullRequest,
  ListTodo,
  Rocket,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import { planList } from "@forge-ai/billing";

const phases = [
  { name: "Request", body: "Drop a one-line idea. No forms, no ceremony." },
  { name: "Discovery", body: "The agent clarifies scope and flags duplicates." },
  { name: "PRD", body: "Structured goals, stories, acceptance criteria." },
  { name: "Tasks", body: "Auto-broken into a kanban-ready board." },
  { name: "Code", body: "Drafts the diff against the PRD, not just lint." },
  { name: "Review", body: "AI reads the change for gaps and risks." },
  { name: "Ship", body: "You approve. It ships with a full audit trail." },
];

const features = [
  {
    icon: Sparkles,
    title: "One prompt, full discovery",
    body: "Describe a feature in plain words. The agent asks at most a question or two, then writes a complete PRD with goals, stories, acceptance criteria and metrics.",
  },
  {
    icon: ListTodo,
    title: "Plan → tasks → board",
    body: "Approved PRDs explode into prioritized tasks on a drag-and-drop board, ready for engineers — or the agent — to pick up.",
  },
  {
    icon: GitPullRequest,
    title: "PR-aware AI reviews",
    body: "Forge AI reads every diff against the PRD and posts contextual review comments — coverage, security, edge cases, quality.",
  },
  {
    icon: Rocket,
    title: "Approve & ship",
    body: "Humans stay on the release gate. One click ships with release notes generated and a trace from request to merge.",
  },
];

// A faux agent transcript rendered on the hero to show the chat-based flow.
const transcript = [
  { role: "user", kind: undefined as string | undefined, text: "Add Slack alerts when a code review finishes." },
  { role: "agent", kind: "thinking", text: "Got it — scoping this now. No blocking questions." },
  { role: "agent", kind: "prd", text: "PRD drafted · 3 goals · 5 acceptance criteria" },
  { role: "agent", kind: "tasks", text: "8 tasks planned · Schema · Webhook · Slack client · QA" },
  { role: "agent", kind: "review", text: "Code reviewed · 1 suggestion · PRD coverage 96%" },
];

const proof = [
  { label: "Idea → shipped", value: "1 thread" },
  { label: "Agent handoffs", value: "6" },
  { label: "Integrations", value: "GitHub · Razorpay" },
  { label: "Built on", value: "Next.js · tRPC · Inngest" },
];

export default function HomePage() {
  const plans = planList();

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[640px] bg-[radial-gradient(60%_60%_at_50%_-10%,hsl(var(--brand)/0.18),transparent_70%)]"
      />

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="grid size-9 place-items-center rounded-xl border border-brand/30 bg-brand/10 text-brand">
              <Sparkles className="size-5" />
            </div>
            <span className="font-headline text-lg font-semibold tracking-tight">Forge AI</span>
          </div>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <Link href="#flow" className="transition-colors hover:text-foreground">How it works</Link>
            <Link href="#features" className="transition-colors hover:text-foreground">Features</Link>
            <Link href="#pricing" className="transition-colors hover:text-foreground">Pricing</Link>
            <Link
              href="https://github.com/Rajat1793/forge-ai"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-foreground"
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
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 pb-10 pt-16 text-center lg:pt-24">
        <Link
          href="#flow"
          className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-medium text-brand"
        >
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand/60" />
            <span className="relative inline-flex size-2 rounded-full bg-brand" />
          </span>
          Agentic delivery, end to end
        </Link>
        <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
          Describe a feature.<br />
          <span className="text-brand">Watch it ship.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-pretty text-lg leading-8 text-muted-foreground">
          Forge AI is an agent that turns one sentence into a PRD, a task plan, reviewed code, and a
          shipped release — all in a single chat thread. You stay on the approve button.
        </p>
      </section>

      {/* Chat-first composer mock */}
      <section className="mx-auto max-w-2xl px-6">
        <div className="relative rounded-3xl border border-border bg-card/80 p-2 shadow-2xl backdrop-blur">
          <div className="absolute inset-0 -z-10 rounded-3xl bg-brand/10 blur-2xl" />

          {/* Transcript */}
          <div className="space-y-2.5 px-3 pb-2 pt-3">
            {transcript.map((m, i) => (
              <TranscriptRow
                key={i}
                role={m.role}
                kind={m.kind}
                text={m.text}
                last={i === transcript.length - 1}
              />
            ))}
          </div>

          {/* Composer */}
          <div className="m-1 flex items-center gap-2 rounded-2xl border border-border bg-background px-3 py-2.5">
            <Sparkles className="size-4 shrink-0 text-brand" />
            <span className="flex-1 truncate text-left text-sm text-muted-foreground">
              Describe what you want to build…
            </span>
            <Link
              href="/sign-up"
              className="grid size-8 place-items-center rounded-xl bg-primary text-primary-foreground transition-all hover:brightness-110 active:scale-95"
              aria-label="Start building"
            >
              <ArrowUp className="size-4" />
            </Link>
          </div>
        </div>

        {/* Prompt chips */}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {["Add Slack notifications", "Build a billing dashboard", "Add CSV export", "Dark mode toggle"].map((p) => (
            <Link
              key={p}
              href="/sign-up"
              className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-brand/40 hover:text-foreground"
            >
              {p}
            </Link>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:brightness-110 active:scale-[0.98]"
          >
            Start free — 25 reviews / mo <ArrowRight className="size-4" />
          </Link>
          <Link
            href="#flow"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            See how it works
          </Link>
        </div>
      </section>

      {/* Proof stats */}
      <section className="mx-auto max-w-4xl px-6 pt-16">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-6 rounded-2xl border border-border bg-card/50 p-6 text-center sm:grid-cols-4">
          {proof.map((p) => (
            <div key={p.label}>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">{p.label}</dt>
              <dd className="mt-1.5 font-semibold text-foreground">{p.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Flow */}
      <section id="flow" className="mx-auto max-w-5xl px-6 py-20 lg:py-28">
        <div className="mb-12 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-brand">The thread</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            One conversation, from idea to release.
          </h2>
        </div>
        <ol className="relative mx-auto max-w-2xl space-y-3 before:absolute before:left-[1.15rem] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-border">
          {phases.map((p, i) => (
            <li
              key={p.name}
              className="relative flex gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-brand/40"
            >
              <div className="z-10 grid size-9 shrink-0 place-items-center rounded-full border border-brand/30 bg-brand/10 text-xs font-semibold text-brand">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div>
                <div className="text-base font-semibold">{p.name}</div>
                <p className="mt-0.5 text-sm leading-6 text-muted-foreground">{p.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
        <div className="mb-12 max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-brand">Why Forge AI</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Not another chat box. A delivery agent.
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {features.map((f) => (
            <article
              key={f.title}
              className="group rounded-2xl border border-border bg-card p-6 transition-colors hover:border-brand/40"
            >
              <div className="grid size-11 place-items-center rounded-xl border border-brand/20 bg-brand/10 text-brand transition-transform group-hover:scale-105">
                <f.icon className="size-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
        <div className="mb-12 max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-brand">Pricing</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Simple monthly plans, billed in INR.</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Every plan includes the full agent workflow. You only pay for AI review volume.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.key}
              className={`rounded-2xl border p-6 transition-colors ${
                plan.key === "PRO" ? "border-brand/40 bg-brand/5 shadow-xl" : "border-border bg-card"
              }`}
            >
              <div className="flex items-baseline justify-between">
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                {plan.key === "PRO" ? (
                  <span className="rounded-full border border-brand/40 bg-brand/10 px-2.5 py-0.5 text-xs text-brand">
                    Popular
                  </span>
                ) : null}
              </div>
              <p className="mt-3 text-3xl font-semibold">
                ₹{plan.priceInr.toLocaleString("en-IN")}
                <span className="ml-1 text-sm font-normal text-muted-foreground">/ month</span>
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{plan.reviewsPerMonth} AI reviews / month</p>
              <ul className="mt-5 space-y-2 text-sm">
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

      {/* Final CTA */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-[2rem] border border-brand/20 bg-brand/5 p-10 text-center shadow-xl">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(50%_80%_at_50%_0%,hsl(var(--brand)/0.15),transparent_70%)]"
          />
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Stop juggling 5 tools. Just start the thread.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Create a workspace, type one sentence, and watch Forge AI carry it through PRD, tasks,
            code review, and release.
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

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-6 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center lg:px-8">
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

// -----------------------------------------------------------------------------

function TranscriptRow({
  role,
  kind,
  text,
  last,
}: {
  role: string;
  kind?: string;
  text: string;
  last: boolean;
}) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-primary-foreground">
          {text}
        </div>
      </div>
    );
  }

  const icon =
    kind === "prd" ? <FileText className="size-3.5" />
      : kind === "tasks" ? <ListTodo className="size-3.5" />
      : kind === "review" ? <GitPullRequest className="size-3.5" />
      : <Sparkles className="size-3.5" />;

  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border border-brand/30 bg-brand/10 text-brand">
        {icon}
      </div>
      <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-border bg-secondary px-3.5 py-2 text-sm text-foreground">
        {text}
        {last ? (
          <span className="ml-1.5 inline-flex gap-0.5 align-middle">
            <span className="size-1.5 animate-bounce rounded-full bg-brand [animation-delay:-0.3s]" />
            <span className="size-1.5 animate-bounce rounded-full bg-brand [animation-delay:-0.15s]" />
            <span className="size-1.5 animate-bounce rounded-full bg-brand" />
          </span>
        ) : null}
      </div>
    </div>
  );
}
