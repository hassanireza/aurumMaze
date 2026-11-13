import { useEffect, useMemo, useRef, useState, type JSX } from "react";
import { FruitIcon } from "../components/FruitIcon";
import { GameCanvas } from "../components/GameCanvas";
import { GhostTray } from "../components/GhostTray";
import { Hud } from "../components/Hud";
import { Icon } from "../components/Icons";
import { Overlay } from "../components/Overlay";
import { PauseSheet } from "../components/PauseSheet";
import { PacLogo } from "../components/Brand";
import { TouchControls } from "../components/TouchControls";
import type { GameEngine, GameEngineEvents } from "../game/GameEngine";
import { InputManager } from "../game/InputManager";
import { haptic, progressStore, type ProgressData } from "../game/Progress";
import { fruitForLevel } from "../game/difficulty";
import { sfx } from "../game/Sfx";
import type { DirectionName, HudSnapshot } from "../game/types";
import { replaceHash } from "../router";

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

  sfx.enabled = progress.sound;

  const events = useMemo<GameEngineEvents>(
    () => ({
      onHudChange: setHud,
      onLevelCleared: (index, score) => progressStore.markCleared(index, score),
      onGameEnd: score => progressStore.recordScore(score),
      onHaptic: kind => haptic(kind, hapticsRef.current),
      onSound: name => sfx.play(name)
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
  const round = (hud?.levelIndex ?? level) + 1;
  const fruitRounds = [round - 3, round - 2, round - 1].filter(r => r >= 0).map(r => fruitForLevel(r).name);

  return (
    <div className="play" ref={surfaceRef}>
      {hud ? <Hud snapshot={hud} onPause={() => engine()?.pause()} onZoom={() => progressStore.setView(progress.camera === "full" ? "close" : progress.camera === "close" ? "closer" : "full")} /> : <header className="hud" />}

      <div className="play-main">
      <div className="play-board">
        <GameCanvas events={events} options={options} engineRef={engineRef} view={progress.camera} />

        {mode === "clearing" ? <div className="toast" role="status">Round {round} cleared</div> : null}

        {mode === "over" && hud ? (
          <Overlay
            eyebrow="Game over"
            title="The line went dark"
            actions={
              <>
                <button type="button" className="btn btn-primary btn-block btn-large" onClick={() => engine()?.restartLevel()} autoFocus>
                  <Icon name="restart" size={20} /> Try round {hud.levelIndex + 1} again
                </button>
                <a className="btn btn-ghost btn-block" href="#/">Home</a>
              </>
            }
          >
            <p>Score <strong>{fmt(hud.score)}</strong> · Best <strong>{fmt(hud.best)}</strong></p>
          </Overlay>
        ) : null}

        {mode === "levelclear" && hud?.levelIndex === 255 ? (
          <Overlay eyebrow="Round 256 · kill screen" title="The maze breaks" actions={
            <a className="btn btn-primary btn-block btn-large" href="#/">Return home</a>
          }>
            <p>The arcade original ends here: the board overflows into its famous corrupted screen. You reached it.</p>
          </Overlay>
        ) : null}
      </div>

      <div className="play-bottom">
        <p className={mode === "ready" ? "hint" : "hint hint-off"} aria-live="polite">
          <Icon name="swipe" size={18} />
          {progress.controls === "swipe" ? `Round ${round} · swipe anywhere to start` : `Round ${round} · press a direction to start`}
        </p>
        <div className="status-row">
          <div className="lives" role="img" aria-label={`${hud?.lives ?? 3} lives`}>
            {Array.from({ length: Math.max(0, Math.min(hud?.lives ?? 3, 5)) }, (_, i) => <PacLogo key={i} className="life" />)}
          </div>
          {hud ? <GhostTray snapshot={hud} /> : <span />}
          <div className="fruits" aria-hidden="true">
            {fruitRounds.map((name, i) => <FruitIcon key={i} name={name} size={22} />)}
            <FruitIcon name={fruitForLevel(round - 1).name} size={26} />
          </div>
        </div>
        {progress.controls === "dpad" ? <TouchControls onDirection={(d: DirectionName) => engine()?.queueDirection(d)} /> : null}
      </div>
      </div>

      {mode === "paused" ? (
        <PauseSheet
          controls={progress.controls}
          haptics={progress.haptics}
          sound={progress.sound}
          view={progress.camera}
          onView={v => progressStore.setView(v)}
          onResume={() => engine()?.resume()}
          onRestart={() => engine()?.restartLevel()}
          onControls={c => progressStore.setControls(c)}
          onHaptics={h => progressStore.setHaptics(h)}
          onSound={s => progressStore.setSound(s)}
        />
      ) : null}

      <p className="sr-only" aria-live="polite">{mode === "playing" ? "" : `Game ${mode}`}</p>
    </div>
  );
}
