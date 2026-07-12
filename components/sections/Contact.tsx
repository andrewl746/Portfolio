import { SITE } from "@/lib/content";
import Constellation from "@/components/Constellation";
import Reveal from "@/components/animations/Reveal";

export default function Contact() {
  return (
    <section id="contact" className="relative scroll-mt-24 py-20">
      <Constellation
        name="gemini"
        className="pointer-events-none absolute top-4 right-8 w-48 max-md:hidden"
      />
      <h2 className="font-serif text-3xl text-primary">Contact</h2>
      <Reveal>
        <p className="mt-6 max-w-xl font-serif text-2xl leading-snug text-primary/90">
          Looking for a Summer 2027 co-op. If you&apos;re building something
          interesting, I&apos;d love to hear from you.
        </p>
      </Reveal>
      <Reveal delay={100}>
        <div className="mt-8 flex flex-wrap items-center gap-6 text-sm">
          <a
            href={`mailto:${SITE.email}`}
            className="border border-ember bg-ember/10 px-6 py-3 text-[#f2a3ae] shadow-[0_0_14px_rgba(224,69,95,0.25)] transition-shadow hover:shadow-[0_0_22px_rgba(224,69,95,0.4)]"
          >
            {SITE.email}
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
      <footer className="mt-24 border-t border-line pt-6 text-[10px] uppercase tracking-[0.1em] text-faint">
        © {new Date().getFullYear()} Andrew Li.
      </footer>
    </section>
  );
}
