"use client";

import { useEffect, useRef, useState } from "react";

const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const ANIMATION_DURATION = 1000;

// Scrambles every character except spaces, so multi-word values keep their
// word shape while they resolve.
function randomLike(target: string) {
  return Array.from(target, (char) =>
    char === " "
      ? " "
      : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
  ).join("");
}

// The initial render is always the real value, so the server HTML (what
// crawlers, link previews, and visitors whose JS never loads see) is correct.
// While `pending`, the .countup-pending class keeps it visually hidden once
// JS is known to be running; if the animation never starts, a CSS fallback
// reveals the real value anyway (see globals.css).
export default function AnimatedStatValue({ value }: { value: string }) {
  const [display, setDisplay] = useState(value);
  const [pending, setPending] = useState(true);
  const ref = useRef<HTMLSpanElement>(null);
  const played = useRef(false);

  useEffect(() => {
    let frame = 0;
    let interval = 0;
    const node = ref.current;
    if (!node) return;

    // Reduced motion: CSS already shows the real value; nothing to animate.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const run = () => {
      if (played.current) return;
      played.current = true;
      setPending(false);

      const match = value.match(/^(\d+)(.*)$/);

      // Non-numeric values scramble into place.
      if (!match) {
        setDisplay(randomLike(value));
        const startedAt = performance.now();
        interval = window.setInterval(() => {
          if (performance.now() - startedAt >= ANIMATION_DURATION) {
            window.clearInterval(interval);
            setDisplay(value);
            return;
          }
          setDisplay(randomLike(value));
        }, 34);
        return;
      }

      // Numeric values count up from zero.
      const target = Number(match[1]);
      const suffix = match[2] ?? "";
      const startedAt = performance.now();
      let lastShown = 0;
      setDisplay(`0${suffix}`);

      const tick = (now: number) => {
        const progress = Math.min((now - startedAt) / ANIMATION_DURATION, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const next = Math.round(target * eased);

        if (next !== lastShown) {
          lastShown = next;
          setDisplay(`${next}${suffix}`);
        }

        if (progress < 1) {
          frame = requestAnimationFrame(tick);
        } else {
          setDisplay(value);
        }
      };

      frame = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          run();
          observer.disconnect();
        }
      },
      { threshold: 0.45 }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.clearInterval(interval);
    };
  }, [value]);

  return (
    <span ref={ref} className={pending ? "countup-pending" : undefined}>
      {display}
    </span>
  );
}
