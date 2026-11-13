import type { JSX } from "react";
import { GHOST_ORDER } from "../game/ghostArt";
import type { GhostMotionMode, HudSnapshot } from "../game/types";
import { GhostArt } from "./GhostArt";

const LABELS: Readonly<Record<GhostMotionMode, string>> = {
  house: "waiting",
  scatter: "scattering",
  chase: "hunting",
  frightened: "frightened",
  eaten: "returning"
};

/** Four small chips: which ghost is doing what, plus the frightened countdown. */
export function GhostTray({ snapshot }: { readonly snapshot: HudSnapshot }): JSX.Element {
  return (
    <section className="tray" aria-label="Ghost status">
      <ul className="tray-list">
        {GHOST_ORDER.map(id => {
          const status = snapshot.ghosts.find(g => g.id === id);
          const mode: GhostMotionMode = status?.mode ?? "house";
          return (
            <li key={id} className={`tray-ghost mode-${mode}`} aria-label={`${id} ${LABELS[mode]}`}>
              <GhostArt id={id} size={28} afraid={mode === "frightened"} />
              <i className="tray-dot" />
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
