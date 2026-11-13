import { useEffect, useRef, useState, type JSX } from "react";
import { GhostArt } from "../components/GhostArt";
import { GhostDiagram } from "../components/GhostDiagram";
import { GHOST_ORDER } from "../game/ghostArt";
import type { GhostId } from "../game/types";

interface Entry {
  readonly name: string;
  readonly epithet: string;
  readonly hunts: string;
  readonly corner: string;
  readonly starts: string;
  readonly tip: string;
}

const GUIDE: Readonly<Record<GhostId, Entry>> = {
  blinky: {
    name: "Blinky",
    epithet: "The Chaser",
    hunts: "Your exact tile. Nothing clever, which is why he never lets go.",
    corner: "Top right",
    starts: "Already outside. Speeds up when few dots remain.",
    tip: "Loop around a block and drag him into a gold orb."
  },
  pinky: {
    name: "Pinky",
    epithet: "The Ambusher",
    hunts: "Four tiles ahead of where you face. Facing up also shifts her four tiles left.",
    corner: "Top left",
    starts: "Leaves the house straight away.",
    tip: "Turn toward her: her aim flies past you."
  },
  inky: {
    name: "Inky",
    epithet: "The Flanker",
    hunts: "A pincer. Blinky's line through the tile two ahead of you, doubled.",
    corner: "Bottom right",
    starts: "Leaves after 30 dots on round 1.",
    tip: "Watch Blinky. Inky arrives from the opposite side."
  },
  clyde: {
    name: "Clyde",
    epithet: "The Shy One",
    hunts: "You, from far away. Inside 8 tiles he loses his nerve and runs home.",
    corner: "Bottom left",
    starts: "Leaves last, after 60 dots on round 1.",
    tip: "Get close and he backs off. The easiest ghost to slip past."
  }
};

/** One ghost per screen: swipe sideways, no vertical scrolling. */
export function GhostsView(): JSX.Element {
  const scroller = useRef<HTMLDivElement | null>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const onScroll = (): void => setIndex(Math.max(0, Math.min(3, Math.round(el.scrollLeft / el.clientWidth))));
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const go = (i: number): void => {
    const el = scroller.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="screen ghosts">
      <header className="screen-head">
        <p className="eyebrow">Know your enemy</p>
        <h1>The Ghosts</h1>
      </header>

      <div className="ghost-tabs" role="tablist" aria-label="Choose a ghost">
        {GHOST_ORDER.map((id, i) => (
          <button key={id} type="button" role="tab" aria-selected={i === index} aria-label={GUIDE[id].name} className={i === index ? "on" : ""} onClick={() => go(i)}>
            <GhostArt id={id} size={34} />
          </button>
        ))}
      </div>

      <div className="ghost-scroller" ref={scroller}>
        {GHOST_ORDER.map(id => {
          const g = GUIDE[id];
          return (
            <article key={id} className={`ghost-card gc-${id}`} aria-label={g.name}>
              <div className="gc-head">
                <GhostArt id={id} size={64} />
                <div>
                  <p className="eyebrow">{g.epithet}</p>
                  <h2>{g.name}</h2>
                </div>
              </div>
              <GhostDiagram id={id} />
              <dl className="gc-facts">
                <div className="wide"><dt>Hunts</dt><dd>{g.hunts}</dd></div>
                <div><dt>Corner</dt><dd>{g.corner}</dd></div>
                <div><dt>When scared</dt><dd>Wanders at random</dd></div>
                <div className="wide"><dt>Starts</dt><dd>{g.starts}</dd></div>
                <div className="wide tip"><dt>Beat him</dt><dd>{g.tip}</dd></div>
              </dl>
            </article>
          );
        })}
      </div>

      <div className="dots" aria-hidden="true">
        {GHOST_ORDER.map((id, i) => <i key={id} className={i === index ? "on" : ""} />)}
      </div>
    </div>
  );
}
