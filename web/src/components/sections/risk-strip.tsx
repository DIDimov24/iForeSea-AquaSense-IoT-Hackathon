import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { RiskClass } from '@/lib/api';
import { riskColor, riskLabel } from '@/lib/risk';

export type RiskStripItem = {
  id: string;
  name: string;
  chl: number;
  risk: RiskClass;
  trend: number | null;
  history: number[];
  latest?: {
    temperature_c: number;
    nitrate_no3_mg_l: number;
    phosphate_po4_mg_l: number;
    turbidity_ntu: number;
  };
  forecastWindow?: { start: string; end: string };
};


type Props = {
  items: RiskStripItem[];
  heading?: boolean;
  asOfDate?: string;
};

export function RiskStrip({ items, heading = true, asOfDate }: Props) {
  const single = items.length === 1;

  return (
    <section id="beaches" className="relative px-6 py-6 md:px-12 md:py-8">
      <div className="mx-auto max-w-6xl">
        {heading && (
          <div className="mb-12 flex items-end justify-between gap-6">
            <div>
              <div className="text-mono text-xs uppercase tracking-widest text-primary">
                · 01 / Live
              </div>
              <h2 className="mt-3 text-3xl font-medium tracking-tight text-foreground md:text-5xl">
                {single ? (
                  <>
                    {items[0].name}.{' '}
                    <span className="text-muted-foreground">Right now.</span>
                  </>
                ) : (
                  <>
                    Three beaches.{' '}
                    <span className="text-muted-foreground">One verdict each.</span>
                  </>
                )}
              </h2>
            </div>
            {asOfDate && (
              <div className="text-mono hidden text-xs text-muted-foreground md:block">
                as of {asOfDate}
              </div>
            )}
          </div>
        )}

        <div className={`grid gap-5 ${single ? '' : 'md:grid-cols-3'}`}>
          {items.map((b) => {
            const color = riskColor(b.risk);
            const trendUp = b.trend !== null && b.trend > 0;
            const CardEl = (
              <Card
                className={`glass group relative overflow-hidden rounded-3xl bg-transparent p-6 transition ${
                  single ? '' : 'hover:-translate-y-1'
                }`}
              >
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative h-3 w-3">
                      <div
                        className="ring-pulse absolute inset-0 rounded-full"
                        style={{ background: color }}
                      />
                      <div
                        className="absolute inset-0 rounded-full"
                        style={{ background: color }}
                      />
                    </div>
                    <Badge
                      variant="outline"
                      className="text-mono border-transparent bg-transparent px-0 text-[10px] uppercase tracking-widest text-muted-foreground"
                    >
                      {b.id}
                    </Badge>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-mono border-transparent bg-transparent px-0 text-[10px] uppercase tracking-widest"
                    style={{ color }}
                  >
                    {riskLabel(b.risk)}
                  </Badge>
                </div>

                <h3 className="relative mt-3 text-2xl font-medium text-foreground">{b.name}</h3>

                <div className="relative mt-3 flex items-baseline gap-2">
                  <span className="text-mono text-5xl font-light" style={{ color }}>
                    {b.chl.toFixed(1)}
                  </span>
                  <span className="text-mono text-xs text-muted-foreground">µg/L chl-a (T+3..T+5)</span>
                </div>

                {!single && b.forecastWindow && (
                  <div className="text-mono relative mt-2 text-xs font-medium tracking-wide text-foreground">
                    {b.forecastWindow.start}{' '}
                    <span className="text-muted-foreground">→</span>{' '}
                    {b.forecastWindow.end}
                  </div>
                )}

                {b.trend !== null && (
                  <div className="text-mono relative mt-2 flex items-center gap-2 text-xs">
                    <span style={{ color }}>{trendUp ? '▲' : '▼'}</span>
                    <span className="text-muted-foreground">
                      {trendUp ? '+' : ''}
                      {b.trend.toFixed(1)} over recent week
                    </span>
                  </div>
                )}

                {single && b.history.length > 0 && (() => {
                  const min = Math.min(...b.history);
                  const max = Math.max(...b.history);
                  const mean = b.history.reduce((a, n) => a + n, 0) / b.history.length;
                  const stats: Array<{ k: string; v: string }> = [
                    { k: 'Min', v: `${min.toFixed(1)} µg/L` },
                    { k: 'Mean', v: `${mean.toFixed(1)} µg/L` },
                    { k: 'Max', v: `${max.toFixed(1)} µg/L` },
                  ];
                  return (
                    <div className="relative mt-6 grid grid-cols-3 gap-2">
                      {stats.map((s) => (
                        <div
                          key={s.k}
                          className="rounded-lg border border-border bg-card/40 px-3 py-2"
                        >
                          <div className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                            {s.k}
                          </div>
                          <div className="text-mono mt-0.5 text-sm text-foreground">{s.v}</div>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {single && b.latest && (
                  <div className="relative mt-4">
                    <div className="text-mono mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                      Latest reading
                    </div>
                    <dl className="divide-y divide-border rounded-lg border border-border bg-card/40">
                      {[
                        { k: 'Sea temp', v: `${b.latest.temperature_c.toFixed(1)} °C` },
                        { k: 'Nitrate', v: `${b.latest.nitrate_no3_mg_l.toFixed(2)} mg/L` },
                        { k: 'Phosphate', v: `${b.latest.phosphate_po4_mg_l.toFixed(2)} mg/L` },
                        { k: 'Turbidity', v: `${b.latest.turbidity_ntu.toFixed(1)} NTU` },
                      ].map((row) => (
                        <div
                          key={row.k}
                          className="flex items-center justify-between px-3 py-2 text-sm"
                        >
                          <dt className="text-muted-foreground">{row.k}</dt>
                          <dd className="text-mono text-foreground">{row.v}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
              </Card>
            );
            return single ? (
              <div key={b.id}>{CardEl}</div>
            ) : (
              <Link key={b.id} href={`/beaches/${b.id}`} className="block">
                {CardEl}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
