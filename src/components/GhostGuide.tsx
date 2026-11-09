import { useCallback, useEffect, useRef, useState, type JSX } from "react";
import { GHOST_ART, GHOST_ORDER } from "../game/ghostArt";
import { levelConfig } from "../game/difficulty";
import type { GhostId } from "../game/types";
import { GhostArt } from "./GhostArt";

interface GuideEntry {
  readonly name: string;
  readonly epithet: string;
  readonly start: string;
  readonly targets: string;
  readonly corner: string;
  readonly panic: string;
  readonly quirk: string;
  readonly beat: string;
}

const GUIDE: Readonly<Record<GhostId, GuideEntry>> = {
  blinky: {
    name: "Blinky",
    epithet: "The Chaser",
    start: "Already outside the house.",
    targets: "The exact tile you stand on. Nothing clever, which is why he never lets go.",
    corner: "Top right",
    panic: "Runs at random.",
    quirk: "Rage: when only a few sparks remain he speeds up and stops retreating to his corner.",
    beat: "He follows your trail, so loop a block and drag him into a gold orb."
  },
  pinky: {
    name: "Pinky",
    epithet: "The Ambusher",
    start: "Leaves the house straight away.",
    targets: "Four tiles ahead of the way you face, waiting where you are going rather than where you are.",
    corner: "Top left",
    panic: "Flees to the corner farthest from you.",
    quirk: "Arcade quirk kept: facing up makes her aim four tiles up and four left.",
    beat: "Turn toward her. A head-on approach sends her aim past you, and a sudden reverse makes her miss."
  },
  inky: {
    name: "Inky",
    epithet: "The Flanker",
    start: "Leaves after about ten sparks on level 1, sooner later on.",
    targets: "Two tiles ahead of you becomes a pivot; a line from Blinky through it is doubled. Two ghosts, one pincer.",
    corner: "Bottom right",
    panic: "Wanders at random.",
    quirk: "Harmless beside Blinky, dangerous when the pair are far apart.",
    beat: "Keep track of Blinky. When Inky is about to swing wide, he arrives from the side you are not watching."
  },
  clyde: {
    name: "Clyde",
    epithet: "The Shy One",
    start: "Leaves last, after about twenty-two sparks on level 1.",
    targets: "You, from afar. Inside five tiles he loses his nerve and bolts for his corner.",
    corner: "Bottom left",
    panic: "Hides in his corner.",
    quirk: "His retreat makes him the easiest to slip past, and the hardest to predict.",
    beat: "Bait him close and he leaves. Use the lane he abandons."
  }
};

const CELL = 20;
const mid = (n: number): number => n * CELL + CELL / 2;

function Pac({ x, y }: { readonly x: number; readonly y: number }): JSX.Element {
  return (
    <g>
      <circle cx={mid(x)} cy={mid(y)} r="8" fill="#d4af37" />
      <path d={`M${mid(x)} ${mid(y)} L${mid(x) + 10} ${mid(y) - 5.5} L${mid(x) + 10} ${mid(y) + 5.5} Z`} className="gd-bg" />
    </g>
  );
}

function Mini({ id, x, y, faded = false }: { readonly id: GhostId; readonly x: number; readonly y: number; readonly faded?: boolean }): JSX.Element {
  const art = GHOST_ART[id];
  return (
    <g transform={`translate(${mid(x)} ${mid(y)})`} opacity={faded ? 0.4 : 1}>
      <path d="M-8 8 V-1 a8 8 0 0 1 16 0 V8 l-3 -2.2 l-2.5 2.2 l-2.5 -2.2 l-2.5 2.2 l-3 -2.2 Z" fill={art.color} stroke={art.shade} strokeWidth="1" />
      <circle cx="-3" cy="-1.5" r="1.8" fill="#f7f3e8" />
      <circle cx="3" cy="-1.5" r="1.8" fill="#f7f3e8" />
    </g>
  );
}

