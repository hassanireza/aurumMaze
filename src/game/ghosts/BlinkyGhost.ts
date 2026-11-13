import { Ghost, type GhostContext } from "../Ghost";
import { DIRECTIONS, GHOST_STARTS, HOME_CORNERS } from "../constants";
import type { GhostId, GridPoint } from "../types";

/**
 * Blinky - The Chaser. Aims at Pac-Man's exact tile, no tricks. As the maze
 * empties he gets "angry" (the arcade's Cruise Elroy): he speeds up and stops
 * retreating to his corner during scatter.
 */
export class BlinkyGhost extends Ghost {
  public readonly id: GhostId = "blinky";
  public readonly displayName = "Blinky";
  public readonly personality = "The Chaser - relentless, always closing in a straight line.";
  protected readonly scatterCorner: GridPoint = HOME_CORNERS.blinky;

  public constructor() {
    super(GHOST_STARTS.blinky, DIRECTIONS.left, "roam");
  }

  protected getChaseTarget(context: GhostContext): GridPoint {
    return { x: context.pacman.tileX, y: context.pacman.tileY };
  }

  private stage(context: GhostContext): number {
    if (!context.elroyActive) return 0;
    if (context.pelletsLeft <= context.config.elroy2) return 2;
    if (context.pelletsLeft <= context.config.elroy1) return 1;
    return 0;
  }

  protected override roamSpeed(context: GhostContext): number {
    const stage = this.stage(context);
    if (stage === 2) return context.config.elroy2Speed;
    if (stage === 1) return context.config.elroy1Speed;
    return context.config.ghostSpeed;
  }

  protected override ignoresScatter(context: GhostContext): boolean {
    return this.stage(context) > 0;
  }

  public override update(context: GhostContext, dt: number): void {
    this.rage = this.stage(context) / 2;
    super.update(context, dt);
  }
}
