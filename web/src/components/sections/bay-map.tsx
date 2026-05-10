'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { Location, Reading, RiskPrediction } from '@/lib/api';
import { getReadings } from '@/lib/api';
import { riskColor, riskLabel } from '@/lib/risk';

const PINS: Record<string, { x: number; y: number }> = {
  sarafovo: { x: 32, y: 22 },
  central_beach_burgas: { x: 48, y: 50 },
  kraimorie: { x: 68, y: 78 },
};

type Props = {
  locations: Location[];
  risk: Record<string, RiskPrediction | undefined>;
};

export function BayMap({ locations, risk }: Props) {
  const initialId =
    locations.find((l) => l.location_id === 'central_beach_burgas')?.location_id ??
    locations[0]?.location_id ??
    null;
  const [active, setActive] = useState<string | null>(initialId);
  const [latest, setLatest] = useState<Reading | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!active) return;
    const ctrl = new AbortController();
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setLoading(true);
      setError(null);
      setLatest(null);
    });
    getReadings(active, 1, { signal: ctrl.signal })
      .then((rows) => {
        if (cancelled) return;
        setLatest(rows.at(-1) ?? null);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        if ((e as { name?: string })?.name === 'AbortError') return;
        setError(e instanceof Error ? e.message : 'Failed to load readings');
        setLatest(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, [active]);

  const beach = locations.find((l) => l.location_id === active) ?? null;
  const beachRisk = beach ? risk[beach.location_id] : undefined;
  const color = beachRisk ? riskColor(beachRisk.risk_class) : 'var(--muted-foreground)';

  return (
    <section id="bay" className="relative px-6 py-10 md:px-12 md:py-14">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12">
          <div className="text-mono text-xs uppercase tracking-widest text-primary">
            · 03 / Bay
          </div>
          <h2 className="mt-3 text-3xl font-medium tracking-tight text-foreground md:text-5xl">
            Burgas Bay, <span className="text-muted-foreground">in current.</span>
          </h2>
        </div>

        <Card className="glass relative overflow-hidden rounded-3xl bg-transparent p-0">
          <div className="grid gap-0 md:grid-cols-[1fr_320px]">
            <div className="relative aspect-[4/3] overflow-hidden bg-muted">
              <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
                <defs>
                  <radialGradient id="water" cx="50%" cy="50%" r="60%">
                    <stop offset="0%" stopColor="var(--card)" stopOpacity="1" />
                    <stop offset="100%" stopColor="var(--muted)" stopOpacity="1" />
                  </radialGradient>
                  <pattern
                    id="ripple"
                    x="0"
                    y="0"
                    width="6"
                    height="6"
                    patternUnits="userSpaceOnUse"
                  >
                    <circle cx="3" cy="3" r="0.4" fill="var(--primary)" fillOpacity="0.18" />
                  </pattern>
                </defs>
                <rect width="100" height="100" fill="url(#water)" />
                <rect width="100" height="100" fill="url(#ripple)" />

                <path
                  d="M0,0 L0,30 Q15,28 22,18 Q28,8 38,12 Q42,4 50,2 L0,0 Z"
                  fill="var(--background)"
                  stroke="var(--border)"
                  strokeWidth="0.3"
                />
                <path
                  d="M100,100 L100,60 Q90,62 82,72 Q74,82 60,86 Q52,94 50,100 Z"
                  fill="var(--background)"
                  stroke="var(--border)"
                  strokeWidth="0.3"
                />

                {locations.map((loc) => {
                  const p = PINS[loc.location_id] ?? { x: 50, y: 50 };
                  const r = risk[loc.location_id];
                  const c = r ? riskColor(r.risk_class) : 'var(--muted-foreground)';
                  const isActive = active === loc.location_id;
                  return (
                    <g
                      key={loc.location_id}
                      onClick={() => setActive(loc.location_id)}
                      className="cursor-pointer"
                    >
                      <circle cx={p.x} cy={p.y} r={isActive ? 6 : 4} fill={c} opacity="0.18">
                        <animate
                          attributeName="r"
                          values={`${isActive ? 6 : 4};${isActive ? 12 : 9};${isActive ? 6 : 4}`}
                          dur="2.4s"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="opacity"
                          values="0.4;0;0.4"
                          dur="2.4s"
                          repeatCount="indefinite"
                        />
                      </circle>
                      <circle cx={p.x} cy={p.y} r="1.4" fill={c} />
                      <text
                        x={p.x + 3}
                        y={p.y + 1}
                        fontSize="2.4"
                        fill={isActive ? c : 'var(--foreground)'}
                        fillOpacity={isActive ? 1 : 0.7}
                        className="text-mono uppercase"
                      >
                        {loc.name_en}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            <aside className="border-t border-border p-8 md:border-l md:border-t-0">
              {beach ? (
                <div>
                  <div className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Sensor station
                  </div>
                  <h3 className="mt-2 text-2xl font-medium text-foreground">{beach.name_en}</h3>
                  {beachRisk && (
                    <Badge
                      variant="outline"
                      className="text-mono mt-1 border-transparent bg-transparent px-0 text-xs uppercase tracking-widest"
                      style={{ color }}
                    >
                      {riskLabel(beachRisk.risk_class)} ·{' '}
                      {beachRisk.predicted_chlorophyll_ug_l.toFixed(1)} µg/L T+3..T+5
                    </Badge>
                  )}

                  <dl className="mt-6 text-sm">
                    {error && (
                      <div className="text-mono text-xs text-[var(--bloom)]">
                        Readings unavailable. {error}
                      </div>
                    )}
                    {loading && !latest && (
                      <div className="text-mono text-xs text-muted-foreground">Loading…</div>
                    )}
                    {latest &&
                      [
                        { k: 'Chl-a', v: `${latest.chlorophyll_a_ug_l.toFixed(2)} µg/L` },
                        { k: 'Sea temp', v: `${latest.temperature_c.toFixed(1)} °C` },
                        { k: 'Nitrate', v: `${latest.nitrate_no3_mg_l.toFixed(2)} mg/L` },
                        { k: 'Phosphate', v: `${latest.phosphate_po4_mg_l.toFixed(2)} mg/L` },
                        { k: 'Turbidity', v: `${latest.turbidity_ntu.toFixed(1)} NTU` },
                      ].map((row, i, arr) => (
                        <div key={row.k}>
                          <div className="flex justify-between py-2">
                            <dt className="text-muted-foreground">{row.k}</dt>
                            <dd className="text-mono text-foreground">{row.v}</dd>
                          </div>
                          {i < arr.length - 1 && <Separator />}
                        </div>
                      ))}
                    {latest && (
                      <div className="text-mono mt-3 text-[10px] uppercase tracking-widest text-muted-foreground">
                        reading {latest.date}
                      </div>
                    )}
                  </dl>

                  <Button
                    variant="outline"
                    size="lg"
                    nativeButton={false}
                    className="text-mono mt-8 rounded-full border-primary/40 bg-[color-mix(in_oklab,var(--primary)_8%,transparent)] text-xs uppercase tracking-widest text-foreground hover:border-primary/70 hover:bg-[color-mix(in_oklab,var(--primary)_18%,transparent)]"
                    render={
                      <Link href={`/beaches/${beach.location_id}`}>
                        Open beach <ArrowRight />
                      </Link>
                    }
                  />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Pick a pin.</p>
              )}
            </aside>
          </div>
        </Card>
      </div>
    </section>
  );
}
