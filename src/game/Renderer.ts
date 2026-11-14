import type { GameEngine } from "./GameEngine";
import type { Ghost } from "./Ghost";
import type { Maze } from "./Maze";
import { BOARD_MARGIN, CANVAS_HEIGHT, CANVAS_WIDTH, CELL_SIZE, COLORS, FRUIT_POSITION, GRID_WIDTH } from "./constants";
import { EYE_INK, EYE_WHITE, FRIGHT_BODY, FRIGHT_MOUTH, GHOST_ART, type EyeSpec, type GhostArt } from "./ghostArt";
import { drawFruit } from "./fruitArt";
import { CLYDE_SHYNESS_RADIUS } from "./ghosts/ClydeGhost";
import type { GhostId } from "./types";

const CELL = CELL_SIZE;
const M = BOARD_MARGIN;
/** How far the drawn gold line sits inside each wall tile (tiles). Larger = wider corridors. */
const INSET = 0.24;
/** Characters are drawn larger than one tile, as in the arcade, so they read clearly on a phone. */
const PAC_RADIUS = CELL * 0.7;
const GHOST_BOX = CELL * 2.1;

const cx = (x: number): number => M + (x + 0.5) * CELL;
const cy = (y: number): number => M + (y + 0.5) * CELL;

interface V { x: number; y: number }

/** Outlines every connected block of wall tiles (wall on the right-hand side of travel). */
function traceLoops(isWall: (x: number, y: number) => boolean, width: number, height: number): V[][] {
  const edges = new Map<string, { to: V; used: boolean }[]>();
  const add = (a: V, b: V): void => {
    const k = `${a.x},${a.y}`;
    const list = edges.get(k) ?? [];
    list.push({ to: b, used: false });
    edges.set(k, list);
  };
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!isWall(x, y)) continue;
      if (!isWall(x, y - 1)) add({ x, y }, { x: x + 1, y });
      if (!isWall(x + 1, y)) add({ x: x + 1, y }, { x: x + 1, y: y + 1 });
      if (!isWall(x, y + 1)) add({ x: x + 1, y: y + 1 }, { x, y: y + 1 });
      if (!isWall(x - 1, y)) add({ x, y: y + 1 }, { x, y });
    }
  }
  const loops: V[][] = [];
  for (const [startKey, list] of edges) {
    for (const first of list) {
      if (first.used) continue;
      const [sx, sy] = startKey.split(",").map(Number) as [number, number];
      const loop: V[] = [{ x: sx, y: sy }];
      let edge = first;
      for (let guard = 0; guard < 5000; guard += 1) {
        edge.used = true;
        if (edge.to.x === sx && edge.to.y === sy) break;
        loop.push(edge.to);
        const nextList = edges.get(`${edge.to.x},${edge.to.y}`);
        const nxt = nextList?.find(e => !e.used);
        if (!nxt) break;
        edge = nxt;
      }
      loops.push(loop);
    }
  }
  return loops;
}

/** Drops collinear vertices and pushes the rest `inset` tiles into the wall. */
function insetLoop(loop: V[], inset: number): V[] {
  const n = loop.length;
  const dirOf = (a: V, b: V): V => ({ x: Math.sign(b.x - a.x), y: Math.sign(b.y - a.y) });
  const corners: V[] = [];
  for (let i = 0; i < n; i += 1) {
    const prev = loop[(i + n - 1) % n]!;
    const cur = loop[i]!;
    const next = loop[(i + 1) % n]!;
    const a = dirOf(prev, cur);
    const b = dirOf(cur, next);
    if (a.x === b.x && a.y === b.y) continue;
    // inward (right-hand) normal of a direction (dx, dy) is (-dy, dx)
    corners.push({ x: cur.x + (-a.y - b.y) * inset, y: cur.y + (a.x + b.x) * inset });
  }
  return corners;
}

