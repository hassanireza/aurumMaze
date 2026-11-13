import type { JSX } from "react";
import type { HudSnapshot } from "../game/types";
import { Icon } from "./Icons";

interface HudProps {
  readonly snapshot: HudSnapshot;
  readonly onPause: () => void;
  readonly onZoom: () => void;
}

const fmt = (n: number): string => n.toLocaleString("en-US");

/** One compact row: pause · score · best · round, over a hairline progress rail. */
export function Hud({ snapshot, onPause, onZoom }: HudProps): JSX.Element {
  const done = snapshot.pelletsTotal === 0 ? 0 : 1 - snapshot.pelletsLeft / snapshot.pelletsTotal;
  return (
    <header className="hud">
      <button type="button" className="icon-btn" onClick={onPause} aria-label="Pause">
        <Icon name="pause" size={22} />
      </button>
      <div className="hud-stat hud-score" aria-label={`Score ${snapshot.score}`}>
        <span>Score</span>
        <strong>{fmt(snapshot.score)}</strong>
      </div>
      <div className="hud-stat" aria-label={`Best ${snapshot.best}`}>
        <span>Best</span>
        <strong>{fmt(snapshot.best)}</strong>
      </div>
      <button type="button" className="icon-btn" onClick={onZoom} aria-label="Change zoom">
        <Icon name="zoom" size={22} />
      </button>
      <div className="hud-stat hud-round" aria-label={`Round ${snapshot.levelIndex + 1}`}>
        <span>Round</span>
        <strong>{snapshot.levelIndex + 1}</strong>
      </div>
      <div className="hud-rail" aria-hidden="true">
        <span style={{ transform: `scaleX(${done.toFixed(3)})` }} />
      </div>
    </header>
  );
}
