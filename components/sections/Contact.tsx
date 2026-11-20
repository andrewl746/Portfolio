import { SITE } from "@/lib/content";
import Constellation from "@/components/Constellation";
import Reveal from "@/components/animations/Reveal";

// Contact stands in the sky of the last screen, over the finale's Earth
// (.end in app/page.tsx; the footer sits on the Earth at the bottom of it).
// The scene keeps the Earth below the last line here (data-scene), sinking
// the whole finale a little on a short window.
export default function Contact() {
  return (
    <section id="contact" className="section">
      <Constellation name="gemini" className="section-constellation" />
      <h2 className="section-title">Contact</h2>
      <Reveal>
        <p className="mt-6 max-w-[40rem] font-serif text-2xl leading-snug text-primary/90">
          Looking for a Summer 2027 co-op. If you&apos;re building something
          interesting, I&apos;d love to hear from you.
        </p>
      </Reveal>
      <Reveal delay={100}>
        {/* Ranked by how to reach me: ways to message first (email, then
            LinkedIn, then X), then places to look (GitHub, resume). */}
        <div data-scene="contact-last" className="mt-8 flex flex-wrap items-center gap-6 text-sm">
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
            className="tap text-body transition-colors hover:text-ember"
          >
            LinkedIn
          </a>
          <a
            href={SITE.x}
            aria-label="X (formerly Twitter)"
            target="_blank"
            rel="noopener noreferrer"
            className="tap text-body transition-colors hover:text-ember"
          >
            X
          </a>
          <a
            href={SITE.github}
            target="_blank"
            rel="noopener noreferrer"
            className="tap text-body transition-colors hover:text-ember"
          >
            GitHub
          </a>
          <a
            href={SITE.resumeHref}
            target="_blank"
            rel="noopener noreferrer"
            className="tap text-body transition-colors hover:text-ember"
          >
            Resume
          </a>
        </div>
      </Reveal>
    </section>
  );
}
