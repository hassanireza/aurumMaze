import type { DirectionName } from "./types";

/** Travel (CSS px) needed to start a swipe: about iOS's own pan slop. */
export const SLOP = 10;
/** A quick flick (<= FLICK_MS) is recognised after only this much travel. */
export const FLICK_SLOP = 6;
export const FLICK_MS = 70;
/** Travel needed to turn 90 degrees from the last swipe. */
export const TURN_SLOP = 12;
/**
 * Travel needed to swipe the opposite way, measured from the furthest point
 * the finger reached. Deliberately larger: finger wobble while lifting must
 * never turn Pac-Man around.
 */
export const REVERSE_SLOP = 30;
/** The winning axis must beat the other by this factor, otherwise the gesture is ambiguous. */
const AXIS_RATIO = 1.3;
const REVERSE_AXIS_RATIO = 1.8;

const VEC: Readonly<Record<DirectionName, { readonly x: number; readonly y: number }>> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  none: { x: 0, y: 0 }
};

const OPPOSITE: Readonly<Record<DirectionName, DirectionName>> = {
  up: "down", down: "up", left: "right", right: "left", none: "none"
};

/**
 * Turns a stream of finger positions into direction commands.
 *
 * Why it feels native and does not "reverse too fast":
 *  - a small slop and an early flick path make deliberate swipes instant,
 *  - the origin follows the finger forward, so "backwards" is always measured
 *    from the furthest point reached, never from where the last command fired,
 *  - reversing needs a much longer, cleaner stroke than turning,
 *  - near-diagonal motion is ignored until one axis clearly wins.
 * Pure logic (no DOM) so it can be tested headlessly.
 */
export class SwipeRecognizer {
  private ax = 0;
  private ay = 0;
  private at = 0;
  private last: DirectionName = "none";
  public active = false;
  public travelled = 0;
  private startX = 0;
  private startY = 0;

  public start(x: number, y: number, t: number): void {
    this.ax = x; this.ay = y; this.at = t;
    this.startX = x; this.startY = y;
    this.last = "none";
    this.active = true;
    this.travelled = 0;
  }

  public end(): void {
    this.active = false;
    this.last = "none";
  }

  public move(x: number, y: number, t: number): DirectionName | null {
    if (!this.active) return null;
    this.travelled = Math.max(this.travelled, Math.hypot(x - this.startX, y - this.startY));

    // Keep the origin on the furthest point reached along the last swipe.
    if (this.last !== "none") {
      const v = VEC[this.last];
      const progress = (x - this.ax) * v.x + (y - this.ay) * v.y;
      if (progress > 0) {
        this.ax += v.x * progress;
        this.ay += v.y * progress;
      }
    }

    const dx = x - this.ax;
    const dy = y - this.ay;
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);
    const major = Math.max(adx, ady);
    const minor = Math.min(adx, ady);
    const candidate: DirectionName = adx >= ady ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";

    const reversing = this.last !== "none" && candidate === OPPOSITE[this.last];
    const sameWay = candidate === this.last;
    if (sameWay) return null;

    const quick = t - this.at <= FLICK_MS;
    const needed = reversing ? REVERSE_SLOP : this.last === "none" ? (quick ? FLICK_SLOP : SLOP) : quick ? Math.min(TURN_SLOP, FLICK_SLOP + 3) : TURN_SLOP;
    const ratio = reversing ? REVERSE_AXIS_RATIO : AXIS_RATIO;
    if (major < needed) return null;
    if (minor > 0 && major < minor * ratio) return null;

    this.last = candidate;
    this.ax = x;
    this.ay = y;
    this.at = t;
    return candidate;
  }
}
