'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowRight, MousePointerClick } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { Location, Reading, RiskPrediction } from '@/lib/api';
import { getReadings } from '@/lib/api';
import { riskColor, riskLabel } from '@/lib/risk';

type Props = {
  locations: Location[];
  risk: Record<string, RiskPrediction | undefined>;
};

function buildIcon(color: string, isActive: boolean): L.DivIcon {
  return L.divIcon({
    className: 'ifs-pin-wrapper',
    html: `<span class="ifs-pin ${isActive ? 'ifs-pin-active' : ''}" style="--c:${color}">
      <span class="ifs-pin-pulse"></span>
      <span class="ifs-pin-dot"></span>
    </span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

export function BayMapImpl({ locations, risk }: Props) {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});

  const initialId =
    locations.find(l => l.location_id === 'central_beach_burgas')?.location_id ??
    locations[0]?.location_id ??
    null;
  const [active, setActive] = useState<string | null>(initialId);
  const [latest, setLatest] = useState<Reading | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;
    const center: [number, number] = locations.length
      ? [
          locations.reduce((a, l) => a + l.latitude, 0) / locations.length,
          locations.reduce((a, l) => a + l.longitude, 0) / locations.length,
        ]
      : [42.49, 27.48];
    const map = L.map(mapEl.current, {
      center,
      zoom: 12,
      zoomControl: false,
      attributionControl: true,
      scrollWheelZoom: true,
    });
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      },
    ).addTo(map);
    if (locations.length > 1) {
      const bounds = L.latLngBounds(
        locations.map(l => [l.latitude, l.longitude] as [number, number]),
      );
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13 });
    }
    mapRef.current = map;

    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(mapEl.current);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      markersRef.current = {};
    };
  }, [locations]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};
    locations.forEach(loc => {
      const r = risk[loc.location_id];
      const c = r ? riskColor(r.risk_class) : 'var(--primary)';
      const isActive = active === loc.location_id;
      const marker = L.marker([loc.latitude, loc.longitude], {
        icon: buildIcon(c, isActive),
        title: loc.name_en,
        riseOnHover: true,
      });
      marker.on('click', () => setActive(loc.location_id));
      marker.bindTooltip(loc.name_en, {
        direction: 'top',
        offset: [0, -10],
        opacity: 0.95,
        className: 'text-mono',
      });
      marker.addTo(map);
      markersRef.current[loc.location_id] = marker;
    });
    if (active) {
      const aLoc = locations.find(l => l.location_id === active);
      if (aLoc) map.panTo([aLoc.latitude, aLoc.longitude], { animate: true });
    }
  }, [locations, risk, active]);

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
      .then(rows => {
        if (!cancelled) setLatest(rows.at(-1) ?? null);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        if ((e as { name?: string })?.name === 'AbortError') return;
        setError(e instanceof Error ? e.message : 'Failed to load readings');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, [active]);

  const beach = locations.find(l => l.location_id === active) ?? null;
  const beachRisk = beach ? risk[beach.location_id] : undefined;
  const color = beachRisk ? riskColor(beachRisk.risk_class) : 'var(--muted-foreground)';

  return (
    <div className="flex h-full w-full flex-col md:flex-row">
      <div className="relative min-h-0 flex-1">
        <div ref={mapEl} className="absolute inset-0 z-0" />
        <div className="pointer-events-none absolute left-4 top-4 z-400 max-w-[calc(100%-2rem)]">
          <div className="text-mono flex items-center gap-2 rounded-full border border-border bg-card/85 px-4 py-2 text-xs uppercase tracking-widest text-foreground shadow-lg backdrop-blur-md">
            <MousePointerClick size={14} className="text-primary" />
            Click a pin to view more information
          </div>
        </div>
        <div className="pointer-events-none absolute bottom-4 left-4 z-400 flex flex-col gap-1 rounded-md border border-border bg-card/85 px-3 py-2 text-xs shadow-lg backdrop-blur-md">
          <div className="text-mono uppercase tracking-widest text-muted-foreground">
            Risk
          </div>
          <div className="flex items-center gap-3">
            {(
              [
                { c: 'var(--chl)', l: 'Safe' },
                { c: 'var(--warn)', l: 'Caution' },
                { c: 'var(--bloom)', l: 'Avoid' },
              ] as const
            ).map(it => (
              <div key={it.l} className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: it.c }}
                  aria-hidden
                />
                <span className="text-foreground">{it.l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <aside className="flex w-full shrink-0 flex-col overflow-y-auto border-t border-border bg-card md:w-[360px] md:border-l md:border-t-0">
        <div className="border-b border-border px-6 py-4">
          <div className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Burgas Bay
          </div>
          <div className="mt-1 text-lg font-medium text-foreground">Sensor stations</div>
        </div>

        <div className="px-6 py-4">
          <div className="text-mono mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
            Stations
          </div>
          <ul className="flex flex-col gap-1">
            {locations.map(l => {
              const r = risk[l.location_id];
              const c = r ? riskColor(r.risk_class) : 'var(--muted-foreground)';
              const on = active === l.location_id;
              return (
                <li key={l.location_id}>
                  <button
                    type="button"
                    onClick={() => setActive(l.location_id)}
                    className={[
                      'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                      on
                        ? 'bg-primary/10 text-foreground ring-1 ring-primary/30'
                        : 'text-muted-foreground hover:bg-secondary/15 hover:text-foreground',
                    ].join(' ')}
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: c }}
                      aria-hidden
                    />
                    <span className="flex-1 text-left">{l.name_en}</span>
                    {r && (
                      <span
                        className="text-mono text-[10px] uppercase tracking-widest"
                        style={{ color: c }}
                      >
                        {riskLabel(r.risk_class)}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <Separator />

        <div className="flex-1 px-6 py-5">
          {beach ? (
            <div>
              <div className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Selected station
              </div>
              <h3 className="mt-1 text-2xl font-medium text-foreground">
                {beach.name_en}
              </h3>
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

              <dl className="mt-5 text-sm">
                {error && (
                  <div className="text-mono text-xs text-bloom">
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
                className="text-mono mt-6 w-full rounded-full border-primary/40 bg-[color-mix(in_oklab,var(--primary)_8%,transparent)] text-xs uppercase tracking-widest text-foreground hover:border-primary/70 hover:bg-[color-mix(in_oklab,var(--primary)_18%,transparent)]"
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
        </div>
      </aside>
    </div>
  );
}
