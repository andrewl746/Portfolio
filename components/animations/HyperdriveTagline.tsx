"use client";

import { useEffect, useRef, useState } from "react";
import { onStatsSettled } from "@/lib/hero-cue";

type State = "waiting" | "arriving" | "done";

// If the stat values never play while the tagline is in view (they've been
// scrolled past, or already played), it arrives anyway after this long.
const FALLBACK_MS = 1500;

// The hero tagline drops out of hyperspace toward you: nothing, then the line
// comes out of the distance with a short trail and snaps into place with a
// flash (.hyperdrive in globals.css). It arrives once the stat values below
// have finished coming in (lib/hero-cue.ts), so the eye goes from them to
// it. The component only flips its state and adds the trail while it
// arrives; CSS runs the motion. The text is plain in the server HTML for
// crawlers and visitors without JS.
export default function HyperdriveTagline({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [state, setState] = useState<State>("waiting");

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    let arrived = false;
    let timer = 0;
    let stopWaiting: () => void = () => {};
    const arrive = () => {
      if (arrived) return;
      arrived = true;
      window.clearTimeout(timer);
      stopWaiting();
      setState("arriving");
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          arrive();
          return;
        }
        timer = window.setTimeout(arrive, FALLBACK_MS);
        stopWaiting = onStatsSettled(arrive);
      },
      { threshold: 0.4 }
    );
    observer.observe(node);

    // The flash (or, with reduced motion, the fade) is the last thing to
    // finish. Dropping to "done" then removes every effect layer.
    const onEnd = (e: AnimationEvent) => {
      if (e.animationName === "hyperdrive-flash" || e.animationName === "hyperdrive-fade") {
        setState("done");
      }
    };
    node.addEventListener("animationend", onEnd);

    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
      stopWaiting();
      node.removeEventListener("animationend", onEnd);
    };
  }, []);

  return (
    <span ref={ref} className="hyperdrive" data-state={state} data-text={text}>
      {text}
      {/* Fading copies left behind as it comes out of the distance. */}
      {state === "arriving" &&
        ["near", "far"].map((echo) => (
          <span key={echo} aria-hidden="true" className="hyperdrive-echo" data-echo={echo}>
            {text}
          </span>
        ))}
    </span>
  );
}
