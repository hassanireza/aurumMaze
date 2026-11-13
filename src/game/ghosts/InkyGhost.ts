import { Ghost, type GhostContext } from "../Ghost";
import { DIRECTIONS, GHOST_STARTS, HOME_CORNERS } from "../constants";
import type { GhostId, GridPoint } from "../types";

const PIVOT_TILES = 2;

/**
 * Inky - The Flanker. Takes the tile two steps ahead of Pac-Man, draws a line
 * from Blinky to it and doubles the line. Close to Blinky he is harmless; far
 * from Blinky he swings wide, pinching Pac-Man between the pair.
 * (Arcade quirk kept: facing up shifts the pivot two tiles left as well.)
 */
export class InkyGhost extends Ghost {
  public readonly id: GhostId = "inky";
  public readonly displayName = "Inky";
  public readonly personality = "The Flanker - swings wide, pinching you between himself and Blinky.";
  protected readonly scatterCorner: GridPoint = HOME_CORNERS.inky;

  public constructor() {
    super(GHOST_STARTS.inky, DIRECTIONS.down, "house");
  }

  protected getChaseTarget(context: GhostContext): GridPoint {
    const { pacman, blinkyTile } = context;
    const facing = pacman.facing;
    const quirk = facing === DIRECTIONS.up ? -PIVOT_TILES : 0;
    const pivot = {
      x: pacman.tileX + facing.x * PIVOT_TILES + quirk,
      y: pacman.tileY + facing.y * PIVOT_TILES
    };
    return {
      x: pivot.x * 2 - blinkyTile.x,
      y: pivot.y * 2 - blinkyTile.y
    };
  }
}
