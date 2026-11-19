"use client";

import { useEffect, useRef, useState } from "react";
import { SITE } from "@/lib/content";

const ENTRIES = [
  { id: "about", label: "About" },
  { id: "projects", label: "Projects" },
  { id: "experience", label: "Experience" },
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

// The section links in the mobile drawer, with the sliding ember needle.
function DrawerNav({ active, onNavigate }: { active: string; onNavigate: () => void }) {
  const [marker, setMarker] = useState<{ top: number; height: number } | null>(
    null
  );
  const entryRefs = useRef<Record<string, HTMLSpanElement | null>>({});

  // Slide the needle to the active link. Re-measured on resize, once web fonts
  // finish loading, and when the active link changes. While the drawer is
  // display: none (wider screens) it measures as zero height, so it keeps its
  // last position.
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
    <nav aria-label="Sections" className="relative flex flex-col gap-1">
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
      {ENTRIES.map(({ id, label }) => {
        const current = active === id;
        return (
          <a
            key={id}
            href={`#${id}`}
            onClick={onNavigate}
            aria-current={current ? "location" : undefined}
            className="block py-2.5"
          >
            {/* The needle is measured against this inner span, so the padding
                that enlarges the tap target doesn't stretch it. */}
            <span
              ref={(el) => {
                entryRefs.current[id] = el;
              }}
              className={`block text-base transition-colors ${
                current ? "font-bold text-primary" : "text-body hover:text-primary"
              }`}
            >
              {label}
            </span>
          </a>
        );
      })}
    </nav>
  );
}

/**
 * The bar along the top: the name (once the big one in the hero has set), the
 * section links with the current one marked, and the resume. On phones the
 * links move into a drawer behind the menu button. Its looks are the .topbar
 * rules in globals.css.
 */
export default function TopBar() {
  const [active, setActive] = useState("about");
  const [menuOpen, setMenuOpen] = useState(false);
  const barRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Which section is being read. A section counts once its top has come a
  // little past the middle of the screen, which is about when its title has
  // risen clear of the Earth.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            setActive(el.dataset.navSection ?? el.id);
          }
        }
      },
      { rootMargin: "-55% 0px -40% 0px" }
    );
    for (const { id } of ENTRIES) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    // Areas that belong to a section without being inside it, such as the
    // whole last screen around Contact.
    document
      .querySelectorAll<HTMLElement>("[data-nav-section]")
      .forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // The bar is clear over the first screen and gets its backing once the page
  // moves. The name in it waits until the big name in the hero has mostly set
  // behind the Earth, so the two are never on screen together for long.
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const hero = document.getElementById("about");
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      const nameSets = hero ? (hero.offsetHeight - window.innerHeight) * 0.75 : 0;
      bar.toggleAttribute("data-solid", y > 24);
      bar.toggleAttribute("data-top", y < nameSets);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
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
      <header ref={barRef} className="topbar" data-top="">
        <button
          ref={toggleRef}
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          onClick={() => setMenuOpen((open) => !open)}
          className="topbar-menu"
        >
          <span aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </button>
        <a
          href="#about"
          onClick={menuOpen ? closeForNavigation : undefined}
          className="topbar-brand"
        >
          <span className="topbar-name">{SITE.name}</span>
          <span className="topbar-role">Software Engineer</span>
        </a>
        <nav aria-label="Sections" className="topbar-nav">
          {ENTRIES.map(({ id, label }) => (
            <a
              key={id}
              href={`#${id}`}
              aria-current={active === id ? "location" : undefined}
            >
              {label}
            </a>
          ))}
        </nav>
        <a
          href={SITE.resumeHref}
          target="_blank"
          rel="noopener noreferrer"
          className="topbar-resume tap"
        >
          Resume
        </a>
      </header>

      {/* Mobile drawer: the section links, sliding out under the bar */}
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
        <DrawerNav active={active} onNavigate={closeForNavigation} />
        <div className="mt-auto pt-10 text-[10px] uppercase leading-relaxed tracking-[0.1em] text-faint">
          University of Waterloo
          <br />
          Computer Science
        </div>
      </div>
    </>
  );
}
