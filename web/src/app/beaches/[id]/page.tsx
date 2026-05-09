import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ForecastTimeline, RiskStrip } from '@/components/sections';
import { BEACHES, classify, riskColor, riskLabel } from '@/lib/risk';

const IDS = ['sarafovo', 'central', 'kraimorie'] as const;
type BeachId = (typeof IDS)[number];

type Params = { id: string };

export function generateStaticParams() {
  return IDS.map((id) => ({ id }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const beach = BEACHES.find((b) => b.id === id);
  return { title: beach ? `${beach.name} · AquaSense` : 'Beach · AquaSense' };
}

export default async function BeachPage({ params }: { params: Promise<Params> }) {
  const { id: rawId } = await params;
  if (!IDS.includes(rawId as BeachId)) notFound();
  const id = rawId as BeachId;
  const beach = BEACHES.find((b) => b.id === id)!;
  const cls = classify(beach.chl);
  const color = riskColor(cls);

  return (
    <>
      <section className="relative border-b border-border bg-card">
        <div className="relative z-10 mx-auto max-w-6xl px-6 py-8 md:px-12 md:py-10">
          <Link
            href="/map"
            className="text-mono inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground transition hover:text-primary"
          >
            <span aria-hidden>←</span> Map
          </Link>
          <div className="mt-6">
            <div className="text-mono text-xs uppercase tracking-widest text-primary">
              · Beach · {beach.id}
            </div>
            <h1 className="mt-3 text-5xl font-medium tracking-tight text-foreground md:text-7xl">
              {beach.name}
            </h1>
            <div
              className="text-mono mt-3 text-xs uppercase tracking-widest"
              style={{ color }}
            >
              {riskLabel(cls)} · {beach.chl.toFixed(1)} µg/L chl-a
            </div>
          </div>
        </div>
      </section>
      <RiskStrip locationId={id} heading={false} />
      <ForecastTimeline locationId={id} heading={false} />
    </>
  );
}
