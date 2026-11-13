import type { DirectionName } from "./types";
import { sfx } from "./Sfx";
import { FIRST_STROKE, SwipeRecognizer } from "./SwipeRecognizer";

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

/**
 * Keyboard and swipe-anywhere input. Gestures are continuous (steer in a
 * zig-zag without lifting your thumb) and recognised by SwipeRecognizer.
 * Pac-Man then keeps gliding on his own.
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
      sfx.unlock();
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
    const recognizer = new SwipeRecognizer();
    let pointerId: number | null = null;
    let downAt = 0;

    const isUi = (target: EventTarget | null): boolean =>
      target instanceof Element && target.closest("button, a, input, [data-no-gesture]") !== null;

    const feed = (event: PointerEvent): void => {
      // iOS delivers touches at up to 120 Hz but may coalesce them: feed every sample, in order.
      const samples = typeof event.getCoalescedEvents === "function" ? event.getCoalescedEvents() : [];
      const list = samples.length > 0 ? samples : [event];
      for (const sample of list) {
        const direction = recognizer.move(sample.clientX, sample.clientY);
        if (direction) this.onDirection(direction);
      }
    };

    const reset = (): void => {
      pointerId = null;
      recognizer.end();
    };

    const down = (event: PointerEvent): void => {
      if (isUi(event.target)) return;
      // A new finger replaces a stale one (e.g. after a system gesture swallowed the old pointerup).
      if (pointerId !== null && event.isPrimary === false) return;
      sfx.unlock();
      pointerId = event.pointerId;
      downAt = event.timeStamp;
      recognizer.start(event.clientX, event.clientY);
      try {
        element.setPointerCapture(event.pointerId);
      } catch {
        /* capture is a nicety, not a requirement */
      }
    };

    const move = (event: PointerEvent): void => {
      if (event.pointerId !== pointerId) return;
      feed(event);
    };

    const up = (event: PointerEvent): void => {
      if (event.pointerId !== pointerId) return;
      // The lift itself is never a gesture: wobble while releasing must not steer.
      const wasTap = recognizer.travelled < FIRST_STROKE && event.timeStamp - downAt < 350;
      reset();
      sfx.unlock();
      if (wasTap) this.onTap();
    };

    const cancel = (event: PointerEvent): void => {
      if (event.pointerId === pointerId) reset();
    };

    // iOS Safari: stop pinch-zoom, double-tap zoom, the text/callout menu and rubber banding on the play surface.
    const block = (event: Event): void => {
      if (!isUi(event.target)) event.preventDefault();
    };
    const blockTouch = (event: TouchEvent): void => {
      if (event.cancelable && !isUi(event.target)) event.preventDefault();
    };

    element.addEventListener("pointerdown", down);
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerup", up);
    element.addEventListener("pointercancel", cancel);
    element.addEventListener("lostpointercapture", cancel);
    element.addEventListener("touchmove", blockTouch, { passive: false });
    element.addEventListener("contextmenu", block);
    document.addEventListener("gesturestart", block as EventListener);
    document.addEventListener("gesturechange", block as EventListener);
    return () => {
      element.removeEventListener("pointerdown", down);
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerup", up);
      element.removeEventListener("pointercancel", cancel);
      element.removeEventListener("lostpointercapture", cancel);
      element.removeEventListener("touchmove", blockTouch);
      element.removeEventListener("contextmenu", block);
      document.removeEventListener("gesturestart", block as EventListener);
      document.removeEventListener("gesturechange", block as EventListener);
    };
  }
}
