"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import {
  EARTH_DESKTOP,
  EARTH_MOBILE,
  EARTH_RADIUS,
  MU,
  SUN,
  type EarthFrame,
  type Orbit,
  type Vec3,
} from "@/lib/earth-scene";

// Landscape screens get the wide render; portrait ones (phones, portrait
// tablets) get the tall one, where the wide one would shrink to a thin
// strip. Keep in sync with the .earth-wide rules in globals.css.
const WIDE = "(orientation: landscape)";
// Either render spans the main column: beside the 180px sidebar from
// Tailwind's md breakpoint (48rem), full width below it.
const SIZES = "(min-width: 48rem) calc(100vw - 180px), 100vw";
const LAYERS = ["surface", "lights", "atmosphere"] as const;

// How far below its resting place the Earth starts, as a share of its height,
// and how quickly the drawn position catches up with the scroll position.
const RISE = 18;
const FOLLOW_SECONDS = 0.14;
// Scroll progress at which the orbit draws in and the satellites start.
const ORBIT_TRIGGER = 0.6;
const DRAW_SECONDS = 1.8;
// One pass of the hero satellite across the frame, and the pause between.
const PASS_SECONDS = 15;
const GAP_SECONDS = 3.2;
// Length of the satellite's trail, in radians of orbit behind it.
const TRAIL_SPAN = 0.05;
// Share of the frame height kept as the bottom scrim under the footer.
const SCRIM = 0.24;

const EMBER: [number, number, number] = [224, 69, 95];
const BRASS: [number, number, number] = [201, 168, 106];
const SUNLIT: [number, number, number] = [255, 238, 230];

// --- Math ---------------------------------------------------------------

const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

// The site's strong ease-out, cubic-bezier(0.23, 1, 0.32, 1), solved exactly.
function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;
  const slopeX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const err = sampleX(t) - x;
      const slope = slopeX(t);
      if (Math.abs(err) < 1e-6 || Math.abs(slope) < 1e-6) break;
      t -= err / slope;
    }
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 24 && Math.abs(sampleX(t) - x) > 1e-6; i++) {
      if (sampleX(t) < x) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return sampleY(t);
  };
}
const easeOut = cubicBezier(0.23, 1, 0.32, 1);

function orbitPoint(o: Orbit, u: number): Vec3 {
  const c = Math.cos(u) * o.radius;
  const s = Math.sin(u) * o.radius;
  return [c * o.node[0] + s * o.ahead[0], c * o.node[1] + s * o.ahead[1], c * o.node[2] + s * o.ahead[2]];
}

type Seen = {
  x: number; // frame px
  y: number;
  /** Lowest height (km) the line of sight passes over the Earth on its way to
   *  the point. Negative: the Earth is in the way. Under ~50: through air. */
  clearance: number;
  /** 0 in Earth's shadow, 1 in sunlight. */
  sun: number;
  distance: number;
};

function see(frame: EarthFrame, p: Vec3): Seen {
  const { position: c, forward, right, up, focal, cx, cy } = frame.camera;
  const v: Vec3 = [p[0] - c[0], p[1] - c[1], p[2] - c[2]];
  const distance = Math.hypot(v[0], v[1], v[2]);
  const z = dot(v, forward);
  const d: Vec3 = [v[0] / distance, v[1] / distance, v[2] / distance];
  const t = Math.min(distance, Math.max(0, -dot(c, d)));
  const clearance =
    Math.hypot(c[0] + d[0] * t, c[1] + d[1] * t, c[2] + d[2] * t) - EARTH_RADIUS;
  // Cylindrical shadow with a soft 80 km edge for the penumbra.
  const along = dot(p, SUN);
  const perp = Math.hypot(p[0] - along * SUN[0], p[1] - along * SUN[1], p[2] - along * SUN[2]);
  const sun = along > 0 ? 1 : smoothstep(EARTH_RADIUS - 40, EARTH_RADIUS + 40, perp);
  return {
    x: cx + (focal * dot(v, right)) / z,
    y: cy - (focal * dot(v, up)) / z,
    clearance,
    sun,
    distance,
  };
}

/** Does the line of sight through p continue on to hit the Earth (p is in
 *  front of the planet) or out into space (p is above the limb)? */
