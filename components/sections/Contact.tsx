import { SITE } from "@/lib/content";
import Reveal from "@/components/Reveal";

export default function Contact() {
  return (
    <section id="contact" className="mx-auto max-w-5xl scroll-mt-24 px-6 py-20">
      <Reveal>
        <h2 className="font-mono text-sm text-accent">04 / contact</h2>
        <p className="mt-6 max-w-xl text-xl leading-relaxed">
          Looking for a Summer 2027 co-op. If you&apos;re building something
          interesting, I&apos;d like to hear about it.
        </p>
        <div className="mt-8 flex flex-wrap gap-6 font-mono text-sm">
          <a
            href={`mailto:${SITE.email}`}
            className="text-foreground underline decoration-accent/60 underline-offset-4 transition-colors hover:text-accent"
          >
            {SITE.email}
          </a>
          <a
            href={SITE.github}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted transition-colors hover:text-accent"
          >
            github
          </a>
          <a
            href={SITE.resumeHref}
            className="text-muted transition-colors hover:text-accent"
          >
            resume
          </a>
        </div>
      </Reveal>
      <footer className="mt-24 border-t border-line pt-6 font-mono text-xs text-muted">
        © {new Date().getFullYear()} Andrew Li. Built with Next.js.
      </footer>
    </section>
  );
}
