// Cameras for the live Earth: where one is, which way it looks, and where a
// point in space lands on screen. The same projection draws the Earth
// (renderer.ts) and the satellites (satellites.ts), so they always line up.
import { EARTH_DESKTOP, EARTH_MOBILE, type EarthFrame } from "@/lib/earth-scene";
import { DEG, RE, add, cross, dot, ecef, len, mix, scale, slerp, smoothstep, unit, type Vec3 } from "./math";

/** Where a camera is (C, km), which way it looks, its roll, its focal length
 *  in px, and where on screen its optical axis lands (cx, cy). */
export type Camera = {
  C: Vec3;
  fwd: Vec3;
  roll: number;
  f: number;
  cx: number;
  cy: number;
  right: Vec3;
  up: Vec3;
};

/** A camera placed by where the top of the Earth's limb should sit on screen
 *  (apex), which is how the page thinks about it. */
export type Pose = { C: Vec3; fwd: Vec3; roll: number; f: number; apex: [number, number] };

export function camera(C: Vec3, fwd: Vec3, roll = 0, f = 1000, cx = 0, cy = 0): Camera {
  fwd = unit(fwd);
  const up0 = unit(C);
  const r0 = unit(cross(fwd, up0));
  const u0 = cross(r0, fwd);
  const c = Math.cos(roll);
  const s = Math.sin(roll);
  return {
    C,
    fwd,
    roll,
    f,
    cx,
    cy,
    right: [r0[0] * c + u0[0] * s, r0[1] * c + u0[1] * s, r0[2] * c + u0[2] * s],
    up: [-r0[0] * s + u0[0] * c, -r0[1] * s + u0[1] * c, -r0[2] * s + u0[2] * c],
  };
}

/** A camera above a latitude and longitude. Heading is degrees clockwise from
 *  north, pitch is degrees below horizontal. */
export function aim(latDeg: number, lonDeg: number, altKm: number, headingDeg: number, pitchDeg: number) {
  const C = ecef(latDeg, lonDeg, RE + altKm);
  const up0 = unit(C);
  const east = unit(cross([0, 0, 1], up0));
  const north = cross(up0, east);
  const hd = headingDeg * DEG;
  const pt = pitchDeg * DEG;
  const horiz = add(scale(north, Math.cos(hd)), east, Math.sin(hd));
  return { C, fwd: unit(add(scale(horiz, Math.cos(pt)), up0, -Math.sin(pt))) };
}

/** How far above the optical axis the horizon sits, as an angle. */
const limbAngle = (C: Vec3, fwd: Vec3) =>
  Math.asin(Math.max(-1, Math.min(1, -dot(unit(fwd), unit(C))))) - Math.acos(RE / len(C));

/** The optical centre that puts the top of the limb at (ax, ay) on screen. */
export function centreFor(C: Vec3, fwd: Vec3, roll: number, f: number, ax: number, ay: number): [number, number] {
  const t = Math.tan(limbAngle(C, fwd)) * f;
  return [ax - t * Math.sin(roll), ay + t * Math.cos(roll)];
}

/** Where the top of the limb lands for a camera. */
export function limbApex(cam: Camera): [number, number] {
  const t = Math.tan(limbAngle(cam.C, cam.fwd)) * cam.f;
  return [cam.cx + t * Math.sin(cam.roll), cam.cy - t * Math.cos(cam.roll)];
}

/** The air above the limb glows up to about this height, km: the haze has
 *  thinned out a little above the green airglow layer (renderer.ts). */
const AIR_TOP = 140;

/** How tall that glow is on screen for a pose, px. It grows with the Earth:
 *  about 32 px on a laptop's finale, 7 on a phone's. */
export const glowHeight = (pose: { C: Vec3; f: number }) =>
  (AIR_TOP * pose.f) / Math.sqrt(dot(pose.C, pose.C) - RE * RE);

/** The Contact finale's render for a window: the wide one on landscape
 *  screens, the tall one on portrait ones (as the image's CSS picks them). */
export const finaleFrame = (W: number, H: number): EarthFrame => (W > H ? EARTH_DESKTOP : EARTH_MOBILE);

/** The finale's camera for a window: its frame is as wide as the screen and
 *  stands on the bottom edge. */
export function finalePose(W: number, H: number): Pose {
  const fr = finaleFrame(W, H);
  const k = W / fr.width;
  const cam = camera(
    fr.camera.position,
    fr.camera.forward,
    0,
    fr.camera.focal * k,
    fr.camera.cx * k,
    H - fr.height * k + fr.camera.cy * k,
  );
  return { C: cam.C, fwd: cam.fwd, roll: 0, f: cam.f, apex: limbApex(cam) };
}

