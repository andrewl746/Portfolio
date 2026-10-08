import { AWARDS } from "@/lib/content";
import Constellation from "@/components/Constellation";
import Reveal from "@/components/animations/Reveal";

export default function Awards() {
  return (
    <section id="awards" className="relative scroll-mt-24 py-20">
      <Constellation
        name="coronaBorealis"
        className="pointer-events-none absolute top-6 right-6 w-52 max-md:hidden"
      />
      <h2 className="font-serif text-3xl text-primary">Awards</h2>

      <Reveal>
        <p className="mt-6 max-w-xl text-sm leading-relaxed text-body">
          Hackathons and competitive programming since grade nine. 500+
          problems solved across DMOJ, Codeforces, and USACO.
        </p>
      </Reveal>
      <Reveal delay={80}>
        <ul className="mt-6 border-y border-white/8">
          {AWARDS.map((a) => (
            <li
              key={a.event}
              className="group grid grid-cols-2 gap-2 border-t border-white/8 py-3 first:border-t-0 sm:grid-cols-[1.4fr_1.4fr_0.8fr]"
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
              <span className="text-sm text-body transition-colors group-hover:text-primary">
                {a.result}
              </span>
              <span className="text-xs text-brass transition-colors group-hover:text-ember max-sm:col-span-2 sm:text-right">
                {a.year}
              </span>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
