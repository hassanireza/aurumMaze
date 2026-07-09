import type { GridPoint, LevelDefinition } from "./types";
import { GHOST_SPAWNS } from "./constants";

/** Represents a single maze layout: walls plus the pellets living inside it. */
export class Maze {
  private readonly grid: readonly (readonly number[])[];
  private readonly pelletSet: Set<string>;
  private readonly powerPelletKeys: ReadonlySet<string>;
  public readonly rowCount: number;
  public readonly columnCount: number;

  public constructor(definition: LevelDefinition) {
    this.grid = definition.rows.map(row => row.split("").map(Number));
    this.rowCount = this.grid.length;
    this.columnCount = this.grid[0]?.length ?? 0;

    const spawnKeys = new Set(
      Object.values(GHOST_SPAWNS).map(spawn => Maze.key(spawn.x, spawn.y))
    );
    const powerKeys = new Set<string>();
    const pellets = new Set<string>();

    for (let y = 0; y < this.rowCount; y += 1) {
      for (let x = 0; x < this.columnCount; x += 1) {
        if (this.grid[y]?.[x]) continue;
        if (spawnKeys.has(Maze.key(x, y))) continue;
        pellets.add(Maze.key(x, y));
        const isPowerCorner = (x === 1 || x === 13) && (y === 1 || y === 13);
        if (isPowerCorner) powerKeys.add(Maze.key(x, y));
      }
    }

    this.pelletSet = pellets;
    this.powerPelletKeys = powerKeys;
  }

  private static key(x: number, y: number): string {
    return `${x},${y}`;
  }

  public isWall(x: number, y: number): boolean {
    if (y < 0 || y >= this.rowCount || x < 0 || x >= this.columnCount) return true;
    return this.grid[y]?.[x] === 1;
  }

  public canEnter(point: GridPoint): boolean {
    return !this.isWall(point.x, point.y);
  }

  public get pellets(): ReadonlySet<string> {
    return this.pelletSet;
  }

  public get remainingPellets(): number {
    return this.pelletSet.size;
  }

  public isPowerPellet(x: number, y: number): boolean {
    return this.powerPelletKeys.has(Maze.key(x, y));
  }

  public consumePellet(x: number, y: number): boolean {
    return this.pelletSet.delete(Maze.key(x, y));
  }
}
