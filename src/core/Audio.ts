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
