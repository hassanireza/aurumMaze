import { useCallback, useRef, useState, type JSX, type PointerEvent as ReactPointerEvent } from "react";
import type { DirectionName } from "../game/types";

interface VirtualJoystickProps {
  readonly onDirection: (direction: DirectionName) => void;
}

/** Max distance (px) the knob can travel from its base before clamping. */
const MAX_RADIUS = 46;
/** Minimum drag distance (px) before a direction is registered, to avoid jitter on tap. */
const DEAD_ZONE = 10;

interface JoystickVisual {
  readonly baseX: number;
  readonly baseY: number;
  readonly knobX: number;
  readonly knobY: number;
}

/**
 * A dynamic, floating on-screen joystick in the style of mobile GTA / twin-stick
 * shooters: the base appears wherever the thumb first touches down inside the
 * joystick zone (rather than requiring a precise tap on a fixed small target),
 * and the knob is dragged from there to indicate a direction. Because the
 * underlying maze game only understands four directions, the drag angle is
 * snapped to the nearest cardinal direction.
 */
export function VirtualJoystick({ onDirection }: VirtualJoystickProps): JSX.Element {
  const zoneRef = useRef<HTMLDivElement | null>(null);
  const originRef = useRef<{ x: number; y: number } | null>(null);
  const activePointerId = useRef<number | null>(null);
  const lastDirection = useRef<DirectionName | null>(null);
  const [visual, setVisual] = useState<JoystickVisual | null>(null);

  const resolveDirection = useCallback((dx: number, dy: number): DirectionName | null => {
    if (Math.hypot(dx, dy) < DEAD_ZONE) return null;
    return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
  }, []);

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>): void => {
    const zone = zoneRef.current;
    if (!zone || activePointerId.current !== null) return;
    event.preventDefault();
    zone.setPointerCapture(event.pointerId);
    activePointerId.current = event.pointerId;
    const rect = zone.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    originRef.current = { x, y };
    lastDirection.current = null;
    setVisual({ baseX: x, baseY: y, knobX: x, knobY: y });
  }, []);

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>): void => {
      if (activePointerId.current !== event.pointerId || !originRef.current) return;
      const zone = zoneRef.current;
      if (!zone) return;
      const rect = zone.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      let dx = x - originRef.current.x;
      let dy = y - originRef.current.y;
      const distance = Math.hypot(dx, dy);
      if (distance > MAX_RADIUS) {
        const scale = MAX_RADIUS / distance;
        dx *= scale;
        dy *= scale;
      }
      setVisual({
        baseX: originRef.current.x,
        baseY: originRef.current.y,
        knobX: originRef.current.x + dx,
        knobY: originRef.current.y + dy
      });

      const direction = resolveDirection(dx, dy);
      if (direction && direction !== lastDirection.current) {
        lastDirection.current = direction;
        onDirection(direction);
      }
    },
    [onDirection, resolveDirection]
  );

  const endTouch = useCallback((event: ReactPointerEvent<HTMLDivElement>): void => {
    if (activePointerId.current !== event.pointerId) return;
    activePointerId.current = null;
    originRef.current = null;
    lastDirection.current = null;
    setVisual(null);
  }, []);

  return (
    <div
      ref={zoneRef}
      className="joystick-zone"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endTouch}
      onPointerCancel={endTouch}
      onPointerLeave={endTouch}
      aria-label="Movement joystick, touch and drag to move"
      role="presentation"
    >
      <div className="joystick-idle-hint" aria-hidden="true">
        <span />
      </div>
      {visual && (
        <div
          className="joystick-base"
          style={{ left: visual.baseX, top: visual.baseY }}
          aria-hidden="true"
        >
          <div
            className="joystick-knob"
            style={{ left: visual.knobX - visual.baseX, top: visual.knobY - visual.baseY }}
          />
        </div>
      )}
    </div>
  );
}
