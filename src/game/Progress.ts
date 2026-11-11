import type { ControlScheme, HapticKind } from "./types";
import { TOTAL_LEVELS } from "./levels";

export interface ProgressData {
  /** Highest level index the player may start (0-based). */
  readonly unlocked: number;
  readonly best: number;
  readonly completed: readonly number[];
  readonly controls: ControlScheme;
  readonly haptics: boolean;
}

const STORAGE_KEY = "aurum-maze:v2";
const DEFAULTS: ProgressData = { unlocked: 0, best: 0, completed: [], controls: "swipe", haptics: true };

type Listener = () => void;

/** Tiny persisted store (localStorage, safe when unavailable) consumable via useSyncExternalStore. */
class ProgressStore {
  private data: ProgressData = this.read();
  private readonly listeners = new Set<Listener>();

  private read(): ProgressData {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULTS;
      const parsed = JSON.parse(raw) as Partial<ProgressData>;
      const completed = Array.isArray(parsed.completed)
        ? parsed.completed.filter((n): n is number => Number.isInteger(n) && n >= 0 && n < TOTAL_LEVELS)
        : [];
      return {
        unlocked: Math.max(0, Math.min(TOTAL_LEVELS - 1, Number(parsed.unlocked) || 0)),
        best: Math.max(0, Number(parsed.best) || 0),
        completed,
        controls: parsed.controls === "dpad" ? "dpad" : "swipe",
        haptics: parsed.haptics !== false
      };
    } catch {
      return DEFAULTS;
    }
  }

  private commit(next: ProgressData): void {
    this.data = next;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* private mode: keep in memory only */
    }
    this.listeners.forEach(listener => listener());
  }

  public subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  public getSnapshot = (): ProgressData => this.data;

  public markCleared(levelIndex: number, score: number): void {
    if (levelIndex >= 255) {
      this.recordScore(score);
      return;
    }
    const completed = this.data.completed.includes(levelIndex) ? this.data.completed : [...this.data.completed, levelIndex];
    this.commit({
      ...this.data,
      completed,
      unlocked: Math.max(this.data.unlocked, Math.min(TOTAL_LEVELS - 1, levelIndex + 1)),
      best: Math.max(this.data.best, score)
    });
  }

  public recordScore(score: number): void {
    if (score > this.data.best) this.commit({ ...this.data, best: score });
  }

  public setControls(controls: ControlScheme): void {
    this.commit({ ...this.data, controls });
  }

  public setHaptics(haptics: boolean): void {
    this.commit({ ...this.data, haptics });
  }

  public reset(): void {
    this.commit(DEFAULTS);
  }
}

export const progressStore = new ProgressStore();

const PATTERNS: Readonly<Record<HapticKind, number | number[]>> = {
  power: 18,
  eat: [12, 30, 12],
  die: [60, 40, 90],
  clear: [20, 40, 20, 40, 60]
};

/** Short vibration cues on devices that support it (Android browsers); silent elsewhere. */
export function haptic(kind: HapticKind, enabled: boolean): void {
  if (!enabled || typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate(PATTERNS[kind]);
  } catch {
    /* ignore */
  }
}
