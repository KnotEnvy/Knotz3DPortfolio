/**
 * Every sound on this site is synthesised at runtime — no audio files ship in
 * the bundle. Cheap to download, and it demonstrates the WebAudio graph work
 * that the arcade projects lean on.
 */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private padGain: GainNode | null = null;
  private padVoices: OscillatorNode[] = [];
  private _muted = false;
  private started = false;

  get muted(): boolean {
    return this._muted;
  }

  /** Must be called from a user gesture; browsers will not start audio otherwise. */
  unlock(): void {
    if (this.started) {
      void this.ctx?.resume();
      return;
    }
    type WithWebkit = typeof window & { webkitAudioContext?: typeof AudioContext };
    const Ctor = window.AudioContext ?? (window as WithWebkit).webkitAudioContext;
    if (!Ctor) return;
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.gain.value = this._muted ? 0 : 0.6;
    this.master.connect(this.ctx.destination);
    this.started = true;
    this.startPad();
  }

  setMuted(m: boolean): void {
    this._muted = m;
    if (this.master && this.ctx) {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.setTargetAtTime(m ? 0 : 0.6, this.ctx.currentTime, 0.15);
    }
  }

  /** Slow detuned drone that sits under the whole experience. */
  private startPad(): void {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;

    const pad = ctx.createGain();
    pad.gain.value = 0.0;
    pad.gain.setTargetAtTime(0.12, ctx.currentTime, 4);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 520;
    filter.Q.value = 0.7;

    pad.connect(filter);
    filter.connect(master);
    this.padGain = pad;

    // A minor-ninth stack: root, fifth, minor third an octave up, ninth.
    for (const [freq, detune, level] of [
      [55, 0, 0.5],
      [82.4, 6, 0.34],
      [130.8, -7, 0.24],
      [196, 4, 0.16],
    ] as const) {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      osc.detune.value = detune;

      const g = ctx.createGain();
      g.gain.value = level;

      // Gentle amplitude drift so the pad never sounds static.
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.03 + Math.random() * 0.05;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = level * 0.4;
      lfo.connect(lfoGain);
      lfoGain.connect(g.gain);
      lfo.start();

      osc.connect(g);
      g.connect(pad);
      osc.start();
      this.padVoices.push(osc, lfo);
    }
  }

  /** Shift the pad's brightness as the player moves between sectors. */
  setIntensity(v: number): void {
    if (!this.ctx || !this.padGain) return;
    this.padGain.gain.setTargetAtTime(0.08 + v * 0.1, this.ctx.currentTime, 0.8);
  }

  private blip(freq: number, dur: number, type: OscillatorType, gain: number, sweepTo?: number): void {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (sweepTo !== undefined) osc.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc.connect(g);
    g.connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  shard(streak: number): void {
    // Rising pentatonic so a collection run reads as a musical phrase.
    const scale = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
    const step = scale[Math.min(streak, scale.length - 1)];
    this.blip(523.25 * Math.pow(2, step / 12), 0.16, 'triangle', 0.18);
    this.blip(1046.5 * Math.pow(2, step / 12), 0.09, 'sine', 0.07);
  }

  enterSector(): void {
    this.blip(196, 0.5, 'sine', 0.14, 392);
    this.blip(294, 0.4, 'triangle', 0.08, 588);
  }

  decrypt(): void {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, i) => window.setTimeout(() => this.blip(n, 0.28, 'triangle', 0.16), i * 90));
  }

  ui(): void {
    this.blip(880, 0.05, 'square', 0.04);
  }

  boost(): void {
    this.blip(120, 0.22, 'sawtooth', 0.05, 60);
  }


  /**
   * Filtered noise burst. Explosions are noise, not tones — a sawtooth sweep
   * reads as a laser no matter what you do to the envelope, so detonations get
   * a real noise buffer through a swept low-pass instead.
   */
  private noise(dur: number, gain: number, from: number, to: number, q = 1.4): void {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;
    const t = ctx.currentTime;

    const frames = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    // Slightly correlated noise: a touch of the previous sample gives the burst
    // body rather than the thin hiss of pure white.
    let prev = 0;
    for (let i = 0; i < frames; i++) {
      const w = Math.random() * 2 - 1;
      prev = prev * 0.34 + w * 0.66;
      data[i] = prev;
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = q;
    filter.frequency.setValueAtTime(from, t);
    filter.frequency.exponentialRampToValueAtTime(Math.max(60, to), t + dur);

    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    src.connect(filter);
    filter.connect(g);
    g.connect(master);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  /** Player cannon. Deliberately short and dry so a held trigger is not fatiguing. */
  shoot(): void {
    this.blip(1750, 0.055, 'square', 0.026, 520);
    this.noise(0.05, 0.02, 5200, 1400);
  }

  /** A bolt landing on something that survived it. */
  ping(): void {
    this.blip(2300, 0.04, 'triangle', 0.018, 1500);
  }

  /** Small kill. */
  pop(size = 1): void {
    this.noise(0.26 * size, 0.13, 2600, 180, 1.1);
    this.blip(150, 0.2 * size, 'sawtooth', 0.05, 52);
  }

  /** Shield collapse: a big downward sweep with a metallic ring on top. */
  shieldBreak(): void {
    this.noise(0.75, 0.2, 6200, 140, 2.6);
    this.blip(880, 0.5, 'triangle', 0.09, 190);
    this.blip(1320, 0.36, 'sine', 0.05, 300);
  }

  /** Node destroyed. The biggest sound in the game. */
  nodeBreak(): void {
    this.noise(1.5, 0.3, 7200, 70, 3.2);
    this.blip(110, 1.1, 'sawtooth', 0.1, 34);
    const notes = [261.6, 392, 523.25, 784];
    notes.forEach((n, i) => window.setTimeout(() => this.blip(n, 0.5, 'triangle', 0.1), i * 110));
  }

  /** The player taking a hit. Dull, close, unpleasant. */
  hurt(): void {
    this.noise(0.4, 0.22, 900, 90, 0.8);
    this.blip(88, 0.3, 'square', 0.055, 44);
  }

  /** A wave cleared. */
  waveClear(): void {
    [659.25, 880].forEach((n, i) => window.setTimeout(() => this.blip(n, 0.16, 'triangle', 0.07), i * 80));
  }

  /** Warning chirp when hull integrity is low. */
  alarm(): void {
    this.blip(440, 0.1, 'square', 0.045, 330);
  }

  dispose(): void {
    for (const v of this.padVoices) {
      try {
        v.stop();
      } catch {
        /* already stopped */
      }
    }
    this.padVoices = [];
    void this.ctx?.close();
  }
}
