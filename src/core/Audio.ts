import { Music, type Mood } from './Music';

/**
 * Every sound on this site is synthesised at runtime — no audio files ship in
 * the bundle. Cheap to download, and it demonstrates the WebAudio graph work
 * that the arcade projects lean on.
 *
 * Two buses into one limiter: effects, and the adaptive score in Music.ts. The
 * limiter is there because a node detonation lands on top of a full combat mix,
 * and a browser clips harshly rather than gracefully.
 */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfx: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private music: Music | null = null;
  private meter: AnalyserNode | null = null;
  private meterBuf: Float32Array<ArrayBuffer> | null = null;
  private _muted = false;
  private _musicOn = true;
  private started = false;
  /** Remembered so the score comes up in the right place once audio unlocks. */
  private mood: Mood = 'silent';
  private sector = 0;

  get muted(): boolean {
    return this._muted;
  }

  /** Must be called from a user gesture; browsers will not start audio otherwise. */
  unlock(): void {
    if (this.started) {
      if (this.ctx?.state === 'suspended' && !document.hidden) void this.ctx.resume();
      return;
    }
    type WithWebkit = typeof window & { webkitAudioContext?: typeof AudioContext };
    const Ctor = window.AudioContext ?? (window as WithWebkit).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    this.ctx = ctx;

    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -10;
    limiter.knee.value = 6;
    limiter.ratio.value = 12;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.2;
    limiter.connect(ctx.destination);
    // A tap on the final mix. Costs nothing unless read, and it is how the
    // smoke suite knows the score is actually making sound: an audio graph with
    // a zeroed gain somewhere plays silence and throws no error.
    this.meter = ctx.createAnalyser();
    this.meter.fftSize = 2048;
    this.meterBuf = new Float32Array(this.meter.fftSize);
    limiter.connect(this.meter);

    this.master = ctx.createGain();
    this.master.gain.value = this._muted ? 0 : 0.7;
    this.master.connect(limiter);

    this.sfx = ctx.createGain();
    this.sfx.gain.value = 0.9;
    this.sfx.connect(this.master);

    // One three-second buffer of slightly correlated noise, shared by every
    // explosion, gunshot and hat. The first version built a fresh buffer per
    // sound — nine allocations a second with the trigger held.
    const frames = ctx.sampleRate * 3;
    this.noiseBuf = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = this.noiseBuf.getChannelData(0);
    let prev = 0;
    for (let i = 0; i < frames; i++) {
      prev = prev * 0.34 + (Math.random() * 2 - 1) * 0.66;
      data[i] = prev;
    }

    this.music = new Music(ctx, this.master, this.noiseBuf);
    this.music.setEnabled(this._musicOn);
    this.music.setSector(this.sector);
    this.music.setMood(this.mood);
    this.started = true;
  }

  setMuted(m: boolean): void {
    this._muted = m;
    if (this.master && this.ctx) {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.setTargetAtTime(m ? 0 : 0.7, this.ctx.currentTime, 0.15);
    }
  }

  /** Music on or off, independent of effects. */
  setMusic(on: boolean): void {
    this._musicOn = on;
    this.music?.setEnabled(on);
  }

  get musicOn(): boolean {
    return this._musicOn;
  }

  /** What the score should be doing. Cheap and idempotent; call every frame. */
  setMood(mood: Mood): void {
    this.mood = mood;
    this.music?.setMood(mood);
  }

  setSector(index: number): void {
    this.sector = index;
    this.music?.setSector(index);
  }

  /**
   * A hidden tab throttles timers to once a second, which would starve the
   * lookahead scheduler and play the score as a stutter. Suspending the context
   * stops the audio clock with it, so coming back picks up cleanly.
   */
  setHidden(hidden: boolean): void {
    if (!this.ctx) return;
    if (hidden) void this.ctx.suspend();
    else
      void this.ctx.resume().then(() => {
        this.music?.resync();
      });
  }

  get musicState(): Record<string, unknown> {
    return this.music
      ? { ...this.music.state, on: this._musicOn, level: this.level, ctx: this.ctx?.state }
      : { mood: this.mood, on: this._musicOn, started: false };
  }

  /** RMS of the last ~40 ms of the final mix, in dBFS. -Infinity is silence. */
  get level(): number {
    if (!this.meter || !this.meterBuf) return -Infinity;
    this.meter.getFloatTimeDomainData(this.meterBuf);
    let sum = 0;
    for (const v of this.meterBuf) sum += v * v;
    const rms = Math.sqrt(sum / this.meterBuf.length);
    return rms > 0 ? +(20 * Math.log10(rms)).toFixed(1) : -Infinity;
  }

  /** Kick-drum envelope, for anything that wants to move with the music. */
  get pulse(): number {
    return this.music?.pulse() ?? 0;
  }

  get trackName(): string {
    return this.music?.trackName ?? '—';
  }

  private blip(freq: number, dur: number, type: OscillatorType, gain: number, sweepTo?: number, delay = 0): void {
    const ctx = this.ctx;
    const out = this.sfx;
    if (!ctx || !out) return;
    const t = ctx.currentTime + delay;

    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (sweepTo !== undefined) osc.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc.connect(g);
    g.connect(out);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  shard(streak: number): void {
    // Climbs the chord the score is playing, so a collection run is a phrase in
    // the song rather than a separate tune on top of it.
    const f = this.music?.chordFreq(Math.min(streak, 9)) ?? 523.25 * Math.pow(2, Math.min(streak, 9) / 12);
    this.blip(f, 0.18, 'triangle', 0.16);
    this.blip(f * 2, 0.1, 'sine', 0.06);
  }

  /** Arriving in a new sector: a rising whoosh under a two-note call. */
  enterSector(): void {
    this.whoosh(0.9, 0.09, 300, 5200);
    this.blip(196, 0.5, 'sine', 0.1, 392);
    this.blip(294, 0.4, 'triangle', 0.06, 588);
  }

  ui(): void {
    this.blip(880, 0.05, 'square', 0.035);
    this.blip(1320, 0.07, 'square', 0.025, undefined, 0.05);
  }

  boost(): void {
    this.blip(120, 0.22, 'sawtooth', 0.05, 60);
    this.whoosh(0.55, 0.07, 400, 3800);
  }

  /** Band-passed noise swept upward. Boost, warps, arrivals. */
  private whoosh(dur: number, gain: number, from: number, to: number): void {
    const ctx = this.ctx;
    const out = this.sfx;
    if (!ctx || !out || !this.noiseBuf) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.Q.value = 1.6;
    f.frequency.setValueAtTime(from, t);
    f.frequency.exponentialRampToValueAtTime(to, t + dur * 0.8);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + dur * 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(out);
    src.start(t, Math.random() * 1.5, dur + 0.05);
  }

  /**
   * Filtered noise burst. Explosions are noise, not tones — a sawtooth sweep
   * reads as a laser no matter what you do to the envelope, so detonations get
   * a real noise buffer through a swept low-pass instead.
   */
  private noise(dur: number, gain: number, from: number, to: number, q = 1.4): void {
    const ctx = this.ctx;
    const out = this.sfx;
    if (!ctx || !out || !this.noiseBuf) return;
    const t = ctx.currentTime;

    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;

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
    g.connect(out);
    src.start(t, Math.random() * Math.max(0, this.noiseBuf.duration - dur - 0.05), dur + 0.02);
  }

  /** Player cannon. Deliberately short and dry so a held trigger is not fatiguing. */
  shoot(): void {
    // A few cents of random pitch per shot. Identical repeats are what make a
    // held trigger sound like a machine gun sample rather than a weapon.
    const j = 1 + (Math.random() - 0.5) * 0.08;
    this.blip(1750 * j, 0.055, 'square', 0.022, 520 * j);
    this.noise(0.05, 0.018, 5200, 1400);
  }

  /** A bolt landing on something that survived it. */
  ping(): void {
    this.blip(2300, 0.04, 'triangle', 0.018, 1500);
  }

  /** Small kill. `chain` raises the pitch of the tail, so a streak sings. */
  pop(size = 1, chain = 0): void {
    this.noise(0.26 * size, 0.13, 2600, 180, 1.1);
    this.blip(150, 0.2 * size, 'sawtooth', 0.05, 52);
    if (chain > 1) {
      const f = this.music?.chordFreq(Math.min(chain, 10), 76) ?? 660 * Math.pow(2, Math.min(chain, 10) / 12);
      this.blip(f, 0.12, 'triangle', 0.05, undefined, 0.02);
    }
  }

  /** Shield collapse: a big downward sweep with a metallic ring on top. */
  shieldBreak(): void {
    this.noise(0.75, 0.2, 6200, 140, 2.6);
    this.blip(880, 0.5, 'triangle', 0.09, 190);
    this.blip(1320, 0.36, 'sine', 0.05, 300);
    this.music?.duck(0.4, 0.25);
  }

  /** Node destroyed. The biggest sound in the game. */
  nodeBreak(): void {
    this.noise(1.5, 0.3, 7200, 70, 3.2);
    this.blip(110, 1.1, 'sawtooth', 0.1, 34);
    this.blip(55, 1.4, 'sine', 0.22, 30);
    // The score drops out under the blast and comes back with a flourish on
    // the next sixteenth, in whatever key this sector is playing in.
    this.music?.duck(0.75, 0.5);
    this.music?.stinger(true);
  }

  /** Reached a new rank. */
  rankUp(): void {
    this.music?.stinger(false);
  }

  /** The player taking a hit. Dull, close, unpleasant. */
  hurt(): void {
    this.noise(0.4, 0.22, 900, 90, 0.8);
    this.blip(88, 0.3, 'square', 0.055, 44);
    this.music?.duck(0.3, 0.12);
  }

  /** A wave cleared. */
  waveClear(): void {
    const a = this.music?.chordFreq(4) ?? 659.25;
    const b = this.music?.chordFreq(6) ?? 880;
    this.blip(a, 0.16, 'triangle', 0.07);
    this.blip(b, 0.22, 'triangle', 0.07, undefined, 0.08);
  }

  /** Warning chirp when a wave spawns. */
  alarm(): void {
    this.blip(440, 0.1, 'square', 0.04, 330);
    this.blip(440, 0.1, 'square', 0.03, 330, 0.14);
  }

  /** Low hull: a two-beat thump you feel more than hear. */
  heartbeat(): void {
    this.blip(62, 0.16, 'sine', 0.24, 40);
    this.blip(58, 0.2, 'sine', 0.18, 38, 0.2);
  }

  dispose(): void {
    this.music?.dispose();
    void this.ctx?.close();
  }
}
