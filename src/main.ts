import './styles/index.css';
import * as THREE from 'three';

import { Engine } from './core/Engine';
import { Input } from './core/Input';
import { AudioEngine } from './core/Audio';
import { bus } from './core/Events';
import { clamp } from './core/Math';

import { GameState } from './game/GameState';
import { World, WORLD_BOUNDS } from './world/World';
import { Ship } from './player/Ship';
import { CameraRig } from './player/CameraRig';

import { Hud } from './ui/Hud';
import { Codex } from './ui/Codex';
import { Toasts } from './ui/Toast';
import { Terminal } from './ui/Terminal';
import { Boot } from './ui/Boot';
import { TopBar } from './ui/TopBar';
import { buildBrief } from './ui/Brief';
import { Complete } from './ui/Complete';
import { sectorById, type SectorId } from './data/sectors';

const FIXED_STEP = 1 / 60;
const MAX_STEPS = 5;

class App {
  private engine: Engine;
  private state = new GameState();
  private audio = new AudioEngine();
  private input: Input;
  private world: World;
  private ship: Ship;
  private rig: CameraRig;

  private ui: HTMLElement;
  private hud: Hud;
  private codex: Codex;
  private toasts: Toasts;
  private terminal: Terminal;
  private boot: Boot;
  private topbar: TopBar;
  private complete: Complete;

  private running = false;
  private briefMode = false;
  private accumulator = 0;
  private elapsed = 0;
  private lastFrame = 0;
  private rafId = 0;
  private hintTimer = 0;
  private hintRetired = false;

