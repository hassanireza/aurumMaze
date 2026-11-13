import { Entity } from "./Entity";
import { DIRECTIONS, GRID_WIDTH, TURN_BUFFER_SECONDS, TURN_BUFFER_TILES, TURN_EARLY, TURN_LATE, oppositeOf } from "./constants";
import type { DirectionVector, GridPoint } from "./types";
import type { Maze } from "./Maze";

/**
 * Player entity. Behaviour matches the arcade original: Pac-Man keeps gliding
 * in his current direction until a wall stops him; input only *steers*.
 *
 * Mobile-friendly steering on top of that:
 *  - a turn is accepted TURN_LATE tiles after a junction (thumbs are late) or TURN_EARLY
 *    tiles before one,
 *  - an earlier swipe is remembered briefly (time and distance limited),
 *  - reversing is instant, anywhere.
 */
export class PacMan extends Entity {
  private queued: DirectionVector = DIRECTIONS.none;
  private queueAge = 0;
  private queueOdometer = 0;
  private odometer = 0;
  private moving = false;
  private stall = 0;

  public constructor(start: GridPoint) {
    super(start, DIRECTIONS.left);
  }

  public queueDirection(direction: DirectionVector): void {
    if (direction === DIRECTIONS.none) return;
    this.queued = direction;
    this.queueAge = 0;
    this.queueOdometer = this.odometer;
  }

  public get facing(): DirectionVector {
    return this.direction;
  }

  /** Half-angle of the mouth opening, radians. */
  public get mouthPhase(): number {
    if (!this.moving && this.odometer === 0) return 0.5;
    return 0.04 + Math.abs(Math.sin(this.odometer * Math.PI * 1.1)) * 0.62;
  }

  public get isMoving(): boolean {
    return this.moving;
  }

  public get hasQueuedTurn(): DirectionVector {
    return this.queued;
  }

  /** Eating costs time in the arcade: 1 frame per dot, 3 per power pellet. */
  public addStall(seconds: number): void {
    this.stall += seconds;
  }

  private tryReverse(maze: Maze): void {
    const q = this.queued;
    if (q === DIRECTIONS.none || q !== oppositeOf(this.direction)) return;
    this.direction = q;
    this.queued = DIRECTIONS.none;
    void maze;
  }

  /**
   * Executes a queued turn when a junction that allows it is close enough: the one just passed
   * (up to TURN_LATE behind) or the one just ahead (up to TURN_EARLY). The nearer legal one wins.
   * Returns true when it turned.
   */
  private tryTurn(maze: Maze, onCenterReached: (x: number, y: number) => void): boolean {
    const q = this.queued;
    if (q === DIRECTIONS.none) return false;
    if (q === this.direction) {
      this.queued = DIRECTIONS.none;
      return false;
    }
    const horizontal = this.direction.x !== 0;
    const sign = horizontal ? this.direction.x : this.direction.y;
    const along = horizontal ? this.px : this.py;
    const behind = sign > 0 ? Math.floor(along + 1e-6) : Math.ceil(along - 1e-6);
    const distBehind = Math.abs(along - behind);
    const ahead = behind + sign;
    const distAhead = Math.abs(ahead - along);
    const wrap = (v: number): number => (horizontal ? ((v % GRID_WIDTH) + GRID_WIDTH) % GRID_WIDTH : v);
    const fixed = horizontal ? Math.round(this.py) : Math.round(this.px);
    const tile = (v: number): { x: number; y: number } => (horizontal ? { x: wrap(v), y: fixed } : { x: fixed, y: v });
    const stopped = !maze.canStep(Math.round(this.px) % GRID_WIDTH, Math.round(this.py), this.direction) && distBehind < 1e-6;

    const options: { dist: number; center: number }[] = [];
    if (distBehind <= TURN_LATE || stopped) options.push({ dist: distBehind, center: behind });
    if (distAhead <= TURN_EARLY) options.push({ dist: distAhead, center: ahead });
    options.sort((a, b) => a.dist - b.dist);
    for (const option of options) {
      const t = tile(option.center);
      if (!maze.canStep(t.x, t.y, q)) continue;
      if (horizontal) this.snapTo(option.center, t.y);
      else this.snapTo(t.x, option.center);
      this.px = wrap(this.px);
      this.direction = q;
      this.queued = DIRECTIONS.none;
      onCenterReached(t.x, t.y);
      return true;
    }
    return false;
  }

  public update(
    maze: Maze,
    dt: number,
    speed: number,
    onTile: (x: number, y: number) => void
  ): void {
    this.decaySlide(dt);
    if (this.queued !== DIRECTIONS.none) {
      this.queueAge += dt;
      if (this.queueAge > TURN_BUFFER_SECONDS || this.odometer - this.queueOdometer > TURN_BUFFER_TILES) this.queued = DIRECTIONS.none;
    }
    this.tryReverse(maze);
    this.tryTurn(maze, onTile);

    if (this.stall > 0) {
      this.stall = Math.max(0, this.stall - dt);
      this.moving = false;
      return;
    }

    const moved = this.travel(
      maze,
      dt * speed,
      (x, y, d) => maze.canStep(x, y, d),
      () => {
        onTile(this.tileX, this.tileY);
        this.tryTurn(maze, onTile);
      }
    );
    this.moving = moved > 0;
    this.odometer += moved;
  }
}
