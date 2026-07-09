import type { GameEngine } from "./GameEngine";
import type { Ghost } from "./Ghost";
import type { Maze } from "./Maze";
import { CANVAS_SIZE, COLORS } from "./constants";

const GHOST_PALETTE: Readonly<Record<string, string>> = {
  blinky: COLORS.blinky,
  pinky: COLORS.pinky,
  inky: COLORS.inky,
  clyde: COLORS.clyde
};

/** Pure rendering layer: takes engine state and paints it, no game logic here. */
export class Renderer {
  public constructor(private readonly ctx: CanvasRenderingContext2D) {}

  public draw(engine: GameEngine): void {
    const maze = engine.getMaze();
    const size = CANVAS_SIZE;
    const rows = maze.rowCount;
    const cell = size / rows;
    const ctx = this.ctx;
    const pulse = engine.getPulse();

    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = COLORS.black;
    ctx.fillRect(0, 0, size, size);
    ctx.save();
    ctx.translate(cell / 2, cell / 2);

    this.drawGridLines(rows, cell);
    this.drawWalls(maze, rows, cell);
    this.drawPellets(maze, cell, pulse);
    this.drawPacman(engine, cell, pulse);
    for (const ghost of engine.getGhosts()) this.drawGhost(ghost, cell, engine.isFrightened());

    ctx.restore();
  }

  private drawGridLines(rows: number, cell: number): void {
    const ctx = this.ctx;
    ctx.strokeStyle = "rgba(247,243,232,.16)";
    ctx.lineWidth = 1;
    for (let i = 0; i < rows; i += 1) {
      ctx.beginPath();
      ctx.moveTo(0, i * cell);
      ctx.lineTo((rows - 1) * cell, i * cell);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(i * cell, 0);
      ctx.lineTo(i * cell, (rows - 1) * cell);
      ctx.stroke();
    }
  }

  private drawWalls(maze: Maze, rows: number, cell: number): void {
    const ctx = this.ctx;
    ctx.lineWidth = 3;
    ctx.strokeStyle = COLORS.ink;
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < rows; x += 1) {
        if (!maze.isWall(x, y)) continue;
        const px = x * cell;
        const py = y * cell;
        ctx.strokeRect(px - cell * 0.46, py - cell * 0.46, cell * 0.92, cell * 0.92);
      }
    }
  }

  private drawPellets(maze: Maze, cell: number, pulse: number): void {
    const ctx = this.ctx;
    for (const key of maze.pellets) {
      const [xRaw, yRaw] = key.split(",");
      const x = Number(xRaw);
      const y = Number(yRaw);
      const special = maze.isPowerPellet(x, y);
      ctx.beginPath();
      ctx.fillStyle = special ? COLORS.gold : "rgba(247,243,232,.78)";
      ctx.arc(x * cell, y * cell, special ? cell * 0.12 + Math.sin(pulse * 5) * 1.2 : cell * 0.055, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawPacman(engine: GameEngine, cell: number, pulse: number): void {
    const ctx = this.ctx;
    const pacman = engine.getPacman();
    const point = pacman.renderPosition();
    const mouth = pacman.mouthPhase;
    const angle = Math.atan2(pacman.facing.y, pacman.facing.x);

    ctx.fillStyle = COLORS.gold;
    ctx.beginPath();
    ctx.moveTo(point.x * cell, point.y * cell);
    ctx.arc(point.x * cell, point.y * cell, cell * 0.34, angle + mouth, angle + Math.PI * 2 - mouth);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(point.x * cell, point.y * cell, cell * 0.43 + Math.sin(pulse * 8) * 2, 0, Math.PI * 2);
    ctx.stroke();
  }

  private drawGhost(ghost: Ghost, cell: number, globalFrightened: boolean): void {
    const ctx = this.ctx;
    const point = ghost.renderPosition();
    const x = point.x * cell;
    const y = point.y * cell;
    const frightened = ghost.isVulnerable;
    const eaten = ghost.isEaten;

    const bodyColor = frightened ? COLORS.frightened : GHOST_PALETTE[ghost.id] ?? COLORS.ink;

    if (eaten) {
      ctx.strokeStyle = COLORS.ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x - cell * 0.1, y - cell * 0.04, 2.2, 0, Math.PI * 2);
      ctx.arc(x + cell * 0.1, y - cell * 0.04, 2.2, 0, Math.PI * 2);
      ctx.stroke();
      return;
    }

    ctx.strokeStyle = bodyColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y - cell * 0.05, cell * 0.28, Math.PI, 0);
    ctx.lineTo(x + cell * 0.28, y + cell * 0.27);
    ctx.lineTo(x + cell * 0.1, y + cell * 0.15);
    ctx.lineTo(x - cell * 0.06, y + cell * 0.27);
    ctx.lineTo(x - cell * 0.28, y + cell * 0.15);
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = frightened || globalFrightened ? "rgba(215,167,47,.08)" : "rgba(247,243,232,.035)";
    ctx.fill();

    ctx.fillStyle = COLORS.ink;
    ctx.beginPath();
    ctx.arc(x - cell * 0.1, y - cell * 0.04, 2.2, 0, Math.PI * 2);
    ctx.arc(x + cell * 0.1, y - cell * 0.04, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
}
