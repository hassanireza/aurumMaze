import type { GhostId } from "./types";

export interface EyeSpec {
  readonly x: number;
  readonly y: number;
  readonly rx: number;
  readonly ry: number;
}

/**
 * Single source of truth for ghost artwork. Every shape lives in a 100x100
 * box and is consumed by both the canvas Renderer (via Path2D) and the React
 * guide (via <svg>), so what you see in the maze is exactly what the guide teaches.
 *
 *  Blinky - flame crown, jagged hem      (aggression)
 *  Pinky  - pointed arch, flowing hem    (the doorway she ambushes from)
 *  Inky   - twin-lobed, stepped hem      (two halves, one pincer)
 *  Clyde  - round dome with pom, scallops (soft and shy)
 */
export interface GhostArt {
  readonly id: GhostId;
  readonly color: string;
  readonly shade: string;
  readonly light: string;
  readonly body: string;
  /** Thin inner line work drawn over the body. */
  readonly detail: string;
  /** Solid accessory drawn in `shade` (Clyde's pom). */
  readonly accessory?: string;
  /** Inky: lighten the right half. */
  readonly split?: boolean;
  readonly eyes: readonly [EyeSpec, EyeSpec];
  /** Strokes drawn over the eyes (brows / lids), in the dark ink colour. */
  readonly lids?: string;
  readonly blush?: boolean;
}

export const GHOST_ART: Readonly<Record<GhostId, GhostArt>> = {
  blinky: {
    id: "blinky",
    color: "#d4af37",
    shade: "#8a6f16",
    light: "#f1d98a",
    body: "M14 88 L14 48 L24 22 L38 40 L50 10 L62 40 L76 22 L86 48 L86 88 L74 76 L62 88 L50 76 L38 88 L26 76 Z",
    detail: "M16 47 Q50 36 84 47",
    eyes: [
      { x: 37, y: 57, rx: 8, ry: 9 },
      { x: 63, y: 57, rx: 8, ry: 9 }
    ],
    lids: "M27 44 L47 53 M73 44 L53 53"
  },
  pinky: {
    id: "pinky",
    color: "#e7c8d9",
    shade: "#9a6f88",
    light: "#f8e6f0",
    body: "M18 86 L18 54 C18 32 32 18 50 5 C68 18 82 32 82 54 L82 86 Q74 97 66 86 Q58 75 50 86 Q42 97 34 86 Q26 75 18 86 Z",
    detail: "M30 82 L30 56 C30 41 40 29 50 20 C60 29 70 41 70 56 L70 82",
    eyes: [
      { x: 38, y: 56, rx: 8, ry: 5.5 },
      { x: 62, y: 56, rx: 8, ry: 5.5 }
    ],
    lids: "M28.5 51.5 H47.5 M52.5 51.5 H71.5"
  },
  inky: {
    id: "inky",
    color: "#9fd8d3",
    shade: "#4d8b86",
    light: "#d4f2ee",
    body: "M14 88 L14 52 C14 30 26 22 38 24 C44 25 48 29 50 36 C52 29 56 25 62 24 C74 22 86 30 86 52 L86 88 L74 88 L74 80 L62 80 L62 88 L38 88 L38 80 L26 80 L26 88 Z",
    detail: "M50 38 L50 78",
    split: true,
    eyes: [
      { x: 36, y: 54, rx: 9, ry: 10 },
      { x: 65, y: 57, rx: 6, ry: 7 }
    ]
  },
  clyde: {
    id: "clyde",
    color: "#e3a05e",
    shade: "#8f5a24",
    light: "#f6cd9c",
    body: "M15 86 L15 58 C15 33 31 20 50 20 C69 20 85 33 85 58 L85 86 Q76 77 67.5 86 Q59 77 50 86 Q41 77 32.5 86 Q24 77 15 86 Z",
    detail: "M26 70 Q50 82 74 70",
    accessory: "M43 14 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0 Z",
    eyes: [
      { x: 36, y: 57, rx: 10, ry: 11 },
      { x: 64, y: 57, rx: 10, ry: 11 }
    ],
    blush: true
  }
};

export const GHOST_ORDER: readonly GhostId[] = ["blinky", "pinky", "inky", "clyde"];

export const FRIGHT_MOUTH = "M30 72 L38 64 L46 72 L54 64 L62 72 L70 64";
export const EYE_INK = "#0b0b0d";
export const EYE_WHITE = "#f7f3e8";
