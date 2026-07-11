import { useCallback, useRef, useState, type JSX } from "react";
import { Navbar } from "./components/Navbar";
import { Hud } from "./components/Hud";
import { Overlay } from "./components/Overlay";
import { TouchControls } from "./components/TouchControls";
import { MobileControls } from "./components/MobileControls";
import { MobileActionBar } from "./components/MobileActionBar";
import { LevelPanel } from "./components/LevelPanel";
import { GameCanvas } from "./components/GameCanvas";
import type { GameEngine } from "./game/GameEngine";
import type { DirectionName, HudSnapshot } from "./game/types";

const INITIAL_HUD: HudSnapshot = {
  score: 0,
  levelIndex: 0,
  lives: 3,
  mode: "ready",
  statusLabel: "ready",
  levelName: "First Signal",
  completedLevels: []
};

interface OverlayState {
  readonly visible: boolean;
  readonly title: string;
  readonly text: string;
  readonly actionLabel: string;
}

export function App(): JSX.Element {
  const engineRef = useRef<GameEngine | null>(null);
  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [overlay, setOverlay] = useState<OverlayState>({
    visible: true,
    title: "Enter the gold line",
    text: "A stripped back arcade chase in ten precise acts. Clear every spark, master every turn, and make the maze sing.",
    actionLabel: "Start run"
  });

  const handleHudChange = useCallback((snapshot: HudSnapshot) => {
    setHud(snapshot);
    setOverlay(prev => ({ ...prev, visible: snapshot.mode !== "playing" }));
  }, []);

  const handleOverlay = useCallback((title: string, text: string, actionLabel: string) => {
    setOverlay({ visible: true, title, text, actionLabel });
  }, []);

  const handlePrimaryAction = useCallback(() => {
    engineRef.current?.start();
  }, []);

  const handlePause = useCallback(() => {
    engineRef.current?.togglePause();
  }, []);

  const handleRestart = useCallback(() => {
    engineRef.current?.reset();
  }, []);

  const handleDirection = useCallback((direction: DirectionName) => {
    engineRef.current?.queueDirection(direction);
  }, []);

  return (
    <main className="shell">
      <section className="stage">
        <div className="topbar">
          <Navbar />
          <Hud snapshot={hud} />
        </div>

        <div className="board-wrap">
          <GameCanvas onHudChange={handleHudChange} onOverlay={handleOverlay} engineRef={engineRef} />
          <MobileControls onDirection={handleDirection} />
          <Overlay
            visible={overlay.visible}
            title={overlay.title}
            text={overlay.text}
            actionLabel={overlay.actionLabel}
            onAction={handlePrimaryAction}
          />
        </div>

        <MobileActionBar onPause={handlePause} onRestart={handleRestart} />
        <TouchControls onDirection={handleDirection} onPause={handlePause} onRestart={handleRestart} />
      </section>

      <LevelPanel snapshot={hud} />
    </main>
  );
}
