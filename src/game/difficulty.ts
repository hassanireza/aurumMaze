import type { HuntPhase } from "./types";

export interface HuntStep {
  readonly phase: HuntPhase;
  readonly seconds: number;
}

export interface LevelConfig {
  readonly pacSpeed: number;
  readonly ghostSpeed: number;
  readonly tunnelSpeed: number;
  readonly frightSpeed: number;
  readonly eatenSpeed: number;
  readonly houseSpeed: number;
  readonly frightSeconds: number;
  readonly schedule: readonly HuntStep[];
  readonly release: { readonly pinky: number; readonly inky: number; readonly clyde: number };
  readonly elroy1: number;
  readonly elroy2: number;
  readonly elroyBonus: number;
}

const step = (phase: HuntPhase, seconds: number): HuntStep => ({ phase, seconds });
const SCHEDULES: readonly (readonly HuntStep[])[] = [
  [step("scatter", 7), step("chase", 20), step("scatter", 7), step("chase", 20), step("scatter", 5), step("chase", 20), step("scatter", 5), step("chase", Infinity)],
  [step("scatter", 7), step("chase", 20), step("scatter", 7), step("chase", 20), step("scatter", 5), step("chase", 1033), step("scatter", 1 / 60), step("chase", Infinity)],
  [step("scatter", 5), step("chase", 20), step("scatter", 5), step("chase", 20), step("scatter", 5), step("chase", 1037), step("scatter", 1 / 60), step("chase", Infinity)]
];

const FRIGHT_SECONDS = [6, 5, 4, 3, 2, 5, 2, 2, 1, 5, 2, 1, 1, 3, 1, 1, 0, 1, 0, 0, 0];
const ELROY = [[20,10],[30,15],[40,20],[40,20],[40,20],[50,25],[50,25],[50,25],[60,30],[60,30],[60,30],[80,40],[80,40],[80,40],[100,50],[100,50],[100,50],[100,50],[120,60],[120,60],[120,60]] as const;
const HOUSE_DOTS = [[0,30,60],[0,0,50],[0,0,0],[0,0,0]] as const;

/** Core 1980 Midway progression table; level 21+ uses the final entry. */
export function levelConfig(levelIndex: number): LevelConfig {
  const level = levelIndex + 1;
  const band = level === 1 ? 0 : level <= 4 ? 1 : level <= 20 ? 2 : 3;
  const pacPct = [80, 90, 100, 90][band]!;
  const ghostPct = [75, 85, 95, 95][band]!;
  const tunnelPct = [40, 45, 50, 50][band]!;
  const frightPct = [50, 55, 60, 60][band]!;
  const table = Math.min(levelIndex, 20);
  const [elroy1, elroy2] = ELROY[table]!;
  const release = HOUSE_DOTS[Math.min(3, level <= 4 ? level - 1 : level <= 8 ? 2 : 3)]!;
  return {
    pacSpeed: 6 * pacPct / 100,
    ghostSpeed: 6 * ghostPct / 100,
    tunnelSpeed: 6 * tunnelPct / 100,
    frightSpeed: 6 * frightPct / 100,
    eatenSpeed: 10.2,
    houseSpeed: 3.3,
    frightSeconds: FRIGHT_SECONDS[table] ?? 0,
    schedule: SCHEDULES[level === 1 ? 0 : level <= 4 ? 1 : 2]!,
    release: { pinky: release[0], inky: release[1], clyde: release[2] },
    elroy1,
    elroy2,
    elroyBonus: 0.3
  };
}

export const fruitForLevel = (levelIndex: number): { readonly name: string; readonly points: number } => {
  const i = Math.min(levelIndex, 20);
  const entries = [
    ["Cherries",100],["Strawberry",300],["Peach",500],["Peach",500],["Apple",700],["Apple",700],
    ["Grapes",1000],["Grapes",1000],["Galaxian",2000],["Galaxian",2000],["Bell",3000],["Bell",3000],
    ["Key",5000],["Key",5000],["Key",5000],["Key",5000],["Key",5000],["Key",5000],["Key",5000],["Key",5000],["Key",5000]
  ] as const;
  const [name, points] = entries[i]!;
  return { name, points };
};
