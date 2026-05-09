import { HowItWorks, Methodology } from '@/components/sections';

export const metadata = { title: 'Method · AquaSense' };

export default function MethodPage() {
  return (
    <>
      <section className="relative px-6 pt-10 pb-4 md:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="text-mono text-xs uppercase tracking-widest text-primary">· Method</div>
          <h1 className="mt-3 text-balance text-4xl font-medium tracking-tight text-foreground md:text-6xl">
            How the forecast works,{' '}
            <span className="text-muted-foreground">end to end.</span>
          </h1>
          <p className="mt-4 max-w-xl text-muted-foreground">
            From buoy readings to a deterministic green/yellow/red verdict — pipeline, thresholds,
            and model card.
          </p>
        </div>
      </section>
      <HowItWorks />
      <Methodology />
    </>
  );
}
