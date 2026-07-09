import type { DirectionName } from "./types";

const KEY_MAP: Readonly<Record<string, DirectionName>> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
  a: "left",
  d: "right",
  w: "up",
  s: "down"
};

const SWIPE_THRESHOLD = 18;

/** Encapsulates keyboard, swipe and on-screen-pad input into one direction stream. */
export class InputManager {
  private touchOrigin: { x: number; y: number } | null = null;

  public constructor(
    private readonly onDirection: (direction: DirectionName) => void,
    private readonly onToggleAction: () => void
  ) {}

  public attachKeyboard(): () => void {
    const handler = (event: KeyboardEvent): void => {
      const mapped = KEY_MAP[event.key];
      if (mapped) {
        event.preventDefault();
        this.onDirection(mapped);
        return;
      }
      if (event.key === " ") {
        event.preventDefault();
        this.onToggleAction();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }

  public handlePointerDown(x: number, y: number): void {
    this.touchOrigin = { x, y };
  }

  public handlePointerUp(x: number, y: number, onTap: () => void): void {
    if (!this.touchOrigin) return;
    const dx = x - this.touchOrigin.x;
    const dy = y - this.touchOrigin.y;
    const magnitude = Math.max(Math.abs(dx), Math.abs(dy));
    if (magnitude < SWIPE_THRESHOLD) {
      onTap();
    } else if (Math.abs(dx) > Math.abs(dy)) {
      this.onDirection(dx > 0 ? "right" : "left");
    } else {
      this.onDirection(dy > 0 ? "down" : "up");
    }
    this.touchOrigin = null;
  }
}
