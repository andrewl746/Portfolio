// Satellites and their orbit lines, drawn on 2D canvases in the same
// projection as the Earth under them (view.ts). Every draw takes two canvases:
// what is over the sky goes on `sky`, which sits under the page's content, and
// what crosses the face of the Earth goes on `face`, which sits over it. So a
// satellite passes behind a screenshot, not across it, and still crosses the
// planet in front.
import { MU, type Orbit } from "@/lib/earth-scene";
import { DEG, RE, mix, smoothstep, type Vec3 } from "./math";
import { behindLimb, see, type Camera, type Seen } from "./view";

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

/** A whole orbit as a brass line: faint in front of the night side, clearer
 *  over the sky. */
export function drawTrack(face: Ctx, sky: Ctx, cam: Camera, o: Ring, alpha: number, steps: number) {
  for (const c of [face, sky]) {
    c.lineWidth = 1.1;
    c.lineCap = "round";
  }
  let prev: { x: number; y: number; ok: boolean } | null = null;
  for (let i = 0; i <= steps; i++) {
    const p = orbitPoint(o, (Math.PI * 2 * i) / steps);
    const s = see(cam, p);
    const ok = s.z > 0 && s.clearance > 0;
    if (prev && ok && prev.ok) {
      const onFace = s.clearance < 9000 && behindLimb(cam, p);
      const c = onFace ? face : sky;
      c.strokeStyle = rgba(BRASS, (onFace ? 0.18 : 0.42) * alpha * smoothstep(0, 60, s.clearance + 60));
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
  face: Ctx,
  sky: Ctx,
  cam: Camera,
  o: Ring,
  u: number,
  sun: Vec3,
  { glint = 0, alpha = 1, trail = 0.05 }: { glint?: number; alpha?: number; trail?: number } = {},
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
      const c = behindLimb(cam, q) ? face : sky;
      c.strokeStyle = rgba(EMBER, Math.pow(t, 1.7) * 0.75 * mix(0.55, 1, s.sun) * smoothstep(-2, 45, s.clearance) * alpha);
      c.lineWidth = (0.35 + 1.5 * t) * k;
      c.beginPath();
      c.moveTo(prev.x, prev.y);
      c.lineTo(s.x, s.y);
      c.stroke();
    }
    prev = s;
  }
  if (here.clearance < -2) return;
  const c = behindLimb(cam, at) ? face : sky;
  const lit = here.sun;
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
export function drawDot(face: Ctx, sky: Ctx, cam: Camera, p: Vec3, sun: Vec3, alpha: number, r: number) {
  const s = see(cam, p, sun);
  if (s.z <= 0 || s.clearance < 0) return;
  const a = (0.16 + 0.42 * s.sun) * smoothstep(0, 45, s.clearance) * alpha;
  if (a <= 0.01) return;
  const c = behindLimb(cam, p) ? face : sky;
  c.fillStyle = `rgba(232,226,211,${a})`;
  c.beginPath();
  c.arc(s.x, s.y, r, 0, Math.PI * 2);
  c.fill();
}
