import type { FruitName, HuntPhase } from "./types";

export interface HuntStep {
  readonly phase: HuntPhase;
  readonly seconds: number;
}

export interface LevelConfig {
  readonly pacSpeed: number;
  readonly pacFrightSpeed: number;
  readonly ghostSpeed: number;
  readonly tunnelSpeed: number;
  readonly frightSpeed: number;
  readonly eyesSpeed: number;
  readonly houseSpeed: number;
  readonly elroy1Speed: number;
  readonly elroy2Speed: number;
  readonly frightSeconds: number;
  readonly schedule: readonly HuntStep[];
  /** Personal dot counters that release Pinky, Inky and Clyde. */
  readonly release: { readonly pinky: number; readonly inky: number; readonly clyde: number };
  /** Seconds without eating before the next waiting ghost is forced out. */
  readonly houseTimeout: number;
  readonly elroy1: number;
  readonly elroy2: number;
}

/**
 * Speed of a "100%" arcade step in tiles per second. The 1980 cabinet runs at
 * about 9.5 tiles/s; Aurum Maze plays at 90% of that so a thumb swipe has the
 * same reaction margin a joystick does. Every ratio below is the arcade's.
 */
export const BASE_SPEED = 8.5;
/** Faithful arcade pace: 100% = 75.7576 px/s on an 8 px tile = 9.47 tiles per second. */
export const ARCADE_SPEED = 75.7576 / 8;

const step = (phase: HuntPhase, seconds: number): HuntStep => ({ phase, seconds });
const SCHEDULES: readonly (readonly HuntStep[])[] = [
  [step("scatter", 7), step("chase", 20), step("scatter", 7), step("chase", 20), step("scatter", 5), step("chase", 20), step("scatter", 5), step("chase", Infinity)],
  [step("scatter", 7), step("chase", 20), step("scatter", 7), step("chase", 20), step("scatter", 5), step("chase", 1033), step("scatter", 1 / 60), step("chase", Infinity)],
  [step("scatter", 5), step("chase", 20), step("scatter", 5), step("chase", 20), step("scatter", 5), step("chase", 1037), step("scatter", 1 / 60), step("chase", Infinity)]
];

/** Frightened seconds for levels 1..21 (level 21+ repeats the last entry). */
const FRIGHT_SECONDS = [6, 5, 4, 3, 2, 5, 2, 2, 1, 5, 2, 1, 1, 3, 1, 1, 0, 1, 0, 0, 0];
/** Blinky "Cruise Elroy" thresholds: dots left for [stage 1, stage 2]. */
const ELROY = [[20, 10], [30, 15], [40, 20], [40, 20], [40, 20], [50, 25], [50, 25], [50, 25], [60, 30], [60, 30], [60, 30], [80, 40], [80, 40], [80, 40], [100, 50], [100, 50], [100, 50], [100, 50], [120, 60], [120, 60], [120, 60]] as const;
const HOUSE_DOTS = [[0, 30, 60], [0, 0, 50], [0, 0, 0]] as const;

/** Core 1980 Midway progression table; level 21+ uses the final entry. */
export function levelConfig(levelIndex: number, baseSpeed: number = BASE_SPEED): LevelConfig {
  const level = levelIndex + 1;
  const band = level === 1 ? 0 : level <= 4 ? 1 : level <= 20 ? 2 : 3;
  const pct = (list: readonly number[]): number => (list[band]! / 100) * baseSpeed;
  const table = Math.min(levelIndex, 20);
  const [elroy1, elroy2] = ELROY[table]!;
  const dots = HOUSE_DOTS[Math.min(2, level - 1)]!;
  return {
    pacSpeed: pct([80, 90, 100, 90]),
    pacFrightSpeed: pct([90, 95, 100, 90]),
    ghostSpeed: pct([75, 85, 95, 95]),
    tunnelSpeed: pct([40, 45, 50, 50]),
    frightSpeed: pct([50, 55, 60, 60]),
    eyesSpeed: baseSpeed * 1.6,
    houseSpeed: baseSpeed * 0.4,
    elroy1Speed: pct([80, 90, 100, 100]),
    elroy2Speed: pct([85, 95, 105, 105]),
    frightSeconds: FRIGHT_SECONDS[table] ?? 0,
    schedule: SCHEDULES[level === 1 ? 0 : level <= 4 ? 1 : 2]!,
    release: { pinky: dots[0], inky: dots[1], clyde: dots[2] },
    houseTimeout: level <= 4 ? 4 : 3,
    elroy1,
    elroy2
  };
}

const FRUITS: readonly (readonly [FruitName, number])[] = [
  ["Cherries", 100], ["Strawberry", 300], ["Peach", 500], ["Peach", 500], ["Apple", 700], ["Apple", 700],
  ["Grapes", 1000], ["Grapes", 1000], ["Galaxian", 2000], ["Galaxian", 2000], ["Bell", 3000], ["Bell", 3000],
  ["Key", 5000]
];

export const fruitForLevel = (levelIndex: number): { readonly name: FruitName; readonly points: number } => {
  const [name, points] = FRUITS[Math.min(levelIndex, FRUITS.length - 1)]!;
  return { name, points };
};
