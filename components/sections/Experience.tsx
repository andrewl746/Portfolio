import { EXPERIENCE } from "@/lib/content";
import Constellation from "@/components/Constellation";
import Reveal from "@/components/animations/Reveal";

export default function Experience() {
  return (
    <section id="experience" className="relative scroll-mt-14 py-20 md:scroll-mt-24">
      <Constellation
        name="cygnus"
        className="pointer-events-none absolute right-0 top-6 w-32 md:right-6 md:top-10 md:w-52"
      />
      <h2 className="font-serif text-3xl text-primary">Experience</h2>

      <Reveal>
        <p className="mt-6 max-w-xl text-sm leading-relaxed text-body">
          Where I work, have worked, taught, and led.
        </p>
      </Reveal>

      <div className="mt-10 space-y-12">
        {EXPERIENCE.map((e) => (
          <Reveal key={e.org}>
            <div className="group relative grid gap-2 sm:grid-cols-[200px_1fr] sm:gap-8">
              <div className="text-xs uppercase tracking-[0.1em] text-dim">
                {e.period}
              </div>
              <div className="border-l-2 border-ember/35 pl-5 transition-colors group-hover:border-ember">
                <h3 className="font-serif text-xl text-primary">
                  {e.link ? (
                    <a
                      href={e.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="after:absolute after:inset-0"
                    >
                      {e.org}
                    </a>
                  ) : (
                    e.org
                  )}
                </h3>
                <div className="mt-1 text-[10px] uppercase tracking-[0.12em] text-brass">
                  {e.role}
                </div>
                {e.blurb && (
                  <p className="mt-2 text-xs leading-relaxed text-dim">{e.blurb}</p>
                )}
                {e.bullets && e.bullets.length > 0 && (
                  <ul className="mt-3 space-y-2 text-sm leading-relaxed text-body">
                    {e.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
