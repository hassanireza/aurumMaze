import { Ghost, type GhostContext } from "../Ghost";
import { DIRECTIONS, GHOST_SPAWNS, HOME_CORNERS } from "../constants";
import type { GhostId, GridPoint } from "../types";

const LOOKAHEAD_TILES = 4;

/**
 * Pinky - The Ambusher. Aims four tiles ahead of Pac-Man's current facing
 * direction, trying to cut off the path before he even gets there.
 */
export class PinkyGhost extends Ghost {
  public readonly id: GhostId = "pinky";
  public readonly displayName = "Pinky";
  public readonly personality = "The Ambusher - strikes at where you are headed, not where you stand.";
  protected readonly scatterCorner: GridPoint = HOME_CORNERS.pinky!;

  public constructor(levelIndex: number) {
    super(GHOST_SPAWNS.pinky!, DIRECTIONS.down, levelIndex);
  }

  protected getChaseTarget(context: GhostContext): GridPoint {
    const facing = context.pacman.facing;
    return {
      x: context.pacman.x + facing.x * LOOKAHEAD_TILES,
      y: context.pacman.y + facing.y * LOOKAHEAD_TILES
    };
  }
}
