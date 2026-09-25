/**
 * The score. Adaptive, procedural, and still zero bytes of audio on the wire.
 *
 * The old soundtrack was one detuned drone that got louder in a fight. It never
 * changed key, never had a beat, and a visitor who stayed for six sectors heard
 * the same four sawtooths for four minutes. This replaces it with a small
 * sequencer and a band of synthesised players that the game conducts.
 *
 * How it hangs together:
 *
 *  - **Tracks.** Each sector has its own key, tempo and four-bar progression,
 *    and they climb: ORIGIN is 96 BPM and spacious, UPLINK is 124 and driving.
 *    The sectors run the same five beats six times by design; the music is what
 *    tells you the stakes went up.
 *  - **Moods.** The game never plays notes. It sets a mood — title, travel,
 *    combat, boss, dossier, paused, finale, silent — and each mood is just a mix
 *    of seven layers plus a filter cutoff. A wave spawning brings in the kick and
 *    the rolling bass; breaking into a node adds the lead; opening a dossier
 *    strips everything back to the pad under a closed filter so it can be read.
 *  - **Timing.** A lookahead scheduler (a timer that queues the next ~120 ms of
 *    notes on the audio clock) keeps the beat sample-accurate however badly the
 *    main thread is doing. Track changes land on the next downbeat; stingers land
 *    on the next sixteenth, so a node detonation is in time *and* in key.
 *  - **Mix.** A sidechain pump ducks the pad, arp and bass on every kick, which
 *    is most of what makes synthwave sound like synthwave. Pads, arps and the
 *    lead share one generated-impulse reverb and a tempo-synced delay.
 */

export type Mood = 'silent' | 'title' | 'travel' | 'combat' | 'boss' | 'dossier' | 'paused' | 'finale';

type Layer = 'pad' | 'arp' | 'bass' | 'kick' | 'snare' | 'hat' | 'lead';
const LAYERS: Layer[] = ['pad', 'arp', 'bass', 'kick', 'snare', 'hat', 'lead'];

type Quality = 'm' | 'M';
type ArpShape = 'up' | 'updown' | 'pulse' | 'cascade';

interface Track {
  name: string;
  /** MIDI note of the key root, around the second octave. */
  root: number;
  bpm: number;
  /** Chord roots per bar, in semitones above the key root. Four bars. */
  prog: number[];
  quality: Quality[];
  arp: ArpShape;
  /** Sixteenth-note hats in a fight rather than eighths. The later sectors. */
  busy: boolean;
  /**
   * The lead line: sixteen eighth-note slots over two bars, each an index into
   * the current chord's tones (4+ climbs an octave), or null for a rest.
   * Chord-relative rather than scale-relative on purpose — the melody can never
   * clash with the harmony underneath it, whatever the progression does.
   */
  lead: (number | null)[];
}

const _ = null;

const TRACKS: Track[] = [
  {
    name: 'Cold Open',
    root: 45, // A minor
    bpm: 96,
    prog: [0, 8, 3, 10],
    quality: ['m', 'M', 'M', 'M'],
    arp: 'up',
    busy: false,
    lead: [4, _, 3, _, 2, _, 1, 2, 4, _, 5, _, 4, 3, _, _],
  },
  {
    name: 'Payroll',
    root: 48, // C minor
    bpm: 104,
    prog: [0, 10, 8, 10],
    quality: ['m', 'M', 'M', 'M'],
    arp: 'updown',
    busy: false,
    lead: [2, _, 4, _, 5, 4, _, 2, 3, _, 2, _, 1, _, 0, _],
  },
  {
    name: 'The Forge',
    root: 50, // D minor
    bpm: 110,
    prog: [0, 8, 5, 7],
    quality: ['m', 'M', 'm', 'M'],
    arp: 'pulse',
    busy: false,
    lead: [0, 0, 4, _, 3, _, 2, _, 0, 0, 4, _, 5, 6, 4, _],
  },
  {
    name: 'Insert Coin',
    root: 52, // E minor
    bpm: 116,
    prog: [0, 3, 10, 8],
    quality: ['m', 'M', 'M', 'M'],
    arp: 'cascade',
    busy: true,
    lead: [4, 5, 6, 4, _, 2, 3, _, 4, 5, 6, 8, _, 6, 4, _],
  },
  {
    name: 'Track Record',
    root: 42, // F# minor
    bpm: 120,
    prog: [8, 10, 0, 7],
    quality: ['M', 'M', 'm', 'M'],
    arp: 'updown',
    busy: true,
    lead: [4, _, 4, 5, 6, _, 5, 4, 2, _, 3, 4, _, 2, 1, _],
  },
  {
    name: 'Uplink',
    root: 45, // A minor, home again, and at full tilt
    bpm: 124,
    prog: [5, 8, 10, 0],
    quality: ['m', 'M', 'M', 'm'],
    arp: 'up',
    busy: true,
    lead: [6, _, 5, 4, _, 4, 5, 6, 8, _, 6, _, 5, 4, 2, _],
  },
];

