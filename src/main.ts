import './styles/index.css';
import * as THREE from 'three';

import { Engine } from './core/Engine';
import { Input } from './core/Input';
import { AudioEngine } from './core/Audio';
import { bus } from './core/Events';
import { clamp } from './core/Math';

import { GameState } from './game/GameState';
import { World } from './world/World';
import { Ship } from './player/Ship';
import { CameraRig } from './player/CameraRig';
import { Combat } from './game/Combat';
import { Pickups } from './game/Pickups';
import { Director } from './game/Mission';
import { Particles } from './fx/Particles';
import { Impacts } from './fx/Impacts';

import { Hud } from './ui/Hud';
import { Codex } from './ui/Codex';
import { Toasts } from './ui/Toast';
import { Terminal } from './ui/Terminal';
import { Boot } from './ui/Boot';
import { TopBar } from './ui/TopBar';
import { buildBrief } from './ui/Brief';
import { Complete } from './ui/Complete';
import { MissionCard } from './ui/MissionCard';
import { Overlay } from './ui/Overlay';
import { TouchControls } from './ui/TouchControls';
import { sectors, sectorById, type SectorId } from './data/sectors';

const FIXED_STEP = 1 / 60;
const MAX_STEPS = 5;

/**
 * Application shell: owns the loop, wires every subsystem to every other one,
 * and is the only place allowed to know about all of them at once.
 *
 * The loop is a fixed-step accumulator at 60 Hz with rendering decoupled from
 * simulation, so flight feel, weapon cadence and collision are identical on a
 * 60 Hz laptop and a 165 Hz monitor. Anything frame-rate dependent in a game
 * with projectiles is a bug waiting for a fast machine.
 */
class App {
  private engine: Engine;
  private state = new GameState();
  private audio = new AudioEngine();
  private input: Input;
  private world: World;
  private ship: Ship;
  private rig: CameraRig;
  private particles: Particles;
  private impacts: Impacts;
  private combat: Combat;
  private pickups: Pickups;
  private director: Director;

  private ui: HTMLElement;
  private hud: Hud;
  private codex: Codex;
  private toasts: Toasts;
  private terminal: Terminal;
  private boot: Boot;
  private topbar: TopBar;
  private complete: Complete;
  private card: MissionCard;
  private overlay: Overlay;
  private touch: TouchControls | null = null;

  private running = false;
  private paused = false;
  /** True when the pause was imposed by the tab going to the background. */
  private hiddenPause = false;
  private briefMode = false;
  private accumulator = 0;
  private elapsed = 0;
  private lastFrame = 0;
  private rafId = 0;
  private hintTimer = 0;
  private hintRetired = false;
  private hintMoved = false;
  private accent = new THREE.Color(0x4de1c1);
  /** Hull integrity at the moment the current node was armed, for 'Unshaken'. */
  private hullAtNode = 1;

