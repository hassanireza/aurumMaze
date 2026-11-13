import type { JSX, ReactNode } from "react";

interface SheetProps {
  readonly label: string;
  readonly onClose: () => void;
  readonly children: ReactNode;
}

/** Bottom sheet: the bottom third of a phone is where thumbs live. */
export function Sheet({ label, onClose, children }: SheetProps): JSX.Element {
  return (
    <div className="sheet-root" data-no-gesture>
      <button type="button" className="sheet-scrim" aria-label="Close" onClick={onClose} />
      <section className="sheet" role="dialog" aria-modal="true" aria-label={label}>
        <span className="sheet-handle" aria-hidden="true" />
        {children}
      </section>
    </div>
  );
}
