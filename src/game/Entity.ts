import type { DirectionVector, GridPoint } from "./types";
import { DIRECTIONS } from "./constants";
import type { Maze } from "./Maze";

/** Shared grid-walking state: a cell, a heading and 0..1 progress toward the next cell. */
export abstract class Entity {
  public x: number;
  public y: number;
  public direction: DirectionVector;
  protected progress: number;
  /** Decaying visual offset that hides the tiny snap when cutting a corner. */
  private slideX = 0;
  private slideY = 0;
  protected canUseHouse = false;

  protected constructor(start: GridPoint, direction: DirectionVector = DIRECTIONS.right) {
    this.x = start.x;
    this.y = start.y;
    this.direction = direction;
    this.progress = 0;
  }

  public canMove(maze: Maze, direction: DirectionVector): boolean {
    return maze.canEnter({ x: this.x + direction.x, y: this.y + direction.y }, this.canUseHouse);
  }

  /** Continuous position (cell units, cell centre = integer). */
  public renderPosition(): GridPoint {
    return {
      x: this.x + this.direction.x * this.progress + this.slideX,
      y: this.y + this.direction.y * this.progress + this.slideY
    };
  }

  public resetTo(point: GridPoint, direction: DirectionVector): void {
    this.x = point.x;
    this.y = point.y;
    this.direction = direction;
    this.progress = 0;
    this.slideX = 0;
    this.slideY = 0;
  }

  /** Changes heading while mid-step, easing the visual jump. */
  protected turnTo(direction: DirectionVector): void {
    if (direction === this.direction) return;
    const before = this.renderPosition();
    this.direction = direction;
    const after = this.renderPosition();
    this.slideX += before.x - after.x;
    this.slideY += before.y - after.y;
  }

  protected decaySlide(dt: number): void {
    const k = Math.max(0, 1 - dt * 14);
    this.slideX *= k;
    this.slideY *= k;
    if (Math.abs(this.slideX) < 0.001) this.slideX = 0;
    if (Math.abs(this.slideY) < 0.001) this.slideY = 0;
  }

  protected advanceCell(maze: Maze, dt: number, speed: number, onEnterCell: () => void): void {
    this.decaySlide(dt);
    if (!this.canMove(maze, this.direction)) {
      this.progress = 0;
      return;
    }
    this.progress += dt * speed;
    while (this.progress >= 1) {
      const next = maze.resolve({ x: this.x + this.direction.x, y: this.y + this.direction.y });
      if (!next) {
        this.progress = 0;
        break;
      }
      this.x = next.x;
      this.y = next.y;
      this.progress -= 1;
      onEnterCell();
      if (!this.canMove(maze, this.direction)) {
        this.progress = 0;
        break;
      }
    }
  }

  public get gridProgress(): number {
    return this.progress;
  }
}
