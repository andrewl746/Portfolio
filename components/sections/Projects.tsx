import { FLAGSHIP, PROJECTS, SITE, type Project } from "@/lib/content";
import Constellation from "@/components/Constellation";

function Row({ p, current = false }: { p: Project; current?: boolean }) {
  return (
    <div
      className={`group border-t border-white/8 py-7 pl-5 transition-colors ${
        current
          ? "border-l-2 border-l-ember bg-gradient-to-r from-ember/8 to-transparent"
          : "border-l-2 border-l-ember/35 hover:border-l-ember"
      }`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h3 className="font-serif text-2xl text-primary">{p.name}</h3>
        <span
          className={`text-xs tracking-[0.08em] transition-colors ${
            current ? "text-ember" : "text-brass group-hover:text-ember"
          }`}
        >
          {p.coord}
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
            className="text-primary underline decoration-ember/60 underline-offset-4 transition-colors hover:text-ember"
          >
            olympiq.ca
          </a>
        )}
        {p.github && (
          <a
            href={p.github}
            target="_blank"
            rel="noopener noreferrer"
            className="text-dim transition-colors hover:text-ember"
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
        <Row p={FLAGSHIP} current />
        {PROJECTS.map((p) => (
          <Row key={p.name} p={p} />
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
