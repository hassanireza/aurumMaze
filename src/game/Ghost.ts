import { Entity } from "./Entity";
import { ALL_DIRECTIONS, DIRECTIONS, DOOR_Y, GATE_X, GRID_WIDTH, HOUSE_Y, NO_UP_TILES, oppositeOf } from "./constants";
import type { LevelConfig } from "./difficulty";
import type { Maze } from "./Maze";
import type { PacMan } from "./PacMan";
import type { Rng } from "./Rng";
import type { DirectionVector, GhostId, GhostMotionMode, GhostPhase, GridPoint, HuntPhase } from "./types";

export interface GhostContext {
  readonly pacman: PacMan;
  readonly blinkyTile: GridPoint;
  readonly maze: Maze;
  readonly rng: Rng;
  readonly config: LevelConfig;
  readonly pelletsLeft: number;
  /** False after a death until Clyde has left the house again (arcade Elroy rule). */
  readonly elroyActive: boolean;
}

const dist2 = (a: GridPoint, b: GridPoint): number => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

const EYES_TARGET: GridPoint = { x: GATE_X, y: DOOR_Y };

/**
 * Shared ghost skeleton modelled on the 1980 arcade rules:
 *  - a ghost only decides at tile centres and never reverses on its own,
 *  - it picks the exit whose next tile is closest to its target (ties: up, left, down, right),
 *  - every scatter/chase switch and every power pellet forces one U-turn,
 *  - frightened ghosts wander randomly and slowly; eaten ghosts rush home as eyes,
 *  - chasing ghosts may not turn upward at four fixed intersections.
 * Subclasses only describe their personality: chase target and scatter corner.
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
  private readonly homeX: number;
  /** Turn chosen one tile early (arcade look-ahead), executed on reaching the next tile centre. */
  private pending: DirectionVector | null = null;
  /** A forced reversal is obeyed only when the ghost reaches its next tile, as in the arcade. */
  private reverseQueued = false;

  protected constructor(spawn: GridPoint, direction: DirectionVector, phase: GhostPhase) {
    super(spawn, direction);
    this.phase = phase;
    this.homeX = spawn.x;
  }

  /** Where this ghost aims while hunting. */
  protected abstract getChaseTarget(context: GhostContext): GridPoint;

  protected speedBonus(_context: GhostContext): number {
    return 0;
  }

  protected ignoresScatter(_context: GhostContext): boolean {
    return false;
  }

  public get tile(): GridPoint {
    return { x: this.tileX, y: this.tileY };
  }

  public get displayMode(): GhostMotionMode {
    if (this.phase === "eaten" || this.phase === "entering") return "eaten";
    if (this.phase === "house") return "house";
    if (this.frightened) return "frightened";
    return this.huntPhase;
  }

  public get isVulnerable(): boolean {
    return this.frightened && (this.phase === "roam" || this.phase === "leaving");
  }

  public get isEaten(): boolean {
    return this.phase === "eaten" || this.phase === "entering";
  }

  /** Can touch Pac-Man (outside or on the way out of the house). */
  public get isActive(): boolean {
    return this.phase === "roam" || (this.phase === "leaving" && this.py <= DOOR_Y + 1);
  }

  private speed(context: GhostContext): number {
    const { config, maze } = context;
    switch (this.phase) {
      case "eaten":
      case "entering":
        return config.eyesSpeed;
      case "house":
      case "leaving":
        return config.houseSpeed;
      default:
        if (maze.isTunnel(this.tileX, this.tileY)) return config.tunnelSpeed;
        if (this.frightened) return config.frightSpeed;
        return this.roamSpeed(context);
    }
  }

  protected roamSpeed(context: GhostContext): number {
    return context.config.ghostSpeed + this.speedBonus(context);
  }

  private target(context: GhostContext): GridPoint {
    if (this.huntPhase === "scatter" && !this.ignoresScatter(context)) return this.scatterCorner;
    return this.getChaseTarget(context);
  }

  private blockedUp(x: number, y: number): boolean {
    return NO_UP_TILES.some(t => t.x === x && t.y === y);
  }

  /**
   * Picks the exit to take from tile (x, y) when arriving with `heading`: the legal exit (never a
   * reversal) whose next tile is closest to the target; ties go up, left, down, right.
   */
  private choose(context: GhostContext, x: number, y: number, heading: DirectionVector): DirectionVector | null {
    const { maze } = context;
    const back = oppositeOf(heading);
    const eyes = this.phase === "eaten";
    const restricted = !this.frightened && !eyes && this.blockedUp(x, y);
    const options = ALL_DIRECTIONS.filter(
      d => d !== back && maze.canStep(x, y, d) && !(restricted && d === DIRECTIONS.up)
    );
    if (options.length === 0) return maze.canStep(x, y, back) ? back : null;
    if (options.length === 1) return options[0]!;
    if (this.frightened && !eyes) return context.rng.pick(options);

    const target = eyes ? EYES_TARGET : this.target(context);
    let best = options[0]!;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const d of options) {
      const dd = dist2({ x: x + d.x, y: y + d.y }, target);
      if (dd < bestDistance) {
        bestDistance = dd;
        best = d;
      }
    }
    return best;
  }

  /** Reached a tile centre: obey a queued reversal or the turn chosen a tile ago, then look one tile ahead. */
  private arrive(context: GhostContext): void {
    const { maze } = context;
    const x = this.tileX;
    const y = this.tileY;
    if (this.reverseQueued) {
      this.reverseQueued = false;
      const back = oppositeOf(this.direction);
      this.direction = maze.canStep(x, y, back) ? back : this.direction;
    } else if (this.pending && maze.canStep(x, y, this.pending)) {
      this.direction = this.pending;
    } else {
      this.direction = this.choose(context, x, y, this.direction) ?? DIRECTIONS.none;
    }
    this.pending = null;
    if (this.direction === DIRECTIONS.none) return;
    // One tile of look-ahead: decide now what to do at the next tile, with today's target.
    const ax = (x + this.direction.x + GRID_WIDTH) % GRID_WIDTH;
    const ay = y + this.direction.y;
    if (maze.canStand({ x: ax, y: ay })) this.pending = this.choose(context, ax, ay, this.direction);
  }

  /** Scripted house movement: returns true once the point is reached. */
  private glide(tx: number, ty: number, distance: number): boolean {
    const dx = tx - this.px;
    const dy = ty - this.py;
    const len = Math.hypot(dx, dy);
    if (len <= distance + 1e-9) {
      this.px = tx;
      this.py = ty;
      return true;
    }
    this.px += (dx / len) * distance;
    this.py += (dy / len) * distance;
    return false;
  }

  public update(context: GhostContext, dt: number): void {
    const { maze } = context;
    this.bobClock += dt;
    this.decaySlide(dt);
    const speed = this.speed(context);

    switch (this.phase) {
      case "house": {
        const wave = Math.sin(this.bobClock * 6.2 + this.homeX);
        this.py = HOUSE_Y + wave * 0.32;
        this.direction = Math.cos(this.bobClock * 6.2 + this.homeX) >= 0 ? DIRECTIONS.down : DIRECTIONS.up;
        return;
      }
      case "leaving": {
        const d = speed * dt;
        if (Math.abs(this.px - GATE_X) > 1e-6) {
          this.direction = this.px < GATE_X ? DIRECTIONS.right : DIRECTIONS.left;
          const dy = HOUSE_Y - this.py;
          this.py += Math.sign(dy) * Math.min(Math.abs(dy), d * 0.6);
          this.glide(GATE_X, this.py, d);
          return;
        }
        this.direction = DIRECTIONS.up;
        if (this.glide(GATE_X, DOOR_Y, d)) {
          this.phase = "roam";
          this.direction = DIRECTIONS.left;
          this.pending = null;
          this.reverseQueued = false;
        }
        return;
      }
      case "entering": {
        this.direction = DIRECTIONS.down;
        if (this.glide(GATE_X, HOUSE_Y, speed * dt)) {
          this.frightened = false;
          this.phase = "leaving";
        }
        return;
      }
      default: {
        if (this.direction === DIRECTIONS.none) this.direction = DIRECTIONS.left;
        const onCenter = (): void => {
          if (this.phase === "eaten") {
            const d = Math.hypot(this.px - GATE_X, this.py - DOOR_Y);
            if (d < 0.6) {
              this.snapTo(GATE_X, DOOR_Y);
              this.phase = "entering";
              this.direction = DIRECTIONS.down;
              return;
            }
          }
          this.arrive(context);
        };
        this.travel(maze, speed * dt, (x, y, d) => maze.canStep(x, y, d), onCenter);
      }
    }
  }

  public release(): void {
    if (this.phase !== "house") return;
    this.phase = "leaving";
  }

  public startFrightened(): void {
    if (this.isEaten) return;
    this.frightened = true;
    this.requestReverse();
  }

  public requestReverse(): void {
    if (this.phase === "roam") this.reverseQueued = true;
  }

  public endFrightened(): void {
    this.frightened = false;
  }

  public setHuntPhase(phase: HuntPhase): void {
    if (this.huntPhase === phase) return;
    this.huntPhase = phase;
    if (!this.frightened) this.requestReverse();
  }

  public markEaten(): void {
    this.phase = "eaten";
    this.frightened = false;
    this.pending = null;
    this.reverseQueued = false;
  }
}
