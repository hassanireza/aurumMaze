import type { DirectionVector, GhostId, GridPoint } from "./types";

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

/**
 * Tie-break order used by the 1980 arcade ghosts: up, left, down, right.
 * When two exits are equally close to the target, the first one listed wins.
 */
export const ALL_DIRECTIONS: readonly DirectionVector[] = [
  DIRECTIONS.up,
  DIRECTIONS.left,
  DIRECTIONS.down,
  DIRECTIONS.right
];

export const oppositeOf = (d: DirectionVector): DirectionVector =>
  d === DIRECTIONS.up ? DIRECTIONS.down
    : d === DIRECTIONS.down ? DIRECTIONS.up
      : d === DIRECTIONS.left ? DIRECTIONS.right
        : d === DIRECTIONS.right ? DIRECTIONS.left
          : DIRECTIONS.none;

/** The real Pac-Man playfield: 28 x 31 tiles (the arcade's score rows are drawn by the HUD instead). */
export const GRID_WIDTH = 28;
export const GRID_HEIGHT = 31;
/** Logical drawing units per tile; the canvas is scaled to the screen from these. */
export const CELL_SIZE = 24;
/** Breathing room around the maze so the outer glow is never clipped. */
export const BOARD_MARGIN = 10;
export const CANVAS_WIDTH = GRID_WIDTH * CELL_SIZE + BOARD_MARGIN * 2;
export const CANVAS_HEIGHT = GRID_HEIGHT * CELL_SIZE + BOARD_MARGIN * 2;

/** Fixed simulation step (seconds). */
export const FIXED_STEP = 1 / 120;

export const STARTING_LIVES = 3;
export const PELLET_SCORE = 10;
export const POWER_PELLET_SCORE = 50;
export const GHOST_CHAIN: readonly number[] = [200, 400, 800, 1600];
export const ALL_GHOSTS_BONUS = 12000;
export const EXTRA_LIFE_AT = 10000;

/**
 * How long (seconds) a swipe/keypress waits for a legal corner before it is
 * forgotten. Long enough to feel forgiving, short enough that a stale swipe
 * never throws you around a corner you forgot about.
 */
export const TURN_BUFFER_SECONDS = 0.7;
/** A turn pressed this close (in tiles) before OR after a junction still takes it. */
export const TURN_WINDOW = 0.55;

/** Entity coordinates are tile centres; half-tile values sit on the board's centre line. */
export const PACMAN_START: GridPoint = Object.freeze({ x: 13.5, y: 23 });
export const GATE_X = 13.5;
/** Row just above the ghost-house gate: Blinky's start and the exit/entry point for everyone. */
export const DOOR_Y = 11;
/** Middle row of the ghost house interior. */
export const HOUSE_Y = 14;
export const FRUIT_POSITION: GridPoint = Object.freeze({ x: 13.5, y: 17 });
export const TUNNEL_ROW = 14;
/** Ghosts slow down on these tunnel columns (both sides). */
export const isTunnelColumn = (x: number): boolean => x <= 5 || x >= 22;

export const GHOST_STARTS: Readonly<Record<GhostId, GridPoint>> = Object.freeze({
  blinky: Object.freeze({ x: 13.5, y: DOOR_Y }),
  pinky: Object.freeze({ x: 13.5, y: HOUSE_Y }),
  inky: Object.freeze({ x: 11.5, y: HOUSE_Y }),
  clyde: Object.freeze({ x: 15.5, y: HOUSE_Y })
});

/** Scatter targets sit just outside the maze corners, exactly like the arcade. */
export const HOME_CORNERS: Readonly<Record<GhostId, GridPoint>> = Object.freeze({
  blinky: Object.freeze({ x: 25, y: -3 }),
  pinky: Object.freeze({ x: 2, y: -3 }),
  inky: Object.freeze({ x: 27, y: 31 }),
  clyde: Object.freeze({ x: 0, y: 31 })
});

/** Intersections where chasing/scattering ghosts may not turn upward (arcade rule). */
export const NO_UP_TILES: readonly GridPoint[] = [
  { x: 12, y: 11 }, { x: 15, y: 11 }, { x: 12, y: 23 }, { x: 15, y: 23 }
];

export const COLORS = Object.freeze({
  gold: "#d4af37",
  goldSoft: "#f1d98a",
  pac: "#ffd84a",
  ink: "#f7f3e8",
  black: "#050505",
  line: "#d8b447",
  blinky: "#e5503f",
  pinky: "#f2a9cf",
  inky: "#6fd8d0",
  clyde: "#f0a04b",
  frightened: "#3f56d9",
  frightenedFlash: "#f7f3e8"
});
