import { Suspense } from 'react';
import { ForecastTimeline, RiskStrip } from '@/components/sections';
import type { RiskStripItem } from '@/components/sections/risk-strip';
import type { TimelineBeach } from '@/components/sections/forecast-timeline';
import {
  PILOT_IDS,
  SHORT_NAMES,
  getReadings,
  getRiskAll,
  type LocationId,
  type Reading,
  type RiskPrediction,
} from '@/lib/api';
import { classify } from '@/lib/risk';

export const metadata = { title: 'Home · AquaSense' };

function buildItems(
  predictions: Map<string, RiskPrediction>,
  readings: Map<LocationId, Reading[]>,
): { strip: RiskStripItem[]; timeline: TimelineBeach[] } {
  const strip: RiskStripItem[] = [];
  const timeline: TimelineBeach[] = [];

  for (const id of PILOT_IDS) {
    const pred = predictions.get(id);
    const rows = readings.get(id) ?? [];
    const history = rows.map((r) => ({ date: r.date, chl: r.chlorophyll_a_ug_l }));
    const histVals = history.map((h) => h.chl);
    const trend =
      histVals.length >= 2 ? histVals[histVals.length - 1] - histVals[0] : null;
    const chl = pred?.predicted_chlorophyll_ug_l ?? histVals.at(-1) ?? 0;
    const risk = pred?.risk_class ?? classify(chl);
    const name = SHORT_NAMES[id];

    strip.push({ id, name, chl, risk, trend, history: histVals });

    if (pred) {
      timeline.push({
        id,
        name,
        history,
        forecast: {
          value: pred.predicted_chlorophyll_ug_l,
          risk: pred.risk_class,
          window: pred.forecast_window,
        },
      });
    }
  }
  return { strip, timeline };
}

async function HomeData() {
  const [risk, ...readingsList] = await Promise.all([
    getRiskAll(),
    ...PILOT_IDS.map((id) => getReadings(id, 14).catch(() => [] as Reading[])),
  ]);
  const predictions = new Map(risk.items.map((p) => [p.location_id, p]));
  const readings = new Map<LocationId, Reading[]>(
    PILOT_IDS.map((id, i) => [id, readingsList[i]]),
  );
  const { strip, timeline } = buildItems(predictions, readings);
  return (
    <>
      <RiskStrip items={strip} asOfDate={risk.as_of_date} />
      <ForecastTimeline beaches={timeline} />
    </>
  );
}

function LoadingSkeleton() {
  return (
    <div className="px-6 py-12 md:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="text-mono text-xs text-muted-foreground">Loading live readings…</div>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="glass h-56 animate-pulse rounded-3xl bg-muted/30"
              aria-hidden
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
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
      <Suspense fallback={<LoadingSkeleton />}>
        <HomeData />
      </Suspense>
    </>
  );
}