function overEarth(frame: EarthFrame, p: Vec3) {
  const c = frame.camera.position;
  const v: Vec3 = [p[0] - c[0], p[1] - c[1], p[2] - c[2]];
  const n = Math.hypot(v[0], v[1], v[2]);
  const b = dot(c, v) / n;
  return b < 0 && b * b - (dot(c, c) - EARTH_RADIUS * EARTH_RADIUS) > 0;
}

/** Orbital angular speed (rad/s) at an orbit's radius. */
const angularSpeed = (o: Orbit) => Math.sqrt(MU / o.radius ** 3);

// --- Scene state ------------------------------------------------------------

type Geometry = {
  frame: EarthFrame;
  path: { x: number; y: number }[];
  limbIndex: number;
  /** Seconds of animation per second of real orbital motion. */
  timeScale: number;
  restU: number;
};

function buildGeometry(frame: EarthFrame): Geometry {
  const o = frame.orbit;
  const n = 480;
  const path: { x: number; y: number }[] = [];
  let limbIndex = n;
  let restU = o.start;
  let restY = Infinity;
  for (let i = 0; i <= n; i++) {
    const u = o.start + ((o.end - o.start) * i) / n;
    const p = orbitPoint(o, u);
    const s = see(frame, p);
    path.push({ x: s.x, y: s.y });
    if (limbIndex === n && !overEarth(frame, p)) limbIndex = i;
    // The still frame for reduced motion: the top of the arc, in sunlight.
    if (s.y < restY) {
      restY = s.y;
      restU = u;
    }
  }
  const realSeconds = (o.end - o.start) / angularSpeed(o);
  return { frame, path, limbIndex, timeScale: PASS_SECONDS / realSeconds, restU };
}

type Traffic = { orbit: Orbit; duration: number; period: number; offset: number };

function buildTraffic(geo: Geometry): Traffic[] {
  // Fixed offsets so the faint satellites never bunch up or cross the hero
  // at the same moment on every visit.
  const offsets = [2.5, 9.0, 15.5];
  const gaps = [7.0, 11.0, 5.5];
  return geo.frame.traffic.map((orbit, i) => {
    const duration = ((orbit.end - orbit.start) / angularSpeed(orbit)) * geo.timeScale;
    return { orbit, duration, period: duration + gaps[i % gaps.length], offset: offsets[i % offsets.length] };
  });
}

// --- Drawing ----------------------------------------------------------------

