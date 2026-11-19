export type ConstellationName =
  | "sagittarius"
  | "ursaMajor"
  | "cygnus"
  | "orion"
  | "gemini"
  | "coronaBorealis"
  | "bootes";

type ConstellationData = {
  /** x, y and radius of each star, as traced from its reference (north up). */
  stars: [number, number, number][];
  edges: [number, number][];
  /** How far it's turned clockwise from the reference when drawn, in
   *  degrees. Most read best the way the sky shows them. */
  turn?: number;
};

export const CONSTELLATIONS: Record<ConstellationName, ConstellationData> = {
  // Sagittarius, traced from the reference photo: arrow tip upper-right,
  // teapot bowl at left, spout and handle to the lower right.
  sagittarius: {
    stars: [
      [228, 20, 3.5],
      [178, 75, 4],
      [125, 95, 3.5],
      [97, 85, 3],
      [64, 105, 3.5],
      [78, 137, 3],
      [194, 140, 4],
      [236, 153, 3.5],
      [181, 202, 3.5],
      [194, 239, 3],
    ],
    edges: [
      [0, 1], [1, 2], [1, 6], [2, 3], [3, 4], [4, 5],
      [5, 2], [5, 8], [2, 6], [6, 7], [6, 8], [7, 8], [8, 9],
    ],
  },
  // The Big Dipper, proportions traced from the reference photo:
  // flat handle upper-left, wide shallow bowl lower-right.
  ursaMajor: {
    stars: [
      [30, 64, 3],
      [95, 60, 3],
      [131, 91, 3],
      [179, 116, 3],
      [280, 125, 3.5],
      [260, 175, 3],
      [182, 161, 3],
    ],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]],
  },
  // Cygnus, point-for-point from the reference photo (8 stars), rotated
  // slightly counterclockwise: Deneb at top with a bend star below it,
  // Sadr at the crossing, one upper-left wing tip, two-star arms to the
  // lower left and lower right.
  cygnus: {
    stars: [
      [186, 12, 3.5],
      [187, 66, 3],
      [134, 120, 3.5],
      [89, 77, 3],
      [100, 176, 3],
      [48, 220, 3],
      [186, 158, 3],
      [253, 200, 3],
    ],
    edges: [
      [0, 1], [1, 2], [2, 3], [2, 4], [4, 5], [2, 6], [6, 7],
    ],
  },
  // The bow-tie: two triangles meeting at the belt.
  orion: {
    stars: [
      [235, 40, 3.5],
      [255, 125, 3],
      [140, 115, 2.5],
      [152, 127, 2.5],
      [166, 138, 2.5],
      [45, 125, 3],
      [90, 215, 3.5],
    ],
    edges: [
      [0, 1], [1, 4], [0, 2], [2, 3], [3, 4], [2, 5], [5, 6], [6, 4],
    ],
  },
  // Gemini, point-for-point from the NOIRLab reference photo (16 stars,
  // same orientation): top hub with the head star upper-right and a short
  // branch upper-left, a five-star cluster on the left with three branch
  // tips, a long arm to the right ending in a three-star chain plus a
  // hanging star, and the lower body dropping to two leg lines. Turned so the
  // twins stand upright, side by side.
  gemini: {
    turn: 15,
    stars: [
      [208, 32, 3.5],
      [108, 7, 3],
      [150, 49, 3],
      [184, 130, 3],
      [78, 53, 3],
      [64, 30, 2.5],
      [103, 56, 2.5],
      [45, 69, 2.5],
      [87, 122, 3.5],
      [222, 176, 3],
      [255, 184, 2.5],
      [271, 188, 2.5],
      [197, 195, 3],
      [62, 179, 3],
      [161, 225, 3],
      [125, 253, 3],
    ],
    edges: [
      [0, 2], [1, 2], [2, 6], [6, 4], [4, 5], [4, 7], [4, 8],
      [2, 3], [3, 9], [9, 10], [10, 11], [3, 12],
      [8, 13], [13, 15], [8, 14],
    ],
  },
  // Corona Borealis, point-for-point from the NOIRLab reference image, then
  // turned 6° clockwise: an open crown running from Iota at the upper left,
  // down through the bowl, and up to Theta at the upper right. Alphecca, the
  // brightest, is the slightly larger star at the lower right of the bowl.
  // Turned a little further so the crown sits level, its two tips at one
  // height.
  coronaBorealis: {
    turn: 5,
    stars: [
      [64, 77, 3],
      [77, 156, 3],
      [123, 180, 3],
      [160, 177, 3],
      [208, 169, 3.5],
      [248, 109, 3],
      [224, 52, 3],
    ],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6]],
  },
  // Boötes, dot for dot from the NOIRLab reference chart (11 stars, same
  // orientation): the small triangle of the raised hand at the top, the kite
  // of the body below it, and Arcturus, the largest, at the foot of the kite
  // with a star out to either side.
  bootes: {
    stars: [
      [173, 14.8, 2.5],
      [159.1, 15, 2.5],
      [167.8, 48.4, 2.5],
      [116.8, 82.3, 3],
      [150.1, 97, 3],
      [95.8, 123.1, 3],
      [150.4, 144.4, 3],
      [132.7, 163.3, 3.5],
      [174.1, 214.6, 4],
      [204.2, 215.2, 3],
      [135.7, 245.2, 3],
    ],
    edges: [
      [0, 1], [0, 2], [1, 2], [2, 4], [4, 3], [3, 5], [5, 7], [7, 8],
      [4, 6], [6, 8], [8, 9], [8, 10],
    ],
  },
};