/** Partway from one pose to another. */
export function blend(a: Pose, b: Pose, t: number): Pose {
  return {
    C: slerp(a.C, b.C, t),
    fwd: unit(slerp(a.fwd, b.fwd, t)),
    roll: mix(a.roll, b.roll, t),
    f: mix(a.f, b.f, t),
    apex: [mix(a.apex[0], b.apex[0], t), mix(a.apex[1], b.apex[1], t)],
  };
}

export type Seen = {
  x: number;
  y: number;
  /** Distance along the camera's axis; zero or less is behind the camera. */
  z: number;
  /** Lowest height (km) the line of sight passes over the Earth on its way to
   *  the point. Negative: the Earth is in the way. Under about 50: through air. */
  clearance: number;
  /** 0 in Earth's shadow, 1 in sunlight. */
  sun: number;
  distance: number;
};

/** Project a point (km) for a camera. */
export function see(cam: Camera, p: Vec3, sun?: Vec3): Seen {
  const v: Vec3 = [p[0] - cam.C[0], p[1] - cam.C[1], p[2] - cam.C[2]];
  const distance = len(v);
  const z = dot(v, cam.fwd);
  const d: Vec3 = [v[0] / distance, v[1] / distance, v[2] / distance];
  const t = Math.min(distance, Math.max(0, -dot(cam.C, d)));
  const clearance = Math.hypot(cam.C[0] + d[0] * t, cam.C[1] + d[1] * t, cam.C[2] + d[2] * t) - RE;
  let lit = 1;
  if (sun) {
    // Cylindrical shadow with a soft 80 km edge for the penumbra.
    const along = dot(p, sun);
    const perp = Math.hypot(p[0] - along * sun[0], p[1] - along * sun[1], p[2] - along * sun[2]);
    lit = along > 0 ? 1 : smoothstep(RE - 40, RE + 40, perp);
  }
  return {
    x: cam.cx + (cam.f * dot(v, cam.right)) / z,
    y: cam.cy - (cam.f * dot(v, cam.up)) / z,
    z,
    clearance,
    sun: lit,
    distance,
  };
}

/** Is the Earth behind this point, as seen from the camera? */
export function behindLimb(cam: Camera, p: Vec3) {
  const v: Vec3 = [p[0] - cam.C[0], p[1] - cam.C[1], p[2] - cam.C[2]];
  const b = dot(cam.C, v) / len(v);
  return b < 0 && b * b - (dot(cam.C, cam.C) - RE * RE) > 0;
}

/** Is the Earth or the glow of its air behind this point? The Earth is drawn
 *  over the sky's canvas, glow included, so anything in front of either has
 *  to go on the canvas above it or the glow hides it. `reach` asks the same
 *  of anything within that many px of the point on screen (a halo round it). */
export function overEarth(cam: Camera, p: Vec3, reach = 0) {
  const v: Vec3 = [p[0] - cam.C[0], p[1] - cam.C[1], p[2] - cam.C[2]];
  const b = dot(cam.C, v) / len(v);
  const far = dot(cam.C, cam.C);
  const r = RE + AIR_TOP + (reach * Math.sqrt(far - RE * RE)) / cam.f;
  return b < 0 && b * b - (far - r * r) > 0;
}

/** How far below its top the limb has dropped, dx px to the side of it, for a
 *  level camera. */
export function limbDrop(pose: { C: Vec3; fwd: Vec3; f: number }, dx: number) {
  const cam = camera(pose.C, pose.fwd, 0, pose.f, 0, 0);
  const down = scale(unit(pose.C), -1);
  const rho = Math.asin(RE / len(pose.C));
  const ahead = unit(add(cam.fwd, down, -dot(cam.fwd, down)));
  const at = (a: number): [number, number] | null => {
    const d = add(
      add(scale(down, Math.cos(rho)), ahead, Math.sin(rho) * Math.cos(a)),
      cam.right,
      Math.sin(rho) * Math.sin(a),
    );
    const z = dot(d, cam.fwd);
    return z > 1e-3 ? [(pose.f * dot(d, cam.right)) / z, (-pose.f * dot(d, cam.up)) / z] : null;
  };
  let lo = 0;
  let hi = Math.PI / 2;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    const pt = at(mid);
    if (!pt || pt[0] > dx) hi = mid;
    else lo = mid;
  }
  const side = at(lo);
  const top = at(0);
  return side && top ? side[1] - top[1] : 0;
}
