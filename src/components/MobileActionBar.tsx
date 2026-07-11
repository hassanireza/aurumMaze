import type { JSX } from "react";

interface MobileActionBarProps {
  readonly onPause: () => void;
  readonly onRestart: () => void;
}

/**
 * Mobile-only Pause/Restart bar (see `.mobile-action-bar` in styles.css,
 * active at <=640px). Deliberately placed in normal document flow directly
 * below the game canvas, not floating on top of it, so it never overlaps the
 * maze view or gets brushed by a thumb reaching for the joystick.
 */
export function MobileActionBar({ onPause, onRestart }: MobileActionBarProps): JSX.Element {
  return (
    <div className="mobile-action-bar">
      <button type="button" className="mobile-action-btn" onClick={onPause} aria-label="Pause or resume">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 5v14M16 5v14" />
        </svg>
        <span>Pause</span>
      </button>
      <button type="button" className="mobile-action-btn" onClick={onRestart} aria-label="Restart game">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M19 12a7 7 0 1 1-2.05-4.95" />
          <path d="M19 12l-4-4M19 12l-4 4" />
        </svg>
        <span>Restart</span>
      </button>
    </div>
  );
}
