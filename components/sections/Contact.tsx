import { SITE } from "@/lib/content";
import Constellation from "@/components/Constellation";
import Reveal from "@/components/animations/Reveal";

// Month and year of the build, in Waterloo's time zone (build servers run on
// UTC, which would flip the month a few hours early).
const UPDATED = new Date().toLocaleDateString("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "America/Toronto",
});

export default function Contact() {
  return (
    <section id="contact" className="relative scroll-mt-14 py-20 md:scroll-mt-24">
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
      <footer className="mt-24 flex flex-wrap justify-between gap-x-6 gap-y-2 border-t border-line pt-6 text-[10px] uppercase tracking-[0.1em] text-faint">
        <span>© {new Date().getFullYear()} Andrew Li.</span>
        {/* The page is statically built, so this is stamped at build time and
            refreshes on every deploy: it can't go stale or be forgotten. */}
        <span>Updated {UPDATED}</span>
      </footer>
    </section>
  );
}
