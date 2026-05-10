import Link from 'next/link';

export const metadata = { title: 'About | iForeSea' };

export default function AboutPage() {
  return (
    <section className="relative px-6 py-10 md:px-12 md:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="text-mono text-xs uppercase tracking-widest text-primary">· About</div>
        <h2 className="mt-3 text-3xl font-medium tracking-tight text-foreground md:text-5xl">
          Why iForeSea.
        </h2>
        <div className="mt-8 max-w-3xl space-y-6 text-base leading-relaxed text-muted-foreground">
          <p>
            Burgas Bay sees recurring harmful algal blooms each summer. By the time municipal
            testing flags a beach as unsafe, swimmers have already been in the water for days.
            iForeSea exists to push the verdict three to five days earlier.
          </p>
          <p>
            Inputs are buoy-mounted IoT sensors recording chlorophyll-a, temperature, salinity,
            and nitrate every fifteen minutes. A gradient-boosted regressor projects the maximum
            chl-a window across T+3..T+5, mapped deterministically to a green / yellow / red
            verdict.
          </p>
          <p>
            The current build is a hackathon prototype. The dataset is synthetic, the model is a
            stub, and the API is a single endpoint — but the pipeline shape is real and ready
            for the production sensors going in next season.
          </p>
          <div className="text-mono flex flex-wrap gap-3 pt-4 text-xs uppercase tracking-widest">
            <Link
              href="/method"
              className="rounded-full border border-border bg-card/40 px-4 py-2 text-foreground transition hover:border-primary/50"
            >
              Read the method
            </Link>
            <Link
              href="/"
              className="rounded-full bg-primary px-4 py-2 text-primary-foreground transition hover:opacity-90"
            >
              Open home
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
