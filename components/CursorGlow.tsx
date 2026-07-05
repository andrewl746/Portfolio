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

    const move = (e: PointerEvent) => {
      el.style.background = `radial-gradient(320px at ${e.clientX}px ${e.clientY}px, rgba(224, 69, 95, 0.06), transparent 70%)`;
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, []);

  return (
    <div ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0" />
  );
}
