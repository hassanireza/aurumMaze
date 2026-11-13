import type { DirectionName } from "./types";

/**
 * Path length (CSS px) the finger must travel in a clear line before the first
 * command fires. A thumb landing "rolls" 6 to 12 px in a random direction; 16
 * stays clear of that while still being a short, quick stroke.
 */
export const FIRST_STROKE = 16;
/** Straight stroke needed to turn 90 degrees from the last command. */
export const TURN_STROKE = 18;
/**
 * Straight stroke needed to swipe the opposite way. Longer and straighter on
 * purpose: reversing is the one mistake that kills you, so it must be deliberate.
 */
export const REVERSE_STROKE = 30;
/** Ignore sensor noise below this step (px). */
const NOISE = 0.75;
/** Winning axis must beat the other by this factor: 1.8 is about 29 degrees off-axis. */
const FIRST_RATIO = 1.8;
const TURN_RATIO = 2.2;
const REVERSE_RATIO = 2.6;
/** Net movement / path length inside the window; rejects curls and loops. */
const STRAIGHTNESS = 0.78;

const OPPOSITE: Readonly<Record<DirectionName, DirectionName>> = {
  up: "down", down: "up", left: "right", right: "left", none: "none"
};

interface Sample { readonly x: number; readonly y: number; readonly len: number }

/**
 * Reads the *direction the finger is travelling right now* (the tangent of the
 * last few pixels of its path), not "how far from where it landed".
 *
 * Why this is accurate where distance-from-origin schemes are not:
 *  - a thumb moves in arcs; an arc drifts sideways while still clearly going
 *    one way. Measuring the recent tangent ignores that drift,
 *  - the landing roll of a thumb is too short and too curly to count,
 *  - angles between two axes are treated as "undecided", never guessed,
 *  - reversing needs a longer, straighter stroke than any other turn,
 *  - the lift is never part of a gesture.
 * Pure logic (no DOM), so it is unit tested headlessly.
 */
export class SwipeRecognizer {
  private trail: Sample[] = [];
  private total = 0;
  private last: DirectionName = "none";
  private startX = 0;
  private startY = 0;
  public active = false;
  /** Furthest the finger got from where it landed: used to tell a tap from a swipe. */
  public travelled = 0;

  public start(x: number, y: number): void {
    this.trail = [{ x, y, len: 0 }];
    this.total = 0;
    this.last = "none";
    this.startX = x;
    this.startY = y;
    this.active = true;
    this.travelled = 0;
  }

  public end(): void {
    this.active = false;
    this.last = "none";
    this.trail = [];
  }

  public move(x: number, y: number): DirectionName | null {
    if (!this.active) return null;
    const tail = this.trail[this.trail.length - 1]!;
    const step = Math.hypot(x - tail.x, y - tail.y);
    if (step < NOISE) return null;
    this.total += step;
    this.trail.push({ x, y, len: this.total });
    if (this.trail.length > 96) this.trail.shift();
    this.travelled = Math.max(this.travelled, Math.hypot(x - this.startX, y - this.startY));

    // Look at the most recent stretch of path whose length depends on what we are deciding.
    const stroke = this.last === "none" ? FIRST_STROKE : TURN_STROKE;
    const verdict = this.read(x, y, stroke);
    if (verdict === null) return null;
    if (verdict.direction === this.last) return null;

    const reversing = this.last !== "none" && verdict.direction === OPPOSITE[this.last];
    if (reversing) {
      const long = this.read(x, y, REVERSE_STROKE);
      if (long === null || long.direction !== verdict.direction || long.ratio < REVERSE_RATIO) return null;
    } else if (this.last !== "none" && verdict.ratio < TURN_RATIO) {
      return null;
    } else if (this.last === "none" && verdict.ratio < FIRST_RATIO) {
      return null;
    }
    this.last = verdict.direction;
    return verdict.direction;
  }

  /** Tangent of the last `stroke` px of path, or null while it is too short, curly or undecided. */
  private read(x: number, y: number, stroke: number): { direction: DirectionName; ratio: number } | null {
    if (this.total < stroke) return null;
    const from = this.total - stroke;
    let j = this.trail.length - 1;
    while (j > 0 && this.trail[j]!.len > from) j -= 1;
    const a = this.trail[j]!;
    const pathLength = this.total - a.len;
    const dx = x - a.x;
    const dy = y - a.y;
    const net = Math.hypot(dx, dy);
    if (pathLength <= 0 || net / pathLength < STRAIGHTNESS) return null;
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);
    const major = Math.max(adx, ady);
    const minor = Math.min(adx, ady);
    const ratio = minor < 0.001 ? Number.POSITIVE_INFINITY : major / minor;
    const direction: DirectionName = adx >= ady ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
    return { direction, ratio };
  }
}
