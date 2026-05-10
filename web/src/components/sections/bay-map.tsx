'use client';

import dynamic from 'next/dynamic';
import type { Location, RiskPrediction } from '@/lib/api';

type Props = {
  locations: Location[];
  risk: Record<string, RiskPrediction | undefined>;
};

const BayMapImpl = dynamic(
  () => import('./bay-map-impl').then((m) => m.BayMapImpl),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-muted/20">
        <div className="text-mono text-xs text-muted-foreground">Loading bay…</div>
      </div>
    ),
  },
);

export function BayMap(props: Props) {
  return <BayMapImpl {...props} />;
}
