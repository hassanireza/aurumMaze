import type { DirectionVector, GridPoint } from "./types";
import { DIRECTIONS, GRID_WIDTH } from "./constants";
import type { Maze } from "./Maze";

const EPS = 1e-7;

/**
 * Shared walking state. `px`/`py` are continuous tile-centre coordinates
 * (integer = standing exactly on a tile centre, x.5 = on the board's centre
 * line). Decisions happen only when a tile centre is reached, like the arcade.
 */
export abstract class Entity {
  public px: number;
  public py: number;
  public direction: DirectionVector;
  /** Decaying visual offset that hides the small snap when cutting a corner. */
  protected slideX = 0;
  protected slideY = 0;

  protected constructor(start: GridPoint, direction: DirectionVector) {
    this.px = start.x;
    this.py = start.y;
    this.direction = direction;
  }

  public get tileX(): number { return Math.round(this.px); }
  public get tileY(): number { return Math.round(this.py); }

  /** Continuous position for drawing and collisions. */
  public renderPosition(): GridPoint {
    return { x: this.px + this.slideX, y: this.py + this.slideY };
  }

  public resetTo(point: GridPoint, direction: DirectionVector): void {
    this.px = point.x;
    this.py = point.y;
    this.direction = direction;
    this.slideX = 0;
    this.slideY = 0;
  }

  protected decaySlide(dt: number): void {
    const k = Math.exp(-dt * 22);
    this.slideX *= k;
    this.slideY *= k;
    if (Math.abs(this.slideX) < 0.002) this.slideX = 0;
    if (Math.abs(this.slideY) < 0.002) this.slideY = 0;
  }

  /** Snaps to a new tile-centre line while keeping the picture continuous. */
  protected snapTo(x: number, y: number): void {
    this.slideX += this.px - x;
    this.slideY += this.py - y;
    this.px = x;
    this.py = y;
  }

  /**
   * Moves `distance` tiles along the current heading, calling `onCenter` at
   * every tile centre reached (the callback may change `direction`).
   * Returns the distance actually travelled (less than asked when blocked).
   */
  protected travel(
    maze: Maze,
    distance: number,
    canStep: (x: number, y: number, dir: DirectionVector) => boolean,
    onCenter: () => void
  ): number {
    let remaining = distance;
    let moved = 0;
    for (let guard = 0; remaining > EPS && guard < 8; guard += 1) {
      const d = this.direction;
      if (d === DIRECTIONS.none) break;
      const horizontal = d.x !== 0;
      const coord = horizontal ? this.px : this.py;
      const sign = horizontal ? d.x : d.y;
      let toNext: number;
      if (Math.abs(coord - Math.round(coord)) < EPS) {
        if (!canStep(Math.round(this.px), Math.round(this.py), d)) break;
        toNext = 1;
      } else {
        toNext = sign > 0 ? Math.ceil(coord) - coord : coord - Math.floor(coord);
      }
      const step = Math.min(remaining, toNext);
      this.px += d.x * step;
      this.py += d.y * step;
      remaining -= step;
      moved += step;
      if (step >= toNext - EPS) {
        this.px = Math.round(this.px);
        this.py = Math.round(this.py);
        if (this.px < 0) this.px += GRID_WIDTH;
        else if (this.px >= GRID_WIDTH) this.px -= GRID_WIDTH;
        onCenter();
      }
    }
    void maze;
    return moved;
  }
}
