import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Repository name is AurumMaze, so GitHub Pages serves the site from
// https://<user>.github.io/AurumMaze/ — the base path must match.
export default defineConfig({
  plugins: [react()],
  base: "/aurumMaze/",
  build: {
    outDir: "dist",
    sourcemap: false
  }
});
