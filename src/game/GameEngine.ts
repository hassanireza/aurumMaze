import { Maze } from "./Maze";
import { PacMan } from "./PacMan";
import type { Ghost } from "./Ghost";
import { BlinkyGhost } from "./ghosts/BlinkyGhost";
import { PinkyGhost } from "./ghosts/PinkyGhost";
import { InkyGhost } from "./ghosts/InkyGhost";
import { ClydeGhost } from "./ghosts/ClydeGhost";
import { LEVELS, TOTAL_LEVELS } from "./levels";
import { fruitForLevel, levelConfig, type LevelConfig } from "./difficulty";
import { Rng } from "./Rng";
import {
  DIRECTIONS,
  EXTRA_LIFE_AT,
  FIXED_STEP,
  GHOST_CHAIN,
  LEVEL_CLEAR_BONUS,
  PACMAN_START,
  PELLET_SCORE,
  PELLET_SCORE_PER_LEVEL,
  POWER_PELLET_SCORE,
  STARTING_LIVES
} from "./constants";
import type {
  DirectionName,
  GameMode,
  GhostId,
  HapticKind,
  HudSnapshot,
  HuntPhase,
  Popup
} from "./types";

const COLLISION_RADIUS = 0.6;
const DEATH_SECONDS = 1.5;
const CLEAR_SECONDS = 2.0;
const FREEZE_SECONDS = 0.45;
const IDLE_RELEASE_SECONDS = 3.6;
const RELEASE_GAP_SECONDS = 0.7;
const RELEASE_ORDER: readonly GhostId[] = ["pinky", "inky", "clyde"];
const MAX_STEPS_PER_FRAME = 10;

export interface GameEngineEvents {
  onHudChange: (snapshot: HudSnapshot) => void;
  onLevelCleared: (levelIndex: number, score: number) => void;
  onGameEnd: (score: number, won: boolean) => void;
  onHaptic: (kind: HapticKind) => void;
}

export interface GameEngineOptions {
  readonly startLevel: number;
  readonly best: number;
  readonly completed: readonly number[];
  readonly seed?: number;
}

/** Central coordinator: owns maze/entities and drives the fixed-step simulation. */
export class GameEngine {
  private maze: Maze;
  private pacman: PacMan;
  private ghosts: Ghost[];
  private config: LevelConfig;
  private readonly rng: Rng;

  private mode: GameMode = "ready";
  private score = 0;
  private best: number;
  private levelIndex: number;
  private lives = STARTING_LIVES;
  private levelStartScore = 0;
  private levelStartLives = STARTING_LIVES;
  private extraLifeGiven = false;
  private dotsEaten = 0;
  private fruitVisible = 0;
  private fruitAvailable: Set<number> = new Set();

  private frightLeft = 0;
  private chain = 0;
  private huntStep = 0;
  private huntTimer = 0;
  private huntPhase: HuntPhase = "scatter";
  private eatenThisLife = 0;
  private idleTimer = 0;
  private sinceRelease = 0;
  private freeze = 0;
  private deathTimer = 0;
  private clearTimer = 0;
  private accumulator = 0;
  private clock = 0;
  private popups: Popup[] = [];
  private hudKey = "";
  private readonly completed: Set<number>;

  public constructor(
    private readonly events: GameEngineEvents,
    options: GameEngineOptions
  ) {
    this.levelIndex = Math.max(0, Math.min(TOTAL_LEVELS - 1, options.startLevel));
    this.best = options.best;
    this.rng = new Rng(options.seed ?? (Date.now() & 0xffffff));
    this.completed = new Set(options.completed);
    this.config = levelConfig(this.levelIndex);
    this.maze = new Maze(LEVELS[this.levelIndex]!);
    if (this.levelIndex === 255) this.maze.corruptRightHalf();
    this.pacman = new PacMan(PACMAN_START);
    this.ghosts = this.spawnGhosts();
    this.beginRound();
    this.emitHud(true);
  }

