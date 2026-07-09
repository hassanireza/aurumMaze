import type { JSX } from "react";
import type { DirectionName } from "../game/types";

interface TouchControlsProps {
  readonly onDirection: (direction: DirectionName) => void;
  readonly onPause: () => void;
  readonly onRestart: () => void;
}

export function TouchControls({ onDirection, onPause, onRestart }: TouchControlsProps): JSX.Element {
  return (
    <div className="controls">
      <button type="button" className="ghost-btn" onClick={onPause} aria-label="Pause or resume">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 5v14M16 5v14" />
        </svg>
        <span>Pause</span>
      </button>
      <button type="button" className="ghost-btn" onClick={onRestart} aria-label="Restart game">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M19 12a7 7 0 1 1-2.05-4.95" />
          <path d="M19 12l-4-4M19 12l-4 4" />
        </svg>
        <span>Restart</span>
      </button>
      <div className="touchpad" aria-label="Touch movement controls">
        <button type="button" onClick={() => onDirection("left")} aria-label="Move left">
          <svg viewBox="0 0 24 24">
            <path d="M5 12l7-7M5 12l7 7M5 12h14" />
          </svg>
        </button>
        <button type="button" onClick={() => onDirection("up")} aria-label="Move up">
          <svg viewBox="0 0 24 24">
            <path d="M12 5l7 7M12 5l-7 7M12 5v14" />
          </svg>
        </button>
        <button type="button" onClick={() => onDirection("down")} aria-label="Move down">
          <svg viewBox="0 0 24 24">
            <path d="M12 19l7-7M12 19l-7-7M12 19V5" />
          </svg>
        </button>
        <button type="button" onClick={() => onDirection("right")} aria-label="Move right">
          <svg viewBox="0 0 24 24">
            <path d="M19 12l-7-7M19 12l-7 7M19 12H5" />
          </svg>
        </button>
      </div>
      <div className="hint">Swipe, tap the pad, or use arrow keys.</div>
    </div>
  );
}
