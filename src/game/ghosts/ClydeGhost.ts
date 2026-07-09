import { Ghost, type GhostContext } from "../Ghost";
import { DIRECTIONS, GHOST_SPAWNS, HOME_CORNERS } from "../constants";
import type { GhostId, GridPoint } from "../types";

const SHYNESS_RADIUS = 8;

/**
 * Clyde - The Shy One. Chases directly like Blinky from a distance, but
 * loses his nerve and retreats to his home corner whenever he gets within
 * eight tiles of Pac-Man, giving him an oddly hesitant, looping patrol.
 */
export class ClydeGhost extends Ghost {
  public readonly id: GhostId = "clyde";
  public readonly displayName = "Clyde";
  public readonly personality = "The Shy One - bold from afar, but loses his nerve up close.";
  protected readonly scatterCorner: GridPoint = HOME_CORNERS.clyde!;

  public constructor(levelIndex: number) {
    super(GHOST_SPAWNS.clyde!, DIRECTIONS.up, levelIndex);
  }

  protected getChaseTarget(context: GhostContext): GridPoint {
    const distance = Math.hypot(this.x - context.pacman.x, this.y - context.pacman.y);
    if (distance < SHYNESS_RADIUS) return this.scatterCorner;
    return { x: context.pacman.x, y: context.pacman.y };
  }
}
