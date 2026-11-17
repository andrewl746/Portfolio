"use client";

import { useEffect, useRef, useState } from "react";
import { statsSettled } from "@/lib/hero-cue";

const NOISE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const ANIMATION_DURATION = 1000;
// How many characters flicker ahead of the ones that have locked in.
const NOISE_WINDOW = 3;

// One frame of a value coming in like a transmission: characters lock in
// from left to right behind a short band of static, and the ones after it
// haven't arrived yet. Returns the locked text and the static after it.
// Spaces stay spaces, so words keep their shape, and the locked part never
// shifts because everything changing is to its right.
function receiving(target: string, progress: number): [string, string] {
  const head = progress * (target.length + NOISE_WINDOW);
  const locked = Math.max(0, Math.min(target.length, Math.ceil(head - NOISE_WINDOW)));
  const end = Math.max(locked, Math.min(target.length, Math.ceil(head)));
  const noise = Array.from(target.slice(locked, end), (char) =>
    char === " " ? " " : NOISE[Math.floor(Math.random() * NOISE.length)]
  ).join("");
  return [target.slice(0, locked), noise];
}

// The real value is rendered and visible from the first paint, so visitors on
// a slow connection (and crawlers, and anyone whose JS never loads) always see
// it. Once JS is running and the stat scrolls into view, it clears and comes
// back in letter by letter (or counts up from 0, for a number).
export default function AnimatedStatValue({ value }: { value: string }) {
  const [display, setDisplay] = useState(value);
  // The static ahead of the received letters, drawn in brass.
  const [noise, setNoise] = useState("");
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

      // Non-numeric values come in like a transmission, at a steady rate.
      if (!match) {
        const startedAt = performance.now();
        const show = (progress: number) => {
          const [locked, ahead] = receiving(value, progress);
          setDisplay(locked);
          setNoise(ahead);
        };
        show(0);
        interval = window.setInterval(() => {
          const progress = (performance.now() - startedAt) / ANIMATION_DURATION;
          if (progress >= 1) {
            window.clearInterval(interval);
            setDisplay(value);
            setNoise("");
            statsSettled();
            return;
          }
          show(progress);
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
          statsSettled();
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
    <span ref={ref}>
      {display}
      {noise && <span className="text-brass">{noise}</span>}
    </span>
  );
}
