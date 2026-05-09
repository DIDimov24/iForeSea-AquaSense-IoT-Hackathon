'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === 'dark';
  const toggle = () => setTheme(isDark ? 'light' : 'dark');

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className="relative inline-flex h-9 w-16 items-center rounded-full border border-border bg-card/60 transition hover:border-primary/50"
    >
      <span
        className="absolute top-1 left-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform duration-300 ease-out"
        style={{ transform: mounted && isDark ? 'translateX(28px)' : 'translateX(0)' }}
      >
        {mounted && (isDark ? <Moon size={14} strokeWidth={2} /> : <Sun size={14} strokeWidth={2} />)}
      </span>
      <span className="pointer-events-none ml-2 inline-flex w-7 justify-center opacity-40">
        <Sun size={14} strokeWidth={2} aria-hidden />
      </span>
      <span className="pointer-events-none mr-2 inline-flex w-7 justify-center opacity-40">
        <Moon size={14} strokeWidth={2} aria-hidden />
      </span>
    </button>
  );
}
