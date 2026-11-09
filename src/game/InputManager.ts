import type { DirectionName } from "./types";

const KEY_MAP: Readonly<Record<string, DirectionName>> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
  a: "left",
  d: "right",
  w: "up",
  s: "down",
  A: "left",
  D: "right",
  W: "up",
  S: "down"
};

/** Pixels of finger travel that count as one swipe. Small = snappy. */
const SWIPE_THRESHOLD = 14;

/**
 * Keyboard and swipe-anywhere input. Gestures are *continuous*: after each
 * recognised swipe the origin re-anchors to the finger, so you can steer in a
 * zig-zag without ever lifting your thumb (the same model used by the best
 * one-thumb arcade games). Pac-Man then keeps gliding on his own.
 */
export class InputManager {
  public constructor(
    private readonly onDirection: (direction: DirectionName) => void,
    private readonly onToggle: () => void,
    private readonly onTap: () => void
  ) {}

  public attachKeyboard(): () => void {
    const handler = (event: KeyboardEvent): void => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      const mapped = KEY_MAP[event.key];
      if (mapped) {
        event.preventDefault();
        this.onDirection(mapped);
        return;
      }
      if (event.key === " " || event.key === "Escape" || event.key === "p" || event.key === "P") {
        if (event.key === " " && target && target.tagName === "BUTTON") return;
        event.preventDefault();
        if (!event.repeat) this.onToggle();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }

  /** Attach swipe + tap handling to `element` (the whole play surface). */
  public attachGestures(element: HTMLElement): () => void {
    let pointerId: number | null = null;
    let originX = 0;
    let originY = 0;
    let swiped = false;

    const isUi = (target: EventTarget | null): boolean =>
      target instanceof Element && target.closest("button, a, input, [data-no-gesture]") !== null;

    const down = (event: PointerEvent): void => {
      if (pointerId !== null || isUi(event.target)) return;
      pointerId = event.pointerId;
      originX = event.clientX;
      originY = event.clientY;
      swiped = false;
      try {
        element.setPointerCapture(event.pointerId);
      } catch {
        /* capture is a nicety, not a requirement */
      }
    };

    const move = (event: PointerEvent): void => {
      if (event.pointerId !== pointerId) return;
      const dx = event.clientX - originX;
      const dy = event.clientY - originY;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_THRESHOLD) return;
      swiped = true;
      this.onDirection(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up");
      originX = event.clientX;
      originY = event.clientY;
    };

    const up = (event: PointerEvent): void => {
      if (event.pointerId !== pointerId) return;
      pointerId = null;
      if (!swiped) this.onTap();
    };

    const cancel = (event: PointerEvent): void => {
      if (event.pointerId === pointerId) pointerId = null;
    };

    element.addEventListener("pointerdown", down);
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerup", up);
    element.addEventListener("pointercancel", cancel);
    return () => {
      element.removeEventListener("pointerdown", down);
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerup", up);
      element.removeEventListener("pointercancel", cancel);
    };
  }
}
