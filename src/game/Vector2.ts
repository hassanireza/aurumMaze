import type { GridPoint } from "./types";

/** Small immutable-friendly 2D vector helper used across the engine. */
export class Vector2 implements GridPoint {
  public constructor(
    public readonly x: number,
    public readonly y: number
  ) {}

  public static from(point: GridPoint): Vector2 {
    return new Vector2(point.x, point.y);
  }

  public add(other: GridPoint): Vector2 {
    return new Vector2(this.x + other.x, this.y + other.y);
  }

  public scale(factor: number): Vector2 {
    return new Vector2(this.x * factor, this.y * factor);
  }

  public distanceTo(other: GridPoint): number {
    return Math.hypot(this.x - other.x, this.y - other.y);
  }

  public equals(other: GridPoint): boolean {
    return this.x === other.x && this.y === other.y;
  }
}
