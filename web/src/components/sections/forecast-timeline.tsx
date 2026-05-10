import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { RiskClass } from '@/lib/api';
import { riskColor, riskLabel } from '@/lib/risk';

export type TimelineBeach = {
  id: string;
  name: string;
  history: { date: string; chl: number }[];
  forecast: {
    value: number;
    risk: RiskClass;
    window: { start: string; end: string };
  };
};

const PLOT_W = 360;
const PLOT_H = 140;
const Y_MAX = 18;
const PAD_L = 28;
const PAD_R = 8;
const PAD_T = 8;
const PAD_B = 22;

function yToPx(v: number) {
  const inner = PLOT_H - PAD_T - PAD_B;
  return PAD_T + inner - (Math.min(v, Y_MAX) / Y_MAX) * inner;
}

function HistoryForecastChart({ beach }: { beach: TimelineBeach }) {
  const { history, forecast } = beach;
  const color = riskColor(forecast.risk);

  const inner = PLOT_W - PAD_L - PAD_R;
  const histDays = history.length;
  const forecastDays = 5;
  const totalDays = histDays + forecastDays;
  const dayStep = totalDays > 1 ? inner / (totalDays - 1) : inner;

  const histX = (i: number) => PAD_L + i * dayStep;

  const histPts = history.map((r, i) => `${histX(i)},${yToPx(r.chl)}`);
  const lastHistX = histX(histDays - 1);
  const lastHistY = yToPx(history[histDays - 1]?.chl ?? 0);

  const bandStartX = histX(histDays - 1 + 3);
  const bandEndX = histX(histDays - 1 + 5);
  const bandY = yToPx(forecast.value);

  const yThreshold5 = yToPx(5);
  const yThreshold12 = yToPx(12);

  const gradId = `band-${beach.id}`;

  return (
    <svg
      viewBox={`0 0 ${PLOT_W} ${PLOT_H}`}
      className="w-full"
      role="img"
      aria-label={`${beach.name} chlorophyll history and forecast`}
    >
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.45" />
          <stop offset="100%" stopColor={color} stopOpacity="0.05" />
        </linearGradient>
      </defs>

      <line
        x1={PAD_L}
        x2={PLOT_W - PAD_R}
        y1={yThreshold5}
        y2={yThreshold5}
        stroke="var(--warn)"
        strokeWidth={0.6}
        strokeDasharray="3 3"
        opacity={0.5}
      />
      <line
        x1={PAD_L}
        x2={PLOT_W - PAD_R}
        y1={yThreshold12}
        y2={yThreshold12}
        stroke="var(--bloom)"
        strokeWidth={0.6}
        strokeDasharray="3 3"
        opacity={0.5}
      />
      <text x={4} y={yThreshold5 + 3} className="text-mono" fontSize={8} fill="var(--warn)">
        5
      </text>
      <text x={4} y={yThreshold12 + 3} className="text-mono" fontSize={8} fill="var(--bloom)">
        12
      </text>

      {histPts.length > 1 && (
        <polyline
          fill="none"
          stroke="var(--foreground)"
          strokeOpacity={0.55}
          strokeWidth={1.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          points={histPts.join(' ')}
        />
      )}

      <line
        x1={lastHistX}
        x2={bandStartX}
        y1={lastHistY}
        y2={bandY}
        stroke={color}
        strokeWidth={1.2}
        strokeDasharray="2 3"
        opacity={0.7}
      />

      <rect
        x={bandStartX}
        y={PAD_T}
        width={bandEndX - bandStartX}
        height={PLOT_H - PAD_T - PAD_B}
        fill={`url(#${gradId})`}
      />
      <line
        x1={bandStartX}
        x2={bandEndX}
        y1={bandY}
        y2={bandY}
        stroke={color}
        strokeWidth={2}
      />

      <circle cx={lastHistX} cy={lastHistY} r={2.4} fill="var(--foreground)" />
      <circle
        cx={(bandStartX + bandEndX) / 2}
        cy={bandY}
        r={3}
        fill={color}
        stroke="var(--background)"
        strokeWidth={1.2}
      />

      <line
        x1={lastHistX}
        x2={lastHistX}
        y1={PAD_T}
        y2={PLOT_H - PAD_B}
        stroke="var(--border)"
        strokeWidth={0.6}
        strokeDasharray="2 3"
      />

      <text
        x={lastHistX}
        y={PLOT_H - 6}
        textAnchor="middle"
        fontSize={8}
        className="text-mono"
        fill="var(--muted-foreground)"
      >
        today
      </text>
      <text
        x={(bandStartX + bandEndX) / 2}
        y={PLOT_H - 6}
        textAnchor="middle"
        fontSize={8}
        className="text-mono"
        fill={color}
      >
        T+3..T+5
      </text>
      {history[0] && (
        <text
          x={PAD_L}
          y={PLOT_H - 6}
          textAnchor="start"
          fontSize={8}
          className="text-mono"
          fill="var(--muted-foreground)"
        >
          T-{history.length - 1}d
        </text>
      )}
    </svg>
  );
}

type Props = {
  beaches: TimelineBeach[];
  heading?: boolean;
};

export function ForecastTimeline({ beaches, heading = true }: Props) {
  const single = beaches.length === 1;

  return (
    <section id="forecast" className="relative px-6 py-6 md:px-12 md:py-8">
      <div className="relative mx-auto max-w-6xl">
        {heading && (
          <div className="mb-12">
            <div className="text-mono text-xs uppercase tracking-widest text-primary">
              · 02 / Forecast
            </div>
            <h2 className="mt-3 text-3xl font-medium tracking-tight text-foreground md:text-5xl">
              History to verdict.{' '}
              <span className="text-muted-foreground">Two weeks back, five days forward.</span>
            </h2>
          </div>
        )}

        <Card className="glass rounded-3xl bg-transparent p-6 md:p-10">
          <div className={`grid gap-10 ${single ? '' : 'md:grid-cols-3'}`}>
            {beaches.map((b) => {
              const color = riskColor(b.forecast.risk);
              return (
                <div key={b.id}>
                  <div className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {b.name}
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span
                      className="text-mono text-4xl font-light tabular-nums"
                      style={{ color }}
                    >
                      {b.forecast.value.toFixed(1)}
                    </span>
                    <span className="text-mono text-xs text-muted-foreground">µg/L max</span>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-mono mt-1 border-transparent bg-transparent px-0 text-xs uppercase tracking-widest"
                    style={{ color }}
                  >
                    {riskLabel(b.forecast.risk)}
                  </Badge>
                  <div className="text-mono mt-1 text-[10px] text-muted-foreground">
                    {b.forecast.window.start} → {b.forecast.window.end}
                  </div>
                  <div className="mt-4">
                    <HistoryForecastChart beach={b} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </section>
  );
}
