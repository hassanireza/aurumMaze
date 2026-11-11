import { useEffect, useRef, type JSX, type MutableRefObject } from "react";
import { GameEngine, type GameEngineEvents, type GameEngineOptions } from "../game/GameEngine";
import { Renderer } from "../game/Renderer";

interface GameCanvasProps {
  readonly events: GameEngineEvents;
  readonly options: GameEngineOptions;
  readonly engineRef: MutableRefObject<GameEngine | null>;
}

/**
 * Owns the engine, the renderer and the animation loop. The canvas is sized to
 * its container and scaled by devicePixelRatio, so it stays sharp on phones.
 * The run auto-pauses whenever the page is hidden.
 */
export function GameCanvas({ events, options, engineRef }: GameCanvasProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const eventsRef = useRef(events);
  eventsRef.current = events;

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
        onHaptic: kind => eventsRef.current.onHaptic(kind)
      },
      options
    );
    engineRef.current = engine;
    const renderer = new Renderer(ctx, canvas);

    const fit = (): void => {
      const width = Math.min(wrap.clientWidth, wrap.clientHeight * 28 / 36);
      if (width > 0) renderer.resize(width, Math.min(window.devicePixelRatio || 1, 3));
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(wrap);

    const onVisibility = (): void => {
      if (document.hidden) engine.pause();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onVisibility);

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
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onVisibility);
      engineRef.current = null;
    };
    // The engine is created once per mount; the parent remounts this component per run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="canvas-wrap" ref={wrapRef}>
      <canvas ref={canvasRef} role="img" aria-label="Aurum Maze game board" />
    </div>
  );
}
