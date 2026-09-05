import * as THREE from 'three';
import { bus } from '../core/Events';
import { sectors, type SectorId } from '../data/sectors';
import { missions, type MissionDef } from '../data/missions';
import type { Route } from '../world/Route';
import type { Sector } from '../world/Sector';
import type { Combat } from '../game/Combat';
import type { Pickups } from '../game/Pickups';
import type { GameState } from '../game/GameState';
import type { Ship } from '../player/Ship';

/** How far short of a node the ship is held while the node is alive. */
const STANDOFF = 82;

export type Phase = 'idle' | 'travel' | 'engage' | 'node' | 'dossier' | 'complete';

/**
 * The mission director: the answer to "what am I supposed to be doing?"
 *
 * The first draft of this site failed on exactly one thing. It was a beautiful
 * empty room. A visitor launched, flew in a straight line, saw a shape, and had
 * no idea whether they were meant to fly at it, past it, or around it — and the
 * ones who did not work it out simply closed the tab, which for a portfolio is
 * the only failure that counts.
 *
 * So progress is now a script, and it is the same script six times: fly toward
 * the node, fight what comes, break the node, read what it was protecting,
 * continue. There is exactly one objective at any moment, the HUD always names
 * it, and finishing it always hands over a chapter of the résumé. The visitor is
 * never deciding what to do — only how well to do it.
 */
export class Director {
  phase: Phase = 'idle';
  /** Index of the sector currently being worked on. */
  targetIndex = 0;

  objectiveTitle = '';
  objectiveDetail = '';
  /** Hostiles left in the live wave, for the HUD. */
  hostiles = 0;

  private mission: MissionDef;
  private waveIndex = 0;
  private waveId = -1;
  private dropped = new Map<SectorId, number>();
  private nodeArmed = false;
  private dossierOpen = false;
  /** True once the finished run has coasted to the end of the corridor. */
  private parked = false;
  private tmp = new THREE.Vector3();

  /**
   * Stall detection.
   *
   * The failure this exists to prevent, found by watching someone launch and do
   * nothing: the ship flies itself to the first node, stops, and sits there
   * forever being shot at, because the visitor never worked out that they can
   * fire. That is precisely the non-gamer this site is aimed at, and the site's
   * answer was a beautiful screensaver with no way out. So progress is watched,
   * and if it stops the interface escalates — first a plain instruction, then
   * automatic fire, then an explicit offer to skip the fight entirely. Nobody
   * gets locked out of a résumé for being bad at a game they did not ask to play.
   */
  private stall = 0;
  private assistFire = false;
  private assistSkip = false;
  private lastDamage = 0;

  constructor(
    private route: Route,
    private combat: Combat,
    private pickups: Pickups,
    private sectorObjs: Sector[],
    private state: GameState,
  ) {
    this.mission = missions[0];
    for (const s of sectors) this.dropped.set(s.id, this.state.shardsIn(s.id).length);
  }

  /* ------------------------------------------------------------- helpers */

  private get sector(): Sector {
    return this.sectorObjs[this.targetIndex];
  }

  private get def() {
    return sectors[this.targetIndex];
  }

  /** Distance the ship is currently allowed to reach. */
  private barrierFor(index: number): number {
    if (index >= this.sectorObjs.length) return this.route.length;
    return Math.max(0, this.sectorObjs[index].distance - STANDOFF);
  }

  /** Total shards still owed to a sector. */
  private owed(id: SectorId): number {
    const def = sectors.find((s) => s.id === id)!;
    return Math.max(0, def.shards - (this.dropped.get(id) ?? 0));
  }

  /* --------------------------------------------------------------- setup */

  private resetStall(): void {
    this.stall = 0;
    this.assistSkip = false;
    bus.emit('assist:skip', { on: false });
  }