function Target({ x, y, color }: { readonly x: number; readonly y: number; readonly color: string }): JSX.Element {
  return (
    <g stroke={color} fill="none" strokeWidth="1.6" strokeLinecap="round">
      <circle cx={mid(x)} cy={mid(y)} r="9" />
      <path d={`M${mid(x) - 14} ${mid(y)} h6 M${mid(x) + 8} ${mid(y)} h6 M${mid(x)} ${mid(y) - 14} v6 M${mid(x)} ${mid(y) + 8} v6`} />
    </g>
  );
}

function Diagram({ id }: { readonly id: GhostId }): JSX.Element {
  const color = GHOST_ART[id].color;
  const dash = { stroke: color, strokeWidth: 1.6, strokeDasharray: "4 4", fill: "none", opacity: 0.85 } as const;
  return (
    <svg className="guide-diagram" viewBox="0 0 180 180" role="img" aria-label={`How ${GUIDE[id].name} picks a target`}>
      <g className="gd-grid">
        {Array.from({ length: 10 }, (_, i) => (
          <g key={i}>
            <line x1={i * CELL} y1="0" x2={i * CELL} y2="180" />
            <line x1="0" y1={i * CELL} x2="180" y2={i * CELL} />
          </g>
        ))}
      </g>
      {id === "blinky" && (
        <>
          <line x1={mid(7)} y1={mid(2)} x2={mid(3)} y2={mid(6)} {...dash} />
          <Target x={3} y={6} color={color} />
          <Pac x={3} y={6} />
          <Mini id="blinky" x={7} y={2} />
        </>
      )}
      {id === "pinky" && (
        <>
          <line x1={mid(7)} y1={mid(1)} x2={mid(6)} y2={mid(5)} {...dash} />
          <path d={`M${mid(2) + 12} ${mid(5)} H${mid(6) - 12}`} stroke={color} strokeWidth="2" markerEnd="none" />
          {[3, 4, 5].map(t => (
            <line key={t} x1={mid(t)} y1={mid(5) - 4} x2={mid(t)} y2={mid(5) + 4} stroke={color} strokeWidth="1.4" />
          ))}
          <text x={mid(4)} y={mid(5) - 10} className="gd-label" textAnchor="middle">4 tiles</text>
          <Target x={6} y={5} color={color} />
          <Pac x={2} y={5} />
          <Mini id="pinky" x={7} y={1} />
        </>
      )}
      {id === "inky" && (
        <>
          <line x1={mid(7)} y1={mid(7)} x2={mid(3)} y2={mid(3)} {...dash} />
          <circle cx={mid(5)} cy={mid(5)} r="4" fill="none" stroke={color} strokeWidth="1.6" />
          <text x={mid(5) + 8} y={mid(5) + 14} className="gd-label">pivot</text>
          <text x={mid(4) - 18} y={mid(3) - 12} className="gd-label">x2</text>
          <Target x={3} y={3} color={color} />
          <line x1={mid(8)} y1={mid(2)} x2={mid(3) + 8} y2={mid(3) - 4} stroke={color} strokeWidth="1" strokeDasharray="2 4" opacity="0.5" />
          <Pac x={3} y={5} />
          <Mini id="blinky" x={7} y={7} />
          <Mini id="inky" x={8} y={2} />
        </>
      )}
      {id === "clyde" && (
        <>
          <circle cx={mid(4)} cy={mid(4)} r={CELL * 3} fill={color} fillOpacity="0.08" stroke={color} strokeWidth="1.4" strokeDasharray="5 4" />
          <text x={mid(4)} y={mid(4) - 36} className="gd-label" textAnchor="middle">5 tiles</text>
          <line x1={mid(8)} y1={mid(7)} x2={mid(4) + 8} y2={mid(4) + 8} {...dash} />
          <path d={`M${mid(5)} ${mid(5)} L${mid(1)} ${mid(8)}`} stroke={color} strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <Target x={0} y={8} color={color} />
          <Pac x={4} y={4} />
          <Mini id="clyde" x={8} y={7} />
          <Mini id="clyde" x={5} y={5} faded />
        </>
      )}
    </svg>
  );
}

