import { Entity } from "./Entity";
import { DIRECTIONS, TURN_BUFFER_SECONDS, TURN_WINDOW, oppositeOf } from "./constants";
import type { DirectionVector, GridPoint } from "./types";
import type { Maze } from "./Maze";

/**
 * Player entity. Behaviour matches the arcade original: Pac-Man keeps gliding
 * in his current direction until a wall stops him; input only *steers*.
 *
 * Mobile-friendly steering on top of that:
 *  - a turn is accepted up to TURN_WINDOW tiles before OR after a junction
 *    (the arcade's "cornering" made generous),
 *  - a swipe made earlier than that is remembered for TURN_BUFFER_SECONDS,
 *  - reversing is instant, anywhere.
 */
export class PacMan extends Entity {
  private queued: DirectionVector = DIRECTIONS.none;
  private queueAge = 0;
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

  /** Executes a queued turn when close enough to a junction centre. Returns true when it turned. */
  private tryTurn(maze: Maze, onCenterReached: (x: number, y: number) => void): boolean {
    const q = this.queued;
    if (q === DIRECTIONS.none) return false;
    if (q === this.direction) {
      this.queued = DIRECTIONS.none;
      return false;
    }
    const along = this.direction.x !== 0 ? this.px : this.py;
    const offset = Math.abs(along - Math.round(along));
    // Standing still against a wall: the heading is meaningless, any open way is fine.
    const idle = !maze.canStep(Math.round(this.px), Math.round(this.py), this.direction) && offset < 1e-6;
    if (offset > TURN_WINDOW && !idle) return false;
    const cx = this.direction.x !== 0 ? Math.round(this.px) : Math.round(this.px);
    const cy = Math.round(this.py);
    // Off-axis (mid-tile on the other axis) can never happen: we are always on a corridor line.
    if (!maze.canStep(cx, cy, q)) return false;
    this.snapTo(cx, cy);
    this.direction = q;
    this.queued = DIRECTIONS.none;
    onCenterReached(cx, cy);
    return true;
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
      if (this.queueAge > TURN_BUFFER_SECONDS) this.queued = DIRECTIONS.none;
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
