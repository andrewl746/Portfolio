// "Down the coast": what the page does with the live Earth.
//
// The camera starts off Newfoundland at dusk, looking down the lit coast with
// the name standing on the limb. Scrolling carries it out over the
// Atlantic and south through the night, always looking back at the coast, and
// lands it exactly on the Contact finale's view. The Earth is drawn over the
// page, so the name sets behind it and every section rises from behind it.
//
// The page marks the elements this needs with data-scene attributes
// (app/page.tsx and the section components).
import { clamp01, easeInOut, easeOut, ecef, mix, smoothstep, DEG } from "./math";
import { createEarthRenderer } from "./renderer";
import type { Cover } from "./satellites";
import { createStage, type Moment, type Shot } from "./stage";
import { aim, blend, finalePose, glowHeight, limbDrop, type Pose } from "./view";

// --- The name -------------------------------------------------------------------------
// Fraunces at its display size, measured in name sizes: from the top of the
// limb up to the bottom of the line above the name, and the baseline's
// distance below the top of the name's line box. If the heading typeface or
// the name ever changes, these need measuring again.
const CAPS = 0.7015;
const BASELINE = 0.7915;
/** The baseline rests this far below the top of the limb. None: the name
 *  stands on the Earth, so every letter is whole and only the glow of the air
 *  washes over their feet (sunk into it, the letters looked cut off at a
 *  phone's size). CAPS above counts this in. */
const SUNK = 0;
/** The least space kept between the name and each edge of the window, px. */
const NAME_MARGIN = 12;
/** Sky kept clear between the last line of Contact and the Earth's glow, px. */
const CONTACT_CLEAR = 14;

// --- The camera's night ---------------------------------------------------------------
// Only a strip of the Earth shows while reading, and a strip is the far
// horizon. So the camera keeps its distance: from off Newfoundland it swings
// out over the Atlantic and south to the Caribbean, about 3,000 km off the lit
// seaboard and looking at it, which keeps the cities on the horizon the whole
// way down the page. The last stretch brings it in over Florida.
const LOOK: [number, number] = [40, -79]; // the middle of the lights
/** Scroll progress, latitude, longitude, altitude in km. */
const ROUTE: [number, number, number, number][] = [
  [0, 50, -52, 2700],
  [0.3, 45, -36, 2700],
  [0.6, 33, -38, 2700],
  [0.85, 20, -55, 2600],
  [1.1, 24, -78, 2100],
];

function bearing(lat1: number, lon1: number, lat2: number, lon2: number) {
  const dl = (lon2 - lon1) * DEG;
  const y = Math.sin(dl) * Math.cos(lat2 * DEG);
  const x = Math.cos(lat1 * DEG) * Math.sin(lat2 * DEG) - Math.sin(lat1 * DEG) * Math.cos(lat2 * DEG) * Math.cos(dl);
  return (Math.atan2(y, x) / DEG + 360) % 360;
}

/** A smooth curve through the route (no stopping at each point). */
function along(p: number): [number, number, number] {
  let i = 0;
  while (i < ROUTE.length - 2 && p > ROUTE[i + 1][0]) i++;
  const a = ROUTE[i];
  const b = ROUTE[i + 1];
  const before = ROUTE[i - 1] || a;
  const after = ROUTE[i + 2] || b;
  const span = b[0] - a[0];
  const t = clamp01((p - a[0]) / span);
  const t2 = t * t;
  const t3 = t2 * t;
  const at = (k: 1 | 2 | 3) => {
    const m0 = ((b[k] - before[k]) / (b[0] - before[0])) * span;
    const m1 = ((after[k] - a[k]) / (after[0] - a[0])) * span;
    return (2 * t3 - 3 * t2 + 1) * a[k] + (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) * b[k] + (t3 - t2) * m1;
  };
  return [at(1), at(2), at(3)];
}

function cruise(p: number) {
  const [lat, lon, alt] = along(p);
  return aim(lat, lon, alt, bearing(lat, lon, LOOK[0], LOOK[1]), 42);
}

/** An element's top edge below an ancestor's, ignoring transforms (a section
 *  still sliding into view measures as where it will rest). */
