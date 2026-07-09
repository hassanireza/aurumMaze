# Aurum Maze

Ten luminous rounds of gold line arcade chase. A strict TypeScript, OOP,
React rebuild of the original vanilla JS prototype.

## Stack

- React 18 + TypeScript (strict mode, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)
- Vite build tooling
- Plain Canvas 2D rendering driven by an object-oriented game engine
- No external game framework, no game state in React beyond the HUD snapshot

## Architecture

All gameplay logic lives in `src/game/` as plain TypeScript classes, kept
completely separate from React:

- `Vector2` - small 2D vector helper
- `Maze` - grid, wall checks, pellet tracking for a single level
- `Entity` - abstract base for anything that walks the grid
- `PacMan` - player entity, input queue, movement, pellet consumption
- `Ghost` - abstract ghost with shared scatter/chase/frightened/eaten state machine
- `ghosts/BlinkyGhost.ts` - The Chaser, hunts Pac-Man's exact tile
- `ghosts/PinkyGhost.ts` - The Ambusher, targets four tiles ahead of Pac-Man
- `ghosts/InkyGhost.ts` - The Flanker, reflects Blinky's position through a point ahead of Pac-Man
- `ghosts/ClydeGhost.ts` - The Shy One, chases from afar but retreats up close
- `GameEngine` - owns all entities, drives the fixed-step simulation, scoring, lives and level flow
- `Renderer` - pure canvas drawing, takes engine state and paints it
- `InputManager` - keyboard and swipe/tap input, decoupled from React events

React (`src/components/`) only renders the HUD, overlay, level list and
touch controls, and hosts the `<canvas>` element that the engine draws into.

## Ghost personalities

Each ghost keeps the classic scatter and chase cycle, plus a shared
frightened/eaten state after a power pellet, but picks its chase target
differently:

| Ghost | Personality | Targeting |
| --- | --- | --- |
| Blinky | The Chaser | Pac-Man's current tile, directly |
| Pinky | The Ambusher | Four tiles ahead of Pac-Man's facing direction |
| Inky | The Flanker | Mirrors Blinky's position through a point two tiles ahead of Pac-Man |
| Clyde | The Shy One | Chases directly from afar, retreats to his corner within 8 tiles |

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

## Deploying to GitHub Pages

This repository ships with `.github/workflows/deploy.yml`, which builds the
app with Vite and publishes `dist/` to GitHub Pages using the official
Pages actions.

1. Push this project to a repository named `AurumMaze`.
2. In the repository settings, go to **Settings -> Pages** and set
   **Source** to **GitHub Actions**.
3. Push to `main` (or run the workflow manually from the Actions tab).
4. The site will be published at `https://<your-username>.github.io/AurumMaze/`.

`vite.config.ts` sets `base: "/AurumMaze/"` to match this repository name.
If you rename the repository, update that value to match.

## Controls

- Arrow keys or WASD to move, Space to pause
- Swipe or tap the on-screen pad on touch devices
- Tap the board to start or resume
