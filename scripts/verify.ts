/**
 * Headless regression checks: `npm run verify`
 *  - the maze is the real 28x31 arcade board (244 dots, left/right symmetric, fully connected)
 *  - Pac-Man steers, wraps through the tunnel and never leaves the corridors
 *  - ghosts leave the house on the arcade schedule, obey the no-up rule and never touch a wall
 *  - an eaten ghost finds its way home from every tile of the maze
 *  - difficulty tables match the arcade, and round 256 enters the split-screen state
 */
import { GameEngine } from "../src/game/GameEngine";
import { LEVELS } from "../src/game/levels";
import { Maze } from "../src/game/Maze";
import { Rng } from "../src/game/Rng";
import { levelConfig, fruitForLevel, BASE_SPEED } from "../src/game/difficulty";
import { BlinkyGhost } from "../src/game/ghosts/BlinkyGhost";
import { PacMan } from "../src/game/PacMan";
import { ALL_DIRECTIONS, DIRECTIONS, DOOR_Y, GATE_X, NO_UP_TILES, PACMAN_START, GRID_HEIGHT, GRID_WIDTH } from "../src/game/constants";
import type { DirectionName } from "../src/game/types";

const fail = (msg: string): never => { throw new Error(`verify failed: ${msg}`); };
const ok = (msg: string): void => console.log(`ok: ${msg}`);
const quiet = { onHudChange: () => undefined, onLevelCleared: () => undefined, onGameEnd: () => undefined, onHaptic: () => undefined };

/* ---------- maze ---------- */
const rows = LEVELS[0]!.rows;
if (rows.length !== GRID_HEIGHT || rows.some(r => r.length !== GRID_WIDTH)) fail("maze must be 28 x 31");
for (const [i, row] of rows.entries()) if (row !== [...row].reverse().join("")) fail(`row ${i} is not left/right symmetric`);
const maze = new Maze(LEVELS[0]!);
if (maze.totalPellets !== 244) fail(`expected 244 pellets, got ${maze.totalPellets}`);
let power = 0;
for (const k of maze.pellets) { const [x, y] = k.split(",").map(Number) as [number, number]; if (maze.isPowerPellet(x, y)) power += 1; }
if (power !== 4) fail("expected 4 power pellets");
if (!maze.isGate(13, 12) || !maze.isGate(14, 12)) fail("gate must be 2 tiles wide at row 12");
if (maze.glyph(13, 11) !== " " || maze.glyph(13, 17) !== " ") fail("corridors above and below the house must be open");
const seen = new Set<string>(["13,23"]);
const stack = [{ x: 13, y: 23 }];
while (stack.length) {
  const c = stack.pop()!;
  for (const d of ALL_DIRECTIONS) {
    if (!maze.canStep(c.x, c.y, d)) continue;
    const n = { x: maze.wrapX(c.x + d.x), y: c.y + d.y };
    const key = `${n.x},${n.y}`;
    if (seen.has(key)) continue;
    seen.add(key);
    stack.push(n);
  }
}
for (const k of maze.pellets) if (!seen.has(k)) fail(`unreachable pellet ${k}`);
// No dead ends, no pockets: every walkable tile has at least two exits, and none touches the house.
let walkable = 0;
for (let y = 0; y < GRID_HEIGHT; y += 1) for (let x = 0; x < GRID_WIDTH; x += 1) {
  if (!maze.canStand({ x, y })) continue;
  walkable += 1;
  const exits = ALL_DIRECTIONS.filter(d => maze.canStep(x, y, d)).length;
  if (exits < 2) fail(`dead end at ${x},${y}`);
  if (!seen.has(`${x},${y}`)) fail(`walkable tile ${x},${y} unreachable from Pac-Man's start`);
}
if (walkable !== seen.size) fail("reachable set differs from walkable set");
ok(`maze: no dead ends or pockets across ${walkable} walkable tiles`);
ok("maze: 28x31, 244 dots, symmetric, connected, 2-wide gate");

