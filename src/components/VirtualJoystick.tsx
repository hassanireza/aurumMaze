import { useCallback, useRef, useState, type JSX, type PointerEvent as ReactPointerEvent } from "react";
import type { DirectionName } from "../game/types";

interface VirtualJoystickProps {
  readonly onDirection: (direction: DirectionName) => void;
}

/** Max distance (px) the knob can travel from the fixed anchor before clamping. */
const MAX_RADIUS = 42;
/** Minimum drag distance (px) before a direction is registered, to avoid jitter on tap. */
const DEAD_ZONE = 10;

interface Point {
  readonly x: number;
  readonly y: number;
}

/**
 * A fixed on-screen joystick: the base never moves, always sitting exactly
 * where its idle-state preview is drawn (bottom-left of the joystick zone).
 * The zone around it is a larger, easy-to-hit touch target — you can put
 * your thumb down anywhere nearby, not just precisely on the base — but the
 * base itself stays anchored in place and the knob is always clamped to a
 * fixed radius around it, so it can never drift or get dragged off-screen.
 * Because the underlying maze game only understands four directions, the
 * drag angle is snapped to the nearest cardinal direction.
 */
export function VirtualJoystick({ onDirection }: VirtualJoystickProps): JSX.Element {
  const zoneRef = useRef<HTMLDivElement | null>(null);
  const baseRef = useRef<HTMLDivElement | null>(null);
  const anchorRef = useRef<Point | null>(null);
  const activePointerId = useRef<number | null>(null);
  const lastDirection = useRef<DirectionName | null>(null);
  const [active, setActive] = useState(false);
  const [knobOffset, setKnobOffset] = useState<Point | null>(null);

  const resolveDirection = useCallback((dx: number, dy: number): DirectionName | null => {
    if (Math.hypot(dx, dy) < DEAD_ZONE) return null;
    return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
  }, []);

  /** The anchor is always the current center of the fixed base graphic. */
  const measureAnchor = useCallback((): Point | null => {
    const zone = zoneRef.current;
    const base = baseRef.current;
    if (!zone || !base) return null;
    const zoneRect = zone.getBoundingClientRect();
    const baseRect = base.getBoundingClientRect();
    return {
      x: baseRect.left + baseRect.width / 2 - zoneRect.left,
      y: baseRect.top + baseRect.height / 2 - zoneRect.top
    };
  }, []);

  const updateFromPointer = useCallback(
    (clientX: number, clientY: number): void => {
      const zone = zoneRef.current;
      const anchor = anchorRef.current;
      if (!zone || !anchor) return;
      const rect = zone.getBoundingClientRect();
      let dx = clientX - rect.left - anchor.x;
      let dy = clientY - rect.top - anchor.y;
      const distance = Math.hypot(dx, dy);
      if (distance > MAX_RADIUS) {
        const scale = MAX_RADIUS / distance;
        dx *= scale;
        dy *= scale;
      }
      setKnobOffset({ x: dx, y: dy });

      const direction = resolveDirection(dx, dy);
      if (direction && direction !== lastDirection.current) {
        lastDirection.current = direction;
        onDirection(direction);
      }
    },
    [onDirection, resolveDirection]
  );

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>): void => {
      const zone = zoneRef.current;
      if (!zone || activePointerId.current !== null) return;
      event.preventDefault();
      zone.setPointerCapture(event.pointerId);
      activePointerId.current = event.pointerId;
      anchorRef.current = measureAnchor();
      lastDirection.current = null;
      setActive(true);
      updateFromPointer(event.clientX, event.clientY);
    },
    [measureAnchor, updateFromPointer]
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>): void => {
      if (activePointerId.current !== event.pointerId) return;
      updateFromPointer(event.clientX, event.clientY);
    },
    [updateFromPointer]
  );

  const endTouch = useCallback((event: ReactPointerEvent<HTMLDivElement>): void => {
    if (activePointerId.current !== event.pointerId) return;
    activePointerId.current = null;
    anchorRef.current = null;
    lastDirection.current = null;
    setActive(false);
    setKnobOffset(null);
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
      <div
        ref={baseRef}
        className={active ? "joystick-base joystick-base--active" : "joystick-base"}
        aria-hidden="true"
      >
        <div
          className="joystick-knob"
          style={knobOffset ? { transform: `translate(${knobOffset.x}px, ${knobOffset.y}px)` } : undefined}
        />
      </div>
    </div>
  );
}