/** Plays over the finale: the same key as ORIGIN, resolved to major. */
const FINALE: Track = {
  name: 'Signal',
  root: 45,
  bpm: 100,
  prog: [8, 10, 3, 3],
  quality: ['M', 'M', 'M', 'M'],
  arp: 'updown',
  busy: false,
  lead: [4, _, 5, _, 6, _, 4, _, 8, _, 6, 5, 4, _, _, _],
};

interface MoodMix {
  layers: Record<Layer, number>;
  /** Low-pass cutoff on the whole music bus, Hz. */
  cutoff: number;
}

const mix = (pad: number, arp: number, bass: number, kick: number, snare: number, hat: number, lead: number) => ({
  pad,
  arp,
  bass,
  kick,
  snare,
  hat,
  lead,
});

const MOODS: Record<Mood, MoodMix> = {
  silent: { layers: mix(0, 0, 0, 0, 0, 0, 0), cutoff: 800 },
  title: { layers: mix(0.9, 0.45, 0, 0, 0, 0, 0), cutoff: 1500 },
  travel: { layers: mix(0.75, 0.75, 0.7, 0.55, 0, 0.5, 0), cutoff: 6000 },
  combat: { layers: mix(0.6, 0.7, 1, 1, 0.85, 0.85, 0), cutoff: 14000 },
  boss: { layers: mix(0.6, 0.75, 1, 1, 1, 1, 0.85), cutoff: 16000 },
  // Stripped back so it can be read over. The arp stays in, quietly, so the
  // world does not go dead while the visitor reads.
  dossier: { layers: mix(0.85, 0.3, 0, 0, 0, 0, 0), cutoff: 1100 },
  paused: { layers: mix(0.7, 0.3, 0.4, 0, 0, 0, 0), cutoff: 700 },
  finale: { layers: mix(0.9, 0.7, 0.6, 0.5, 0.4, 0.5, 0.75), cutoff: 9000 },
};

/** Intensity rank, so the score knows when a change is an escalation. */
const HEAT: Record<Mood, number> = { silent: 0, dossier: 1, paused: 1, title: 1, travel: 2, finale: 2, combat: 3, boss: 4 };

const LOOKAHEAD = 0.12;
const TICK_MS = 25;

const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

/** Fold a MIDI note into [lo, lo + 12). */
const fold = (n: number, lo: number) => {
  let m = n;
  while (m < lo) m += 12;
  while (m >= lo + 12) m -= 12;
  return m;
};

export class Music {
  private out: GainNode;
  private duckGain: GainNode;
  private filter: BiquadFilterNode;
  private pump: GainNode;
  private drums: GainNode;
  private layer = {} as Record<Layer, GainNode>;
  private reverbSend: GainNode;
  private delaySend: GainNode;
  private delay: DelayNode;

  private mood: Mood = 'silent';
  private want = {} as Record<Layer, number>;
  /** A layer fading out keeps being played until it is inaudible. */
  private tail = {} as Record<Layer, number>;
  private track: Track = TRACKS[0];
  private pending: Track | null = null;
  private trackIndex = 0;
  private finaleOn = false;
  private crashNext = false;

