import { Suspense } from 'react';
import { BayMap } from '@/components/sections';
import { getLocations, getRiskAll, type RiskPrediction } from '@/lib/api';

export const metadata = { title: 'Map | iForeSea' };

async function MapData() {
  const [locations, risk] = await Promise.all([
    getLocations().catch(() => []),
    getRiskAll().catch(() => null),
  ]);
  const riskMap: Record<string, RiskPrediction | undefined> = {};
  if (risk) {
    for (const item of risk.items) {
      riskMap[item.location_id] = item;
    }
  }

  if (locations.length === 0) {
    return (
      <section className="px-6 py-16 md:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="text-mono text-xs text-bloom">
            Could not load locations from API.
          </div>
        </div>
      </section>
    );
  }

  return <BayMap locations={locations} risk={riskMap} />;
}

function MapLoading() {
  return (
    <div className="px-6 py-12 md:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="text-mono text-xs text-muted-foreground">Loading bay…</div>
        <div className="mt-6 aspect-4/3 animate-pulse rounded-3xl bg-muted/30" aria-hidden />
      </div>
    </div>
  );
}

export default function MapPage() {
  return (
    <>
      <section className="relative px-6 pt-10 pb-4 md:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="text-mono text-xs uppercase tracking-widest text-primary">· Map</div>
          <h1 className="mt-3 text-balance text-4xl font-medium tracking-tight text-foreground md:text-6xl">
            Burgas Bay, <span className="text-muted-foreground">in current.</span>
          </h1>
          <p className="mt-4 max-w-xl text-muted-foreground">
            Pick a sensor station to inspect live readings, or open a beach for the full forecast.
          </p>
        </div>
      </section>
      <Suspense fallback={<MapLoading />}>
        <MapData />
      </Suspense>
    </>
  );
}
