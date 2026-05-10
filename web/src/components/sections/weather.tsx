'use client';

import { useEffect, useState } from 'react';
import { getWeather, type Weather } from '@/lib/weather';

function useWeather() {
  const [weather, setWeather] = useState<Weather | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    getWeather({ signal: ctrl.signal })
      .then((w) => {
        if (!ctrl.signal.aborted) setWeather(w);
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, []);

  return weather;
}

export function WeatherChip({ asOfFallback }: { asOfFallback: string | null }) {
  const weather = useWeather();
  const asOf = weather?.asOfDate ?? asOfFallback;

  if (!weather) {
    if (!asOf) return null;
    return (
      <div className="text-mono hidden text-sm text-muted-foreground lg:block">
        Burgas Bay · as of {asOf}
      </div>
    );
  }

  const { Icon, iconLabel } = weather;

  return (
    <>
      <div
        className="text-mono hidden items-center gap-1.5 text-sm text-muted-foreground md:inline-flex lg:hidden"
        aria-label={`Weather in Burgas: ${weather.temperatureC} degrees Celsius, ${iconLabel}, ${weather.precipitationProbability} percent chance of rain`}
      >
        <span>{weather.temperatureC}°C</span>
        <Icon aria-hidden="true" size={16} strokeWidth={1.6} />
        <span>{weather.precipitationProbability}%</span>
      </div>
      <div className="text-mono hidden items-center gap-1.5 text-sm text-muted-foreground lg:inline-flex">
        <span>Burgas</span>
        <span aria-hidden="true">·</span>
        <span>{weather.temperatureC}°C</span>
        <Icon aria-label={iconLabel} size={16} strokeWidth={1.6} />
        <span aria-hidden="true">·</span>
        <span>{weather.precipitationProbability}% rain</span>
        {asOf && (
          <>
            <span aria-hidden="true">·</span>
            <span>as of {asOf}</span>
          </>
        )}
      </div>
    </>
  );
}

export function WeatherBlock() {
  const weather = useWeather();
  if (!weather) return null;

  const { Icon, iconLabel } = weather;

  return (
    <div className="rounded-md border border-border bg-background/40 px-3 py-2.5">
      <div className="text-mono flex items-center gap-2 text-base text-foreground">
        <span>Burgas</span>
        <span aria-hidden="true" className="text-muted-foreground">
          ·
        </span>
        <span>{weather.temperatureC}°C</span>
        <Icon aria-label={iconLabel} size={18} strokeWidth={1.6} />
      </div>
      <div className="text-mono mt-1 text-sm text-muted-foreground">
        {weather.precipitationProbability}% chance of rain
      </div>
      {weather.asOfDate && (
        <div className="text-mono mt-0.5 text-sm text-muted-foreground">
          as of {weather.asOfDate}
        </div>
      )}
    </div>
  );
}
