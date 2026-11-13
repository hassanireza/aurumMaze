import type { JSX, ReactNode } from "react";

interface OverlayProps {
  readonly eyebrow: string;
  readonly title: string;
  readonly children?: ReactNode;
  readonly actions: ReactNode;
}

/** Centered card shown on top of the board for game-over and the kill screen. */
export function Overlay({ eyebrow, title, children, actions }: OverlayProps): JSX.Element {
  return (
    <div className="overlay" role="dialog" aria-modal="false" aria-label={title} data-no-gesture>
      <div className="overlay-card">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        {children ? <div className="overlay-body">{children}</div> : null}
        <div className="overlay-actions">{actions}</div>
      </div>
    </div>
  );
}
