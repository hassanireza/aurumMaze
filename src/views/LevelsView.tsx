import type { JSX } from "react";
import { Icon } from "../components/Icons";
import { MazePreview } from "../components/MazePreview";
import { LEVELS } from "../game/levels";
import type { ProgressData } from "../game/Progress";
import { playHref } from "../router";

export function LevelsView({ progress }: { readonly progress: ProgressData }): JSX.Element {
  const completed = new Set(progress.completed);
  return (
    <div className="page levels">
      <header className="page-head">
        <p className="eyebrow">One board · 256 rounds</p>
        <h1>Arcade Run</h1>
        <p className="lede">{progress.completed.length} of 255 rounds cleared. Each round reuses the same board; round 256 is the famous broken kill screen.</p>
      </header>
      <section className="world" aria-label="Pac-Man arcade rounds">
          <ul className="level-grid">
          {LEVELS.map((level, index) => {
              const locked = index > progress.unlocked;
              const done = completed.has(index);
              const current = index === progress.unlocked && !done;
              const inner = (
                <>
                  {index === 255 ? <span className="kill-preview" aria-hidden="true">256</span> : <MazePreview level={level} />}
                  <span className="lv-num">{index + 1}</span>
                  <span className="lv-name">{index === 255 ? "Kill screen" : "Arcade maze"}</span>
                  <span className="lv-state" aria-hidden="true">
                    {locked ? <Icon name="lock" size={16} /> : done ? <Icon name="check" size={16} /> : <Icon name="play" size={14} />}
                  </span>
                </>
              );
              const cls = `lv${locked ? " lv-locked" : ""}${done ? " lv-done" : ""}${current ? " lv-current" : ""}`;
              return (
                <li key={index}>
                  {locked ? (
                    <div className={cls} aria-label={`Level ${index + 1}, ${level.name}, locked`}>{inner}</div>
                  ) : (
                    <a className={cls} href={playHref(index)} aria-label={`Level ${index + 1}, ${level.name}${done ? ", cleared" : ""}`}>{inner}</a>
                  )}
                </li>
              );
            })}
          </ul>
      </section>
    </div>
  );
}
