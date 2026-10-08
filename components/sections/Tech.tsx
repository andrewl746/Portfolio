"use client";

import { useEffect, useRef, useState } from "react";
import { TECH_STACK } from "@/lib/techstack";
import Constellation from "@/components/Constellation";
import Reveal from "@/components/animations/Reveal";

export default function Tech() {
  const gridRef = useRef<HTMLDivElement>(null);
  const [lit, setLit] = useState(false);

  // One-time "systems check": flash each icon to full color in sequence when
  // the grid first scrolls into view.
  useEffect(() => {
    const node = gridRef.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLit(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="tech" className="relative scroll-mt-14 py-20 md:scroll-mt-24">
      <Constellation
        name="orion"
        className="pointer-events-none absolute right-0 top-6 w-32 md:right-2 md:w-56"
      />
      <h2 className="font-serif text-3xl text-primary">Tech Stack</h2>
      <Reveal>
        <p className="mt-6 max-w-xl text-sm leading-relaxed text-body">
          Languages, frameworks, and tools I build with.
        </p>
      </Reveal>
      <div
        ref={gridRef}
        className="mt-8 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5"
      >
        {TECH_STACK.map((t, i) => (
          <div
            key={t.name}
            className="group flex flex-col items-center gap-3 border border-white/8 bg-void px-2 py-5 transition-colors hover:border-white/20 hover:bg-[#0a0c14] sm:px-4 sm:py-6"
          >
            <svg
              viewBox="0 0 24 24"
              className={`h-8 w-8 opacity-50 grayscale transition-all duration-200 group-hover:opacity-100 group-hover:grayscale-0 ${
                lit ? "tech-flash" : ""
              }`}
              style={{ animationDelay: `${i * 50}ms` }}
              fill={t.hex}
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d={t.path} />
            </svg>
            {/* On phones a few names wrap ("Google Gemini"). Every label
                reserves two lines there so all the cells stay one height. */}
            <span className="text-center text-[10px] uppercase tracking-[0.1em] text-dim transition-colors group-hover:text-body max-sm:min-h-[2lh]">
              {t.name}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
