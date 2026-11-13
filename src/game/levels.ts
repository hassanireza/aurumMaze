import type { LevelDefinition } from "./types";
import { ARCADE_MAZE_ROWS } from "./arcadeMaze";

/** One authentic board is replayed for every round in the original arcade game. */
export const LEVELS: readonly LevelDefinition[] = Array.from({ length: 256 }, (_, index) => ({
  name: index === 255 ? "Split Screen" : "Arcade Maze",
  world: 0,
  rows: ARCADE_MAZE_ROWS
}));

export const TOTAL_LEVELS = LEVELS.length;
