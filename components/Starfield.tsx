"use client";

import { useEffect, useRef } from "react";

type Star = {
  x: number;
  y: number;
  r: number;
  baseAlpha: number;
  phase: number;
  speed: number;
  twinkler: boolean;
};

export default function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let stars: Star[] = [];
    let raf = 0;
    let width = 0;
    let height = 0;

    const seed = () => {
      const count = Math.min(450, Math.floor((width * height) / 4500));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.9 + 0.3,
        baseAlpha: Math.random() * 0.6 + 0.15,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.008 + 0.002,
        twinkler: Math.random() < 0.08,
      }));
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#e8e2d3";
      for (const s of stars) {
        let alpha = reduced
          ? s.baseAlpha
          : s.baseAlpha * (0.65 + 0.35 * Math.sin(s.phase + t * s.speed));
        if (!reduced && s.twinkler) {
          // Occasional sharp flash: a high-powered sine spends most of its
          // period near zero, then spikes briefly.
          const flash = Math.pow(Math.max(0, Math.sin(s.phase + t * s.speed * 2.5)), 12);
          alpha = Math.min(1, alpha + flash * 0.8);
        }
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
      if (reduced) draw(0);
    };

    const loop = (ms: number) => {
      draw(ms / 16);
      raf = requestAnimationFrame(loop);
    };

    resize();
    window.addEventListener("resize", resize);
    if (!reduced) raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10"
    />
  );
}
