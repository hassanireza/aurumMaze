import { Ghost, type GhostContext } from "../Ghost";
import { DIRECTIONS, GHOST_STARTS, HOME_CORNERS } from "../constants";
import type { GhostId, GridPoint } from "../types";

/**
 * Blinky - The Chaser. Aims at Pac-Man's exact tile, no tricks. As the maze
 * empties he gets "angry" (the arcade's Cruise Elroy): he speeds up and stops
 * retreating to his corner during scatter. When frightened he panics randomly.
 */
export class BlinkyGhost extends Ghost {
  public readonly id: GhostId = "blinky";
  public readonly displayName = "Blinky";
  public readonly personality = "The Chaser - relentless, always closing in a straight line.";
  protected readonly scatterCorner: GridPoint = HOME_CORNERS.blinky;

  public constructor() {
    super(GHOST_STARTS.blinky, DIRECTIONS.left, "leaving");
  }

  protected getChaseTarget(context: GhostContext): GridPoint {
    return { x: context.pacman.x, y: context.pacman.y };
  }

  private level(context: GhostContext): number {
    if (context.pelletsLeft <= context.config.elroy2) return 2;
    if (context.pelletsLeft <= context.config.elroy1) return 1;
    return 0;
  }

  protected override speedBonus(context: GhostContext): number {
    return this.level(context) * context.config.elroyBonus;
  }

  protected override ignoresScatter(context: GhostContext): boolean {
    return this.level(context) > 0;
  }

  public override update(context: GhostContext, dt: number): void {
    this.rage = this.level(context) / 2;
    super.update(context, dt);
  }
}
