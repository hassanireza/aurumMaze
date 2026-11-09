import type { GameEngine } from "./GameEngine";
import type { Ghost } from "./Ghost";
import type { Maze } from "./Maze";
import { BOARD_MARGIN, CANVAS_SIZE, CELL_SIZE, COLORS, GRID_SIZE } from "./constants";
import { EYE_INK, EYE_WHITE, FRIGHT_MOUTH, GHOST_ART, type EyeSpec, type GhostArt } from "./ghostArt";
import { CLYDE_SHYNESS_RADIUS } from "./ghosts/ClydeGhost";
import { WORLDS } from "./worlds";
import type { GhostId, WorldTheme } from "./types";

const CELL = CELL_SIZE;
const ORIGIN = BOARD_MARGIN;
const BOARD = CELL * GRID_SIZE;
const WALL_DEPTH = CELL * 0.3;
const SLAB_DEPTH = 18;
const RADIUS = CELL * 0.3;

type Corners = readonly [number, number, number, number];

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: Corners): void {
  const [tl, tr, br, bl] = r;
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y);
  if (tr) ctx.arcTo(x + w, y, x + w, y + tr, tr); else ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + h - br);
  if (br) ctx.arcTo(x + w, y + h, x + w - br, y + h, br); else ctx.lineTo(x + w, y + h);
  ctx.lineTo(x + bl, y + h);
  if (bl) ctx.arcTo(x, y + h, x, y + h - bl, bl); else ctx.lineTo(x, y + h);
  ctx.lineTo(x, y + tl);
  if (tl) ctx.arcTo(x, y, x + tl, y, tl); else ctx.lineTo(x, y);
  ctx.closePath();
}

const cx = (x: number): number => ORIGIN + (x + 0.5) * CELL;
const cy = (y: number): number => ORIGIN + (y + 0.5) * CELL;

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  const c = (p: number, q: number): number => Math.round(p + (q - p) * t);
  return `rgb(${c(ar, br)},${c(ag, bg)},${c(ab, bb)})`;
}

/**
 * Paints the maze as a floating Monument-Valley-style platform: a slab with
 * visible thickness, pastel extruded walls with a lit top edge and a darker
 * south face, and a soft ambient shadow where walls meet the floor.
 * The static scenery is cached on an offscreen canvas per level/flash state.
 */
export class Renderer {
  private pixel = CANVAS_SIZE;
  private cache: { key: string; canvas: HTMLCanvasElement } | null = null;
  private readonly paths: Readonly<Record<GhostId, Path2D>>;
  private readonly details: Readonly<Record<GhostId, Path2D>>;
  private readonly lids: Readonly<Record<GhostId, Path2D | null>>;
  private readonly accessories: Readonly<Record<GhostId, Path2D | null>>;
  private readonly mouth = new Path2D(FRIGHT_MOUTH);

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

  /** Sizes the backing store for crisp output on high-DPI screens. */
  public resize(cssSize: number, dpr: number): void {
    const px = Math.max(240, Math.min(1600, Math.round(cssSize * dpr)));
    if (px === this.pixel && this.canvas.width === px) return;
    this.pixel = px;
    this.canvas.width = px;
    this.canvas.height = px;
    this.cache = null;
  }

  public draw(engine: GameEngine): void {
    const ctx = this.ctx;
    const k = this.pixel / CANVAS_SIZE;
    const theme = WORLDS[engine.getWorld()] ?? WORLDS[0]!;
    const maze = engine.getMaze();
    const clock = engine.getClock();
    const mode = engine.getMode();

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const flash = mode === "clearing" && Math.floor(engine.getClearProgress() * 8) % 2 === 1;
    ctx.drawImage(this.staticLayer(maze, theme, engine.getLevelIndex(), flash), 0, 0);
    ctx.setTransform(k, 0, 0, k, 0, 0);

    this.drawPellets(maze, theme, clock);
    if (mode !== "clearing") {
      this.drawPacman(engine);
      const ghostHidden = mode === "dying" && engine.getDeathProgress() > 0.25;
      if (!ghostHidden) {
        const pac = engine.getPacman().renderPosition();
        for (const [i, ghost] of engine.getGhosts().entries()) this.drawGhost(ghost, engine, i, pac);
      }
    }
    this.drawPopups(engine);
  }

