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
  // The Big Dipper.
  ursaMajor: {
    stars: [
      [250, 55, 3],
      [210, 80, 3],
      [175, 100, 3],
      [145, 120, 3],
      [75, 110, 3.5],
      [85, 175, 3],
      [150, 180, 3],
    ],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]],
  },
  // The Northern Cross.
  cygnus: {
    stars: [
      [150, 40, 3.5],
      [150, 110, 3],
      [150, 215, 3],
      [70, 155, 3],
      [235, 70, 3],
    ],
    edges: [[0, 1], [1, 2], [1, 3], [1, 4]],
  },
  // Shoulders, belt, feet.
  orion: {
    stars: [
      [100, 60, 3.5],
      [200, 65, 3],
      [135, 130, 2.5],
      [153, 138, 2.5],
      [171, 146, 2.5],
      [110, 220, 3],
      [205, 215, 3.5],
    ],
    edges: [[0, 2], [1, 4], [2, 3], [3, 4], [2, 5], [4, 6]],
  },
  // The twins.
  gemini: {
    stars: [
      [110, 45, 3.5],
      [190, 55, 3.5],
      [105, 120, 3],
      [195, 130, 3],
      [95, 205, 3],
      [205, 210, 3],
    ],
    edges: [[0, 2], [2, 4], [1, 3], [3, 5], [2, 3]],
  },
};
