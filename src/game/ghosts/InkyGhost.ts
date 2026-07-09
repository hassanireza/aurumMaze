import { Ghost, type GhostContext } from "../Ghost";
import { DIRECTIONS, GHOST_SPAWNS, HOME_CORNERS } from "../constants";
import type { GhostId, GridPoint } from "../types";

const PIVOT_TILES = 2;

/**
 * Inky - The Flanker. Draws a line from Blinky through the tile two steps
 * ahead of Pac-Man, then doubles it. The result is a wide, unpredictable
 * pincer that only makes sense once you see Blinky's position too.
 */
export class InkyGhost extends Ghost {
  public readonly id: GhostId = "inky";
  public readonly displayName = "Inky";
  public readonly personality = "The Flanker - swings wide, pinching you between himself and Blinky.";
  protected readonly scatterCorner: GridPoint = HOME_CORNERS.inky!;

  public constructor(levelIndex: number) {
    super(GHOST_SPAWNS.inky!, DIRECTIONS.up, levelIndex);
  }

  protected getChaseTarget(context: GhostContext): GridPoint {
    const facing = context.pacman.facing;
    const pivot = {
      x: context.pacman.x + facing.x * PIVOT_TILES,
      y: context.pacman.y + facing.y * PIVOT_TILES
    };
    return {
      x: pivot.x + (pivot.x - context.blinkyPosition.x),
      y: pivot.y + (pivot.y - context.blinkyPosition.y)
    };
  }
}
