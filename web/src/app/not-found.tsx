import Link from 'next/link';

export const metadata = { title: 'Not found | iForeSea' };

export default function NotFound() {
  return (
    <section className="relative px-6 py-10 md:px-12 md:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="text-mono text-xs uppercase tracking-widest text-primary">· 404</div>
        <h2 className="mt-3 text-3xl font-medium tracking-tight text-foreground md:text-5xl">
          Page not found.
        </h2>
        <div className="mt-8 max-w-3xl space-y-6 text-base leading-relaxed text-muted-foreground">
          <p>
            This page is not in the catalog. The link may be stale, the beach ID unknown, or the
            route never existed.
          </p>
          <p>
            Pilot locations are <code className="text-mono">sarafovo</code>,{' '}
            <code className="text-mono">central</code>, and{' '}
            <code className="text-mono">kraimorie</code>. Anything else returns here.
          </p>
          <div className="text-mono flex flex-wrap gap-3 pt-4 text-xs uppercase tracking-widest">
            <Link
              href="/"
              className="rounded-full bg-primary px-4 py-2 text-primary-foreground transition hover:opacity-90"
            >
              Open home
            </Link>
            <Link
              href="/map"
              className="rounded-full border border-border bg-card/40 px-4 py-2 text-foreground transition hover:border-primary/50"
            >
              Go to map
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
