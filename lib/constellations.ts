export type ConstellationName =
  | "sagittarius"
  | "ursaMajor"
  | "cygnus"
  | "orion"
  | "gemini";

type ConstellationData = {
  stars: [number, number, number][];
  edges: [number, number][];
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
      [5, 8], [2, 6], [6, 7], [6, 8], [7, 8], [8, 9],
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
  // hanging star, and the lower body dropping to two leg lines.
  gemini: {
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
};