/**
 * How large every constellation is drawn, in the units of its own frame. The
 * measure is a figure's width averaged over every direction (the perimeter of
 * its outline, divided by pi), which is close to how large it looks: a long
 * thin figure and a round open one of the same average width read as the same
 * size, where giving them the same height or the same box does not. The page
 * maps this many units to --star-size (globals.css).
 */
export const LOOKS = 220;
// From the frame's edge to the centre of the outermost star.
const MARGIN = 12;

const round = (v: number) => Math.round(v * 100) / 100;

type Point = [number, number];

/** The outline around a set of points (their convex hull), in order. */
function outline(points: Point[]): Point[] {
  const pts = [...points].sort((p, q) => p[0] - q[0] || p[1] - q[1]);
  const turn = (o: Point, a: Point, b: Point) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = (list: Point[]) => {
    const out: Point[] = [];
    for (const p of list) {
      while (out.length >= 2 && turn(out[out.length - 2], out[out.length - 1], p) <= 0) out.pop();
      out.push(p);
    }
    out.pop();
    return out;
  };
  return [...half(pts), ...half(pts.reverse())];
}

export type Placed = {
  stars: [number, number, number][];
  edges: [number, number][];
  /** The frame the figure is drawn in (the SVG's viewBox), fitted round it. */
  width: number;
  height: number;
};

const done = new Map<ConstellationName, Placed>();

/**
 * A constellation as it's drawn: turned by its `turn`, scaled so it looks as
 * large as every other one (LOOKS), and set in a frame fitted round it. The
 * page hangs each frame by its top right corner (.section-constellation in
 * globals.css), so they all sit the same way against their section's title.
 * Star sizes aren't scaled.
 */
export function placed(name: ConstellationName): Placed {
  const before = done.get(name);
  if (before) return before;
  const { stars, edges, turn = 0 } = CONSTELLATIONS[name];
  const a = (turn * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  const turned = stars.map(([x, y, r]) => [x * cos - y * sin, x * sin + y * cos, r]);
  const rim = outline(turned.map(([x, y]) => [x, y]));
  let around = 0;
  for (let i = 0; i < rim.length; i++) {
    const p = rim[i];
    const q = rim[(i + 1) % rim.length];
    around += Math.hypot(q[0] - p[0], q[1] - p[1]);
  }
  const k = LOOKS / (around / Math.PI);
  const left = Math.min(...turned.map((s) => s[0]));
  const top = Math.min(...turned.map((s) => s[1]));
  const right = Math.max(...turned.map((s) => s[0]));
  const bottom = Math.max(...turned.map((s) => s[1]));
  const result: Placed = {
    // Rounded, so the server and every browser write the same numbers.
    stars: turned.map(([x, y, r]) => [round(MARGIN + (x - left) * k), round(MARGIN + (y - top) * k), r]),
    edges,
    width: round((right - left) * k + 2 * MARGIN),
    height: round((bottom - top) * k + 2 * MARGIN),
  };
  done.set(name, result);
  return result;
}