  /** Watch for a fight that is not progressing, and escalate help. */
  private updateAssist(dt: number): void {
    const engaged = this.phase === 'engage' || this.phase === 'node';
    if (!engaged) {
      if (this.stall !== 0) this.resetStall();
      return;
    }

    if (this.combat.damageDealt > this.lastDamage) {
      this.lastDamage = this.combat.damageDealt;
      if (this.stall > 0) this.resetStall();
      return;
    }

    this.stall += dt;

    if (this.stall > 6 && this.stall - dt <= 6) {
      bus.emit('assist:hint', {
        text: this.combat.shotsFired === 0 ? 'Hold click or press Space to fire' : 'Keep firing — line the target up ahead of you',
      });
    }
    // Nobody has fired a shot in fourteen seconds of being shot at. Take over
    // the trigger rather than letting them sit there.
    if (!this.assistFire && this.stall > 14 && this.combat.shotsFired === 0) {
      this.assistFire = true;
      bus.emit('assist:autofire', undefined);
    }
    // Still nothing. Offer the content directly.
    if (!this.assistSkip && this.stall > 26) {
      this.assistSkip = true;
      bus.emit('assist:skip', { on: true });
    }
  }

  /** True while the guns should fire without the player holding anything. */
  get autoFire(): boolean {
    return this.assistFire;
  }

  /**
   * Hand over the dossier without winning the fight. Wired to the "Open it
   * anyway" affordance the assist offers after a long stall.
   */
  skipToDossier(ship: Ship): void {
    if (this.phase === 'dossier' || this.phase === 'complete') return;
    const s = this.sector;
    // Measured before forceDecrypt, or a visitor who stalls on a sector they
    // already cleared is paid for breaking a node that was open when they
    // arrived — once per lap, for as many laps as they care to fly.
    const broken = !s.decrypted;
    if (broken) s.forceDecrypt();
    this.resetStall();
    this.openDossier(ship, broken);
  }

  /**
   * Put the run at the top of a sector.
   *
   * Every way into the script ends here — first launch, resume, the dossier's
   * Continue, a route-spine jump, a replay, a progress wipe — because every one
   * of them has to leave the same state behind: one live sector, no stale wave,
   * a barrier short of its node, and a title card on screen. There used to be
   * five hand-rolled copies of this and they had already drifted apart by a
   * field each.
   *
   * `from` is where to put the ship; omit it to carry on from where it is.
   */
  private beginSector(index: number, ship: Ship, from?: number): void {
    this.targetIndex = index;
    this.mission = missions[index];
    this.waveIndex = 0;
    this.waveId = -1;
    this.nodeArmed = false;
    this.dossierOpen = false;
    this.parked = false;
    this.combat.setNode(null);
    if (from !== undefined) ship.reset(this.route, from);
    ship.hold = false;
    ship.barrier = this.barrierFor(index);
    this.enterTravel();
  }

  start(ship: Ship): void {
    for (let i = 0; i < this.sectorObjs.length; i++) {
      const def = sectors[i];
      if (this.state.shardsIn(def.id).length >= def.shards) this.sectorObjs[i].markDecrypted();
      else this.sectorObjs[i].disarm();
    }

    // Resume just behind whichever node is still owed content, not at the very
    // start — nobody should have to re-earn a chapter they have already read.
    // A visitor who has cleared everything is the exception: there is no next
    // node to resume to, so they fly the whole corridor again from ORIGIN and
    // every sector hands its dossier straight back.
    let first = sectors.findIndex((s) => this.state.shardsIn(s.id).length < s.shards);
    if (first < 0) first = 0;
    this.beginSector(first, ship, first === 0 ? 0 : Math.max(0, this.sectorObjs[first - 1].distance + 40));
  }

  /**
   * Fly the corridor again from ORIGIN, keeping every shard, rank and award
   * already earned. Nodes that are already open stay open: a second run is for
   * re-reading, not for re-earning content the visitor has paid for once.
   */
  replay(ship: Ship): void {
    this.combat.clear();
    this.pickups.clear();
    this.beginSector(0, ship, 0);
  }

  /** Wipe the world back to a first-ever visit. Pairs with GameState.reset. */
  reset(ship: Ship): void {
    for (const s of this.sectorObjs) s.disarm();
    for (const s of sectors) this.dropped.set(s.id, 0);
    this.combat.clear();
    this.pickups.clear();
    this.beginSector(0, ship, 0);
  }

  /* --------------------------------------------------------------- phases */

  private enterTravel(): void {
    this.phase = 'travel';
    const def = this.def;
    this.objectiveTitle = `Reach ${def.name}`;
    this.objectiveDetail = this.sector.decrypted ? 'Already decrypted — flying back for another read' : this.mission.brief;
    this.state.visit(def.id);
    bus.emit('sector:enter', { id: def.id });
    bus.emit('mission:card', {
      code: def.code,
      name: def.name,
      subtitle: def.subtitle,
      brief: this.mission.brief,
      index: this.targetIndex,
      total: sectors.length,
      color: def.color,
    });
  }

