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
  // The Teapot asterism.
  sagittarius: {
    stars: [
      [40, 150, 3],
      [95, 130, 3.5],
      [85, 195, 4],
      [135, 75, 3.5],
      [185, 110, 3],
      [230, 85, 4],
      [250, 130, 3],
      [215, 170, 3.5],
    ],
    edges: [
      [0, 1], [0, 2], [1, 2], [1, 3], [3, 4], [4, 1],
      [4, 7], [7, 2], [4, 5], [5, 6], [6, 7],
    ],
  },
  // The Big Dipper: handle upper-left, bowl lower-right.
  ursaMajor: {
    stars: [
      [35, 75, 3],
      [105, 60, 3],
      [150, 95, 3],
      [195, 125, 3],
      [275, 150, 3.5],
      [250, 215, 3],
      [170, 190, 3],
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
  // The twins: two connected stick figures with arms.
  gemini: {
    stars: [
      [150, 40, 3.5],
      [215, 55, 3.5],
      [135, 95, 3],
      [210, 115, 3],
      [75, 120, 2.5],
      [150, 165, 3],
      [120, 225, 3],
      [270, 150, 2.5],
      [215, 180, 3],
      [245, 235, 3],
    ],
    edges: [
      [0, 2], [2, 4], [2, 5], [5, 6], [1, 3], [3, 7], [3, 8], [8, 9], [2, 3],
    ],
  },
};
