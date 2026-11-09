import type { JSX } from "react";

/**
 * Fixed atmospheric layer: dusk sky, a slow moon, concentric rings and
 * impossible-architecture silhouettes. Everything is tinted by the active
 * world through CSS variables, and animation is transform-only.
 */
export function Backdrop(): JSX.Element {
  return (
    <div className="backdrop" aria-hidden="true">
      <svg className="backdrop-art" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
        <g className="bd-rings" fill="none" strokeWidth="1">
          <circle cx="200" cy="250" r="90" />
          <circle cx="200" cy="250" r="140" />
          <circle cx="200" cy="250" r="200" />
          <circle cx="200" cy="250" r="270" />
        </g>
        <circle className="bd-moon" cx="200" cy="250" r="54" />
        <g className="bd-float bd-float-a">
          <path d="M60 470 l26 -16 l26 16 v56 h-52 z" className="bd-block" />
          <path d="M73 526 v-26 a13 13 0 0 1 26 0 v26 z" className="bd-door" />
        </g>
        <g className="bd-float bd-float-b">
          <path d="M290 560 h60 v14 h-48 v14 h-36 v14 h-24 v14 h-12 v-56 z" className="bd-block" />
        </g>
        <g className="bd-float bd-float-c">
          <path d="M318 330 l14 -24 l14 24 z" className="bd-shard" />
          <path d="M42 200 l10 -18 l10 18 z" className="bd-shard" />
          <circle cx="120" cy="620" r="5" className="bd-shard" />
          <circle cx="348" cy="170" r="4" className="bd-shard" />
        </g>
        <g className="bd-grid" strokeWidth="0.6">
          {Array.from({ length: 8 }, (_, i) => (
            <line key={`v${i}`} x1={50 * (i + 1)} y1="0" x2={50 * (i + 1)} y2="800" />
          ))}
          {Array.from({ length: 15 }, (_, i) => (
            <line key={`h${i}`} x1="0" y1={50 * (i + 1)} x2="400" y2={50 * (i + 1)} />
          ))}
        </g>
      </svg>
      <div className="backdrop-vignette" />
    </div>
  );
}