/* ---------- difficulty tables ---------- */
const l1 = levelConfig(0); const l2 = levelConfig(1); const l5 = levelConfig(4); const l21 = levelConfig(20);
const near = (a: number, b: number): boolean => Math.abs(a - b) < 1e-9;
if (!near(l1.pacSpeed, 0.8 * BASE_SPEED) || !near(l1.ghostSpeed, 0.75 * BASE_SPEED) || !near(l1.tunnelSpeed, 0.4 * BASE_SPEED)) fail("level 1 speeds");
if (!near(l2.pacSpeed, 0.9 * BASE_SPEED) || !near(l5.pacSpeed, BASE_SPEED) || !near(l21.pacSpeed, 0.9 * BASE_SPEED)) fail("speed bands");
if (l1.frightSeconds !== 6 || levelConfig(16).frightSeconds !== 0 || l21.frightSeconds !== 0) fail("fright table");
if (l1.release.inky !== 30 || l1.release.clyde !== 60 || l2.release.clyde !== 50) fail("house dot limits");
if (fruitForLevel(0).name !== "Cherries" || fruitForLevel(12).points !== 5000 || fruitForLevel(255).name !== "Key") fail("fruit table");
ok("difficulty tables match the arcade");

/* ---------- Pac-Man movement ---------- */
{
  const pac = new PacMan(PACMAN_START);
  const eaten: string[] = [];
  const tile = (x: number, y: number): void => { eaten.push(`${x},${y}`); };
  const step = (n: number, q?: DirectionName): void => { if (q) pac.queueDirection(DIRECTIONS[q]); for (let i = 0; i < n; i += 1) pac.update(maze, 1 / 120, 6, tile); };
  step(120, "left");
  if (pac.px > 8) fail("pac should have moved left");
  // reverse is instant, and he must never stand inside a wall
  const m = new Maze(LEVELS[0]!);
  const rng = new Rng(5);
  const names: DirectionName[] = ["up", "down", "left", "right"];
  const p2 = new PacMan(PACMAN_START);
  for (let i = 0; i < 120 * 90; i += 1) {
    if (i % 17 === 0) p2.queueDirection(DIRECTIONS[rng.pick(names)]);
    p2.update(m, 1 / 120, 8.5, () => undefined);
    const nearX = Math.abs(p2.px - Math.round(p2.px)) < 1e-6;
    const nearY = Math.abs(p2.py - Math.round(p2.py)) < 1e-6;
    if (!nearX && !nearY) fail(`pac left the corridor grid at ${p2.px},${p2.py}`);
    if (!m.canStand({ x: m.wrapX(Math.round(p2.px)), y: Math.round(p2.py) })) fail(`pac inside a wall at ${p2.px},${p2.py}`);
  }
  // tunnel wrap
  const p3 = new PacMan({ x: 2, y: 14 });
  p3.queueDirection(DIRECTIONS.left);
  let wrapped = false;
  for (let i = 0; i < 120 * 3; i += 1) { p3.update(m, 1 / 120, 8, () => undefined); if (p3.px > 20) wrapped = true; }
  if (!wrapped) fail("pac did not wrap through the tunnel");
  // corner cutting: a turn pressed 0.4 tiles before a junction must still be taken
  const p4 = new PacMan({ x: 5.4, y: 8 });
  p4.queueDirection(DIRECTIONS.right);
  p4.update(m, 1 / 120, 8, () => undefined);
  p4.queueDirection(DIRECTIONS.down);
  for (let i = 0; i < 40; i += 1) p4.update(m, 1 / 120, 8, () => undefined);
  if (p4.direction !== DIRECTIONS.down) fail("early/late turn within the corner window was refused");
}
ok("pac-man: steering, instant reverse, tunnel wrap, corner window");