  /* ---------- read-only state for the renderer / HUD ---------- */

  public getMaze(): Maze { return this.maze; }
  public getPacman(): PacMan { return this.pacman; }
  public getGhosts(): readonly Ghost[] { return this.ghosts; }
  public getMode(): GameMode { return this.mode; }
  public getClock(): number { return this.clock; }
  public getLevelIndex(): number { return this.levelIndex; }
  public getWorld(): number { return LEVELS[this.levelIndex]?.world ?? 0; }
  public getPopups(): readonly Popup[] { return this.popups; }
  public isFrightened(): boolean { return this.frightLeft > 0; }
  public getFrightLeft(): number { return this.frightLeft; }
  public getDeathProgress(): number { return Math.min(1, this.deathTimer / DEATH_SECONDS); }
  public getClearProgress(): number { return Math.min(1, this.clearTimer / CLEAR_SECONDS); }

  /* ---------- lifecycle ---------- */

  private spawnGhosts(): Ghost[] {
    return [new BlinkyGhost(), new PinkyGhost(), new InkyGhost(), new ClydeGhost()];
  }

  /** Resets positions and timers for a fresh attempt; pellets stay as they are. */
  private beginRound(): void {
    this.pacman = new PacMan(PACMAN_START);
    this.ghosts = this.spawnGhosts();
    this.frightLeft = 0;
    this.chain = 0;
    this.huntStep = 0;
    this.huntPhase = this.config.schedule[0]!.phase;
    this.huntTimer = this.config.schedule[0]!.seconds;
    for (const ghost of this.ghosts) ghost.huntPhase = this.huntPhase;
    this.fruitVisible = 0;
    this.fruitAvailable.clear();
    this.eatenThisLife = 0;
    this.idleTimer = 0;
    this.sinceRelease = RELEASE_GAP_SECONDS;
    this.freeze = 0;
    this.deathTimer = 0;
    this.clearTimer = 0;
    this.popups = [];
    this.mode = "ready";
  }

  private loadLevel(index: number): void {
    this.levelIndex = index;
    this.config = levelConfig(index);
    this.maze = new Maze(LEVELS[index]!);
    if (index === 255) this.maze.corruptRightHalf();
    this.dotsEaten = 0;
    this.fruitVisible = 0;
    this.fruitAvailable = new Set();
    this.levelStartScore = this.score;
    this.levelStartLives = this.lives;
    this.beginRound();
    this.emitHud(true);
  }

  /** ready -> playing. Called on the first swipe or tap. */
  public begin(): void {
    if (this.mode !== "ready") return;
    this.mode = "playing";
    this.emitHud(true);
  }

  public pause(): void {
    if (this.mode !== "playing") return;
    this.mode = "paused";
    this.emitHud(true);
  }

  public resume(): void {
    if (this.mode !== "paused") return;
    this.mode = "playing";
    this.emitHud(true);
  }

  public togglePause(): void {
    if (this.mode === "playing") this.pause();
    else if (this.mode === "paused") this.resume();
    else if (this.mode === "ready") this.begin();
  }

  /** Continue from the level-clear card. */
  public nextLevel(): void {
    if (this.mode !== "levelclear") return;
    this.loadLevel(this.levelIndex + 1);
  }

  /** Replays the current level with the score and lives it started with (or full lives after game over). */
  public restartLevel(): void {
    const wasOver = this.mode === "over";
    this.score = this.levelStartScore;
    this.lives = wasOver ? STARTING_LIVES : this.levelStartLives;
    this.loadLevel(this.levelIndex);
  }

  public queueDirection(name: DirectionName): void {
    if (name === "none") return;
    if (this.mode !== "ready" && this.mode !== "playing") return;
    this.pacman.queueDirection(DIRECTIONS[name]);
    if (this.mode === "ready") this.begin();
  }

  /* ---------- simulation ---------- */

