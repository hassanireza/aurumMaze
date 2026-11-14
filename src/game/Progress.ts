import type { ControlScheme, HapticKind, ViewMode } from "./types";
import { TOTAL_LEVELS } from "./levels";

export interface ProgressData {
  /** Highest level index the player may start (0-based). */
  readonly unlocked: number;
  readonly best: number;
  readonly completed: readonly number[];
  readonly controls: ControlScheme;
  readonly haptics: boolean;
  readonly sound: boolean;
  readonly camera: ViewMode;
  readonly pace: "comfort" | "arcade";
}

const STORAGE_KEY = "aurum-maze:v2";
const DEFAULTS: ProgressData = { unlocked: 0, best: 0, completed: [], controls: "swipe", haptics: true, sound: true, camera: "full", pace: "comfort" };

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
        haptics: parsed.haptics !== false,
        sound: parsed.sound !== false,
        pace: parsed.pace === "arcade" ? "arcade" : "comfort",
        camera: parsed.camera === "close" || parsed.camera === "closer" ? parsed.camera : "full"
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

  public setView(view: ViewMode): void {
    this.commit({ ...this.data, camera: view });
  }

  public setPace(pace: "comfort" | "arcade"): void {
    this.commit({ ...this.data, pace });
  }

  public setSound(sound: boolean): void {
    this.commit({ ...this.data, sound });
  }

  public reset(): void {
    this.commit(DEFAULTS);
  }
}

export const progressStore = new ProgressStore();

const PATTERNS: Readonly<Record<HapticKind, number | number[]>> = {
  tick: 8,
  power: 18,
  eat: [12, 30, 12],
  die: [60, 40, 90],
  clear: [20, 40, 20, 40, 60]
};

/** iPhone has no navigator.vibrate. Delays (ms) of taps for the Taptic Engine fallback below. */
const IOS_TAPS: Readonly<Record<HapticKind, readonly number[]>> = {
  tick: [0],
  power: [0, 70],
  eat: [0, 60],
  die: [0, 90, 190],
  clear: [0, 110, 220, 330]
};

let iosSwitch: HTMLLabelElement | null = null;

/**
 * iOS 17.4+ plays a light haptic tick whenever a native switch control toggles.
 * A hidden `<input type="checkbox" switch>` clicked from script is the only way
 * Safari exposes the Taptic Engine to web pages. Safari allows it only shortly
 * after a real touch, so it is best effort: it silently does nothing otherwise.
 */
function iosTap(): void {
  if (typeof document === "undefined") return;
  if (!iosSwitch) {
    const label = document.createElement("label");
    label.setAttribute("aria-hidden", "true");
    label.style.display = "none";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.setAttribute("switch", "");
    label.appendChild(input);
    document.head.appendChild(label);
    iosSwitch = label;
  }
  iosSwitch.click();
}

export const hapticsSupported = (): boolean =>
  typeof navigator !== "undefined" && (typeof navigator.vibrate === "function" || /iPhone|iPad/.test(navigator.userAgent));

/** Short cues: vibration on Android, Taptic ticks on iPhone, silent elsewhere. */
export function haptic(kind: HapticKind, enabled: boolean): void {
  if (!enabled || typeof navigator === "undefined") return;
  try {
    if (typeof navigator.vibrate === "function") {
      navigator.vibrate(PATTERNS[kind]);
      return;
    }
    for (const delay of IOS_TAPS[kind]) {
      if (delay === 0) iosTap();
      else window.setTimeout(iosTap, delay);
    }
  } catch {
    /* ignore */
  }
}
