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
import {
  angularSpeed,
  shadowExit,
  drawDot,
  drawHero,
  drawTrack,
  flashPoint,
  inView,
  orbitPoint,
  passStart,
  ring,
  type Ring,
} from "./satellites";
import { camera, centreFor, finaleFrame, finalePose, type Pose } from "./view";

/** Seconds of orbit per second on screen. */
const TIME_SCALE = 66;
/** How near the flash point counts as at it, in radians of orbit (2 degrees:
 *  half a second of a satellite's travel, and a few px on screen). */
const GLINT_NEAR = 0.035;
/** One flash a pass: a satellite that has just flashed sits out this long, in
 *  seconds on screen, so a flash point that moves ahead of it while the page
 *  scrolls can't set it off twice. */
const GLINT_REST = 3;
/** Three more shells that fade in while reading: OneWeb's near-polar one, a
 *  sun-synchronous one, and Starlink's 70° one. */
const SHELLS: Ring[] = [ring(1200, 87.9, -58), ring(560, 97.6, -104), ring(570, 70, -132)];
/** With reduced motion nothing moves by itself: the scene holds this moment. */
const STILL_TIME = 7;
const TURN = Math.PI * 2;
/** An angle brought into -pi to pi. */
const wrap = (a: number) => ((((a + Math.PI) % TURN) + TURN) % TURN) - Math.PI;
/** The ember satellites go round this many times faster than the rest, at one
 *  steady speed, so the flash comes a few seconds after one appears. */
const EMBER_PACE = 3;
const EMBERS = 1;
/** The sky is never empty for longer than this, in seconds: a lap takes about
 *  29 s on screen, so once an ember satellite is out of view it skips the
 *  rest of the far side and comes back into view this long after it left. */
const NEXT_AFTER = 5;
/** The longest the opening waits for the maps and the typeface, ms, and how
 *  long the Earth takes to fade in before the clock starts (as in the styles). */
const HOLD_MOST = 4000;
const EARTH_IN = 450;
/** How long after the satellites first show the leading ember one comes into
 *  view, in seconds: as the name and the text settle. */
const RISE_AFTER = 1.1;

/** One frame's facts about the window and the scroll. */
export type Moment = {
  /** Window width, and its height at its tallest (a phone's toolbars away). */
  W: number;
  H: number;
  y: number;
  max: number;
  /** Scroll progress through the whole page, 0 to 1. */
  p: number;
  /** Seconds since the opening started; 0 while it is held back to load. */
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
  /** The bottom edge of the bar: the ember satellites flash clear of it. */
  top: number;
};

/** `u0` is where a satellite is on its orbit when the scene starts (for the
 *  ember ones, measured from `lead`). `held` keeps one hidden: see `lead`. */
type Sat = { orbit: Ring; u0: number; hero: boolean; glintAt: number; past: number; held: boolean };

export type Stage = {
  /** Ask for a fresh frame after something outside the scroll changed (a re-measure, say). */
  redraw(): void;
  destroy(): void;
};

