import { SITE } from "@/lib/content";
import Constellation from "@/components/Constellation";

export default function Contact() {
  return (
    <section id="contact" className="relative scroll-mt-24 py-20">
      <Constellation
        name="gemini"
        className="pointer-events-none absolute top-4 right-8 w-48 max-md:hidden"
      />
      <h2 className="font-serif text-3xl text-primary">Contact</h2>
      <p className="mt-6 max-w-xl font-serif text-2xl leading-snug text-primary/90">
        Looking for a Summer 2027 co-op. If you&apos;re building something
        interesting, I&apos;d love to hear from you.
      </p>
      <div className="mt-8 flex flex-wrap gap-8 text-sm">
        <a
          href={`mailto:${SITE.email}`}
          className="text-primary underline decoration-ember/60 underline-offset-4 transition-colors hover:text-ember"
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
      <footer className="mt-24 border-t border-line pt-6 text-[10px] uppercase tracking-[0.1em] text-faint">
        © {new Date().getFullYear()} Andrew Li.
      </footer>
    </section>
  );
}
