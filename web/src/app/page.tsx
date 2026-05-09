import { ForecastTimeline, RiskStrip } from '@/components/sections';

export const metadata = { title: 'Home · AquaSense' };

export default function HomePage() {
  return (
    <>
      <section className="relative px-6 pt-10 pb-4 md:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="text-mono text-xs uppercase tracking-widest text-primary">
            · Home
          </div>
          <h1 className="mt-3 text-balance text-4xl font-medium tracking-tight text-foreground md:text-6xl">
            Burgas Bay,{' '}
            <span className="text-muted-foreground">three beaches, live.</span>
          </h1>
          <p className="mt-4 max-w-xl text-muted-foreground">
            Current chl-a readings and a 5-day forecast across Sarafovo, Central, and Kraimorie.
            Click a card to drill down.
          </p>
        </div>
      </section>
      <RiskStrip />
      <ForecastTimeline />
    </>
  );
}
