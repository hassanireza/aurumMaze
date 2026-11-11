import { Ghost, type GhostContext } from "../Ghost";
import { DIRECTIONS, GHOST_STARTS, HOME_CORNERS } from "../constants";
import type { GhostId, GridPoint } from "../types";

/** Arcade Clyde targets Pac-Man at 8 tiles or farther, otherwise his corner. */
export const CLYDE_SHYNESS_RADIUS = 8;

/**
 * Clyde - The Shy One. Chases like Blinky from afar, but loses his nerve
 * inside five tiles and bolts for his home corner, producing a hesitant,
 * looping patrol. When frightened he hides in that same corner.
 */
export class ClydeGhost extends Ghost {
  public readonly id: GhostId = "clyde";
  public readonly displayName = "Clyde";
  public readonly personality = "The Shy One - bold from afar, but loses his nerve up close.";
  protected readonly scatterCorner: GridPoint = HOME_CORNERS.clyde;

  public constructor() {
    super(GHOST_STARTS.clyde, DIRECTIONS.up, "house");
  }

  protected getChaseTarget(context: GhostContext): GridPoint {
    const { pacman } = context;
    const d = Math.hypot(this.x - pacman.x, this.y - pacman.y);
    if (d < CLYDE_SHYNESS_RADIUS) return this.scatterCorner;
    return { x: pacman.x, y: pacman.y };
  }

  protected override getFrightenedTarget(): GridPoint | null {
    return this.scatterCorner;
  }
}
