"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * The viewfinder brackets around a project screenshot (.viewfinder in
 * globals.css). The first time the screenshot scrolls into view, they close
 * in from just outside it and flash once, like a camera finding its subject.
 *
 * They stay still for a screenshot that's already on screen when the page
 * loads (hiding them just to bring them back would read as a glitch), on
 * devices set to reduce motion, and without JS.
 */
export default function ViewfinderLock({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) return;

    // Armed: the brackets wait, hidden, just outside the frame.
    node.dataset.lock = "armed";
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        node.dataset.lock = "on";
        observer.disconnect();
      },
      { threshold: 0.35 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`viewfinder ${className ?? ""}`}>
      {children}
    </div>
  );
}
