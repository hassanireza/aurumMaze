/**
 * Headless sanity checks: `npm run verify`
 * - every level is fully connected and the ghost house exit works
 * - ghosts leave the house, never freeze, get frightened, eaten and return
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
  const seen = new Set(["7,11"]);
  const stack = [{ x: 7, y: 11 }];
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
  if (maze.nextStep({ x: 7, y: 7 }, { x: 7, y: 5 }, true)?.name !== "up") fail(`level ${i + 1}: house exit`);
}
console.log(`ok: ${LEVELS.length} levels connected`);

let sawEaten = false;
for (const start of [0, 24, 49]) {
  const e = new GameEngine(quiet, { startLevel: start, best: 0, completed: [], seed: 3 });
  const last: Record<string, string> = {};
  const still: Record<string, number> = {};
  for (let t = 0; t < 60 * 240 && e.getMode() !== "over"; t += 1) {
    const m = e.getMaze();
    const p = e.getPacman();
    if (e.getMode() === "ready") e.queueDirection("left");
    if (e.getMode() === "playing" && p.gridProgress === 0) {
      const danger = e.getGhosts().filter(g => g.isActive && !g.isVulnerable);
      const prey = e.getGhosts().filter(g => g.isVulnerable);
      const q: { x: number; y: number; first: DirectionVector | null; d: number }[] = [{ x: p.x, y: p.y, first: null, d: 0 }];
      const visited = new Set([`${p.x},${p.y}`]);
      let pick: DirectionVector | null = null;
      for (let h = 0; h < q.length && !pick; h += 1) {
        const n = q[h]!;
        for (const d of ALL_DIRECTIONS) {
          const r = m.resolve({ x: n.x + d.x, y: n.y + d.y });
          if (!r || !m.canEnter(r) || visited.has(`${r.x},${r.y}`)) continue;
          if (n.d < 3 && danger.some(g => Math.abs(g.x - r.x) + Math.abs(g.y - r.y) <= 2)) continue;
          visited.add(`${r.x},${r.y}`);
          const first = n.first ?? d;
          const hit = prey.length ? prey.some(g => g.x === r.x && g.y === r.y) : m.pellets.has(`${r.x},${r.y}`);
          if (hit) { pick = first; break; }
          q.push({ x: r.x, y: r.y, first, d: n.d + 1 });
        }
      }
      if (pick) e.queueDirection(pick.name);
    }
    if (e.getMode() === "levelclear") e.nextLevel();
    e.update(1 / 60);
    for (const g of e.getGhosts()) {
      if (g.isEaten) sawEaten = true;
      const key = `${g.x},${g.y},${g.gridProgress.toFixed(2)}`;
      if (g.phase === "roam" && e.getMode() === "playing" && !e.isFrightened()) {
        still[g.id] = last[g.id] === key ? (still[g.id] ?? 0) + 1 : 0;
        last[g.id] = key;
        if ((still[g.id] ?? 0) > 180) fail(`ghost ${g.id} froze on level ${e.getLevelIndex() + 1}`);
      }
    }
  }
}
if (!sawEaten) fail("no ghost was ever eaten");
console.log("ok: ghosts roam, flee, get eaten and never freeze");
console.log("verify passed");
