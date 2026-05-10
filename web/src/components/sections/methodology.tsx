import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export function Methodology() {
  return (
    <section id="method" className="relative px-6 py-10 md:px-12 md:py-14">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12">
          <div className="text-mono text-xs uppercase tracking-widest text-primary">
            · 05 / Method
          </div>
          <h2 className="mt-3 text-3xl font-medium tracking-tight text-foreground md:text-5xl">
            Thresholds, <span className="text-muted-foreground">deterministic.</span>
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              c: 'var(--chl)',
              l: 'Safe',
              r: '≤ 10 µg/L',
              d: 'Good ecological condition. Low bloom risk; no restrictions.',
            },
            {
              c: 'var(--warn)',
              l: 'Caution',
              r: '10 — 22 µg/L',
              d: 'Moderate eutrophication risk. Monitor closely; avoid prolonged exposure for sensitive groups.',
            },
            {
              c: 'var(--bloom)',
              l: 'Avoid',
              r: '> 22 µg/L',
              d: 'High bloom risk; possible HAB conditions. Public health advisory; close to swimming.',
            },
          ].map((row) => (
            <Card key={row.l} className="glass rounded-3xl bg-transparent p-8">
              <div className="flex items-center gap-3">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ background: row.c, boxShadow: `0 0 12px ${row.c}` }}
                />
                <Badge
                  variant="outline"
                  className="text-mono border-transparent bg-transparent px-0 text-xs uppercase tracking-widest"
                  style={{ color: row.c }}
                >
                  {row.l}
                </Badge>
              </div>
              <div className="text-mono mt-5 text-3xl text-foreground">{row.r}</div>
              <p className="mt-4 text-sm text-muted-foreground">{row.d}</p>
            </Card>
          ))}
        </div>

        <Card className="glass mt-16 rounded-3xl bg-transparent p-8 md:p-12">
          <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
            <div>
              <div className="text-mono text-xs uppercase tracking-widest text-muted-foreground">
                Model card
              </div>
              <div className="mt-3 text-2xl font-medium text-foreground">bloom-forecaster</div>
              <div className="text-mono mt-1 text-xs text-muted-foreground">
                v0.1 · synthetic train set
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Target</dt>
                <dd className="text-mono mt-1 text-foreground">max chl-a, T+3..T+5</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Algorithm</dt>
                <dd className="text-mono mt-1 text-foreground">XGBoost regressor</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Inputs</dt>
                <dd className="text-mono mt-1 text-foreground">temp, salinity, NO₃, wind, lags</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Validation</dt>
                <dd className="text-mono mt-1 text-foreground">time-series split, MAE 1.8 µg/L</dd>
              </div>
            </dl>
          </div>
        </Card>
      </div>
    </section>
  );
}