function roundedLoop(ctx: CanvasRenderingContext2D, pts: V[], radius: number): void {
  const n = pts.length;
  if (n < 3) return;
  const mid = (a: V, b: V): V => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const len = (a: V, b: V): number => Math.hypot(a.x - b.x, a.y - b.y);
  const start = mid(pts[0]!, pts[1]!);
  ctx.moveTo(M + start.x * CELL, M + start.y * CELL);
  for (let i = 1; i <= n; i += 1) {
    const p = pts[i % n]!;
    const prev = pts[(i + n - 1) % n]!;
    const nxt = pts[(i + 1) % n]!;
    const r = Math.min(radius, len(prev, p) / 2, len(p, nxt) / 2) * CELL;
    ctx.arcTo(M + p.x * CELL, M + p.y * CELL, M + nxt.x * CELL, M + nxt.y * CELL, r);
  }
  ctx.closePath();
}

interface PelletSpot { readonly key: string; readonly x: number; readonly y: number; readonly power: boolean }

/**
 * Paints the maze as thin gold lines on warm black, the way the arcade did,
 * so corridors stay wide and Pac-Man and the ghosts can be drawn large.
 * Static scenery is cached on an offscreen canvas.
 */
export class Renderer {
  /** Device pixels per world unit, and the visible window (world units, top-left) of the camera. */
  private k = 1;
  private zoom = 1;
  private camX = 0;
  private camY = 0;
  private lastClock = 0;
  private cache: { key: string; canvas: HTMLCanvasElement } | null = null;
  private readonly paths: Readonly<Record<GhostId, Path2D>>;
  private readonly details: Readonly<Record<GhostId, Path2D>>;
  private readonly lids: Readonly<Record<GhostId, Path2D | null>>;
  private readonly accessories: Readonly<Record<GhostId, Path2D | null>>;
  private readonly mouth = new Path2D(FRIGHT_MOUTH);
  private pelletSpots = new WeakMap<Maze, readonly PelletSpot[]>();

