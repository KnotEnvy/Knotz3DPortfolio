import * as THREE from 'three';
import { glowMaterial } from '../shaders/hull';
import type { SectorId } from '../data/sectors';
import type { Particles } from '../fx/Particles';
import type { Impacts } from '../fx/Impacts';
import type { Ship } from '../player/Ship';

const POOL = 24;
const COLLECT_RADIUS = 7;

interface Shard {
  active: boolean;
  sector: SectorId;
  key: string;
  age: number;
  mesh: THREE.Mesh;
  halo: THREE.Mesh;
  haloMat: THREE.MeshBasicMaterial;
  coreMat: THREE.MeshBasicMaterial;
  vel: THREE.Vector3;
  spin: number;
}

/**
 * Data shards: the collectible that *is* the résumé.
 *
 * A shard drops from every kill and from the node, and each one unlocks a slice
 * of the sector's dossier. Which is why they always home in and always arrive —
 * a shard is a paragraph about Jay's career, and gating that behind a precision
 * pickup test would mean a client loses content for being bad at a game they
 * did not ask to play. The magnetism is not generosity, it is the whole point:
 * you shoot, the information comes to you.
 */
export class Pickups {
  readonly group = new THREE.Group();

  private pool: Shard[] = [];
  private geo: THREE.BufferGeometry;
  private coreGeo: THREE.BufferGeometry;
  private haloGeo: THREE.BufferGeometry;
  private v = new THREE.Vector3();

  constructor(
    private particles: Particles,
    private impacts: Impacts,
    private onCollect: (sector: SectorId, key: string, at: THREE.Vector3) => void,
  ) {
    this.geo = new THREE.OctahedronGeometry(2.1, 0);
    this.coreGeo = new THREE.OctahedronGeometry(0.95, 0);
    this.haloGeo = new THREE.RingGeometry(3.1, 3.7, 28);

    for (let i = 0; i < POOL; i++) {
      const coreMat = glowMaterial(0xffffff, 0.95);
      const haloMat = glowMaterial(0x4de1c1, 0.6);
      const mesh = new THREE.Mesh(this.geo, coreMat);
      const inner = new THREE.Mesh(this.coreGeo, glowMaterial(0xffffff, 1));
      mesh.add(inner);
      const halo = new THREE.Mesh(this.haloGeo, haloMat);
      mesh.visible = false;
      halo.visible = false;
      this.group.add(mesh, halo);
      this.pool.push({
        active: false,
        sector: 'origin',
        key: '',
        age: 0,
        mesh,
        halo,
        haloMat,
        coreMat,
        vel: new THREE.Vector3(),
        spin: 0,
      });
    }
  }

  get activeCount(): number {
    return this.pool.reduce((n, s) => n + (s.active ? 1 : 0), 0);
  }

  spawn(at: THREE.Vector3, sector: SectorId, key: string, color: number, inherit?: THREE.Vector3): void {
    const s = this.pool.find((x) => !x.active) ?? this.pool[0];
    s.active = true;
    s.sector = sector;
    s.key = key;
    s.age = 0;
    s.spin = Math.random() * Math.PI * 2;
    s.mesh.visible = true;
    s.halo.visible = true;
    s.mesh.position.copy(at);
    s.mesh.scale.setScalar(0.01);
    s.coreMat.color.set(color);
    s.haloMat.color.set(color);

    // Kicked out of the explosion, then reeled in.
    s.vel
      .set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5)
      .normalize()
      .multiplyScalar(22 + Math.random() * 14);
    if (inherit) s.vel.addScaledVector(inherit, 0.25);

    this.impacts.flash(at, 5, color, 0.18);
  }

  update(dt: number, elapsed: number, ship: Ship, camera: THREE.Camera): void {
    for (const s of this.pool) {
      if (!s.active) continue;
      s.age += dt;

      // Pop into existence over the first fifth of a second.
      const grow = Math.min(1, s.age * 5);
      const pulse = 1 + Math.sin(elapsed * 4 + s.spin) * 0.09;
      s.mesh.scale.setScalar(grow * pulse);

      // Homing strength ramps with age, so the shard bursts outward first and
      // then commits. The lower bound guarantees arrival even at full boost.
      this.v.subVectors(ship.object.position, s.mesh.position);
      const gap = this.v.length();
      this.v.normalize();
      const pull = 60 + s.age * 190 + Math.max(0, 220 - gap);
      s.vel.addScaledVector(this.v, pull * dt);
      // Drag keeps it from slingshotting past the ship.
      s.vel.multiplyScalar(Math.exp(-2.4 * dt));
      s.mesh.position.addScaledVector(s.vel, dt);

      s.mesh.rotation.y = elapsed * 2.4 + s.spin;
      s.mesh.rotation.x = elapsed * 1.5;

      s.halo.position.copy(s.mesh.position);
      s.halo.quaternion.copy(camera.quaternion);
      s.halo.scale.setScalar(grow * (1 + Math.sin(elapsed * 3.1 + s.spin) * 0.16));
      s.haloMat.opacity = 0.32 + Math.sin(elapsed * 5 + s.spin) * 0.14;

      // Trailing sparkle so a shard in flight is legible against the nebula.
      if (Math.random() < dt * 26) {
        this.particles.burst(s.mesh.position, {
          count: 1,
          color: s.coreMat.color.getHex(),
          speed: 5,
          life: 0.5,
          size: 1.5,
          drag: 2,
        });
      }

      if (gap < COLLECT_RADIUS) {
        s.active = false;
        s.mesh.visible = false;
        s.halo.visible = false;
        this.particles.burst(s.mesh.position, {
          count: 18,
          color: 0xffffff,
          color2: s.coreMat.color.getHex(),
          speed: 30,
          life: 0.42,
          size: 2.2,
          drag: 4,
        });
        this.impacts.flash(s.mesh.position, 8, s.coreMat.color.getHex(), 0.2);
        this.onCollect(s.sector, s.key, s.mesh.position);
      }
    }
  }

  clear(): void {
    for (const s of this.pool) {
      s.active = false;
      s.mesh.visible = false;
      s.halo.visible = false;
    }
  }

  dispose(): void {
    this.geo.dispose();
    this.coreGeo.dispose();
    this.haloGeo.dispose();
    for (const s of this.pool) {
      s.coreMat.dispose();
      s.haloMat.dispose();
      for (const c of s.mesh.children) ((c as THREE.Mesh).material as THREE.Material).dispose();
    }
  }
}
