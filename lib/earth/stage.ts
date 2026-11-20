// Ties the live Earth to the scroll. The page gives it two functions:
//   pose(m)       where the camera is for this scroll position (and the Sun,
//                 how much of the finale image shows, how many satellites)
//   place(m, shot) whatever page elements move with it
// The stage sizes the canvases, redraws the Earth only when the camera has
// moved, keeps the satellites going every frame, and lays the Contact finale
// image over the live Earth's last frame.
import { SUN } from "@/lib/earth-scene";
import { clamp01, smoothstep, type Vec3 } from "./math";
import type { EarthRenderer } from "./renderer";
import { angularSpeed, drawDot, drawHero, drawTrack, flashPoint, orbitPoint, ring, type Cover, type Ring } from "./satellites";
import { camera, centreFor, finaleFrame, finalePose, type Pose } from "./view";

/** Seconds of orbit per second on screen. */
const TIME_SCALE = 66;
/** How near the flash point counts as at it, in radians of orbit (2 degrees:
 *  half a second of a satellite's travel, and a few px on screen). */
const GLINT_NEAR = 0.035;
/** One flash a pass: a satellite that has just flashed sits out this long, in
 *  seconds on screen, so a flash point that moves ahead of it while the page
 *  scrolls can't set it off twice. */
const GLINT_REST = 6;
/** Three more shells that fade in while reading: OneWeb's near-polar one, a
 *  sun-synchronous one, and Starlink's 70° one. */
const SHELLS: Ring[] = [ring(1200, 87.9, -58), ring(560, 97.6, -104), ring(570, 70, -132)];
/** With reduced motion nothing moves by itself: the scene holds this moment. */
const STILL_TIME = 7;
const TURN = Math.PI * 2;

/** One frame's facts about the window and the scroll. */
export type Moment = {
  /** Window width, and its height at its tallest (a phone's toolbars away). */
  W: number;
  H: number;
  y: number;
  max: number;
  /** Scroll progress through the whole page, 0 to 1. */
  p: number;
  /** Seconds since the scene started. */
  time: number;
  portrait: boolean;
  /** False when there is no WebGL2 and the finale image stands in for the live Earth. */
  gl: boolean;
};

export type Shot = Pose & {
  sun: Vec3;
  /** How much of the finale image shows over the live Earth, 0 to 1. */
  plate: number;
  /** How far the finale sits below the bottom edge, px (to leave the Contact text some sky). */
  plateShift: number;
  /** How strongly the extra shells show, 0 to 1. */
  shells: number;
  /** The bottom edge of the bar, and the page content that hides the sky
   *  behind it (screenshots, the tech tiles), where they are in the window.
   *  The ember satellites flash clear of both. */
  top: number;
  covers: Cover[];
};

type Sat = { orbit: Ring; u0: number; hero: boolean; glintAt: number; past: number };

export type Stage = {
  /** Ask for a fresh frame after something outside the scroll changed (a re-measure, say). */
  redraw(): void;
  destroy(): void;
};

