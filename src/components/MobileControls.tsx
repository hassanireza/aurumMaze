import type { JSX } from "react";
import { VirtualJoystick } from "./VirtualJoystick";
import type { DirectionName } from "../game/types";

interface MobileControlsProps {
  readonly onDirection: (direction: DirectionName) => void;
  readonly onPause: () => void;
  readonly onRestart: () => void;
}

/**
 * Mobile-only control layer, rendered on top of the game canvas (see the
 * `.mobile-controls` breakpoint in styles.css, active at <=640px).
 *
 * Design rationale:
 * - A floating joystick anchored to the bottom-left, reachable by the left
 *   thumb without occluding the view of the maze, replaces the old cramped
 *   4-in-a-row directional buttons.
 * - Pause/Restart are large (52px) circular buttons in the opposite top-right
 *   corner, reachable by the right thumb, and separated from movement
 *   controls so they can't be hit accidentally mid-chase.
 * - Everything sits above the canvas with pointer-events disabled on the
 *   wrapper itself, so the untouched center of the board still supports the
 *   existing swipe-to-move gesture as a fallback.
 */
export function MobileControls({ onDirection, onPause, onRestart }: MobileControlsProps): JSX.Element {
  return (
    <div className="mobile-controls">
      <VirtualJoystick onDirection={onDirection} />

      <div className="mobile-action-bar">
        <button type="button" onClick={onPause} aria-label="Pause or resume">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 5v14M16 5v14" />
          </svg>
        </button>
        <button type="button" onClick={onRestart} aria-label="Restart game">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M19 12a7 7 0 1 1-2.05-4.95" />
            <path d="M19 12l-4-4M19 12l-4 4" />
          </svg>
        </button>
      </div>
    </div>
  );
}
