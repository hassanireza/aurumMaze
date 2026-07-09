import type { JSX } from "react";
import type { HudSnapshot } from "../game/types";

interface HudProps {
  readonly snapshot: HudSnapshot;
}

export function Hud({ snapshot }: HudProps): JSX.Element {
  return (
    <div className="metrics" aria-label="Game stats">
      <div>
        <span>Score</span>
        <strong>{snapshot.score}</strong>
      </div>
      <div>
        <span>Level</span>
        <strong>{snapshot.levelIndex + 1}</strong>
      </div>
      <div>
        <span>Lives</span>
        <strong>{snapshot.lives}</strong>
      </div>
    </div>
  );
}
