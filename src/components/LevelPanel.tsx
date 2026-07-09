import type { JSX } from "react";
import { LEVEL_NAMES } from "../game/constants";
import type { HudSnapshot } from "../game/types";

interface LevelPanelProps {
  readonly snapshot: HudSnapshot;
}

export function LevelPanel({ snapshot }: LevelPanelProps): JSX.Element {
  const completed = new Set(snapshot.completedLevels);
  return (
    <aside className="panel">
      <div className="panel-head">
        <p>Run profile</p>
        <strong>{snapshot.mode === "playing" ? snapshot.levelName : capitalize(snapshot.mode)}</strong>
      </div>
      <div className="level-list">
        {LEVEL_NAMES.map((name, index) => {
          const isActive = index === snapshot.levelIndex;
          const isDone = completed.has(index);
          return (
            <div key={name} className={`level-card ${isActive ? "active" : ""} ${isDone ? "done" : ""}`}>
              <b>{index + 1}</b>
              <span>
                {name}
                <small>{isActive ? "Current act" : isDone ? "Cleared" : "Locked in sequence"}</small>
              </span>
              <small>{(1.2 * (index + 1)).toFixed(1)}x</small>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

function capitalize(value: string): string {
  return value.length > 0 ? value[0]!.toUpperCase() + value.slice(1) : value;
}
