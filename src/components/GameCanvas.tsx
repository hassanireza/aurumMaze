import { useEffect, useRef, type JSX, type MutableRefObject } from "react";
import { GameEngine, type GameEngineEvents, type GameEngineOptions } from "../game/GameEngine";
import { Renderer } from "../game/Renderer";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../game/constants";
import type { ViewMode } from "../game/types";

interface GameCanvasProps {
  readonly events: GameEngineEvents;
  readonly options: GameEngineOptions;
  readonly engineRef: MutableRefObject<GameEngine | null>;
  readonly view: ViewMode;
}

/**
 * Owns the engine, the renderer and the animation loop. The canvas is sized to
 * the largest rectangle that fits its container (keeping the board's aspect
 * ratio) and scaled by devicePixelRatio, so it stays sharp on phones.
 * The run auto-pauses whenever the page is hidden.
 */
export function GameCanvas({ events, options, engineRef, view }: GameCanvasProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const eventsRef = useRef(events);
  eventsRef.current = events;
  const viewRef = useRef(view);
  viewRef.current = view;
  const refitRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !wrap || !ctx) return;

    const engine = new GameEngine(
      {
        onHudChange: snapshot => eventsRef.current.onHudChange(snapshot),
        onLevelCleared: (level, score) => eventsRef.current.onLevelCleared(level, score),
        onGameEnd: (score, won) => eventsRef.current.onGameEnd(score, won),
        onHaptic: kind => eventsRef.current.onHaptic(kind),
        onSound: name => eventsRef.current.onSound?.(name)
      },
      options
    );
    engineRef.current = engine;
    const renderer = new Renderer(ctx, canvas);

    // The board and the status row below it form one cluster that the layout centres;
    // the board takes the biggest size that still leaves room for that status row.
    const main = wrap.closest<HTMLElement>(".play-main");
    const bottom = main?.querySelector<HTMLElement>(".play-bottom") ?? null;
    const fit = (): void => {
      const availableHeight = main ? main.clientHeight - (bottom?.offsetHeight ?? 0) : wrap.clientHeight;
      const maxWidth = wrap.parentElement ? wrap.parentElement.clientWidth : wrap.clientWidth;
      if (maxWidth <= 0 || availableHeight <= 0) return;
      const fullScale = maxWidth / CANVAS_WIDTH;
      const fitZoom = availableHeight / (CANVAS_HEIGHT * fullScale);
      let cssWidth: number;
      let cssHeight: number;
      let zoom = 1;
      if (viewRef.current === "full" || fitZoom <= 1.02) {
        // Whole board visible: the largest board that fits the box.
        cssWidth = Math.floor(Math.min(maxWidth, (availableHeight * CANVAS_WIDTH) / CANVAS_HEIGHT));
        cssHeight = Math.round((cssWidth * CANVAS_HEIGHT) / CANVAS_WIDTH);
      } else {
        // Zoomed window that follows Pac-Man. "Close" makes the board exactly as tall as the free
        // space (so the maze is bigger, never taller than the screen); "Closer" zooms further.
        zoom = Math.min(fitZoom, 1.7);
        if (viewRef.current === "closer") zoom = Math.min(zoom * 1.3, 2.2);
        cssWidth = Math.floor(maxWidth);
        cssHeight = Math.floor(Math.min(availableHeight, CANVAS_HEIGHT * fullScale * zoom));
      }
      if (cssWidth <= 0) return;
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;
      wrap.style.height = `${cssHeight}px`;
      renderer.configure(cssWidth, cssHeight, Math.min(window.devicePixelRatio || 1, 3), zoom);
    };
    refitRef.current = fit;
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(wrap);
    if (main) observer.observe(main);
    if (bottom) observer.observe(bottom);

    const onHide = (): void => {
      if (document.hidden) engine.pause();
    };
    const onBlur = (): void => engine.pause();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onBlur);
    window.addEventListener("blur", onBlur);

    let last = performance.now();
    let frame = 0;
    const loop = (now: number): void => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      engine.update(dt);
      renderer.draw(engine);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    return () => {
      refitRef.current = null;
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onBlur);
      window.removeEventListener("blur", onBlur);
      engineRef.current = null;
    };
    // The engine is created once per mount; the parent remounts this component per run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    refitRef.current?.();
  }, [view]);

  return (
    <div className="canvas-wrap" ref={wrapRef}>
      <canvas ref={canvasRef} role="img" aria-label="Aurum Maze game board" />
    </div>
  );
}
