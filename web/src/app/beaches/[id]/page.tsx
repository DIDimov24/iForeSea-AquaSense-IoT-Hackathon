import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image, { type StaticImageData } from 'next/image';
import { ArrowLeft } from 'lucide-react';
import SarafovoImg from '@/assets/beaches/sarafovo.webp';
import CentralImg from '@/assets/beaches/central.webp';
import KraimorieImg from '@/assets/beaches/kraimorie.webp';
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

const BEACH_IMAGES: Record<LocationId, StaticImageData> = {
  sarafovo: SarafovoImg,
  central_beach_burgas: CentralImg,
  kraimorie: KraimorieImg,
};

export function generateStaticParams() {
  return IDS.map((id) => ({ id }));
}

function isLocationId(id: string): id is LocationId {
  return (IDS as string[]).includes(id);
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const name = isLocationId(id) ? SHORT_NAMES[id] : null;
  return { title: name ? `${name} | iForeSea` : 'Beach | iForeSea' };
}

export default async function BeachPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  if (!isLocationId(id)) notFound();

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

  const latestReading = readings.at(-1);
  const stripItem: RiskStripItem = {
    id,
    name,
    chl: risk?.predicted_chlorophyll_ug_l ?? histVals.at(-1) ?? 0,
    risk: risk?.risk_class ?? 'green',
    trend,
    history: histVals,
    latest: latestReading
      ? {
          temperature_c: latestReading.temperature_c,
          nitrate_no3_mg_l: latestReading.nitrate_no3_mg_l,
          phosphate_po4_mg_l: latestReading.phosphate_po4_mg_l,
          turbidity_ntu: latestReading.turbidity_ntu,
        }
      : undefined,
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
      <section className="relative isolate min-h-[260px] overflow-hidden border-b border-border bg-card md:min-h-[360px]">
        <Image
          src={BEACH_IMAGES[id]}
          alt={`${name} beach`}
          placeholder="blur"
          priority
          fill
          sizes="100vw"
          className="absolute inset-0 -z-10 object-cover object-[center_40%]"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-linear-to-t from-background via-background/70 to-background/10"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-linear-to-r from-background/80 via-background/30 to-transparent"
        />

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
          <div className="mt-6 max-w-2xl">
            <div className="text-mono text-xs uppercase tracking-widest text-primary">
              · Beach · {id}
            </div>
            <h1 className="mt-3 text-5xl font-medium tracking-tight text-foreground drop-shadow-sm md:text-7xl">
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
