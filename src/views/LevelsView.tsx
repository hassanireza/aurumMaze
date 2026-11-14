import { useState, type JSX } from "react";
import { FruitIcon } from "../components/FruitIcon";
import { Icon } from "../components/Icons";
import { fruitForLevel } from "../game/difficulty";
import { TOTAL_LEVELS } from "../game/levels";
import type { ProgressData } from "../game/Progress";
import { playHref } from "../router";

const PER_PAGE = 20;
const PAGES = Math.ceil(TOTAL_LEVELS / PER_PAGE);

/** 20 rounds per page, five rows of four: always on one screen. */
export function LevelsView({ progress }: { readonly progress: ProgressData }): JSX.Element {
  const [page, setPage] = useState(Math.floor(progress.unlocked / PER_PAGE));
  const completed = new Set(progress.completed);
  const first = page * PER_PAGE;
  const last = Math.min(TOTAL_LEVELS, first + PER_PAGE);
  const indices = Array.from({ length: last - first }, (_, i) => first + i);

  return (
    <div className="screen levels">
      <header className="screen-head">
        <p className="eyebrow">{progress.completed.length} of {TOTAL_LEVELS - 1} cleared</p>
        <h1>Rounds</h1>
        <a className="peek" href={playHref(TOTAL_LEVELS - 1)}>Peek at round 256, the kill screen</a>
      </header>

      <ul className="level-grid">
        {indices.map(index => {
          const kill = index === TOTAL_LEVELS - 1;
          const locked = !kill && index > progress.unlocked;
          const done = completed.has(index);
          const current = index === progress.unlocked && !done;
          const cls = `lv${locked ? " lv-locked" : ""}${done ? " lv-done" : ""}${current ? " lv-current" : ""}${kill ? " lv-kill" : ""}`;
          const inner = (
            <>
              <span className="lv-art" aria-hidden="true">
                {kill ? <b>?!</b> : <FruitIcon name={fruitForLevel(index).name} size={30} />}
              </span>
              <span className="lv-num">{index + 1}</span>
              <span className="lv-state" aria-hidden="true">
                {locked ? <Icon name="lock" size={14} /> : done ? <Icon name="check" size={14} /> : null}
              </span>
            </>
          );
          return (
            <li key={index}>
              {locked ? (
                <div className={cls} aria-label={`Round ${index + 1}, locked`}>{inner}</div>
              ) : (
                <a className={cls} href={playHref(index)} aria-label={kill ? "Round 256, kill screen preview" : `Round ${index + 1}${done ? ", cleared" : ""}`}>{inner}</a>
              )}
            </li>
          );
        })}
      </ul>

      <nav className="pager" aria-label="Round pages">
        <button type="button" className="icon-btn" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} aria-label="Previous rounds">
          <Icon name="chevron-left" />
        </button>
        <button type="button" className="pager-now" onClick={() => setPage(Math.floor(progress.unlocked / PER_PAGE))}>
          {first + 1}–{last}
        </button>
        <button type="button" className="icon-btn" onClick={() => setPage(p => Math.min(PAGES - 1, p + 1))} disabled={page === PAGES - 1} aria-label="Next rounds">
          <Icon name="chevron-right" />
        </button>
      </nav>
    </div>
  );
}
