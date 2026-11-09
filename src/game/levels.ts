import type { LevelDefinition } from "./types";
import { LEVEL_NAMES } from "./constants";
import { LEVEL_ROWS } from "./levelData";
import { worldOf } from "./worlds";

/** 50 hand-validated, procedurally generated mazes (see scripts/generateLevels.mjs). */
export const LEVELS: readonly LevelDefinition[] = LEVEL_ROWS.map((rows, index) => ({
  name: LEVEL_NAMES[index] ?? `Act ${index + 1}`,
  world: worldOf(index),
  rows
}));

export const TOTAL_LEVELS = LEVELS.length;
