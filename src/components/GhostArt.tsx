import { useId, type JSX } from "react";
import { EYE_INK, EYE_WHITE, FRIGHT_MOUTH, GHOST_ART } from "../game/ghostArt";
import type { GhostId } from "../game/types";

interface GhostArtProps {
  readonly id: GhostId;
  readonly size?: number;
  /** Pupil direction, -1..1 on each axis. */
  readonly look?: readonly [number, number];
  readonly afraid?: boolean;
  readonly className?: string;
}

/** Renders the exact same artwork the canvas draws (see game/ghostArt.ts). */
export function GhostArt({ id, size = 64, look = [1, 0], afraid = false, className = "" }: GhostArtProps): JSX.Element {
  const art = GHOST_ART[id];
  const uid = useId().replace(/:/g, "");
  const gradient = `gh-${id}-${uid}`;
  const clip = `gc-${id}-${uid}`;
  const body = afraid ? "#6c7ca3" : art.color;
  const light = afraid ? "#97a6cc" : art.light;
  const shade = afraid ? "#3e4a6e" : art.shade;

  return (
    <svg
      className={`ghost-art ${className}`.trim()}
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label={afraid ? `${id} frightened` : id}
    >
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={light} />
          <stop offset="0.5" stopColor={body} />
          <stop offset="1" stopColor={body} stopOpacity="0.82" />
        </linearGradient>
        <clipPath id={clip}>
          <path d={art.body} />
        </clipPath>
      </defs>
      <path d={art.body} fill={`url(#${gradient})`} stroke={shade} strokeWidth="2.6" strokeLinejoin="round" />
      {art.split && !afraid ? (
        <rect x="50" y="0" width="50" height="100" fill="#fff" opacity="0.22" clipPath={`url(#${clip})`} />
      ) : null}
      {afraid ? (
        <>
          <circle cx="38" cy="54" r="3.6" fill={EYE_WHITE} />
          <circle cx="62" cy="54" r="3.6" fill={EYE_WHITE} />
          <path d={FRIGHT_MOUTH} fill="none" stroke={EYE_WHITE} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : (
        <>
          <path d={art.detail} fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="2" strokeLinecap="round" />
          {art.accessory ? <path d={art.accessory} fill={shade} /> : null}
          {art.eyes.map((eye, i) => {
            const pr = Math.min(eye.rx, eye.ry) * 0.62;
            return (
              <g key={i}>
                <ellipse cx={eye.x} cy={eye.y} rx={eye.rx} ry={eye.ry} fill={EYE_WHITE} />
                <circle
                  cx={eye.x + look[0] * (eye.rx - pr) * 0.9}
                  cy={eye.y + look[1] * (eye.ry - pr) * 0.9}
                  r={pr}
                  fill={EYE_INK}
                />
              </g>
            );
          })}
          {art.lids ? <path d={art.lids} fill="none" stroke={EYE_INK} strokeWidth="4" strokeLinecap="round" /> : null}
          {art.blush ? (
            <>
              <ellipse cx="24" cy="70" rx="6" ry="3.6" fill="rgba(231,120,120,.45)" />
              <ellipse cx="76" cy="70" rx="6" ry="3.6" fill="rgba(231,120,120,.45)" />
            </>
          ) : null}
        </>
      )}
    </svg>
  );
}
