'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/theme';
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
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-foreground hover:bg-secondary/10 md:hidden"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="min-w-0">
            <div className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {eyebrow}
            </div>
            <div className="truncate text-sm font-medium text-foreground">{title}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-mono hidden items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-[11px] text-muted-foreground sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--chl)] ring-pulse" />
            All sensors online
          </div>
          <div className="text-mono hidden text-[11px] text-muted-foreground lg:block">
            Burgas Bay · updated 04:12 ago
          </div>
          <ThemeToggle />
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm md:hidden"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="absolute inset-y-0 left-0 w-[260px]"
              onClick={(e) => e.stopPropagation()}
            >
              <Sidebar onNavigate={() => setOpen(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
