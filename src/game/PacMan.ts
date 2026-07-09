import { Entity } from "./Entity";
import { DIRECTIONS, BASE_PAC_SPEED, PAC_SPEED_PER_LEVEL } from "./constants";
import type { DirectionVector, GridPoint } from "./types";
import type { Maze } from "./Maze";

export class PacMan extends Entity {
  private queuedDirection: DirectionVector;
  private mouthOpen = 0;

  public constructor(start: GridPoint) {
    super(start, DIRECTIONS.right);
    this.queuedDirection = DIRECTIONS.right;
  }

  public queueDirection(direction: DirectionVector): void {
    this.queuedDirection = direction;
  }

  public get facing(): DirectionVector {
    return this.direction;
  }

  public get mouthPhase(): number {
    return this.mouthOpen;
  }

  /** Handles the classic "reverse instantly" feel when a U-turn is queued mid-step. */
  public tryInstantReverse(maze: Maze): void {
    const isReverse =
      this.queuedDirection.x === -this.direction.x && this.queuedDirection.y === -this.direction.y;
    if (this.progress > 0 && isReverse && this.canMove(maze, this.queuedDirection)) {
      this.x += this.direction.x;
      this.y += this.direction.y;
      this.direction = this.queuedDirection;
      this.progress = 1 - this.progress;
    }
  }

  public update(
    maze: Maze,
    dt: number,
    levelIndex: number,
    pulse: number,
    onPelletEaten: (isPower: boolean) => void
  ): void {
    this.tryInstantReverse(maze);
    if (this.progress < 0.16 && this.canMove(maze, this.queuedDirection)) {
      this.direction = this.queuedDirection;
    }
    const speed = BASE_PAC_SPEED + levelIndex * PAC_SPEED_PER_LEVEL;
    this.advanceCell(maze, dt, speed, () => {
      if (maze.consumePellet(this.x, this.y)) {
        onPelletEaten(maze.isPowerPellet(this.x, this.y));
      }
      if (this.canMove(maze, this.queuedDirection)) this.direction = this.queuedDirection;
    });
    this.mouthOpen = 0.28 + Math.abs(Math.sin(pulse * 12)) * 0.18;
  }
}
