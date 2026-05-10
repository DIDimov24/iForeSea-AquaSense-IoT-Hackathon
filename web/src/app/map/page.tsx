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
      <div className="flex h-full items-center justify-center">
        <div className="text-mono text-xs text-bloom">
          Could not load locations from API.
        </div>
      </div>
    );
  }

  return <BayMap locations={locations} risk={riskMap} />;
}

function MapLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-muted/20">
      <div className="text-mono text-xs text-muted-foreground">Loading bay…</div>
    </div>
  );
}

export default function MapPage() {
  return (
    <div className="h-full w-full">
      <Suspense fallback={<MapLoading />}>
        <MapData />
      </Suspense>
    </div>
  );
}
