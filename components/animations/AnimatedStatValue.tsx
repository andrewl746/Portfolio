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

// The real value is rendered and visible from the first paint, so visitors on
// a slow connection (and crawlers, and anyone whose JS never loads) always see
// it. Once JS is running and the stat scrolls into view, it resets to a
// scramble or to 0 and animates back to the real value.
export default function AnimatedStatValue({ value }: { value: string }) {
  const [display, setDisplay] = useState(value);
  const ref = useRef<HTMLSpanElement>(null);
  const played = useRef(false);

  useEffect(() => {
    let frame = 0;
    let interval = 0;
    const node = ref.current;
    if (!node) return;

    // Reduced motion: the real value is already showing; nothing to animate.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const run = () => {
      if (played.current) return;
      played.current = true;

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

  return <span ref={ref}>{display}</span>;
}
