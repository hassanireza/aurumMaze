import { type JSX, useSyncExternalStore } from "react";
import { Backdrop } from "./components/Backdrop";
import { TabBar } from "./components/TabBar";
import { progressStore } from "./game/Progress";
import { useRoute } from "./router";
import { GhostsView } from "./views/GhostsView";
import { HomeView } from "./views/HomeView";
import { LevelsView } from "./views/LevelsView";
import { PlayView } from "./views/PlayView";

export function App(): JSX.Element {
  const route = useRoute();
  const progress = useSyncExternalStore(progressStore.subscribe, progressStore.getSnapshot);
  const playing = route.name === "play";
  const playLevel = route.name === "play" ? (route.level === 255 ? 255 : Math.min(route.level, progress.unlocked)) : 0;

  return (
    <div className="app" data-view={route.name}>
      <Backdrop />
      <main className="main">
        {route.name === "home" ? <HomeView progress={progress} /> : null}
        {route.name === "ghosts" ? <GhostsView /> : null}
        {route.name === "levels" ? <LevelsView progress={progress} /> : null}
        {route.name === "play" ? <PlayView key={`${route.level}`} level={playLevel} progress={progress} /> : null}
      </main>
      {playing ? null : <TabBar route={route} continueLevel={progress.unlocked} />}
    </div>
  );
}
