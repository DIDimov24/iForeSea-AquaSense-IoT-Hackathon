'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { ThemeToggle } from '@/components/theme';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { SHORT_NAMES, getHealth, getRiskAll } from '@/lib/api';
import { Sidebar } from './sidebar';
import { WeatherChip } from './weather';

const TITLES: Record<string, { eyebrow: string; title: string }> = {
  '/': { eyebrow: 'Workspace', title: 'Home' },
  '/map': { eyebrow: 'Workspace', title: 'Bay Map' },
  '/method': { eyebrow: 'Docs', title: 'Method' },
  '/about': { eyebrow: 'Docs', title: 'About' },
};

function resolveTitle(pathname: string) {
  if (pathname.startsWith('/beaches/')) {
    const id = pathname.split('/')[2] ?? '';
    const label = SHORT_NAMES[id as keyof typeof SHORT_NAMES] ?? id;
    return { eyebrow: 'Beach', title: label };
  }
  return TITLES[pathname] ?? { eyebrow: '', title: '' };
}

export function Topbar() {
  const pathname = usePathname() ?? '/';
  const { eyebrow, title } = resolveTitle(pathname);
  const [open, setOpen] = useState(false);
  const [asOf, setAsOf] = useState<string | null>(null);
  const [online, setOnline] = useState<'unknown' | 'online' | 'offline'>('unknown');

  useEffect(() => {
    const ctrl = new AbortController();
    Promise.all([
      getRiskAll({ signal: ctrl.signal }).catch(() => null),
      getHealth({ signal: ctrl.signal }).catch(() => null),
    ]).then(([risk, health]) => {
      if (ctrl.signal.aborted) return;
      setAsOf(risk?.as_of_date ?? null);
      setOnline(health?.status === 'ok' ? 'online' : 'offline');
    });
    return () => ctrl.abort();
  }, []);

  const statusDot =
    online === 'online'
      ? 'bg-[var(--chl)]'
      : online === 'offline'
      ? 'bg-[var(--bloom)]'
      : 'bg-muted-foreground';
  const statusLabel =
    online === 'online'
      ? 'API online'
      : online === 'offline'
      ? 'API offline'
      : 'Checking…';

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-card/80 px-4 backdrop-blur-md md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="md:hidden"
          >
            <Menu />
          </Button>
          <div className="min-w-0">
            <div className="text-mono text-sm uppercase tracking-widest text-muted-foreground">
              {eyebrow}
            </div>
            <div className="truncate text-xl font-medium text-foreground">{title}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="text-mono hidden bg-background text-sm text-muted-foreground sm:inline-flex"
          >
            <span className={`h-1.5 w-1.5 rounded-full ring-pulse ${statusDot}`} />
            {statusLabel}
          </Badge>
          <WeatherChip asOfFallback={asOf} />
          <ThemeToggle />
        </div>
      </header>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-[260px] p-0 sm:max-w-[260px] md:hidden"
        >
          <Sidebar onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