  public constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly canvas: HTMLCanvasElement
  ) {
    const ids = Object.keys(GHOST_ART) as GhostId[];
    const build = <T>(fn: (art: GhostArt) => T): Record<GhostId, T> =>
      Object.fromEntries(ids.map(id => [id, fn(GHOST_ART[id])])) as Record<GhostId, T>;
    this.paths = build(a => new Path2D(a.body));
    this.details = build(a => new Path2D(a.detail));
    this.lids = build(a => (a.lids ? new Path2D(a.lids) : null));
    this.accessories = build(a => (a.accessory ? new Path2D(a.accessory) : null));
  }

  /**
   * Sizes the backing store for crisp output on high-DPI screens.
   * `zoom` 1 shows the whole board across the width; larger values crop to a
   * window that follows Pac-Man, so everything is drawn bigger on a phone.
   */
  public configure(cssWidth: number, cssHeight: number, dpr: number, zoom: number): void {
    const px = Math.max(160, Math.round(cssWidth * dpr));
    const py = Math.max(160, Math.round(cssHeight * dpr));
    const k = (px / CANVAS_WIDTH) * zoom;
    if (px === this.canvas.width && py === this.canvas.height && k === this.k) return;
    this.canvas.width = px;
    this.canvas.height = py;
    this.k = k;
    this.zoom = zoom;
    this.cache = null;
    this.camX = Number.NaN;
    this.camY = Number.NaN;
  }

  /** Moves the window so Pac-Man (plus a little look-ahead) stays centred, clamped to the board. */
  private updateCamera(engine: GameEngine): void {
    const visW = this.canvas.width / this.k;
    const visH = this.canvas.height / this.k;
    const pac = engine.getPacman();
    const p = pac.renderPosition();
    const look = this.zoom > 1 ? 1.8 : 0;
    const tx = cx(p.x + pac.facing.x * look) - visW / 2;
    const ty = cy(p.y + pac.facing.y * look) - visH / 2;
    const fit = (target: number, vis: number, total: number): number =>
      vis >= total ? (total - vis) / 2 : Math.max(0, Math.min(total - vis, target));
    const goalX = fit(tx, visW, CANVAS_WIDTH);
    const goalY = fit(ty, visH, CANVAS_HEIGHT);
    const dt = Math.min(0.1, Math.max(0, engine.getClock() - this.lastClock));
    this.lastClock = engine.getClock();
    const jump = Number.isNaN(this.camX) || Math.abs(goalX - this.camX) > CANVAS_WIDTH * 0.35 || engine.getMode() === "ready";
    const a = jump ? 1 : 1 - Math.exp(-dt * 9);
    this.camX = Number.isNaN(this.camX) ? goalX : this.camX + (goalX - this.camX) * a;
    this.camY = Number.isNaN(this.camY) ? goalY : this.camY + (goalY - this.camY) * a;
    if (jump) { this.camX = goalX; this.camY = goalY; }
  }

  public draw(engine: GameEngine): void {
    const ctx = this.ctx;
    const k = this.k;
    const maze = engine.getMaze();
    const clock = engine.getClock();
    const mode = engine.getMode();
    const killScreen = engine.getLevelIndex() === 255;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const flash = mode === "clearing" && Math.floor(engine.getClearProgress() * 8) % 2 === 1;
    this.updateCamera(engine);
    const layer = this.staticLayer(maze, killScreen, flash);
    const sk = layer.width / CANVAS_WIDTH;
    ctx.drawImage(layer, this.camX * sk, this.camY * sk, (this.canvas.width / k) * sk, (this.canvas.height / k) * sk, 0, 0, this.canvas.width, this.canvas.height);
    ctx.setTransform(k, 0, 0, k, -this.camX * k, -this.camY * k);

    if (mode !== "clearing") this.drawPellets(maze, clock, killScreen);
    if (killScreen) this.drawKillScreen(clock);
    else if (engine.getFruitTime() > 0 && mode !== "clearing") {
      const left = engine.getFruitTime();
      if (left > 2.2 || Math.floor(clock * 8) % 2 === 0) this.drawFruitAt(engine, clock);
    }
    if (mode !== "clearing") {
      const hideGhosts = mode === "dying" && engine.getDeathProgress() > 0;
      const pac = engine.getPacman().renderPosition();
      if (!hideGhosts) {
        // Eyes and vulnerable ghosts under the hunters, so a danger is never hidden behind a prize.
        const ordered = [...engine.getGhosts()].sort((a, b) => Number(b.isVulnerable || b.isEaten) - Number(a.isVulnerable || a.isEaten));
        for (const ghost of ordered) this.drawGhost(ghost, engine, pac);
      }
      this.drawPacman(engine);
    }
    if (mode === "ready") this.drawReady(clock);
    this.drawPopups(engine);
  }

  /* ------------------------------------------------------------------ */
  /* Static scenery                                                      */
  /* ------------------------------------------------------------------ */

  private staticLayer(maze: Maze, killScreen: boolean, flash: boolean): HTMLCanvasElement {
    // Scenery is rendered at screen density (capped), then cropped to the camera window each frame.
    const k = Math.min(this.k, 2600 / CANVAS_HEIGHT);
    const key = `${killScreen ? 1 : 0}|${flash ? 1 : 0}|${k.toFixed(3)}`;
    if (this.cache?.key === key) return this.cache.canvas;
    const canvas = this.cache?.canvas ?? document.createElement("canvas");
    canvas.width = Math.round(CANVAS_WIDTH * k);
    canvas.height = Math.round(CANVAS_HEIGHT * k);
    const g = canvas.getContext("2d");
    if (!g) return canvas;
    g.setTransform(k, 0, 0, k, 0, 0);
    g.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    g.save();
    if (killScreen) {
      // Round 256: only the left half of the picture survives; the right half is overdrawn with garbage.
      g.beginPath();
      g.rect(0, 0, M + 14 * CELL, CANVAS_HEIGHT);
      g.clip();
    }
    this.paintWalls(g, maze, flash);
    this.paintGate(g, maze);
    g.restore();
    this.cache = { key, canvas };
    return canvas;
  }

  private paintWalls(g: CanvasRenderingContext2D, maze: Maze, flash: boolean): void {
    const wall = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < maze.columnCount && y < maze.rowCount && maze.isWall(x, y);
    const loops = traceLoops(wall, maze.columnCount, maze.rowCount).map(l => insetLoop(l, INSET));
    const line = flash ? "#fffbe8" : COLORS.line;

    g.save();
    g.beginPath();
    for (const loop of loops) roundedLoop(g, loop, 0.34);
    g.fillStyle = flash ? "rgba(255,246,214,.16)" : "rgba(212,175,55,.07)";
    g.fill();

    g.lineJoin = "round";
    g.lineCap = "round";
    // soft halo
    g.strokeStyle = flash ? "rgba(255,246,214,.35)" : "rgba(212,175,55,.2)";
    g.lineWidth = CELL * 0.34;
    g.stroke();
    // crisp gold line
    g.strokeStyle = line;
    g.lineWidth = CELL * 0.11;
    g.stroke();
    g.restore();
  }

  private paintGate(g: CanvasRenderingContext2D, maze: Maze): void {
    for (let y = 0; y < maze.rowCount; y += 1) {
      for (let x = 0; x < maze.columnCount; x += 1) {
        if (!maze.isGate(x, y)) continue;
        g.fillStyle = "#f2a9cf";
        g.shadowColor = "rgba(242,169,207,.6)";
        g.shadowBlur = 8;
        g.fillRect(M + x * CELL, M + y * CELL + CELL * 0.4, CELL, CELL * 0.18);
        g.shadowBlur = 0;
      }
    }
  }

  private drawKillScreen(clock: number): void {
    const ctx = this.ctx;
    const glyphs = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*+?";
    ctx.save();
    ctx.beginPath();
    ctx.rect(M + 14 * CELL, M, CELL * 14, CELL * 31);
    ctx.clip();
    ctx.globalAlpha = 0.94;
    ctx.font = `700 ${CELL * 0.7}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let y = 0; y < 31; y += 1) {
      for (let x = 14; x < 28; x += 1) {
        const code = (x * 17 + y * 31 + Math.floor(clock * 2)) % glyphs.length;
        const hue = (x * 41 + y * 29) % 360;
        ctx.fillStyle = `hsl(${hue} 85% 65%)`;
        ctx.fillText(glyphs[code]!, cx(x), cy(y));
      }
    }
    ctx.restore();
  }

  private drawFruitAt(engine: GameEngine, clock: number): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(cx(FRUIT_POSITION.x), cy(FRUIT_POSITION.y) + Math.sin(clock * 5) * CELL * 0.04);
    drawFruit(ctx, engine.getFruit().name, CELL * 1.7);
    ctx.restore();
  }

  private drawReady(clock: number): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `800 ${CELL * 1.05}px "Iowan Old Style", Georgia, serif`;
    ctx.lineWidth = 5;
    ctx.strokeStyle = "rgba(0,0,0,.85)";
    ctx.fillStyle = COLORS.pac;
    ctx.globalAlpha = 0.9 + Math.sin(clock * 5) * 0.1;
    ctx.strokeText("READY!", cx(13.5), cy(17));
    ctx.fillText("READY!", cx(13.5), cy(17));
    ctx.restore();
  }

  /* ------------------------------------------------------------------ */
  /* Dynamic layer                                                       */
  /* ------------------------------------------------------------------ */

  private spots(maze: Maze): readonly PelletSpot[] {
    let list = this.pelletSpots.get(maze);
    if (!list) {
      list = Array.from(maze.pellets, key => {
        const [xr, yr] = key.split(",");
        const x = Number(xr);
        const y = Number(yr);
        return { key, x, y, power: maze.isPowerPellet(x, y) };
      });
      this.pelletSpots.set(maze, list);
    }
    return list;
  }

  private drawPellets(maze: Maze, clock: number, killScreen = false): void {
    const ctx = this.ctx;
    const pulse = 0.5 + 0.5 * Math.sin(clock * 7);
    for (const s of this.spots(maze)) {
      if (!maze.pellets.has(s.key)) continue;
      if (killScreen && s.x >= 14) continue; // still there in the game logic, just not drawn
      const px = cx(s.x);
      const py = cy(s.y);
      if (s.power) {
        const r = CELL * (0.3 + pulse * 0.06);
        const halo = ctx.createRadialGradient(px, py, 0, px, py, r * 2.6);
        halo.addColorStop(0, "rgba(255,226,140,.6)");
        halo.addColorStop(1, "rgba(212,175,55,0)");
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(px, py, r * 2.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff3c4";
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = "#f4ead0";
        ctx.beginPath();
        ctx.arc(px, py, CELL * 0.1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  /** Draws `draw(px)` once, plus a mirrored copy while crossing the tunnel edge. */
  private wrap(x: number, draw: (px: number) => void): void {
    draw(x);
    if (x < 1) draw(x + GRID_WIDTH);
    if (x > GRID_WIDTH - 2) draw(x - GRID_WIDTH);
  }

  private drawPacman(engine: GameEngine): void {
    const ctx = this.ctx;
    const pac = engine.getPacman();
    const mode = engine.getMode();
    const pos = pac.renderPosition();
    const progress = mode === "dying" ? engine.getDeathProgress() : 0;
    const angle = Math.atan2(pac.facing.y, pac.facing.x);
    const open = mode === "dying" ? 0.1 + progress * (Math.PI - 0.1) : pac.mouthPhase;
    if (mode === "dying" && progress >= 0.98) return;

    this.wrap(pos.x, wx => {
      const px = cx(wx);
      const py = cy(pos.y);
      const r = PAC_RADIUS;
      const halo = ctx.createRadialGradient(px, py, r * 0.7, px, py, r * 2);
      halo.addColorStop(0, "rgba(255,216,74,.32)");
      halo.addColorStop(1, "rgba(255,216,74,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(px, py, r * 2, 0, Math.PI * 2);
      ctx.fill();

      const body = ctx.createRadialGradient(px - r * 0.35, py - r * 0.4, r * 0.1, px, py, r * 1.05);
      body.addColorStop(0, "#fff08a");
      body.addColorStop(0.55, COLORS.pac);
      body.addColorStop(1, "#d9a516");
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.arc(px, py, r, angle + open, angle + Math.PI * 2 - open);
      ctx.closePath();
      ctx.fill();
    });

    // Shows what the game understood from your swipe until it is carried out (or forgotten).
    const queued = pac.hasQueuedTurn;
    if (queued.x !== 0 || queued.y !== 0) {
      const px = cx(pos.x + queued.x * 1.25);
      const py = cy(pos.y + queued.y * 1.25);
      const a = Math.atan2(queued.y, queued.x);
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(a);
      ctx.fillStyle = "rgba(255,226,120,.92)";
      ctx.strokeStyle = "rgba(0,0,0,.55)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(CELL * 0.34, 0);
      ctx.lineTo(-CELL * 0.2, -CELL * 0.3);
      ctx.lineTo(-CELL * 0.2, CELL * 0.3);
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
      ctx.restore();
    }
  }

  private drawEyes(eyes: readonly EyeSpec[], dx: number, dy: number): void {
    const ctx = this.ctx;
    for (const eye of eyes) {
      ctx.fillStyle = EYE_WHITE;
      ctx.beginPath();
      ctx.ellipse(eye.x, eye.y, eye.rx, eye.ry, 0, 0, Math.PI * 2);
      ctx.fill();
      const pr = Math.min(eye.rx, eye.ry) * 0.66;
      ctx.fillStyle = "#1b2a8c";
      ctx.beginPath();
      ctx.arc(eye.x + dx * (eye.rx - pr) * 0.95, eye.y + dy * (eye.ry - pr) * 0.95, pr, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawGhost(ghost: Ghost, engine: GameEngine, pac: { x: number; y: number }): void {
    const ctx = this.ctx;
    const art = GHOST_ART[ghost.id];
    const pos = ghost.renderPosition();
    const clock = engine.getClock();
    const frightened = ghost.frightened && !ghost.isEaten;
    const flashing = frightened && engine.getFrightLeft() < engine.getFlashWindow() && Math.floor(clock * 5) % 2 === 0;
    const bob = Math.sin(clock * 9 + ghost.id.length * 1.7) * CELL * 0.03;
    let lookX = ghost.direction.x;
    let lookY = ghost.direction.y;
    if (ghost.id === "clyde" && !frightened && !ghost.isEaten && Math.hypot(pos.x - pac.x, pos.y - pac.y) < CLYDE_SHYNESS_RADIUS) {
      lookX = lookX === 0 ? 0 : -lookX;
      lookY = lookY === 0 ? 0 : -lookY;
    }

    this.wrap(pos.x, wx => {
      const px = cx(wx);
      const py = cy(pos.y) + bob;
      ctx.save();
      ctx.translate(px, py - CELL * 0.05);
      ctx.scale(GHOST_BOX / 100, GHOST_BOX / 100);
      ctx.translate(-50, -52);

      if (ghost.isEaten) {
        this.drawEyes(art.eyes, lookX, lookY);
        ctx.restore();
        return;
      }

      const body = frightened ? (flashing ? "#f7f3e8" : FRIGHT_BODY.body) : art.color;
      const light = frightened ? (flashing ? "#ffffff" : FRIGHT_BODY.light) : art.light;
      const shade = frightened ? (flashing ? "#b9b2a0" : FRIGHT_BODY.shade) : ghost.rage > 0 ? "#ffb347" : art.shade;
      const fill = ctx.createLinearGradient(0, 8, 0, 92);
      fill.addColorStop(0, light);
      fill.addColorStop(0.45, body);
      fill.addColorStop(1, body);
      ctx.fillStyle = fill;
      ctx.fill(this.paths[ghost.id]);

      if (art.split && !frightened) {
        ctx.save();
        ctx.clip(this.paths[ghost.id]);
        ctx.fillStyle = "rgba(255,255,255,.22)";
        ctx.fillRect(50, 0, 50, 100);
        ctx.restore();
      }

      ctx.lineJoin = "round";
      ctx.lineWidth = 3.4;
      ctx.strokeStyle = shade;
      ctx.stroke(this.paths[ghost.id]);

      if (!frightened) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(255,255,255,.45)";
        ctx.lineCap = "round";
        ctx.stroke(this.details[ghost.id]);
        const accessory = this.accessories[ghost.id];
        if (accessory) {
          ctx.fillStyle = shade;
          ctx.fill(accessory);
        }
        this.drawEyes(art.eyes, lookX, lookY);
        const lids = this.lids[ghost.id];
        if (lids) {
          ctx.strokeStyle = EYE_INK;
          ctx.lineWidth = 5;
          ctx.stroke(lids);
        }
        if (art.blush) {
          ctx.fillStyle = "rgba(231,120,120,.5)";
          for (const bx of [24, 76]) {
            ctx.beginPath();
            ctx.ellipse(bx, 70, 6, 3.6, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else {
        ctx.fillStyle = flashing ? "#d9482f" : "#f7e9c7";
        for (const ex of [38, 62]) {
          ctx.beginPath();
          ctx.arc(ex, 54, 4.6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.strokeStyle = flashing ? "#d9482f" : "#f7e9c7";
        ctx.lineWidth = 3.6;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke(this.mouth);
      }
      ctx.restore();
    });
  }

  private drawPopups(engine: GameEngine): void {
    const ctx = this.ctx;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const popup of engine.getPopups()) {
      const t = popup.age / 1.1;
      ctx.globalAlpha = Math.max(0, 1 - Math.max(0, t - 0.6) / 0.4);
      ctx.font = `800 ${Math.round(CELL * 0.85)}px "Iowan Old Style", Georgia, serif`;
      ctx.lineWidth = 5;
      ctx.strokeStyle = "rgba(0,0,0,.85)";
      const px = Math.max(CELL * 1.6, Math.min(CANVAS_WIDTH - CELL * 1.6, cx(popup.x)));
      const py = cy(popup.y) - t * CELL * 0.9;
      ctx.strokeText(popup.text, px, py);
      ctx.fillStyle = "#8ff0ff";
      ctx.fillText(popup.text, px, py);
    }
    ctx.globalAlpha = 1;
  }
}
