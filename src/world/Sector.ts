import * as THREE from 'three';
import type { SectorDef } from '../data/sectors';
import { createLandmark, type Landmark } from './Landmark';
import { makeLabel } from './Label';
import { clamp, damp, mulberry32, smoothstep } from '../core/Math';

export interface ShardInstance {
  key: string;
  mesh: THREE.Mesh;
  base: THREE.Vector3;
  orbitRadius: number;
  orbitSpeed: number;
  orbitPhase: number;
  tilt: number;
  height: number;
  collected: boolean;
  /** Rises 0→1 while the pickup animation plays out. */
  pop: number;
  halo: THREE.Mesh;
  /** False until the first frame has placed it on its orbit. */
  settled: boolean;
}

const SHARD_RADIUS = 2.6;
export const SHARD_PICKUP_DISTANCE = 7.2;
const MAGNET_RANGE = 30;

/**
 * One chapter of the résumé as a place: a landmark, a label, an activation ring
 * and a ring of collectible data shards.
 */
export class Sector {
  readonly object = new THREE.Group();
  readonly shards: ShardInstance[] = [];
  readonly landmark: Landmark;
  private visual = new THREE.Group();

  /** 0 when far away, 1 when the player is inside the sector. */
  activation = 0;
  entered = false;

  private label: { sprite: THREE.Sprite; dispose: () => void };
  private ring: THREE.Mesh;
  private ringMat: THREE.MeshBasicMaterial;
  private shardGeo: THREE.BufferGeometry;
  private shardCoreGeo: THREE.BufferGeometry;
  private shardMats: THREE.MeshBasicMaterial[] = [];
  private shardCoreMat: THREE.MeshBasicMaterial;
  private shardHaloGeo!: THREE.BufferGeometry;
  private shardHaloMat!: THREE.MeshBasicMaterial;
  private decryptedFlash = 0;
  private localPlayer = new THREE.Vector3();
  private orbitPos = new THREE.Vector3();

