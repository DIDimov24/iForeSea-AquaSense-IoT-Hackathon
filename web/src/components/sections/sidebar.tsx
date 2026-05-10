'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  Info,
  LayoutGrid,
  Map as MapIcon,
  type LucideIcon,
} from 'lucide-react';
import Image from 'next/image';
import Logo from '@/assets/iforesea_logo.png';
import { getRiskAll, type RiskClass } from '@/lib/api';
import { riskColor } from '@/lib/risk';
import { WeatherBlock } from './weather';

const NAV: ReadonlyArray<{ href: string; label: string; icon: LucideIcon }> = [
  { href: '/', label: 'Home', icon: LayoutGrid },
  { href: '/map', label: 'Map', icon: MapIcon },
  { href: '/method', label: 'Method', icon: BookOpen },
  { href: '/about', label: 'About', icon: Info },
];

const BEACHES = [
  { id: 'sarafovo', label: 'Sarafovo' },
  { id: 'central_beach_burgas', label: 'Central' },
  { id: 'kraimorie', label: 'Kraimorie' },
] as const;

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(href + '/');
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname() ?? '/';
  const [risks, setRisks] = useState<Record<string, RiskClass>>({});

  useEffect(() => {
    const ac = new AbortController();
    getRiskAll({ signal: ac.signal })
      .then((res) => {
        const map: Record<string, RiskClass> = {};
        for (const item of res.items) map[item.location_id] = item.risk_class;
        setRisks(map);
      })
      .catch(() => {});
    return () => ac.abort();
  }, []);

  return (
    <aside className="flex h-full w-full flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center gap-3 border-b border-border px-5">
        <Image src={Logo} alt="iForeSea logo" className="h-10 w-10 object-contain" />
        <span className="text-mono text-lg tracking-[0.12em] text-foreground">
          iForeSea
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="text-mono px-3 pb-2 text-sm uppercase tracking-widest text-muted-foreground">
          Workspace
        </div>
        <ul className="flex flex-col gap-1">
          {NAV.map(l => {
            const active = isActive(pathname, l.href);
            const IconCmp = l.icon;
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={onNavigate}
                  className={[
                    'flex items-center gap-3 rounded-md px-3 py-2.5 text-lg transition-colors',
                    active
                      ? 'bg-primary/15 font-medium text-foreground shadow-sm ring-1 ring-primary/30'
                      : 'text-muted-foreground hover:bg-secondary/15 hover:text-foreground',
                  ].join(' ')}
                  aria-current={active ? 'page' : undefined}
                >
                  <IconCmp
                    className={active ? 'text-primary' : 'text-muted-foreground'}
                    size={22}
                    strokeWidth={1.6}
                  />
                  <span>{l.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="text-mono mt-6 px-3 pb-2 text-sm uppercase tracking-widest text-muted-foreground">
          Beaches
        </div>
        <ul className="flex flex-col gap-1">
          {BEACHES.map(b => {
            const href = `/beaches/${b.id}`;
            const active = pathname === href;
            const risk = risks[b.id];
            const dotColor = risk ? riskColor(risk) : undefined;
            return (
              <li key={b.id}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  className={[
                    'flex items-center gap-3 rounded-md px-3 py-2.5 text-lg transition-colors',
                    active
                      ? 'bg-primary/15 font-medium text-foreground shadow-sm ring-1 ring-primary/30'
                      : 'text-muted-foreground hover:bg-secondary/15 hover:text-foreground',
                  ].join(' ')}
                  aria-current={active ? 'page' : undefined}
                >
                  <span
                    className={[
                      'h-2 w-2 rounded-full',
                      dotColor ? '' : 'bg-muted-foreground/40',
                    ].join(' ')}
                    style={
                      dotColor
                        ? { background: dotColor, boxShadow: `0 0 8px ${dotColor}` }
                        : undefined
                    }
                    aria-label={risk ? `Risk: ${risk}` : 'Risk: unknown'}
                  />
                  <span>{b.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-border p-4">
        <div className="mb-3 md:hidden">
          <WeatherBlock />
        </div>
        <div className="text-mono px-1 text-sm text-muted-foreground">
          v0.1 · synthetic data
        </div>
      </div>
    </aside>
  );
}
