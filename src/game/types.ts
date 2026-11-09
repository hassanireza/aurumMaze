export interface GridPoint {
  readonly x: number;
  readonly y: number;
}

export type DirectionName = "up" | "down" | "left" | "right" | "none";

export interface DirectionVector extends GridPoint {
  readonly name: DirectionName;
}

export type GameMode =
  | "ready"
  | "playing"
  | "paused"
  | "dying"
  | "clearing"
  | "levelclear"
  | "over"
  | "won";

/** Global hunting phase shared by every ghost. */
export type HuntPhase = "scatter" | "chase";

/** Where a ghost is in its life cycle. */
export type GhostPhase = "house" | "leaving" | "roam" | "eaten";

/** What a ghost looks and behaves like right now (used by HUD and renderer). */
export type GhostMotionMode = "house" | "scatter" | "chase" | "frightened" | "eaten";

export type GhostId = "blinky" | "pinky" | "inky" | "clyde";

export type ControlScheme = "swipe" | "dpad";

export type HapticKind = "power" | "eat" | "die" | "clear";

export interface LevelDefinition {
  readonly name: string;
  readonly world: number;
  readonly rows: readonly string[];
}

export interface WorldTheme {
  readonly name: string;
  readonly tagline: string;
  readonly wallTop: string;
  readonly wallSide: string;
  readonly wallEdge: string;
  readonly floor: string;
  readonly floorAlt: string;
  readonly glow: string;
  readonly sky: readonly [string, string];
}

export interface GhostStatus {
  readonly id: GhostId;
  readonly mode: GhostMotionMode;
}

export interface HudSnapshot {
  readonly score: number;
  readonly best: number;
  readonly levelIndex: number;
  readonly lives: number;
  readonly mode: GameMode;
  readonly statusLabel: string;
  readonly levelName: string;
  readonly world: number;
  readonly pelletsLeft: number;
  readonly pelletsTotal: number;
  readonly frightened: number;
  readonly ghosts: readonly GhostStatus[];
  readonly phase: HuntPhase;
  readonly completedLevels: readonly number[];
}

export interface Popup {
  readonly x: number;
  readonly y: number;
  readonly text: string;
  age: number;
}
