import type { JSX } from "react";

/** Solid disc with a wedge cut out of the right side, matching the favicon. */
export function PacLogo({ className = "brand-mark" }: { readonly className?: string }): JSX.Element {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path d="M 52.48 46.34 A 25 25 0 1 1 52.48 17.66 L 32 32 Z" />
    </svg>
  );
}
