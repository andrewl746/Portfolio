"use client";

import { useEffect, useRef, useState } from "react";
import { SITE } from "@/lib/content";

const ENTRIES = [
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "awards", label: "Awards" },
  { id: "tech", label: "Tech Stack" },
  { id: "contact", label: "Contact" },
];

// While the mobile drawer is open, the page behind it can't scroll and is
// inert, so keyboard and screen reader focus stay inside the menu.
function lockPage(locked: boolean) {
  document.documentElement.style.overflow = locked ? "hidden" : "";
  const main = document.querySelector("main");
  if (main) main.inert = locked;
}

// The logbook entries with the sliding ember needle, shared by the desktop
// margin and the mobile drawer. Each copy measures its own entries, since only
// one of the two is laid out at a given screen size.
function LogNav({
  active,
  variant,
  onNavigate,
}: {
  active: string;
  variant: "desktop" | "mobile";
  onNavigate?: () => void;
}) {
  const [marker, setMarker] = useState<{ top: number; height: number } | null>(
    null
  );
  const entryRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const mobile = variant === "mobile";

  // Slide the needle to the active entry. Re-measured on resize, once web
  // fonts finish loading, and when the active entry changes (its eyebrow can
  // wrap and change height). A copy that's display: none measures as zero
  // height, so it keeps its last position instead.
  useEffect(() => {
    let cancelled = false;
    const measure = () => {
      const el = entryRefs.current[active];
      if (!cancelled && el && el.offsetHeight > 0) {
        setMarker({ top: el.offsetTop, height: el.offsetHeight });
      }
    };
    measure();
    document.fonts?.ready.then(measure);
    window.addEventListener("resize", measure);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", measure);
    };
  }, [active]);

  return (
    <nav
      aria-label="Sections"
      className={`relative flex flex-col ${mobile ? "mt-5 gap-1" : "mt-12 gap-7"}`}
    >
      {marker && (
        <span
          aria-hidden="true"
          className="absolute -left-3 top-0 w-0.5 bg-ember shadow-[0_0_8px_rgba(224,69,95,0.5)] transition-all duration-300 ease-out motion-reduce:transition-none"
          style={{
            transform: `translateY(${marker.top + 3}px)`,
            height: marker.height - 6,
          }}
        />
      )}
      {ENTRIES.map(({ id, label }, i) => {
        const current = active === id;
        return (
          <a
            key={id}
            href={`#${id}`}
            onClick={onNavigate}
            aria-current={current ? "location" : undefined}
            className={`group block ${mobile ? "py-2.5" : ""}`}
          >
            {/* The needle is measured against this inner span, so padding
                that enlarges the mobile tap target doesn't stretch it. */}
            <span
              ref={(el) => {
                entryRefs.current[id] = el;
              }}
              className="block"
            >
              <span
                className={`block text-[10px] uppercase tracking-[0.14em] transition-colors ${
                  current ? "text-ember" : "text-faint group-hover:text-ember/70"
                }`}
              >
                Entry 0{i + 1}
                {current ? " / Current" : ""}
              </span>
              <span
                className={`mt-0.5 block transition-colors ${
                  mobile ? "text-base" : "text-sm"
                } ${
                  current
                    ? "font-bold text-primary"
                    : "text-body group-hover:text-primary"
                }`}
              >
                {label}
              </span>
            </span>
          </a>
        );
      })}
    </nav>
  );
}

