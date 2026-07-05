import { SITE, STATS } from "@/lib/content";
import Sagittarius from "@/components/Sagittarius";

export default function Hero() {
  return (
    <section className="relative mx-auto max-w-5xl px-6 pb-24 pt-28 sm:pt-36">
      <Sagittarius className="pointer-events-none absolute -top-4 right-0 w-64 opacity-80 max-md:hidden lg:w-80" />
      <p className="font-mono text-sm text-accent">
        waterloo cs, class of 2031
      </p>
      <h1 className="mt-4 text-5xl font-semibold tracking-tight sm:text-7xl">
        {SITE.name}
      </h1>
      <p className="mt-6 max-w-xl text-xl leading-relaxed text-foreground/90 sm:text-2xl">
        {SITE.tagline}
      </p>
      <p className="mt-4 max-w-xl leading-relaxed text-muted">{SITE.sub}</p>
      <div className="mt-10 flex flex-wrap gap-x-10 gap-y-6">
        {STATS.map((s) => (
          <div key={s.label}>
            <div className="text-2xl font-semibold">{s.value}</div>
            <div className="mt-1 font-mono text-sm text-muted">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="mt-12 flex flex-wrap gap-4">
        <a
          href={SITE.resumeHref}
          className="rounded-md bg-accent px-5 py-2.5 font-medium text-background transition-opacity hover:opacity-85"
        >
          View resume
        </a>
        <a
          href={SITE.github}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-line px-5 py-2.5 font-medium text-foreground transition-colors hover:border-accent/60"
        >
          GitHub
        </a>
      </div>
    </section>
  );
}
