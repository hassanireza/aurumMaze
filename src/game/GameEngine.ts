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
  ALL_GHOSTS_BONUS,
  DIRECTIONS,
  EXTRA_LIFE_AT,
  FIXED_STEP,
  FRUIT_POSITION,
  GHOST_CHAIN,
  PACMAN_START,
  PELLET_SCORE,
  POWER_PELLET_SCORE,
  STARTING_LIVES
} from "./constants";
import type {
  DirectionName,
  FruitName,
  GameMode,
  GhostId,
  HapticKind,
  HudSnapshot,
  HuntPhase,
  Popup,
  SoundName
} from "./types";

/** Pac-Man and a ghost touch when their centres are this close (tiles). */
const KILL_RADIUS = 0.55;
/** Eating a frightened ghost is deliberately more generous than being eaten. */
const EAT_RADIUS = 0.8;
const DEATH_PAUSE = 0.7;
const DEATH_SECONDS = 1.7;
const CLEAR_SECONDS = 2.0;
const FREEZE_SECONDS = 0.7;
const RELEASE_GAP_SECONDS = 0.45;
const FRUIT_SECONDS = 9.5;
const RELEASE_ORDER: readonly ("pinky" | "inky" | "clyde")[] = ["pinky", "inky", "clyde"];
const GLOBAL_LIMITS = { pinky: 7, inky: 17, clyde: 32 } as const;
const MAX_STEPS_PER_FRAME = 12;

export interface GameEngineEvents {
  onHudChange: (snapshot: HudSnapshot) => void;
  onLevelCleared: (levelIndex: number, score: number) => void;
  onGameEnd: (score: number, won: boolean) => void;
  onHaptic: (kind: HapticKind) => void;
  onSound?: (name: SoundName) => void;
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
  private fruitTimer = 0;
  private fruitSpawned = new Set<number>();

