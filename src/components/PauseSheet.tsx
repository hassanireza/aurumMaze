import type { JSX } from "react";
import type { ControlScheme } from "../game/types";
import { Icon } from "./Icons";

interface PauseSheetProps {
  readonly controls: ControlScheme;
  readonly haptics: boolean;
  readonly onResume: () => void;
  readonly onRestart: () => void;
  readonly onControls: (controls: ControlScheme) => void;
  readonly onHaptics: (enabled: boolean) => void;
}

/**
 * Bottom sheet, because the bottom third of a phone is where thumbs live.
 * Resume is the largest, lowest control; destructive actions sit above it.
 */
export function PauseSheet({ controls, haptics, onResume, onRestart, onControls, onHaptics }: PauseSheetProps): JSX.Element {
  return (
    <div className="sheet-root" data-no-gesture>
      <button type="button" className="sheet-scrim" aria-label="Resume game" onClick={onResume} />
      <section className="sheet" role="dialog" aria-modal="true" aria-label="Paused">
        <span className="sheet-handle" aria-hidden="true" />
        <p className="eyebrow">Paused</p>
        <h2>Hold the line</h2>

        <div className="sheet-group" role="radiogroup" aria-label="Controls">
          <span className="sheet-label">Controls</span>
          <div className="segmented">
            <button type="button" role="radio" aria-checked={controls === "swipe"} className={controls === "swipe" ? "on" : ""} onClick={() => onControls("swipe")}>
              <Icon name="swipe" size={18} /> Swipe
            </button>
            <button type="button" role="radio" aria-checked={controls === "dpad"} className={controls === "dpad" ? "on" : ""} onClick={() => onControls("dpad")}>
              <Icon name="arrow-up" size={18} /> D-pad
            </button>
          </div>
        </div>

        <div className="sheet-group">
          <span className="sheet-label">Haptics</span>
          <button type="button" role="switch" aria-checked={haptics} className={haptics ? "switch on" : "switch"} onClick={() => onHaptics(!haptics)}>
            <span className="switch-knob" />
            <span className="sr-only">{haptics ? "On" : "Off"}</span>
          </button>
        </div>

        <nav className="sheet-links" aria-label="Leave game">
          <a href="#/levels"><Icon name="levels" size={18} /> Levels</a>
          <a href="#/"><Icon name="home" size={18} /> Home</a>
          <button type="button" onClick={onRestart}><Icon name="restart" size={18} /> Restart</button>
        </nav>

        <button type="button" className="btn btn-primary btn-block" onClick={onResume} autoFocus>
          <Icon name="play" size={18} /> Resume
        </button>
      </section>
    </div>
  );
}
