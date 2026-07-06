"use client";

import { useEffect, useRef, useState } from "react";

const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const ANIMATION_DURATION = 1000;

function randomString(length: number) {
  let value = "";
  for (let i = 0; i < length; i++) {
    value += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
  }
  return value;
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function AnimatedStatValue({ value }: { value: string }) {
  const [display, setDisplay] = useState(() => {
    if (value === "OlympIQ") return "#######";
    const match = value.match(/^(\d+)(.*)$/);
    return match ? `0${match[2] ?? ""}` : value;
  });
  const ref = useRef<HTMLSpanElement>(null);
  const played = useRef(false);

  useEffect(() => {
    let frame = 0;
    let interval = 0;
    let timer = 0;
    const node = ref.current;
    if (!node) return;

    const run = () => {
      if (played.current) return;
      played.current = true;

      if (prefersReducedMotion()) {
        timer = window.setTimeout(() => setDisplay(value), 0);
        return;
      }

      if (value === "OlympIQ") {
        setDisplay(randomString(value.length));
        const startedAt = performance.now();
        interval = window.setInterval(() => {
          if (performance.now() - startedAt >= ANIMATION_DURATION) {
            window.clearInterval(interval);
            setDisplay(value);
            return;
          }
          setDisplay(randomString(value.length));
        }, 34);

        return;
      }

      const match = value.match(/^(\d+)(.*)$/);
      if (!match) return;

      const target = Number(match[1]);
      const suffix = match[2] ?? "";
      const startedAt = performance.now();
      let lastShown = -1;

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
          observer?.disconnect();
        }
      },
      { threshold: 0.45 }
    );

    observer.observe(node);

    return () => {
      observer?.disconnect();
      cancelAnimationFrame(frame);
      window.clearInterval(interval);
      window.clearTimeout(timer);
    };
  }, [value]);

  return <span ref={ref}>{display}</span>;
}
