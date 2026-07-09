import { Maze } from "./Maze";
import { PacMan } from "./PacMan";
import type { Ghost } from "./Ghost";
import { BlinkyGhost } from "./ghosts/BlinkyGhost";
import { PinkyGhost } from "./ghosts/PinkyGhost";
import { InkyGhost } from "./ghosts/InkyGhost";
import { ClydeGhost } from "./ghosts/ClydeGhost";
import { LEVELS, TOTAL_LEVELS } from "./levels";
import {
  DIRECTIONS,
  PELLET_SCORE,
  PELLET_SCORE_PER_LEVEL,
  POWER_PELLET_DURATION,
  GHOST_EATEN_SCORE,
  SCATTER_DURATION,
  CHASE_DURATION,
  STARTING_LIVES
} from "./constants";
import type { DirectionName, GameMode, HudSnapshot } from "./types";

const PACMAN_START = { x: 1, y: 1 };
const COLLISION_RADIUS = 0.72;

export interface GameEngineEvents {
  onOverlay: (title: string, message: string, actionLabel: string) => void;
  onHudChange: (snapshot: HudSnapshot) => void;
}

/** Central coordinator: owns maze/entities state and drives the fixed-step simulation. */
export class GameEngine {
  private maze: Maze;
  private pacman: PacMan;
  private ghosts: Ghost[];
  private mode: GameMode = "ready";
  private score = 0;
  private levelIndex = 0;
  private lives = STARTING_LIVES;
  private frightenedTimer = 0;
  private huntTimer = SCATTER_DURATION;
  private huntPhase: "scatter" | "chase" = "scatter";
  private pulse = 0;
  private readonly completedLevels = new Set<number>();

  public constructor(private readonly events: GameEngineEvents) {
    this.maze = new Maze(LEVELS[0]!);
    this.pacman = new PacMan(PACMAN_START);
    this.ghosts = this.spawnGhosts();
    this.emitOverlay(
      "Enter the gold line",
      "A stripped back arcade chase in ten precise acts. Clear every spark, master every turn, and make the maze sing.",
      "Start run"
    );
    this.emitHud();
  }

  private spawnGhosts(): Ghost[] {
    return [
      new BlinkyGhost(this.levelIndex),
      new PinkyGhost(this.levelIndex),
      new InkyGhost(this.levelIndex),
      new ClydeGhost(this.levelIndex)
    ];
  }

  private emitOverlay(title: string, message: string, actionLabel: string): void {
    this.events.onOverlay(title, message, actionLabel);
  }

  private emitHud(): void {
    const level = LEVELS[this.levelIndex];
    this.events.onHudChange({
      score: this.score,
      levelIndex: this.levelIndex,
      lives: this.lives,
      mode: this.mode,
      statusLabel: this.mode === "playing" ? level?.name ?? "" : this.mode,
      levelName: level?.name ?? "",
      completedLevels: Array.from(this.completedLevels)
    });
  }

  public getMaze(): Maze {
    return this.maze;
  }

  public getPacman(): PacMan {
    return this.pacman;
  }

  public getGhosts(): readonly Ghost[] {
    return this.ghosts;
  }

  public getMode(): GameMode {
    return this.mode;
  }

  public getPulse(): number {
    return this.pulse;
  }

  public isFrightened(): boolean {
    return this.frightenedTimer > 0;
  }

  public reset(): void {
    this.maze = new Maze(LEVELS[0]!);
    this.pacman = new PacMan(PACMAN_START);
    this.levelIndex = 0;
    this.score = 0;
    this.lives = STARTING_LIVES;
    this.frightenedTimer = 0;
    this.huntTimer = SCATTER_DURATION;
    this.huntPhase = "scatter";
    this.completedLevels.clear();
    this.ghosts = this.spawnGhosts();
    this.mode = "ready";
    this.emitOverlay(
      "Enter the gold line",
      "A stripped back arcade chase in ten precise acts. Clear every spark, master every turn, and make the maze sing.",
      "Start run"
    );
    this.emitHud();
  }

  public start(): void {
    if (this.mode === "won" || this.mode === "over") {
      this.reset();
    }
    this.mode = "playing";
    this.emitHud();
  }