  private frightLeft = 0;
  private frightTotal = 1;
  private chain = 0;
  private ghostsEatenLevel = 0;
  private powersEatenLevel = 0;
  private huntStep = 0;
  private huntTimer = 0;
  private huntPhase: HuntPhase = "scatter";
  private counters: Record<"pinky" | "inky" | "clyde", number> = { pinky: 0, inky: 0, clyde: 0 };
  private globalActive = false;
  private globalCount = 0;
  private elroyActive = true;
  private idleTimer = 0;
  private sinceRelease = 0;
  private freeze = 0;
  private deathTimer = 0;
  private clearTimer = 0;
  private accumulator = 0;
  private clock = 0;
  private wakaToggle = false;
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
    this.maze = this.buildMaze(this.levelIndex);
    this.pacman = new PacMan(PACMAN_START);
    this.ghosts = this.spawnGhosts();
    this.resetPositions();
    this.emitHud(true);
  }

  /* ---------- read-only state for the renderer / HUD ---------- */

  public getMaze(): Maze { return this.maze; }
  public getPacman(): PacMan { return this.pacman; }
  public getGhosts(): readonly Ghost[] { return this.ghosts; }
  public getMode(): GameMode { return this.mode; }
  public getClock(): number { return this.clock; }
  public getLevelIndex(): number { return this.levelIndex; }
  public getPopups(): readonly Popup[] { return this.popups; }
  public isFrightened(): boolean { return this.frightLeft > 0; }
  public getFrightLeft(): number { return this.frightLeft; }
  /** Seconds of flashing at the end of a frightened spell (shorter spells flash for less). */
  public getFlashWindow(): number { return Math.min(2, this.frightTotal * 0.6); }
  public getDeathProgress(): number { return Math.max(0, Math.min(1, (this.deathTimer - DEATH_PAUSE) / (DEATH_SECONDS - DEATH_PAUSE))); }
  public getClearProgress(): number { return Math.min(1, this.clearTimer / CLEAR_SECONDS); }
  public getFruitTime(): number { return this.fruitTimer; }
  public getFruit(): { readonly name: FruitName; readonly points: number } { return fruitForLevel(this.levelIndex); }
  public getFreeze(): number { return this.freeze; }

  /* ---------- lifecycle ---------- */

  private buildMaze(index: number): Maze {
    const maze = new Maze(LEVELS[index]!);
    if (index === 255) maze.corruptRightHalf();
    return maze;
  }

  private spawnGhosts(): Ghost[] {
    return [new BlinkyGhost(), new PinkyGhost(), new InkyGhost(), new ClydeGhost()];
  }

  private ghost(id: GhostId): Ghost {
    return this.ghosts.find(g => g.id === id)!;
  }

  /** Puts everyone back on their start tiles for a fresh attempt; pellets stay as they are. */
  private resetPositions(): void {
    this.pacman = new PacMan(PACMAN_START);
    this.ghosts = this.spawnGhosts();
    this.frightLeft = 0;
    this.chain = 0;
    this.huntStep = 0;
    this.huntPhase = this.config.schedule[0]!.phase;
    this.huntTimer = this.config.schedule[0]!.seconds;
    for (const ghost of this.ghosts) ghost.huntPhase = this.huntPhase;
    this.fruitTimer = 0;
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
    this.maze = this.buildMaze(index);
    this.dotsEaten = 0;
    this.fruitSpawned = new Set();
    this.counters = { pinky: 0, inky: 0, clyde: 0 };
    this.globalActive = false;
    this.globalCount = 0;
    this.elroyActive = true;
    this.ghostsEatenLevel = 0;
    this.powersEatenLevel = 0;
    this.levelStartScore = this.score;
    this.levelStartLives = this.lives;
    this.resetPositions();
    this.emitHud(true);
  }

  /** ready -> playing. Called on the first swipe or tap. */
  public begin(): void {
    if (this.mode !== "ready") return;
    this.mode = "playing";
    this.events.onSound?.("start");
    this.emitHud(true);
  }

  public pause(): void {
    if (this.mode !== "playing" && this.mode !== "ready") return;
    if (this.mode === "ready") return;
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

  /** Continue from the kill-screen card (round 256 has no successor). */
  public nextLevel(): void {
    if (this.mode !== "levelclear" || this.levelIndex >= TOTAL_LEVELS - 1) return;
    this.loadLevel(this.levelIndex + 1);
  }

  /** Replays the current level with the score and lives it started with (or full lives after game over). */
  public restartLevel(): void {
    const wasOver = this.mode === "over";
    this.score = this.levelStartScore;
    this.lives = wasOver ? STARTING_LIVES : this.levelStartLives;
    if (wasOver) this.extraLifeGiven = this.score >= EXTRA_LIFE_AT;
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

    if (this.fruitTimer > 0) this.fruitTimer = Math.max(0, this.fruitTimer - dt);

    if (this.frightLeft > 0) {
      this.frightLeft = Math.max(0, this.frightLeft - dt);
      if (this.frightLeft === 0) {
        for (const ghost of this.ghosts) ghost.endFrightened();
        this.chain = 0;
      }
    } else {
      this.advanceHuntClock(dt);
    }

    const speed = this.frightLeft > 0 ? this.config.pacFrightSpeed : this.config.pacSpeed;
    this.pacman.update(this.maze, dt, speed, this.handleTile);
    if (this.mode !== "playing") return;
    this.checkFruit();
    this.updateReleases(dt);

    const blinky = this.ghost("blinky");
    const context = {
      pacman: this.pacman,
      blinkyTile: blinky.tile,
      maze: this.maze,
      rng: this.rng,
      config: this.config,
      pelletsLeft: this.maze.remainingPellets,
      elroyActive: this.elroyActive
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

  /* ---------- ghost house ---------- */

  private releaseNext(): void {
    for (const id of RELEASE_ORDER) {
      const ghost = this.ghost(id);
      if (ghost.phase !== "house") continue;
      ghost.release();
      this.idleTimer = 0;
      this.sinceRelease = 0;
      return;
    }
  }

  private waiting(): "pinky" | "inky" | "clyde" | null {
    return RELEASE_ORDER.find(id => this.ghost(id).phase === "house") ?? null;
  }

  private updateReleases(dt: number): void {
    this.idleTimer += dt;
    this.sinceRelease += dt;
    if (this.globalActive && this.ghost("clyde").phase !== "house") {
      this.globalActive = false;
      this.globalCount = 0;
      this.elroyActive = true;
    }
    const next = this.waiting();
    if (!next || this.sinceRelease < RELEASE_GAP_SECONDS) return;
    if (this.idleTimer >= this.config.houseTimeout) {
      this.releaseNext();
      return;
    }
    if (!this.globalActive && this.counters[next] >= this.config.release[next]) this.releaseNext();
  }

  private countDotForRelease(): void {
    this.idleTimer = 0;
    if (this.globalActive) {
      this.globalCount += 1;
      for (const id of RELEASE_ORDER) {
        if (this.globalCount === GLOBAL_LIMITS[id] && this.ghost(id).phase === "house") {
          this.ghost(id).release();
          this.sinceRelease = 0;
        }
      }
      return;
    }
    const next = this.waiting();
    if (next) this.counters[next] += 1;
  }

  /* ---------- eating ---------- */

  private handleTile = (x: number, y: number): void => {
    if (!this.maze.consumePellet(x, y)) return;
    const isPower = this.maze.isPowerPellet(x, y);
    this.dotsEaten += 1;
    this.countDotForRelease();
    this.addScore(PELLET_SCORE);
    this.pacman.addStall(isPower ? 3 / 60 : 1 / 60);
    this.wakaToggle = !this.wakaToggle;
    this.events.onSound?.(this.wakaToggle ? "waka1" : "waka2");
    if ((this.dotsEaten === 70 || this.dotsEaten === 170) && !this.fruitSpawned.has(this.dotsEaten)) {
      this.fruitSpawned.add(this.dotsEaten);
      this.fruitTimer = FRUIT_SECONDS;
    }
    if (!isPower) return;
    this.addScore(POWER_PELLET_SCORE - PELLET_SCORE);
    this.powersEatenLevel += 1;
    this.events.onHaptic("power");
    if (this.config.frightSeconds <= 0) {
      for (const ghost of this.ghosts) ghost.requestReverse();
      return;
    }
    this.frightLeft = this.config.frightSeconds;
    this.frightTotal = this.config.frightSeconds;
    this.chain = 0;
    for (const ghost of this.ghosts) ghost.startFrightened();
    this.events.onSound?.("power");
  };

  private checkFruit(): void {
    if (this.fruitTimer <= 0) return;
    const p = this.pacman.renderPosition();
    if (Math.hypot(p.x - FRUIT_POSITION.x, p.y - FRUIT_POSITION.y) > 0.75) return;
    const fruit = this.getFruit();
    this.addScore(fruit.points);
    this.popups.push({ x: FRUIT_POSITION.x, y: FRUIT_POSITION.y, text: String(fruit.points), age: 0 });
    this.fruitTimer = 0;
    this.events.onSound?.("fruit");
  }

  private addScore(points: number): void {
    this.score += points;
    if (this.score > this.best) this.best = this.score;
    if (!this.extraLifeGiven && this.score >= EXTRA_LIFE_AT) {
      this.extraLifeGiven = true;
      this.lives += 1;
      this.events.onSound?.("life");
    }
  }

  private checkCollisions(): void {
    const p = this.pacman.renderPosition();
    for (const ghost of this.ghosts) {
      if (!ghost.isActive) continue;
      const g = ghost.renderPosition();
      const d = Math.hypot(g.x - p.x, g.y - p.y);
      if (ghost.isVulnerable) {
        if (d >= EAT_RADIUS) continue;
        ghost.markEaten();
        const points = GHOST_CHAIN[Math.min(this.chain, GHOST_CHAIN.length - 1)]!;
        this.chain += 1;
        this.ghostsEatenLevel += 1;
        this.addScore(points);
        this.popups.push({ x: g.x, y: g.y, text: String(points), age: 0 });
        if (this.ghostsEatenLevel === 16 && this.powersEatenLevel === 4) {
          this.addScore(ALL_GHOSTS_BONUS);
          this.popups.push({ x: 13.5, y: 17, text: String(ALL_GHOSTS_BONUS), age: 0 });
        }
        this.freeze = FREEZE_SECONDS;
        this.events.onHaptic("eat");
        this.events.onSound?.("ghost");
        return;
      }
      if (d >= KILL_RADIUS) continue;
      this.mode = "dying";
      this.deathTimer = 0;
      this.events.onHaptic("die");
      this.events.onSound?.("die");
      this.emitHud(true);
      return;
    }
  }

  private afterDeath(): void {
    this.lives -= 1;
    if (this.lives <= 0) {
      this.lives = 0;
      this.mode = "over";
      this.events.onGameEnd(this.score, false);
    } else {
      // Arcade rule: after a death a global dot counter (7 / 17 / 32) governs the house.
      this.globalActive = true;
      this.globalCount = 0;
      this.elroyActive = false;
      this.fruitTimer = 0;
      this.resetPositions();
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
    this.events.onLevelCleared(this.levelIndex, this.score);
    this.events.onHaptic("clear");
    this.events.onSound?.("clear");
    this.emitHud(true);
  }

  private afterClear(): void {
    if (this.levelIndex < TOTAL_LEVELS - 1) this.loadLevel(this.levelIndex + 1);
    else this.mode = "levelclear";
    this.emitHud(true);
  }

  /* ---------- HUD ---------- */

  private emitHud(force: boolean): void {
    const level = LEVELS[this.levelIndex];
    const frightened = this.frightLeft > 0 ? Math.round((this.frightLeft / this.frightTotal) * 25) / 25 : 0;
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
      completedLevels: Array.from(this.completed),
      fruit: fruitForLevel(this.levelIndex).name
    });
  }
}