  constructor() {
    const canvas = document.getElementById('stage') as HTMLCanvasElement;
    this.ui = document.getElementById('ui') as HTMLElement;

    this.engine = new Engine(canvas);
    this.input = new Input(canvas);

    this.ship = new Ship(WORLD_BOUNDS);
    // Park the craft on a wide orbit around the first landmark so the title
    // card has a live scene behind it — and so pressing Launch hands over
    // control without a cut.
    this.ship.reset(new THREE.Vector3(104, 16, -70));
    this.engine.scene.add(this.ship.object);

    this.world = new World(this.state, this.engine.tier.starCount, this.engine.renderer.getPixelRatio());
    this.engine.scene.add(this.world.group);

    this.rig = new CameraRig(this.engine.camera);
    this.rig.snap(this.ship);

    // --- UI ---------------------------------------------------------------
    this.toasts = new Toasts(this.ui);
    this.hud = new Hud(this.ui, this.state);
    this.codex = new Codex(this.ui, this.state);
    this.terminal = new Terminal(this.ui, this.state, {
      warp: (id) => this.warpTo(id),
      brief: (on) => this.setBrief(on),
      reset: () => this.resetProgress(),
    });

    this.topbar = new TopBar(
      this.ui,
      {
        toggleSound: () => this.toggleSound(),
        toggleBrief: () => this.setBrief(!this.briefMode),
        toggleTerminal: () => this.terminal.toggle(),
      },
      this.state.data.muted,
    );

    this.complete = new Complete(this.ui, this.state, () => {
      this.running = !this.briefMode;
      this.lastFrame = performance.now();
    });

    // In normal document flow, not inside the fixed #ui overlay — otherwise the
    // page cannot scroll and in-page anchors go nowhere.
    document.body.append(buildBrief());

    this.boot = new Boot(
      this.ui,
      { launch: () => this.start(), brief: () => this.setBrief(true) },
      this.state.data.seenIntro,
    );

    this.wireEvents();
    this.warmUp();

    // Render one frame behind the boot screen so the world is already alive.
    this.lastFrame = performance.now();
    this.tick(this.lastFrame);

    // Visitors who asked for reduced motion get the document by default.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches && !this.state.data.seenIntro) {
      this.setBrief(true);
    }
    this.boot.focus();
  }

  /* ------------------------------------------------------------------ */

  private wireEvents(): void {
    bus.on('achievement', ({ name, note }) => {
      this.toasts.push(name, note);
      this.audio.ui();
    });

    bus.on('shard:collect', () => {
      this.audio.shard(this.state.streak);
      this.rig.addShake(0.14);
    });

    bus.on('sector:enter', ({ id }) => {
      this.audio.enterSector();
      this.audio.setIntensity(0.6);
      const def = sectorById.get(id);
      if (def) document.documentElement.style.setProperty('--accent', `#${def.color.toString(16).padStart(6, '0')}`);
    });

    bus.on('sector:leave', () => {
      this.audio.setIntensity(0.25);
      // Back to cruise once you have drifted clear; the dossier stays readable.
      this.ship.cruiseScale = 1;
    });

    // Ease off the throttle while there is something on screen to read, and
    // pick it back up the moment the dossier is dismissed.
    bus.on('codex:open', () => {
      this.ship.cruiseScale = 0.42;
    });
    bus.on('codex:close', () => {
      this.ship.cruiseScale = 1;
    });

    bus.on('sector:decrypted', ({ id }) => {
      this.audio.decrypt();
      this.rig.addShake(0.4);
      const def = sectorById.get(id);
      if (def) this.toasts.push(`${def.name} decrypted`, 'Classified block unlocked in the dossier', 'unlock');
    });

    bus.on('complete', () => {
      this.toasts.push('Signal complete', 'Every shard recovered', 'trophy');
      // Let the final decrypt animation land before taking over the screen.
      window.setTimeout(() => {
        if (!this.briefMode) this.complete.show();
      }, 1600);
    });

    document.addEventListener('keydown', (e) => this.onKey(e));

    // The skip link targets the brief, which only exists as a rendered page in
    // brief mode — so following it has to switch modes first.
    document.querySelector('.skip')?.addEventListener('click', () => this.setBrief(true));
    document.addEventListener('visibilitychange', () => {
      // Reset the clock so a backgrounded tab does not resume with a huge dt.
      if (!document.hidden) this.lastFrame = performance.now();
    });
  }

  private onKey(e: KeyboardEvent): void {
    const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;

    if (e.key === '`' || e.key === '~') {
      e.preventDefault();
      this.terminal.toggle();
      return;
    }
    if (typing) {
      if (e.key === 'Escape') this.terminal.toggle(false);
      return;
    }
    if (e.key === 'Escape') {
      if (this.complete.isOpen) this.complete.hide();
      else if (this.terminal.isOpen) this.terminal.toggle(false);
      else if (this.codex.isOpen) this.codex.close();
      return;
    }
    if (e.key.toLowerCase() === 'b') this.setBrief(!this.briefMode);
    if (e.key.toLowerCase() === 'm') this.topbar.syncSound(this.toggleSound());
  }

  /* ------------------------------------------------------------------ */

  private warmUp(): void {
    // Compile shaders and upload geometry before the visitor presses Launch so
    // the first second of flight is not a stutter.
    let step = 0;
    const total = 6;
    const advance = () => {
      step++;
      this.boot.setProgress(step / total);
      if (step === 2) this.engine.renderer.compile(this.engine.scene, this.engine.camera);
      if (step < total) requestAnimationFrame(advance);
    };
    requestAnimationFrame(advance);
  }

  private start(): void {
    this.audio.unlock();
    this.audio.setMuted(this.state.data.muted);
    this.state.markIntroSeen();
    this.boot.hide();

    // The title card runs a cinematic orbit that ends pointing anywhere. Launch
    // puts the visitor on a clean approach to the first sector, so pressing the
    // button and then doing nothing still arrives somewhere interesting.
    const first = this.world.sectors[0].object.position;
    this.ship.reset(new THREE.Vector3(first.x, first.y + 8, first.z + 210), 0);
    this.rig.snap(this.ship);
    this.rig.addShake(0.55);
    this.audio.boost();

    this.running = true;
    this.hud.setVisible(true);
    this.lastFrame = performance.now();

    this.hintTimer = window.setTimeout(() => this.hud.fadeHint(), 11000);
    if (!this.state.data.seenIntro) this.toasts.push('Flight systems online', 'Fly toward the glowing landmarks');
  }

  private toggleSound(): boolean {
    const next = !this.state.data.muted;
    this.state.setMuted(next);
    this.audio.unlock();
    this.audio.setMuted(next);
    return next;
  }

  private setBrief(on: boolean): boolean {
    this.briefMode = on;
    document.body.classList.toggle('brief-mode', on);
    document.documentElement.classList.toggle('brief-mode', on);
    this.state.setBrief(on);
    this.topbar.syncBrief(on);

    if (on) {
      this.boot.hide();
      this.running = false;
      this.terminal.toggle(false);
      window.scrollTo(0, 0);
    } else {
      window.scrollTo(0, 0);
      this.lastFrame = performance.now();
      this.running = true;
      this.hud.setVisible(true);
      this.audio.unlock();
      this.audio.setMuted(this.state.data.muted);
    }
    bus.emit('mode:brief', { on });
    return on;
  }

  private warpTo(id: SectorId): void {
    const sector = this.world.sector(id);
    if (!sector) return;
    if (this.briefMode) this.setBrief(false);

    // Drop in on the approach vector so the landmark is framed, not clipped.
    const p = sector.object.position;
    this.ship.reset(new THREE.Vector3(p.x, p.y + 10, p.z + sector.def.radius * 2.4), 0);
    this.rig.snap(this.ship);
    this.rig.addShake(0.5);
    this.audio.boost();
  }

  private resetProgress(): void {
    this.state.reset();
    for (const s of this.world.sectors) {
      for (const shard of s.shards) {
        shard.collected = false;
        shard.pop = 0;
        shard.mesh.visible = true;
        shard.halo.visible = true;
        (shard.mesh.material as THREE.MeshBasicMaterial).opacity = 1;
        shard.mesh.scale.setScalar(1);
      }
    }
    this.codex.close();
  }

  /* ------------------------------------------------------------------ */

  private tick = (now: number): void => {
    this.rafId = requestAnimationFrame(this.tick);

    const raw = (now - this.lastFrame) / 1000;
    this.lastFrame = now;
    const dt = clamp(raw, 0, 0.25);

    if (this.briefMode) return;

    if (this.running) {
      this.accumulator += dt;
      let steps = 0;
      const controls = !this.terminal.isOpen;
      while (this.accumulator >= FIXED_STEP && steps < MAX_STEPS) {
        const input = this.input.sample(controls);
        this.ship.step(input, FIXED_STEP, this.elapsed);
        this.accumulator -= FIXED_STEP;
        this.elapsed += FIXED_STEP;
        steps++;
      }
      if (steps === MAX_STEPS) this.accumulator = 0;
      // Once the visitor is actually flying, retire the tutorial line sooner.
      if (this.input.moved && !this.hintRetired) {
        this.hintRetired = true;
        window.clearTimeout(this.hintTimer);
        this.hintTimer = window.setTimeout(() => this.hud.fadeHint(), 5000);
      }
    } else {
      // Idle orbit behind the boot screen: gentle drift, no player control.
      this.elapsed += dt;
      this.ship.step({ steer: -0.33, pitch: 0, boost: 0, throttle: 0, brake: false }, dt, this.elapsed);
    }

    this.rig.update(this.ship, dt, this.elapsed);
    this.world.update(this.elapsed, dt, this.ship, this.engine.camera, this.engine.renderer.getPixelRatio());
    if (this.running) this.hud.update(this.world, this.ship);

    this.engine.render(dt, this.elapsed);
  };

  /** Small handle for debugging in the console: positions, state, warping. */
  debug(): Record<string, unknown> {
    const s = this.world.sectors.map((sec) => ({
      id: sec.def.id,
      dist: +this.ship.object.position.distanceTo(sec.object.position).toFixed(1),
      remaining: sec.remaining,
      nearestShard: Math.min(
        ...sec.shards
          .filter((x) => !x.collected)
          .map((x) => +this.ship.object.position.distanceTo(x.base.clone().add(sec.object.position)).toFixed(1)),
      ),
    }));
    return {
      ship: this.ship.object.position.toArray().map((n) => +n.toFixed(1)),
      yaw: +this.ship.yaw.toFixed(2),
      speed: +this.ship.speed.toFixed(1),
      running: this.running,
      collected: this.state.collected,
      sectors: s,
    };
  }

  dispose(): void {
    cancelAnimationFrame(this.rafId);
    this.input.dispose();
    this.world.dispose();
    this.ship.dispose();
    this.audio.dispose();
    this.engine.dispose();
  }
}

function fallback(message: string): void {
  document.body.classList.add('brief-mode');
  document.documentElement.classList.add('brief-mode');
  const brief = buildBrief();
  const note = document.createElement('p');
  note.className = 'brief__foot';
  note.textContent = message;
  brief.querySelector('.brief__wrap')?.prepend(note);
  document.body.append(brief);
}

/** WebGL is not guaranteed. If it is missing, the brief still is. */
function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

declare global {
  interface Window {
    SIGNAL?: App;
  }
}

if (hasWebGL()) {
  try {
    window.SIGNAL = new App();
  } catch (err) {
    console.error('SIGNAL failed to start', err);
    fallback('The interactive experience could not start on this device — here is the written brief.');
  }
} else {
  fallback('This browser does not support WebGL — here is the written brief.');
}
