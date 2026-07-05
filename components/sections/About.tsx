import { SITE, STATS } from "@/lib/content";
import Constellation from "@/components/Constellation";

export default function About() {
  return (
    <section id="about" className="relative scroll-mt-24 py-24 md:py-32">
      {/* Stationary ember bloom behind Sagittarius */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-10 right-0 h-[420px] w-[420px] max-md:hidden"
        style={{
          background:
            "radial-gradient(closest-side, rgba(224, 69, 95, 0.07), transparent 70%)",
        }}
      />
      <Constellation
        name="sagittarius"
        prominent
        className="pointer-events-none absolute top-0 right-4 w-72 max-md:hidden lg:w-80"
      />

      <p className="text-xs uppercase tracking-[0.14em] text-brass">
        {SITE.identity}
      </p>
      <h1 className="mt-5 font-serif text-5xl text-primary sm:text-7xl">
        {SITE.name}
      </h1>
      <p className="mt-6 max-w-xl text-lg leading-relaxed text-primary/90 sm:text-xl">
        {SITE.tagline}
      </p>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-body">
        {SITE.sub}
      </p>

      <div className="mt-10 flex flex-wrap gap-x-12 gap-y-8">
        {STATS.map((s) => (
          <div key={s.eyebrow} className="border-l-2 border-ember pl-4">
            <div className="text-[10px] uppercase tracking-[0.14em] text-brass">
              {s.eyebrow}
            </div>
            <div className="mt-1 font-serif text-2xl text-primary">
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 flex flex-wrap items-center gap-6">
        <a
          href={SITE.resumeHref}
          className="border border-ember bg-ember/10 px-6 py-3 text-sm text-[#f2a3ae] shadow-[0_0_14px_rgba(224,69,95,0.25)] transition-shadow hover:shadow-[0_0_22px_rgba(224,69,95,0.4)]"
        >
          View Resume
        </a>
        <a
          href={SITE.github}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-body underline decoration-line underline-offset-4 transition-colors hover:text-ember"
        >
          GitHub
        </a>
      </div>
    </section>
  );
}