function offsetWithin(el: HTMLElement, ancestor: HTMLElement) {
  let y = 0;
  let node: HTMLElement | null = el;
  while (node && node !== ancestor) {
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return node ? y : el.getBoundingClientRect().top - ancestor.getBoundingClientRect().top;
}

/**
 * Starts the scene inside `root` (the element around the whole page). Returns
 * a function that stops it and puts everything back.
 */
export function startCoast({
  root,
  earth,
  face,
  sky,
  plate,
  needPlate,
}: {
  root: HTMLElement;
  earth: HTMLCanvasElement;
  face: HTMLCanvasElement;
  sky: HTMLCanvasElement;
  plate: HTMLElement;
  needPlate: () => void;
}): () => void {
  const find = (name: string) => root.querySelector<HTMLElement>(`[data-scene="${name}"]`);
  const name = find("name");
  const pin = find("pin");
  const heroEl = find("hero");
  const topEl = find("hero-top");
  const bandEl = find("hero-band");
  const page = find("page");
  const end = find("end");
  const lastLine = find("contact-last");
  if (!name || !pin || !heroEl || !topEl || !bandEl || !page || !end) return () => {};
  const projects = [...root.querySelectorAll<HTMLElement>('[data-scene="project"]')];
  // What hides the sky behind it: the screenshots and the tech tiles.
  const coverEls = [...root.querySelectorAll<HTMLElement>('[data-scene="cover"]')];
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const renderer = createEarthRenderer(earth);
  // Without WebGL2 the finale image stands in for the live Earth, and the
  // first screen is laid out for it (globals.css).
  if (!renderer.ok) root.dataset.gl = "off";

  // --- The first screen ---------------------------------------------------------------
  // It has to hold the bar, the line above the name, the name, and under the
  // limb at the left edge the two sentences and the buttons, on dark ocean.
  // So the horizon's height and the name's size are worked out from what is
  // left once the text is measured, not fixed.
  let box: { top: number; band: number; gutter: number; bottom: number } | null = null;
  let lay: {
    W: number;
    H: number;
    size: number;
    gap: number;
    heroY: number;
    bandY: number | null;
  } | null = null;
  const measureHero = () => {
    box = {
      top: topEl.offsetHeight,
      band: bandEl.offsetHeight,
      gutter: bandEl.offsetLeft,
      bottom: heroEl.offsetHeight - bandEl.offsetTop - bandEl.offsetHeight,
    };
    lay = null;
  };
  function heroLayout(W: number, H: number, portrait: boolean, hero: Pose, gl: boolean) {
    if (lay && lay.W === W && lay.H === H) return lay;
    if (!box) measureHero();
    const b = box!;
    const wide = W >= 1100;
    const short = H < 720;
    const bar = W < 768 ? 56 : 64;
    const tiny = !wide && H < 520; // a phone held sideways: the name gives up some height to the text
    // As wide as the screen allows, and no taller than about a third of it.
    let size = Math.min(0.245 * W, (tiny ? 0.34 : 0.46) * H);
    // 0.245 is Fraunces's width for this name. If the face on screen sets it
    // wider (a fallback while Fraunces loads, or a browser that draws it
    // differently), the name is brought in until it fits the window.
    const widthPerPx = name!.getBoundingClientRect().width / (parseFloat(getComputedStyle(name!).fontSize) || 1);
    if (widthPerPx > 0) size = Math.min(size, (W - 2 * NAME_MARGIN) / widthPerPx);
    const gap = short ? 20 : 28; // between the line above the name and its capitals
    const above = bar + (short ? 12 : 22) + b.top + gap; // the line above the name clears the bar
    // On a wide screen the text under the limb stands on the Earth, clear of
    // the limb where it is lowest.
    const room = wide ? H - b.bottom - b.band - (short ? 12 : 18) - limbDrop(hero, W / 2 - b.gutter) : Infinity;
    if (above + CAPS * size > room) size = Math.min(size, Math.max(0.16 * W, (room - above) / CAPS));
    const least = above + CAPS * size;
    let heroY = Math.max(least, Math.min(H * (portrait ? 0.36 : 0.56), room));
    // Without WebGL the stand-in image can't sit higher than the finale has
    // it, so the horizon starts there and everything placed from it follows.
    if (!gl) heroY = Math.max(heroY, finalePose(W, H).apex[1]);
    // Narrow screens have no dark side for the sentences and buttons to stand
    // on, and the bottom edge is where a phone gets read last. So they stand a
    // little above the middle of the Earth that is on show, never less than a
    // hand's breadth under the limb.
    let bandY: number | null = null;
    if (!wide) {
      const heroH = heroEl!.offsetHeight;
      const free = heroH - heroY - b.band;
      bandY = Math.min(heroY + Math.min(220, Math.max(tiny ? 40 : 96, 0.45 * free)), heroH - (tiny ? 16 : 32) - b.band);
      if (!tiny) bandY = Math.max(bandY, heroY + 40); // on a very small screen it runs off the bottom sooner than up over the name
    }
    lay = { W, H, size, gap, heroY, bandY };
    return lay;
  }

  // --- The horizon while reading ------------------------------------------------------
  // One height from the first section to the last: high enough to show the
  // lit coast, low enough that a whole project still fits above it. Titles
  // and cards come up from behind it. On a short window it gives way a
  // little, so a project keeps some room.
  let tallest = 0;
  let contactBottom = 0; // where the Contact text ends, below the top of the last screen
  let covers: Cover[] = []; // in the page: left, top, right, bottom
  const measure = () => {
    covers = coverEls.map((el) => {
      const r = el.getBoundingClientRect();
      const top = offsetWithin(el, document.body);
      return [r.left, top, r.right, top + el.offsetHeight];
    });
    const beside = projects.length > 0 && getComputedStyle(projects[0]).display === "grid";
    tallest = beside ? Math.max(...projects.map((el) => el.offsetHeight)) : 0;
    contactBottom = lastLine ? offsetWithin(lastLine, end) + lastLine.offsetHeight : 0;
  };
  function floorAt(H: number, portrait: boolean) {
    if (portrait) return H * 0.87;
    return Math.min(H * 0.9, Math.max(H * 0.84, tallest ? 64 + tallest + 0.1 * H : 0));
  }

  // What pose() worked out that place() needs.
  let v = { pinLen: 1, heroY: 0, apexY: 0, size: 0, gap: 0, bandY: null as number | null };

  function pose(m: Moment): Shot {
    const { W, H, y, max, p, portrait } = m;
    const pinLen = Math.max(1, pin!.offsetHeight - H);
    const endStart = offsetWithin(end!, document.body) - H;
    // Off Newfoundland, looking south-west down the coast: ocean on the left,
    // the lit coast running to the limb.
    const hero: Pose = { ...aim(50, -52, 2700, 232, 42), roll: 0, f: (portrait ? 0.90202 : 0.80017) * W, apex: [W / 2, 0] };
    const { size, heroY, gap, bandY } = heroLayout(W, H, portrait, hero, m.gl);
    hero.apex = [W / 2, heroY];
    const fin = finalePose(W, H);
    // No WebGL: the image can't sit higher than the finale has it. That is
    // the finale's own height, as the first screen was laid out for, not the
    // lowered one below.
    if (!m.gl) hero.apex[1] = Math.max(hero.apex[1], fin.apex[1]);
    // The Contact text stands in the sky over the finale's Earth. On a short
    // window the Earth would rise past it, so there the whole finale sits
    // lower by the difference. The gap is kept to the top of the limb's
    // glow, which is taller the larger the Earth is drawn.
    const sink = Math.max(0, H - end!.offsetHeight + contactBottom + CONTACT_CLEAR + glowHeight(fin) - fin.apex[1]);
    fin.apex = [fin.apex[0], fin.apex[1] + sink];
    const way: Pose = { ...cruise(p), roll: 0, f: hero.f, apex: hero.apex };
    const cam = blend(blend(hero, way, smoothstep(0, 0.22, p)), fin, smoothstep(0.8, 1, p));
    // Horizon: where the hero has it, then one steady height for the whole
    // read, then up to the finale's.
    const floor = floorAt(H, portrait);
    const endT = clamp01((y - endStart) / Math.max(1, max - endStart));
    const apexY =
      y < pinLen
        ? mix(hero.apex[1], floor, easeInOut(clamp01((y - pinLen * 0.08) / (pinLen * 0.92))))
        : mix(floor, fin.apex[1], easeInOut(endT));
    v = { pinLen, heroY: hero.apex[1], apexY, size, gap, bandY };
    return {
      ...cam,
      apex: [W / 2, apexY],
      // The Sun moves from dusk to the finale's pre-dawn.
      sun: ecef(18, mix(143, 80, p)),
      plate: smoothstep(0.9, 1, endT),
      plateShift: sink,
      shells: smoothstep(0.12, 0.7, y / pinLen) * (1 - smoothstep(0.3, 0.75, endT)),
      top: W < 768 ? 56 : 64,
      covers: covers.filter((c) => c[3] > y && c[1] < y + H).map((c) => [c[0], c[1] - y, c[2], c[3] - y]),
    };
  }

  // Styles are written only when they change, and straight onto the element
  // that moves, so a scroll frame doesn't restyle the page.
  const wrote = new Map<string, string>();
  const write = (key: string, value: string, apply: (value: string) => void) => {
    if (wrote.get(key) === value) return;
    wrote.set(key, value);
    apply(value);
  };

  function place(m: Moment) {
    const { y, time } = m;
    const { pinLen, heroY, apexY, size, gap, bandY } = v;
    const t = clamp01(y / pinLen);
    write("size", size.toFixed(1) + "px", (px) => (name!.style.fontSize = px));
    // Resting place: baseline on the top of the limb. On load the
    // name rises into place; on scroll it sets behind the Earth.
    const rest = heroY + (SUNK - BASELINE) * size;
    const rise = (1 - easeOut(clamp01((time - 0.15) / 1.5))) * size * 0.55;
    const set = t * t * size * 1.05 + (apexY - heroY);
    write("name", (rest + rise + set).toFixed(1), (px) => (name!.style.transform = `translate3d(-50%, ${px}px, 0)`));
    write("gone", t >= 0.995 ? "hidden" : "", (value) => (name!.style.visibility = value));
    // The line above the name sits on its bottom edge, a little over the capitals.
    write("top", (heroY - CAPS * size - gap).toFixed(0) + "px", (px) => heroEl!.style.setProperty("--top-y", px));
    write("band", bandY === null ? "" : bandY.toFixed(0) + "px", (px) =>
      px ? heroEl!.style.setProperty("--band-y", px) : heroEl!.style.removeProperty("--band-y"),
    );
    // The text fades in as the name rises, and out as it sets.
    const fade = (1 - smoothstep(0.06, 0.36, t)) * smoothstep(0.5, 1.7, time);
    write("fade", fade.toFixed(3), (value) => heroEl!.style.setProperty("--hero-fade", value));
    // Faded out: not clickable, not in the tab order.
    write("out", fade < 0.02 ? "1" : "", (value) => heroEl!.classList.toggle("gone", value === "1"));
  }

  measure();
  measureHero();
  const stage = createStage({ earth, renderer, face, sky, plate, reduced, pose, place, needPlate });
  if (!stage) {
    renderer.dispose();
    delete root.dataset.gl;
    return () => {};
  }
  // From here the scene owns the first screen (it has just placed it), so the
  // styles that hide it until then stand down.
  root.dataset.scene = "on";

  const pageWatch = new ResizeObserver(() => {
    measure();
    stage.redraw();
  });
  pageWatch.observe(page);
  pageWatch.observe(end);
  const heroWatch = new ResizeObserver(() => {
    measureHero();
    stage.redraw();
  });
  heroWatch.observe(topEl);
  heroWatch.observe(bandEl);
  const onLoad = () => {
    measure();
    measureHero();
    stage.redraw();
  };
  window.addEventListener("resize", measureHero);
  window.addEventListener("load", onLoad);
  // The first screen is laid out from the text as it measures, so it's laid
  // out again once the web fonts are in.
  let stopped = false;
  document.fonts?.ready.then(() => {
    if (!stopped) onLoad();
  });

  return () => {
    stopped = true;
    pageWatch.disconnect();
    heroWatch.disconnect();
    window.removeEventListener("resize", measureHero);
    window.removeEventListener("load", onLoad);
    stage.destroy();
    renderer.dispose();
    delete root.dataset.scene;
    delete root.dataset.gl;
    name.style.fontSize = name.style.transform = name.style.visibility = "";
    for (const prop of ["--top-y", "--band-y", "--hero-fade"]) heroEl.style.removeProperty(prop);
    heroEl.classList.remove("gone");
    plate.style.transform = plate.style.opacity = "";
    plate.classList.remove("at-end");
  };
}
