'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/', label: 'Home', icon: 'grid' },
  { href: '/map', label: 'Map', icon: 'map' },
  { href: '/method', label: 'Method', icon: 'book' },
  { href: '/about', label: 'About', icon: 'info' },
] as const;

const BEACHES = [
  { id: 'sarafovo', label: 'Sarafovo' },
  { id: 'central', label: 'Central' },
  { id: 'kraimorie', label: 'Kraimorie' },
] as const;

function Icon({ name }: { name: (typeof NAV)[number]['icon'] }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (name) {
    case 'grid':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1.2" />
          <rect x="14" y="3" width="7" height="7" rx="1.2" />
          <rect x="3" y="14" width="7" height="7" rx="1.2" />
          <rect x="14" y="14" width="7" height="7" rx="1.2" />
        </svg>
      );
    case 'map':
      return (
        <svg {...common}>
          <path d="M9 3 3 5v16l6-2 6 2 6-2V3l-6 2-6-2Z" />
          <path d="M9 3v16M15 5v16" />
        </svg>
      );
    case 'book':
      return (
        <svg {...common}>
          <path d="M4 4h10a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4V4Z" />
          <path d="M4 16h14" />
        </svg>
      );
    case 'info':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5M12 8h.01" />
        </svg>
      );
  }
}

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
                  <span
                    className={
                      active ? 'text-primary' : 'text-muted-foreground'
                    }
                  >
                    <Icon name={l.icon} />
                  </span>
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
