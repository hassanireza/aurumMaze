import { useState, type JSX } from "react";
import { HeroStage } from "../components/HeroStage";
import { HowToSheet } from "../components/HowToSheet";
import { Icon } from "../components/Icons";
import { PacLogo } from "../components/Brand";
import { TOTAL_LEVELS } from "../game/levels";
import type { ProgressData } from "../game/Progress";
import { playHref } from "../router";

/** A one-screen title menu: nothing to scroll, one obvious button. */
export function HomeView({ progress }: { readonly progress: ProgressData }): JSX.Element {
  const [help, setHelp] = useState(false);
  const next = progress.unlocked;
  const started = progress.unlocked > 0 || progress.completed.length > 0;

  return (
    <div className="screen home">
      <header className="home-title">
        <PacLogo className="home-mark" />
        <h1>Aurum <em>Maze</em></h1>
        <p className="eyebrow">256 arcade rounds</p>
      </header>

      <HeroStage />

      <dl className="chips">
        <div><dt>Best</dt><dd>{progress.best.toLocaleString("en-US")}</dd></div>
        <div><dt>Cleared</dt><dd>{progress.completed.length}<small>/{TOTAL_LEVELS - 1}</small></dd></div>
      </dl>

      <div className="home-actions">
        <a className="btn btn-primary btn-cta" href={playHref(next)}>
          <Icon name="play" size={24} />
          <span>{started ? "Continue" : "Play"}<small>Round {next + 1}</small></span>
        </a>
        <div className="home-secondary">
          <button type="button" className="btn btn-ghost" onClick={() => setHelp(true)}><Icon name="help" size={20} /> How to play</button>
          <a className="btn btn-ghost" href="#/levels"><Icon name="levels" size={20} /> Rounds</a>
        </div>
      </div>

      {help ? <HowToSheet onClose={() => setHelp(false)} /> : null}
    </div>
  );
}
