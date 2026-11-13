import { Ghost, type GhostContext } from "../Ghost";
import { DIRECTIONS, GHOST_STARTS, HOME_CORNERS } from "../constants";
import type { GhostId, GridPoint } from "../types";

const LOOKAHEAD_TILES = 4;

/**
 * Pinky - The Ambusher. Aims four tiles ahead of Pac-Man's heading to cut him
 * off. Faithful to the arcade quirk: when Pac-Man faces up she aims four tiles
 * up *and* four tiles left.
 */
export class PinkyGhost extends Ghost {
  public readonly id: GhostId = "pinky";
  public readonly displayName = "Pinky";
  public readonly personality = "The Ambusher - strikes where you are headed, not where you stand.";
  protected readonly scatterCorner: GridPoint = HOME_CORNERS.pinky;

  public constructor() {
    super(GHOST_STARTS.pinky, DIRECTIONS.down, "house");
  }

  protected getChaseTarget(context: GhostContext): GridPoint {
    const { pacman } = context;
    const facing = pacman.facing;
    const quirk = facing === DIRECTIONS.up ? -LOOKAHEAD_TILES : 0;
    return {
      x: pacman.tileX + facing.x * LOOKAHEAD_TILES + quirk,
      y: pacman.tileY + facing.y * LOOKAHEAD_TILES
    };
  }
}
