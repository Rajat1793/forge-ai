const phases = [
  "Request",
  "Product Thinking",
  "PRD",
  "Tasks",
  "Implementation",
  "Review",
  "Fixes",
  "Approval",
  "Release",
];

const features = [
  {
    title: "AI discovery",
    body: "Ask clarifying questions, detect duplicates, and decide whether the request should move forward.",
  },
  {
    title: "Structured PRDs",
    body: "Generate editable PRDs with goals, user stories, acceptance criteria, edge cases, and success metrics.",
  },
  {
    title: "GitHub-aware reviews",
    body: "Review real pull requests against PRD requirements, not just syntax, using Octokit and webhooks.",
  },
  {
    title: "Approval gates",
    body: "Keep humans in control with plan approval, QA review history, and final release sign-off.",
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8 text-slate-100 lg:px-10">
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 px-6 py-8 shadow-2xl backdrop-blur md:px-10 md:py-12">
        <div className="mb-8 flex items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-emerald-300/80">Forge AI</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-white md:text-6xl">
              Ship features from idea to production with an AI delivery workflow.
            </h1>
          </div>
          <div className="hidden rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-sm text-emerald-200 md:block">
            Multi-tenant SaaS
          </div>
        </div>

        <p className="max-w-3xl text-lg leading-8 text-slate-300">
          Forge AI turns feature requests into PRDs, tasks, pull-request reviews, and release decisions through a
          structured flow that keeps product and engineering aligned.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          {phases.map((phase) => (
            <span key={phase} className="rounded-full border border-white/10 bg-slate-950/60 px-4 py-2 text-sm text-slate-200">
              {phase}
            </span>
          ))}
        </div>
      </section>

      <section className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {features.map((feature) => (
          <article key={feature.title} className="rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-white">{feature.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">{feature.body}</p>
          </article>
        ))}
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[1.75rem] border border-white/10 bg-[rgba(8,15,28,0.82)] p-6 shadow-2xl">
          <h2 className="text-2xl font-semibold text-white">What this repo contains</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
            A production-ready monorepo scaffold with Next.js, tRPC, BetterAuth, Prisma, Inngest, Octokit, Razorpay,
            and AI SDK entry points so the full workflow can be implemented from a coherent base.
          </p>
        </div>
        <div className="rounded-[1.75rem] border border-emerald-300/20 bg-emerald-300/10 p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-200/80">Core loop</p>
          <p className="mt-4 text-2xl font-semibold text-white">
            Feature Request → PRD → Tasks → Code → Review → Fixes → Approval → Ship
          </p>
        </div>
      </section>
    </main>
  );
}
