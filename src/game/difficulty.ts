import type { HuntPhase } from "./types";

export interface HuntStep {
  readonly phase: HuntPhase;
  readonly seconds: number;
}

export interface LevelConfig {
  /** Pac-Man speed in cells per second. */
  readonly pacSpeed: number;
  readonly ghostSpeed: number;
  readonly tunnelSpeed: number;
  readonly frightSpeed: number;
  readonly eatenSpeed: number;
  readonly houseSpeed: number;
  readonly frightSeconds: number;
  readonly schedule: readonly HuntStep[];
  /** Pellets that must be eaten (this life) before each ghost leaves the house. */
  readonly release: { readonly pinky: number; readonly inky: number; readonly clyde: number };
  /** Blinky speeds up once this many pellets remain. */
  readonly elroy1: number;
  readonly elroy2: number;
  readonly elroyBonus: number;
}

const step = (phase: HuntPhase, seconds: number): HuntStep => ({ phase, seconds });

/**
 * Arcade-style progression: ghosts start at ~72% of Pac-Man's pace and climb to
 * ~97% by level 50, frightened time shrinks, scatter phases get shorter and the
 * ghost house empties faster. Pac-Man never slows down, so late levels stay
 * fair but demand clean corners.
 */
export function levelConfig(levelIndex: number): LevelConfig {
  const t = Math.min(1, levelIndex / 49);
  const pacSpeed = 5.5 + t * 0.7;
  const ghostRatio = 0.72 + t * 0.25;
  const ghostSpeed = pacSpeed * ghostRatio;

  const schedule: readonly HuntStep[] =
    levelIndex < 8
      ? [step("scatter", 7), step("chase", 20), step("scatter", 7), step("chase", 20), step("scatter", 5), step("chase", 20), step("scatter", 5), step("chase", Infinity)]
      : levelIndex < 25
        ? [step("scatter", 5), step("chase", 20), step("scatter", 5), step("chase", 20), step("scatter", 4), step("chase", 22), step("scatter", 3), step("chase", Infinity)]
        : [step("scatter", 4), step("chase", 22), step("scatter", 3), step("chase", 24), step("scatter", 2), step("chase", 26), step("scatter", 1), step("chase", Infinity)];

  return {
    pacSpeed,
    ghostSpeed,
    tunnelSpeed: pacSpeed * 0.45,
    frightSpeed: pacSpeed * 0.5,
    eatenSpeed: pacSpeed * 1.7,
    houseSpeed: pacSpeed * 0.55,
    frightSeconds: Math.max(1.8, 7 - levelIndex * 0.11),
    schedule,
    release: {
      pinky: 0,
      inky: Math.max(0, Math.round(10 - levelIndex * 0.5)),
      clyde: Math.max(0, Math.round(22 - levelIndex * 0.9))
    },
    elroy1: 18 + Math.floor(levelIndex * 0.35),
    elroy2: 9 + Math.floor(levelIndex * 0.18),
    elroyBonus: pacSpeed * 0.05
  };
}
