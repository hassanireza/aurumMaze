# Aurum Maze

Fifty luminous rounds of gold-line arcade chase. Strict TypeScript, OOP game
engine, React UI, Canvas 2D rendering. Mobile first.

## Run

```bash
npm install
npm run dev        # develop
npm run build      # type-check + production build
npm run verify     # headless checks: 50 mazes connected, ghost AI never freezes
npm run levels     # regenerate src/game/levelData.ts (deterministic)
```

## Controls

- **Touch:** swipe anywhere on the screen (chain swipes without lifting). Optional D-pad in the pause menu.
- **Keyboard:** arrows or WASD; Space / Esc / P pauses.
- Pac-Man **keeps gliding** in his last direction until a wall stops him (arcade behaviour). A turn pressed slightly before a junction is buffered for 0.55 s, then forgotten.

## Ghost AI (arcade rules)

- Decisions happen only at tile centres; a ghost never reverses by choice.
- At each junction it picks the exit whose next tile is nearest its target (ties: up, left, down, right).
- Every scatter/chase flip and every power pellet forces one U-turn.
- Scatter 7/20/7/20/5/20/5/chase (shorter on later levels). The clock pauses while ghosts are frightened.
- Ghost house with a door: Blinky starts outside, Pinky leaves at once, Inky and Clyde after pellet counts (or an idle timer). Eaten ghosts return as eyes and re-exit.
- Tunnel row: wrap-around, ghosts slow down inside it.
- Speeds are ratios of Pac-Man's: ghosts 72% -> 97% across 50 levels, frightened 50%, tunnel 45%.

| Ghost | Chase target | Extra behaviour |
| --- | --- | --- |
| Blinky | Pac-Man's tile | "Rage": speeds up and ignores scatter when few pellets remain; random when frightened |
| Pinky | 4 tiles ahead of Pac-Man (facing up: 4 up + 4 left, as in 1980) | Flees to the farthest corner when frightened |
| Inky | Blinky -> (2 tiles ahead) vector, doubled | Random when frightened |
| Clyde | Pac-Man, but retreats to his corner within 5 tiles | Hides in his corner when frightened |

## Structure

```
scripts/generateLevels.mjs   deterministic maze generator -> src/game/levelData.ts
scripts/verify.ts            headless regression checks
src/game/                    engine (no React): Maze, Entity, PacMan, Ghost(+4 personalities),
                             GameEngine (fixed 120 Hz step), Renderer, InputManager, Progress,
                             difficulty.ts, worlds.ts, ghostArt.ts (shared by canvas + guide)
src/components/              Navbar, TabBar, Hud, GhostTray, GhostGuide, PauseSheet, ...
src/views/                   HomeView (hero, how-to-play, ghost guide), LevelsView, PlayView
src/router.ts                hash routing (#/, #/ghosts, #/levels, #/play/N)
```

## Deploying

`.github/workflows/deploy.yml` builds with Vite and publishes `dist/` to GitHub Pages.
`vite.config.ts` sets `base: "/aurumMaze/"`; it must match the repository name.
