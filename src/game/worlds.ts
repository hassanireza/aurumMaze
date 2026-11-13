import type { WorldTheme } from "./types";

/** Aurum's single palette: ivory-gold lines on warm black. */
export const WORLDS: readonly WorldTheme[] = [
  {
    name: "Aurum",
    tagline: "Where the gold line begins.",
    wallTop: "#e9e1cc",
    wallSide: "#8f8872",
    wallEdge: "#d8b447",
    floor: "#0a0908",
    floorAlt: "#0d0c0a",
    glow: "#d4af37",
    sky: ["#14130f", "#050505"]
  }
];

export const worldOf = (_levelIndex: number): number => 0;