  private spawnNextWave(): void {
    const wave = this.mission.waves[this.waveIndex];
    this.waveId = this.combat.spawnWave(wave.units);
    this.phase = 'engage';
    this.objectiveTitle = wave.label;
    const total = wave.units.reduce((n, u) => n + u.count, 0);
    this.hostiles = total;
    this.objectiveDetail = `${total} hostile${total === 1 ? '' : 's'} inbound`;
    bus.emit('wave:spawn', { index: this.waveIndex, count: total });
    this.waveIndex++;
  }

  private armNode(): void {
    const s = this.sector;
    s.arm(this.mission.nodeHp);
    this.combat.setNode({
      position: s.position,
      radius: s.radius,
      hit: (dmg, at) => s.hit(dmg, at),
    });
    this.nodeArmed = true;
    this.phase = 'node';
    this.objectiveTitle = `Break ${this.mission.nodeName}`;
    this.objectiveDetail = 'Collapse the shield, then kill the core';
    bus.emit('node:armed', { id: this.def.id, name: this.mission.nodeName });
  }

  /**
   * Stop the ship and hand over the chapter.
   *
   * `broken` separates the two ways of arriving here. Breaking a node earns the
   * detonation, the XP and the award; flying back to a node that is already open
   * earns none of those and must not fire them again — but it still stops, and
   * it still hands the dossier back. Rolling silently past a sector the visitor
   * came here to read is the one thing this site cannot do.
   */
  private openDossier(ship: Ship, broken: boolean): void {
    const def = this.def;
    this.dossierOpen = true;
    this.phase = 'dossier';
    ship.hold = true;
    this.combat.setNode(null);
    this.combat.standDown();

    // Everything the sector still owes arrives at once. Clearing a node is the
    // contract: it always yields the whole chapter, never a partial one.
    const remaining = this.owed(def.id);
    const already = this.dropped.get(def.id) ?? 0;
    for (let i = 0; i < remaining; i++) {
      this.tmp
        .copy(this.sector.position)
        .add(
          new THREE.Vector3(
            (Math.random() - 0.5) * 30,
            (Math.random() - 0.5) * 24,
            (Math.random() - 0.5) * 20,
          ),
        );
      this.pickups.spawn(this.tmp, def.id, `${def.id}-${already + i}`, def.color);
    }
    this.dropped.set(def.id, already + remaining);

    this.objectiveTitle = broken ? 'Dossier recovered' : `${def.name} archive`;
    this.objectiveDetail = broken
      ? 'Read it, then continue when you are ready'
      : 'Already decrypted — re-read it, then continue';
    bus.emit('sector:decrypted', { id: def.id, broken });
  }

  /** Called by the Continue button in the dossier. */
  advance(ship: Ship): void {
    if (this.phase !== 'dossier') return;
    this.dossierOpen = false;
    ship.hold = false;

    if (this.targetIndex >= sectors.length - 1) {
      this.finish(ship);
      return;
    }
    this.beginSector(this.targetIndex + 1, ship);
  }

  /** The last dossier is closed. Open the road and put the ask on screen. */
  private finish(ship: Ship): void {
    this.phase = 'complete';
    this.parked = false;
    this.objectiveTitle = 'Transmission complete';
    this.objectiveDetail = 'Every sector decrypted — fly it again or get in touch';
    ship.barrier = this.route.length;
    bus.emit('complete', undefined);
  }

  /**
   * Jump the run to a sector. Used by the route spine, the pause panel's sector
   * index and the terminal's `warp`. An already-cleared sector is re-entered
   * with its node still open, so this doubles as "let me re-read that chapter".
   */
  jumpTo(index: number, ship: Ship): void {
    const i = Math.max(0, Math.min(sectors.length - 1, index));
    this.combat.clear();
    // Drop in at the start of this sector's run-in so the approach, the title
    // card and the fight all still happen.
    this.beginSector(i, ship, Math.max(0, this.sectorObjs[i].distance - missions[i].lead - 60));
  }

