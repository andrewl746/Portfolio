// Satellites and their orbit lines, drawn on one 2D canvas in the same
// projection as the Earth under it (view.ts). The canvas sits over the page's
// content and the Earth, so nothing on the page can hide part of a line or a
// satellite; only the Earth itself does, where one goes behind it.
import { MU, type Orbit } from "@/lib/earth-scene";
import { DEG, RE, dot, mix, smoothstep, type Vec3 } from "./math";
import { behindLimb, overEarth, see, type Camera, type Seen } from "./view";

type Ctx = CanvasRenderingContext2D;
type Rgb = [number, number, number];
/** A circular orbit: position(u) = radius × (cos u × node + sin u × ahead). */
export type Ring = Pick<Orbit, "radius" | "node" | "ahead">;

const EMBER: Rgb = [224, 69, 95];
const BRASS: Rgb = [201, 168, 106];
const SUNLIT: Rgb = [255, 238, 230];
const rgba = (c: Rgb, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

/** An orbit from its altitude (km), inclination and ascending node (degrees). */
export function ring(altKm: number, incDeg: number, nodeDeg: number): Ring {
  const i = incDeg * DEG;
  const O = nodeDeg * DEG;
  return {
    radius: RE + altKm,
    node: [Math.cos(O), Math.sin(O), 0],
    ahead: [-Math.cos(i) * Math.sin(O), Math.cos(i) * Math.cos(O), Math.sin(i)],
  };
}

export const orbitPoint = (o: Ring, u: number): Vec3 => {
  const c = Math.cos(u) * o.radius;
  const s = Math.sin(u) * o.radius;
  return [c * o.node[0] + s * o.ahead[0], c * o.node[1] + s * o.ahead[1], c * o.node[2] + s * o.ahead[2]];
};

/** Orbital angular speed (rad/s) at an orbit's radius. */
export const angularSpeed = (o: Ring) => Math.sqrt(MU / o.radius ** 3);

// --- Where the ember satellites flash -------------------------------------------------
// A satellite glints as it comes out of the Earth's shadow. That point isn't
// always one the reader can see: near the top of the page the orbit never
// enters the shadow at all, and on a short window the point drops below the
// bottom edge. So the flash is at that
// point when it can be seen, and otherwise at the nearest point of the orbit
// that can, which puts one flash on every pass wherever the page is. "Seen"
// covers the whole flash: the satellite has to stay in view while it fades.

/** Where in the window a satellite can be seen: the window's size and the
 *  bottom edge of the bar. */
export type Sight = { W: number; H: number; top: number };

/** Room kept between a flash and the window's edges, px. */
const FLASH_MARGIN = 44;
/** The flash comes no later than this far through a pass (0 to 1). */
const FLASH_BY = 0.75;
/** A flash takes most of a second to fade, so the satellite has to stay in
 *  sight for this much of its orbit after it starts. It is still moving fast
 *  then (stage.ts), so this is a fifth of a second of travel. */
const FLASH_SPAN = 4 * DEG;

/** Where on its orbit a satellite leaves the Earth's shadow (the cylinder
 *  see() uses), or null when the orbit never enters it. Sunlight along the
 *  orbit depends only on the angle from the Sun's direction within the
 *  orbit's plane; the shadow is the stretch within acos(c) of the point
 *  opposite the Sun. */
export function shadowExit(o: Ring, sun: Vec3): number | null {
  const x = dot(o.node, sun);
  const y = dot(o.ahead, sun);
  const c = Math.sqrt(1 - (RE / o.radius) ** 2) / Math.hypot(x, y);
  return c < 1 ? Math.atan2(y, x) + Math.PI + Math.acos(c) : null;
}

/** Can a satellite at this point of the orbit be seen, this far inside the window? */
function visible(cam: Camera, o: Ring, u: number, sight: Sight, m: number) {
  const p = orbitPoint(o, u);
  const s = see(cam, p);
  if (s.z <= 0 || s.clearance <= 0) return false;
  return s.x >= m && s.x <= sight.W - m && s.y >= sight.top + m && s.y <= sight.H - m;
}

/** Can a flash that starts at this point of the orbit be seen through? It
 *  starts clear of the window's edges, and stays on screen while it fades. */
function inSight(cam: Camera, o: Ring, u: number, sight: Sight) {
  for (let i = 0; i <= 3; i++) {
    if (!visible(cam, o, u + (FLASH_SPAN * i) / 3, sight, i ? 0 : FLASH_MARGIN)) return false;
  }
  return true;
}

/** Where a satellite passes in front of the Earth's limb, or off it into the
 *  sky: of the two such points, the one nearer the middle of the window. */
function limbCrossing(cam: Camera, o: Ring, sight: Sight): number | null {
  // 1 over the Earth's face, 0 in the sky, -1 behind the Earth or the camera.
  const side = (u: number) => {
    const p = orbitPoint(o, u);
    const s = see(cam, p);
    return s.z > 0 && s.clearance > 0 ? (behindLimb(cam, p) ? 1 : 0) : -1;
  };
  const step = DEG;
  let best: number | null = null;
  let least = Infinity;
  let a = side(0);
  for (let u = step; u < 2 * Math.PI + step / 2; u += step) {
    const b = side(u);
    if (a >= 0 && b >= 0 && a !== b) {
      let lo = u - step;
      let hi = u;
      for (let i = 0; i < 14; i++) {
        const mid = (lo + hi) / 2;
        if (side(mid) === a) lo = mid;
        else hi = mid;
      }
      const s = see(cam, orbitPoint(o, hi));
      const off = Math.hypot(s.x - sight.W / 2, s.y - (sight.top + sight.H) / 2);
      if (off < least) {
        least = off;
        best = hi;
      }
    }
    a = b;
  }
  return best;
}

/** How far outside the window a satellite still shows (its halo reaches in), px. */
const HALO_REACH = 40;

/** Is a satellite at this point of the orbit showing: in the window, or near
 *  enough for its halo to reach in, and not behind the Earth? */
export function inView(cam: Camera, o: Ring, u: number, sight: Sight) {
  const s = see(cam, orbitPoint(o, u));
  const e = HALO_REACH;
  return s.z > 0 && s.clearance > 0 && s.x > -e && s.x < sight.W + e && s.y > -e && s.y < sight.H + e;
}

/** Where the pass that reaches a point of the orbit comes into view: up over
 *  the Earth's limb, or in from the window's edge. */
export function passStart(cam: Camera, o: Ring, u: number, sight: Sight) {
  const step = 0.25 * DEG;
  let from = u;
  for (let d = 0; d < Math.PI && inView(cam, o, from - step, sight); d += step) from -= step;
  return from;
}

/** Where on the orbit the ember satellites flash for a view, or null when no
 *  part of the orbit can be seen. */
export function flashPoint(cam: Camera, o: Ring, sun: Vec3, sight: Sight): number | null {
  // Out of the shadow; where there is no shadow, across the horizon.
  const from = shadowExit(o, sun) ?? limbCrossing(cam, o, sight);
  if (from === null) return null;
  const step = 0.25 * DEG;
  // No later than partway through the pass: a flash near the end of it is one
  // most readers have scrolled past, or the satellite has all but left.
  if (inView(cam, o, from, sight)) {
    const start = passStart(cam, o, from, sight);
    let end = from;
    for (let d = 0; d < Math.PI && inView(cam, o, end + step, sight); d += step) end += step;
    for (let u = start + FLASH_BY * (end - start); u < from; u += step) if (inSight(cam, o, u, sight)) return u;
  }
  if (inSight(cam, o, from, sight)) return from;
  for (let d = step; d <= Math.PI; d += step) {
    if (inSight(cam, o, from - d, sight)) return from - d;
    if (inSight(cam, o, from + d, sight)) return from + d;
  }
  return null;
}

/** A whole orbit as a brass line: faint in front of the night side, clearer
 *  over the sky. */
export function drawTrack(
  c: Ctx,
  cam: Camera,
  o: Ring,
  alpha: number,
  steps: number,
  { width = 1.1, onEarth = 0.18 }: { width?: number; onEarth?: number } = {},
) {
  c.lineWidth = width;
  // Butt ends: the line is drawn a short stretch at a time, and round ends
  // would overlap at every join and bead a see-through line.
  c.lineCap = "butt";
  let prev: { x: number; y: number; ok: boolean } | null = null;
  for (let i = 0; i <= steps; i++) {
    const p = orbitPoint(o, (Math.PI * 2 * i) / steps);
    const s = see(cam, p);
    const ok = s.z > 0 && s.clearance > 0;
    const onFace = s.clearance < 9000 && overEarth(cam, p);
    if (prev && ok && prev.ok) {
      c.strokeStyle = rgba(BRASS, (onFace ? onEarth : 0.42) * alpha * smoothstep(0, 60, s.clearance + 60));
      c.beginPath();
      c.moveTo(prev.x, prev.y);
      c.lineTo(s.x, s.y);
      c.stroke();
    }
    prev = { x: s.x, y: s.y, ok };
  }
}

/** The ember satellite with its trail: dim in Earth's shadow, a glint as it
 *  comes out into sunlight, dimmer and redder through the air near the limb. */
export function drawHero(
  c: Ctx,
  cam: Camera,
  o: Ring,
  u: number,
  sun: Vec3,
  { glint = 0, alpha = 1, trail = 0.05, lit: lightAs }: { glint?: number; alpha?: number; trail?: number; lit?: number } = {},
) {
  const at = orbitPoint(o, u);
  const here = see(cam, at, sun);
  if (here.z <= 0) return;
  const air = smoothstep(-2, 45, here.clearance);
  const red = 1 - smoothstep(8, 60, here.clearance);
  const k = Math.min(1.5, Math.max(0.8, 4200 / here.distance));
  let prev: Seen | null = null;
  for (let i = 0; i <= 26; i++) {
    const t = i / 26;
    const q = orbitPoint(o, u - trail * (1 - t));
    const s = see(cam, q, sun);
    // Both ends in front of the camera: an end behind it projects to nonsense
    // and the stroke would cross the whole screen.
    if (prev && s.z > 0 && prev.z > 0 && s.clearance > 0 && prev.clearance > 0) {
      c.strokeStyle = rgba(EMBER, Math.pow(t, 1.7) * 0.75 * mix(0.55, 1, lightAs ?? s.sun) * smoothstep(-2, 45, s.clearance) * alpha);
      c.lineWidth = (0.35 + 1.5 * t) * k;
      c.beginPath();
      c.moveTo(prev.x, prev.y);
      c.lineTo(s.x, s.y);
      c.stroke();
    }
    prev = s;
  }
  if (here.clearance < -2) return;
  const lit = lightAs ?? here.sun;
  const r = (9 + 9 * lit + 16 * glint) * k;
  const halo = c.createRadialGradient(here.x, here.y, 0, here.x, here.y, r);
  const glow = (0.32 + 0.3 * lit + 0.35 * glint) * air * alpha;
  halo.addColorStop(0, rgba(EMBER, glow));
  halo.addColorStop(0.35, rgba(EMBER, glow * 0.35));
  halo.addColorStop(1, rgba(EMBER, 0));
  c.fillStyle = halo;
  c.beginPath();
  c.arc(here.x, here.y, r, 0, Math.PI * 2);
  c.fill();
  const warm: Rgb = [240, 120, 135];
  const core: Rgb = [0, 1, 2].map((i) => Math.round(mix(mix(warm[i], SUNLIT[i], lit), EMBER[i], red))) as Rgb;
  c.fillStyle = rgba(core, (0.7 + 0.3 * lit) * air * alpha);
  c.beginPath();
  c.arc(here.x, here.y, (1.25 + 0.55 * lit + 0.7 * glint) * k, 0, Math.PI * 2);
  c.fill();
}

/** A faint parchment point: one of the other satellites. */
export function drawDot(c: Ctx, cam: Camera, p: Vec3, sun: Vec3, alpha: number, r: number) {
  const s = see(cam, p, sun);
  if (s.z <= 0 || s.clearance < 0) return;
  const a = (0.16 + 0.42 * s.sun) * smoothstep(0, 45, s.clearance) * alpha;
  if (a <= 0.01) return;
  c.fillStyle = `rgba(232,226,211,${a})`;
  c.beginPath();
  c.arc(s.x, s.y, r, 0, Math.PI * 2);
  c.fill();
}