export function createStage({
  earth: earthCanvas,
  renderer: earth,
  face: faceCanvas,
  sky: skyCanvas,
  plate,
  reduced,
  pose,
  place,
  needPlate,
}: {
  /** The WebGL canvas the Earth is drawn on, and what draws it. */
  earth: HTMLCanvasElement;
  renderer: EarthRenderer;
  /** Satellites crossing the face of the Earth, above it. */
  face: HTMLCanvasElement;
  /** Satellites over the sky, under the page's content. */
  sky: HTMLCanvasElement;
  /** The finale image. */
  plate: HTMLElement;
  reduced: boolean;
  pose: (m: Moment) => Shot;
  place: (m: Moment, shot: Shot) => void;
  /** Called once, when the finale image is going to be needed. */
  needPlate: () => void;
}): Stage | null {
  const faceContext = faceCanvas.getContext("2d");
  const skyContext = skyCanvas.getContext("2d");
  if (!faceContext || !skyContext) return null;
  const face: CanvasRenderingContext2D = faceContext;
  const sky: CanvasRenderingContext2D = skyContext;
  const still = reduced;
  const start = performance.now();
  let W = 0;
  let H = 0;
  let dpr = 1;
  let dirty = true;
  let lastKey = "";
  let raf = 0;
  let dead = false;
  let plateAsked = false;
  let plateTransform = "";
  let plateOpacity = "";
  let flashAt: number | null = null; // where on their orbit the ember satellites flash, as the page stands
  let flashKey = "";

  // On a phone the browser's toolbars come and go and the visible height
  // changes with them. Everything is laid out for the tallest view (toolbars
  // away), so the Earth isn't moved or rebuilt each time they slide.
  const tall = document.createElement("div");
  tall.style.cssText =
    "position:fixed;top:0;left:0;width:0;height:100vh;height:100lvh;visibility:hidden;pointer-events:none";
  document.body.appendChild(tall);

  // Satellites live in the world, so they're the same ones wherever the
  // camera is: six on the finale's orbit (one is always crossing), and the
  // finale's background traffic.
  let fleet: Sat[] = [];
  let track: Ring = SHELLS[0];
  const build = () => {
    const fr = finaleFrame(W, H);
    fleet = [];
    for (let i = 0; i < 6; i++) {
      fleet.push({ orbit: fr.orbit, u0: fr.orbit.start + (i * Math.PI) / 3, hero: true, glintAt: -99, past: Math.PI });
    }
    fr.traffic.forEach((o, k) => {
      for (let i = 0; i < 4; i++) {
        fleet.push({ orbit: o, u0: o.start + (i * Math.PI) / 2 + k, hero: false, glintAt: -99, past: Math.PI });
      }
    });
    track = fr.orbit;
  };

  // The Earth is drawn at up to two device px per CSS px. If a device can't
  // keep up while it scrolls (see below), it's drawn smaller and scaled up.
  let quality = 1;
  let renderMs = 0;
  let renderFrames = 0;
  let idleMs = 0;
  let idleFrames = 0;
  let lastFrameAt = 0;
  let lastFrameDrew = false;

  function size() {
    W = window.innerWidth;
    H = Math.max(window.innerHeight, tall.offsetHeight);
    for (const c of [earthCanvas, faceCanvas, skyCanvas]) {
      c.style.width = W + "px";
      c.style.height = H + "px";
    }
    dpr = Math.min(2, window.devicePixelRatio || 1);
    earth.resize(dpr * quality);
    for (const c of [faceCanvas, skyCanvas]) {
      c.width = Math.round(W * dpr);
      c.height = Math.round(H * dpr);
    }
    build();
    dirty = true;
  }

  // Scrolling redraws the whole Earth every frame, which costs a slow
  // graphics chip more than the satellites alone do. Frames are timed both
  // ways; if the scrolling ones run well behind the others, the Earth drops a
  // step in sharpness, once or twice at most, and stays there. Comparing the
  // two keeps a browser that caps everything at 30 frames a second (a phone
  // saving power) from being mistaken for a slow one.
  function pace(now: number, drew: boolean, time: number) {
    const dt = now - lastFrameAt;
    const steady = lastFrameAt > 0 && dt > 4 && dt < 120 && time > 3;
    if (steady && drew && lastFrameDrew) {
      renderMs += (dt - renderMs) * (renderFrames ? 0.1 : 1);
      renderFrames++;
    } else if (steady && !drew && !lastFrameDrew) {
      idleMs += (dt - idleMs) * (idleFrames ? 0.1 : 1);
      idleFrames++;
    }
    lastFrameAt = now;
    lastFrameDrew = drew;
    if (renderFrames >= 30 && idleFrames >= 30 && renderMs > 28 && renderMs > idleMs * 1.45 && quality > 0.6) {
      quality *= 0.75;
      renderFrames = 0;
      renderMs = 0;
      earth.resize(dpr * quality);
      dirty = true;
    }
  }

  function paint(now: number) {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const time = still ? STILL_TIME : (now - start) / 1000;
    const y = window.scrollY;
    const m: Moment = { W, H, y, max, p: clamp01(y / max), time, portrait: H > W, gl: earth.ok };
    const shot = pose(m);

    // The finale image is about 300 KB and only shows on the last screen (or
    // all the way down, when it stands in for the live Earth), so it's
    // fetched when it's going to be needed.
    if (!plateAsked && (!earth.ok || m.p > 0.5)) {
      plateAsked = true;
      needPlate();
    }
    let shift = shot.plateShift;
    if (!earth.ok) {
      // Without WebGL the finale image stands in for the live Earth. An image
      // can only sit level, and no higher than the finale has it, so the
      // camera follows the image and the satellites still line up with it.
      plate.classList.toggle("at-end", shot.plate > 0.5); // its Waterloo label belongs to the last screen only
      const fin = finalePose(W, H);
      const ay = Math.max(fin.apex[1], shot.apex[1]);
      Object.assign(shot, { C: fin.C, fwd: fin.fwd, roll: 0, f: fin.f, apex: [fin.apex[0], ay], sun: SUN, shells: 0, plate: 1 });
      shift = ay - fin.apex[1];
    }
    const transform = shift ? `translate3d(0, ${shift.toFixed(1)}px, 0)` : "";
    if (transform !== plateTransform) plate.style.transform = plateTransform = transform;
    const opacity = shot.plate.toFixed(3);
    if (opacity !== plateOpacity) plate.style.opacity = plateOpacity = opacity;

    const [cx, cy] = centreFor(shot.C, shot.fwd, shot.roll, shot.f, shot.apex[0], shot.apex[1]);
    const cam = camera(shot.C, shot.fwd, shot.roll, shot.f, cx, cy);
    const key = [shot.C, shot.fwd, shot.roll, shot.f, cx, cy, shot.sun].flat().map((v) => v.toFixed(4)).join();
    const drew = earth.ok && (dirty || key !== lastKey);
    if (drew) {
      earth.render(cam, shot.sun);
      lastKey = key;
      dirty = false;
    }
    if (!still) pace(now, drew, time);
    place(m, shot);

    // Where the ember satellites flash depends on the camera, the Sun and what
    // the page has in front of the sky, so it is worked out again only when
    // one of those has changed. A phone's toolbars cover the bottom of the
    // canvas while they show, so the window ends where they begin.
    const bottom = Math.min(H, window.innerHeight);
    const sightKey = `${key}|${y}|${W}|${bottom}`;
    if (!still && sightKey !== flashKey) {
      flashKey = sightKey;
      flashAt = flashPoint(cam, track, shot.sun, { W, H: bottom, top: shot.top, covers: shot.covers });
    }

    // Satellites.
    for (const c of [face, sky]) {
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, W, H);
    }
    const a = smoothstep(0.3, 1.6, time);
    if (a > 0.01) {
      drawTrack(face, sky, cam, track, a, 240);
      for (const sat of fleet) {
        const u = sat.u0 + angularSpeed(sat.orbit) * TIME_SCALE * time;
        const at = orbitPoint(sat.orbit, u);
        if (!sat.hero) {
          drawDot(face, sky, cam, at, shot.sun, a, 0.9);
          continue;
        }
        // A glint as it passes the flash point: a frame ago it was just short
        // of the point and now it is just past it. Either may have moved (the
        // point drifts as the page scrolls), but only by a little: the point
        // jumping across a satellite doesn't set one off, and nor does the
        // clock skipping ahead after the tab was in the background, so a
        // flash is always at the point.
        const past = flashAt === null ? Math.PI : (((u - flashAt) % TURN) + TURN) % TURN;
        if (sat.past > TURN - GLINT_NEAR && past < GLINT_NEAR && time - sat.glintAt > GLINT_REST) sat.glintAt = time;
        sat.past = past;
        const g = time - sat.glintAt;
        const glint = still || g < 0 ? 0 : g < 0.12 ? g / 0.12 : Math.exp(-(g - 0.12) / 0.6);
        drawHero(face, sky, cam, sat.orbit, u, shot.sun, { alpha: a, glint });
      }
    }
    const sh = shot.shells * a;
    if (sh > 0.01) {
      SHELLS.forEach((o, k) => {
        drawTrack(face, sky, cam, o, sh * 0.62, 200);
        for (let i = 0; i < 5; i++) {
          const u = k * 1.7 + (i * Math.PI * 2) / 5 + angularSpeed(o) * TIME_SCALE * time;
          drawDot(face, sky, cam, orbitPoint(o, u), shot.sun, sh, 1.05);
        }
      });
    }
  }

  // One frame. Whatever goes wrong while painting it, the next one is still
  // booked: a single bad frame must never freeze the Earth for good.
  let warned = false;
  function frame(now: number) {
    raf = 0;
    if (dead) return;
    try {
      paint(now);
    } catch (err) {
      if (!warned) {
        warned = true;
        console.error("A frame of the Earth failed to paint; carrying on.", err);
      }
    }
    if (!still && !document.hidden) raf = requestAnimationFrame(frame);
  }
  const kick = () => {
    if (!raf && !dead) raf = requestAnimationFrame(frame);
  };
  // With reduced motion a frame is painted only when something changes;
  // otherwise the running loop picks changes up.
  const refresh = () => (still ? frame(performance.now()) : kick());

  const onResize = () => {
    size();
    refresh();
  };
  const onVisible = () => {
    if (!document.hidden) {
      lastFrameAt = 0;
      refresh();
    }
  };
  // A move to a screen with another pixel density needs sharper (or lighter)
  // canvases even though the window is the same size.
  let density: MediaQueryList | null = null;
  const onDensity = () => {
    watchDensity();
    onResize();
  };
  const watchDensity = () => {
    density?.removeEventListener("change", onDensity);
    density = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    density.addEventListener("change", onDensity);
  };

  size();
  earth.onchange = () => {
    dirty = true;
    refresh();
  };
  window.addEventListener("resize", onResize);
  window.addEventListener("scroll", refresh, { passive: true });
  document.addEventListener("visibilitychange", onVisible);
  watchDensity();
  document.fonts?.ready.then(() => {
    if (!dead) refresh();
  });
  frame(performance.now());

  return {
    redraw() {
      dirty = true;
      refresh();
    },
    destroy() {
      dead = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", refresh);
      document.removeEventListener("visibilitychange", onVisible);
      density?.removeEventListener("change", onDensity);
      earth.onchange = null;
      tall.remove();
      for (const c of [face, sky]) {
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.clearRect(0, 0, c.canvas.width, c.canvas.height);
      }
    },
  };
}
