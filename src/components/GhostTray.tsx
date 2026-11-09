import type { JSX } from "react";
import { GHOST_ORDER } from "../game/ghostArt";
import type { GhostMotionMode, HudSnapshot } from "../game/types";
import { GhostArt } from "./GhostArt";

const LABELS: Readonly<Record<GhostMotionMode, string>> = {
  house: "Waiting",
  scatter: "Scatter",
  chase: "Hunting",
  frightened: "Afraid",
  eaten: "Eyes"
};

const NAMES = { blinky: "Blinky", pinky: "Pinky", inky: "Inky", clyde: "Clyde" } as const;

/** Live ghost status: teaches the mode cycle while you play. */
export function GhostTray({ snapshot }: { readonly snapshot: HudSnapshot }): JSX.Element {
  return (
    <section className="tray" aria-label="Ghost status">
      <ul className="tray-list">
        {GHOST_ORDER.map(id => {
          const status = snapshot.ghosts.find(g => g.id === id);
          const mode: GhostMotionMode = status?.mode ?? "house";
          return (
            <li key={id} className={`tray-ghost mode-${mode}`}>
              <GhostArt id={id} size={34} afraid={mode === "frightened"} />
              <span className="tray-name">{NAMES[id]}</span>
              <span className="tray-mode">{LABELS[mode]}</span>
            </li>
          );
        })}
      </ul>
      <div className={snapshot.frightened > 0 ? "tray-fright on" : "tray-fright"} aria-hidden="true">
        <span style={{ transform: `scaleX(${snapshot.frightened})` }} />
      </div>
    </section>
  );
}
