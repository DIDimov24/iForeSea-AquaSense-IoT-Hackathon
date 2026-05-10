'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="px-6 py-16 md:px-12">
      <div className="mx-auto max-w-3xl">
        <div className="text-mono text-xs uppercase tracking-widest text-bloom">
          · Error
        </div>
        <h2 className="mt-3 text-3xl font-medium tracking-tight text-foreground md:text-4xl">
          Something broke fetching live data.
        </h2>
        <p className="mt-4 text-sm text-muted-foreground">
          Verify the API is reachable at <code className="text-mono">NEXT_PUBLIC_API_URL</code>{' '}
          (default <code className="text-mono">http://localhost:8000</code>).
        </p>
        {error?.message && (
          <pre className="text-mono mt-6 overflow-auto rounded-2xl border border-border bg-card/40 p-4 text-xs text-muted-foreground">
            {error.message}
          </pre>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={reset}
          className="text-mono mt-6 rounded-full text-xs uppercase tracking-widest"
        >
          Retry
        </Button>
      </div>
    </section>
  );
}
