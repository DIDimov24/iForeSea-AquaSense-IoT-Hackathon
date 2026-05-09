import { BayMap } from '@/components/sections';

export const metadata = { title: 'Map · AquaSense' };

export default function MapPage() {
  return (
    <>
      <section className="relative px-6 pt-10 pb-4 md:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="text-mono text-xs uppercase tracking-widest text-primary">· Map</div>
          <h1 className="mt-3 text-balance text-4xl font-medium tracking-tight text-foreground md:text-6xl">
            Burgas Bay, <span className="text-muted-foreground">in current.</span>
          </h1>
          <p className="mt-4 max-w-xl text-muted-foreground">
            Pick a sensor station to inspect live readings, or open a beach for the full forecast.
          </p>
        </div>
      </section>
      <BayMap />
    </>
  );
}
