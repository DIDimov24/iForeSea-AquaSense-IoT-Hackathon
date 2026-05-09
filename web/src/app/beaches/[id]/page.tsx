import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ForecastTimeline, RiskStrip } from '@/components/sections';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            className="text-mono px-0 text-xs uppercase tracking-widest text-muted-foreground hover:bg-transparent hover:text-primary"
            render={
              <Link href="/map">
                <ArrowLeft /> Map
              </Link>
            }
          />
          <div className="mt-6">
            <div className="text-mono text-xs uppercase tracking-widest text-primary">
              · Beach · {beach.id}
            </div>
            <h1 className="mt-3 text-5xl font-medium tracking-tight text-foreground md:text-7xl">
              {beach.name}
            </h1>
            <Badge
              variant="outline"
              className="text-mono mt-3 border-transparent bg-transparent px-0 text-xs uppercase tracking-widest"
              style={{ color }}
            >
              {riskLabel(cls)} · {beach.chl.toFixed(1)} µg/L chl-a
            </Badge>
          </div>
        </div>
      </section>
      <RiskStrip locationId={id} heading={false} />
      <ForecastTimeline locationId={id} heading={false} />
    </>
  );
}
