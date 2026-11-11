import { memo, type JSX } from "react";
import type { LevelDefinition } from "../game/types";

interface MazePreviewProps {
  readonly level: LevelDefinition;
}

/** The shared original board is previewed for each round. */
export const MazePreview = memo(function MazePreview({ level }: MazePreviewProps): JSX.Element {
  let d = "";
  level.rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x += 1) {
      if (row[x] === "#") d += `M${x} ${y}h1v1h-1z`;
    }
  });
  return (
    <span className="maze-preview" aria-hidden="true">
      <svg viewBox="0 0 28 36" focusable="false"><path d={d} /></svg>
    </span>
  );
});
