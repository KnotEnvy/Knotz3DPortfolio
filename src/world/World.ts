import * as THREE from 'three';
import { Sector, SHARD_PICKUP_DISTANCE } from './Sector';
import { Starfield } from './Starfield';
import { Grid } from './Grid';
import { Corridor } from './Corridor';
import { sectors as sectorDefs, type SectorId } from '../data/sectors';
import type { GameState } from '../game/GameState';
import { bus } from '../core/Events';
import type { Ship, ShipBounds } from '../player/Ship';

export const WORLD_BOUNDS: ShipBounds = {
  x: 340,
  yMin: -78,
  yMax: 132,
  zMin: -1120,
  zMax: 140,
};

/**
 * Owns the scene graph: sectors, sky, grid, lighting and the waypoint guide.
 * Also runs the two pieces of gameplay logic — proximity activation and shard
 * pickup — because both need the same spatial query.
 */
export class World {
  readonly group = new THREE.Group();
  readonly sectors: Sector[] = [];

  private starfield: Starfield;
  private grid: Grid;
  private corridor: Corridor;
  private waypoint: THREE.Group;
  private waypointMats: THREE.MeshBasicMaterial[] = [];
  private waypointGeo: THREE.BufferGeometry;
  private activeSector: Sector | null = null;
  private tmp = new THREE.Vector3();
  private waypointColor = new THREE.Color();

