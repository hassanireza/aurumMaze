import type { JSX } from "react";

/**
 * Ring with a bite taken out on the left, drawn as a single open arc.
 * There is no line back to the center, so the mouth is a clean gap
 * instead of a pair of spokes crossing the middle of the ring.
 */
function PacLogo(): JSX.Element {
  return (
    <svg viewBox="0 0 64 64" className="brand-mark" aria-hidden="true">
      <path d="M 11.52 46.34 A 25 25 0 1 1 11.52 17.66" />
    </svg>
  );
}

export function Navbar(): JSX.Element {
  return (
    <div className="topbar">
      <div className="brand">
        <PacLogo />
        <div>
          <p>Aurum Maze</p>
          <span>Ten luminous rounds</span>
        </div>
      </div>
    </div>
  );
}
