'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { BEACHES, classify, riskColor, riskLabel } from '@/lib/risk';

const PINS: Record<string, { x: number; y: number }> = {
  sarafovo: { x: 32, y: 22 },
  central: { x: 48, y: 50 },
  kraimorie: { x: 68, y: 78 },
};

export function BayMap() {
  const [active, setActive] = useState<string | null>('central');
  const beach = BEACHES.find((b) => b.id === active) ?? null;

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
                    <circle
                      cx="3"
                      cy="3"
                      r="0.4"
                      fill="var(--primary)"
                      fillOpacity="0.18"
                    />
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

                {BEACHES.map((b) => {
                  const p = PINS[b.id];
                  const color = riskColor(classify(b.chl));
                  const isActive = active === b.id;
                  return (
                    <g
                      key={b.id}
                      onClick={() => setActive(b.id)}
                      className="cursor-pointer"
                    >
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={isActive ? 6 : 4}
                        fill={color}
                        opacity="0.18"
                      >
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
                      <circle cx={p.x} cy={p.y} r="1.4" fill={color} />
                      <text
                        x={p.x + 3}
                        y={p.y + 1}
                        fontSize="2.4"
                        fill={isActive ? color : 'var(--foreground)'}
                        fillOpacity={isActive ? 1 : 0.7}
                        className="text-mono uppercase"
                      >
                        {b.name}
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
                  <h3 className="mt-2 text-2xl font-medium text-foreground">{beach.name}</h3>
                  <Badge
                    variant="outline"
                    className="text-mono mt-1 border-transparent bg-transparent px-0 text-xs uppercase tracking-widest"
                    style={{ color: riskColor(classify(beach.chl)) }}
                  >
                    {riskLabel(classify(beach.chl))}
                  </Badge>

                  <dl className="mt-6 text-sm">
                    {[
                      { k: 'Chl-a', v: `${beach.chl.toFixed(1)} µg/L` },
                      { k: 'Sea temp', v: '21.4 °C' },
                      { k: 'Salinity', v: '17.8 PSU' },
                      { k: 'Nitrate', v: '0.42 mg/L' },
                      { k: 'Wind', v: 'NE 3.2 m/s' },
                    ].map((row, i, arr) => (
                      <div key={row.k}>
                        <div className="flex justify-between py-2">
                          <dt className="text-muted-foreground">{row.k}</dt>
                          <dd className="text-mono text-foreground">{row.v}</dd>
                        </div>
                        {i < arr.length - 1 && <Separator />}
                      </div>
                    ))}
                  </dl>

                  <Button
                    variant="outline"
                    size="lg"
                    nativeButton={false}
                    className="text-mono mt-8 rounded-full border-primary/40 bg-[color-mix(in_oklab,var(--primary)_8%,transparent)] text-xs uppercase tracking-widest text-foreground hover:border-primary/70 hover:bg-[color-mix(in_oklab,var(--primary)_18%,transparent)]"
                    render={
                      <Link href={`/beaches/${beach.id}`}>
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
