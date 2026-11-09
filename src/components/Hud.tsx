import type { JSX } from "react";
import type { HudSnapshot } from "../game/types";
import { Icon } from "./Icons";

interface HudProps {
  readonly snapshot: HudSnapshot;
  readonly onPause: () => void;
}

const fmt = (n: number): string => n.toLocaleString("en-US");

/** Compact top bar: pause · level · score · lives, with a hairline progress rail. */
export function Hud({ snapshot, onPause }: HudProps): JSX.Element {
  const done = snapshot.pelletsTotal === 0 ? 0 : 1 - snapshot.pelletsLeft / snapshot.pelletsTotal;
  return (
    <header className="hud">
      <button type="button" className="icon-btn" onClick={onPause} aria-label="Pause">
        <Icon name="pause" />
      </button>
      <div className="hud-level">
        <span>Level {snapshot.levelIndex + 1}</span>
        <strong>{snapshot.levelName}</strong>
      </div>
      <div className="hud-score" aria-label={`Score ${snapshot.score}`}>
        <span>Score</span>
        <strong>{fmt(snapshot.score)}</strong>
      </div>
      <div className="hud-lives" role="img" aria-label={`${snapshot.lives} lives`}>
        {Array.from({ length: Math.max(0, Math.min(snapshot.lives, 6)) }, (_, i) => (
          <i key={i} className="life" />
        ))}
      </div>
      <div className="hud-rail" aria-hidden="true">
        <span style={{ transform: `scaleX(${done.toFixed(3)})` }} />
      </div>
    </header>
  );
}
