import { SITE } from "@/lib/content";

const LINKS = [
  ["projects", "#projects"],
  ["competition", "#competition"],
  ["experience", "#experience"],
  ["contact", "#contact"],
] as const;

export default function Nav() {
  return (
    <header className="sticky top-0 z-20 border-b border-line/60 bg-background/70 backdrop-blur-md">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <a href="#top" className="font-semibold tracking-tight">
          {SITE.name.toLowerCase()}
        </a>
        <div className="flex items-center gap-6 font-mono text-sm text-muted">
          {LINKS.map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="transition-colors hover:text-accent max-sm:hidden"
            >
              {label}
            </a>
          ))}
          <a
            href={SITE.resumeHref}
            className="rounded-md border border-accent/40 px-3 py-1.5 text-foreground transition-colors hover:border-accent hover:text-accent"
          >
            resume
          </a>
        </div>
      </nav>
    </header>
  );
}
