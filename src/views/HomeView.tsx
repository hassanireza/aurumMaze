import { useEffect, type JSX } from "react";
import { GhostArt } from "../components/GhostArt";
import { GhostGuide, ModeCycle } from "../components/GhostGuide";
import { Icon } from "../components/Icons";
import { PacLogo } from "../components/Navbar";
import { TOTAL_LEVELS } from "../game/levels";
import { WORLDS, LEVELS_PER_WORLD } from "../game/worlds";
import { GHOST_ORDER } from "../game/ghostArt";
import type { ProgressData } from "../game/Progress";
import { playHref, type Route } from "../router";

function HeroArt(): JSX.Element {
  return (
    <svg className="hero-art" viewBox="0 0 360 330" role="img" aria-label="A floating gold-lit platform with an archway, stairs and four ghosts">
      <circle className="ha-ring" cx="180" cy="130" r="128" />
      <circle className="ha-ring" cx="180" cy="130" r="98" />
      <circle className="ha-moon" cx="180" cy="130" r="66" />
      <g className="ha-stairs">
        <rect x="48" y="238" width="40" height="14" rx="3" />
        <rect x="70" y="224" width="40" height="14" rx="3" />
        <rect x="92" y="210" width="40" height="14" rx="3" />
      </g>
      <rect className="ha-side" x="70" y="232" width="236" height="40" rx="12" />
      <rect className="ha-top" x="70" y="214" width="236" height="32" rx="12" />
      <rect className="ha-tower" x="156" y="96" width="72" height="130" rx="10" />
      <path className="ha-door" d="M174 226 V170 a18 18 0 0 1 36 0 V226 Z" />
      <path className="ha-gold" d="M192 142 l6 8 h-12 z" />
      <g>
        {[100, 120, 140, 240, 260, 280].map(x => (
          <circle key={x} className="ha-pellet" cx={x} cy="230" r="3" />
        ))}
      </g>
      <g className="ha-pac">
        <circle cx="86" cy="205" r="15" fill="#d4af37" />
        <path d="M86 205 L104 195 L104 215 Z" className="ha-mouth" />
      </g>
    </svg>
  );
}

interface HomeViewProps {
  readonly route: Extract<Route, { name: "home" }>;
  readonly progress: ProgressData;
}

export function HomeView({ route, progress }: HomeViewProps): JSX.Element {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (route.section === "ghosts") {
      document.getElementById("ghosts")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 0 });
    }
  }, [route.section]);

  const next = progress.unlocked;
  const started = progress.unlocked > 0 || progress.completed.length > 0;

  return (
    <div className="page home">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow"><PacLogo /> An arcade chase in fifty acts</p>
          <h1>Aurum <em>Maze</em></h1>
          <p className="lede">
            Glide along the gold line, eat every spark, and outwit four ghosts who each hunt in their own way.
            Built on the rules of the 1980 original, redrawn as a quiet, impossible architecture.
          </p>
          <div className="hero-cta">
            <a className="btn btn-primary btn-large" href={playHref(next)}>
              <Icon name="play" size={20} /> {started ? `Continue · Level ${next + 1}` : "Begin"}
            </a>
            <a className="btn btn-ghost btn-large" href="#/levels">All levels</a>
          </div>
          <dl className="hero-stats">
            <div><dt>Best</dt><dd>{progress.best.toLocaleString("en-US")}</dd></div>
            <div><dt>Cleared</dt><dd>{progress.completed.length} / {TOTAL_LEVELS}</dd></div>
          </dl>
        </div>
        <div className="hero-stage">
          <HeroArt />
          <div className="hero-ghosts" aria-hidden="true">
            {GHOST_ORDER.map((id, i) => (
              <span key={id} className={`hero-ghost hg-${i}`}><GhostArt id={id} size={56} /></span>
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="how">
        <p className="eyebrow">How to play</p>
        <h2 id="how">Four things to know</h2>
        <div className="how-grid">
          <article className="how-card">
            <span className="how-icon"><Icon name="swipe" size={26} /></span>
            <h3>Swipe anywhere</h3>
            <p>Flick a thumb in any direction on the screen. No buttons to hunt for, and you can chain turns without lifting. Prefer buttons? Switch to a D-pad in the pause menu.</p>
          </article>
          <article className="how-card">
            <span className="how-icon"><Icon name="arrow-right" size={26} /></span>
            <h3>Pac-Man never brakes</h3>
            <p>Exactly like the original, he keeps gliding the way he faces until a wall stops him; letting go does nothing. Swipe a moment before a corner and he takes it, but an unused turn is forgotten after half a second.</p>
          </article>
          <article className="how-card">
            <span className="how-icon"><Icon name="check" size={26} /></span>
            <h3>Clear every spark</h3>
            <p>Eat each pellet to finish the level. The four gold orbs turn the ghosts blue and slow; chase them for 200, 400, 800, then 1600 points.</p>
          </article>
          <article className="how-card">
            <span className="how-icon"><Icon name="levels" size={26} /></span>
            <h3>Fifty levels, five worlds</h3>
            <p>Ghosts speed up, scatter phases shorten and orbs fade faster as you climb. Each world has its own palette and the maze changes every level.</p>
          </article>
        </div>
      </section>

      <section className="section" id="ghosts" aria-labelledby="ghost-title">
        <p className="eyebrow">Ghost guide</p>
        <h2 id="ghost-title">Four ghosts, four minds</h2>
        <p className="section-lede">
          Ghosts never choose randomly while hunting. At every junction each one picks the exit that brings it closest to a
          target tile, and each ghost picks that target differently. Learn the target and you can predict the ghost.
        </p>
        <GhostGuide />
        <h3 className="subhead">Reading the mood of the maze</h3>
        <ModeCycle />
      </section>

      <section className="section" aria-labelledby="worlds">
        <p className="eyebrow">Worlds</p>
        <h2 id="worlds">Five palettes</h2>
        <ul className="world-grid">
          {WORLDS.map((world, i) => (
            <li key={world.name} className="world-card" style={{ "--wt": world.wallTop, "--ws": world.wallSide } as React.CSSProperties}>
              <span className="world-swatch" aria-hidden="true"><i /><i /></span>
              <div>
                <strong>{world.name}</strong>
                <small>Levels {i * LEVELS_PER_WORLD + 1}–{(i + 1) * LEVELS_PER_WORLD} · {world.tagline}</small>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <footer className="footer">
        <PacLogo />
        <p>Aurum Maze · React, strict TypeScript, Canvas 2D.</p>
      </footer>
    </div>
  );
}