  public update(dt: number): void {
    this.clock += dt;
    this.accumulator += Math.min(dt, 0.1);
    let steps = 0;
    while (this.accumulator >= FIXED_STEP && steps < MAX_STEPS_PER_FRAME) {
      this.accumulator -= FIXED_STEP;
      steps += 1;
      this.tick(FIXED_STEP);
    }
    if (steps === MAX_STEPS_PER_FRAME) this.accumulator = 0;
    this.emitHud(false);
  }

  private tick(dt: number): void {
    for (const popup of this.popups) popup.age += dt;
    this.popups = this.popups.filter(p => p.age < 1.1);

    switch (this.mode) {
      case "playing":
        this.simulate(dt);
        break;
      case "dying":
        this.deathTimer += dt;
        if (this.deathTimer >= DEATH_SECONDS) this.afterDeath();
        break;
      case "clearing":
        this.clearTimer += dt;
        if (this.clearTimer >= CLEAR_SECONDS) this.afterClear();
        break;
      default:
        break;
    }
  }

  private simulate(dt: number): void {
    if (this.freeze > 0) {
      this.freeze -= dt;
      return;
    }

    if (this.fruitVisible > 0) this.fruitVisible = Math.max(0, this.fruitVisible - dt);

    if (this.frightLeft > 0) {
      this.frightLeft = Math.max(0, this.frightLeft - dt);
      if (this.frightLeft === 0) for (const ghost of this.ghosts) ghost.endFrightened();
    } else {
      this.advanceHuntClock(dt);
    }

    this.pacman.update(this.maze, dt, this.config.pacSpeed, this.clock, this.handlePellet);
    this.releaseGhosts(dt);

    const blinky = this.ghosts[0]!;
    const context = {
      pacman: this.pacman,
      blinkyCell: blinky.cell,
      maze: this.maze,
      rng: this.rng,
      config: this.config,
      pelletsLeft: this.maze.remainingPellets
    };
    for (const ghost of this.ghosts) ghost.update(context, dt);

    this.checkCollisions();
    if (this.mode === "playing" && this.maze.remainingPellets === 0) this.startClearing();
  }

  private advanceHuntClock(dt: number): void {
    this.huntTimer -= dt;
    if (this.huntTimer > 0) return;
    const schedule = this.config.schedule;
    this.huntStep = Math.min(schedule.length - 1, this.huntStep + 1);
    const step = schedule[this.huntStep]!;
    this.huntPhase = step.phase;
    this.huntTimer = step.seconds;
    for (const ghost of this.ghosts) ghost.setHuntPhase(step.phase);
  }

  private releaseGhosts(dt: number): void {
    this.idleTimer += dt;
    this.sinceRelease += dt;
    if (this.sinceRelease < RELEASE_GAP_SECONDS) return;
    for (const id of RELEASE_ORDER) {
      const ghost = this.ghosts.find(g => g.id === id);
      if (!ghost || ghost.phase !== "house") continue;
      const needed = this.config.release[id as "pinky" | "inky" | "clyde"];
      if (this.eatenThisLife >= needed || this.idleTimer >= IDLE_RELEASE_SECONDS) {
        ghost.release();
        this.idleTimer = 0;
        this.sinceRelease = 0;
      }
      return;
    }
  }

  private handlePellet = (isPower: boolean): void => {
    this.eatenThisLife += 1;
    this.dotsEaten += 1;
    this.idleTimer = 0;
    this.addScore(PELLET_SCORE + this.levelIndex * PELLET_SCORE_PER_LEVEL);
    if ((this.dotsEaten === 70 || this.dotsEaten === 170) && !this.fruitAvailable.has(this.dotsEaten)) {
      this.fruitAvailable.add(this.dotsEaten);
      this.fruitVisible = 9.5;
    }
    const fruitPos = this.pacman.renderPosition();
    if (this.fruitVisible > 0 && Math.hypot(fruitPos.x - 13.5, fruitPos.y - 23) < 0.5) {
      this.addScore(fruitForLevel(this.levelIndex).points);
      this.fruitVisible = 0;
    }
    if (!isPower) return;
    this.addScore(POWER_PELLET_SCORE);
    if (this.config.frightSeconds <= 0) {
      for (const ghost of this.ghosts) ghost.requestReverse();
      this.events.onHaptic("power");
      return;
    }
    this.frightLeft = this.config.frightSeconds;
    this.chain = 0;
    for (const ghost of this.ghosts) ghost.startFrightened();
    this.events.onHaptic("power");
  };