  constructor() {
    const canvas = document.getElementById('stage') as HTMLCanvasElement;
    this.ui = document.getElementById('ui') as HTMLElement;

    this.engine = new Engine(canvas);
    this.input = new Input(canvas);

    this.particles = new Particles(this.engine.renderer.getPixelRatio(), this.engine.tier.particles);
    this.impacts = new Impacts();
    this.engine.scene.add(this.particles.object, this.impacts.object);

    this.world = new World(
      this.engine.scene,
      this.particles,
      this.impacts,
      this.engine.tier.starCount,
      this.engine.renderer.getPixelRatio(),
      this.engine.tier.detail,
    );
    this.engine.scene.add(this.world.group);

    this.ship = new Ship();
    this.engine.scene.add(this.ship.object, this.ship.trail.object);

    this.rig = new CameraRig(this.engine.camera);

    this.combat = new Combat(this.world.route, this.particles, this.impacts, {
      onKill: (_kind, at, xp) => {
        this.state.recordKill(xp);
        this.director.reportKill(at);
        this.audio.pop(1);
        this.rig.addShake(0.2);
        this.engine.punch(0.1);
      },
      onPlayerHit: () => {
        this.audio.hurt();
        this.rig.addShake(0.55, 2.6);
        this.engine.punch(0.22);
        bus.emit('player:hit', { integrity: this.ship.integrity });
      },
      onShoot: () => this.audio.shoot(),
      onEnemyHit: (_at, killed) => {
        if (!killed) this.audio.ping();
      },
    });
    this.engine.scene.add(this.combat.group);

    this.pickups = new Pickups(this.particles, this.impacts, (sector, key) => {
      this.state.collectShard(sector, key);
    });
    this.engine.scene.add(this.pickups.group);

    this.director = new Director(this.world.route, this.combat, this.pickups, this.world.sectors, this.state);

    // Park the ship for the title card so there is a live scene behind it.
    this.ship.reset(this.world.route, 40);
    this.rig.snap(this.ship);

    /* ------------------------------------------------------------- UI */
    this.toasts = new Toasts(this.ui);
    this.hud = new Hud(this.ui, this.state, this.input.coarse);
    this.card = new MissionCard(this.ui);
    this.codex = new Codex(this.ui, this.state, () => this.director.advance(this.ship));

    this.terminal = new Terminal(this.ui, this.state, {
      warp: (id) => this.warpTo(id),
      brief: (on) => this.setBrief(on),
      reset: () => this.resetProgress(),
      dossier: (id) => {
        // Close the terminal first: it sits above the dossier and keeps focus,
        // so the panel opened invisibly behind it.
        this.terminal.toggle(false);
        this.codex.open(id, false);
      },
    });

    this.topbar = new TopBar(
      this.ui,
      {
        toggleSound: () => this.toggleSound(),
        toggleBrief: () => this.setBrief(!this.briefMode),
        toggleTerminal: () => this.terminal.toggle(),
        toggleHelp: () => this.togglePause(),
      },
      this.state.data.muted,
    );

    this.overlay = new Overlay(this.ui, this.state, {
      resume: () => this.resumeFromPause(),
      jump: (id) => this.warpTo(id),
      brief: () => this.setBrief(true),
      reset: () => this.resetProgress(),
    });

    this.complete = new Complete(this.ui, this.state, () => {
      this.running = !this.briefMode;
      this.lastFrame = performance.now();
    });

    if (this.input.coarse) this.touch = new TouchControls(this.ui, this.input);

    this.hud.onJump((id) => this.warpTo(id));

    // In normal document flow, not inside the fixed #ui overlay — otherwise the
    // page cannot scroll and in-page anchors go nowhere.
    document.body.append(buildBrief({ launch: () => this.setBrief(false) }));

    this.boot = new Boot(this.ui, { launch: () => this.start(), brief: () => this.setBrief(true) }, this.state.data.seenIntro);

    this.wireEvents();
    this.warmUp();

    // Render one frame behind the boot screen so the world is already alive.
    this.lastFrame = performance.now();
    this.tick(this.lastFrame);

    // Reduced motion, or a phone: hand over the document instead.
    //
    // Reduced motion is checked on every visit, not only the first. Someone who
    // asked their operating system for less motion did not stop meaning it
    // because they have been here before, and this experience is camera shake,
    // screen punch and chromatic aberration from end to end.
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const smallTouch = this.input.coarse && Math.min(window.innerWidth, window.innerHeight) < 820;
    if (reduce || (smallTouch && !this.state.data.seenIntro)) this.setBrief(true);
    else this.boot.focus();
  }

  /* ------------------------------------------------------------------ */

