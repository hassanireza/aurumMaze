import type { SoundName } from "./types";

type Ctx = AudioContext;

/**
 * Tiny WebAudio synth: no audio files to download, nothing to cache.
 * The context is created lazily inside a user gesture (a swipe), which is what
 * iOS Safari requires. Every call is a no-op when sound is off or unsupported.
 */
class Sfx {
  private ctx: Ctx | null = null;
  private master: GainNode | null = null;
  public enabled = true;

  /** Call from a real touch / key handler. */
  public unlock(): void {
    if (typeof window === "undefined") return;
    try {
      if (!this.ctx) {
        const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return;
        this.ctx = new Ctor();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.22;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") void this.ctx.resume();
    } catch {
      this.ctx = null;
    }
  }

  private tone(freq: number, start: number, dur: number, type: OscillatorType, vol = 1, slideTo?: number): void {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const t0 = ctx.currentTime + start;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  public play(name: SoundName): void {
    if (!this.enabled || !this.ctx || this.ctx.state !== "running") return;
    switch (name) {
      case "waka1": this.tone(520, 0, 0.07, "triangle", 0.9, 330); break;
      case "waka2": this.tone(330, 0, 0.07, "triangle", 0.9, 520); break;
      case "power": this.tone(180, 0, 0.35, "sawtooth", 0.5, 620); break;
      case "ghost": this.tone(300, 0, 0.1, "square", 0.45, 900); this.tone(900, 0.1, 0.12, "square", 0.35, 1500); break;
      case "fruit": this.tone(660, 0, 0.08, "square", 0.4); this.tone(990, 0.08, 0.12, "square", 0.4); break;
      case "life": [523, 659, 784, 1047].forEach((f, i) => this.tone(f, i * 0.08, 0.14, "triangle", 0.7)); break;
      case "start": this.tone(440, 0, 0.06, "triangle", 0.5); break;
      case "clear": [523, 587, 659, 784, 1047].forEach((f, i) => this.tone(f, i * 0.1, 0.16, "triangle", 0.7)); break;
      case "die": for (let i = 0; i < 9; i += 1) this.tone(700 - i * 62, 0.7 + i * 0.1, 0.12, "sawtooth", 0.5, 480 - i * 40); break;
    }
  }
}

export const sfx = new Sfx();
