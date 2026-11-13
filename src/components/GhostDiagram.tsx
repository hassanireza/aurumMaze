import type { JSX } from "react";
import { GHOST_ART } from "../game/ghostArt";
import type { GhostId } from "../game/types";

const C = 16;
const at = (cell: number): number => cell * C + C / 2;

function Pac({ x, y, facing = "right" }: { readonly x: number; readonly y: number; readonly facing?: "right" | "left" | "up" }): JSX.Element {
  const rot = facing === "right" ? 0 : facing === "left" ? 180 : -90;
  return (
    <g transform={`translate(${at(x)} ${at(y)}) rotate(${rot})`}>
      <path d="M0 0 L6.3 -3.2 A7 7 0 1 0 6.3 3.2 Z" fill="#ffd84a" />
    </g>
  );
}

function Mini({ id, x, y, faded = false }: { readonly id: GhostId; readonly x: number; readonly y: number; readonly faded?: boolean }): JSX.Element {
  const art = GHOST_ART[id];
  return (
    <g transform={`translate(${at(x) - 9} ${at(y) - 9.5}) scale(.19)`} opacity={faded ? 0.38 : 1}>
      <path d={art.body} fill={art.color} stroke={art.shade} strokeWidth="7" strokeLinejoin="round" />
      <circle cx="36" cy="56" r="9" fill="#f7f3e8" />
      <circle cx="64" cy="56" r="9" fill="#f7f3e8" />
      <circle cx="39" cy="57" r="5" fill="#1b2a8c" />
      <circle cx="67" cy="57" r="5" fill="#1b2a8c" />
    </g>
  );
}

function Target({ x, y, color }: { readonly x: number; readonly y: number; readonly color: string }): JSX.Element {
  const cx = at(x);
  const cy = at(y);
  return (
    <g stroke={color} strokeWidth="1.6" fill="none" strokeLinecap="round">
      <circle cx={cx} cy={cy} r="5.5" />
      <path d={`M${cx - 9} ${cy}h4M${cx + 5} ${cy}h4M${cx} ${cy - 9}v4M${cx} ${cy + 5}v4`} />
    </g>
  );
}

function Line({ x1, y1, x2, y2, color }: { readonly x1: number; readonly y1: number; readonly x2: number; readonly y2: number; readonly color: string }): JSX.Element {
  return <line x1={at(x1)} y1={at(y1)} x2={at(x2)} y2={at(y2)} stroke={color} strokeWidth="1.6" strokeDasharray="3 3.5" strokeLinecap="round" />;
}

function Label({ x, y, children }: { readonly x: number; readonly y: number; readonly children: string }): JSX.Element {
  return <text x={x} y={y} className="gd-label" textAnchor="middle">{children}</text>;
}

/** One tiny, honest picture per ghost of how its target tile is chosen. */
export function GhostDiagram({ id }: { readonly id: GhostId }): JSX.Element {
  const color = GHOST_ART[id].color;
  const dots: JSX.Element[] = [];
  for (let x = 0; x < 11; x += 1) for (let y = 0; y < 7; y += 1) dots.push(<circle key={`${x}-${y}`} cx={at(x)} cy={at(y)} r="1" className="gd-dot" />);

  return (
    <svg className="ghost-diagram" viewBox="0 0 176 112" role="img" aria-label={`How ${id} picks a target`}>
      <rect x="0.5" y="0.5" width="175" height="111" rx="12" className="gd-frame" />
      {dots}
      {id === "blinky" ? (
        <>
          <Line x1={2} y1={1} x2={7} y2={4} color={color} />
          <Target x={7} y={4} color={color} />
          <Pac x={7} y={4} />
          <Mini id="blinky" x={2} y={1} />
          <Label x={96} y={20}>straight at you</Label>
        </>
      ) : null}
      {id === "pinky" ? (
        <>
          <Line x1={8} y1={1} x2={7} y2={4} color={color} />
          <path d={`M${at(3) + 9} ${at(4)}H${at(7) - 8}`} stroke="#f7f3e8" strokeOpacity=".5" strokeWidth="1.6" strokeLinecap="round" />
          <Target x={7} y={4} color={color} />
          <Pac x={3} y={4} />
          <Mini id="pinky" x={8} y={1} />
          <Label x={at(5)} y={at(4) + 22}>4 tiles ahead</Label>
        </>
      ) : null}
      {id === "inky" ? (
        <>
          <Line x1={1} y1={5} x2={9} y2={1} color="#f7f3e8" />
          <path d={`M${at(5) - 3} ${at(3)}l3 -3l3 3l-3 3z`} fill="none" stroke="#f7f3e8" strokeWidth="1.5" />
          <Target x={9} y={1} color={color} />
          <Line x1={8} y1={5} x2={9} y2={1} color={color} />
          <Pac x={3} y={3} />
          <Mini id="blinky" x={1} y={5} />
          <Mini id="inky" x={8} y={5} />
          <Label x={at(5)} y={at(5) + 18}>line through pivot, doubled</Label>
        </>
      ) : null}
      {id === "clyde" ? (
        <>
          <circle cx={at(5)} cy={at(3)} r={C * 3.2} fill="none" stroke={color} strokeWidth="1.4" strokeDasharray="3 4" />
          <Line x1={10} y1={1} x2={5} y2={3} color={color} />
          <Pac x={5} y={3} />
          <Mini id="clyde" x={10} y={1} />
          <Mini id="clyde" x={6} y={4} faded />
          <path d={`M${at(6) - 8} ${at(4) + 5}L${at(1)} ${at(6) - 2}`} stroke={color} strokeWidth="1.6" strokeLinecap="round" fill="none" strokeDasharray="3 3.5" />
          <Label x={at(2)} y={at(1) + 2}>8 tiles</Label>
        </>
      ) : null}
    </svg>
  );
}