export function createStage({
  earth: earthCanvas,
  renderer: earth,
  face: faceCanvas,
  plate,
  reduced,
  pose,
  place,
  needPlate,
  onLoad,
  onBegin,
}: {
  /** The WebGL canvas the Earth is drawn on, and what draws it. */
  earth: HTMLCanvasElement;
  renderer: EarthRenderer;
  /** The satellites and their orbit lines, above the page and the Earth. */
  face: HTMLCanvasElement;
  /** The finale image. */
  plate: HTMLElement;
  reduced: boolean;
  pose: (m: Moment) => Shot;
  place: (m: Moment, shot: Shot) => void;
  /** Called once, when the finale image is going to be needed. */
  needPlate: () => void;
  /** Called as what the opening needs arrives, with how much of it is here,
   *  0 to 1, and what is still to come, in a few words ("" when nothing is). */
  onLoad: (part: number, what: string) => void;
  /** Called once, when everything the opening needs has loaded and it starts. */
  onBegin: () => void;
}): Stage | null {
  const faceContext = faceCanvas.getContext("2d");
  if (!faceContext) return null;
  const face: CanvasRenderingContext2D = faceContext;
  const still = reduced;
  // The scene's clock stays at zero until the opening can play without a
  // hitch: see `begin`.
  let start = 0;
  let began = false;
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
  // Where the pass that leads to the flash comes into view, and the view it
  // was worked out for.
  let startAt = 0;
  let startKey = "";
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
  // Where the leading ember satellite is on the orbit when the scene starts.
  // Set once, when the satellites first show: the page opens on one of them
  // coming into view (up over the limb, or in from the window's edge) on the
  // pass that leads to the flash, not on one already partway across the sky.
  let lead: number | null = null;
  // The scroll position that was timed for, and until when it can be timed
  // again: a page opened on a section jumps there a moment after it starts.
  let openedAt = 0;
  let openUntil = 0;
  const build = () => {
    const fr = finaleFrame(W, H);
    fleet = [];
    for (let i = 0; i < EMBERS; i++) {
      fleet.push({ orbit: fr.orbit, u0: (i * TURN) / EMBERS, hero: true, glintAt: -99, past: Math.PI, held: false });
    }
    fr.traffic.forEach((o, k) => {
      for (let i = 0; i < 4; i++) {
        fleet.push({ orbit: o, u0: o.start + (i * Math.PI) / 2 + k, hero: false, glintAt: -99, past: Math.PI, held: false });
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
    for (const c of [earthCanvas, faceCanvas]) {
      c.style.width = W + "px";
      c.style.height = H + "px";
    }
    dpr = Math.min(2, window.devicePixelRatio || 1);
    earth.resize(dpr * quality);
    faceCanvas.width = Math.round(W * dpr);
    faceCanvas.height = Math.round(H * dpr);
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
    const time = !began ? 0 : still ? STILL_TIME : Math.max(0, (now - start) / 1000);
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

    // Where the ember satellites flash depends on the camera and the Sun, so
    // it is worked out again only when one of those has changed. A phone's toolbars cover the bottom of the
    // canvas while they show, so the window ends where they begin.
    const sight = { W, H: Math.min(H, window.innerHeight), top: shot.top };
    const sightKey = `${key}|${y}|${W}|${sight.H}`;
    if (!still && sightKey !== flashKey) {
      flashKey = sightKey;
      flashAt = flashPoint(cam, track, shot.sun, sight);
    }

    // Satellites.
    face.setTransform(dpr, 0, 0, dpr, 0, 0);
    face.clearRect(0, 0, W, H);
    const a = smoothstep(0.3, 1.6, time);
    if (a > 0.01) {
      // The ember orbit: as clear over the Earth as over the sky, and a little
      // heavier on a phone, where a hairline all but disappears.
      drawTrack(face, cam, track, a, 240, { width: W < 768 ? 1.5 : 1.1, onEarth: 0.4 });
      if (lead !== null && Math.abs(y - openedAt) > 4) {
        // The page has moved since the opening was timed. Before the leading
        // satellite has come up, time it again for where the page is now;
        // after that, just stop holding the others back, or a new view could
        // sit empty until they come round.
        if (time < openUntil) lead = null;
        else if (Math.abs(y - openedAt) > H / 3) for (const sat of fleet) sat.held = false;
      }
      let first = lead;
      if (first === null) {
        openedAt = y;
        openUntil = time + RISE_AFTER;
        const speed = angularSpeed(track) * TIME_SCALE * EMBER_PACE;
        // Held still (reduced motion), or with nowhere to flash, the
        // satellites stand where the finale's render has them.
        first = finaleFrame(W, H).orbit.start;
        if (!still && flashAt !== null) {
          first = passStart(cam, track, flashAt, sight) - speed * (time + RISE_AFTER);
          // Any other that would start out in view waits until it has left
          // it, so none of them just appears in the middle of the sky.
          for (const sat of fleet) sat.held = sat.hero && inView(cam, track, first + sat.u0 + speed * time, sight);
        }
        lead = first;
      }
      const edge = still ? null : shadowExit(track, shot.sun);
      for (const sat of fleet) {
        const pace = angularSpeed(sat.orbit) * TIME_SCALE * time;
        let u = sat.hero ? first + sat.u0 + pace * EMBER_PACE : sat.u0 + pace;
        if (sat.hero && !still && flashAt !== null && !inView(cam, sat.orbit, u, sight)) {
          if (startKey !== flashKey) {
            startKey = flashKey;
            startAt = passStart(cam, track, flashAt, sight);
          }
          const ahead = (((startAt - u) % TURN) + TURN) % TURN;
          const most = angularSpeed(track) * TIME_SCALE * EMBER_PACE * NEXT_AFTER;
          if (ahead > most) {
            sat.u0 += ahead - most;
            u += ahead - most;
          }
        }
        const at = orbitPoint(sat.orbit, u);
        if (!sat.hero) {
          drawDot(face, cam, at, shot.sun, a, 0.9);
          continue;
        }
        if (sat.held) {
          if (inView(cam, sat.orbit, u, sight)) continue;
          sat.held = false;
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
        // The flash stands for coming out of the shadow. Where it has been
        // moved off the shadow's real edge, the satellite stays dim up to the
        // flash and bright after it, so it doesn't brighten a second time.
        let lit: number | undefined;
        if (flashAt !== null && edge !== null) {
          const gap = wrap(edge - flashAt);
          const here = wrap(u - flashAt);
          // (0.05 past the edge either way, to clear its soft half-light.)
          if (gap > 0 && here >= 0 && here <= gap + 0.05) lit = 1;
          else if (gap < 0 && here < 0 && here >= gap - 0.05) lit = 0;
        }
        drawHero(face, cam, sat.orbit, u, shot.sun, { alpha: a, glint, lit });
      }
    }
    const sh = shot.shells * a;
    if (sh > 0.01) {
      SHELLS.forEach((o, k) => {
        drawTrack(face, cam, o, sh * 0.62, 200);
        for (let i = 0; i < 5; i++) {
          const u = k * 1.7 + (i * Math.PI * 2) / 5 + angularSpeed(o) * TIME_SCALE * time;
          drawDot(face, cam, orbitPoint(o, u), shot.sun, sh, 1.05);
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
      if (waiting) begin();
      refresh();
    }
  };

  // --- Starting -------------------------------------------------------------------------
  // The opening is held back, with only the stars showing, until what it
  // needs is here: the Earth's maps (each one stalls a frame as it goes up
  // to the graphics chip), the typeface the name is set in, and a couple of
  // frames drawn with them. Played while those were still arriving, the
  // name's rise stuttered and the Earth changed under it. A slow connection
  // isn't kept waiting for ever: after HOLD_MOST it starts with what it has.
  // In a background tab it waits to be looked at.
  let fontsIn = !document.fonts;
  let warming = false;
  let waiting = false;
  const plateIn = () => {
    const imgs = [...plate.querySelectorAll("img")];
    return imgs.length ? imgs.filter((img) => img.complete).length / imgs.length : 0;
  };
  function begin() {
    if (began || dead) return;
    if (document.hidden) {
      waiting = true;
      return;
    }
    waiting = false;
    began = true;
    // The Earth fades in first (styles), then the clock starts.
    start = performance.now() + (still ? 0 : EARTH_IN);
    onBegin();
    refresh();
  }
  function check() {
    if (began || warming || dead) return;
    const maps = earth.ok ? earth.loaded() : plateIn();
    onLoad((maps * 4 + (fontsIn ? 1 : 0)) / 5, (earth.ok ? earth.waitingFor() : maps < 1 ? "the Earth" : null) ?? (fontsIn ? "" : "the lettering"));
    if (!fontsIn || maps < 1) return;
    warming = true;
    refresh();
    requestAnimationFrame(() => requestAnimationFrame(begin));
  }
  const holdTimer = window.setTimeout(begin, HOLD_MOST);
  plate.addEventListener("load", check, true);
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
    check();
  };
  window.addEventListener("resize", onResize);
  window.addEventListener("scroll", refresh, { passive: true });
  document.addEventListener("visibilitychange", onVisible);
  watchDensity();
  document.fonts?.ready.then(() => {
    fontsIn = true;
    if (!dead) refresh();
    check();
  });
  frame(performance.now());
  check();

  return {
    redraw() {
      dirty = true;
      refresh();
    },
    destroy() {
      dead = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(holdTimer);
      plate.removeEventListener("load", check, true);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", refresh);
      document.removeEventListener("visibilitychange", onVisible);
      density?.removeEventListener("change", onDensity);
      earth.onchange = null;
      tall.remove();
      face.setTransform(1, 0, 0, 1, 0, 0);
      face.clearRect(0, 0, faceCanvas.width, faceCanvas.height);
    },
  };
}
