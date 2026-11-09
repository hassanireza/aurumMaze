import type { JSX, PointerEvent as ReactPointerEvent } from "react";
import type { DirectionName } from "../game/types";
import { Icon } from "./Icons";

interface TouchControlsProps {
  readonly onDirection: (direction: DirectionName) => void;
}

/**
 * Optional on-screen D-pad (enabled from the pause menu). Buttons react on
 * pointer-down rather than click, which removes ~100ms of tap latency.
 */
export function TouchControls({ onDirection }: TouchControlsProps): JSX.Element {
  const press = (direction: DirectionName) => (event: ReactPointerEvent<HTMLButtonElement>): void => {
    event.preventDefault();
    onDirection(direction);
  };
  return (
    <div className="dpad" role="group" aria-label="Directional pad" data-no-gesture>
      <button type="button" className="dpad-up" onPointerDown={press("up")} aria-label="Move up"><Icon name="arrow-up" size={28} /></button>
      <button type="button" className="dpad-left" onPointerDown={press("left")} aria-label="Move left"><Icon name="arrow-left" size={28} /></button>
      <button type="button" className="dpad-right" onPointerDown={press("right")} aria-label="Move right"><Icon name="arrow-right" size={28} /></button>
      <button type="button" className="dpad-down" onPointerDown={press("down")} aria-label="Move down"><Icon name="arrow-down" size={28} /></button>
    </div>
  );
}
