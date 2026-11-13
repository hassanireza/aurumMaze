import type { JSX } from "react";
import { GhostArt } from "./GhostArt";
import { GHOST_ORDER } from "../game/ghostArt";

/** Looping marquee on the title screen: four ghosts chase Pac-Man along a dotted corridor. */
export function HeroStage(): JSX.Element {
  return (
    <div className="stage" aria-hidden="true">
      <div className="stage-track" />
      <div className="stage-run">
        {GHOST_ORDER.map((id, i) => (
          <span key={id} className="stage-ghost" style={{ animationDelay: `${i * -0.18}s` }}>
            <GhostArt id={id} size={46} />
          </span>
        ))}
        <svg className="stage-pac" viewBox="-26 -26 52 52" width="50" height="50">
          <path className="pac-top" d="M-24 0 A24 24 0 0 1 24 0 Z" fill="#ffd84a" />
          <path className="pac-bottom" d="M-24 0 A24 24 0 0 0 24 0 Z" fill="#ffd84a" />
        </svg>
      </div>
    </div>
  );
}
