import { useSyncExternalStore } from "react";
import { TOTAL_LEVELS } from "./game/levels";

export type Route =
  | { readonly name: "home"; readonly section: "top" | "ghosts" }
  | { readonly name: "levels" }
  | { readonly name: "play"; readonly level: number };

/** Hash routing keeps the app fully static (GitHub Pages) and makes the system back button work. */
export function parseHash(hash: string): Route {
  const [head, arg] = hash.replace(/^#\/?/, "").split("/");
  if (head === "levels") return { name: "levels" };
  if (head === "ghosts") return { name: "home", section: "ghosts" };
  if (head === "play") {
    const n = Number(arg);
    const level = Number.isInteger(n) && n >= 1 && n <= TOTAL_LEVELS ? n - 1 : 0;
    return { name: "play", level };
  }
  return { name: "home", section: "top" };
}

const subscribe = (listener: () => void): (() => void) => {
  window.addEventListener("hashchange", listener);
  return () => window.removeEventListener("hashchange", listener);
};

const snapshot = (): string => window.location.hash;

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, snapshot, () => "");
  return parseHash(hash);
}

/** Keeps the address bar in sync with in-run level changes without adding history entries. */
export function replaceHash(path: string): void {
  window.history.replaceState(null, "", `#/${path}`);
}

export const playHref = (levelIndex: number): string => `#/play/${levelIndex + 1}`;
