import type { JSX, ReactNode } from "react";

interface OverlayProps {
  readonly eyebrow: string;
  readonly title: string;
  readonly children?: ReactNode;
  readonly actions: ReactNode;
}

/** Centered card shown on top of the board for level-clear, game-over and victory. */
export function Overlay({ eyebrow, title, children, actions }: OverlayProps): JSX.Element {
  return (
    <div className="overlay" role="dialog" aria-modal="false" aria-label={title}>
      <div className="overlay-card">
        <div className="monogram" aria-hidden="true">AM</div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        {children ? <div className="overlay-body">{children}</div> : null}
        <div className="overlay-actions">{actions}</div>
      </div>
    </div>
  );
}