  constructor(readonly def: SectorDef, collectedKeys: string[]) {
    this.object.position.set(...def.position);

    // Landmarks sit beside the flight line, not on it: the corridor runs
    // through the sector centre, so a centred landmark means flying straight
    // through the middle of it. Alternating sides also gives the route rhythm.
    const side = def.index % 2 === 0 ? -1 : 1;
    this.visual.position.set(side * 46, 4, 0);
    this.object.add(this.visual);

    this.landmark = createLandmark(def);
    this.visual.add(this.landmark.object);

    this.label = makeLabel(def.code, def.name, def.subtitle, def.color);
    this.label.sprite.position.set(0, 42, 0);
    this.visual.add(this.label.sprite);

    // Ground ring marking the activation radius.
    this.ringMat = new THREE.MeshBasicMaterial({
      color: def.color,
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide,
      toneMapped: false,
      depthWrite: false,
    });
    this.ring = new THREE.Mesh(new THREE.RingGeometry(def.radius - 1.2, def.radius, 128), this.ringMat);
    this.ring.rotation.x = Math.PI / 2;
    this.ring.position.y = -34;
    this.object.add(this.ring);

    this.shardGeo = new THREE.OctahedronGeometry(SHARD_RADIUS, 0);
    this.shardCoreGeo = new THREE.OctahedronGeometry(SHARD_RADIUS * 0.45, 0);
    this.shardCoreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.85,
      toneMapped: false,
    });
    this.shardHaloGeo = new THREE.RingGeometry(SHARD_RADIUS * 1.7, SHARD_RADIUS * 1.95, 32);
    this.shardHaloMat = new THREE.MeshBasicMaterial({
      color: def.color,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });

    const rnd = mulberry32(def.index * 9973 + 17);
    for (let i = 0; i < def.shards; i++) {
      const key = `${def.id}-${i}`;
      // Each shard owns its material so the pickup fade cannot bleed across the set.
      const mat = new THREE.MeshBasicMaterial({ color: def.color, toneMapped: false });
      this.shardMats.push(mat);
      const mesh = new THREE.Mesh(this.shardGeo, mat);
      mesh.add(new THREE.Mesh(this.shardCoreGeo, this.shardCoreMat));

      // A halo ring reads as "pick me up" from much further out than the
      // diamond alone, and separates shards from drifting debris. It hangs off
      // the sector group rather than the spinning diamond so it can billboard.
      const halo = new THREE.Mesh(this.shardHaloGeo, this.shardHaloMat);

      const shard: ShardInstance = {
        key,
        mesh,
        base: new THREE.Vector3(),
        orbitRadius: def.radius * (0.3 + rnd() * 0.28),
        orbitSpeed: 0.16 + rnd() * 0.2,
        orbitPhase: (i / def.shards) * Math.PI * 2 + rnd() * 0.6,
        tilt: (rnd() - 0.5) * 0.8,
        height: -12 + rnd() * 30,
        collected: collectedKeys.includes(key),
        pop: collectedKeys.includes(key) ? 1 : 0,
        halo,
        settled: false,
      };
      if (shard.collected) {
        mesh.visible = false;
        halo.visible = false;
      }
      this.shards.push(shard);
      this.object.add(mesh, halo);
    }
  }

  get remaining(): number {
    return this.shards.filter((s) => !s.collected).length;
  }

  get decrypted(): boolean {
    return this.remaining === 0;
  }

  worldPosition(): THREE.Vector3 {
    return this.object.position;
  }

  flashDecrypted(): void {
    this.decryptedFlash = 1;
  }

  update(elapsed: number, dt: number, playerPos: THREE.Vector3, camera: THREE.Camera): void {
    const dist = playerPos.distanceTo(this.object.position);
    const target = 1 - smoothstep(this.def.radius * 0.55, this.def.radius * 1.6, dist);
    this.activation += (target - this.activation) * Math.min(1, dt * 3);

    this.landmark.update(elapsed, dt, this.activation, this.decrypted);

    // Label fades in at mid-range and out again once you are on top of it.
    const near = smoothstep(this.def.radius * 4.2, this.def.radius * 1.9, dist);
    const tooClose = smoothstep(this.def.radius * 1.35, this.def.radius * 0.7, dist);
    (this.label.sprite.material as THREE.SpriteMaterial).opacity = clamp(near * (1 - tooClose), 0, 1);
    this.label.sprite.position.y = 40 + Math.sin(elapsed * 0.7) * 1.2;

    if (this.decryptedFlash > 0) this.decryptedFlash = Math.max(0, this.decryptedFlash - dt * 0.9);
    this.ringMat.opacity = 0.1 + this.activation * 0.18 + this.decryptedFlash * 0.5;
    this.ring.scale.setScalar(1 + this.decryptedFlash * 0.12);
    this.ring.rotation.z = elapsed * 0.05;

    for (const s of this.shards) {
      if (s.collected && s.pop >= 1) {
        s.mesh.visible = false;
        s.halo.visible = false;
        continue;
      }
      const a = elapsed * s.orbitSpeed + s.orbitPhase;
      this.orbitPos.set(
        Math.cos(a) * s.orbitRadius,
        s.height + Math.sin(elapsed * 0.9 + s.orbitPhase) * 2.4,
        Math.sin(a) * s.orbitRadius * Math.cos(s.tilt),
      );

      if (!s.settled) {
        s.base.copy(this.orbitPos);
        s.settled = true;
      }

      // Magnetism: once you are close, the shard comes to you. This turns
      // "thread the needle at 34 units a second" into "fly roughly there",
      // which is the right difficulty for a visitor who did not come here to
      // play a bullet-hell. The pull accumulates frame to frame, so a shard
      // visibly breaks orbit and chases the ship.
      this.localPlayer.copy(playerPos).sub(this.object.position);
      const gap = this.localPlayer.distanceTo(s.base);
      const homing = !s.collected && gap < MAGNET_RANGE;
      const chase = homing ? this.localPlayer : this.orbitPos;
      const lambda = homing ? 3 + (1 - gap / MAGNET_RANGE) * 7 : 9;
      s.base.x = damp(s.base.x, chase.x, lambda, dt);
      s.base.y = damp(s.base.y, chase.y, lambda, dt);
      s.base.z = damp(s.base.z, chase.z, lambda, dt);

      s.mesh.position.copy(s.base);
      s.mesh.rotation.y = elapsed * 1.5 + s.orbitPhase;
      s.mesh.rotation.x = elapsed * 0.9;

      if (s.collected) {
        // Pickup burst: scale up and fade out on the way to the HUD.
        s.pop = Math.min(1, s.pop + dt * 2.6);
        const k = s.pop;
        s.mesh.scale.setScalar(1 + k * 2.4);
        s.mesh.lookAt(camera.position);
        const mat = s.mesh.material as THREE.MeshBasicMaterial;
        mat.transparent = true;
        mat.opacity = 1 - k;
        if (k >= 1) s.mesh.visible = false;
      } else {
        s.mesh.scale.setScalar(1 + Math.sin(elapsed * 3 + s.orbitPhase) * 0.08);
      }

      // Halo always faces the camera and pulses out of phase with the diamond.
      s.halo.visible = !s.collected;
      if (!s.collected) {
        s.halo.position.copy(s.base);
        s.halo.quaternion.copy(camera.quaternion);
        s.halo.scale.setScalar(1 + Math.sin(elapsed * 2.2 + s.orbitPhase) * 0.14);
      }
    }
  }

  dispose(): void {
    this.label.dispose();
    this.ring.geometry.dispose();
    this.ringMat.dispose();
    this.shardGeo.dispose();
    this.shardCoreGeo.dispose();
    for (const m of this.shardMats) m.dispose();
    this.shardCoreMat.dispose();
    this.shardHaloGeo.dispose();
    this.shardHaloMat.dispose();
    this.landmark.dispose();
  }
}
