import type { DirectionVector, GridPoint } from "./types";
import { DIRECTIONS } from "./constants";
import type { Maze } from "./Maze";

/** Shared movement state for anything that walks the maze grid. */
export abstract class Entity {
  public x: number;
  public y: number;
  public direction: DirectionVector;
  protected progress: number;

  protected constructor(start: GridPoint, direction: DirectionVector = DIRECTIONS.right) {
    this.x = start.x;
    this.y = start.y;
    this.direction = direction;
    this.progress = 0;
  }

  public canMove(maze: Maze, direction: DirectionVector): boolean {
    return maze.canEnter({ x: this.x + direction.x, y: this.y + direction.y });
  }

  /** Interpolated pixel-space position while mid-step between two cells. */
  public renderPosition(): GridPoint {
    return {
      x: this.x + this.direction.x * this.progress,
      y: this.y + this.direction.y * this.progress
    };
  }

  public resetTo(point: GridPoint, direction: DirectionVector): void {
    this.x = point.x;
    this.y = point.y;
    this.direction = direction;
    this.progress = 0;
  }

  protected advanceCell(maze: Maze, dt: number, speed: number, onEnterCell: () => void): void {
    if (!this.canMove(maze, this.direction)) return;
    this.progress += dt * speed;
    while (this.progress >= 1) {
      this.x += this.direction.x;
      this.y += this.direction.y;
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
