import './styles/index.css';
import * as THREE from 'three';

import { Engine } from './core/Engine';
import { Input } from './core/Input';
import { AudioEngine } from './core/Audio';
import { bus } from './core/Events';
import { clamp, damp } from './core/Math';
import type { Mood } from './core/Music';

import { GameState } from './game/GameState';
import { World } from './world/World';
import { Ship } from './player/Ship';
import { CameraRig } from './player/CameraRig';
import { Combat } from './game/Combat';
import { Pickups } from './game/Pickups';
import { Director } from './game/Mission';
import { Particles } from './fx/Particles';
import { Impacts } from './fx/Impacts';
import { SpeedLines } from './fx/SpeedLines';

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
  private speedLines = new SpeedLines();
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

  /**
   * Time dilation. 1 is real time; a kill drops it for a few hundredths of a
   * second, a node detonation for a quarter of one. The whole simulation and
   * every effect slow together — the camera does not, so its shake and its
   * FOV punch still land at full speed on top of a frozen frame, which is what
   * makes a hit-stop feel like impact rather than like lag.
   */
  private dilation = 1;
  private dilationHold = 0;
  /** Kills in quick succession. A hit on the ship breaks it. */
  private chain = 0;
  private lastKillAt = -10;
  private heartbeatIn = 0;
  private wasBoosting = false;
  private proj = new THREE.Vector3();

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
    // Speed lines live in camera space, so the camera has to be in the scene
    // graph for its children to render.
    this.engine.scene.add(this.engine.camera);
    this.engine.camera.add(this.speedLines.object);

    this.combat = new Combat(this.world.route, this.particles, this.impacts, {
      onKill: (_kind, at, xp) => {
        this.state.recordKill(xp);
        this.director.reportKill(at);
        this.chain = this.elapsed - this.lastKillAt < 2.4 ? this.chain + 1 : 1;
        this.lastKillAt = this.elapsed;
        this.hud.setChain(this.chain);
        if (this.chain >= 5) this.state.unlock('chain-5');
        this.popAt(at, `+${xp}`, 'xp');
        this.audio.pop(1, this.chain);
        this.rig.addShake(0.2);
        this.rig.kick(1.4);
        this.engine.punch(0.1);
        this.hitStop(0.12, 0.035);
      },
      onPlayerHit: () => {
        this.audio.hurt();
        this.rig.addShake(0.55, 2.6);
        this.rig.kick(-2.5);
        this.engine.punch(0.22);
        this.chain = 0;
        this.hud.setChain(0);
      },
      onShoot: () => {
        this.audio.shoot();
        this.ship.kickback();
      },
      onEnemyHit: (_at, killed) => {
        this.hud.hitMarker(killed);
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
      music: (on) => {
        if (on !== undefined) {
          this.state.setMusic(on);
          this.audio.setMusic(on);
          this.audio.unlock();
        }
        return { on: this.audio.musicOn, track: this.audio.trackName };
      },
      warp: (id) => this.warpTo(id),
      brief: (on) => this.setBrief(on),
      reset: () => this.resetProgress(),
      restart: () => this.restartRun(),
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
      restart: () => this.restartRun(),
    });

    this.complete = new Complete(this.ui, this.state, {
      close: () => {
        this.running = !this.briefMode;
        this.lastFrame = performance.now();
      },
      restart: () => this.restartRun(),
    });

    if (this.input.coarse) this.touch = new TouchControls(this.ui, this.input);

    this.hud.onJump((id) => this.warpTo(id));

    // In normal document flow, not inside the fixed #ui overlay — otherwise the
    // page cannot scroll and in-page anchors go nowhere.
    document.body.append(buildBrief({ launch: () => this.setBrief(false) }));

    this.boot = new Boot(this.ui, { launch: () => this.start(), brief: () => this.setBrief(true) }, this.state.data.seenIntro);

    this.audio.setMusic(this.state.data.music);
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
    bus.on('achievement', ({ id, name, note }) => {
      this.toasts.push(name, note);
      this.audio.ui();
      if (id === 'rank') this.audio.rankUp();
    });

    bus.on('shard:collect', ({ xp }) => {
      this.audio.shard(this.state.streak);
      this.rig.addShake(0.1);
      this.popAt(this.ship.object.position, `+${xp} XP`, 'shard');
    });

    bus.on('sector:enter', ({ id }) => {
      this.audio.enterSector();
      this.audio.setSector(sectors.findIndex((s) => s.id === id));
      // Drop out of warp: the frame stretches, the lens starts wide and
      // settles, speed lines rush past. Every sector arrival, including a jump.
      if (this.running) {
        this.engine.warp(1);
        this.rig.kick(14);
      }
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
      this.audio.alarm();
    });

    bus.on('wave:clear', () => this.audio.waveClear());

    bus.on('node:armed', () => {
      this.hullAtNode = this.ship.integrity;
      this.rig.addShake(0.3);
    });

    bus.on('node:breached', ({ id }) => {
      this.audio.shieldBreak();
      this.rig.addShake(0.6);
      this.rig.kick(6);
      this.hitStop(0.2, 0.09);
      const node = this.world.sector(id);
      if (node) this.engine.shockwave(node.position, 0.7, 0.8);
    });

    bus.on('sector:decrypted', ({ id, broken }) => {
      if (broken) {
        this.audio.nodeBreak();
        this.rig.addShake(1.1, 1.2);
        this.rig.kick(16);
        this.engine.punch(0.55);
        // The payoff frame: time nearly stops for a quarter of a second while the
        // blast front tears across the screen, then eases back to speed.
        this.hitStop(0.15, 0.24);
        const node = this.world.sector(id);
        if (node) {
          this.engine.shockwave(node.position, 1.3, 1.15);
          this.popAt(node.position, 'DECRYPTED', 'big');
        }
        this.chain = 0;
        this.hud.setChain(0);
        this.state.recordNode(this.hullAtNode >= 0.999);
      } else {
        // Flown back to a node that was already open. No detonation to land, no
        // XP to award a second time — just the chapter, handed straight back.
        this.audio.enterSector();
      }
      // Let the detonation land before the panel takes the screen. Shortened
      // from 1.5s: the objective already reads "Dossier recovered — read it,
      // then continue", and pointing at a panel that does not exist yet is
      // worse than a slightly hurried transition.
      window.setTimeout(() => {
        if (!this.briefMode) this.codex.open(id, true);
      }, broken ? 850 : 220);
    });

    bus.on('codex:open', () => {
      document.body.classList.add('codex-open');
    });
    bus.on('codex:close', () => {
      document.body.classList.remove('codex-open');
    });

    bus.on('complete', () => {
      this.toasts.push('Signal complete', 'Every sector decrypted', 'trophy');
      window.setTimeout(() => {
        if (!this.briefMode) this.complete.show();
      }, 1200);
    });

    // "Keep flying" off the finale used to end at the far end of the corridor
    // with the ship parked in the dark and no way on. Running out of road now
    // puts the card — and the ask on it — back on screen.
    bus.on('run:parked', () => {
      if (!this.briefMode) this.complete.show();
    });

    document.addEventListener('keydown', (e) => this.onKey(e));

    document.querySelector('.skip')?.addEventListener('click', () => this.setBrief(true));
    // Audio may only start from a gesture. Any first key or click on the page
    // counts, so the title card gets its music the moment the visitor touches
    // anything — not only once they commit to Launch.
    const firstGesture = () => {
      this.audio.unlock();
      this.audio.setMuted(this.state.data.muted);
      window.removeEventListener('pointerdown', firstGesture, true);
      window.removeEventListener('keydown', firstGesture, true);
    };
    window.addEventListener('pointerdown', firstGesture, true);
    window.addEventListener('keydown', firstGesture, true);

    // A backgrounded tab should not keep flying and firing — but coming back
    // must resume. An earlier version only reset the clock on return and left
    // `paused` set, so anyone who checked a message mid-run came back to a live
    // HUD over a ship that would never move again.
    document.addEventListener('visibilitychange', () => {
      this.audio.setHidden(document.hidden);
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
      if (step === 1) {
        // three's compile() walks visible objects only, and nearly everything
        // that matters in a fight — every pooled hostile, the node cores, the
        // speed lines — starts hidden. So this stage used to compile the scenery
        // and nothing else, and the first wave compiled its materials on the
        // spot: a hitch at the exact moment the first fight starts, long enough
        // on a slow GPU to drain the music scheduler and drop the score out.
        // Reveal everything for the compile, then put it back; nothing renders
        // in between.
        const hidden: THREE.Object3D[] = [];
        this.engine.scene.traverse((o) => {
          if (!o.visible) {
            hidden.push(o);
            o.visible = true;
          }
        });
        this.engine.renderer.compile(this.engine.scene, this.engine.camera);
        for (const o of hidden) o.visible = false;
      }
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
    this.engine.warp(1);
    this.rig.kick(14);

    this.running = true;
    this.paused = false;
    this.hud.setVisible(true);
    this.touch?.setVisible(true);
    this.lastFrame = performance.now();

    this.hintTimer = window.setTimeout(() => this.hud.fadeHint(), 14000);
  }

  /** Slow time to `scale` for `hold` seconds, then ease back. Never speeds up. */
  private hitStop(scale: number, hold: number): void {
    this.dilation = Math.min(this.dilation, scale);
    this.dilationHold = Math.max(this.dilationHold, hold);
  }

  /** A score popup at a world position. Dropped if it is behind the camera. */
  private popAt(at: THREE.Vector3, text: string, kind: 'xp' | 'shard' | 'big'): void {
    if (!this.running) return;
    const p = this.proj.copy(at).project(this.engine.camera);
    if (p.z > 1 || Math.abs(p.x) > 1.1 || Math.abs(p.y) > 1.1) return;
    this.hud.floater(p.x, p.y, text, kind);
  }

  /** What the score should be doing, from what is actually on screen. */
  private moodNow(): Mood {
    if (this.briefMode) return 'silent';
    if (this.director.phase === 'complete' || this.complete.isOpen) return 'finale';
    if (!this.running) return 'title';
    if (this.paused || this.overlay.isOpen || this.terminal.isOpen) return 'paused';
    if (this.codex.isOpen) return 'dossier';
    if (this.director.phase === 'node') return 'boss';
    if (this.combat.aliveCount > 0) return 'combat';
    return 'travel';
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
    return on;
  }

  /**
   * Put the run somewhere new and hand the controls back.
   *
   * Jumping to a sector, replaying the corridor and wiping progress differ only
   * in the one line that moves the director; everything around it — dismissing
   * whatever panel is on screen, clearing the effects left over from where the
   * ship used to be, unpausing — is identical, and was previously copied out by
   * hand for each of them with a different field forgotten every time.
   */
  private resumeAt(place: () => void): void {
    if (this.briefMode) this.setBrief(false);
    if (!this.state.data.seenIntro) this.state.markIntroSeen();

    this.boot.hide();
    this.complete.hide();
    this.overlay.close();
    this.codex.close();
    this.terminal.toggle(false);

    place();

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
    this.hud.setVisible(true);
    this.running = true;
    this.paused = false;
    this.lastFrame = performance.now();
  }

  private warpTo(id: SectorId): void {
    const index = sectors.findIndex((s) => s.id === id);
    if (index < 0) return;
    this.resumeAt(() => this.director.jumpTo(index, this.ship));
  }

  /** Fly the whole corridor again, keeping every shard, rank and award. */
  private restartRun(): void {
    this.resumeAt(() => this.director.replay(this.ship));
  }

  /** Wipe the save and fly it from scratch, nodes locked again. */
  private resetProgress(): void {
    this.state.reset();
    this.resumeAt(() => this.director.reset(this.ship));
  }

  /* ------------------------------------------------------------------ */

  private tick = (now: number): void => {
    this.rafId = requestAnimationFrame(this.tick);

    const raw = (now - this.lastFrame) / 1000;
    this.lastFrame = now;
    const dt = clamp(raw, 0, 0.25);

    if (this.briefMode) {
      this.audio.setMood('silent');
      return;
    }

    const simulating = this.running && !this.paused;

    // Ease out of a hit-stop in real time, whatever the simulation is doing.
    if (this.dilationHold > 0) this.dilationHold -= dt;
    else if (this.dilation < 1) this.dilation = this.dilation > 0.995 ? 1 : damp(this.dilation, 1, 7, dt);
    const simDt = dt * this.dilation;

    if (simulating) {
      this.accumulator += simDt;
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
    this.pickups.update(simDt, this.elapsed, this.ship, this.engine.camera);
    this.particles.update(simDt);
    this.impacts.update(simDt, this.engine.camera);

    // The world stands back while there is something to shoot. Driven from live
    // hostile count rather than the director's phase, so it also covers the
    // stragglers that outlive a wave.
    const engaged = this.combat.aliveCount > 0;
    const accent = this.world.update(
      this.elapsed,
      dt,
      this.ship,
      this.engine.renderer.getPixelRatio(),
      engaged,
      this.audio.pulse,
    );
    this.accent.copy(accent);
    this.ship.combat = this.world.combat;
    this.speedLines.update(simDt, this.ship.speed, this.ship.boostAmount, this.engine.warpLevel, this.accent);

    if (simulating) {
      // A whoosh on the rising edge of boost, not on every frame it is held.
      if (this.ship.boosting && !this.wasBoosting) this.audio.boost();
      this.wasBoosting = this.ship.boosting;

      // Low hull in a fight: a heartbeat that quickens as integrity falls.
      if (this.ship.integrity < 0.35 && engaged) {
        this.heartbeatIn -= dt;
        if (this.heartbeatIn <= 0) {
          this.audio.heartbeat();
          this.heartbeatIn = 0.55 + this.ship.integrity * 2;
        }
      } else this.heartbeatIn = 0;
    }

    if (this.running) {
      this.hud.update(this.ship, this.director, this.elapsed);
      const r = this.input.reticle;
      this.hud.setReticle(r.x, r.y, r.active && !this.ship.hold && !this.paused);
    }

    // Conducted after the simulation step, so a wave that spawned this frame is
    // already a fight as far as the score is concerned.
    this.audio.setMood(this.moodNow());

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
      music: this.audio.musicState,
      dilation: +this.dilation.toFixed(2),
      chain: this.chain,
      collected: this.state.collected,
      achievements: this.state.achievements.slice(),
      nodes: this.world.sectors.map((s) => ({ id: s.def.id, state: s.state, hp: +s.hp.toFixed(1) })),
    };
  }

  /** Jump to a sector from the console. */
  goto(id: SectorId): void {
    this.warpTo(id);
  }

  /** Fly the corridor again from ORIGIN, keeping progress. */
  restart(): void {
    this.restartRun();
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
    this.speedLines.dispose();
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
