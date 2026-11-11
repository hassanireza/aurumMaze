import { useEffect, useMemo, useRef, useState, type JSX } from "react";
import { GameCanvas } from "../components/GameCanvas";
import { GhostTray } from "../components/GhostTray";
import { Hud } from "../components/Hud";
import { Icon } from "../components/Icons";
import { Overlay } from "../components/Overlay";
import { PauseSheet } from "../components/PauseSheet";
import { TouchControls } from "../components/TouchControls";
import type { GameEngine, GameEngineEvents } from "../game/GameEngine";
import { InputManager } from "../game/InputManager";
import { haptic, progressStore, type ProgressData } from "../game/Progress";
import { TOTAL_LEVELS } from "../game/levels";
import type { DirectionName, HudSnapshot } from "../game/types";
import { playHref, replaceHash } from "../router";

interface PlayViewProps {
  readonly level: number;
  readonly progress: ProgressData;
}

const fmt = (n: number): string => n.toLocaleString("en-US");

export function PlayView({ level, progress }: PlayViewProps): JSX.Element {
  const engineRef = useRef<GameEngine | null>(null);
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const hapticsRef = useRef(progress.haptics);
  hapticsRef.current = progress.haptics;
  const [hud, setHud] = useState<HudSnapshot | null>(null);

  const events = useMemo<GameEngineEvents>(
    () => ({
      onHudChange: setHud,
      onLevelCleared: (index, score) => progressStore.markCleared(index, score),
      onGameEnd: score => progressStore.recordScore(score),
      onHaptic: kind => haptic(kind, hapticsRef.current)
    }),
    []
  );
  const options = useMemo(
    () => ({ startLevel: level, best: progress.best, completed: progress.completed }),
    // Only the starting values matter; the engine owns state after mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [level]
  );

  useEffect(() => {
    const input = new InputManager(
      (direction: DirectionName) => engineRef.current?.queueDirection(direction),
      () => engineRef.current?.togglePause(),
      () => {
        if (engineRef.current?.getMode() === "ready") engineRef.current.begin();
      }
    );
    const detachKeys = input.attachKeyboard();
    const surface = surfaceRef.current;
    const detachGestures = surface ? input.attachGestures(surface) : () => undefined;
    return () => {
      detachKeys();
      detachGestures();
    };
  }, []);

  useEffect(() => {
    if (hud) replaceHash(`play/${hud.levelIndex + 1}`);
  }, [hud?.levelIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const mode = hud?.mode ?? "ready";
  const engine = (): GameEngine | null => engineRef.current;

  return (
    <div className="play" ref={surfaceRef}>
      {hud ? <Hud snapshot={hud} onPause={() => engine()?.pause()} /> : <header className="hud" />}

      <div className="play-board">
        <GameCanvas events={events} options={options} engineRef={engineRef} />

        {mode === "ready" ? (
          <div className="ready" aria-live="polite">
            <span className="ready-pill">
              <Icon name="swipe" size={18} />
              {progress.controls === "swipe" ? "Swipe anywhere to begin" : "Press a direction to begin"}
            </span>
          </div>
        ) : null}

        {mode === "levelclear" && hud && hud.levelIndex < 255 ? (
          <Overlay
            eyebrow={`Level ${hud.levelIndex + 1} cleared`}
            title={hud.levelName}
            actions={
              <>
                <button type="button" className="btn btn-primary btn-block" onClick={() => engine()?.nextLevel()} autoFocus>
                  Next level <Icon name="arrow-right" size={18} />
                </button>
                <a className="btn btn-ghost btn-block" href="#/levels">Levels</a>
              </>
            }
          >
            <p>Score <strong>{fmt(hud.score)}</strong></p>
          </Overlay>
        ) : null}

        {mode === "over" && hud ? (
          <Overlay
            eyebrow="The line went dark"
            title="Run it back"
            actions={
              <>
                <button type="button" className="btn btn-primary btn-block" onClick={() => engine()?.restartLevel()} autoFocus>
                  <Icon name="restart" size={18} /> Try level {hud.levelIndex + 1} again
                </button>
                <a className="btn btn-ghost btn-block" href="#/levels">Levels</a>
              </>
            }
          >
            <p>Score <strong>{fmt(hud.score)}</strong> · Best <strong>{fmt(hud.best)}</strong></p>
          </Overlay>
        ) : null}

        {mode === "won" && hud ? (
          <Overlay
            eyebrow="Aurum Crown"
            title={`${TOTAL_LEVELS} lines cleared`}
            actions={
              <>
                <a className="btn btn-primary btn-block" href={playHref(0)}>
                  Play again from level 1
                </a>
                <a className="btn btn-ghost btn-block" href="#/">Home</a>
              </>
            }
          >
            <p>Final score <strong>{fmt(hud.score)}</strong></p>
          </Overlay>
        ) : null}

        {mode === "levelclear" && hud?.levelIndex === 255 ? (
          <Overlay eyebrow="Round 256 · kill screen" title="The maze breaks" actions={
            <a className="btn btn-primary btn-block" href="#/">Return home</a>
          }>
            <p>The original arcade game has no normal ending here. The board has overflowed into its corrupted final screen.</p>
          </Overlay>
        ) : null}
      </div>

      <div className="play-lower">
        {hud ? <GhostTray snapshot={hud} /> : null}
        {progress.controls === "dpad" ? (
          <TouchControls onDirection={(d: DirectionName) => engine()?.queueDirection(d)} />
        ) : (
          <p className="swipe-hint" aria-hidden="true"><Icon name="swipe" size={16} /> Swipe anywhere · arrows or WASD on keyboard</p>
        )}
      </div>

      {mode === "paused" ? (
        <PauseSheet
          controls={progress.controls}
          haptics={progress.haptics}
          onResume={() => engine()?.resume()}
          onRestart={() => engine()?.restartLevel()}
          onControls={c => progressStore.setControls(c)}
          onHaptics={h => progressStore.setHaptics(h)}
        />
      ) : null}

      <p className="sr-only" aria-live="polite">{mode === "playing" ? "" : `Game ${mode}`}</p>
    </div>
  );
}
