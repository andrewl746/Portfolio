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
  // The flying swan: an X of bent arms crossing at Sadr.
  cygnus: {
    stars: [
      [150, 130, 3.5],
      [195, 85, 3],
      [225, 35, 3],
      [95, 75, 3],
      [95, 180, 3],
      [45, 225, 3],
      [200, 180, 3],
      [250, 225, 3],
    ],
    edges: [[0, 1], [1, 2], [0, 3], [0, 4], [4, 5], [0, 6], [6, 7]],
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
  // The twins, upright: head, shoulder, outstretched arm, torso to hip,
  // and two legs each, joined at the shoulders.
  gemini: {
    stars: [
      [115, 35, 3.5],
      [120, 80, 3],
      [60, 100, 2.5],
      [125, 140, 3],
      [95, 215, 3],
      [145, 220, 3],
      [200, 45, 3.5],
      [195, 90, 3],
      [260, 115, 2.5],
      [205, 150, 3],
      [180, 225, 3],
      [235, 230, 3],
    ],
    edges: [
      [0, 1], [1, 2], [1, 3], [3, 4], [3, 5],
      [6, 7], [7, 8], [7, 9], [9, 10], [9, 11],
      [1, 7],
    ],
  },
};
