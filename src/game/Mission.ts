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
  private tmp = new THREE.Vector3();

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

  /**
   * Begin, or resume. A returning visitor who already cleared the first three
   * sectors is dropped in at the fourth with the first three standing open —
   * nobody should have to re-earn content they have already read.
   */
  start(ship: Ship): void {
    let first = sectors.findIndex((s) => this.state.shardsIn(s.id).length < s.shards);
    if (first < 0) first = sectors.length - 1;

    for (let i = 0; i < this.sectorObjs.length; i++) {
      const def = sectors[i];
      if (this.state.shardsIn(def.id).length >= def.shards) this.sectorObjs[i].markDecrypted();
      else this.sectorObjs[i].disarm();
    }

    this.targetIndex = first;
    this.mission = missions[first];
    this.waveIndex = 0;
    this.waveId = -1;
    this.nodeArmed = false;
    this.dossierOpen = false;

    // Resume just behind whichever node is next, not at the very start.
    const from = first === 0 ? 0 : Math.max(0, this.sectorObjs[first - 1].distance + 40);
    ship.reset(this.route, from);
    ship.barrier = this.barrierFor(first);
    this.combat.setNode(null);
    this.enterTravel();
  }

  reset(ship: Ship): void {
    for (const s of this.sectorObjs) s.disarm();
    for (const s of sectors) this.dropped.set(s.id, 0);
    this.combat.clear();
    this.pickups.clear();
    this.targetIndex = 0;
    this.mission = missions[0];
    this.waveIndex = 0;
    this.waveId = -1;
    this.nodeArmed = false;
    this.dossierOpen = false;
    ship.reset(this.route, 0);
    ship.barrier = this.barrierFor(0);
    this.combat.setNode(null);
    this.enterTravel();
  }

  /* --------------------------------------------------------------- phases */

  private enterTravel(): void {
    this.phase = 'travel';
    const def = this.def;
    this.objectiveTitle = `Reach ${def.name}`;
    this.objectiveDetail = this.mission.brief;
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

  private openDossier(ship: Ship): void {
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

    this.objectiveTitle = 'Dossier recovered';
    this.objectiveDetail = 'Read it, then continue when you are ready';
    bus.emit('sector:decrypted', { id: def.id });
  }

  /** Called by the Continue button in the dossier. */
  advance(ship: Ship): void {
    if (this.phase !== 'dossier') return;
    this.dossierOpen = false;
    ship.hold = false;

    if (this.targetIndex >= sectors.length - 1) {
      this.phase = 'complete';
      this.objectiveTitle = 'Transmission complete';
      this.objectiveDetail = 'Every sector decrypted';
      ship.barrier = this.route.length;
      bus.emit('complete', undefined);
      return;
    }

    this.targetIndex++;
    this.mission = missions[this.targetIndex];
    this.waveIndex = 0;
    this.waveId = -1;
    this.nodeArmed = false;
    ship.barrier = this.barrierFor(this.targetIndex);
    this.enterTravel();
  }

  /**
   * Jump the run to a sector. Used by the route spine, the pause panel's sector
   * index and the terminal's `warp`. An already-cleared sector is re-entered
   * with its node still open, so this doubles as "let me re-read that chapter".
   */
  jumpTo(index: number, ship: Ship): void {
    const i = Math.max(0, Math.min(sectors.length - 1, index));
    this.targetIndex = i;
    this.mission = missions[i];
    this.waveIndex = 0;
    this.waveId = -1;
    this.nodeArmed = false;
    this.dossierOpen = false;
    this.combat.clear();
    this.combat.setNode(null);

    // Drop in at the start of this sector's run-in so the approach, the title
    // card and the fight all still happen.
    const start = Math.max(0, this.sectorObjs[i].distance - this.mission.lead - 60);
    ship.reset(this.route, start);
    ship.hold = false;
    ship.barrier = this.barrierFor(i);
    this.enterTravel();
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

  update(_dt: number, ship: Ship): void {
    if (this.phase === 'idle' || this.phase === 'dossier') return;

    if (this.phase === 'complete') {
      // Free flight to the end of the route once everything is open.
      ship.barrier = this.route.length;
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
        this.openDossier(ship);
      } else {
        this.objectiveTitle = node.shielded ? `Collapse the ${this.mission.nodeName} shield` : 'Destroy the exposed core';
        this.objectiveDetail = node.shielded
          ? `Shield ${Math.round(node.shieldPct * 100)}%`
          : `Core ${Math.round(node.corePct * 100)}%`;
      }
    }

    // A returning visitor flying past an already-open node just keeps going.
    if (node.decrypted && !this.dossierOpen && ship.distance >= barrier - 2.5) {
      this.skipOpenSector(ship);
    }
  }

  private skipOpenSector(ship: Ship): void {
    if (this.targetIndex >= sectors.length - 1) {
      this.phase = 'complete';
      this.objectiveTitle = 'Transmission complete';
      this.objectiveDetail = 'Every sector decrypted';
      ship.barrier = this.route.length;
      return;
    }
    this.targetIndex++;
    this.mission = missions[this.targetIndex];
    this.waveIndex = 0;
    this.waveId = -1;
    this.nodeArmed = false;
    ship.barrier = this.barrierFor(this.targetIndex);
    this.enterTravel();
  }

  /** 0→1 through the whole route, for the HUD progress spine. */
  progress(ship: Ship): number {
    return Math.max(0, Math.min(1, ship.distance / this.route.length));
  }

  /** The node the HUD should draw a boss bar for, if any. */
  get activeNode(): Sector | null {
    return this.phase === 'node' ? this.sector : null;
  }

  get isReading(): boolean {
    return this.dossierOpen;
  }

  get currentSectorId(): SectorId {
    return this.def.id;
  }
}
