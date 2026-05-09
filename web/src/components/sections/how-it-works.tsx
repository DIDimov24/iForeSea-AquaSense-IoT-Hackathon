import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

const STEPS = [
  {
    n: '01',
    t: 'Sensors',
    d: 'IoT buoys read chlorophyll-a, temperature, salinity, and nitrate every 15 minutes.',
    tag: 'data/raw',
  },
  {
    n: '02',
    t: 'Features',
    d: 'Pandas pipeline rolls 24/72h windows, lags, and weather joins into model-ready frames.',
    tag: 'ml/features',
  },
  {
    n: '03',
    t: 'Forecast',
    d: 'Gradient-boosted regressor predicts max chl-a over T+3..T+5. Artifacted to joblib.',
    tag: 'ml/models/*.pkl',
  },
  {
    n: '04',
    t: 'Verdict',
    d: 'FastAPI loads model, exposes /risk/{location_id}. Web fetches and renders the badge.',
    tag: 'api → web',
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="relative px-6 py-10 md:px-12 md:py-14">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12">
          <div className="text-mono text-xs uppercase tracking-widest text-primary">
            · 04 / Pipeline
          </div>
          <h2 className="mt-3 text-3xl font-medium tracking-tight text-foreground md:text-5xl">
            From buoy to badge <span className="text-muted-foreground">in four steps.</span>
          </h2>
        </div>

        <div className="relative grid gap-4 md:grid-cols-4">
          {STEPS.map((s) => (
            <Card
              key={s.n}
              className="glass relative rounded-2xl bg-transparent p-6 transition hover:border-primary/40"
            >
              <div className="text-mono text-xs text-primary">{s.n}</div>
              <h3 className="mt-4 text-lg font-medium text-foreground">{s.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
              <Badge
                variant="outline"
                className="text-mono mt-5 w-fit rounded-full border-border px-2.5 py-1 text-[10px] text-muted-foreground"
              >
                {s.tag}
              </Badge>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
