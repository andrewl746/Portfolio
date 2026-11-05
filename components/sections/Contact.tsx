import { SITE } from "@/lib/content";
import Constellation from "@/components/Constellation";
import Reveal from "@/components/animations/Reveal";

// The footer lives on the Earth below this section (see EarthFinale). On
// short screens the top padding tightens so this section and the whole Earth
// still fit on the screen a jump to Contact lands on.
export default function Contact() {
  return (
    <section
      id="contact"
      className="relative scroll-mt-14 pb-6 pt-20 md:scroll-mt-24 [@media(max-height:860px)]:pt-10"
    >
      <Constellation
        name="gemini"
        className="pointer-events-none absolute right-0 top-6 w-32 md:right-8 md:top-4 md:w-48"
      />
      <h2 className="font-serif text-3xl text-primary">Contact</h2>
      <Reveal>
        <p className="mt-6 max-w-xl font-serif text-2xl leading-snug text-primary/90">
          Looking for a Summer 2027 co-op. If you&apos;re building something
          interesting, I&apos;d love to hear from you.
        </p>
      </Reveal>
      <Reveal delay={100}>
        {/* Ranked by how to reach me: ways to message first (email, then
            LinkedIn, then X), then places to look (GitHub, resume). */}
        <div className="mt-8 flex flex-wrap items-center gap-6 text-sm">
          <a
            href={`mailto:${SITE.email}`}
            className="border border-ember bg-ember/10 px-6 py-3 text-[#f2a3ae] shadow-[0_0_14px_rgba(224,69,95,0.25)] transition-shadow hover:shadow-[0_0_22px_rgba(224,69,95,0.4)] max-sm:w-full max-sm:text-center"
          >
            {SITE.email}
          </a>
          <a
            href={SITE.linkedIn}
            target="_blank"
            rel="noopener noreferrer"
            className="text-body transition-colors hover:text-ember"
          >
            LinkedIn
          </a>
          <a
            href={SITE.x}
            aria-label="X (formerly Twitter)"
            target="_blank"
            rel="noopener noreferrer"
            className="text-body transition-colors hover:text-ember"
          >
            X
          </a>
          <a
            href={SITE.github}
            target="_blank"
            rel="noopener noreferrer"
            className="text-body transition-colors hover:text-ember"
          >
            GitHub
          </a>
          <a
            href={SITE.resumeHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-body transition-colors hover:text-ember"
          >
            Resume
          </a>
        </div>
      </Reveal>
    </section>
  );
}
