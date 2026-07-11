import type { JSX } from "react";
import { VirtualJoystick } from "./VirtualJoystick";
import type { DirectionName } from "../game/types";

interface MobileControlsProps {
  readonly onDirection: (direction: DirectionName) => void;
}

/**
 * Mobile-only movement layer, rendered on top of the game canvas (see the
 * `.mobile-controls` breakpoint in styles.css, active at <=640px).
 *
 * Only the joystick lives here, anchored to the bottom-left and reachable by
 * the left thumb without occluding the maze. Pause/Restart deliberately live
 * outside the canvas entirely, in `MobileActionBar`, so no button ever sits
 * on top of the game screen.
 */
export function MobileControls({ onDirection }: MobileControlsProps): JSX.Element {
  return (
    <div className="mobile-controls">
      <VirtualJoystick onDirection={onDirection} />
    </div>
  );
}
