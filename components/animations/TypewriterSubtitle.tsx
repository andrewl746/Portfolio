"use client";

import { useEffect, useRef, useState } from "react";

const PRE_BLINK_DURATION = 1600;
const POST_BLINK_DURATION = 4000;

type Phase = "idle" | "pre" | "typing" | "post" | "done";

// The untyped remainder is always rendered, just hidden (.typewriter-rest in
// globals.css). That reserves the finished line's wrapping and height from
// the first frame, so a tagline that wraps on a phone doesn't push the rest of
// the hero down as it types. It also keeps the full text in the server HTML
// for crawlers and visitors without JS.
export default function TypewriterSubtitle({ text }: { text: string }) {
  const [count, setCount] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
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
          setCount(text.length);
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
            setCount(index);

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
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      for (const timer of timers) window.clearTimeout(timer);
      for (const interval of intervals) window.clearInterval(interval);
    };
  }, [text]);

  const cursorClass =
    phase === "pre"
      ? "animate-terminal-cursor-pre"
      : phase === "post"
        ? "animate-terminal-cursor-post"
        : "";

  return (
    <span ref={ref} className={phase === "idle" ? "typewriter-pending" : undefined}>
      {text.slice(0, count)}
      {phase !== "done" && (
        <span aria-hidden="true" className={`typewriter-caret ${cursorClass}`} />
      )}
      <span className="typewriter-rest">{text.slice(count)}</span>
    </span>
  );
}
