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

export const GRID_WIDTH = 28;
export const GRID_HEIGHT = 36;
/** Logical drawing size retains the original 28:36 arcade board ratio. */
export const CANVAS_WIDTH = 672;
export const CANVAS_HEIGHT = 864;
export const CANVAS_SIZE = CANVAS_HEIGHT;
export const BOARD_MARGIN = 0;
export const CELL_SIZE = CANVAS_WIDTH / GRID_WIDTH;

/** Fixed simulation step (seconds). */
export const FIXED_STEP = 1 / 120;

export const STARTING_LIVES = 3;
export const PELLET_SCORE = 10;
export const PELLET_SCORE_PER_LEVEL = 0;
export const POWER_PELLET_SCORE = 50;
export const GHOST_CHAIN: readonly number[] = [200, 400, 800, 1600];
export const LEVEL_CLEAR_BONUS = 0;
export const EXTRA_LIFE_AT = 10000;

/** How long (seconds) a swipe/keypress waits for a legal corner before it is forgotten. */
export const TURN_BUFFER_SECONDS = 0.55;

export const PACMAN_START: GridPoint = Object.freeze({ x: 14, y: 26 });
export const HOUSE_DOOR: GridPoint = Object.freeze({ x: 13, y: 14 });
export const HOUSE_EXIT: GridPoint = Object.freeze({ x: 13, y: 13 });
export const HOUSE_CENTER: GridPoint = Object.freeze({ x: 13, y: 17 });
export const TUNNEL_ROW = 17;

export const GHOST_STARTS: Readonly<Record<GhostId, GridPoint>> = Object.freeze({
  blinky: Object.freeze({ x: 13, y: 14 }),
  pinky: Object.freeze({ x: 13, y: 17 }),
  inky: Object.freeze({ x: 11, y: 17 }),
  clyde: Object.freeze({ x: 15, y: 17 })
});

/**
 * Scatter targets sit just outside the maze like the original arcade targets.
 */
export const HOME_CORNERS: Readonly<Record<GhostId, GridPoint>> = Object.freeze({
  blinky: Object.freeze({ x: 25, y: -2 }),
  pinky: Object.freeze({ x: 2, y: -2 }),
  inky: Object.freeze({ x: 26, y: 33 }),
  clyde: Object.freeze({ x: 1, y: 33 })
});

export const LEVEL_NAMES: readonly string[] = [
  "First Light", "Narrow Cut", "Soft Static", "Long Turn", "White Heat",
  "Orbit Room", "Quiet Rush", "Gold Pressure", "Final Trace", "Encore Line",
  "Tidal Gate", "Moss Stair", "Glass Canal", "Whisper Reed", "Lantern Pool",
  "Cedar Loop", "Kelp Hollow", "Silent Weir", "Jade Echo", "Garden Crown",
  "Rose Axis", "Velvet Arc", "Petal Clock", "Clay Orbit", "Dusk Mirror",
  "Blush Tower", "Amber Hush", "Copper Vein", "Salt Terrace", "Observatory Door",
  "Violet Step", "Lilac Vault", "Moon Ledge", "Twilight Knot", "Ink Bridge",
  "Orchid Spire", "Night Garden", "Star Cistern", "Veil Passage", "Citadel Gate",
  "Ember Court", "Cinder Walk", "Saffron Rise", "Ash Cathedral", "Flare Garden",
  "Lava Bloom", "Sun Engine", "Last Ember", "Gilded Maw", "Aurum Crown"
];

export const COLORS = Object.freeze({
  gold: "#d4af37",
  goldSoft: "#f1d98a",
  ink: "#f7f3e8",
  muted: "rgba(247,243,232,.24)",
  black: "#050505",
  blinky: "#d4af37",
  pinky: "#e7c8d9",
  inky: "#9fd8d3",
  clyde: "#e3a05e",
  frightened: "#6c7ca3",
  frightenedFlash: "#f7f3e8"
});
