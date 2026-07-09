import type { DirectionVector } from "./types";

interface DirectionSet {
  readonly up: DirectionVector;
  readonly down: DirectionVector;
  readonly left: DirectionVector;
  readonly right: DirectionVector;
  readonly none: DirectionVector;
}

export const DIRECTIONS: DirectionSet = Object.freeze({
  up: Object.freeze({ x: 0, y: -1, name: "up" }),
  down: Object.freeze({ x: 0, y: 1, name: "down" }),
  left: Object.freeze({ x: -1, y: 0, name: "left" }),
  right: Object.freeze({ x: 1, y: 0, name: "right" }),
  none: Object.freeze({ x: 0, y: 0, name: "none" })
});

export const ALL_DIRECTIONS: readonly DirectionVector[] = [
  DIRECTIONS.up,
  DIRECTIONS.down,
  DIRECTIONS.left,
  DIRECTIONS.right
];

export const GRID_SIZE = 15;
export const CANVAS_SIZE = 840;
export const CELL_SIZE = CANVAS_SIZE / GRID_SIZE;

export const BASE_PAC_SPEED = 5.8;
export const PAC_SPEED_PER_LEVEL = 0.13;
export const BASE_GHOST_SPEED = 0.95;
export const GHOST_SPEED_PER_LEVEL = 0.055;

export const STARTING_LIVES = 3;
export const PELLET_SCORE = 10;
export const PELLET_SCORE_PER_LEVEL = 2;
export const POWER_PELLET_DURATION = 6.5;
export const GHOST_EATEN_SCORE = 200;

export const SCATTER_DURATION = 7;
export const CHASE_DURATION = 20;

export const HOME_CORNERS: Readonly<Record<string, { x: number; y: number }>> = Object.freeze({
  blinky: Object.freeze({ x: 13, y: 1 }),
  pinky: Object.freeze({ x: 1, y: 1 }),
  inky: Object.freeze({ x: 13, y: 13 }),
  clyde: Object.freeze({ x: 1, y: 13 })
});

export const GHOST_SPAWNS: Readonly<Record<string, { x: number; y: number }>> = Object.freeze({
  blinky: Object.freeze({ x: 13, y: 13 }),
  pinky: Object.freeze({ x: 13, y: 1 }),
  inky: Object.freeze({ x: 1, y: 13 }),
  clyde: Object.freeze({ x: 7, y: 13 })
});

export const LEVEL_NAMES: readonly string[] = [
  "First Signal",
  "Narrow Cut",
  "Soft Static",
  "Long Turn",
  "White Heat",
  "Orbit Room",
  "Quiet Rush",
  "Gold Pressure",
  "Final Trace",
  "Encore Line"
];

export const COLORS = Object.freeze({
  gold: "#d4af37",
  ink: "#f7f3e8",
  muted: "rgba(247,243,232,.24)",
  black: "#050505",
  blinky: "#d4af37",
  pinky: "#e7c8d9",
  inky: "#9fd8d3",
  clyde: "#e3a05e",
  frightened: "#7f8ea3"
});