  public getFruitTime(): number { return this.fruitVisible; }
  public getFruit(): { readonly name: string; readonly points: number } { return fruitForLevel(this.levelIndex); }

  private addScore(points: number): void {
    this.score += points;
    if (this.score > this.best) this.best = this.score;
    if (!this.extraLifeGiven && this.score >= EXTRA_LIFE_AT) {
      this.extraLifeGiven = true;
      this.lives += 1;
    }
  }

  private checkCollisions(): void {
    const p = this.pacman.renderPosition();
    for (const ghost of this.ghosts) {
      if (!ghost.isActive) continue;
      const g = ghost.renderPosition();
      if (Math.hypot(g.x - p.x, g.y - p.y) >= COLLISION_RADIUS) continue;
      if (ghost.isVulnerable) {
        ghost.markEaten();
        const points = GHOST_CHAIN[Math.min(this.chain, GHOST_CHAIN.length - 1)]!;
        this.chain += 1;
        this.addScore(points);
        this.popups.push({ x: g.x, y: g.y, text: String(points), age: 0 });
        this.freeze = FREEZE_SECONDS;
        this.events.onHaptic("eat");
      } else {
        this.mode = "dying";
        this.deathTimer = 0;
        this.events.onHaptic("die");
        this.emitHud(true);
        return;
      }
    }
  }

  private afterDeath(): void {
    this.lives -= 1;
    if (this.lives <= 0) {
      this.lives = 0;
      this.mode = "over";
      this.events.onGameEnd(this.score, false);
    } else {
      this.fruitVisible = 0;
      this.fruitAvailable.clear();
      this.beginRound();
    }
    this.emitHud(true);
  }

  private startClearing(): void {
    this.mode = "clearing";
    this.clearTimer = 0;
    if (this.levelIndex === 255) {
      this.mode = "levelclear";
      this.emitHud(true);
      return;
    }
    this.completed.add(this.levelIndex);
    this.addScore(LEVEL_CLEAR_BONUS);
    this.events.onLevelCleared(this.levelIndex, this.score);
    this.events.onHaptic("clear");
    this.emitHud(true);
  }

  private afterClear(): void {
    this.mode = "levelclear";
    this.emitHud(true);
  }

  /* ---------- HUD ---------- */

  private emitHud(force: boolean): void {
    const level = LEVELS[this.levelIndex];
    const frightened = this.frightLeft > 0 ? Math.round((this.frightLeft / this.config.frightSeconds) * 25) / 25 : 0;
    const ghosts = this.ghosts.map(g => ({ id: g.id, mode: g.displayMode }));
    const key = [
      this.score, this.best, this.levelIndex, this.lives, this.mode, this.maze.remainingPellets,
      frightened, this.huntPhase, ghosts.map(g => g.mode).join("")
    ].join("|");
    if (!force && key === this.hudKey) return;
    this.hudKey = key;
    this.events.onHudChange({
      score: this.score,
      best: this.best,
      levelIndex: this.levelIndex,
      lives: this.lives,
      mode: this.mode,
      statusLabel: this.mode,
      levelName: level?.name ?? "",
      world: level?.world ?? 0,
      pelletsLeft: this.maze.remainingPellets,
      pelletsTotal: this.maze.totalPellets,
      frightened,
      ghosts,
      phase: this.huntPhase,
      completedLevels: Array.from(this.completed)
    });
  }
}