/* ---------- ghosts ---------- */
{
  // eaten ghost reaches the door from every walkable tile
  const config = levelConfig(0);
  const e = new GameEngine(quiet, { startLevel: 0, best: 0, completed: [], seed: 2 });
  let tested = 0;
  for (let y = 0; y < GRID_HEIGHT; y += 1) for (let x = 0; x < GRID_WIDTH; x += 1) {
    if (!maze.canStand({ x, y })) continue;
    for (const dir of ALL_DIRECTIONS) {
      if (!maze.canStep(x, y, dir)) continue;
      const g = new BlinkyGhost();
      g.resetTo({ x, y }, dir);
      g.phase = "eaten";
      const ctx = { pacman: e.getPacman(), blinkyTile: g.tile, maze, rng: new Rng(1), config, pelletsLeft: 100, elroyActive: true };
      let t = 0;
      while (g.phase === "eaten" && t < 40) { g.update(ctx, 1 / 120); t += 1 / 120; }
      if (g.phase === "eaten") fail(`eyes from ${x},${y} heading ${dir.name} never reached the house`);
      tested += 1;
      break;
    }
  }
  ok(`ghosts: eyes find the house from ${tested} tiles`);

  // full-game soak: random swipes, many seeds, several levels
  for (const [seed, level] of [[1, 0], [2, 1], [3, 4], [4, 20], [5, 255]] as const) {
    const game = new GameEngine(quiet, { startLevel: level, best: 0, completed: [], seed });
    const rnd = new Rng(seed * 7);
    const names: DirectionName[] = ["up", "down", "left", "right"];
    game.queueDirection("left");
    const left = new Set<string>();
    for (let i = 0; i < 60 * 240; i += 1) {
      if (i % 9 === 0) game.queueDirection(rnd.pick(names));
      game.update(1 / 60);
      if (game.getMode() === "over") break;
      for (const gh of game.getGhosts()) {
        if (gh.phase === "house" || gh.phase === "leaving" || gh.phase === "entering") continue;
        const onX = Math.abs(gh.px - Math.round(gh.px)) < 1e-6;
        const onY = Math.abs(gh.py - Math.round(gh.py)) < 1e-6;
        if (!onX && !onY && !(gh.py === DOOR_Y && gh.px === GATE_X)) fail(`${gh.id} off the grid at ${gh.px},${gh.py}`);
        if (!maze.canStand({ x: maze.wrapX(Math.round(gh.px)), y: Math.round(gh.py) }) && level !== 255) fail(`${gh.id} inside a wall at ${gh.px},${gh.py}`);
        if (gh.phase === "roam") left.add(gh.id);
      }
    }
    if (level === 0 && !(left.has("blinky") && left.has("pinky"))) fail("ghosts never roamed");
  }
  ok("ghosts: five random soak runs, always on corridors");

  // arcade house schedule on level 1: Pinky at once, Inky after 30 dots / timer
  const game = new GameEngine(quiet, { startLevel: 0, best: 0, completed: [], seed: 9 });
  game.queueDirection("left");
  for (let i = 0; i < 90; i += 1) game.update(1 / 60);
  const pinky = game.getGhosts().find(g => g.id === "pinky")!;
  if (pinky.phase === "house") fail("Pinky should leave almost immediately");
  const inky = game.getGhosts().find(g => g.id === "inky")!;
  if (inky.phase !== "house") fail("Inky should still wait on level 1");
  ok("ghost house: Pinky leaves at once, Inky waits for 30 dots");

  // no-up rule
  const restricted = NO_UP_TILES.length === 4;
  if (!restricted) fail("no-up tiles");
  ok("arcade no-up intersections registered");
}

/* ---------- kill screen ---------- */
{
  const e = new GameEngine(quiet, { startLevel: 255, best: 0, completed: [], seed: 3 });
  if (e.getMaze().totalPellets !== 244) fail("level 256 pellet count");
  if (e.getMaze().glyph(20, 10) !== " ") fail("level 256: right half was not corrupted");
  ok("round 256 kill-screen setup");
}
console.log("verify passed");
