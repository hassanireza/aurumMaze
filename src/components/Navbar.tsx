import type { JSX } from "react";

/**
 * The original logo drew a full closed circle outline and then two separate
 * mouth lines on top, so the "bite" poked out past the ring instead of being
 * cut into it. This version is a single continuous outline path: it arcs the
 * long way around the circle and only closes through the center, so the
 * mouth is an actual gap in the ring, facing left like the in-game sprite.
 */
function PacLogo(): JSX.Element {
  return (
    <svg viewBox="0 0 64 64" className="brand-mark" aria-hidden="true">
      <path d="M 11.52 46.34 A 25 25 0 1 1 11.52 17.66 L 32 32 Z" />
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
