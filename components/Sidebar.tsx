"use client";

import { useEffect, useState } from "react";
import { SITE } from "@/lib/content";

const ENTRIES = [
  { id: "about", label: "About" },
  { id: "projects", label: "Projects" },
  { id: "experience", label: "Experience" },
  { id: "tech", label: "Tech" },
  { id: "contact", label: "Contact" },
];

export default function Sidebar() {
  const [active, setActive] = useState("about");

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

  return (
    <>
      {/* Mobile top strip */}
      <header className="fixed inset-x-0 top-0 z-20 flex items-center justify-between border-b border-line bg-void/85 px-5 py-3 backdrop-blur-sm md:hidden">
        <a href="#about" className="font-serif text-lg text-primary">
          {SITE.name}
        </a>
        <a
          href={SITE.resumeHref}
          target="_blank"
          rel="noopener noreferrer"
          className="border border-ember/40 px-3 py-1 text-xs uppercase tracking-[0.12em] text-[#f2a3ae] transition-colors hover:border-ember"
        >
          Resume
        </a>
      </header>

      {/* Desktop logbook margin */}
      <aside className="margin-rule fixed inset-y-0 left-0 z-20 hidden w-[180px] flex-col px-6 py-10 md:flex">
        <a href="#about" className="font-serif text-xl leading-tight text-primary">
          {SITE.name}
        </a>
        <p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-brass">
          Observation log
        </p>

        <nav className="mt-12 flex flex-col gap-7">
          {ENTRIES.map(({ id, label }, i) => {
            const current = active === id;
            return (
              <a key={id} href={`#${id}`} className="group block">
                <span
                  className={`block text-[10px] uppercase tracking-[0.14em] transition-colors ${
                    current ? "text-ember" : "text-faint group-hover:text-ember/70"
                  }`}
                >
                  Entry 0{i + 1}
                  {current ? " / Current" : ""}
                </span>
                <span
                  className={`mt-0.5 block text-sm transition-colors ${
                    current
                      ? "font-bold text-primary"
                      : "text-body group-hover:text-primary"
                  }`}
                >
                  {label}
                </span>
              </a>
            );
          })}
        </nav>

        <div className="mt-auto text-[10px] uppercase leading-relaxed tracking-[0.1em] text-faint">
          University of Waterloo
          <br />
          Computer Science
        </div>
      </aside>
    </>
  );
}
