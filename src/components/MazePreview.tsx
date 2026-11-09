import { memo, type JSX } from "react";
import type { LevelDefinition } from "../game/types";

interface MazePreviewProps {
  readonly level: LevelDefinition;
}

/** A level's walls as one SVG path: cheap enough to render all 50 at once. */
export const MazePreview = memo(function MazePreview({ level }: MazePreviewProps): JSX.Element {
  let d = "";
  level.rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x += 1) {
      if (row[x] === "#") d += `M${x} ${y}h1v1h-1z`;
    }
  });
  return (
    <svg className="maze-preview" viewBox="0 0 15 15" aria-hidden="true" focusable="false">
      <path d={d} />
    </svg>
  );
});