  /** Scheduled kick times, newest last, so visuals can pulse on the beat. */
  private kicks: number[] = [];

  private step = 0;
  private nextTime = 0;
  private timer = 0;
  private enabled = true;

  constructor(
    private ctx: AudioContext,
    output: AudioNode,
    private noise: AudioBuffer,
  ) {
    this.out = ctx.createGain();
    this.out.gain.value = 0.55;
    this.out.connect(output);

    this.duckGain = ctx.createGain();
    this.duckGain.connect(this.out);

    this.filter = ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = MOODS.silent.cutoff;
    this.filter.Q.value = 0.6;
    this.filter.connect(this.duckGain);

    // The sidechain pump. Only the kick ever automates this node, so it never
    // fights the mood fades for control of a gain parameter.
    this.pump = ctx.createGain();
    this.pump.connect(this.filter);
    this.drums = ctx.createGain();
    this.drums.connect(this.filter);

    for (const l of LAYERS) {
      const g = ctx.createGain();
      g.gain.value = 0;
      const pumped = l === 'pad' || l === 'arp' || l === 'bass' || l === 'lead';
      g.connect(pumped ? this.pump : this.drums);
      this.layer[l] = g;
      this.want[l] = 0;
      this.tail[l] = 0;
    }

    // Reverb: a convolver over a generated, exponentially decaying noise
    // impulse. Two seconds and a bit — enough to put the pads in a room the size
    // of the corridor without smearing the arp into mush.
    const verb = ctx.createConvolver();
    verb.buffer = impulse(ctx, 2.4, 2.6);
    this.reverbSend = ctx.createGain();
    this.reverbSend.gain.value = 0.32;
    this.reverbSend.connect(verb);
    verb.connect(this.pump);
    for (const l of ['pad', 'arp', 'lead', 'snare'] as const) this.layer[l].connect(this.reverbSend);

    // Dotted-eighth delay with a darkening feedback loop: each repeat is duller
    // than the last, so the echoes sit behind the dry line instead of on it.
    this.delay = ctx.createDelay(2);
    const fb = ctx.createGain();
    fb.gain.value = 0.36;
    const fbTone = ctx.createBiquadFilter();
    fbTone.type = 'lowpass';
    fbTone.frequency.value = 2600;
    this.delaySend = ctx.createGain();
    this.delaySend.gain.value = 0.28;
    this.delaySend.connect(this.delay);
    this.delay.connect(fbTone);
    fbTone.connect(fb);
    fb.connect(this.delay);
    fbTone.connect(this.pump);
    this.layer.arp.connect(this.delaySend);
    this.layer.lead.connect(this.delaySend);
    this.syncDelay();

    this.nextTime = ctx.currentTime + 0.08;
    this.timer = window.setInterval(() => this.schedule(), TICK_MS);
  }

  /* ------------------------------------------------------------ conducting */

  /** Idempotent: the game calls this every frame with whatever is true now. */
  setMood(mood: Mood): void {
    if (mood === this.mood) return;
    const rising = HEAT[mood] > HEAT[this.mood] && HEAT[mood] >= 3;
    this.mood = mood;
    const m = MOODS[mood];
    const t = this.ctx.currentTime;
    for (const l of LAYERS) {
      const target = m.layers[l];
      this.want[l] = target;
      if (target <= 0.001) this.tail[l] = t + 2.5;
      // Drums arrive quickly — a wave spawning is an event, and a kick that
      // takes two seconds to fade in reads as a mixing mistake. Everything
      // melodic swells in.
      const tc = l === 'kick' || l === 'snare' || l === 'hat' ? 0.12 : 0.7;
      this.layer[l].gain.cancelScheduledValues(t);
      this.layer[l].gain.setTargetAtTime(target, t, tc);
    }
    this.filter.frequency.cancelScheduledValues(t);
    this.filter.frequency.setTargetAtTime(m.cutoff, t, mood === 'dossier' || mood === 'paused' ? 0.35 : 0.9);
    if (rising) this.crashNext = true;

    const wantFinale = mood === 'finale';
    if (wantFinale !== this.finaleOn) {
      this.finaleOn = wantFinale;
      this.pending = wantFinale ? FINALE : TRACKS[this.trackIndex];
    }
  }

