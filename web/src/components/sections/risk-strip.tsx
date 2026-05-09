import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { BEACHES, classify, riskColor, riskLabel } from '@/lib/risk';

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const w = 200;
  const h = 40;
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => {
    const x = i * step;
    const y = h - ((v - min) / (max - min || 1)) * h;
    return `${x},${y}`;
  });
  const id = `g-${color.replace(/[^a-z0-9]/gi, '')}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="w-full">
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pts.join(' ')}
      />
      <polygon fill={`url(#${id})`} points={`0,${h} ${pts.join(' ')} ${w},${h}`} />
    </svg>
  );
}

type Props = {
  locationId?: 'sarafovo' | 'central' | 'kraimorie';
  heading?: boolean;
};

export function RiskStrip({ locationId, heading = true }: Props) {
  const beaches = locationId ? BEACHES.filter((b) => b.id === locationId) : BEACHES;
  const single = beaches.length === 1;

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
                    {beaches[0].name}.{' '}
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
            <div className="text-mono hidden text-xs text-muted-foreground md:block">
              updated 04:12 ago
            </div>
          </div>
        )}

        <div className={`grid gap-5 ${single ? '' : 'md:grid-cols-3'}`}>
          {beaches.map((b) => {
            const cls = classify(b.chl);
            const color = riskColor(cls);
            const trendUp = b.trend > 0;
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
                    {riskLabel(cls)}
                  </Badge>
                </div>

                <h3 className="relative mt-6 text-2xl font-medium text-foreground">{b.name}</h3>

                <div className="relative mt-6 flex items-baseline gap-2">
                  <span className="text-mono text-5xl font-light" style={{ color }}>
                    {b.chl.toFixed(1)}
                  </span>
                  <span className="text-mono text-xs text-muted-foreground">µg/L chl-a</span>
                </div>

                <div className="text-mono relative mt-2 flex items-center gap-2 text-xs">
                  <span style={{ color }}>{trendUp ? '▲' : '▼'}</span>
                  <span className="text-muted-foreground">
                    {trendUp ? '+' : ''}
                    {b.trend.toFixed(1)} over 24h
                  </span>
                </div>

                <div className="relative mt-6">
                  <Sparkline data={b.forecast} color={color} />
                  <div className="text-mono mt-2 flex justify-between text-[10px] text-muted-foreground">
                    <span>T+0</span>
                    <span>T+3</span>
                    <span>T+5</span>
                  </div>
                </div>
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