  /** A kill happened. Drop a shard if the sector still owes more than the node will. */
  reportKill(at: THREE.Vector3): void {
    const def = this.def;
    const owed = this.owed(def.id);
    // Always reserve one for the node so breaking it is never a dry moment.
    if (owed <= 1) return;
    const already = this.dropped.get(def.id) ?? 0;
    this.pickups.spawn(at, def.id, `${def.id}-${already}`, def.color);
    this.dropped.set(def.id, already + 1);
  }

  /* --------------------------------------------------------------- update */

  update(dt: number, ship: Ship): void {
    if (this.phase === 'idle' || this.phase === 'dossier') return;
    this.updateAssist(dt);

    if (this.phase === 'complete') {
      // Free flight to the end of the route once everything is open.
      ship.barrier = this.route.length;
      // ...and the end of the route is a dead end. A visitor who chose "keep
      // flying" off the finale used to coast into the dark and stop there,
      // parked in front of nothing with the ask three clicks away behind a
      // pause menu. Reaching the end puts the payoff card back up instead.
      if (!this.parked && ship.distance >= this.route.length - 2) {
        this.parked = true;
        bus.emit('run:parked', undefined);
      }
      return;
    }

    const node = this.sector;
    const barrier = this.barrierFor(this.targetIndex);
    ship.barrier = barrier;

    // Wave triggers are placed as a fraction of the run-in, so a fast player
    // meets them sooner in wall-clock time but at the same place on the map.
    const runInStart = node.distance - this.mission.lead;
    const through = (ship.distance - runInStart) / this.mission.lead;

    if (this.phase === 'travel' || this.phase === 'engage') {
      if (this.waveIndex < this.mission.waves.length && through >= this.mission.waves[this.waveIndex].at) {
        this.spawnNextWave();
      }
    }

    if (this.phase === 'engage') {
      this.hostiles = this.waveId >= 0 ? this.combat.aliveInWave(this.waveId) : 0;
      if (this.hostiles === 0) {
        this.phase = 'travel';
        const def = this.def;
        this.objectiveTitle = `Reach ${def.name}`;
        this.objectiveDetail =
          this.waveIndex < this.mission.waves.length ? 'More resistance ahead' : `${this.mission.nodeName} is dead ahead`;
      } else {
        const w = this.mission.waves[Math.max(0, this.waveIndex - 1)];
        this.objectiveTitle = w.label;
        this.objectiveDetail = `${this.hostiles} hostile${this.hostiles === 1 ? '' : 's'} remaining`;
      }
    }

    // Arriving at the standoff point arms the node.
    if (!this.nodeArmed && !node.decrypted && ship.distance >= barrier - 2.5) {
      this.armNode();
    }

    if (this.phase === 'node') {
      if (node.decrypted) {
        this.openDossier(ship, true);
      } else {
        this.objectiveTitle = node.shielded ? `Collapse the ${this.mission.nodeName} shield` : 'Destroy the exposed core';
        // The node panel sits directly under this line and already carries the
        // shield/core bar and its phase label, so echoing the percentage here
        // only doubled the busiest frame in the product. This line keeps the one
        // thing the bar cannot say: the wave has not stopped shooting at you.
        const left = this.combat.aliveCount;
        this.objectiveDetail =
          left > 0
            ? `${left} hostile${left === 1 ? '' : 's'} still shooting`
            : node.shielded
              ? 'Keep firing — the shield is holding'
              : 'Core exposed — finish it';
      }
    }

    // Arriving at a node that is already open. This used to roll straight on to
    // the next sector without stopping, which meant a returning visitor — or
    // anyone replaying the run — flew the entire corridor end to end and was
    // shown not one word of the résumé it exists to deliver. Every sector now
    // ends the same way: the ship stops, and the dossier is handed back.
    if (node.decrypted && !this.dossierOpen && ship.distance >= barrier - 2.5) {
      this.openDossier(ship, false);
    }
  }

  /** 0→1 through the whole route, for the HUD progress spine. */
  progress(ship: Ship): number {
    return Math.max(0, Math.min(1, ship.distance / this.route.length));
  }

  /** The node the HUD should draw a boss bar for, if any. */
  get activeNode(): Sector | null {
    return this.phase === 'node' ? this.sector : null;
  }

  get currentSectorId(): SectorId {
    return this.def.id;
  }
}