  private wireEvents(): void {
    bus.on('achievement', ({ name, note }) => {
      this.toasts.push(name, note);
      this.audio.ui();
    });

    bus.on('shard:collect', () => {
      this.audio.shard(this.state.streak);
      this.rig.addShake(0.1);
    });

    bus.on('sector:enter', ({ id }) => {
      this.audio.enterSector();
      this.audio.setIntensity(0.55);
      const def = sectorById.get(id);
      if (def) document.documentElement.style.setProperty('--accent', `#${def.color.toString(16).padStart(6, '0')}`);
    });

    bus.on('assist:hint', ({ text }) => this.hud.setAssist(text));
    bus.on('assist:autofire', () => {
      this.toasts.push('Auto-fire engaged', 'Your guns will fire on their own from here', 'shard');
      this.hud.setAssist('Auto-fire engaged — steer with the mouse');
    });
    bus.on('assist:skip', ({ on }) => {
      this.hud.setSkipOffer(on, () => this.director.skipToDossier(this.ship));
      if (!on) this.hud.setAssist(null);
    });

    bus.on('wave:spawn', () => {
      this.audio.setIntensity(0.85);
      this.audio.alarm();
    });

    bus.on('node:armed', () => {
      this.audio.setIntensity(1);
      this.hullAtNode = this.ship.integrity;
      this.rig.addShake(0.3);
    });

    bus.on('sector:decrypted', ({ id }) => {
      this.audio.nodeBreak();
      this.rig.addShake(1.1, 1.2);
      this.engine.punch(0.55);
      this.state.recordNode(this.hullAtNode >= 0.999);
      // Let the detonation land before the panel takes the screen. Shortened
      // from 1.5s: the objective already reads "Dossier recovered — read it,
      // then continue", and pointing at a panel that does not exist yet is
      // worse than a slightly hurried transition.
      window.setTimeout(() => {
        if (!this.briefMode) this.codex.open(id, true);
      }, 850);
    });

    bus.on('codex:open', () => {
      this.audio.setIntensity(0.3);
      document.body.classList.add('codex-open');
    });
    bus.on('codex:close', () => {
      this.audio.setIntensity(0.6);
      document.body.classList.remove('codex-open');
    });

    bus.on('complete', () => {
      this.toasts.push('Signal complete', 'Every sector decrypted', 'trophy');
      window.setTimeout(() => {
        if (!this.briefMode) this.complete.show();
      }, 1200);
    });

    document.addEventListener('keydown', (e) => this.onKey(e));

    document.querySelector('.skip')?.addEventListener('click', () => this.setBrief(true));
    // A backgrounded tab should not keep flying and firing — but coming back
    // must resume. An earlier version only reset the clock on return and left
    // `paused` set, so anyone who checked a message mid-run came back to a live
    // HUD over a ship that would never move again.
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (this.running) this.hiddenPause = this.paused = true;
        return;
      }
      this.lastFrame = performance.now();
      // Only lift the pause we imposed. A panel the visitor opened themselves
      // stays open.
      if (this.hiddenPause && !this.overlay.isOpen) {
        this.hiddenPause = false;
        this.paused = false;
      }
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
      else if (this.overlay.isOpen) this.overlay.close();
      else if (this.codex.isOpen) this.codex.close();
      else this.togglePause();
      return;
    }
    const k = e.key.toLowerCase();
    if (k === 'h' || k === '?') this.togglePause();
    if (k === 'b') this.setBrief(!this.briefMode);
    if (k === 'm') this.topbar.syncSound(this.toggleSound());
  }

  /* ------------------------------------------------------------------ */

  private warmUp(): void {
    // Compile shaders and upload geometry before the visitor presses Launch, so
    // the first second of flight is not a stutter. The labels are honest: these
    // are the actual stages, they just happen faster than they read.
    const stages = [
      'Building the route',
      'Compiling shaders',
      'Uploading geometry',
      'Seeding the nebula',
      'Arming systems',
      'Ready',
    ];
    let step = 0;
    const advance = () => {
      this.boot.setProgress(step / (stages.length - 1), stages[step]);
      if (step === 1) this.engine.renderer.compile(this.engine.scene, this.engine.camera);
      step++;
      if (step < stages.length) requestAnimationFrame(advance);
    };
    requestAnimationFrame(advance);
  }

  private start(): void {
    this.audio.unlock();
    this.audio.setMuted(this.state.data.muted);
    this.state.markIntroSeen();
    this.boot.hide();

    this.director.start(this.ship);
    this.rig.snap(this.ship);
    this.rig.addShake(0.5);
    this.audio.boost();

    this.running = true;
    this.paused = false;
    this.hud.setVisible(true);
    this.touch?.setVisible(true);
    this.lastFrame = performance.now();

    this.hintTimer = window.setTimeout(() => this.hud.fadeHint(), 14000);
  }

  private toggleSound(): boolean {
    const next = !this.state.data.muted;
    this.state.setMuted(next);
    this.audio.unlock();
    this.audio.setMuted(next);
    return next;
  }

  /* --------------------------------------------------------- pause / panels */

  private togglePause(): void {
    if (this.briefMode) return;
    if (this.overlay.isOpen) this.overlay.close();
    else {
      this.pauseForPanel();
      this.overlay.open();
    }
  }

  /** Freeze the simulation but keep rendering, so the panel has a live backdrop. */
  private pauseForPanel(): void {
    this.paused = true;
  }

  private resumeFromPause(): void {
    this.paused = false;
    this.hiddenPause = false;
    this.lastFrame = performance.now();
  }

  private setBrief(on: boolean): boolean {
    this.briefMode = on;
    document.body.classList.toggle('brief-mode', on);
    document.documentElement.classList.toggle('brief-mode', on);
    this.state.setBrief(on);
    this.topbar.syncBrief(on);

    if (on) {
      // Reset the accent to the brand colour. It tracks the current sector while
      // flying, and a brief rendered in whatever hue the visitor happened to
      // stop in reads like a different site every time.
      document.documentElement.style.setProperty('--accent', '#4de1c1');
      this.boot.hide();
      this.running = false;
      this.terminal.toggle(false);
      this.overlay.close();
      this.card.hide();
      this.touch?.setVisible(false);
      window.scrollTo(0, 0);
    } else {
      window.scrollTo(0, 0);
      this.lastFrame = performance.now();
      this.audio.unlock();
      this.audio.setMuted(this.state.data.muted);
      // Coming out of the brief without ever having launched has to start the
      // run properly, or the visitor gets a HUD over a parked ship.
      if (!this.state.data.seenIntro || this.director.phase === 'idle') {
        this.state.markIntroSeen();
        this.boot.hide();
        this.director.start(this.ship);
        this.rig.snap(this.ship);
      }
      this.running = true;
      this.paused = false;
      this.hud.setVisible(true);
      this.touch?.setVisible(true);
    }
    bus.emit('mode:brief', { on });
    return on;
  }

  private warpTo(id: SectorId): void {
    const index = sectors.findIndex((s) => s.id === id);
    if (index < 0) return;
    if (this.briefMode) this.setBrief(false);
    if (!this.state.data.seenIntro) this.state.markIntroSeen();

    this.boot.hide();
    this.overlay.close();
    this.codex.close();
    this.director.jumpTo(index, this.ship);
    this.rig.snap(this.ship);
    this.rig.addShake(0.5);
    this.audio.boost();
    this.particles.clear();
    this.impacts.clear();
    // Otherwise shards released in the sector you just left home in on the ship
    // from a kilometre away.
    this.pickups.clear();
    this.hud.setAssist(null);
    this.hud.setSkipOffer(false);
    this.running = true;
    this.paused = false;
    this.hud.setVisible(true);
  }

  private resetProgress(): void {
    this.state.reset();
    this.director.reset(this.ship);
    this.particles.clear();
    this.impacts.clear();
    this.rig.snap(this.ship);
    this.codex.close();
  }

  /* ------------------------------------------------------------------ */

  private tick = (now: number): void => {
    this.rafId = requestAnimationFrame(this.tick);

    const raw = (now - this.lastFrame) / 1000;
    this.lastFrame = now;
    const dt = clamp(raw, 0, 0.25);

    if (this.briefMode) return;

    const simulating = this.running && !this.paused;

    if (simulating) {
      this.accumulator += dt;
      let steps = 0;
      // Controls are suppressed while a panel owns the screen, but the world
      // keeps moving so the backdrop never freezes.
      const controls = !this.terminal.isOpen && !this.codex.isOpen && !this.complete.isOpen;
      while (this.accumulator >= FIXED_STEP && steps < MAX_STEPS) {
        const input = this.input.sample(controls);
        this.ship.step(input, FIXED_STEP, this.elapsed, this.world.route);
        // The stall assist can take over the trigger for a visitor who never
        // worked out that they can shoot.
        const firing = (input.fire || this.director.autoFire) && !this.ship.hold;
        this.combat.shoot(this.ship, FIXED_STEP, firing);
        this.combat.update(FIXED_STEP, this.elapsed, this.ship);
        this.director.update(FIXED_STEP, this.ship);
        this.accumulator -= FIXED_STEP;
        this.elapsed += FIXED_STEP;
        steps++;
      }
      if (steps === MAX_STEPS) this.accumulator = 0;

      // Retire the control hints on evidence rather than on a clock. A player
      // who has fired a shot has read them; leaving them up adds a line of
      // text to a frame that already carries an objective, a boss bar, a hull
      // gauge and a shard count, at the exact moment a non-gamer is learning
      // to aim.
      if (!this.hintRetired && (this.combat.shotsFired > 0 || this.director.autoFire)) {
        this.hintRetired = true;
        window.clearTimeout(this.hintTimer);
        this.hud.fadeHint();
        this.touch?.retireHint();
      } else if (this.input.moved && !this.hintMoved) {
        this.hintMoved = true;
        window.clearTimeout(this.hintTimer);
        this.hintTimer = window.setTimeout(() => this.hud.fadeHint(), 9000);
      }
    } else {
      // Idle drift behind the boot screen and while paused: the scene breathes,
      // nothing simulates.
      this.elapsed += dt;
      if (!this.running) {
        this.ship.distance += 16 * dt;
        this.ship.step(
          { steer: Math.sin(this.elapsed * 0.3) * 0.35, pitch: 0, boost: 0, fire: false, brake: false },
          dt,
          this.elapsed,
          this.world.route,
        );
      }
    }

    this.world.setLabelled(this.director.targetIndex);
    this.rig.update(this.ship, dt, this.elapsed);
    this.ship.updateTrail(this.engine.camera);
    this.pickups.update(dt, this.elapsed, this.ship, this.engine.camera);
    this.particles.update(dt);
    this.impacts.update(dt, this.engine.camera);

    // The world stands back while there is something to shoot. Driven from live
    // hostile count rather than the director's phase, so it also covers the
    // stragglers that outlive a wave.
    const engaged = this.combat.aliveCount > 0;
    const accent = this.world.update(this.elapsed, dt, this.ship, this.engine.renderer.getPixelRatio(), engaged);
    this.accent.copy(accent);

    if (this.running) {
      this.hud.update(this.ship, this.director, this.elapsed);
      const r = this.input.reticle;
      this.hud.setReticle(r.x, r.y, r.active && !this.ship.hold && !this.paused);
    }

    this.engine.setPost(this.ship.boostAmount, this.ship.damageFlash * (1 - this.ship.integrity * 0.5), this.accent);
    this.engine.render(dt, this.elapsed);
  };

  /** Small handle for debugging in the console. */
  debug(): Record<string, unknown> {
    return {
      distance: +this.ship.distance.toFixed(1),
      routeLength: +this.world.route.length.toFixed(1),
      offset: [+this.ship.offset.x.toFixed(1), +this.ship.offset.y.toFixed(1)],
      speed: +this.ship.speed.toFixed(1),
      barrier: this.ship.barrier === Infinity ? 'none' : +this.ship.barrier.toFixed(1),
      integrity: +this.ship.integrity.toFixed(2),
      phase: this.director.phase,
      sector: this.director.currentSectorId,
      objective: this.director.objectiveTitle,
      hostiles: this.combat.aliveCount,
      shardsInFlight: this.pickups.activeCount,
      particles: this.particles.count,
      tier: this.engine.tier.name,
      collected: this.state.collected,
      achievements: this.state.achievements.slice(),
      nodes: this.world.sectors.map((s) => ({ id: s.def.id, state: s.state, hp: +s.hp.toFixed(1) })),
    };
  }

  /** Jump to a sector from the console. */
  goto(id: SectorId): void {
    this.warpTo(id);
  }

  /**
   * Open the current sector's dossier without fighting for it — the same path
   * the stall assist offers. Exposed for the smoke suite and for anyone who
   * would rather read than fly.
   */
  forceDossier(): void {
    this.director.skipToDossier(this.ship);
  }

  dispose(): void {
    cancelAnimationFrame(this.rafId);
    this.input.dispose();
    this.world.dispose();
    this.ship.dispose();
    this.combat.dispose();
    this.pickups.dispose();
    this.particles.dispose();
    this.impacts.dispose();
    this.audio.dispose();
    this.engine.dispose();
  }
}

function fallback(message: string): void {
  document.body.classList.add('brief-mode');
  document.documentElement.classList.add('brief-mode');
  const brief = buildBrief();
  const note = document.createElement('p');
  note.className = 'brief__notice';
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
