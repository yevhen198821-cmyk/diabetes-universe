import { Button } from '@diabetes-universe/ui';

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-10 shadow-sm sm:p-16">
        <p className="mb-4 text-sm font-semibold tracking-widest text-teal-700 uppercase">
          Foundation ready
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-6xl">
          Diabetes Universe
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
          A production-ready frontend foundation for a trusted digital health
          ecosystem.
        </p>
        <div className="mt-10">
          <Button>Explore the foundation</Button>
        </div>
      </section>
    </main>
  );
}
