import { SITE, STATS } from "@/lib/content";
import Constellation from "@/components/Constellation";
import AnimatedStatValue from "@/components/animations/AnimatedStatValue";
import TypewriterSubtitle from "@/components/animations/TypewriterSubtitle";

export default function About() {
  return (
    <section
      id="about"
      className="relative scroll-mt-14 pb-16 pt-36 md:scroll-mt-24 md:py-32"
    >
      {/* On phones, the tall top padding is the space Sagittarius sits in,
          so the constellation stays clear of the eyebrow text below it. */}
      {/* Stationary ember bloom behind Sagittarius */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-20 h-[300px] w-[300px] md:-top-10 md:right-0 md:h-[420px] md:w-[420px]"
        style={{
          background:
            "radial-gradient(closest-side, rgba(224, 69, 95, 0.07), transparent 70%)",
        }}
      />
      <Constellation
        name="sagittarius"
        prominent
        className="pointer-events-none absolute right-0 top-0 w-36 md:right-4 md:w-72 lg:w-80"
      />

      <p className="text-xs uppercase tracking-[0.14em] text-brass">
        {SITE.identity}
      </p>
      <h1 className="mt-5 font-serif text-5xl text-primary sm:text-7xl">
        {SITE.name}
      </h1>
      <p className="mt-6 max-w-xl text-lg leading-relaxed text-primary/90 sm:text-xl">
        <TypewriterSubtitle text={SITE.tagline} />
      </p>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-body">
        {SITE.sub}
      </p>

      <div className="mt-10 flex flex-wrap gap-x-10 gap-y-8">
        {STATS.map((s) => (
          <div key={s.eyebrow} className="border-l-2 border-ember pl-4">
            <div className="text-[10px] uppercase tracking-[0.14em] text-brass">
              {s.eyebrow}
            </div>
            {/* An invisible ::before copy of the final value reserves the
                width, so the count-up overlay never shifts its neighbors.
                It's a pseudo-element so the value isn't duplicated in the
                page text that crawlers and screen readers see. */}
            <div
              data-value={s.value}
              className="relative mt-1 whitespace-nowrap font-serif text-2xl text-primary before:invisible before:content-[attr(data-value)]"
            >
              {/* overflow-hidden: scrambled letters (m, w...) can be wider
                  than the final word, so clip them to its reserved width
                  instead of letting them spill into the next stat. */}
              <span className="absolute inset-0 overflow-hidden whitespace-nowrap">
                <AnimatedStatValue value={s.value} />
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 flex flex-wrap items-center gap-x-4 gap-y-5 sm:gap-x-6">
        <a
          href={SITE.resumeHref}
          target="_blank"
          rel="noopener noreferrer"
          className="border border-ember bg-ember/10 px-6 py-3 text-sm text-[#f2a3ae] shadow-[0_0_14px_rgba(224,69,95,0.25)] transition-shadow hover:shadow-[0_0_22px_rgba(224,69,95,0.4)]"
        >
          View Resume
        </a>
        {/* The text links wrap as one group, so a narrow phone never strands
            a lone "X" on its own line under the button. */}
        <div className="flex items-center gap-4 sm:gap-6">
          <a
            href={SITE.github}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-body underline decoration-line underline-offset-4 transition-colors hover:text-ember"
          >
            GitHub
          </a>
          <a
            href={SITE.linkedIn}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-body underline decoration-line underline-offset-4 transition-colors hover:text-ember"
          >
            LinkedIn
          </a>
          <a
            href={SITE.x}
            aria-label="X (formerly Twitter)"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-body underline decoration-line underline-offset-4 transition-colors hover:text-ember"
          >
            X
          </a>
        </div>
      </div>
    </section>
  );
}
