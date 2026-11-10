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

// A satellite crossing the sky: a faint point moving in a straight line at a
// steady speed, the way one looks from the ground.
type Pass = {
  // Where it starts (CSS px) and the direction it travels (unit vector).
  x0: number;
  y0: number;
  dx: number;
  dy: number;
  length: number; // px travelled over the whole pass
  duration: number; // seconds
  start: number; // on the animation clock, seconds
  /** Share of the path at which it enters Earth's shadow and fades out.
   *  Above 1: it stays lit the whole way. */
  shadowAt: number;
  /** Share of the path at which a panel catches the Sun and it flares for a
   *  moment. Below 0: no flare. */
  flareAt: number;
};

// Below this canvas width (CSS px), the field switches to the phone model.
const COMPACT_WIDTH = 768;

// Seconds until the first satellite pass, then from the end of one to the
// start of the next. The first comes early enough for a short visit to catch
// it; after that they're rare, so each one is a small surprise.
const FIRST_PASS: [number, number] = [7, 11];
const PASS_GAP: [number, number] = [28, 42];
// How long the next pass waits when the Earth finale is on screen.
const PASS_HOLD = 4;

const between = ([lo, hi]: [number, number]) => lo + Math.random() * (hi - lo);
const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

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

// A pass runs roughly along the screen's diagonal (give or take 20°), in any
// of the four directions, through a random point near the middle. That keeps
// most of its length on screen on a wide desktop and a tall phone alike.
function newPass(width: number, height: number, now: number): Pass {
  const tilt =
    Math.atan2(height, width) + ((Math.random() * 40 - 20) * Math.PI) / 180;
  const angle =
    (Math.random() < 0.5 ? tilt : -tilt) + (Math.random() < 0.5 ? Math.PI : 0);
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const length = Math.hypot(width, height) * 0.9;
  const midX = width * (0.3 + Math.random() * 0.4);
  const midY = height * (0.25 + Math.random() * 0.5);
  return {
    x0: midX - (dx * length) / 2,
    y0: midY - (dy * length) / 2,
    dx,
    dy,
    length,
    duration: 8 + Math.random() * 4,
    start: now,
    shadowAt: Math.random() < 0.4 ? 0.5 + Math.random() * 0.25 : 2,
    flareAt: Math.random() < 0.35 ? 0.25 + Math.random() * 0.2 : -1,
  };
}

function drawPass(ctx: CanvasRenderingContext2D, pass: Pass, now: number) {
  const f = (now - pass.start) / pass.duration;
  // It fades in as it starts and out as it ends, or sooner where it enters
  // Earth's shadow.
  const lit =
    smoothstep(0, 0.12, f) *
    (1 - smoothstep(pass.shadowAt - 0.1, pass.shadowAt, f)) *
    (1 - smoothstep(0.88, 1, f));
  if (lit < 0.01) return;
  const flare =
    pass.flareAt > 0 ? Math.exp(-(((f - pass.flareAt) / 0.03) ** 2)) : 0;
  const x = pass.x0 + pass.dx * pass.length * f;
  const y = pass.y0 + pass.dy * pass.length * f;

  // A short, faint tail, so the eye reads it as moving.
  const tailX = x - pass.dx * 28;
  const tailY = y - pass.dy * 28;
  const tail = ctx.createLinearGradient(tailX, tailY, x, y);
  tail.addColorStop(0, "rgba(232,226,211,0)");
  tail.addColorStop(1, `rgba(232,226,211,${(0.3 * lit).toFixed(3)})`);
  ctx.strokeStyle = tail;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(tailX, tailY);
  ctx.lineTo(x, y);
  ctx.stroke();

  // Soft glow, warmer and wider during a flare.
  const glowRadius = 6 + 12 * flare;
  const tint = flare > 0.2 ? "240,214,160" : "232,226,211";
  const glow = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
  glow.addColorStop(0, `rgba(${tint},${((0.22 + 0.3 * flare) * lit).toFixed(3)})`);
  glow.addColorStop(1, `rgba(${tint},0)`);
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `rgba(255,250,240,${((0.7 + 0.3 * flare) * lit).toFixed(3)})`;
  ctx.beginPath();
  ctx.arc(x, y, 1.2 + flare, 0, Math.PI * 2);
  ctx.fill();
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

    // Satellite passes run on their own clock, which only advances while the
    // loop does, so a pass picks up where it left off after the tab was
    // hidden instead of jumping ahead.
    let clock = 0;
    let lastMs = -1;
    let pass: Pass | null = null;
    let nextPassAt = between(FIRST_PASS);
    // The Earth at the bottom of the page has its own satellites, on real
    // orbits. Passes hold off while it's on screen, so a straight-line one
    // doesn't set off across it.
    const earth = document.querySelector(".earth-finale");
    const earthOnScreen = () => {
      if (!earth) return false;
      const rect = earth.getBoundingClientRect();
      return rect.top < window.innerHeight && rect.bottom > 0;
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
        ctx.arc(s.x * width, s.y * height, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const drawPasses = () => {
      if (!pass && clock >= nextPassAt) {
        if (earthOnScreen()) nextPassAt = clock + PASS_HOLD;
        else pass = newPass(width, height, clock);
      }
      if (!pass) return;
      if (clock - pass.start >= pass.duration) {
        pass = null;
        nextPassAt = clock + between(PASS_GAP);
        return;
      }
      drawPass(ctx, pass, clock);
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
      // Capped, so the first frame back after a pause counts as one frame.
      if (lastMs >= 0) clock += Math.min(0.1, (ms - lastMs) / 1000);
      lastMs = ms;
      draw(ms / 16);
      drawPasses();
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