  /* ------------------------------------------------------------------ */
  /* Static scenery                                                      */
  /* ------------------------------------------------------------------ */

  private staticLayer(maze: Maze, theme: WorldTheme, level: number, flash: boolean): HTMLCanvasElement {
    const key = `${level}|${flash ? 1 : 0}|${this.pixel}`;
    if (this.cache?.key === key) return this.cache.canvas;
    const canvas = this.cache?.canvas ?? document.createElement("canvas");
    canvas.width = this.pixel;
    canvas.height = this.pixel;
    const g = canvas.getContext("2d");
    if (!g) return canvas;
    const k = this.pixel / CANVAS_SIZE;
    g.setTransform(k, 0, 0, k, 0, 0);
    g.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    this.paintSlab(g, theme);
    this.paintFloor(g, maze, theme);
    this.paintWalls(g, maze, theme, flash);
    this.cache = { key, canvas };
    return canvas;
  }

  private paintSlab(g: CanvasRenderingContext2D, theme: WorldTheme): void {
    const pad = 10;
    const x = ORIGIN - pad;
    const y = ORIGIN - pad;
    const size = BOARD + pad * 2;

    g.save();
    g.shadowColor = "rgba(0,0,0,.65)";
    g.shadowBlur = 36;
    g.shadowOffsetY = 20;
    g.fillStyle = theme.wallSide;
    g.beginPath();
    roundedRect(g, x, y + SLAB_DEPTH, size, size, [18, 18, 18, 18]);
    g.fill();
    g.restore();

    const edge = g.createLinearGradient(0, y + size, 0, y + size + SLAB_DEPTH);
    edge.addColorStop(0, mix(theme.wallSide, "#000000", 0.25));
    edge.addColorStop(1, mix(theme.wallSide, "#000000", 0.7));
    g.fillStyle = edge;
    g.beginPath();
    roundedRect(g, x, y + SLAB_DEPTH, size, size, [18, 18, 18, 18]);
    g.fill();

    g.fillStyle = theme.floor;
    g.beginPath();
    roundedRect(g, x, y, size, size, [18, 18, 18, 18]);
    g.fill();
    g.strokeStyle = "rgba(212,175,55,.5)";
    g.lineWidth = 1.5;
    g.stroke();
  }

  private paintFloor(g: CanvasRenderingContext2D, maze: Maze, theme: WorldTheme): void {
    for (let y = 0; y < maze.rowCount; y += 1) {
      for (let x = 0; x < maze.columnCount; x += 1) {
        const glyph = maze.glyph(x, y);
        if (glyph === "#") continue;
        const px = ORIGIN + x * CELL;
        const py = ORIGIN + y * CELL;
        g.fillStyle = (x + y) % 2 === 0 ? theme.floorAlt : theme.floor;
        g.fillRect(px, py, CELL, CELL);
        if (glyph === "h" || glyph === "-") {
          g.fillStyle = "rgba(212,175,55,.07)";
          g.fillRect(px, py, CELL, CELL);
        }
      }
    }
    // soft moon-glow in the centre of the board
    const glow = g.createRadialGradient(cx(7), cy(7), 0, cx(7), cy(7), BOARD * 0.55);
    glow.addColorStop(0, mix(theme.glow, "#000000", 0.82).replace("rgb", "rgba").replace(")", ",.35)"));
    glow.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = glow;
    g.fillRect(ORIGIN, ORIGIN, BOARD, BOARD);
  }

