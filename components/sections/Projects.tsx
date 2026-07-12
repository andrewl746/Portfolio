import { FLAGSHIP, PROJECTS, SITE, type Project } from "@/lib/content";
import Constellation from "@/components/Constellation";
import Reveal from "@/components/animations/Reveal";
import ScrambleText from "@/components/animations/ScrambleText";

function Row({ p, current = false }: { p: Project; current?: boolean }) {
  // The title's ::after stretches over the whole row, so clicking anywhere
  // opens the project. The explicit links below sit above it via `relative`.
  const primaryHref = p.live ?? p.github;

  return (
    <div
      className={`group relative border-t border-white/8 py-7 pl-5 transition-colors ${
        current
          ? "border-l-2 border-l-ember bg-gradient-to-r from-ember/8 to-transparent"
          : "border-l-2 border-l-ember/35 hover:border-l-ember"
      }`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h3 className="font-serif text-2xl text-primary">
          {primaryHref ? (
            <a
              href={primaryHref}
              target="_blank"
              rel="noopener noreferrer"
              className="after:absolute after:inset-0"
            >
              {p.name}
            </a>
          ) : (
            p.name
          )}
        </h3>
        <span
          className={`text-xs tracking-[0.08em] transition-colors ${
            current ? "text-ember" : "text-brass group-hover:text-ember"
          }`}
        >
          <ScrambleText text={p.coord} />
        </span>
      </div>
      <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-dim">
        {p.context}
        {p.award ? ` / ${p.award}` : ""}
      </p>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-body">
        {p.description}
      </p>
      <p className="mt-3 text-xs text-dim">{p.tech.join(" / ")}</p>
      <div className="mt-3 flex gap-6 text-xs uppercase tracking-[0.1em]">
        {p.live && (
          <a
            href={p.live}
            target="_blank"
            rel="noopener noreferrer"
            className="relative text-primary underline decoration-ember/60 underline-offset-4 transition-colors hover:text-ember"
          >
            {new URL(p.live).hostname.replace(/^www\./, "")}
          </a>
        )}
        {p.github && p.live && (
          <a
            href={p.github}
            target="_blank"
            rel="noopener noreferrer"
            className="relative text-dim transition-colors hover:text-ember"
          >
            Source
          </a>
        )}
      </div>
    </div>
  );
}

export default function Projects() {
  return (
    <section id="projects" className="relative scroll-mt-24 py-20">
      <Constellation
        name="ursaMajor"
        className="pointer-events-none absolute top-8 right-0 w-64 max-md:hidden"
      />
      <h2 className="font-serif text-3xl text-primary">Projects</h2>
      <div className="mt-8">
        <Reveal>
          <Row p={FLAGSHIP} current />
        </Reveal>
        {PROJECTS.map((p, i) => (
          <Reveal key={p.name} delay={Math.min(i * 60, 240)}>
            <Row p={p} />
          </Reveal>
        ))}
      </div>
      <a
        href={SITE.github}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 inline-block text-xs uppercase tracking-[0.1em] text-dim transition-colors hover:text-ember"
      >
        More on GitHub
      </a>
    </section>
  );
}
