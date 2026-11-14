import type { DirectionVector, GridPoint, LevelDefinition } from "./types";
import { GRID_WIDTH, TUNNEL_ROW, isTunnelColumn } from "./constants";

/**
 * One maze layout. Glyphs: `#` wall, `.` pellet, `o` power pellet, ` ` empty
 * path, `h` ghost-house floor, `-` ghost-house gate. Only the scripted ghost
 * house logic ever crosses `h` / `-`; everyone else treats them as solid.
 */
export class Maze {
  private readonly grid: string[][];
  private readonly pelletSet: Set<string>;
  private readonly powerSet: Set<string>;
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

  public static key(x: number, y: number): string {
    return `${x},${y}`;
  }

  public glyph(x: number, y: number): string {
    return this.grid[y]?.[x] ?? "#";
  }

  public isWall(x: number, y: number): boolean {
    return this.glyph(x, y) === "#";
  }

  public isGate(x: number, y: number): boolean {
    return this.glyph(x, y) === "-";
  }

  public isHouse(x: number, y: number): boolean {
    const g = this.glyph(x, y);
    return g === "h" || g === "-";
  }

  public isTunnel(x: number, y: number): boolean {
    return y === TUNNEL_ROW && isTunnelColumn(x);
  }

  /** Can an entity standing on tile centre (x, y) step one tile in `dir`? Handles the side tunnel wrap. */
  public canStep(x: number, y: number, dir: DirectionVector): boolean {
    const nx = x + dir.x;
    const ny = y + dir.y;
    if (ny < 0 || ny >= this.rowCount) return false;
    if (nx < 0 || nx >= this.columnCount) return ny === TUNNEL_ROW;
    const g = this.grid[ny]![nx]!;
    return g !== "#" && g !== "h" && g !== "-";
  }

  /** Wraps an x tile index through the tunnel. */
  public wrapX(x: number): number {
    return (x + GRID_WIDTH) % GRID_WIDTH;
  }

  public canStand(point: GridPoint): boolean {
    const g = this.glyph(point.x, point.y);
    return g !== "#" && g !== "h" && g !== "-";
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
