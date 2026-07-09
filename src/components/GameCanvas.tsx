import { useEffect, useRef, type JSX, type MutableRefObject } from "react";
import { GameEngine } from "../game/GameEngine";
import { Renderer } from "../game/Renderer";
import { InputManager } from "../game/InputManager";
import { CANVAS_SIZE } from "../game/constants";
import type { DirectionName, HudSnapshot } from "../game/types";

interface GameCanvasProps {
  readonly onHudChange: (snapshot: HudSnapshot) => void;
  readonly onOverlay: (title: string, message: string, actionLabel: string) => void;
  readonly engineRef: MutableRefObject<GameEngine | null>;
}

export function GameCanvas({ onHudChange, onOverlay, engineRef }: GameCanvasProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const inputRef = useRef<InputManager | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const engine = new GameEngine({ onHudChange, onOverlay });
    engineRef.current = engine;
    const renderer = new Renderer(ctx);

    const input = new InputManager(
      (direction: DirectionName) => engine.queueDirection(direction),
      () => engine.togglePause()
    );
    inputRef.current = input;

    const detachKeyboard = input.attachKeyboard();

    const handlePointerDown = (event: PointerEvent): void => {
      input.handlePointerDown(event.clientX, event.clientY);
    };
    const handlePointerUp = (event: PointerEvent): void => {
      input.handlePointerUp(event.clientX, event.clientY, () => engine.start());
    };
    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointerup", handlePointerUp);

    let lastTime = 0;
    let frameId = 0;
    const loop = (time: number): void => {
      const dt = Math.min(0.04, (time - lastTime) / 1000 || 0);
      lastTime = time;
      engine.update(dt);
      renderer.draw(engine);
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frameId);
      detachKeyboard();
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointerup", handlePointerUp);
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="canvas-wrap">
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        aria-label="Aurum Maze game board"
      />
      <div className="scanline" />
    </div>
  );
}
