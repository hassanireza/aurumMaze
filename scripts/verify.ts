/**
 * Headless sanity checks: `npm run verify`
 * - every round reuses a connected 244-dot arcade maze
 * - round 256 enters the split-screen kill-screen state
 */
import { GameEngine } from "../src/game/GameEngine";
import { LEVELS } from "../src/game/levels";
import { Maze } from "../src/game/Maze";
import { ALL_DIRECTIONS } from "../src/game/constants";
import type { DirectionVector } from "../src/game/types";

const fail = (msg: string): never => { throw new Error(`verify failed: ${msg}`); };
const quiet = { onHudChange: () => undefined, onLevelCleared: () => undefined, onGameEnd: () => undefined, onHaptic: () => undefined };

for (const [i, level] of LEVELS.entries()) {
  const maze = new Maze(level);
  const seen = new Set(["14,26"]);
  const stack = [{ x: 14, y: 26 }];
  while (stack.length) {
    const c = stack.pop()!;
    for (const d of ALL_DIRECTIONS) {
      const r = maze.resolve({ x: c.x + d.x, y: c.y + d.y });
      if (!r || !maze.canEnter(r) || seen.has(`${r.x},${r.y}`)) continue;
      seen.add(`${r.x},${r.y}`);
      stack.push(r);
    }
  }
  for (const k of maze.pellets) if (!seen.has(k)) fail(`level ${i + 1}: unreachable pellet ${k}`);
  if (maze.nextStep({ x: 13, y: 17 }, { x: 13, y: 13 }, true)?.name !== "up") fail(`level ${i + 1}: house exit`);
  if (maze.totalPellets !== 244) fail(`level ${i + 1}: expected 244 pellets, got ${maze.totalPellets}`);
}
console.log(`ok: ${LEVELS.length} levels connected`);

for (const start of [0, 20, 255]) {
  const e = new GameEngine(quiet, { startLevel: start, best: 0, completed: [], seed: 3 });
  if (e.getMaze().totalPellets !== 244) fail(`level ${start + 1}: expected 244 pellets`);
  if (start === 255 && e.getMaze().glyph(20, 10) !== " ") fail("level 256: right half was not corrupted");
}
console.log("ok: original pellet count and level-256 kill-screen setup");
console.log("verify passed");
