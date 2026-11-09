import type { DirectionVector, GridPoint, LevelDefinition } from "./types";
import { ALL_DIRECTIONS, DIRECTIONS, TUNNEL_ROW } from "./constants";

/**
 * One maze layout. Glyphs: `#` wall, `.` pellet, `o` power pellet, ` ` empty
 * path, `h` ghost-house floor, `-` ghost-house door (ghosts only).
 */
export class Maze {
  private readonly grid: readonly string[][];
  private readonly pelletSet: Set<string>;
  private readonly powerSet: ReadonlySet<string>;
  public readonly rowCount: number;
  public readonly columnCount: number;
  public readonly totalPellets: number;

  public constructor(definition: LevelDefinition) {
    this.grid = definition.rows.map(row => row.split(""));
    this.rowCount = this.grid.length;
    this.columnCount = this.grid[0]?.length ?? 0;

    const pellets = new Set<string>();
    const power = new Set<string>();
    for (let y = 0; y < this.rowCount; y += 1) {
      for (let x = 0; x < this.columnCount; x += 1) {
        const glyph = this.grid[y]?.[x];
        if (glyph === "." || glyph === "o") pellets.add(Maze.key(x, y));
        if (glyph === "o") power.add(Maze.key(x, y));
      }
    }
    this.pelletSet = pellets;
    this.powerSet = power;
    this.totalPellets = pellets.size;
  }

  private static key(x: number, y: number): string {
    return `${x},${y}`;
  }

  /** Wraps x on the tunnel row; returns null when the cell is outside the board. */
  public resolve(point: GridPoint): GridPoint | null {
    if (point.y < 0 || point.y >= this.rowCount) return null;
    if (point.x >= 0 && point.x < this.columnCount) return point;
    if (point.y !== TUNNEL_ROW) return null;
    return { x: (point.x + this.columnCount) % this.columnCount, y: point.y };
  }

  public glyph(x: number, y: number): string {
    return this.grid[y]?.[x] ?? "#";
  }

  public isWall(x: number, y: number): boolean {
    return this.glyph(x, y) === "#";
  }

  public isDoor(x: number, y: number): boolean {
    return this.glyph(x, y) === "-";
  }

  public isHouse(x: number, y: number): boolean {
    const g = this.glyph(x, y);
    return g === "h" || g === "-";
  }

  public isTunnel(x: number, y: number): boolean {
    return y === TUNNEL_ROW && (x <= 2 || x >= this.columnCount - 3);
  }

  /** Whether an entity may stand on `point`. Only ghosts that are entering/leaving may use the house. */
  public canEnter(point: GridPoint, allowHouse = false): boolean {
    const cell = this.resolve(point);
    if (!cell) return false;
    const g = this.glyph(cell.x, cell.y);
    if (g === "#") return false;
    if (g === "h" || g === "-") return allowHouse;
    return true;
  }

  /** Breadth-first first step from `from` to `to`; null when unreachable. */
  public nextStep(from: GridPoint, to: GridPoint, allowHouse: boolean): DirectionVector | null {
    if (from.x === to.x && from.y === to.y) return null;
    const start = Maze.key(from.x, from.y);
    const seen = new Map<string, DirectionVector>();
    const queue: { x: number; y: number; first: DirectionVector | null }[] = [{ ...from, first: null }];
    seen.set(start, DIRECTIONS.none);
    for (let head = 0; head < queue.length; head += 1) {
      const node = queue[head]!;
      for (const dir of ALL_DIRECTIONS) {
        const cell = this.resolve({ x: node.x + dir.x, y: node.y + dir.y });
        if (!cell || !this.canEnter(cell, allowHouse)) continue;
        const k = Maze.key(cell.x, cell.y);
        if (seen.has(k)) continue;
        const first = node.first ?? dir;
        if (cell.x === to.x && cell.y === to.y) return first;
        seen.set(k, first);
        queue.push({ x: cell.x, y: cell.y, first });
      }
    }
    return null;
  }

  public get pellets(): ReadonlySet<string> {
    return this.pelletSet;
  }

  public get remainingPellets(): number {
    return this.pelletSet.size;
  }

  public isPowerPellet(x: number, y: number): boolean {
    return this.powerSet.has(Maze.key(x, y));
  }

  public consumePellet(x: number, y: number): boolean {
    return this.pelletSet.delete(Maze.key(x, y));
  }
}
