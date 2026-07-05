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
  // Cygnus, traced from the reference photo: a tilted X (Sadr at center),
  // a short wing upper-left, a two-star wing upper-right, a two-star tail
  // lower-left, and the longer three-star wing lower-right.
  cygnus: {
    stars: [
      [195, 20, 3],
      [178, 75, 3],
      [120, 120, 3.5],
      [80, 90, 3],
      [95, 165, 3],
      [45, 205, 3],
      [155, 165, 3],
      [185, 210, 2.5],
      [205, 235, 3],
    ],
    edges: [
      [0, 1], [1, 2], [2, 3], [2, 4], [4, 5], [2, 6], [6, 7], [7, 8],
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
  // The twins, traced from the reference photo, kept upright: two figures
  // joined at the inner shoulders, each with a head, torso, and two legs
  // ending in feet. The left figure's outer arm is a single tip; the
  // right figure's outer arm has an extra bend star, matching the photo.
  gemini: {
    stars: [
      [70, 30, 3],
      [95, 75, 3],
      [30, 55, 2.5],
      [100, 140, 3],
      [65, 210, 3],
      [135, 205, 3],
      [230, 45, 3.5],
      [205, 90, 3],
      [255, 100, 2.5],
      [275, 60, 3],
      [200, 155, 3],
      [175, 225, 3],
      [235, 230, 3],
    ],
    edges: [
      [0, 1], [1, 2], [1, 3], [3, 4], [3, 5],
      [1, 7], [7, 6], [7, 8], [8, 9], [7, 10], [10, 11], [10, 12],
    ],
  },
};
