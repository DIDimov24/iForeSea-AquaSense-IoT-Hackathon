import { Card } from '@/components/ui/card';

export default function BeachLoading() {
  return (
    <>
      <section className="relative border-b border-border bg-card">
        <div className="relative z-10 mx-auto max-w-6xl px-6 py-8 md:px-12 md:py-10">
          <div className="skeleton h-3 w-16" />
          <div className="mt-6">
            <div className="text-mono text-xs uppercase tracking-widest text-primary">
              · Beach
            </div>
            <div className="skeleton mt-3 h-12 w-72 md:h-16 md:w-md" />
            <div className="skeleton mt-3 h-3 w-48" />
            <div className="skeleton mt-2 h-3 w-64" />
          </div>
        </div>
      </section>

      <section className="relative px-6 py-6 md:px-12 md:py-8">
        <div className="mx-auto max-w-6xl">
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
            <div className="skeleton mt-6 h-7 w-1/2" />
            <div className="mt-6 flex items-baseline gap-2">
              <div className="skeleton h-12 w-28" />
              <div className="skeleton h-3 w-32" />
            </div>
            <div className="skeleton mt-3 h-3 w-44" />
            <div className="mt-6">
              <div className="skeleton h-12 w-full" />
              <div className="mt-2 flex justify-between">
                <div className="skeleton h-2 w-10" />
                <div className="skeleton h-2 w-10" />
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="relative px-6 py-6 md:px-12 md:py-8">
        <div className="mx-auto max-w-6xl">
          <Card className="glass rounded-3xl bg-transparent p-6 md:p-10">
            <div className="skeleton h-3 w-24" />
            <div className="mt-2 flex items-baseline gap-2">
              <div className="skeleton h-9 w-24" />
              <div className="skeleton h-3 w-16" />
            </div>
            <div className="skeleton mt-2 h-3 w-20" />
            <div className="skeleton mt-1 h-3 w-40" />
            <div className="skeleton mt-4 h-40 w-full rounded-md" />
          </Card>
        </div>
      </section>
    </>
  );
}