const rgba = (c: [number, number, number], a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

function drawOrbitLine(ctx: CanvasRenderingContext2D, geo: Geometry, k: number, drawn: number) {
  const { path, limbIndex } = geo;
  const last = Math.min(path.length - 1, Math.floor(drawn * (path.length - 1)));
  if (last < 1) return;
  const a = path[0];
  // If a re-render ever starts the pass above the limb, ramp over the whole
  // path rather than a zero-length gradient (which paints nothing).
  const b = path[limbIndex > 0 ? Math.min(limbIndex, path.length - 1) : path.length - 1];
  // Faint where the orbit passes in front of the night side, full once it
  // clears the limb.
  const grad = ctx.createLinearGradient(a.x * k, a.y * k, b.x * k, b.y * k);
  grad.addColorStop(0, rgba(BRASS, 0));
  grad.addColorStop(0.55, rgba(BRASS, 0.16));
  grad.addColorStop(1, rgba(BRASS, 0.42));
  ctx.strokeStyle = grad;
  ctx.lineWidth = 1.1;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(path[0].x * k, path[0].y * k);
  for (let i = 1; i <= last; i++) ctx.lineTo(path[i].x * k, path[i].y * k);
  // Partial last segment so the line's tip moves smoothly.
  const f = drawn * (path.length - 1) - last;
  if (last < path.length - 1 && f > 0) {
    const p = path[last];
    const q = path[last + 1];
    ctx.lineTo((p.x + (q.x - p.x) * f) * k, (p.y + (q.y - p.y) * f) * k);
  }
  ctx.stroke();
}

function drawHero(ctx: CanvasRenderingContext2D, geo: Geometry, k: number, u: number, glint: number) {
  const { frame } = geo;
  const o = frame.orbit;
  const here = see(frame, orbitPoint(o, u));
  // Through thick air near the limb the satellite dims and reddens, like a
  // setting star; behind the Earth it's gone.
  const air = smoothstep(-2, 45, here.clearance);
  const red = 1 - smoothstep(8, 60, here.clearance);
  const scale = Math.min(1.5, Math.max(0.8, 4200 / here.distance));

  // Trail: the last few degrees of the orbit behind it, so it stretches when
  // the satellite is near (fast across the screen) and shortens far away.
  // Each piece is hidden once it's behind the Earth, so after the satellite
  // sets, the trail follows it down behind the limb.
  const steps = 26;
  let prev: Seen | null = null;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const s = see(frame, orbitPoint(o, u - TRAIL_SPAN * (1 - t)));
    if (prev && s.clearance > 0 && prev.clearance > 0) {
      const light = mix(0.55, 1, s.sun);
      ctx.strokeStyle = rgba(EMBER, Math.pow(t, 1.7) * 0.75 * light * smoothstep(-2, 45, s.clearance));
      ctx.lineWidth = (0.35 + 1.5 * t) * scale;
      ctx.beginPath();
      ctx.moveTo(prev.x * k, prev.y * k);
      ctx.lineTo(s.x * k, s.y * k);
      ctx.stroke();
    }
    prev = s;
  }

  if (here.clearance < -2) return;
  const x = here.x * k;
  const y = here.y * k;
  const lit = here.sun;
  const r = (9 + 9 * lit + 16 * glint) * scale;
  const halo = ctx.createRadialGradient(x, y, 0, x, y, r);
  const glowA = (0.32 + 0.3 * lit + 0.35 * glint) * air;
  halo.addColorStop(0, rgba(EMBER, glowA));
  halo.addColorStop(0.35, rgba(EMBER, glowA * 0.35));
  halo.addColorStop(1, rgba(EMBER, 0));
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  const core: [number, number, number] = [
    Math.round(mix(mix(240, SUNLIT[0], lit), EMBER[0], red)),
    Math.round(mix(mix(120, SUNLIT[1], lit), EMBER[1], red)),
    Math.round(mix(mix(135, SUNLIT[2], lit), EMBER[2], red)),
  ];
  ctx.fillStyle = rgba(core, (0.7 + 0.3 * lit) * air);
  ctx.beginPath();
  ctx.arc(x, y, (1.25 + 0.55 * lit + 0.7 * glint) * scale, 0, Math.PI * 2);
  ctx.fill();
}

