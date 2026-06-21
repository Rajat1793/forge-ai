type FeaturePageProps = {
  params: Promise<{
    workspace: string;
    id: string;
  }>;
};

export default async function FeaturePage({ params }: FeaturePageProps) {
  const { workspace, id } = await params;

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-10 text-slate-100">
      <section className="rounded-[2rem] border border-white/10 bg-slate-950/50 p-8 shadow-glow">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-200/80">Feature request</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">{id}</h1>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          Workspace <span className="font-medium text-white">{workspace}</span> will host the full request → PRD →
          task → review workflow here.
        </p>
      </section>
    </main>
  );
}
