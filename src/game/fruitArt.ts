import type { FruitName } from "./types";

/** Tiny vector primitives in a 100x100 box, shared by the canvas and the React icons. */
export type FruitShape =
  | { readonly t: "c"; readonly x: number; readonly y: number; readonly r: number; readonly fill: string }
  | { readonly t: "p"; readonly d: string; readonly fill?: string; readonly stroke?: string; readonly w?: number };

const c = (x: number, y: number, r: number, fill: string): FruitShape => ({ t: "c", x, y, r, fill });
const stem = (d: string, stroke = "#7bc16a", w = 6): FruitShape => ({ t: "p", d, stroke, w });
const fillP = (d: string, fill: string): FruitShape => ({ t: "p", d, fill });

export const FRUIT_ART: Readonly<Record<FruitName, readonly FruitShape[]>> = {
  Cherries: [
    stem("M30 66 Q38 30 62 14"), stem("M68 68 Q66 34 62 14"),
    c(30, 70, 17, "#e63946"), c(68, 72, 17, "#e63946"), c(24, 64, 5, "#ff9aa2"), c(62, 66, 5, "#ff9aa2"),
    fillP("M62 14 Q78 8 86 18 Q72 22 62 14Z", "#7bc16a")
  ],
  Strawberry: [
    fillP("M50 92 C20 72 14 44 24 32 C36 22 64 22 76 32 C86 44 80 72 50 92Z", "#e63946"),
    fillP("M30 28 L50 18 L70 28 L50 36Z", "#7bc16a"),
    c(38, 48, 3, "#ffe08a"), c(58, 46, 3, "#ffe08a"), c(48, 62, 3, "#ffe08a"), c(64, 62, 3, "#ffe08a"), c(36, 66, 3, "#ffe08a")
  ],
  Peach: [
    c(40, 58, 28, "#ff9f5a"), c(62, 58, 28, "#ff8a4c"), c(50, 66, 26, "#ffa96a"),
    fillP("M50 30 Q62 10 82 16 Q70 34 50 30Z", "#7bc16a"), c(38, 52, 6, "#ffd2a8")
  ],
  Apple: [
    c(38, 58, 27, "#e63946"), c(62, 58, 27, "#e63946"), c(50, 70, 24, "#e63946"),
    stem("M50 34 Q50 20 58 10", "#8b5a2b", 6), fillP("M54 22 Q70 8 84 18 Q68 32 54 22Z", "#7bc16a"), c(34, 52, 6, "#ff9aa2")
  ],
  Grapes: [
    stem("M52 30 Q52 16 62 8", "#8b5a2b", 6),
    c(34, 42, 13, "#9b5de5"), c(58, 42, 13, "#9b5de5"), c(46, 60, 13, "#9b5de5"), c(70, 60, 13, "#9b5de5"),
    c(58, 78, 13, "#9b5de5"), c(30, 62, 4, "#c9a2ff"), c(54, 38, 4, "#c9a2ff")
  ],
  Galaxian: [
    fillP("M50 10 L62 40 L92 34 L70 56 L74 92 L50 74 L26 92 L30 56 L8 34 L38 40Z", "#ffd84a"),
    fillP("M50 30 L56 50 L50 60 L44 50Z", "#e63946"), c(50, 68, 6, "#4fc3f7")
  ],
  Bell: [
    fillP("M50 12 C28 12 24 36 24 52 C24 66 14 72 12 80 L88 80 C86 72 76 66 76 52 C76 36 72 12 50 12Z", "#ffd84a"),
    fillP("M30 32 Q34 20 46 18 Q36 26 34 46Z", "#fff1a8"), c(50, 88, 8, "#ffd84a")
  ],
  Key: [
    c(50, 26, 20, "#4fc3f7"), c(50, 26, 9, "#0a0908"),
    fillP("M44 44 H56 V92 H44Z", "#4fc3f7"), fillP("M56 70 H72 V80 H56Z", "#4fc3f7"), fillP("M56 82 H68 V92 H56Z", "#4fc3f7")
  ]
};

export function drawFruit(ctx: CanvasRenderingContext2D, name: FruitName, size: number): void {
  const k = size / 100;
  ctx.save();
  ctx.scale(k, k);
  ctx.translate(-50, -50);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const s of FRUIT_ART[name]) {
    if (s.t === "c") {
      if (s.r <= 0) continue;
      ctx.fillStyle = s.fill;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const path = new Path2D(s.d);
      if (s.fill) { ctx.fillStyle = s.fill; ctx.fill(path); }
      if (s.stroke) { ctx.strokeStyle = s.stroke; ctx.lineWidth = s.w ?? 4; ctx.stroke(path); }
    }
  }
  ctx.restore();
}
