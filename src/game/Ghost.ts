import { Entity } from "./Entity";
import { ALL_DIRECTIONS, DIRECTIONS, BASE_GHOST_SPEED, GHOST_SPEED_PER_LEVEL } from "./constants";
import type { DirectionVector, GhostId, GhostMotionMode, GridPoint } from "./types";
import type { Maze } from "./Maze";
import type { PacMan } from "./PacMan";

export interface GhostContext {
  readonly pacman: PacMan;
  readonly blinkyPosition: GridPoint;
  readonly maze: Maze;
  readonly pulse: number;
}

/**
 * Shared skeleton for every ghost personality. Concrete subclasses only need
 * to describe where they want to go (their "target tile") for chase mode;
 * scatter, frightened and eaten behaviour is identical for all four.
 */
export abstract class Ghost extends Entity {
  public abstract readonly id: GhostId;
  public abstract readonly displayName: string;
  public abstract readonly personality: string;
  protected abstract readonly scatterCorner: GridPoint;

  public mode: GhostMotionMode = "scatter";
  protected readonly spawnPoint: GridPoint;
  private readonly baseSpeed: number;

  protected constructor(spawn: GridPoint, direction: DirectionVector, levelIndex: number) {
    super(spawn, direction);
    this.spawnPoint = spawn;
    this.baseSpeed = BASE_GHOST_SPEED + levelIndex * GHOST_SPEED_PER_LEVEL;
  }

  /** Where this ghost wants to head while actively hunting Pac-Man. */
  protected abstract getChaseTarget(context: GhostContext): GridPoint;

  private currentSpeed(): number {
    switch (this.mode) {
      case "frightened":
        return this.baseSpeed * 0.55;
      case "eaten":
        return this.baseSpeed * 2.1;
      default:
        return this.baseSpeed;
    }
  }

  private currentTarget(context: GhostContext): GridPoint {
    switch (this.mode) {
      case "scatter":
        return this.scatterCorner;
      case "eaten":
        return this.spawnPoint;
      case "frightened":
        return { x: context.pacman.x, y: context.pacman.y };
      case "chase":
      default:
        return this.getChaseTarget(context);
    }
  }

  private chooseDirection(context: GhostContext): DirectionVector {
    const options = ALL_DIRECTIONS.filter(
      dir =>
        this.canMove(context.maze, dir) &&
        !(dir.x === -this.direction.x && dir.y === -this.direction.y)
    );
    if (options.length === 0) return { x: -this.direction.x, y: -this.direction.y, name: "none" };

    if (this.mode === "frightened") {
      const index = Math.floor(Math.abs(Math.sin(context.pulse * 3 + this.x + this.y)) * options.length);
      return options[Math.min(index, options.length - 1)] ?? options[0]!;
    }

    const target = this.currentTarget(context);
    let best = options[0]!;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const dir of options) {
      const distance = Math.hypot(this.x + dir.x - target.x, this.y + dir.y - target.y);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = dir;
      }
    }
    return best;
  }

  public update(context: GhostContext, dt: number): void {
    if (this.mode === "eaten" && this.x === this.spawnPoint.x && this.y === this.spawnPoint.y) {
      this.mode = "chase";
    }
    this.advanceCell(context.maze, dt, this.currentSpeed(), () => {
      this.direction = this.chooseDirection(context);
    });
  }

  public startFrightened(): void {
    if (this.mode !== "eaten") this.mode = "frightened";
  }

  public setHuntMode(mode: "scatter" | "chase"): void {
    if (this.mode !== "eaten" && this.mode !== "frightened") this.mode = mode;
  }

  public markEaten(): void {
    this.mode = "eaten";
  }

  public respawn(): void {
    this.resetTo(this.spawnPoint, DIRECTIONS.up);
    this.mode = "scatter";
  }

  public get isVulnerable(): boolean {
    return this.mode === "frightened";
  }

  public get isEaten(): boolean {
    return this.mode === "eaten";
  }
}
