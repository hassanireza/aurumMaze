import { Entity } from "./Entity";
import { DIRECTIONS, TURN_BUFFER_SECONDS } from "./constants";
import type { DirectionVector, GridPoint } from "./types";
import type { Maze } from "./Maze";

/** Fraction of a cell after a junction in which a late turn still "cuts the corner". */
const CORNER_WINDOW = 0.14;

/**
 * Player entity. Behaviour matches the arcade original: Pac-Man keeps gliding
 * in his current direction until a wall stops him; input only *steers*. A
 * swipe made slightly before a junction is remembered for a short moment
 * (TURN_BUFFER_SECONDS) so corners feel forgiving, then forgotten so a stale
 * input never throws you around a corner you forgot about.
 */
export class PacMan extends Entity {
  private queued: DirectionVector = DIRECTIONS.none;
  private queueAge = 0;
  private mouth = 0.3;
  private moving = false;

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

  public get mouthPhase(): number {
    return this.mouth;
  }

  public get isMoving(): boolean {
    return this.moving;
  }

  /** Reversing needs no junction: flip heading and keep the exact same position. */
  private tryInstantReverse(maze: Maze): void {
    const q = this.queued;
    if (q === DIRECTIONS.none || this.progress <= 0) return;
    if (q.x !== -this.direction.x || q.y !== -this.direction.y) return;
    const ahead = maze.resolve({ x: this.x + this.direction.x, y: this.y + this.direction.y });
    if (!ahead) return;
    this.x = ahead.x;
    this.y = ahead.y;
    this.direction = q;
    this.progress = 1 - this.progress;
    this.queued = DIRECTIONS.none;
  }

  private tryTurn(maze: Maze): void {
    const q = this.queued;
    if (q === DIRECTIONS.none || q === this.direction) return;
    if (this.progress > CORNER_WINDOW) return;
    if (!this.canMove(maze, q)) return;
    this.turnTo(q);
    this.queued = DIRECTIONS.none;
  }

  public update(
    maze: Maze,
    dt: number,
    speed: number,
    pulse: number,
    onPelletEaten: (isPower: boolean) => void
  ): void {
    if (this.queued !== DIRECTIONS.none) {
      this.queueAge += dt;
      if (this.queueAge > TURN_BUFFER_SECONDS) this.queued = DIRECTIONS.none;
    }
    this.tryInstantReverse(maze);
    this.tryTurn(maze);

    const before = this.x * 1000 + this.y + this.progress;
    this.advanceCell(maze, dt, speed, () => {
      if (maze.consumePellet(this.x, this.y)) onPelletEaten(maze.isPowerPellet(this.x, this.y));
      this.tryTurn(maze);
    });
    this.moving = this.x * 1000 + this.y + this.progress !== before;
    this.mouth = this.moving ? 0.1 + Math.abs(Math.sin(pulse * 14)) * 0.34 : 0.22;
  }
}
