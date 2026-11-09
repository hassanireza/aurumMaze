import { useEffect, useSyncExternalStore, type JSX } from "react";
import { Backdrop } from "./components/Backdrop";
import { Navbar } from "./components/Navbar";
import { TabBar } from "./components/TabBar";
import { progressStore } from "./game/Progress";
import { WORLDS, worldOf } from "./game/worlds";
import { useRoute } from "./router";
import { HomeView } from "./views/HomeView";
import { LevelsView } from "./views/LevelsView";
import { PlayView } from "./views/PlayView";

/** Tints the whole UI (backdrop, cards, tiles) with the active world's palette. */
function applyWorld(world: number): void {
  const w = WORLDS[world] ?? WORLDS[0]!;
  const root = document.documentElement.style;
  root.setProperty("--w-top", w.wallTop);
  root.setProperty("--w-side", w.wallSide);
  root.setProperty("--w-glow", w.glow);
  root.setProperty("--w-sky-a", w.sky[0]);
  root.setProperty("--w-sky-b", w.sky[1]);
}

export function App(): JSX.Element {
  const route = useRoute();
  const progress = useSyncExternalStore(progressStore.subscribe, progressStore.getSnapshot);

  const playLevel = route.name === "play" ? Math.min(route.level, progress.unlocked) : 0;
  const world = route.name === "play" ? worldOf(playLevel) : worldOf(progress.unlocked);

  useEffect(() => {
    applyWorld(world);
  }, [world]);

  useEffect(() => {
    document.documentElement.dataset.view = route.name;
  }, [route.name]);

  const playing = route.name === "play";

  return (
    <div className="app">
      <Backdrop />
      {playing ? null : <Navbar route={route} continueLevel={progress.unlocked} />}
      <main className="main">
        {route.name === "home" ? <HomeView route={route} progress={progress} /> : null}
        {route.name === "levels" ? <LevelsView progress={progress} /> : null}
        {route.name === "play" ? <PlayView key={playLevel} level={playLevel} progress={progress} /> : null}
      </main>
      {playing ? null : <TabBar route={route} continueLevel={progress.unlocked} />}
    </div>
  );
}
