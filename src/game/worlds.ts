import type { WorldTheme } from "./types";

/**
 * Five worlds of ten levels. World I is the original Aurum identity (ivory on
 * ink, gold accents); the rest introduce muted Monument-Valley pastels while
 * keeping the black ground and the gold line.
 */
export const WORLDS: readonly WorldTheme[] = [
  {
    name: "Ivory Terraces",
    tagline: "Where the gold line begins.",
    wallTop: "#e9e1cc",
    wallSide: "#8f8872",
    wallEdge: "#fff8e1",
    floor: "#0b0b0a",
    floorAlt: "#10100e",
    glow: "#d4af37",
    sky: ["#14130f", "#050505"]
  },
  {
    name: "Jade Gardens",
    tagline: "Still water, sharp turns.",
    wallTop: "#7fc4b8",
    wallSide: "#3b7770",
    wallEdge: "#bfeee5",
    floor: "#07100f",
    floorAlt: "#0b1615",
    glow: "#9fd8d3",
    sky: ["#0c1c1b", "#040706"]
  },
  {
    name: "Rose Observatory",
    tagline: "Watch the sky, mind the corners.",
    wallTop: "#e0a8bf",
    wallSide: "#8d5a73",
    wallEdge: "#ffd9e8",
    floor: "#110a0e",
    floorAlt: "#170e13",
    glow: "#e7c8d9",
    sky: ["#231019", "#070305"]
  },
  {
    name: "Violet Citadel",
    tagline: "Impossible stairs, honest ghosts.",
    wallTop: "#a99be0",
    wallSide: "#5a4f9c",
    wallEdge: "#dcd5ff",
    floor: "#0a0916",
    floorAlt: "#100e1f",
    glow: "#b9aee9",
    sky: ["#161232", "#05040b"]
  },
  {
    name: "Ember Sanctum",
    tagline: "The last climb is the hottest.",
    wallTop: "#eaa57e",
    wallSide: "#a2593a",
    wallEdge: "#ffd7bd",
    floor: "#120a06",
    floorAlt: "#190f09",
    glow: "#e3a05e",
    sky: ["#2a140b", "#070302"]
  }
];

export const LEVELS_PER_WORLD = 10;
export const worldOf = (levelIndex: number): number => Math.min(WORLDS.length - 1, Math.floor(levelIndex / LEVELS_PER_WORLD));
