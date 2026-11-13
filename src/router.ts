import { useEffect, useState } from "react";
import { TOTAL_LEVELS } from "./game/levels";

export type Route =
  | { readonly name: "home" }
  | { readonly name: "ghosts" }
  | { readonly name: "levels" }
  | { readonly name: "play"; readonly level: number };

/** Hash routing keeps the app fully static (GitHub Pages) and makes the system back button work. */
export function parseHash(hash: string): Route {
  const [head, arg] = hash.replace(/^#\/?/, "").split("/");
  if (head === "levels") return { name: "levels" };
  if (head === "ghosts") return { name: "ghosts" };
  if (head === "play") {
    const n = Number(arg);
    const level = Number.isInteger(n) && n >= 1 && n <= TOTAL_LEVELS ? n - 1 : 0;
    return { name: "play", level };
  }
  return { name: "home" };
}

/**
 * Route state only changes on real navigation (`hashchange`). In-run level
 * changes use `replaceHash`, which deliberately does NOT remount the game.
 */
export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = (): void => setRoute(parseHash(window.location.hash));
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}

/** Keeps the address bar in sync with in-run level changes without adding history entries. */
export function replaceHash(path: string): void {
  window.history.replaceState(null, "", `#/${path}`);
}

export const playHref = (levelIndex: number): string => `#/play/${levelIndex + 1}`;
