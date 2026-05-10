import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { ArrowLeft } from 'lucide-react';
import { ForecastTimeline, RiskStrip } from '@/components/sections';
import type { RiskStripItem } from '@/components/sections/risk-strip';
import type { TimelineBeach } from '@/components/sections/forecast-timeline';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  PILOT_IDS,
  SHORT_NAMES,
  getLocation,
  getReadings,
  getRisk,
  type LocationId,
  type Reading,
} from '@/lib/api';
import { riskColor, riskLabel } from '@/lib/risk';

type Params = { id: string };

const IDS = PILOT_IDS;

export function generateStaticParams() {
  return IDS.map((id) => ({ id }));
}

function isLocationId(id: string): id is LocationId {
  return (IDS as string[]).includes(id);
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const name = isLocationId(id) ? SHORT_NAMES[id] : null;
  return { title: name ? `${name} · AquaSense` : 'Beach · AquaSense' };
}

async function BeachData({ id }: { id: LocationId }) {
  const [location, risk, readings] = await Promise.all([
    getLocation(id).catch(() => null),
    getRisk(id).catch(() => null),
    getReadings(id, 14).catch(() => [] as Reading[]),
  ]);

  if (!location && !risk) {
    return (
      <section className="px-6 py-16 md:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="text-mono text-xs text-bloom">
            Could not reach API. Verify NEXT_PUBLIC_API_URL and that the backend is running.
          </div>
        </div>
      </section>
    );
  }

  const name = location?.name_en ?? SHORT_NAMES[id];
  const histVals = readings.map((r) => r.chlorophyll_a_ug_l);
  const trend = histVals.length >= 2 ? histVals[histVals.length - 1] - histVals[0] : null;

  const stripItem: RiskStripItem = {
    id,
    name,
    chl: risk?.predicted_chlorophyll_ug_l ?? histVals.at(-1) ?? 0,
    risk: risk?.risk_class ?? 'green',
    trend,
    history: histVals,
  };

  const timeline: TimelineBeach[] = risk
    ? [
        {
          id,
          name,
          history: readings.map((r) => ({ date: r.date, chl: r.chlorophyll_a_ug_l })),
          forecast: {
            value: risk.predicted_chlorophyll_ug_l,
            risk: risk.risk_class,
            window: risk.forecast_window,
          },
        },
      ]
    : [];

  const cls = stripItem.risk;
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
              · Beach · {id}
            </div>
            <h1 className="mt-3 text-5xl font-medium tracking-tight text-foreground md:text-7xl">
              {name}
            </h1>
            {risk && (
              <Badge
                variant="outline"
                className="text-mono mt-3 border-transparent bg-transparent px-0 text-xs uppercase tracking-widest"
                style={{ color }}
              >
                {riskLabel(cls)} · {risk.predicted_chlorophyll_ug_l.toFixed(1)} µg/L (T+3..T+5)
              </Badge>
            )}
            {location && (
              <div className="text-mono mt-2 text-[10px] text-muted-foreground">
                {location.name_bg} · {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                {risk ? ` · model ${risk.model}` : ''}
              </div>
            )}
          </div>
        </div>
      </section>
      <RiskStrip items={[stripItem]} heading={false} />
      {timeline.length > 0 && <ForecastTimeline beaches={timeline} heading={false} />}
    </>
  );
}

function BeachLoading() {
  return (
    <div className="px-6 py-12 md:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="text-mono text-xs text-muted-foreground">Loading beach…</div>
        <div className="mt-6 h-56 animate-pulse rounded-3xl bg-muted/30" aria-hidden />
      </div>
    </div>
  );
}

export default async function BeachPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  if (!isLocationId(id)) notFound();

  return (
    <Suspense fallback={<BeachLoading />}>
      <BeachData id={id} />
    </Suspense>
  );
}
