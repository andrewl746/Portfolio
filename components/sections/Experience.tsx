import { EXPERIENCE } from "@/lib/content";
import Reveal from "@/components/Reveal";

export default function Experience() {
  return (
    <section
      id="experience"
      className="mx-auto max-w-5xl scroll-mt-24 px-6 py-20"
    >
      <Reveal>
        <h2 className="font-mono text-sm text-accent">03 / experience</h2>
      </Reveal>
      <div className="mt-8 space-y-10">
        {EXPERIENCE.map((e) => (
          <Reveal key={e.org}>
            <div className="grid gap-2 sm:grid-cols-[220px_1fr] sm:gap-8">
              <div>
                <div className="font-mono text-sm text-muted">{e.period}</div>
              </div>
              <div>
                <h3 className="text-lg font-semibold">{e.org}</h3>
                <div className="mt-1 text-sm text-accent">{e.role}</div>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
                  {e.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
