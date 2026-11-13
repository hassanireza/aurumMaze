import type { JSX } from "react";
import { FRUIT_ART } from "../game/fruitArt";
import type { FruitName } from "../game/types";

/** Same vector art the canvas draws in the maze. */
export function FruitIcon({ name, size = 28 }: { readonly name: FruitName; readonly size?: number }): JSX.Element {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" focusable="false" strokeLinecap="round" strokeLinejoin="round">
      {FRUIT_ART[name].map((s, i) =>
        s.t === "c" ? (
          s.r > 0 ? <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={s.fill} /> : null
        ) : (
          <path key={i} d={s.d} fill={s.fill ?? "none"} stroke={s.stroke ?? "none"} strokeWidth={s.w ?? 0} />
        )
      )}
    </svg>
  );
}