  public togglePause(): void {
    if (this.mode === "playing") {
      this.mode = "paused";
      this.emitOverlay("Hold the line", "The maze is waiting at the exact beat you left it.", "Resume");
    } else if (this.mode === "paused" || this.mode === "ready") {
      this.start();
    }
    this.emitHud();
  }

  public queueDirection(name: DirectionName): void {
    if (name === "none") return;
    this.pacman.queueDirection(DIRECTIONS[name]!);
    if (this.mode === "ready") this.start();
  }

  private handlePelletEaten = (isPower: boolean): void => {
    this.score += PELLET_SCORE + this.levelIndex * PELLET_SCORE_PER_LEVEL;
    if (isPower) {
      this.frightenedTimer = POWER_PELLET_DURATION;
      for (const ghost of this.ghosts) ghost.startFrightened();
    }
  };

  private updateHuntCycle(dt: number): void {
    if (this.frightenedTimer > 0) return;
    this.huntTimer -= dt;
    if (this.huntTimer <= 0) {
      this.huntPhase = this.huntPhase === "scatter" ? "chase" : "scatter";
      this.huntTimer = this.huntPhase === "scatter" ? SCATTER_DURATION : CHASE_DURATION;
      for (const ghost of this.ghosts) ghost.setHuntMode(this.huntPhase);
    }
  }

  private checkCollisions(): void {
    for (const ghost of this.ghosts) {
      if (ghost.isEaten) continue;
      const distance = Math.hypot(ghost.x - this.pacman.x, ghost.y - this.pacman.y);
      if (distance >= COLLISION_RADIUS) continue;
      if (ghost.isVulnerable) {
        ghost.markEaten();
        this.score += GHOST_EATEN_SCORE;
      } else {
        this.loseLife();
        return;
      }
    }
  }

  private loseLife(): void {
    this.lives -= 1;
    if (this.lives <= 0) {
      this.mode = "over";
      this.emitOverlay(
        "The line went dark",
        `Your score was ${this.score}. The maze is built for another attempt.`,
        "Run it back"
      );
    } else {
      this.mode = "paused";
      this.pacman = new PacMan(PACMAN_START);
      this.ghosts = this.spawnGhosts();
      this.frightenedTimer = 0;
      this.huntPhase = "scatter";
      this.huntTimer = SCATTER_DURATION;
      this.emitOverlay(
        "Clean reset",
        `${this.lives} lives remain. Take the corner later and own the rhythm.`,
        "Continue"
      );
    }
    this.emitHud();
  }

  private advanceLevel(): void {
    this.completedLevels.add(this.levelIndex);
    if (this.levelIndex >= TOTAL_LEVELS - 1) {
      this.mode = "won";
      this.emitOverlay(
        "Ten lines cleared",
        `Final score ${this.score}. A perfect loop deserves another run.`,
        "Play again"
      );
      this.emitHud();
      return;
    }
    this.levelIndex += 1;
    this.maze = new Maze(LEVELS[this.levelIndex]!);
    this.pacman = new PacMan(PACMAN_START);
    this.ghosts = this.spawnGhosts();
    this.frightenedTimer = 0;
    this.huntPhase = "scatter";
    this.huntTimer = SCATTER_DURATION;
    this.mode = "paused";
    const name = LEVELS[this.levelIndex]?.name ?? "";
    this.emitOverlay(name, "New geometry. Sharper pursuit. Same clean hunger.", "Start level");
    this.emitHud();
  }

  public update(dt: number): void {
    if (this.mode !== "playing") return;
    this.pulse += dt;
    if (this.frightenedTimer > 0) {
      this.frightenedTimer = Math.max(0, this.frightenedTimer - dt);
      if (this.frightenedTimer === 0) {
        for (const ghost of this.ghosts) ghost.setHuntMode(this.huntPhase);
      }
    }
    this.updateHuntCycle(dt);
    this.pacman.update(this.maze, dt, this.levelIndex, this.pulse, this.handlePelletEaten);

    const blinky = this.ghosts.find(ghost => ghost.id === "blinky") ?? this.ghosts[0]!;
    for (const ghost of this.ghosts) {
      ghost.update(
        { pacman: this.pacman, blinkyPosition: { x: blinky.x, y: blinky.y }, maze: this.maze, pulse: this.pulse },
        dt
      );
    }

    this.checkCollisions();
    if (this.maze.remainingPellets === 0) this.advanceLevel();
    this.emitHud();
  }
}
