import { Suspense } from 'react';
import { SubscribeForm } from '@/components/sections/subscribe-form';

export const metadata = { title: 'Subscribe | iForeSea' };

export default function SubscribePage() {
  return (
    <section className="relative px-6 py-10 md:px-12 md:py-12">
      <div className="mx-auto max-w-3xl">
        <div className="text-mono text-xs uppercase tracking-widest text-primary">
          · Subscribe
        </div>
        <h2 className="mt-3 text-3xl font-medium tracking-tight text-foreground md:text-5xl">
          Daily forecast in your inbox.
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Pick a beach and a delivery hour. Each morning we will send the predicted
          HAB risk for the next three to five days, alongside current Burgas weather,
          so you can decide before heading out.
        </p>

        <div className="mt-8">
          <Suspense fallback={null}>
            <SubscribeForm />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
