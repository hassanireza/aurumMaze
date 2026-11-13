import type { JSX } from "react";
import type { ControlScheme, ViewMode } from "../game/types";
import { Icon } from "./Icons";
import { Sheet } from "./Sheet";

interface PauseSheetProps {
  readonly controls: ControlScheme;
  readonly haptics: boolean;
  readonly sound: boolean;
  readonly view: ViewMode;
  readonly onView: (view: ViewMode) => void;
  readonly onResume: () => void;
  readonly onRestart: () => void;
  readonly onControls: (controls: ControlScheme) => void;
  readonly onHaptics: (enabled: boolean) => void;
  readonly onSound: (enabled: boolean) => void;
}

function Switch({ on, label, onToggle }: { readonly on: boolean; readonly label: string; readonly onToggle: () => void }): JSX.Element {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} className={on ? "switch on" : "switch"} onClick={onToggle}>
      <span className="switch-knob" />
    </button>
  );
}

export function PauseSheet({ controls, haptics, sound, view, onView, onResume, onRestart, onControls, onHaptics, onSound }: PauseSheetProps): JSX.Element {
  return (
    <Sheet label="Paused" onClose={onResume}>
      <h2 className="sheet-title">Paused</h2>

      <div className="sheet-row">
        <span className="sheet-label">Controls</span>
        <div className="segmented" role="radiogroup" aria-label="Controls">
          <button type="button" role="radio" aria-checked={controls === "swipe"} className={controls === "swipe" ? "on" : ""} onClick={() => onControls("swipe")}>
            <Icon name="swipe" size={18} /> Swipe
          </button>
          <button type="button" role="radio" aria-checked={controls === "dpad"} className={controls === "dpad" ? "on" : ""} onClick={() => onControls("dpad")}>
            <Icon name="arrow-up" size={18} /> D-pad
          </button>
        </div>
      </div>
      <div className="sheet-row">
        <span className="sheet-label"><Icon name="zoom" size={18} /> View</span>
        <div className="segmented" role="radiogroup" aria-label="View">
          {(["full", "close", "closer"] as const).map(v => (
            <button key={v} type="button" role="radio" aria-checked={view === v} className={view === v ? "on" : ""} onClick={() => onView(v)}>
              {v === "full" ? "Full" : v === "close" ? "Close" : "Closer"}
            </button>
          ))}
        </div>
      </div>
      <div className="sheet-row">
        <span className="sheet-label"><Icon name={sound ? "sound" : "mute"} size={18} /> Sound</span>
        <Switch on={sound} label="Sound" onToggle={() => onSound(!sound)} />
      </div>
      <div className="sheet-row">
        <span className="sheet-label"><Icon name="vibrate" size={18} /> Haptics</span>
        <Switch on={haptics} label="Haptics" onToggle={() => onHaptics(!haptics)} />
      </div>

      <nav className="sheet-links" aria-label="Leave game">
        <button type="button" onClick={onRestart}><Icon name="restart" size={18} /> Restart</button>
        <a href="#/levels"><Icon name="levels" size={18} /> Rounds</a>
        <a href="#/"><Icon name="home" size={18} /> Home</a>
      </nav>

      <button type="button" className="btn btn-primary btn-block btn-large" onClick={onResume} autoFocus>
        <Icon name="play" size={20} /> Resume
      </button>
    </Sheet>
  );
}