export default function Sidebar() {
  const [active, setActive] = useState("about");
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    for (const { id } of ENTRIES) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  // While the drawer is open: lock the page, move focus into the drawer, and
  // close on Escape or if the screen grows into the desktop layout.
  useEffect(() => {
    if (!menuOpen) return;
    const drawer = drawerRef.current;
    const toggle = toggleRef.current;
    lockPage(true);
    drawer?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    const desktop = window.matchMedia("(min-width: 768px)");
    const onBreakpoint = () => {
      if (desktop.matches) setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onBreakpoint);

    return () => {
      lockPage(false);
      document.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onBreakpoint);
      // Focus was in the drawer (or was dropped to <body> when it went
      // inert): hand it back to the menu button.
      const focused = document.activeElement;
      if (!focused || focused === document.body || drawer?.contains(focused)) {
        toggle?.focus({ preventScroll: true });
      }
    };
  }, [menuOpen]);

  // A link in the drawer (or the name in the bar) closes the menu. The page is
  // unlocked right away, before the link's default jump to its section runs,
  // so that jump isn't blocked by the scroll lock or the inert page.
  const closeForNavigation = () => {
    lockPage(false);
    setMenuOpen(false);
  };

  return (
    <>
      {/* Mobile top bar: menu button, name, resume. Symmetric padding keeps
          the name on the screen's true center; the button's icon and the
          resume button's margin line both edges up with the page content. */}
      <header className="fixed inset-x-0 top-0 z-40 grid h-14 grid-cols-[1fr_auto_1fr] items-center border-b border-line bg-void/85 px-3 backdrop-blur-sm md:hidden">
        <button
          ref={toggleRef}
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          onClick={() => setMenuOpen((open) => !open)}
          className="grid h-11 w-11 place-items-center justify-self-start"
        >
          <span aria-hidden="true" className="relative block h-3.5 w-5">
            <span
              className={`absolute inset-x-0 top-0 h-[1.5px] bg-primary transition duration-300 ease-out motion-reduce:transition-none ${
                menuOpen ? "translate-y-[6.25px] rotate-45" : ""
              }`}
            />
            <span
              className={`absolute inset-x-0 top-[6.25px] h-[1.5px] bg-primary transition duration-300 ease-out motion-reduce:transition-none ${
                menuOpen ? "scale-x-0 opacity-0" : ""
              }`}
            />
            <span
              className={`absolute inset-x-0 bottom-0 h-[1.5px] bg-primary transition duration-300 ease-out motion-reduce:transition-none ${
                menuOpen ? "-translate-y-[6.25px] -rotate-45" : ""
              }`}
            />
          </span>
        </button>
        <a
          href="#about"
          onClick={menuOpen ? closeForNavigation : undefined}
          className="font-serif text-lg text-primary"
        >
          {SITE.name}
        </a>
        <a
          href={SITE.resumeHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mr-3 justify-self-end border border-ember/40 px-3 py-1.5 text-xs uppercase tracking-[0.12em] text-[#f2a3ae] transition-colors hover:border-ember"
        >
          Resume
        </a>
      </header>

      {/* Mobile drawer: the logbook margin, sliding out under the bar */}
      <div
        aria-hidden="true"
        onClick={() => setMenuOpen(false)}
        className={`fixed inset-x-0 bottom-0 top-14 z-30 touch-none bg-void/70 transition-opacity duration-300 motion-reduce:transition-none md:hidden ${
          menuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      {/* Opening, visibility flips instantly (only the slide animates) so the
          drawer can take focus right away. Closing, visibility is transitioned
          too, which holds it visible until the slide-out finishes. */}
      <div
        ref={drawerRef}
        id="mobile-nav"
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        tabIndex={-1}
        inert={!menuOpen}
        className={`mobile-drawer margin-rule fixed bottom-0 left-0 top-14 z-30 flex w-64 max-w-[80vw] flex-col overflow-y-auto overscroll-contain bg-void px-6 py-8 duration-300 ease-out motion-reduce:transition-none md:hidden ${
          menuOpen
            ? "visible translate-x-0 transition-[translate]"
            : "invisible -translate-x-full transition-[translate,visibility]"
        }`}
      >
        <p className="text-[10px] uppercase tracking-[0.14em] text-brass">
          Observation log
        </p>
        <LogNav
          active={active}
          variant="mobile"
          onNavigate={closeForNavigation}
        />
        <div className="mt-auto pt-10 text-[10px] uppercase leading-relaxed tracking-[0.1em] text-faint">
          University of Waterloo
          <br />
          Computer Science
        </div>
      </div>

      {/* Desktop logbook margin */}
      <aside className="margin-rule fixed inset-y-0 left-0 z-20 hidden w-[180px] flex-col px-6 py-10 md:flex">
        <a href="#about" className="font-serif text-xl leading-tight text-primary">
          {SITE.name}
        </a>
        <p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-brass">
          Observation log
        </p>

        <LogNav active={active} variant="desktop" />

        <div className="mt-auto text-[10px] uppercase leading-relaxed tracking-[0.1em] text-faint">
          University of Waterloo
          <br />
          Computer Science
        </div>
      </aside>
    </>
  );
}
