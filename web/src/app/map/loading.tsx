export default function MapLoading() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-muted/30">
      <div className="grid-bg absolute inset-0 opacity-40" />
      <div className="absolute inset-0">
        <div className="absolute inset-0 skeleton rounded-none" />
      </div>

      <div className="pointer-events-none absolute left-6 top-6 z-10 max-w-xs">
        <div className="glass rounded-2xl p-4">
          <div className="text-mono text-[10px] uppercase tracking-widest text-primary">
            · Bay
          </div>
          <div className="skeleton mt-2 h-4 w-32" />
          <div className="skeleton mt-3 h-3 w-44" />
          <div className="mt-4 space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="relative h-3 w-3">
                  <div className="ring-pulse absolute inset-0 rounded-full bg-primary/50" />
                  <div className="absolute inset-0 rounded-full bg-primary/60" />
                </div>
                <div className="skeleton h-3 flex-1" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute right-6 top-6 z-10">
        <div className="glass rounded-2xl px-4 py-2 text-mono text-xs text-muted-foreground">
          loading bay…
        </div>
      </div>

      {[
        { top: '32%', left: '28%' },
        { top: '48%', left: '52%' },
        { top: '64%', left: '38%' },
      ].map((p, i) => (
        <div
          key={i}
          className="pointer-events-none absolute z-10"
          style={{ top: p.top, left: p.left }}
        >
          <span
            className="ifs-pin"
            style={{ '--c': 'var(--muted-foreground)' } as React.CSSProperties}
          >
            <span className="ifs-pin-pulse" />
            <span className="ifs-pin-dot" />
          </span>
        </div>
      ))}
    </div>
  );
}
