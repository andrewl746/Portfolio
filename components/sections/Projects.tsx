import Image from "next/image";
import { FLAGSHIP, PROJECTS, SITE, type Project } from "@/lib/content";
import Constellation from "@/components/Constellation";
import Reveal from "@/components/animations/Reveal";

function Row({ p, current = false }: { p: Project; current?: boolean }) {
  // Something you can see working first (live site, then a hackathon demo), the code last.
  const links: { href: string; label: string }[] = [];
  if (p.live) links.push({ href: p.live, label: new URL(p.live).hostname.replace(/^www\./, "") });
  if (p.devpost) links.push({ href: p.devpost, label: "Devpost" });
  if (p.github) links.push({ href: p.github, label: "GitHub" });

  return (
    <div
      className={`border-t border-white/8 py-7 pl-5 ${
        current
          ? "border-l-2 border-l-ember bg-gradient-to-r from-ember/8 to-transparent"
          : "border-l-2 border-l-ember/35"
      }`}
    >
      <h3 className="font-serif text-2xl text-primary">{p.name}</h3>
      <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-brass">
        {p.context}
        {p.award ? ` / ${p.award}` : ""}
      </p>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-body">
        {p.description}
      </p>
      <p className="mt-3 text-xs text-dim">{p.tech.join(" / ")}</p>
      {links.length > 0 && (
        <div className="mt-3 flex gap-6 text-xs uppercase tracking-[0.1em]">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline decoration-ember/60 underline-offset-4 transition-colors hover:text-ember"
            >
              {l.label}
            </a>
          ))}
        </div>
      )}
      {p.image && (
        <div className="viewfinder mt-5 max-w-2xl p-2">
          <Image
            src={p.image.src}
            alt={p.image.alt}
            width={1280}
            height={800}
            sizes="(min-width: 768px) 656px, 100vw"
            quality={90}
            // Dimmed so bright app screenshots sit in the dark page instead of glaring.
            className="block w-full border border-white/10 brightness-85 saturate-90"
          />
        </div>
      )}
    </div>
  );
}

export default function Projects() {
  return (
    <section id="projects" className="relative scroll-mt-14 py-20 md:scroll-mt-24">
      <Constellation
        name="ursaMajor"
        className="pointer-events-none absolute right-0 top-6 w-32 md:top-8 md:w-64"
      />
      <h2 className="font-serif text-3xl text-primary">Projects</h2>
      <Reveal>
        <p className="mt-6 max-w-xl text-sm leading-relaxed text-body">
          Featured tools I&apos;ve built to solve real problems, from team scheduling to
          exploring unfamiliar codebases.
        </p>
      </Reveal>
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
