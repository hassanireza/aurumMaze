import type { JSX } from "react";

/** Light, static atmosphere: warm vignette and a faint grid. No animation, so it costs nothing while you play. */
export function Backdrop(): JSX.Element {
  return <div className="backdrop" aria-hidden="true" />;
}