  private paintWalls(g: CanvasRenderingContext2D, maze: Maze, theme: WorldTheme, flash: boolean): void {
    const wall = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < maze.columnCount && y < maze.rowCount && maze.isWall(x, y);
    const top = flash ? "#fff6d6" : theme.wallTop;
    const side = flash ? COLORS.gold : theme.wallSide;

    // 1) south faces + ambient shadow on the floor beneath them
    for (let y = 0; y < maze.rowCount; y += 1) {
      for (let x = 0; x < maze.columnCount; x += 1) {
        if (!wall(x, y) || wall(x, y + 1) || y + 1 >= maze.rowCount) continue;
        const px = ORIGIN + x * CELL;
        const py = ORIGIN + y * CELL;
        const bottom = py + CELL;
        const shade = g.createLinearGradient(0, bottom, 0, bottom + WALL_DEPTH + CELL * 0.22);
        shade.addColorStop(0, "rgba(0,0,0,.45)");
        shade.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = shade;
        g.fillRect(px, bottom, CELL, WALL_DEPTH + CELL * 0.22);

        const grad = g.createLinearGradient(0, py + CELL * 0.4, 0, bottom + WALL_DEPTH);
        grad.addColorStop(0, side);
        grad.addColorStop(1, mix(flash ? COLORS.gold : theme.wallSide, "#000000", 0.38));
        g.fillStyle = grad;
        g.beginPath();
        const rl = wall(x - 1, y) ? 0 : RADIUS * 0.8;
        const rr = wall(x + 1, y) ? 0 : RADIUS * 0.8;
        roundedRect(g, px - (wall(x - 1, y) ? 0.6 : 0), py + CELL * 0.4, CELL + (wall(x - 1, y) ? 0.6 : 0) + (wall(x + 1, y) ? 0.6 : 0), CELL * 0.6 + WALL_DEPTH, [0, 0, rr, rl]);
        g.fill();
      }
    }

    // 2) top faces
    for (let y = 0; y < maze.rowCount; y += 1) {
      for (let x = 0; x < maze.columnCount; x += 1) {
        if (!wall(x, y)) continue;
        const l = wall(x - 1, y);
        const r = wall(x + 1, y);
        const u = wall(x, y - 1);
        const d = wall(x, y + 1);
        const px = ORIGIN + x * CELL - (l ? 0.6 : 0);
        const py = ORIGIN + y * CELL - (u ? 0.6 : 0);
        const w = CELL + (l ? 0.6 : 0) + (r ? 0.6 : 0);
        const h = CELL + (u ? 0.6 : 0) + (d ? 0.6 : 0);
        const radii: Corners = [
          !l && !u ? RADIUS : 0,
          !r && !u ? RADIUS : 0,
          !r && !d ? RADIUS : 0,
          !l && !d ? RADIUS : 0
        ];
        g.fillStyle = top;
        g.beginPath();
        roundedRect(g, px, py, w, h, radii);
        g.fill();

        // lit north / west edges: the gold-line identity, as a soft highlight
        g.strokeStyle = flash ? "#ffffff" : theme.wallEdge;
        g.globalAlpha = 0.9;
        g.lineWidth = 2;
        g.lineCap = "round";
        if (!u) {
          g.beginPath();
          g.moveTo(px + (l ? 0 : RADIUS), py + 1.4);
          g.lineTo(px + w - (r ? 0 : RADIUS), py + 1.4);
          g.stroke();
        }
        if (!l) {
          g.beginPath();
          g.moveTo(px + 1.4, py + (u ? 0 : RADIUS));
          g.lineTo(px + 1.4, py + h - (d ? 0 : RADIUS));
          g.stroke();
        }
        g.globalAlpha = 1;
      }
    }

    // 3) ghost-house door: a glowing gold threshold
    for (let y = 0; y < maze.rowCount; y += 1) {
      for (let x = 0; x < maze.columnCount; x += 1) {
        if (!maze.isDoor(x, y)) continue;
        const px = ORIGIN + x * CELL;
        const py = ORIGIN + y * CELL;
        g.save();
        g.shadowColor = COLORS.gold;
        g.shadowBlur = 14;
        g.fillStyle = COLORS.gold;
        g.beginPath();
        roundedRect(g, px + 3, py + CELL * 0.42, CELL - 6, CELL * 0.16, [4, 4, 4, 4]);
        g.fill();
        g.restore();
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /* Dynamic layer                                                       */
  /* ------------------------------------------------------------------ */

  private drawPellets(maze: Maze, theme: WorldTheme, clock: number): void {
    const ctx = this.ctx;
    for (const key of maze.pellets) {
      const [xr, yr] = key.split(",");
      const x = Number(xr);
      const y = Number(yr);
      const px = cx(x);
      const py = cy(y);
      if (maze.isPowerPellet(x, y)) {
        const pulse = 1 + Math.sin(clock * 4 + x) * 0.12;
        const r = CELL * 0.2 * pulse;
        const halo = ctx.createRadialGradient(px, py, 0, px, py, r * 3);
        halo.addColorStop(0, "rgba(241,217,138,.55)");
        halo.addColorStop(1, "rgba(212,175,55,0)");
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(px, py, r * 3, 0, Math.PI * 2);
        ctx.fill();
        const orb = ctx.createRadialGradient(px - r * 0.3, py - r * 0.35, 0, px, py, r);
        orb.addColorStop(0, "#fff6d6");
        orb.addColorStop(1, COLORS.gold);
        ctx.fillStyle = orb;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = mix(theme.wallEdge, "#ffffff", 0.5);
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(px, py, CELL * 0.065, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
  }

  private wrap(x: number, draw: (px: number) => void): void {
    draw(x);
    if (x < 0.6) draw(x + GRID_SIZE);
    if (x > GRID_SIZE - 1.6) draw(x - GRID_SIZE);
  }

  private shadow(x: number, y: number, scale = 1): void {
    const ctx = this.ctx;
    ctx.fillStyle = "rgba(0,0,0,.5)";
    ctx.beginPath();
    ctx.ellipse(x, y + CELL * 0.3, CELL * 0.27 * scale, CELL * 0.09 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawPacman(engine: GameEngine): void {
    const ctx = this.ctx;
    const pac = engine.getPacman();
    const mode = engine.getMode();
    const pos = pac.renderPosition();
    const progress = mode === "dying" ? engine.getDeathProgress() : 0;
    const angle = Math.atan2(pac.facing.y, pac.facing.x);
    const open = mode === "dying" ? 0.25 + progress * (Math.PI - 0.25) : pac.mouthPhase;
    const scale = mode === "dying" ? Math.max(0, 1 - Math.max(0, progress - 0.55) / 0.45) : 1;
    if (scale <= 0) return;

    this.wrap(pos.x, wx => {
      const px = cx(wx);
      const py = cy(pos.y) - CELL * 0.04;
      const r = CELL * 0.36 * scale;
      this.shadow(px, py, scale);
      const halo = ctx.createRadialGradient(px, py, r * 0.8, px, py, r * 2);
      halo.addColorStop(0, "rgba(212,175,55,.28)");
      halo.addColorStop(1, "rgba(212,175,55,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(px, py, r * 2, 0, Math.PI * 2);
      ctx.fill();

      const body = ctx.createRadialGradient(px - r * 0.35, py - r * 0.4, r * 0.1, px, py, r * 1.05);
      body.addColorStop(0, "#f6dc7a");
      body.addColorStop(0.6, COLORS.gold);
      body.addColorStop(1, "#9c7d1b");
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.arc(px, py, r, angle + open, angle + Math.PI * 2 - open);
      ctx.closePath();
      ctx.fill();
    });
  }

  private drawEyes(eyes: readonly EyeSpec[], dx: number, dy: number, scaleBlink = 1): void {
    const ctx = this.ctx;
    for (const eye of eyes) {
      ctx.fillStyle = EYE_WHITE;
      ctx.beginPath();
      ctx.ellipse(eye.x, eye.y, eye.rx, eye.ry * scaleBlink, 0, 0, Math.PI * 2);
      ctx.fill();
      const pr = Math.min(eye.rx, eye.ry) * 0.62;
      ctx.fillStyle = EYE_INK;
      ctx.beginPath();
      ctx.arc(eye.x + dx * (eye.rx - pr) * 0.9, eye.y + dy * (eye.ry - pr) * 0.9, pr, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawGhost(ghost: Ghost, engine: GameEngine, index: number, pac: { x: number; y: number }): void {
    const ctx = this.ctx;
    const art = GHOST_ART[ghost.id];
    const pos = ghost.renderPosition();
    const clock = engine.getClock();
    const frightened = ghost.frightened && !ghost.isEaten;
    const flashing = frightened && engine.getFrightLeft() < 2 && Math.floor(clock * 6) % 2 === 0;
    const bob = ghost.phase === "house"
      ? Math.sin(ghost.bobClock * 5 + index) * CELL * 0.08
      : Math.sin(clock * 6 + index * 1.7) * CELL * 0.025;
    const size = CELL * 0.96;
    let lookX = ghost.direction.x;
    let lookY = ghost.direction.y;
    if (ghost.id === "clyde" && !frightened && Math.hypot(pos.x - pac.x, pos.y - pac.y) < CLYDE_SHYNESS_RADIUS) {
      lookX = -lookX || 1;
      lookY = -lookY;
    }

    this.wrap(pos.x, wx => {
      const px = cx(wx);
      const py = cy(pos.y) + bob;
      if (!ghost.isEaten) this.shadow(px, cy(pos.y), 1);

      ctx.save();
      ctx.translate(px, py - CELL * 0.04);
      ctx.scale(size / 100, size / 100);
      ctx.translate(-50, -52);

      if (ghost.isEaten) {
        ctx.shadowColor = "rgba(247,243,232,.6)";
        ctx.shadowBlur = 10;
        this.drawEyes(art.eyes, lookX, lookY);
        ctx.restore();
        return;
      }

      const body = frightened ? (flashing ? COLORS.frightenedFlash : COLORS.frightened) : art.color;
      const lightTone = frightened ? (flashing ? "#ffffff" : "#97a6cc") : art.light;
      const shadeTone = frightened ? (flashing ? "#b9b2a0" : "#3e4a6e") : art.shade;
      const fill = ctx.createLinearGradient(0, 8, 0, 90);
      fill.addColorStop(0, lightTone);
      fill.addColorStop(0.5, body);
      fill.addColorStop(1, mix(body.startsWith("#") ? body : art.color, "#000000", 0.18));

      if (ghost.rage > 0 && !frightened) {
        ctx.shadowColor = `rgba(255,120,40,${0.35 + ghost.rage * 0.5})`;
        ctx.shadowBlur = 14 + ghost.rage * 10;
      }
      ctx.fillStyle = fill;
      ctx.fill(this.paths[ghost.id]);
      ctx.shadowBlur = 0;
      ctx.shadowColor = "transparent";

      ctx.save();
      ctx.clip(this.paths[ghost.id]);
      if (art.split && !frightened) {
        ctx.fillStyle = "rgba(255,255,255,.22)";
        ctx.fillRect(50, 0, 50, 100);
      }
      ctx.restore();

      ctx.lineJoin = "round";
      ctx.lineWidth = 2.6;
      ctx.strokeStyle = shadeTone;
      ctx.stroke(this.paths[ghost.id]);

      if (!frightened) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(255,255,255,.5)";
        ctx.lineCap = "round";
        ctx.stroke(this.details[ghost.id]);
        const accessory = this.accessories[ghost.id];
        if (accessory) {
          ctx.fillStyle = shadeTone;
          ctx.fill(accessory);
        }
        this.drawEyes(art.eyes, lookX, lookY);
        const lids = this.lids[ghost.id];
        if (lids) {
          ctx.strokeStyle = EYE_INK;
          ctx.lineWidth = 4;
          ctx.lineCap = "round";
          ctx.stroke(lids);
        }
        if (art.blush) {
          ctx.fillStyle = "rgba(231,120,120,.45)";
          for (const bx of [24, 76]) {
            ctx.beginPath();
            ctx.ellipse(bx, 70, 6, 3.6, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else {
        ctx.fillStyle = flashing ? "#c0392b" : EYE_WHITE;
        for (const ex of [38, 62]) {
          ctx.beginPath();
          ctx.arc(ex, 54, 3.6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.strokeStyle = flashing ? "#c0392b" : EYE_WHITE;
        ctx.lineWidth = 3;
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
      ctx.font = `700 ${Math.round(CELL * 0.46)}px Georgia, "Iowan Old Style", serif`;
      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(0,0,0,.75)";
      const px = cx(popup.x);
      const py = cy(popup.y) - t * CELL * 0.8;
      ctx.strokeText(popup.text, px, py);
      ctx.fillStyle = COLORS.goldSoft;
      ctx.fillText(popup.text, px, py);
    }
    ctx.globalAlpha = 1;
  }
}