function drawTraffic(ctx: CanvasRenderingContext2D, frame: EarthFrame, k: number, o: Orbit, u: number, fade: number) {
  const s = see(frame, orbitPoint(o, u));
  if (s.clearance < 0) return;
  const a = (0.16 + 0.42 * s.sun) * smoothstep(0, 45, s.clearance) * fade;
  if (a <= 0.01) return;
  if (s.sun > 0.5) {
    const g = ctx.createRadialGradient(s.x * k, s.y * k, 0, s.x * k, s.y * k, 4);
    g.addColorStop(0, `rgba(232,226,211,${a * 0.35})`);
    g.addColorStop(1, "rgba(232,226,211,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(s.x * k, s.y * k, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = `rgba(232,226,211,${a})`;
  ctx.beginPath();
  ctx.arc(s.x * k, s.y * k, 0.85, 0, Math.PI * 2);
  ctx.fill();
}

// --- Component ----------------------------------------------------------------

function srcSet(frame: EarthFrame, layer: string, format: "avif" | "webp") {
  return frame.widths.map((w) => `/earth/earth-${frame.name}-${layer}-${w}.${format} ${w}w`).join(", ");
}

const km = (frame: EarthFrame) => frame.altitude.toLocaleString("en-US");

// On a short screen the frame gives up height in this order: first the empty
// sky above the satellite's arc, down to just above its peak; then up to
// this share of its bottom, the near side under the footer's scrim.
const BOTTOM_KEEP = 0.88;

/**
 * Where the frame's essential band starts: just above the top of the
 * satellite's arc, as a share of the frame height.
 */
function keepFrom(frame: EarthFrame) {
  const o = frame.orbit;
  let top = frame.height;
  for (let i = 0; i <= 96; i++) {
    top = Math.min(top, see(frame, orbitPoint(o, o.start + ((o.end - o.start) * i) / 96)).y);
  }
  return Math.max(0, top / frame.height - 0.03);
}

const ratio = (frame: EarthFrame, share = 1) => `${frame.width} / ${(frame.height * share).toFixed(1)}`;
const ofWidth = (frame: EarthFrame, share: number) => (share * frame.height) / frame.width;

// Computed once from the scene constants; identical on server and client.
// -min: the shortest the Earth gets (the band from keepFrom to BOTTOM_KEEP),
// as padding on a strut, so a share of the width. -keep: the frame from
// keepFrom down, as a multiple of the width, for pinning the stage.
const SIZING = {
  "--earth-tall": ratio(EARTH_MOBILE),
  "--earth-wide": ratio(EARTH_DESKTOP),
  "--earth-tall-min": `${(ofWidth(EARTH_MOBILE, BOTTOM_KEEP - keepFrom(EARTH_MOBILE)) * 100).toFixed(3)}%`,
  "--earth-wide-min": `${(ofWidth(EARTH_DESKTOP, BOTTOM_KEEP - keepFrom(EARTH_DESKTOP)) * 100).toFixed(3)}%`,
  "--earth-tall-keep": ofWidth(EARTH_MOBILE, 1 - keepFrom(EARTH_MOBILE)).toFixed(4),
  "--earth-wide-keep": ofWidth(EARTH_DESKTOP, 1 - keepFrom(EARTH_DESKTOP)).toFixed(4),
  "--earth-tall-scrim": ratio(EARTH_MOBILE, SCRIM),
  "--earth-wide-scrim": ratio(EARTH_DESKTOP, SCRIM),
} as CSSProperties;

function Marker({ frame, className }: { frame: EarthFrame; className: string }) {
  if (!frame.waterloo) return null;
  return (
    <span
      className={`earth-marker absolute ${className}`}
      style={{ left: `${frame.waterloo.x * 100}%`, top: `${frame.waterloo.y * 100}%` }}
    >
      <span className="earth-marker-dot" />
      <span className="earth-marker-label">Waterloo</span>
    </span>
  );
}

/**
 * The night side of Earth at the bottom of the page: real NASA city lights
 * rendered from a fixed camera (scripts/render-earth.py), rising into place
 * as the page reaches its end, with a satellite crossing over the limb.
 * The footer passed as children sits on the Earth's dark near side.
 *
 * The rendered frame is pinned to the bottom of this element. Give it the
 * height to fill (e.g. flex-1); it never gets shorter than the frame's
 * essential band (see BOTTOM_KEEP), and any extra height is more sky above.
 *
 * settleWith: id of the section a nav link jumps to. The Earth finishes
 * rising where that jump lands (the section at its scroll margin), so it's
 * never caught half-risen there even when the scene is taller than the
 * screen. Without it, the Earth settles at the end of the page.
 */
export default function EarthFinale({
  children,
  className,
  settleWith,
}: {
  children?: ReactNode;
  className?: string;
  settleWith?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRefs = useRef<Partial<Record<(typeof LAYERS)[number], HTMLImageElement | null>>>({});

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    const lights = imgRefs.current.lights;
    const atmo = imgRefs.current.atmosphere;
    if (!root || !stage || !canvas || !lights || !atmo) return;
    // The effect owns the reveal from here, so the CSS fallback that shows
    // the Earth if this never runs stands down.
    root.removeAttribute("data-pending");
    // Without a 2D context the Earth still rises; only the overlay is lost.
    const ctx = canvas.getContext("2d");

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const wide = window.matchMedia(WIDE);
    const frameFor = () => (wide.matches ? EARTH_DESKTOP : EARTH_MOBILE);

    let geo = buildGeometry(frameFor());
    let traffic = buildTraffic(geo);
    let k = 1; // frame px -> css px

    const anchor = settleWith ? document.getElementById(settleWith) : null;
    let anchorMargin = 0;
    const readAnchor = () => {
      anchorMargin = anchor ? parseFloat(getComputedStyle(anchor).scrollMarginTop) || 0 : 0;
    };
    readAnchor();

    // Scroll progress: 0 as the Earth's top enters at the bottom of the
    // screen, 1 where it comes to rest. That's the end of the page, or
    // sooner if a jump to the anchor section lands sooner, as long as a good
    // part of the Earth is in view there (else a tall Contact on a short
    // screen would turn the rise into a pop).
    const target = () => {
      const r = root.getBoundingClientRect();
      const vh = window.innerHeight;
      let rest = vh - r.height;
      if (anchor) {
        const jump = anchorMargin + r.top - anchor.getBoundingClientRect().top;
        rest = Math.max(rest, Math.min(jump, vh - 0.45 * r.height));
      }
      return clamp01((vh - r.top) / Math.max(1, vh - rest));
    };
    let q = 0;
    let shownQ = -1;
    let readyAt = -1; // when the current framing's images were all in, ms
    let orbitAt = -1; // when the orbit started drawing, ms
    let glintAt = -1;
    let lastSun = 0;
    let lastPass = -1;
    let resumed = true;

    const applyRise = () => {
      if (Math.abs(q - shownQ) < 1e-4) return;
      shownQ = q;
      const rest = 1 - q;
      stage.style.transform = `translate3d(0, ${(rest * RISE).toFixed(3)}%, 0) scale(${(1 + rest * 0.035).toFixed(4)})`;
      lights.style.opacity = (0.12 + 0.88 * smoothstep(0.25, 0.92, q)).toFixed(3);
      atmo.style.opacity = (0.3 + 0.7 * smoothstep(0.4, 1, q)).toFixed(3);
      root.toggleAttribute("data-settled", q > 0.85);
    };

    // Canvas size, kept so a resize that changes nothing doesn't clear it,
    // and the finished orbit line, cached as a bitmap once it's drawn in.
    let cw = 0;
    let ch = 0;
    let cdpr = 0;
    let lineCache: HTMLCanvasElement | null = null;
    // Nothing moving and the still frame already painted: skip redraws.
    let stillPainted = false;

    const draw = (now: number) => {
      if (!ctx) return;
      if (reduced.matches) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawOrbitLine(ctx, geo, k, 1);
        drawHero(ctx, geo, k, geo.restU, 0);
        return;
      }
      if (orbitAt < 0 || now < orbitAt) {
        if (!stillPainted) ctx.clearRect(0, 0, canvas.width, canvas.height);
        stillPainted = true;
        return;
      }
      const since = (now - orbitAt) / 1000;
      const drawn = easeOut(since / DRAW_SECONDS);

      // Work out what's moving this frame before touching the canvas.
      const moving: { o: Orbit; u: number; fade: number }[] = [];
      for (const t of traffic) {
        const time = since - 0.8 - t.offset;
        if (time < 0) continue;
        const local = time % t.period;
        if (local > t.duration) continue;
        const u = t.orbit.start + ((t.orbit.end - t.orbit.start) * local) / t.duration;
        moving.push({ o: t.orbit, u, fade: smoothstep(0, 0.6, Math.min(local, t.duration - local)) });
      }
      const o = geo.frame.orbit;
      // The hero's first pass starts the moment the line starts drawing, so
      // something is moving as soon as the orbit appears (the line races
      // ahead of it). Each pass runs on past the set until its trail has
      // followed it down.
      const time = since;
      const sinkSeconds = (TRAIL_SPAN / (o.end - o.start)) * PASS_SECONDS;
      let hero: { u: number; glint: number } | null = null;
      if (time >= 0) {
        const pass = Math.floor(time / (PASS_SECONDS + GAP_SECONDS));
        const local = time - pass * (PASS_SECONDS + GAP_SECONDS);
        if (pass !== lastPass) {
          lastPass = pass;
          lastSun = 0;
        }
        if (local <= PASS_SECONDS + sinkSeconds) {
          const u = o.start + ((o.end - o.start) * local) / PASS_SECONDS;
          // A brief glint as it crosses out of Earth's shadow into sunlight,
          // but not on the first frame back after a pause, wherever it is.
          const sun = see(geo.frame, orbitPoint(o, u)).sun;
          if (!resumed && lastSun < 0.5 && sun >= 0.5) glintAt = now;
          resumed = false;
          lastSun = sun;
          const g = glintAt < 0 ? Infinity : (now - glintAt) / 1000;
          hero = { u, glint: g < 0.12 ? g / 0.12 : Math.exp(-(g - 0.12) / 0.6) };
        }
      }

      const still = drawn >= 1 && !hero && moving.length === 0;
      if (still && stillPainted) return;
      stillPainted = still;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (drawn < 1) {
        drawOrbitLine(ctx, geo, k, drawn);
      } else {
        if (!lineCache) {
          lineCache = document.createElement("canvas");
          lineCache.width = canvas.width;
          lineCache.height = canvas.height;
          const c = lineCache.getContext("2d");
          if (c) {
            c.setTransform(cdpr, 0, 0, cdpr, 0, 0);
            drawOrbitLine(c, geo, k, 1);
          }
        }
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.drawImage(lineCache, 0, 0);
        ctx.restore();
      }
      for (const m of moving) drawTraffic(ctx, geo.frame, k, m.o, m.u, m.fade);
      if (hero) drawHero(ctx, geo, k, hero.u, hero.glint);
    };

    const resize = () => {
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      if (!w || !h) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      if (ctx && (w !== cw || h !== ch || dpr !== cdpr)) {
        cw = w;
        ch = h;
        cdpr = dpr;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      k = w / geo.frame.width;
      lineCache = null;
      stillPainted = false;
      // Repaint straight away: resizing clears the canvas, and the next
      // animation frame may be a while off (or never, when paused).
      draw(performance.now());
    };

    let raf = 0;
    let running = false;
    let inView = false;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      // Hold the Earth down until its images are in, so the rise plays
      // where it can be seen (a jump to Contact can land before they load).
      const p = readyAt < 0 ? 0 : target();
      q += (p - q) * (1 - Math.exp(-dt / FOLLOW_SECONDS));
      if (Math.abs(p - q) < 5e-4) q = p;
      applyRise();
      if (orbitAt < 0 && readyAt >= 0 && q > ORBIT_TRIGGER) {
        // Give the stage's fade-in a moment before the line starts.
        orbitAt = Math.max(now, readyAt + 250);
      }
      draw(now);
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (running || !inView || reduced.matches || document.hidden) return;
      running = true;
      resumed = true;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const settleStill = () => {
      q = 1;
      shownQ = -1;
      applyRise();
      draw(performance.now());
    };

    // Show the stage once the current framing's three layers have loaded
    // and decoded, so the Earth never assembles piece by piece, or shows the
    // other framing's image stretched after a rotation. Lazy images only
    // load near the viewport; the wait covers that too.
    let cancelled = false;
    let revealToken = 0;
    const loaded = (img: HTMLImageElement, name: string) =>
      new Promise<void>((resolve) => {
        const current = () => img.currentSrc.includes(`/earth-${name}-`);
        const finish = () => {
          img.removeEventListener("load", onLoad);
          img.removeEventListener("error", onLoad);
          img.decode().catch(() => undefined).then(() => resolve());
        };
        const onLoad = () => {
          if (current()) finish();
        };
        // A layer that fails to load still counts, so the rest can show.
        img.addEventListener("load", onLoad);
        img.addEventListener("error", onLoad);
        if (img.complete && img.naturalWidth > 0 && current()) finish();
      });
    const reveal = () => {
      const token = ++revealToken;
      const name = geo.frame.name;
      Promise.all(LAYERS.map((l) => (imgRefs.current[l] ? loaded(imgRefs.current[l], name) : undefined))).then(() => {
        if (cancelled || token !== revealToken) return;
        readyAt = performance.now();
        root.setAttribute("data-ready", "");
        root.removeAttribute("data-switching");
        if (reduced.matches) settleStill();
      });
    };

    const io = new IntersectionObserver(
      (entries) => {
        inView = entries[entries.length - 1].isIntersecting;
        if (inView) start();
        else stop();
      },
      { rootMargin: "120px 0px" }
    );
    // Start loading the layers once the Earth is within about two screens,
    // so they're in by the time it scrolls into view. Browsers' own lazy
    // loading starts at very different distances (Firefox and Safari much
    // closer than Chrome), which would hold the rise back on arrival.
    const preload = new IntersectionObserver(
      (entries) => {
        if (!entries[entries.length - 1].isIntersecting) return;
        for (const l of LAYERS) {
          const img = imgRefs.current[l];
          if (img) img.loading = "eager";
        }
        preload.disconnect();
      },
      { rootMargin: "1600px 0px" }
    );
    const ro = new ResizeObserver(() => {
      readAnchor();
      resize();
      if (reduced.matches) settleStill();
    });
    const onLayout = () => {
      geo = buildGeometry(frameFor());
      traffic = buildTraffic(geo);
      // Hide at once until the other framing's images are in; the old ones
      // would show stretched under the new overlay. The Earth then rises in
      // again.
      root.setAttribute("data-switching", "");
      readyAt = -1;
      reveal();
      resize();
      if (reduced.matches) settleStill();
    };
    const onMotion = () => {
      if (reduced.matches) {
        stop();
        settleStill();
      } else {
        shownQ = -1;
        stillPainted = false;
        start();
      }
    };
    const onVisibility = () => (document.hidden ? stop() : start());
    // A move to a screen with another pixel density needs a sharper (or
    // lighter) canvas even though the CSS size is unchanged.
    let dprQuery: MediaQueryList | null = null;
    const onDpr = () => {
      resize();
      watchDpr();
    };
    const watchDpr = () => {
      dprQuery?.removeEventListener("change", onDpr);
      dprQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      dprQuery.addEventListener("change", onDpr);
    };

    reveal();
    resize();
    if (reduced.matches) settleStill();
    else applyRise();
    io.observe(root);
    preload.observe(root);
    ro.observe(stage);
    watchDpr();
    wide.addEventListener("change", onLayout);
    reduced.addEventListener("change", onMotion);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      stop();
      io.disconnect();
      preload.disconnect();
      ro.disconnect();
      dprQuery?.removeEventListener("change", onDpr);
      wide.removeEventListener("change", onLayout);
      reduced.removeEventListener("change", onMotion);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [settleWith]);

  return (
    <div
      ref={rootRef}
      data-nav-section="contact"
      data-pending=""
      className={`earth-finale relative w-full overflow-hidden ${className ?? ""}`}
      style={SIZING}
    >
      <div
        ref={stageRef}
        aria-hidden="true"
        className="earth-stage pointer-events-none absolute inset-x-0 origin-bottom"
      >
        {LAYERS.map((layer) => (
          <picture key={layer}>
            <source media={WIDE} type="image/avif" srcSet={srcSet(EARTH_DESKTOP, layer, "avif")} sizes={SIZES} />
            <source media={WIDE} type="image/webp" srcSet={srcSet(EARTH_DESKTOP, layer, "webp")} sizes={SIZES} />
            <source type="image/avif" srcSet={srcSet(EARTH_MOBILE, layer, "avif")} sizes={SIZES} />
            <img
              ref={(el) => {
                imgRefs.current[layer] = el;
              }}
              src={`/earth/earth-mobile-${layer}-${EARTH_MOBILE.widths[0]}.webp`}
              srcSet={srcSet(EARTH_MOBILE, layer, "webp")}
              sizes={SIZES}
              alt=""
              loading="lazy"
              decoding="async"
              draggable={false}
              className={`absolute inset-0 h-full w-full select-none ${layer === "surface" ? "" : "earth-fade"}`}
            />
          </picture>
        ))}
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
        <Marker frame={EARTH_DESKTOP} className="earth-wide" />
        <Marker frame={EARTH_MOBILE} className="earth-tall" />
      </div>

      {/* The near side of the planet fades into the page, so the footer
          reads cleanly over it. */}
      <div aria-hidden="true" className="earth-scrim pointer-events-none absolute inset-x-0 bottom-0" />

      <div className="absolute inset-x-0 bottom-0">
        <div className="mx-auto max-w-4xl px-6 pb-6 md:px-14 md:pb-8">
          {/* Right-aligned, over the dark Atlantic rather than the lights. */}
          <p className="earth-caption mb-4 ml-auto max-w-[10.5rem] text-right text-[10px] uppercase leading-relaxed tracking-[0.1em] text-dim md:max-w-xs">
            <span className="earth-tall">
              Eastern North America from {km(EARTH_MOBILE)} km. Lights: NASA Black Marble.
            </span>
            <span className="earth-wide">
              Eastern North America at night from {km(EARTH_DESKTOP)} km. City lights: NASA Black Marble.
            </span>
          </p>
          {children}
        </div>
      </div>
    </div>
  );
}
