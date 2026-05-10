import { Card } from '@/components/ui/card';

function CardSkeleton() {
  return (
    <Card className="glass relative overflow-hidden rounded-3xl bg-transparent p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative h-3 w-3">
            <div className="ring-pulse absolute inset-0 rounded-full bg-muted-foreground/40" />
            <div className="absolute inset-0 rounded-full bg-muted-foreground/40" />
          </div>
          <div className="skeleton h-3 w-16" />
        </div>
        <div className="skeleton h-3 w-12" />
      </div>
      <div className="skeleton mt-6 h-7 w-3/4" />
      <div className="mt-6 flex items-baseline gap-2">
        <div className="skeleton h-12 w-24" />
        <div className="skeleton h-3 w-28" />
      </div>
      <div className="skeleton mt-3 h-3 w-40" />
      <div className="mt-6">
        <div className="skeleton h-10 w-full" />
        <div className="mt-2 flex justify-between">
          <div className="skeleton h-2 w-10" />
          <div className="skeleton h-2 w-10" />
        </div>
      </div>
    </Card>
  );
}

function TimelineColSkeleton() {
  return (
    <div>
      <div className="skeleton h-3 w-20" />
      <div className="mt-2 flex items-baseline gap-2">
        <div className="skeleton h-9 w-20" />
        <div className="skeleton h-3 w-16" />
      </div>
      <div className="skeleton mt-2 h-3 w-16" />
      <div className="skeleton mt-1 h-3 w-32" />
      <div className="skeleton mt-4 h-32 w-full rounded-md" />
    </div>
  );
}

export default function HomeLoading() {
  return (
    <>
      <section className="relative px-6 pt-10 pb-4 md:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="text-mono text-xs uppercase tracking-widest text-primary">
            · Home
          </div>
          <h1 className="mt-3 text-balance text-4xl font-medium tracking-tight text-foreground md:text-6xl">
            Burgas Bay,{' '}
            <span className="text-muted-foreground">three beaches, live.</span>
          </h1>
          <p className="mt-4 max-w-xl text-muted-foreground">
            Current chl-a readings and a 5-day forecast across Sarafovo, Central, and Kraimorie.
            Click a card to drill down.
          </p>
        </div>
      </section>

      <section className="relative px-6 py-6 md:px-12 md:py-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 flex items-end justify-between gap-6">
            <div>
              <div className="text-mono text-xs uppercase tracking-widest text-primary">
                · 01 / Live
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="skeleton h-10 w-72 md:h-14" />
                <span className="text-mono text-xs text-muted-foreground">fetching…</span>
              </div>
            </div>
            <div className="skeleton hidden h-3 w-24 md:block" />
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>

      <section className="relative px-6 py-6 md:px-12 md:py-8">
        <div className="relative mx-auto max-w-6xl">
          <div className="mb-12">
            <div className="text-mono text-xs uppercase tracking-widest text-primary">
              · 02 / Forecast
            </div>
            <div className="skeleton mt-3 h-10 w-96 md:h-14" />
          </div>
          <Card className="glass rounded-3xl bg-transparent p-6 md:p-10">
            <div className="grid gap-10 md:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <TimelineColSkeleton key={i} />
              ))}
            </div>
          </Card>
        </div>
      </section>
    </>
  );
}
