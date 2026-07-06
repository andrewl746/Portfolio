"use client";

import { useEffect, useRef, useState } from "react";

const UPPERCASE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIGIT_CHARS = "0123456789";
const SCRAMBLE_DURATION = 1000;

function randomLike(target: string) {
  return Array.from(target, (char) => {
    if (char === "-") return "-";
    if (/\d/.test(char)) {
      return DIGIT_CHARS[Math.floor(Math.random() * DIGIT_CHARS.length)];
    }
    return UPPERCASE_CHARS[Math.floor(Math.random() * UPPERCASE_CHARS.length)];
  }).join("");
}

export default function ScrambleText({ text }: { text: string }) {
  const [display, setDisplay] = useState(text);
  const ref = useRef<HTMLSpanElement>(null);
  const played = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      return;
    }

    const run = () => {
      if (played.current) return;
      played.current = true;

      const startedAt = performance.now();
      const interval = window.setInterval(() => {
        if (performance.now() - startedAt >= SCRAMBLE_DURATION) {
          window.clearInterval(interval);
          setDisplay(text);
          return;
        }
        setDisplay(randomLike(text));
      }, 34);
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
    return () => observer.disconnect();
  }, [text]);

  return <span ref={ref}>{display}</span>;
}
