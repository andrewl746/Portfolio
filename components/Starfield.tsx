"use client";

import { useEffect, useRef } from "react";

type Star = {
  // Position as a fraction of the canvas, so a resize rescales the field
  // instead of leaving a strip with no stars in it.
  x: number;
  y: number;
  r: number;
  baseAlpha: number;
  phase: number;
  speed: number;
  twinkler: boolean;
};

// Below this canvas width (CSS px), the field switches to the phone model.
const COMPACT_WIDTH = 768;

function motion() {
  return {
    phase: Math.random() * Math.PI * 2,
    speed: Math.random() * 0.008 + 0.002,
    twinkler: Math.random() < 0.08,
  };
}

// Desktop: one star per 4500px², radii spread evenly from 0.3 to 2.2px.
function wideField(width: number, height: number): Star[] {
  const count = Math.min(450, Math.floor((width * height) / 4500));
  return Array.from({ length: count }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: Math.random() * 1.9 + 0.3,
    baseAlpha: Math.random() * 0.6 + 0.15,
    ...motion(),
  }));
}

// Phones: the desktop model on a 375px screen came out as ~70 big dots in
// random clumps. A real night sky is mostly faint pinpricks with a few
// brighter stars, so phones get ~2.8x the density, sizes skewed small (most
// around half a pixel, a rare few past one), brightness tied to size, and a
// jittered grid: one star at a random spot in each cell, which spreads them
// evenly without looking like a grid.
function compactField(width: number, height: number): Star[] {
  const target = Math.min(450, Math.floor((width * height) / 1600));
  const cols = Math.max(1, Math.round(Math.sqrt((target * width) / height)));
  const rows = Math.max(1, Math.round(target / cols));
  const stars: Star[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const size = Math.pow(Math.random(), 2.4);
      stars.push({
        x: (col + Math.random()) / cols,
        y: (row + Math.random()) / rows,
        r: 0.3 + size,
        baseAlpha: Math.min(
          0.85,
          0.24 + 0.5 * Math.pow(size, 0.6) + Math.random() * 0.12
        ),
        ...motion(),
      });
    }
  }
  return stars;
}

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
        ctx.arc(s.x * width, s.y * height, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    // The canvas is sized by CSS to the large viewport (.starfield in
    // globals.css), so a phone's address bar sliding in and out doesn't
    // change its size: this only runs on a real resize, like rotating the
    // phone or resizing a desktop window. A new width gets a fresh field
    // (the star model depends on it); a height-only change rescales the
    // existing stars.
    const resize = () => {
      const nextWidth = canvas.clientWidth;
      const nextHeight = canvas.clientHeight;
      if (!nextWidth || !nextHeight) return;
      if (nextWidth === width && nextHeight === height) return;
      const widthChanged = nextWidth !== width;
      width = nextWidth;
      height = nextHeight;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (widthChanged || stars.length === 0) {
        stars =
          width < COMPACT_WIDTH
            ? compactField(width, height)
            : wideField(width, height);
      }
      if (reduced) draw(0);
    };

    const loop = (ms: number) => {
      draw(ms / 16);
      raf = requestAnimationFrame(loop);
    };

    // Pause the render loop while the tab is hidden to save CPU and battery.
    const onVisibility = () => {
      if (reduced) return;
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else if (!raf) {
        raf = requestAnimationFrame(loop);
      }
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    document.addEventListener("visibilitychange", onVisibility);
    if (!reduced) raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="starfield" />;
}
