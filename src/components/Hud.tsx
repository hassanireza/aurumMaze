import type { JSX } from "react";
import type { HudSnapshot } from "../game/types";
import { Icon } from "./Icons";

interface HudProps {
  readonly snapshot: HudSnapshot;
  readonly onMenu: () => void;
  readonly onZoom: () => void;
}

const fmt = (n: number): string => n.toLocaleString("en-US");

/** One compact row: pause · score · best · round, over a hairline progress rail. */
export function Hud({ snapshot, onMenu, onZoom }: HudProps): JSX.Element {
  const done = snapshot.pelletsTotal === 0 ? 0 : 1 - snapshot.pelletsLeft / snapshot.pelletsTotal;
  return (
    <header className="hud">
      <button type="button" className="icon-btn" onClick={onMenu} aria-label={snapshot.mode === "ready" ? "Settings" : "Pause"}>
        <Icon name={snapshot.mode === "ready" ? "sliders" : "pause"} size={22} />
      </button>
      <div className="hud-stat hud-score" aria-label={`Score ${snapshot.score}`}>
        <span>SCORE</span>
        <strong>{fmt(snapshot.score)}</strong>
      </div>
      <div className="hud-stat" aria-label={`Best ${snapshot.best}`}>
        <span>BEST</span>
        <strong>{fmt(snapshot.best)}</strong>
      </div>
      <button type="button" className="icon-btn" onClick={onZoom} aria-label="Change zoom">
        <Icon name="zoom" size={22} />
      </button>
      <div className="hud-stat hud-round" aria-label={`Round ${snapshot.levelIndex + 1}`}>
        <span>ROUND</span>
        <strong>{snapshot.levelIndex + 1}</strong>
      </div>
      <div className="hud-rail" aria-hidden="true">
        <span style={{ transform: `scaleX(${done.toFixed(3)})` }} />
      </div>
    </header>
  );
}
