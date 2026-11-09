import type { JSX } from "react";
import { Icon } from "../components/Icons";
import { MazePreview } from "../components/MazePreview";
import { LEVELS } from "../game/levels";
import { LEVELS_PER_WORLD, WORLDS } from "../game/worlds";
import type { ProgressData } from "../game/Progress";
import { playHref } from "../router";

export function LevelsView({ progress }: { readonly progress: ProgressData }): JSX.Element {
  const completed = new Set(progress.completed);
  return (
    <div className="page levels">
      <header className="page-head">
        <p className="eyebrow">Choose your act</p>
        <h1>Levels</h1>
        <p className="lede">{progress.completed.length} of {LEVELS.length} cleared. Clear a level to unlock the next.</p>
      </header>

      {WORLDS.map((world, w) => (
        <section
          key={world.name}
          className="world"
          aria-labelledby={`world-${w}`}
          style={{ "--wt": world.wallTop, "--ws": world.wallSide, "--wg": world.glow } as React.CSSProperties}
        >
          <div className="world-head">
            <span className="world-num">{["I", "II", "III", "IV", "V"][w]}</span>
            <div>
              <h2 id={`world-${w}`}>{world.name}</h2>
              <p>{world.tagline}</p>
            </div>
          </div>
          <ul className="level-grid">
            {LEVELS.slice(w * LEVELS_PER_WORLD, (w + 1) * LEVELS_PER_WORLD).map((level, i) => {
              const index = w * LEVELS_PER_WORLD + i;
              const locked = index > progress.unlocked;
              const done = completed.has(index);
              const current = index === progress.unlocked && !done;
              const inner = (
                <>
                  <MazePreview level={level} />
                  <span className="lv-num">{index + 1}</span>
                  <span className="lv-name">{level.name}</span>
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
      ))}
    </div>
  );
}
