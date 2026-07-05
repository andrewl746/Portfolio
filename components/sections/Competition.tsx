import { COMPETITION } from "@/lib/content";
import Reveal from "@/components/Reveal";

export default function Competition() {
  return (
    <section
      id="competition"
      className="mx-auto max-w-5xl scroll-mt-24 px-6 py-20"
    >
      <Reveal>
        <h2 className="font-mono text-sm text-accent">02 / competition</h2>
        <p className="mt-6 max-w-xl leading-relaxed text-muted">
          Competitive programming since grade nine. 500+ problems solved across
          DMOJ, Codeforces, and USACO.
        </p>
        <ul className="mt-8 divide-y divide-line border-y border-line">
          {COMPETITION.map((c) => (
            <li
              key={c.event}
              className="grid grid-cols-2 gap-2 py-4 sm:grid-cols-[1fr_1fr_auto]"
            >
              <span className="font-medium">{c.event}</span>
              <span className="text-muted">{c.result}</span>
              <span className="font-mono text-sm text-muted max-sm:col-span-2">
                {c.year}
              </span>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
