import type { JSX } from "react";

interface OverlayProps {
  readonly visible: boolean;
  readonly title: string;
  readonly text: string;
  readonly actionLabel: string;
  readonly onAction: () => void;
}

export function Overlay({ visible, title, text, actionLabel, onAction }: OverlayProps): JSX.Element | null {
  if (!visible) return null;
  return (
    <div className="overlay">
      <div className="monogram">AM</div>
      <h1>{title}</h1>
      <p>{text}</p>
      <button type="button" onClick={onAction}>
        {actionLabel}
      </button>
    </div>
  );
}