  /** Change track at the next downbeat. */
  setSector(index: number): void {
    const i = Math.max(0, Math.min(TRACKS.length - 1, index));
    if (i === this.trackIndex) return;
    this.trackIndex = i;
    if (!this.finaleOn) this.pending = TRACKS[i];
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    const t = this.ctx.currentTime;
    this.out.gain.cancelScheduledValues(t);
    this.out.gain.setTargetAtTime(on ? 0.55 : 0, t, 0.3);
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  /** Pull the score down under a big sound effect, then let it back up. */
  duck(depth: number, hold: number): void {
    const t = this.ctx.currentTime;
    const g = this.duckGain.gain;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(1 - depth, t + 0.03);
    g.setTargetAtTime(1, t + hold, 0.35);
  }

  /** Reset the clock after the context was suspended (a hidden tab). */
  resync(): void {
    this.nextTime = this.ctx.currentTime + 0.06;
  }

  get state(): { mood: Mood; track: string; bpm: number; bar: number } {
    return { mood: this.mood, track: this.track.name, bpm: this.track.bpm, bar: Math.floor(this.step / 16) };
  }

  get trackName(): string {
    return this.track.name;
  }

  /**
   * 0→1, peaking on each kick that has actually sounded and decaying over a
   * sixteenth or so. Kicks are scheduled ahead of time, so this reads the
   * audio clock rather than the scheduler — the floor flashes when you hear the
   * drum, not 120 ms before it.
   */
  pulse(): number {
    if (!this.enabled) return 0;
    const now = this.ctx.currentTime;
    let last = -1;
    for (const k of this.kicks) if (k <= now && k > last) last = k;
    if (last < 0) return 0;
    return Math.exp(-(now - last) * 9) * Math.min(1, this.layer.kick.gain.value);
  }

  /* ---------------------------------------------------------- harmony API */

  private chordAt(bar: number): number[] {
    const i = bar % 4;
    const r = this.track.prog[i];
    const q = this.track.quality[i];
    // Sevenths on the minor chords, added ninths on the major ones: the two
    // colours that make a synthwave progression sound expensive.
    return q === 'm' ? [r, r + 3, r + 7, r + 10] : [r, r + 4, r + 7, r + 14];
  }

  /** The current chord's tones as MIDI notes folded upward from `lo`, climbing. */
  private tones(lo: number, bar = Math.floor(this.step / 16)): number[] {
    const root = this.track.root;
    return this.chordAt(bar)
      .map((s) => fold(root + s, lo))
      .sort((a, b) => a - b);
  }

  private tone(index: number, lo: number, bar?: number): number {
    const t = this.tones(lo, bar);
    return t[index % t.length] + 12 * Math.floor(index / t.length);
  }

  /** A pitch from the chord that is sounding right now, for in-key effects. */
  chordFreq(index: number, lo = 72): number {
    return hz(this.tone(index, lo));
  }

  /** Time of the next sixteenth-note boundary, for quantised stingers. */
  private nextSixteenth(): number {
    const now = this.ctx.currentTime;
    const sd = 60 / this.track.bpm / 4;
    let t = this.nextTime;
    while (t - sd > now + 0.01) t -= sd;
    return Math.max(now + 0.005, t);
  }

  /**
   * A musical flourish on the beat: a bright chord-tone run up two octaves with
   * a crash on top. Used for a node detonation and for a rank-up; `big` doubles
   * the run and adds the low hit.
   */
  stinger(big: boolean): void {
    if (!this.enabled) return;
    const t0 = this.nextSixteenth();
    const sd = 60 / this.track.bpm / 4;
    const n = big ? 9 : 5;
    for (let i = 0; i < n; i++) {
      const t = t0 + i * sd * 0.5;
      this.bell(hz(this.tone(i + (big ? 0 : 2), 64)), t, big ? 0.13 : 0.09, sd * (i === n - 1 ? 6 : 2));
    }
    this.crash(t0, big ? 0.3 : 0.14);
    if (big) this.kickVoice(t0, 1.3);
  }

  /* ------------------------------------------------------------ scheduler */

  private active(l: Layer, t: number): boolean {
    return this.want[l] > 0.001 || t < this.tail[l];
  }

  private schedule(): void {
    const now = this.ctx.currentTime;
    if (this.ctx.state !== 'running') return;
    // A stalled main thread (or a debugger) left the clock behind. Skip ahead
    // rather than firing a burst of every note that was missed.
    if (this.nextTime < now - 0.2) this.nextTime = now + 0.05;
    while (this.nextTime < now + LOOKAHEAD) {
      this.play(this.step, this.nextTime);
      this.nextTime += 60 / this.track.bpm / 4;
      this.step++;
    }
  }

  private play(step: number, t: number): void {
    const s = step % 16;
    if (s === 0 && this.pending) {
      this.track = this.pending;
      this.pending = null;
      this.syncDelay();
      this.crashNext = this.crashNext || HEAT[this.mood] >= 2;
    }
    if (!this.enabled) return;

    const tr = this.track;
    const bar = Math.floor(step / 16);
    const sd = 60 / tr.bpm / 4;
    const fight = this.mood === 'combat' || this.mood === 'boss';
    const boss = this.mood === 'boss';

    if (s === 0) {
      if (this.crashNext) {
        this.crashNext = false;
        this.crash(t, 0.22);
      }
      if (this.active('pad', t)) this.padChord(bar, t, sd * 16);
    }

    // Kick: four on the floor in a fight, half-time while travelling.
    if (this.active('kick', t)) {
      const onFloor = fight ? s % 4 === 0 : s === 0 || s === 8;
      const push = boss && bar % 4 === 3 && s === 14;
      if (onFloor || push) this.kickVoice(t, 1);
    }

    if (this.active('snare', t)) {
      if (s === 4 || s === 12) this.snareVoice(t, 1);
      // A fill into every fourth bar during the boss.
      if (boss && bar % 4 === 3 && (s === 13 || s === 15)) this.snareVoice(t, 0.55);
    }

    if (this.active('hat', t)) {
      const sixteenths = fight && tr.busy;
      if (sixteenths) this.hatVoice(t, s % 2 === 0 ? 0.55 : 0.32, s % 4 === 2 && boss);
      else if (fight ? s % 2 === 0 : s % 4 === 2) this.hatVoice(t, s % 4 === 2 ? 0.7 : 0.45, s === 14);
    }

    if (this.active('bass', t)) {
      const root = fold(tr.root - 12 + tr.prog[bar % 4], 33);
      if (fight) {
        // Rolling bass: every sixteenth the kick does not own, octave-jumping on
        // the last one of each beat. The boss adds the fifth to the turnaround.
        if (s % 4 !== 0) {
          let n = s % 4 === 3 ? root + 12 : root;
          if (boss && s >= 13) n = root + 7;
          this.bassVoice(hz(n), t, sd * 0.9, 0.9);
        }
      } else if (s % 2 === 0) {
        this.bassVoice(hz(s % 8 === 6 ? root + 12 : root), t, sd * 1.7, 0.75);
      }
    }

    if (this.active('arp', t)) {
      const idx = arpIndex(tr.arp, s);
      const accent = s % 4 === 0 ? 1 : 0.7;
      this.arpVoice(hz(this.tone(idx, 60, bar)), t, sd * 0.85, accent);
    }

    if (this.active('lead', t) && s % 2 === 0) {
      const slot = ((bar % 2) * 8 + s / 2) | 0;
      const idx = tr.lead[slot];
      if (idx !== null && idx !== undefined) {
        // Hold through following rests, so phrases breathe instead of pecking.
        let len = 1;
        while (len < 4 && tr.lead[(slot + len) % 16] === null) len++;
        this.leadVoice(hz(this.tone(idx, 67, bar)), t, sd * 2 * len * 0.92);
      }
    }
  }

  private syncDelay(): void {
    const beat = 60 / this.track.bpm;
    this.delay.delayTime.setTargetAtTime(beat * 0.75, this.ctx.currentTime, 0.05);
  }

  /* --------------------------------------------------------------- voices */

  private env(g: AudioParam, t: number, peak: number, attack: number, hold: number, release: number): void {
    g.setValueAtTime(0.0001, t);
    g.linearRampToValueAtTime(peak, t + attack);
    g.setValueAtTime(peak, t + attack + hold);
    g.exponentialRampToValueAtTime(0.0001, t + attack + hold + release);
  }

  private padChord(bar: number, t: number, len: number): void {
    const ctx = this.ctx;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.Q.value = 0.8;
    // The filter opens across the bar, so each chord blooms rather than sits.
    f.frequency.setValueAtTime(900, t);
    f.frequency.linearRampToValueAtTime(2300, t + len * 0.7);
    f.connect(this.layer.pad);
    const end = t + len + 1.4;
    for (const n of this.tones(55, bar)) {
      for (const d of [-9, 9]) {
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = hz(n);
        o.detune.value = d;
        const g = ctx.createGain();
        this.env(g.gain, t, 0.034, len * 0.22, len * 0.6, 1.2);
        o.connect(g);
        g.connect(f);
        o.start(t);
        o.stop(end);
      }
    }
    // A sub an octave under the chord root gives the pad a floor even when the
    // bass is out.
    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.value = hz(fold(this.track.root + this.track.prog[bar % 4], 40));
    const sg = ctx.createGain();
    this.env(sg.gain, t, 0.07, len * 0.2, len * 0.6, 1);
    sub.connect(sg);
    sg.connect(this.layer.pad);
    sub.start(t);
    sub.stop(end);
  }

  private arpVoice(freq: number, t: number, len: number, vel: number): void {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = 'square';
    o.frequency.value = freq;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(3800, t);
    f.frequency.exponentialRampToValueAtTime(900, t + len);
    const g = ctx.createGain();
    this.env(g.gain, t, 0.05 * vel, 0.004, len * 0.3, len * 0.7);
    o.connect(f);
    f.connect(g);
    g.connect(this.layer.arp);
    o.start(t);
    o.stop(t + len + 0.05);
  }

  private bassVoice(freq: number, t: number, len: number, vel: number): void {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = freq;
    const o2 = ctx.createOscillator();
    o2.type = 'square';
    o2.frequency.value = freq / 2;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.Q.value = 5;
    f.frequency.setValueAtTime(1500, t);
    f.frequency.exponentialRampToValueAtTime(260, t + len);
    const g = ctx.createGain();
    this.env(g.gain, t, 0.17 * vel, 0.004, len * 0.5, len * 0.5);
    o.connect(f);
    o2.connect(f);
    f.connect(g);
    g.connect(this.layer.bass);
    o.start(t);
    o2.start(t);
    o.stop(t + len + 0.05);
    o2.stop(t + len + 0.05);
  }

  private leadVoice(freq: number, t: number, len: number): void {
    const ctx = this.ctx;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 3200;
    f.Q.value = 2;
    const g = ctx.createGain();
    this.env(g.gain, t, 0.07, 0.015, Math.max(0, len - 0.18), 0.22);
    f.connect(g);
    g.connect(this.layer.lead);
    // Delayed vibrato: a held note starts straight and starts to sing.
    const vib = ctx.createOscillator();
    vib.frequency.value = 5.6;
    const vibDepth = ctx.createGain();
    vibDepth.gain.setValueAtTime(0, t);
    vibDepth.gain.linearRampToValueAtTime(freq * 0.006, t + Math.min(0.5, len));
    vib.connect(vibDepth);
    for (const [type, det] of [
      ['sawtooth', -6],
      ['square', 7],
    ] as const) {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = freq;
      o.detune.value = det;
      vibDepth.connect(o.frequency);
      o.connect(f);
      o.start(t);
      o.stop(t + len + 0.3);
    }
    vib.start(t);
    vib.stop(t + len + 0.3);
  }

  private bell(freq: number, t: number, peak: number, len: number): void {
    const ctx = this.ctx;
    const g = ctx.createGain();
    this.env(g.gain, t, peak, 0.004, 0.02, len);
    g.connect(this.layer.lead.gain.value > 0.05 ? this.layer.lead : this.pump);
    g.connect(this.reverbSend);
    for (const [type, mult, lvl] of [
      ['triangle', 1, 1],
      ['sine', 2, 0.4],
      ['sine', 3.01, 0.15],
    ] as const) {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = freq * mult;
      const og = ctx.createGain();
      og.gain.value = lvl;
      o.connect(og);
      og.connect(g);
      o.start(t);
      o.stop(t + len + 0.1);
    }
  }

  private kickVoice(t: number, vel: number): void {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(44, t + 0.11);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.55 * vel, t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
    o.connect(g);
    g.connect(this.layer.kick);
    o.start(t);
    o.stop(t + 0.45);
    this.kicks.push(t);
    if (this.kicks.length > 8) this.kicks.shift();
    this.noiseHit(t, 0.012, 0.12 * vel, 'highpass', 3000, this.layer.kick);

    // Sidechain: everything melodic breathes around the kick.
    const p = this.pump.gain;
    p.cancelScheduledValues(t);
    p.setValueAtTime(1, t);
    p.linearRampToValueAtTime(0.42, t + 0.01);
    p.setTargetAtTime(1, t + 0.04, 0.085);
  }

  private snareVoice(t: number, vel: number): void {
    this.noiseHit(t, 0.2, 0.22 * vel, 'bandpass', 1900, this.layer.snare, 0.7);
    this.noiseHit(t, 0.09, 0.12 * vel, 'highpass', 6000, this.layer.snare);
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(230, t);
    o.frequency.exponentialRampToValueAtTime(150, t + 0.08);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.16 * vel, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    o.connect(g);
    g.connect(this.layer.snare);
    o.start(t);
    o.stop(t + 0.14);
  }

  private hatVoice(t: number, vel: number, open: boolean): void {
    this.noiseHit(t, open ? 0.16 : 0.035, 0.1 * vel, 'highpass', 7600, this.layer.hat);
  }

  private crash(t: number, vel: number): void {
    this.noiseHit(t, 1.6, vel, 'highpass', 4200, this.layer.hat.gain.value > 0.05 ? this.layer.hat : this.pump);
    this.noiseHit(t, 1.6, vel * 0.5, 'highpass', 4200, this.reverbSend);
  }

  private noiseHit(
    t: number,
    dur: number,
    peak: number,
    type: BiquadFilterType,
    freq: number,
    dest: AudioNode,
    q = 0.9,
  ): void {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(peak, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(dest);
    // A random window into one shared buffer: no per-hit allocation, and no two
    // hats are the same sample.
    src.start(t, Math.random() * (this.noise.duration - dur - 0.05), dur + 0.02);
  }

  dispose(): void {
    window.clearInterval(this.timer);
    this.out.disconnect();
  }
}

function arpIndex(shape: ArpShape, s: number): number {
  switch (shape) {
    case 'up':
      return s % 8;
    case 'updown':
      return [0, 1, 2, 3, 4, 3, 2, 1][s % 8];
    case 'pulse':
      return [0, 4, 1, 4, 2, 4, 3, 4][s % 8];
    case 'cascade':
      return [7, 6, 5, 4, 3, 2, 1, 0][s % 8];
  }
}

/** Stereo decaying-noise impulse response for the convolver. */
function impulse(ctx: BaseAudioContext, seconds: number, decay: number): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return buf;
}
