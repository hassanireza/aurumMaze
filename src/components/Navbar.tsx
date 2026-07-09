import type { JSX } from "react";

/**
 * Solid disc with a wedge cut out of the right side, matching the
 * favicon. Filled (not stroked), so the "L 32 32 Z" segment is what
 * correctly closes the mouth wedge rather than showing as a stray line.
 */
function PacLogo(): JSX.Element {
  return (
    <svg viewBox="0 0 64 64" className="brand-mark" aria-hidden="true">
      <path d="M 52.48 46.34 A 25 25 0 1 1 52.48 17.66 L 32 32 Z" />
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
