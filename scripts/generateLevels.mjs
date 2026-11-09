/**
 * Deterministic maze generator for Aurum Maze.
 *
 * Usage:  node scripts/generateLevels.mjs
 * Output: src/game/levelData.ts  (50 validated, left/right symmetric mazes)
 *
 * Every maze satisfies the arcade rules: no dead ends, no 2x2 open plazas,
 * one connected network, a central ghost house with a single door, and a
 * wrap-around tunnel on the house row.
 *
 * Tile glyphs:  # wall   . pellet   o power pellet   (space) empty path
 *               h ghost-house floor   - ghost-house door
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const N = 15;
const MID = 7;
const LEVELS = 50;

const FIXED_OPEN = new Set();
const FIXED_WALL = new Set();
const HOUSE = new Set();
const key = (x, y) => `${x},${y}`;

// Border (tunnel mouths on row 7 stay open).
for (let i = 0; i < N; i += 1) {
  for (const [x, y] of [[i, 0], [i, N - 1], [0, i], [N - 1, i]]) {
    if (y === MID && (x === 0 || x === N - 1)) continue;
    FIXED_WALL.add(key(x, y));
  }
}
// Ghost house: rows 6-8, cols 5-9. Door at (7,6); interior is row 7, cols 6-8.
for (let y = 6; y <= 8; y += 1) for (let x = 5; x <= 9; x += 1) HOUSE.add(key(x, y));
// Corridor ring around the house + tunnel + start area.
for (let x = 4; x <= 10; x += 1) { FIXED_OPEN.add(key(x, 5)); FIXED_OPEN.add(key(x, 9)); }
for (let y = 5; y <= 9; y += 1) { FIXED_OPEN.add(key(4, y)); FIXED_OPEN.add(key(10, y)); }
for (let x = 0; x <= 14; x += 1) if (!HOUSE.has(key(x, MID))) FIXED_OPEN.add(key(x, MID));
for (const x of [1, 2, 3, 11, 12, 13]) { FIXED_WALL.add(key(x, 6)); FIXED_WALL.add(key(x, 8)); }
for (let x = 6; x <= 8; x += 1) FIXED_OPEN.add(key(x, 11));
FIXED_OPEN.add(key(7, 12));

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const mirror = (x) => N - 1 - x;

function buildGrid(walls) {
  const g = [];
  for (let y = 0; y < N; y += 1) {
    g.push([]);
    for (let x = 0; x < N; x += 1) {
      const k = key(x, y);
      g[y].push(HOUSE.has(k) ? "H" : walls.has(k) ? "#" : ".");
    }
  }
  return g;
}

const open = (g, x, y) => {
  if (y < 0 || y >= N) return false;
  if (x < 0) x = N - 1; // tunnel wrap
  if (x >= N) x = 0;
  return g[y][x] === ".";
};

function openNeighbours(g, x, y) {
  let c = 0;
  if (open(g, x + 1, y)) c += 1;
  if (open(g, x - 1, y)) c += 1;
  if (open(g, x, y + 1)) c += 1;
  if (open(g, x, y - 1)) c += 1;
  // the ring around the house touches the door tile only through (7,5)
  return c;
}

function valid(g) {
  let first = null;
  let total = 0;
  for (let y = 0; y < N; y += 1) for (let x = 0; x < N; x += 1) {
    if (!open(g, x, y)) continue;
    total += 1;
    first ??= [x, y];
    if (openNeighbours(g, x, y) < 2) return false;
  }
  if (!first) return false;
  const seen = new Set([key(...first)]);
  const stack = [first];
  while (stack.length) {
    const [x, y] = stack.pop();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      let nx = x + dx;
      const ny = y + dy;
      if (nx < 0) nx = N - 1; else if (nx >= N) nx = 0;
      if (!open(g, nx, ny) || seen.has(key(nx, ny))) continue;
      seen.add(key(nx, ny));
      stack.push([nx, ny]);
    }
  }
  return seen.size === total;
}

function plazas(g) {
  const out = [];
  for (let y = 0; y < N - 1; y += 1) for (let x = 0; x < N - 1; x += 1) {
    if (open(g, x, y) && open(g, x + 1, y) && open(g, x, y + 1) && open(g, x + 1, y + 1)) out.push([x, y]);
  }
  return out;
}

const solidBlocks = (g) => {
  let n = 0;
  for (let y = 1; y < N - 2; y += 1) for (let x = 1; x < N - 2; x += 1) {
    if (g[y][x] === "#" && g[y][x + 1] === "#" && g[y + 1][x] === "#" && g[y + 1][x + 1] === "#"
      && g[y][x + 2] === "#" && g[y + 2][x] === "#") n += 1;
  }
  return n;
};

function tryBuild(seed, density) {
  const rand = rng(seed);
  const walls = new Set(FIXED_WALL);
  const free = [];
  for (let y = 1; y < N - 1; y += 1) for (let x = 1; x <= MID; x += 1) {
    const k = key(x, y);
    if (FIXED_OPEN.has(k) || FIXED_WALL.has(k) || HOUSE.has(k)) continue;
    free.push([x, y]);
  }
  const place = (x, y) => { walls.add(key(x, y)); walls.add(key(mirror(x), y)); };
  const remove = (x, y) => { walls.delete(key(x, y)); walls.delete(key(mirror(x), y)); };

  const order = free.slice().sort(() => rand() - 0.5);
  for (const [x, y] of order) {
    if (rand() > density) continue;
    place(x, y);
    if (!valid(buildGrid(walls))) remove(x, y);
  }
  // Break every remaining plaza.
  for (let guard = 0; guard < 80; guard += 1) {
    const g = buildGrid(walls);
    const p = plazas(g);
    if (p.length === 0) break;
    const [px, py] = p[Math.floor(rand() * p.length)];
    const cells = [[px, py], [px + 1, py], [px, py + 1], [px + 1, py + 1]]
      .filter(([x, y]) => x >= 1 && x <= N - 2 && y >= 1 && y <= N - 2 && !FIXED_OPEN.has(key(x, y)))
      .sort(() => rand() - 0.5);
    let done = false;
    for (const [x, y] of cells) {
      const xl = Math.min(x, mirror(x));
      place(xl, y);
      if (valid(buildGrid(walls))) { done = true; break; }
      remove(xl, y);
    }
    if (!done) return null;
  }
  const g = buildGrid(walls);
  if (plazas(g).length > 0 || !valid(g)) return null;
  return g;
}

function nearestOpen(g, tx, ty, xmin, xmax, ymin, ymax) {
  let best = null;
  let bd = Infinity;
  for (let y = ymin; y <= ymax; y += 1) for (let x = xmin; x <= xmax; x += 1) {
    if (g[y][x] !== "." || FIXED_OPEN.has(key(x, y)) && (y === MID)) continue;
    const d = (x - tx) ** 2 + (y - ty) ** 2;
    if (d < bd) { bd = d; best = [x, y]; }
  }
  return best;
}

function finish(g) {
  const rows = g.map((r) => r.map((c) => (c === "H" ? "#" : c)));
  for (let x = 6; x <= 8; x += 1) rows[7][x] = "h";
  rows[6][7] = "-";
  // Power pellets: nearest open cell to each corner (mirrored pairs).
  const tl = nearestOpen(g, 1, 1, 1, 6, 1, 4);
  const bl = nearestOpen(g, 1, 13, 1, 6, 10, 13);
  const power = [tl, bl].flatMap(([x, y]) => [[x, y], [mirror(x), y]]);
  for (const [x, y] of power) rows[y][x] = "o";
  // Pellet-free zones: tunnel, house exit, Pac-Man start.
  for (let x = 0; x <= 3; x += 1) { rows[MID][x] = " "; rows[MID][mirror(x)] = " "; }
  rows[5][7] = " ";
  rows[11][7] = " ";
  return rows.map((r) => r.join(""));
}

const count = (rows, ch) => rows.reduce((n, r) => n + [...r].filter((c) => c === ch).length, 0);

const results = [];
const seen = new Set();
for (let level = 0; level < LEVELS; level += 1) {
  const world = Math.floor(level / 10);
  const step = level % 10;
  let built = null;
  for (let attempt = 0; attempt < 4000 && !built; attempt += 1) {
    const seed = 9100 + level * 977 + attempt * 31;
    // Each world has a different character: sparser walls feel airy, denser walls feel cramped.
    const density = 0.5 + ((world * 7 + step * 3 + attempt) % 10) * 0.045;
    const g = tryBuild(seed, Math.min(0.97, density));
    if (!g) continue;
    const rows = finish(g);
    const pellets = count(rows, ".") + count(rows, "o");
    const junctions = g.reduce((n, r, y) => n + r.reduce((m, c, x) => m + (c === "." && openNeighbours(g, x, y) >= 3 ? 1 : 0), 0), 0);
    if (pellets < 78 || pellets > 118 || junctions < 20) continue;
    if (solidBlocks(g) > 3) continue;
    const id = rows.join("|");
    if (seen.has(id)) continue;
    seen.add(id);
    built = { rows, pellets, junctions };
  }
  if (!built) throw new Error(`Could not build level ${level + 1}`);
  results.push(built);
}

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(here, "../src/game/levelData.ts");
const body = results.map((r) => `  [\n${r.rows.map((row) => `    ${JSON.stringify(row)}`).join(",\n")}\n  ]`).join(",\n");
writeFileSync(
  out,
  `/* eslint-disable */\n// AUTO-GENERATED by scripts/generateLevels.mjs - do not edit by hand.\n// Glyphs: # wall, . pellet, o power pellet, space empty path, h house floor, - house door.\n\nexport const LEVEL_ROWS: readonly (readonly string[])[] = [\n${body}\n];\n`
);
console.log(`Wrote ${results.length} levels. Pellets: ${results.map((r) => r.pellets).join(",")}`);
results.slice(0, 3).forEach((r, i) => console.log(`\nLevel ${i + 1}\n${r.rows.join("\n")}`));
