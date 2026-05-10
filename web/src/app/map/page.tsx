import { BayMap } from '@/components/sections';
import { getLocations, getRiskAll, type RiskPrediction } from '@/lib/api';

export const metadata = { title: 'Map | iForeSea' };

export default async function MapPage() {
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
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-mono text-xs text-bloom">
          Could not load locations from API.
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <BayMap locations={locations} risk={riskMap} />
    </div>
  );
}
