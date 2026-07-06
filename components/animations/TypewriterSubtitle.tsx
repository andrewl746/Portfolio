"use client";

import { useEffect, useRef, useState } from "react";

const PRE_BLINK_DURATION = 1600;
const POST_BLINK_DURATION = 4000;

export default function TypewriterSubtitle({ text }: { text: string }) {
  const [display, setDisplay] = useState("");
  const [phase, setPhase] = useState<"idle" | "pre" | "typing" | "post" | "done">(
    "idle"
  );
  const ref = useRef<HTMLSpanElement>(null);
  const played = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const timers: number[] = [];
    const intervals: number[] = [];

    const run = () => {
      if (played.current) return;
      played.current = true;
      setPhase("pre");

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        const timer = window.setTimeout(() => {
          setDisplay(text);
          setPhase("done");
        }, 0);
        timers.push(timer);
        return;
      }

      timers.push(
        window.setTimeout(() => {
          setPhase("typing");
          let index = 0;

          const interval = window.setInterval(() => {
            index += 1;
            setDisplay(text.slice(0, index));

            if (index >= text.length) {
              window.clearInterval(interval);
              setPhase("post");
              timers.push(window.setTimeout(() => setPhase("done"), POST_BLINK_DURATION));
            }
          }, 34);
          intervals.push(interval);
        }, PRE_BLINK_DURATION)
      );
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          run();
          observer?.disconnect();
        }
      },
      { threshold: 0.4 }
    );

    observer.observe(node);

    return () => {
      observer?.disconnect();
      for (const timer of timers) window.clearTimeout(timer);
      for (const interval of intervals) window.clearInterval(interval);
    };
  }, [text]);

  const cursorClass =
    phase === "idle"
      ? "opacity-100"
      : phase === "pre"
      ? "animate-terminal-cursor-pre"
      : phase === "post"
        ? "animate-terminal-cursor-post"
        : "opacity-100";

  return (
    <span ref={ref} aria-label={text}>
      <span aria-hidden="true">{display}</span>
      {phase !== "done" && (
        <span
          aria-hidden="true"
          className={`inline-block w-0 translate-x-1 overflow-visible ${cursorClass}`}
        >
          _
        </span>
      )}
    </span>
  );
}
