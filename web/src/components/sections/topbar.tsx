'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { ThemeToggle } from '@/components/theme';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Sidebar } from './sidebar';

const TITLES: Record<string, { eyebrow: string; title: string }> = {
  '/': { eyebrow: 'Workspace', title: 'Home' },
  '/map': { eyebrow: 'Workspace', title: 'Bay Map' },
  '/method': { eyebrow: 'Docs', title: 'Method' },
  '/about': { eyebrow: 'Docs', title: 'About' },
};

function resolveTitle(pathname: string) {
  if (pathname.startsWith('/beaches/')) {
    const id = pathname.split('/')[2] ?? '';
    return { eyebrow: 'Beach', title: id.charAt(0).toUpperCase() + id.slice(1) };
  }
  return TITLES[pathname] ?? { eyebrow: '', title: '' };
}

export function Topbar() {
  const pathname = usePathname() ?? '/';
  const { eyebrow, title } = resolveTitle(pathname);
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-border bg-card/80 px-4 backdrop-blur-md md:px-6">
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
            <div className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {eyebrow}
            </div>
            <div className="truncate text-sm font-medium text-foreground">{title}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="text-mono hidden bg-background text-[11px] text-muted-foreground sm:inline-flex"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--chl)] ring-pulse" />
            All sensors online
          </Badge>
          <div className="text-mono hidden text-[11px] text-muted-foreground lg:block">
            Burgas Bay · updated 04:12 ago
          </div>
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
