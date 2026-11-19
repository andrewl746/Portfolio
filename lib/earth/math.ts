// Small vector and easing helpers for the live Earth (lib/earth). Vectors are
// Earth-fixed, in km: x through 0°N 0°E, z through the north pole.
import { EARTH_RADIUS, type Vec3 } from "@/lib/earth-scene";

export type { Vec3 };
export const RE = EARTH_RADIUS;
export const DEG = Math.PI / 180;

export const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export const len = (a: Vec3) => Math.hypot(a[0], a[1], a[2]);
export const unit = (a: Vec3): Vec3 => {
  const n = len(a) || 1;
  return [a[0] / n, a[1] / n, a[2] / n];
};
/** a + b × k */
export const add = (a: Vec3, b: Vec3, k = 1): Vec3 => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
export const scale = (a: Vec3, k: number): Vec3 => [a[0] * k, a[1] * k, a[2] * k];

export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** The point at a latitude and longitude (degrees), r from the Earth's centre. */
export const ecef = (latDeg: number, lonDeg: number, r = 1): Vec3 => {
  const la = latDeg * DEG;
  const lo = lonDeg * DEG;
  return [r * Math.cos(la) * Math.cos(lo), r * Math.cos(la) * Math.sin(lo), r * Math.sin(la)];
};

/** Great-circle blend of two directions of any length; the lengths blend linearly. */
export const slerp = (a: Vec3, b: Vec3, t: number): Vec3 => {
  const ua = unit(a);
  const ub = unit(b);
  const w = Math.acos(Math.min(1, Math.max(-1, dot(ua, ub))));
  const l = mix(len(a), len(b), t);
  if (w < 1e-6) return scale(unit(add(scale(ua, 1 - t), ub, t)), l);
  const s = Math.sin(w);
  return scale(add(scale(ua, Math.sin((1 - t) * w) / s), ub, Math.sin(t * w) / s), l);
};

/** The site's strong ease-out, cubic-bezier(0.23, 1, 0.32, 1). */
export const easeOut = (x: number) => {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  let lo = 0;
  let hi = 1;
  let t = x;
  for (let i = 0; i < 30; i++) {
    t = (lo + hi) / 2;
    if (((0.73 * t - 0.42) * t + 0.69) * t < x) lo = t;
    else hi = t;
  }
  return ((t - 3) * t + 3) * t;
};

export const easeInOut = (x: number) => {
  x = clamp01(x);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
