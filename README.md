# Aurum Maze

256 rounds of gold-line arcade chase. The original Midway Pac-Man maze repeats
through the first 255 rounds, with the arcade difficulty progression; round 256
recreates the split-screen kill screen in Aurum’s art direction. Mobile first.

## Run

```bash
npm install
npm run dev        # develop
npm run build      # type-check + production build
npm run verify     # arcade board connectivity, pellet count and round-256 checks
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
- Arcade speed bands: Pac-Man 80% / 90% / 100% / 90%; ghosts speed up by round 21 and frightened time eventually ends.

| Ghost | Chase target | Extra behaviour |
| --- | --- | --- |
| Blinky | Pac-Man's tile | "Rage": speeds up and ignores scatter when few pellets remain; random when frightened |
| Pinky | 4 tiles ahead of Pac-Man (facing up: 4 up + 4 left, as in 1980) | Flees to the farthest corner when frightened |
| Inky | Blinky -> (2 tiles ahead) vector, doubled | Random when frightened |
| Clyde | Pac-Man, but retreats to his corner within 5 tiles | Hides in his corner when frightened |

## Structure

```
src/game/arcadeMaze.ts     original 28×36 Midway board, reused for each round
scripts/verify.ts            headless regression checks
src/game/                    engine (no React): Maze, Entity, PacMan, Ghost(+4 personalities),
                             GameEngine (fixed 120 Hz step), Renderer, InputManager, Progress,
                             arcadeMaze.ts, difficulty.ts, worlds.ts, ghostArt.ts (shared by canvas + guide)
src/components/              Navbar, TabBar, Hud, GhostTray, GhostGuide, PauseSheet, ...
src/views/                   HomeView (hero, how-to-play, ghost guide), LevelsView, PlayView
src/router.ts                hash routing (#/, #/ghosts, #/levels, #/play/N)
```

## Deploying

`.github/workflows/deploy.yml` builds with Vite and publishes `dist/` to GitHub Pages.
`vite.config.ts` sets `base: "/aurumMaze/"`; it must match the repository name.


## Accuracy note

The maze and rules are based on the 1980 Midway arcade version: one maze reused
for the first 255 rounds, 244 dots, bonus fruit at 70 and 170 dots, arcade ghost
mode timings, level speed bands, an extra life at 10,000 points, and the 256th-round
split screen. The visual style remains Aurum’s. The existing browser engine is a
reimplementation, not a frame-accurate emulator; pixel movement, cornering, sound,
ROM-driven frightened-ghost randomness and the exact corrupted screen are not
identical to original hardware.

Maze tile data was decoded from the ROM-derived public reference at
https://github.com/bielesibub/pacman. Gameplay behavior references The Pac-Man
Dossier: https://pacman.holenet.info/.

## Accuracy note

The maze and rules are based on the 1980 Midway arcade version: one maze reused
for the first 255 rounds, 244 dots, fruit milestones at 70 and 170 dots, arcade
ghost-mode timings, speed bands, extra life at 10,000 points, and the 256th-round
split screen. The visual style remains Aurum’s. The browser engine is a
reimplementation, not a frame-accurate emulator; pixel movement, cornering, sound,
ROM-driven frightened-ghost randomness, and the exact corrupted screen are not
identical to original hardware.

Maze tile data was decoded from the ROM-derived public reference implementation
at https://github.com/bielesibub/pacman. Gameplay behavior references The Pac-Man
Dossier at https://pacman.holenet.info/.
