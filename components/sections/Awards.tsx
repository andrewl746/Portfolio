import { AWARDS } from "@/lib/content";
import Constellation from "@/components/Constellation";
import Reveal from "@/components/animations/Reveal";

export default function Awards() {
  return (
    <section id="awards" className="relative scroll-mt-14 py-20 md:scroll-mt-24">
      <Constellation
        name="coronaBorealis"
        className="pointer-events-none absolute right-0 top-6 w-32 md:right-6 md:w-52"
      />
      <h2 className="font-serif text-3xl text-primary">Awards</h2>

      <Reveal>
        <p className="mt-6 max-w-xl text-sm leading-relaxed text-body">
          Hackathons I&apos;ve won and my competitive programming results.
          500+ problems solved across DMOJ, Codeforces, and USACO.
        </p>
      </Reveal>
      <Reveal delay={80}>
        {/* Phones: event and year share a line with the result underneath.
            Wider screens: three columns in source order. */}
        <ul className="mt-6 border-y border-white/8">
          {AWARDS.map((a) => (
            <li
              key={a.event}
              className="group grid grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-1 border-t border-white/8 py-3 first:border-t-0 sm:grid-cols-[1.4fr_1.4fr_0.8fr] sm:gap-2"
            >
              <span className="text-sm text-primary">
                {a.link ? (
                  <a
                    href={a.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-ember/60 underline-offset-4 transition-colors hover:text-ember"
                  >
                    {a.event}
                  </a>
                ) : (
                  a.event
                )}
              </span>
              <span className="col-span-2 text-sm text-body transition-colors group-hover:text-primary sm:col-span-1">
                {a.result}
              </span>
              <span className="col-start-2 row-start-1 text-right text-xs text-brass transition-colors group-hover:text-ember sm:col-start-auto sm:row-start-auto">
                {a.year}
              </span>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