  constructor(
    private state: GameState,
    starCount: number,
    pixelRatio: number,
  ) {
    for (const def of sectorDefs) {
      const s = new Sector(def, state.shardsIn(def.id));
      this.sectors.push(s);
      this.group.add(s.object);
    }

    this.starfield = new Starfield(starCount, pixelRatio);
    this.group.add(this.starfield.object);

    this.grid = new Grid();
    this.group.add(this.grid.object);

    this.corridor = new Corridor(new THREE.Vector3(0, 10, 120));
    this.group.add(this.corridor.object);

    // Lighting: a cool key, a warm rim, and enough ambient to read the hulls.
    const ambient = new THREE.AmbientLight(0x2b3d63, 1.5);
    const key = new THREE.DirectionalLight(0x9fe8ff, 1.5);
    key.position.set(60, 120, 40);
    const rim = new THREE.DirectionalLight(0xff5f9e, 0.9);
    rim.position.set(-80, -30, -120);
    this.group.add(ambient, key, rim);

    // Waypoint chevrons floating ahead of the ship, aimed at the next target.
    this.waypoint = new THREE.Group();
    this.waypointGeo = new THREE.ConeGeometry(0.62, 1.8, 3);
    for (let i = 0; i < 3; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0x4de1c1,
        transparent: true,
        opacity: 0.42 - i * 0.11,
        toneMapped: false,
        depthWrite: false,
      });
      this.waypointMats.push(mat);
      const cone = new THREE.Mesh(this.waypointGeo, mat);
      // Cones are authored along +Y; tip them onto the group's +Z, which is the
      // axis lookAt() aims at the target.
      cone.rotation.x = Math.PI / 2;
      cone.position.z = i * 3.2;
      this.waypoint.add(cone);
    }
    this.group.add(this.waypoint);
  }

  get current(): Sector | null {
    return this.activeSector;
  }

  sector(id: SectorId): Sector | undefined {
    return this.sectors.find((s) => s.def.id === id);
  }

  /** Next sector worth flying to: first unvisited, else first not decrypted. */
  nextTarget(): Sector | null {
    return (
      this.sectors.find((s) => !this.state.hasVisited(s.def.id)) ??
      this.sectors.find((s) => !s.decrypted) ??
      null
    );
  }

  update(elapsed: number, dt: number, ship: Ship, camera: THREE.PerspectiveCamera, pixelRatio: number): void {
    const p = ship.object.position;

    this.starfield.update(elapsed, pixelRatio);
    this.grid.update(elapsed, p);
    this.corridor.update(elapsed);

    let nearest: Sector | null = null;
    let nearestDist = Infinity;

    for (const s of this.sectors) {
      s.update(elapsed, dt, p, camera);

      const d = p.distanceTo(s.object.position);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = s;
      }

      // Shard pickup.
      for (const shard of s.shards) {
        if (shard.collected) continue;
        this.tmp.copy(shard.base).add(s.object.position);
        // Generous radius scaled by speed so fast passes still register.
        const reach = SHARD_PICKUP_DISTANCE + ship.speed * 0.07;
        if (this.tmp.distanceToSquared(p) < reach * reach) {
          shard.collected = true;
          shard.pop = 0;
          this.state.collectShard(s.def.id, shard.key);
          if (s.decrypted) s.flashDecrypted();
        }
      }
    }

    // Sector activation: enter when inside the radius, leave with hysteresis so
    // skimming the boundary cannot flicker the codex open and shut.
    const inside = nearest && nearestDist < nearest.def.radius ? nearest : null;
    if (inside && inside !== this.activeSector) {
      if (this.activeSector) bus.emit('sector:leave', { id: this.activeSector.def.id });
      this.activeSector = inside;
      inside.entered = true;
      this.state.visit(inside.def.id);
      bus.emit('sector:enter', { id: inside.def.id });
    } else if (!inside && this.activeSector) {
      const d = p.distanceTo(this.activeSector.object.position);
      if (d > this.activeSector.def.radius * 1.35) {
        bus.emit('sector:leave', { id: this.activeSector.def.id });
        this.activeSector = null;
      }
    }

    this.updateWaypoint(ship, elapsed, dt);
  }

  private updateWaypoint(ship: Ship, elapsed: number, _dt: number): void {
    const target = this.activeSector ? null : this.nextTarget();
    const show = !!target;
    this.waypoint.visible = show;
    if (!show || !target) return;

    // Sit the guide below the flight line so it never covers what you are
    // flying toward.
    ship.getForward(this.tmp);
    this.waypoint.position.copy(ship.object.position).addScaledVector(this.tmp, 26);
    this.waypoint.position.y -= 4;
    this.waypoint.lookAt(target.object.position);

    this.waypointColor.set(target.def.color);
    this.waypointMats.forEach((m, i) => {
      m.color.copy(this.waypointColor);
      m.opacity = (0.42 - i * 0.11) * (0.55 + 0.45 * Math.sin(elapsed * 3 - i * 0.8));
    });
  }

  /** What the HUD should point the visitor at next, if anything. */
  guidance(ship: Ship): { name: string; dist: number; angle: number; color: number } | null {
    if (this.activeSector) return null;
    const target = this.nextTarget();
    if (!target) return null;

    const fwd = ship.getForward(this.tmp);
    const heading = Math.atan2(fwd.x, -fwd.z);
    const dx = target.object.position.x - ship.object.position.x;
    const dz = target.object.position.z - ship.object.position.z;
    let angle = Math.atan2(dx, -dz) - heading;
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;

    return {
      name: target.def.name,
      dist: ship.object.position.distanceTo(target.object.position),
      angle,
      color: target.def.color,
    };
  }

  /** Distance and direction to a sector, for the HUD radar. */
  radarData(ship: Ship): { id: SectorId; angle: number; dist: number; color: number; done: boolean }[] {
    const out: { id: SectorId; angle: number; dist: number; color: number; done: boolean }[] = [];
    const fwd = ship.getForward(new THREE.Vector3());
    const heading = Math.atan2(fwd.x, -fwd.z);
    for (const s of this.sectors) {
      const dx = s.object.position.x - ship.object.position.x;
      const dz = s.object.position.z - ship.object.position.z;
      const bearing = Math.atan2(dx, -dz);
      let angle = bearing - heading;
      while (angle > Math.PI) angle -= Math.PI * 2;
      while (angle < -Math.PI) angle += Math.PI * 2;
      out.push({
        id: s.def.id,
        angle,
        dist: Math.hypot(dx, dz),
        color: s.def.color,
        done: s.decrypted,
      });
    }
    return out;
  }

  dispose(): void {
    for (const s of this.sectors) s.dispose();
    this.starfield.dispose();
    this.grid.dispose();
    this.corridor.dispose();
    this.waypointGeo.dispose();
    for (const m of this.waypointMats) m.dispose();
  }
}
