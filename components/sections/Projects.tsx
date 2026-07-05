import { FLAGSHIP, PROJECTS, SITE } from "@/lib/content";
import Reveal from "@/components/Reveal";

function TechTags({ tech }: { tech: string[] }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {tech.map((t) => (
        <span
          key={t}
          className="rounded border border-line px-2 py-0.5 font-mono text-xs text-muted"
        >
          {t}
        </span>
      ))}
    </div>
  );
}

export default function Projects() {
  return (
    <section id="projects" className="mx-auto max-w-5xl scroll-mt-24 px-6 py-20">
      <Reveal>
        <h2 className="font-mono text-sm text-accent">01 / projects</h2>

        <div className="mt-8 rounded-xl border border-accent/25 bg-card p-8 transition-colors hover:border-accent/50">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-2xl font-semibold">{FLAGSHIP.name}</h3>
            <span className="font-mono text-xs text-accent">
              {FLAGSHIP.context}
            </span>
          </div>
          <p className="mt-3 max-w-3xl leading-relaxed text-muted">
            {FLAGSHIP.description}
          </p>
          <TechTags tech={FLAGSHIP.tech} />
          <div className="mt-5 flex gap-5 font-mono text-sm">
            <a
              href={FLAGSHIP.live}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline decoration-accent/60 underline-offset-4 transition-colors hover:text-accent"
            >
              olympiq.ca
            </a>
            <a
              href={FLAGSHIP.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted transition-colors hover:text-accent"
            >
              source
            </a>
          </div>
        </div>
      </Reveal>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {PROJECTS.map((p) => (
          <Reveal key={p.name}>
            <div className="flex h-full flex-col rounded-xl border border-line bg-card p-6 transition-colors hover:border-accent/40">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-lg font-semibold">{p.name}</h3>
                <span className="font-mono text-xs text-muted">{p.context}</span>
              </div>
              {p.award && (
                <p className="mt-2 font-mono text-xs text-accent">
                  ★ {p.award}
                </p>
              )}
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
                {p.description}
              </p>
              <TechTags tech={p.tech} />
              {p.github && (
                <a
                  href={p.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 font-mono text-sm text-muted transition-colors hover:text-accent"
                >
                  source
                </a>
              )}
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal>
        <a
          href={SITE.github}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-block font-mono text-sm text-muted transition-colors hover:text-accent"
        >
          more on github
        </a>
      </Reveal>
    </section>
  );
}
