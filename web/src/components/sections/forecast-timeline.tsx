'use client';

import { useState } from 'react';
import { BEACHES, classify, riskColor, riskLabel } from '@/lib/risk';

const DAYS = ['Today', 'T+1', 'T+2', 'T+3', 'T+4', 'T+5'];

type Props = {
  locationId?: 'sarafovo' | 'central' | 'kraimorie';
  heading?: boolean;
};

export function ForecastTimeline({ locationId, heading = true }: Props) {
  const [t, setT] = useState(3);
  const beaches = locationId ? BEACHES.filter((b) => b.id === locationId) : BEACHES;
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
              Drag to scrub{' '}
              <span className="text-muted-foreground">five days into the future.</span>
            </h2>
          </div>
        )}

        <div className="glass rounded-3xl p-8 md:p-12">
          <div className={`grid gap-10 ${single ? '' : 'md:grid-cols-3'}`}>
            {beaches.map((b) => {
              const v = b.forecast[t];
              const cls = classify(v);
              const color = riskColor(cls);
              return (
                <div key={b.id}>
                  <div className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {b.name}
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span
                      className="text-mono text-4xl font-light tabular-nums transition-colors"
                      style={{ color }}
                    >
                      {v.toFixed(1)}
                    </span>
                    <span className="text-mono text-xs text-muted-foreground">µg/L</span>
                  </div>
                  <div
                    className="text-mono mt-1 text-xs uppercase tracking-widest"
                    style={{ color }}
                  >
                    {riskLabel(cls)}
                  </div>
                  <div className="bg-muted mt-4 h-1.5 w-full overflow-hidden rounded-full">
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${Math.min((v / 20) * 100, 100)}%`,
                        background: color,
                        boxShadow: `0 0 12px ${color}`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-12">
            <input
              type="range"
              min={0}
              max={5}
              value={t}
              onChange={(e) => setT(Number(e.target.value))}
              className="accent-primary w-full"
            />
            <div className="text-mono mt-3 flex justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
              {DAYS.map((d, i) => (
                <button
                  key={d}
                  onClick={() => setT(i)}
                  className={`transition ${i === t ? 'text-primary' : 'hover:text-foreground'}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
