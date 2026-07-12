"use client";

import { useEffect, useRef, useState } from "react";
import { CONSTELLATIONS, type ConstellationName } from "@/lib/constellations";

export default function Constellation({
  name,
  className,
  prominent = false,
}: {
  name: ConstellationName;
  className?: string;
  prominent?: boolean;
}) {
  const { stars, edges } = CONSTELLATIONS[name];
  const lineAlpha = prominent ? 0.17 : 0.12;
  const starAlpha = prominent ? 0.52 : 0.4;
  const ref = useRef<SVGSVGElement>(null);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Reduced motion: the media query in globals.css already forces lines
    // and stars fully visible, so there is nothing to observe.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setDrawn(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <svg
      ref={ref}
      viewBox="0 0 300 260"
      className={`${className ?? ""} ${drawn ? "constellation-drawn" : ""}`}
      aria-hidden="true"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g stroke={`rgba(232, 226, 211, ${lineAlpha})`} strokeWidth="1">
        {edges.map(([a, b], i) => (
          <line
            key={i}
            x1={stars[a][0]}
            y1={stars[a][1]}
            x2={stars[b][0]}
            y2={stars[b][1]}
            pathLength={1}
            className="constellation-line"
            style={{ animationDelay: `${0.25 + i * 0.08}s` }}
          />
        ))}
      </g>
      <g className="constellation-stars">
        {stars.map(([x, y, r], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={r}
            fill={`rgba(232, 226, 211, ${starAlpha})`}
            className="constellation-star"
            style={{ animationDelay: `-${((i * 1.3) % 5).toFixed(2)}s` }}
          />
        ))}
      </g>
    </svg>
  );
}
