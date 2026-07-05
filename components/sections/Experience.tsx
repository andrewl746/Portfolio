import { EXPERIENCE, RESULTS } from "@/lib/content";
import Constellation from "@/components/Constellation";

export default function Experience() {
  return (
    <section id="experience" className="relative scroll-mt-24 py-20">
      <Constellation
        name="cygnus"
        className="pointer-events-none absolute top-10 right-6 w-52 max-md:hidden"
      />
      <h2 className="font-serif text-3xl text-primary">Experience</h2>

      <p className="mt-6 max-w-xl text-sm leading-relaxed text-body">
        Competitive programming since grade nine. 500+ problems solved across
        DMOJ, Codeforces, and USACO.
      </p>
      <ul className="mt-6 border-y border-white/8">
        {RESULTS.map((r) => (
          <li
            key={r.event}
            className="group grid grid-cols-2 gap-2 border-t border-white/8 py-3 first:border-t-0 sm:grid-cols-[1fr_1fr_auto]"
          >
            <span className="text-sm text-primary">{r.event}</span>
            <span className="text-sm text-body transition-colors group-hover:text-primary">
              {r.result}
            </span>
            <span className="text-xs text-brass transition-colors group-hover:text-ember max-sm:col-span-2">
              {r.year}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-14 space-y-12">
        {EXPERIENCE.map((e) => (
          <div key={e.org} className="group grid gap-2 sm:grid-cols-[200px_1fr] sm:gap-8">
            <div className="text-xs uppercase tracking-[0.1em] text-dim">
              {e.period}
            </div>
            <div className="border-l-2 border-ember/35 pl-5 transition-colors group-hover:border-ember">
              <h3 className="font-serif text-xl text-primary">{e.org}</h3>
              <div className="mt-1 text-[10px] uppercase tracking-[0.12em] text-brass">
                {e.role}
              </div>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-body">
                {e.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
