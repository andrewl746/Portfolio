"use client";

import { useEffect, useRef } from "react";

export default function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (reduced || !fine) return;

    // Coalesce pointer moves to one style write per frame so fast mouse
    // motion never queues up dozens of repaints in a single frame.
    let raf = 0;
    let x = 0;
    let y = 0;

    const paint = () => {
      raf = 0;
      el.style.background = `radial-gradient(320px at ${x}px ${y}px, rgba(224, 69, 95, 0.06), transparent 70%)`;
    };

    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!raf) raf = requestAnimationFrame(paint);
    };

    window.addEventListener("pointermove", move);
    return () => {
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0" />
  );
}
