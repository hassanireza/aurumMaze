import { Entity } from "./Entity";
import { ALL_DIRECTIONS, DIRECTIONS, HOUSE_CENTER, HOUSE_EXIT } from "./constants";
import type { LevelConfig } from "./difficulty";
import type { Maze } from "./Maze";
import type { PacMan } from "./PacMan";
import type { Rng } from "./Rng";
import type {
  DirectionVector,
  GhostId,
  GhostMotionMode,
  GhostPhase,
  GridPoint,
  HuntPhase
} from "./types";

export interface GhostContext {
  readonly pacman: PacMan;
  readonly blinkyCell: GridPoint;
  readonly maze: Maze;
  readonly rng: Rng;
  readonly config: LevelConfig;
  readonly pelletsLeft: number;
}

const reverse = (d: DirectionVector): DirectionVector =>
  d === DIRECTIONS.up ? DIRECTIONS.down : d === DIRECTIONS.down ? DIRECTIONS.up : d === DIRECTIONS.left ? DIRECTIONS.right : DIRECTIONS.left;

const dist2 = (a: GridPoint, b: GridPoint): number => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

/**
 * Shared ghost skeleton modelled on the 1980 arcade rules:
 *  - a ghost only decides at tile centres, never reverses on its own,
 *  - it picks the exit whose next tile is closest to its target (ties: up, left, down, right),
 *  - every scatter/chase switch and every power pellet forces one U-turn,
 *  - frightened ghosts wander randomly at half speed, eaten ghosts rush home as eyes.
 * Subclasses only describe their personality: chase target, scatter corner,
 * and how they behave when frightened.
 */
export abstract class Ghost extends Entity {
  public abstract readonly id: GhostId;
  public abstract readonly displayName: string;
  public abstract readonly personality: string;
  protected abstract readonly scatterCorner: GridPoint;

  public phase: GhostPhase;
  public frightened = false;
  public huntPhase: HuntPhase = "scatter";
  /** 0..1 intensity of Blinky's "rage"; always 0 for the others. */
  public rage = 0;
  public bobClock = 0;

  private pendingReverse = false;
  private steerPending = false;

  protected constructor(spawn: GridPoint, direction: DirectionVector, phase: GhostPhase) {
    super(spawn, direction);
    this.phase = phase;
  }

  /** Where this ghost aims while hunting. */
  protected abstract getChaseTarget(context: GhostContext): GridPoint;

  /** Where a frightened ghost runs to; null means "wander at random". */
  protected getFrightenedTarget(_context: GhostContext): GridPoint | null {
    return null;
  }

  /** Extra speed for ghosts that get angrier (Blinky). */
  protected speedBonus(_context: GhostContext): number {
    return 0;
  }

  /** True when this ghost refuses to go home during scatter. */
  protected ignoresScatter(_context: GhostContext): boolean {
    return false;
  }

  public get cell(): GridPoint {
    return { x: this.x, y: this.y };
  }

  public get displayMode(): GhostMotionMode {
    if (this.phase === "eaten") return "eaten";
    if (this.phase === "house") return "house";
    if (this.frightened) return "frightened";
    return this.huntPhase;
  }

  public get isVulnerable(): boolean {
    return this.frightened && (this.phase === "roam" || this.phase === "leaving");
  }

  public get isEaten(): boolean {
    return this.phase === "eaten";
  }

  public get isActive(): boolean {
    return this.phase === "roam" || this.phase === "leaving";
  }

  private speed(context: GhostContext): number {
    const { config, maze } = context;
    switch (this.phase) {
      case "eaten":
        return config.eatenSpeed;
      case "house":
      case "leaving":
        return config.houseSpeed;
      default:
        if (maze.isTunnel(this.x, this.y)) return config.tunnelSpeed;
        if (this.frightened) return config.frightSpeed;
        return config.ghostSpeed + this.speedBonus(context);
    }
  }

  private target(context: GhostContext): GridPoint {
    if (this.frightened) return this.getFrightenedTarget(context) ?? this.scatterCorner;
    if (this.huntPhase === "scatter" && !this.ignoresScatter(context)) return this.scatterCorner;
    return this.getChaseTarget(context);
  }

  private chooseRoamDirection(context: GhostContext): DirectionVector {
    const { maze } = context;
    if (this.pendingReverse) {
      this.pendingReverse = false;
      const back = reverse(this.direction);
      if (this.canMove(maze, back)) return back;
    }
    const back = reverse(this.direction);
    const options = ALL_DIRECTIONS.filter(dir => dir !== back && this.canMove(maze, dir));
    if (options.length === 0) return this.canMove(maze, back) ? back : DIRECTIONS.none;
    if (options.length === 1) return options[0]!;

    if (this.frightened && this.getFrightenedTarget(context) === null) {
      return context.rng.pick(options);
    }
    const target = this.target(context);
    let best = options[0]!;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const dir of options) {
      const d = dist2({ x: this.x + dir.x, y: this.y + dir.y }, target);
      if (d < bestDistance) {
        bestDistance = d;
        best = dir;
      }
    }
    return best;
  }

  private steerToward(maze: Maze, goal: GridPoint): void {
    const dir = maze.nextStep(this.cell, goal, true);
    if (dir) this.direction = dir;
  }

  public update(context: GhostContext, dt: number): void {
    const { maze } = context;
    this.bobClock += dt;
    this.canUseHouse = this.phase !== "roam";

    switch (this.phase) {
      case "house":
        return;
      case "leaving": {
        if (this.steerPending) {
          this.steerPending = false;
          this.steerToward(maze, HOUSE_EXIT);
        }
        this.advanceCell(maze, dt, this.speed(context), () => {
          if (this.x === HOUSE_EXIT.x && this.y === HOUSE_EXIT.y) {
            this.phase = "roam";
            this.canUseHouse = false;
            this.pendingReverse = false;
            this.direction = this.canMove(maze, DIRECTIONS.left) ? DIRECTIONS.left : DIRECTIONS.right;
          } else {
            this.steerToward(maze, HOUSE_EXIT);
          }
        });
        return;
      }
      case "eaten": {
        if (this.steerPending) {
          this.steerPending = false;
          this.steerToward(maze, HOUSE_CENTER);
        }
        this.advanceCell(maze, dt, this.speed(context), () => {
          if (this.x === HOUSE_CENTER.x && this.y === HOUSE_CENTER.y) {
            this.phase = "leaving";
            this.frightened = false;
            this.steerPending = true;
          } else {
            this.steerToward(maze, HOUSE_CENTER);
          }
        });
        return;
      }
      default: {
        if (!this.canMove(maze, this.direction)) this.direction = this.chooseRoamDirection(context);
        this.advanceCell(maze, dt, this.speed(context), () => {
          this.direction = this.chooseRoamDirection(context);
        });
      }
    }
  }

  public release(): void {
    if (this.phase !== "house") return;
    this.phase = "leaving";
    this.steerPending = true;
  }

  public startFrightened(): void {
    if (this.phase === "eaten") return;
    this.frightened = true;
    if (this.phase === "roam") this.pendingReverse = true;
  }

  public requestReverse(): void {
    if (this.phase === "roam") this.pendingReverse = true;
  }

  public endFrightened(): void {
    this.frightened = false;
  }

  public setHuntPhase(phase: HuntPhase): void {
    if (this.huntPhase === phase) return;
    this.huntPhase = phase;
    if (this.phase === "roam" && !this.frightened) this.pendingReverse = true;
  }

  public markEaten(): void {
    this.phase = "eaten";
    this.frightened = false;
    this.steerPending = true;
  }
}