export function GhostGuide(): JSX.Element {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);

  const scrollTo = useCallback((index: number): void => {
    const card = trackRef.current?.children[index] as HTMLElement | undefined;
    card?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", inline: "center", block: "nearest" });
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let frame = 0;
    const onScroll = (): void => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const center = track.scrollLeft + track.clientWidth / 2;
        let best = 0;
        let bestDistance = Infinity;
        Array.from(track.children).forEach((child, i) => {
          const el = child as HTMLElement;
          const d = Math.abs(el.offsetLeft + el.offsetWidth / 2 - center);
          if (d < bestDistance) {
            bestDistance = d;
            best = i;
          }
        });
        setActive(best);
      });
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      track.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="guide">
      <div className="guide-chips" role="tablist" aria-label="Choose a ghost">
        {GHOST_ORDER.map((id, i) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active === i}
            className={active === i ? "chip chip-active" : "chip"}
            style={{ "--chip": GHOST_ART[id].color } as React.CSSProperties}
            onClick={() => scrollTo(i)}
          >
            <GhostArt id={id} size={22} />
            <span>{GUIDE[id].name}</span>
          </button>
        ))}
      </div>

      <div className="guide-track" ref={trackRef} role="list">
        {GHOST_ORDER.map(id => {
          const g = GUIDE[id];
          return (
            <article key={id} className="guide-card" role="listitem" style={{ "--ghost": GHOST_ART[id].color } as React.CSSProperties}>
              <header className="guide-head">
                <GhostArt id={id} size={84} className="guide-portrait" />
                <div>
                  <p className="eyebrow">{g.epithet}</p>
                  <h3>{g.name}</h3>
                  <p className="guide-start">{g.start}</p>
                </div>
              </header>
              <Diagram id={id} />
              <dl className="guide-facts">
                <div><dt>Targets</dt><dd>{g.targets}</dd></div>
                <div><dt>Scatter corner</dt><dd>{g.corner}</dd></div>
                <div><dt>When frightened</dt><dd>{g.panic}</dd></div>
                <div><dt>Signature</dt><dd>{g.quirk}</dd></div>
                <div className="guide-beat"><dt>How to beat him</dt><dd>{g.beat}</dd></div>
              </dl>
            </article>
          );
        })}
      </div>
    </div>
  );
}

const CYCLE = [
  { key: "scatter", title: "Scatter", text: "Every ghost retreats to its own corner and circles it. Breathing room." },
  { key: "chase", title: "Chase", text: "Each ghost hunts by its own rule. The game alternates scatter and chase on a timer." },
  { key: "frightened", title: "Frightened", text: "A gold orb turns them blue and slow for a few seconds. Eat them for 200, 400, 800, then 1600." },
  { key: "eaten", title: "Eaten", text: "An eaten ghost becomes a pair of eyes, races back to the house and returns to the hunt." }
] as const;

export function ModeCycle(): JSX.Element {
  const schedule = levelConfig(0).schedule.map(s => ({ phase: s.phase, seconds: Number.isFinite(s.seconds) ? s.seconds : 24 }));
  const total = schedule.reduce((sum, s) => sum + s.seconds, 0);
  return (
    <div className="cycle">
      <ol className="cycle-steps">
        {CYCLE.map((step, i) => (
          <li key={step.key} className={`cycle-step cycle-${step.key}`}>
            <span className="cycle-index">{i + 1}</span>
            <h4>{step.title}</h4>
            <p>{step.text}</p>
          </li>
        ))}
      </ol>
      <figure className="timeline">
        <figcaption>
          <span className="eyebrow">Level 1 rhythm</span>
          <span>Every flip makes the ghosts U-turn. That is your cue.</span>
        </figcaption>
        <div className="timeline-bar" role="img" aria-label="Scatter and chase timeline">
          {schedule.map((s, i) => (
            <span
              key={i}
              className={s.phase === "scatter" ? "seg seg-scatter" : "seg seg-chase"}
              style={{ flexGrow: s.seconds / total }}
              title={`${s.phase} ${Number.isFinite(s.seconds) ? s.seconds : ""}s`}
            />
          ))}
        </div>
        <div className="timeline-key">
          <span><i className="seg-scatter" /> Scatter</span>
          <span><i className="seg-chase" /> Chase</span>
        </div>
      </figure>
    </div>
  );
}
