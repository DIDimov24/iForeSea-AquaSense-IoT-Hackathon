'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Info, LayoutGrid, Map as MapIcon, type LucideIcon } from 'lucide-react';

const NAV: ReadonlyArray<{ href: string; label: string; icon: LucideIcon }> = [
  { href: '/', label: 'Home', icon: LayoutGrid },
  { href: '/map', label: 'Map', icon: MapIcon },
  { href: '/method', label: 'Method', icon: BookOpen },
  { href: '/about', label: 'About', icon: Info },
];

const BEACHES = [
  { id: 'sarafovo', label: 'Sarafovo' },
  { id: 'central', label: 'Central' },
  { id: 'kraimorie', label: 'Kraimorie' },
] as const;

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(href + '/');
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname() ?? '/';

  return (
    <aside className="flex h-full w-full flex-col border-r border-border bg-card">
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-5">
        <div className="relative h-6 w-6">
          <div className="absolute inset-0 rounded-full border border-primary" />
          <div className="absolute inset-1.5 rounded-full bg-primary" />
        </div>
        <span className="text-mono text-sm tracking-[0.12em] text-foreground">
          iForeSea
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="text-mono px-3 pb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
          Workspace
        </div>
        <ul className="flex flex-col gap-0.5">
          {NAV.map((l) => {
            const active = isActive(pathname, l.href);
            const IconCmp = l.icon;
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={onNavigate}
                  className={[
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                    active
                      ? 'bg-secondary/10 text-foreground'
                      : 'text-muted-foreground hover:bg-secondary/10 hover:text-foreground',
                  ].join(' ')}
                  aria-current={active ? 'page' : undefined}
                >
                  <IconCmp
                    className={active ? 'text-primary' : 'text-muted-foreground'}
                    size={16}
                    strokeWidth={1.6}
                  />
                  <span>{l.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="text-mono mt-6 px-3 pb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
          Beaches
        </div>
        <ul className="flex flex-col gap-0.5">
          {BEACHES.map((b) => {
            const href = `/beaches/${b.id}`;
            const active = pathname === href;
            return (
              <li key={b.id}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  className={[
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                    active
                      ? 'bg-secondary/10 text-foreground'
                      : 'text-muted-foreground hover:bg-secondary/10 hover:text-foreground',
                  ].join(' ')}
                  aria-current={active ? 'page' : undefined}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                  <span>{b.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-border p-4">
        <div className="text-mono px-1 text-[10px] text-muted-foreground">
          v0.1 · synthetic data
        </div>
      </div>
    </aside>
  );
}
