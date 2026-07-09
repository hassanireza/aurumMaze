export interface GridPoint {
  readonly x: number;
  readonly y: number;
}

export type DirectionName = "up" | "down" | "left" | "right" | "none";

export interface DirectionVector extends GridPoint {
  readonly name: DirectionName;
}

export type GameMode = "ready" | "playing" | "paused" | "over" | "won";

export type GhostMotionMode = "scatter" | "chase" | "frightened" | "eaten";

export type GhostId = "blinky" | "pinky" | "inky" | "clyde";

export interface LevelDefinition {
  readonly name: string;
  readonly rows: readonly string[];
}

export interface HudSnapshot {
  readonly score: number;
  readonly levelIndex: number;
  readonly lives: number;
  readonly mode: GameMode;
  readonly statusLabel: string;
  readonly levelName: string;
  readonly completedLevels: readonly number[];
}
