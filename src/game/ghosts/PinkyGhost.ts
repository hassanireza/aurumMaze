import { Ghost, type GhostContext } from "../Ghost";
import { DIRECTIONS, GHOST_STARTS, HOME_CORNERS } from "../constants";
import type { GhostId, GridPoint } from "../types";

const LOOKAHEAD_TILES = 4;

/**
 * Pinky - The Ambusher. Aims four tiles ahead of Pac-Man's heading to cut him
 * off. Faithful to the arcade quirk: when Pac-Man faces up she aims four tiles
 * up *and* four tiles left. When frightened she flees to whichever corner is
 * farthest from Pac-Man instead of wandering.
 */
export class PinkyGhost extends Ghost {
  public readonly id: GhostId = "pinky";
  public readonly displayName = "Pinky";
  public readonly personality = "The Ambusher - strikes where you are headed, not where you stand.";
  protected readonly scatterCorner: GridPoint = HOME_CORNERS.pinky;

  public constructor() {
    super(GHOST_STARTS.pinky, DIRECTIONS.up, "house");
  }

  protected getChaseTarget(context: GhostContext): GridPoint {
    const { pacman } = context;
    const facing = pacman.facing;
    const quirk = facing === DIRECTIONS.up ? -LOOKAHEAD_TILES : 0;
    return {
      x: pacman.x + facing.x * LOOKAHEAD_TILES + quirk,
      y: pacman.y + facing.y * LOOKAHEAD_TILES
    };
  }

  protected override getFrightenedTarget(context: GhostContext): GridPoint | null {
    const { pacman } = context;
    let best: GridPoint = HOME_CORNERS.blinky;
    let bestDistance = -1;
    for (const corner of Object.values(HOME_CORNERS)) {
      const d = (corner.x - pacman.x) ** 2 + (corner.y - pacman.y) ** 2;
      if (d > bestDistance) {
        bestDistance = d;
        best = corner;
      }
    }
    return best;
  }
}
