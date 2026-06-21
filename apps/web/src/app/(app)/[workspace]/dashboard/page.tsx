export default function DashboardPage() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10 text-slate-100">
      <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-glow backdrop-blur">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-200/80">Workspace dashboard</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Feature delivery control center</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
          This is the authenticated home for feature requests, PRDs, tasks, repository connections, review history,
          and billing status.
        </p>
      </div>
    </main>
  );
}
