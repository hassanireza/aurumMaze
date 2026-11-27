import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";
import { mountIosHaptics } from "./game/IosHaptics";
import { progressStore } from "./game/Progress";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root container not found");
}

const syncHaptics = (): void => document.documentElement.classList.toggle("haptics-off", !progressStore.getSnapshot().haptics);
syncHaptics();
progressStore.subscribe(syncHaptics);

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
);

mountIosHaptics();
