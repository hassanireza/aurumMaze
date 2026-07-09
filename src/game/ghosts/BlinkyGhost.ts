import { Ghost, type GhostContext } from "../Ghost";
import { DIRECTIONS, GHOST_SPAWNS, HOME_CORNERS } from "../constants";
import type { GhostId, GridPoint } from "../types";

/**
 * Blinky - The Chaser. Always makes straight for Pac-Man's current tile,
 * getting faster the fewer pellets remain. The classic direct threat.
 */
export class BlinkyGhost extends Ghost {
  public readonly id: GhostId = "blinky";
  public readonly displayName = "Blinky";
  public readonly personality = "The Chaser - relentless, always closing in a straight line.";
  protected readonly scatterCorner: GridPoint = HOME_CORNERS.blinky!;

  public constructor(levelIndex: number) {
    super(GHOST_SPAWNS.blinky!, DIRECTIONS.left, levelIndex);
  }

  protected getChaseTarget(context: GhostContext): GridPoint {
    return { x: context.pacman.x, y: context.pacman.y };
  }
}
