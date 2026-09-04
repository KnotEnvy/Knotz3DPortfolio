import * as THREE from 'three';
import { Route, makePose, type Pose } from '../world/Route';
import { buildEnemy, type EnemyVisual } from '../world/Enemy';
import { enemyProfiles, type EnemyKind } from '../data/missions';
import type { Particles } from '../fx/Particles';
import type { Impacts } from '../fx/Impacts';
import type { Ship } from '../player/Ship';
import { clamp, damp } from '../core/Math';

const POOL: Record<EnemyKind, number> = { drone: 14, weaver: 12, lancer: 8, sentry: 8 };

const MAX_BOLTS = 110;
const MAX_PLASMA = 70;

const BOLT_SPEED = 430;
const BOLT_LIFE = 1.05;
const FIRE_INTERVAL = 0.11;

const PLASMA_SPEED = 82;
const PLASMA_LIFE = 4.2;

/** Survivors give up after this long so a wave can never soft-lock progress. */
const WAVE_TIMEOUT = 26;

export interface NodeTarget {
  position: THREE.Vector3;
  radius: number;
  /** Returns true if the shot did damage (false while shielded and invulnerable). */
  hit(damage: number, at: THREE.Vector3): boolean;
}

export interface CombatHooks {
  onKill(kind: EnemyKind, at: THREE.Vector3, xp: number): void;
  onPlayerHit(at: THREE.Vector3): void;
  onShoot(muzzle: THREE.Vector3): void;
  onEnemyHit(at: THREE.Vector3, killed: boolean): void;
}

interface Enemy {
  kind: EnemyKind;
  visual: EnemyVisual;
  alive: boolean;
  hp: number;
  lead: number;
  targetLead: number;
  offX: number;
  offY: number;
  baseX: number;
  baseY: number;
  ampX: number;
  ampY: number;
  freq: number;
  phase: number;
  age: number;
  fireTimer: number;
  flash: number;
  wave: number;
  spinRate: number;
}

interface Bolt {
  pos: THREE.Vector3;
  prev: THREE.Vector3;
  vel: THREE.Vector3;
  life: number;
}

/**
 * Combat: player guns, hostile AI, enemy fire and every collision in the game.
 *
 * Two deliberate design constraints run through all of it.
 *
 * First, **nothing here allocates during play.** Enemies, bolts and plasma are
 * fixed pools built at construction; the update loop only ever flips flags and
 * writes into typed arrays and instance matrices.
 *
 * Second, **the player cannot lose.** Getting hit costs hull integrity, shakes
 * the camera and reddens the frame, and integrity knits back up on its own. A
 * client who came to read a résumé must never hit a game-over screen, and a
 * visitor who is bad at games must never be locked out of a chapter. The
 * pressure is real, the punishment is cosmetic.
 *
 * Everything lives in *rail space*: an enemy is a distance ahead of the ship
 * plus an offset across the tube. That keeps hostiles inside the corridor, in
 * front of the camera, and lets an encounter be authored as "four drones at 120
 * metres" without any spatial guesswork.
 */
export class Combat {
  readonly group = new THREE.Group();

  private pools: Record<EnemyKind, Enemy[]>;
  private bolts: Bolt[] = [];
  private plasma: Bolt[] = [];

  private boltMesh: THREE.InstancedMesh;
  private plasmaMesh: THREE.InstancedMesh;
  private boltGeo: THREE.BufferGeometry;
  private plasmaGeo: THREE.BufferGeometry;
  private boltMat: THREE.MeshBasicMaterial;
  private plasmaMat: THREE.MeshBasicMaterial;

  private node: NodeTarget | null = null;
  private waveSeq = 0;
  private waveAge = new Map<number, number>();

  private fireTimer = 0;
  private muzzleFlip = 0;
  /** Lifetime shots. Zero after an engagement has run a while means the visitor
   *  has not worked out that they can shoot, and the assist should step in. */
  shotsFired = 0;
  /** Damage the player has dealt since this was last reset, for stall detection. */
  damageDealt = 0;

  private pose: Pose = makePose();
  private m = new THREE.Matrix4();
  private q = new THREE.Quaternion();
  private scale = new THREE.Vector3();
  private v = new THREE.Vector3();
  private w = new THREE.Vector3();
  private seg = new THREE.Vector3();
  private toC = new THREE.Vector3();
  private muzzlePos = new THREE.Vector3();
  private fwd = new THREE.Vector3();
  private hidden = new THREE.Vector3(0, 0, 0);
  private axisZ = new THREE.Vector3(0, 0, 1);
  private killPos = new THREE.Vector3();

  constructor(
    private route: Route,
    private particles: Particles,
    private impacts: Impacts,
    private hooks: CombatHooks,
  ) {
    this.pools = { drone: [], weaver: [], lancer: [], sentry: [] };
    for (const kind of Object.keys(POOL) as EnemyKind[]) {
      const p = enemyProfiles[kind];
      for (let i = 0; i < POOL[kind]; i++) {
        const visual = buildEnemy(kind, p.color, p.size);
        visual.group.visible = false;
        this.group.add(visual.group);
        this.pools[kind].push({
          kind,
          visual,
          alive: false,
          hp: p.hp,
          lead: 0,
          targetLead: 120,
          offX: 0,
          offY: 0,
          baseX: 0,
          baseY: 0,
          ampX: 0,
          ampY: 0,
          freq: 1,
          phase: 0,
          age: 0,
          fireTimer: 0,
          flash: 0,
          wave: -1,
          spinRate: 1,
        });
      }
    }

    // Player bolts: a stretched box, additive, oriented along travel. A quad
    // would need to billboard; a box reads correctly from any angle and costs
    // nothing at this count.
    this.boltGeo = new THREE.BoxGeometry(0.34, 0.34, 7);
    this.boltMat = new THREE.MeshBasicMaterial({
      color: 0x9ffff0,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
    this.boltMesh = new THREE.InstancedMesh(this.boltGeo, this.boltMat, MAX_BOLTS);
    this.boltMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.boltMesh.frustumCulled = false;
    this.group.add(this.boltMesh);

    this.plasmaGeo = new THREE.SphereGeometry(0.9, 10, 8);
    this.plasmaMat = new THREE.MeshBasicMaterial({
      color: 0xff5ec8,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
    this.plasmaMesh = new THREE.InstancedMesh(this.plasmaGeo, this.plasmaMat, MAX_PLASMA);
    this.plasmaMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.plasmaMesh.frustumCulled = false;
    this.group.add(this.plasmaMesh);

    for (let i = 0; i < MAX_BOLTS; i++) {
      this.bolts.push({ pos: new THREE.Vector3(), prev: new THREE.Vector3(), vel: new THREE.Vector3(), life: 0 });
      this.boltMesh.setMatrixAt(i, this.m.identity().scale(this.hidden));
    }
    for (let i = 0; i < MAX_PLASMA; i++) {
      this.plasma.push({ pos: new THREE.Vector3(), prev: new THREE.Vector3(), vel: new THREE.Vector3(), life: 0 });
      this.plasmaMesh.setMatrixAt(i, this.m.identity().scale(this.hidden));
    }
  }

  setNode(node: NodeTarget | null): void {
    this.node = node;
  }

  /* ------------------------------------------------------------ spawning */

  /**
   * Spawn a wave. Returns a wave id to count survivors with.
   *
   * Positions are relative — a `lead` ahead of wherever the ship is when the
   * enemy updates — so nothing here needs to know where the player currently is.
   */
  spawnWave(units: { kind: EnemyKind; count: number }[]): number {
    const id = ++this.waveSeq;
    this.waveAge.set(id, 0);

    let slot = 0;
    for (const u of units) {
      for (let i = 0; i < u.count; i++) {
        const e = this.pools[u.kind].find((x) => !x.alive);
        if (!e) continue;
        const p = enemyProfiles[u.kind];

        e.alive = true;
        e.hp = p.hp;
        e.wave = id;
        e.age = 0;
        e.flash = 0;
        e.fireTimer = 0.6 + Math.random() * 1.4;
        e.phase = Math.random() * Math.PI * 2;
        e.spinRate = 0.6 + Math.random() * 1.6;

        // Fan the formation out across the tube so they arrive as a shape, not
        // a stack. The slot index drives a deterministic spread, jittered a
        // little so repeat runs are not identical.
        const spread = (slot % 5) / 4 - 0.5;
        const row = Math.floor(slot / 5);
        e.baseX = spread * 58 + (Math.random() - 0.5) * 10;
        e.baseY = 4 + row * 17 - 8 + (Math.random() - 0.5) * 9;

        switch (u.kind) {
          case 'drone':
            e.targetLead = 76 + Math.random() * 40;
            e.ampX = 12 + Math.random() * 10;
            e.ampY = 6 + Math.random() * 6;
            e.freq = 0.5 + Math.random() * 0.4;
            break;
          case 'weaver':
            e.targetLead = 68 + Math.random() * 34;
            e.ampX = 26 + Math.random() * 14;
            e.ampY = 12 + Math.random() * 8;
            e.freq = 1.1 + Math.random() * 0.6;
            break;
          case 'lancer':
            // Lancers ignore targetLead: they close all the way and pass by.
            e.targetLead = -90;
            e.ampX = 4;
            e.ampY = 3;
            e.freq = 0.8;
            break;
          case 'sentry':
            e.targetLead = 118 + Math.random() * 40;
            e.ampX = 5;
            e.ampY = 4;
            e.freq = 0.3;
            break;
        }

        // Everything flies in from ahead rather than popping into existence in
        // front of the player — but not so far out that the wave spends its
        // first three seconds as specks the player cannot identify.
        e.lead = 240 + Math.random() * 90 + slot * 7;
        e.offX = e.baseX;
        e.offY = e.baseY;
        e.visual.group.visible = true;
        e.visual.group.scale.setScalar(enemyProfiles[u.kind].size / 2.6);
        slot++;
      }
    }
    return id;
  }

  aliveInWave(id: number): number {
    let n = 0;
    for (const kind of Object.keys(this.pools) as EnemyKind[]) {
      for (const e of this.pools[kind]) if (e.alive && e.wave === id) n++;
    }
    return n;
  }

  get aliveCount(): number {
    let n = 0;
    for (const kind of Object.keys(this.pools) as EnemyKind[]) {
      for (const e of this.pools[kind]) if (e.alive) n++;
    }
    return n;
  }

  /* --------------------------------------------------------------- guns */

  /** Called every simulation step with the current fire intent. */
  shoot(ship: Ship, dt: number, wantFire: boolean): void {
    this.fireTimer -= dt;
    if (!wantFire || this.fireTimer > 0) return;
    this.fireTimer = FIRE_INTERVAL;

    const b = this.bolts.find((x) => x.life <= 0);
    if (!b) return;
    this.shotsFired++;

    ship.muzzle(this.muzzleFlip, this.muzzlePos);
    this.muzzleFlip = (this.muzzleFlip + 1) % 2;
    ship.forward(this.fwd);

    b.pos.copy(this.muzzlePos);
    b.prev.copy(this.muzzlePos);
    // Bolts inherit the ship's speed, otherwise firing at 130 m/s looks like
    // the shots are being dropped out of the back.
    b.vel.copy(this.fwd).multiplyScalar(BOLT_SPEED + ship.speed);
    b.life = BOLT_LIFE;

    this.particles.jet(this.muzzlePos, this.fwd, 0xaefff2, 4, 30);
    this.hooks.onShoot(this.muzzlePos);
  }

  /* ------------------------------------------------------------- update */

  update(dt: number, elapsed: number, ship: Ship): void {
    this.updateEnemies(dt, elapsed, ship);
    this.updateBolts(dt, ship);
    this.updatePlasma(dt, ship);
  }

  private updateEnemies(dt: number, elapsed: number, ship: Ship): void {
    for (const [id, age] of this.waveAge) this.waveAge.set(id, age + dt);

    for (const kind of Object.keys(this.pools) as EnemyKind[]) {
      const profile = enemyProfiles[kind];
      for (const e of this.pools[kind]) {
        if (!e.alive) continue;
        e.age += dt;

        if (e.flash > 0) {
          e.flash = Math.max(0, e.flash - dt * 5);
          for (const m of e.visual.mats) m.uniforms.uHit.value = e.flash;
        }
        for (const m of e.visual.mats) m.uniforms.uTime.value = elapsed;
        e.visual.marker.uniforms.uTime.value = elapsed;
        e.visual.marker.uniforms.uHit.value = e.flash;

        // Survivors disengage rather than trailing the player forever.
        if ((this.waveAge.get(e.wave) ?? 0) > WAVE_TIMEOUT) {
          this.disengage(e);
          continue;
        }

        if (kind === 'lancer') {
          // Straight charge down the rail, accelerating.
          e.lead -= (profile.speed + e.age * 26) * dt;
          if (e.lead < -110) {
            this.disengage(e, false);
            continue;
          }
          // Drift toward the player's current slot so the pass is threatening.
          e.baseX = damp(e.baseX, ship.offset.x, 1.1, dt);
          e.baseY = damp(e.baseY, ship.offset.y, 1.1, dt);
        } else {
          e.lead = damp(e.lead, e.targetLead, 1.35, dt);
        }

        const t = elapsed * e.freq + e.phase;
        e.offX = e.baseX + Math.sin(t) * e.ampX;
        e.offY = e.baseY + Math.sin(t * 0.73 + 1.1) * e.ampY;

        const distance = clamp(ship.distance + e.lead, 0, this.route.length);
        this.route.poseAt(distance, this.pose);
        e.visual.group.position
          .copy(this.pose.position)
          .addScaledVector(this.pose.right, e.offX)
          .addScaledVector(this.pose.up, e.offY);

        // Facing: turrets and spikes look at the player, drifters face down the
        // rail toward them. Both end up pointing roughly at the camera, which
        // is what keeps their silhouettes readable.
        if (kind === 'sentry' || kind === 'lancer') {
          e.visual.group.up.copy(this.pose.up);
          e.visual.group.lookAt(ship.object.position);
        } else {
          this.v.copy(this.pose.position).addScaledVector(this.pose.tangent, -60);
          e.visual.group.up.copy(this.pose.up);
          e.visual.group.lookAt(this.v);
        }

        for (const s of e.visual.spin) {
          s.rotation.z += dt * e.spinRate * 1.6;
          s.rotation.y += dt * e.spinRate * 0.7;
        }

        // Fire control.
        if (profile.fireRate > 0 && e.lead > 40) {
          e.fireTimer -= dt;
          if (e.fireTimer <= 0) {
            e.fireTimer = profile.fireRate * (0.75 + Math.random() * 0.5);
            this.firePlasma(e, ship);
          }
        }
      }
    }
  }

  private firePlasma(e: Enemy, ship: Ship): void {
    const p = this.plasma.find((x) => x.life <= 0);
    if (!p) return;
    const from = e.visual.group.position;
    p.pos.copy(from);
    p.prev.copy(from);
    // Aim at where the ship is now, not where it will be. Leading the target
    // would be correct and would also make the game unpleasant.
    this.v.subVectors(ship.object.position, from).normalize();
    p.vel.copy(this.v).multiplyScalar(PLASMA_SPEED);
    p.life = PLASMA_LIFE;
    this.particles.jet(from, this.v, 0xff7ad4, 5, 18);
  }

  private updateBolts(dt: number, ship: Ship): void {
    for (let i = 0; i < MAX_BOLTS; i++) {
      const b = this.bolts[i];
      if (b.life <= 0) {
        this.boltMesh.setMatrixAt(i, this.m.identity().scale(this.hidden));
        continue;
      }
      b.life -= dt;
      b.prev.copy(b.pos);
      b.pos.addScaledVector(b.vel, dt);

      if (b.life <= 0) {
        this.boltMesh.setMatrixAt(i, this.m.identity().scale(this.hidden));
        continue;
      }

      let consumed = false;

      // Enemies first: a bolt that would clip both an enemy and the node behind
      // it should hit the enemy.
      for (const kind of Object.keys(this.pools) as EnemyKind[]) {
        if (consumed) break;
        for (const e of this.pools[kind]) {
          if (!e.alive) continue;
          const r = e.visual.radius + 2.6;
          if (this.segmentHitsSphere(b.prev, b.pos, e.visual.group.position, r)) {
            this.hitEnemy(e, b.pos, 1);
            consumed = true;
            break;
          }
        }
      }

      if (!consumed && this.node) {
        const r = this.node.radius + 2.6;
        if (this.segmentHitsSphere(b.prev, b.pos, this.node.position, r)) {
          // Land the visual on the surface rather than at the centre.
          this.v.subVectors(b.pos, this.node.position).normalize().multiplyScalar(this.node.radius);
          this.w.copy(this.node.position).add(this.v);
          const did = this.node.hit(1, this.w);
          if (did) this.damageDealt += 1;
          this.particles.burst(this.w, {
            count: did ? 12 : 8,
            color: did ? 0xffffff : 0x8fd8ff,
            color2: did ? 0xffc48a : 0x5b9cff,
            speed: 34,
            life: 0.4,
            size: 2.1,
            drag: 4,
          });
          this.impacts.flash(this.w, did ? 7 : 5, did ? 0xfff0c8 : 0x9fd6ff, 0.16);
          consumed = true;
        }
      }

      if (consumed) {
        b.life = 0;
        this.boltMesh.setMatrixAt(i, this.m.identity().scale(this.hidden));
        continue;
      }

      // Orient the box along travel and stretch it with speed.
      // The box's long axis is Z, so the rotation is measured from +Z.
      this.v.copy(b.vel).normalize();
      this.q.setFromUnitVectors(this.axisZ, this.v);
      this.scale.set(1, 1, 1 + ship.boostAmount * 0.6);
      this.m.compose(b.pos, this.q, this.scale);
      this.boltMesh.setMatrixAt(i, this.m);
    }
    this.boltMesh.instanceMatrix.needsUpdate = true;
  }

  private updatePlasma(dt: number, ship: Ship): void {
    const shipR = 4.0;
    for (let i = 0; i < MAX_PLASMA; i++) {
      const p = this.plasma[i];
      if (p.life <= 0) {
        this.plasmaMesh.setMatrixAt(i, this.m.identity().scale(this.hidden));
        continue;
      }
      p.life -= dt;
      p.prev.copy(p.pos);
      p.pos.addScaledVector(p.vel, dt);

      if (p.life <= 0) {
        this.plasmaMesh.setMatrixAt(i, this.m.identity().scale(this.hidden));
        continue;
      }

      if (this.segmentHitsSphere(p.prev, p.pos, ship.object.position, shipR)) {
        p.life = 0;
        this.plasmaMesh.setMatrixAt(i, this.m.identity().scale(this.hidden));
        if (ship.damage(0.2)) {
          this.particles.burst(p.pos, {
            count: 26,
            color: 0xff5ec8,
            color2: 0xffffff,
            speed: 40,
            life: 0.5,
            size: 2.6,
            drag: 3.4,
          });
          this.impacts.explosion(p.pos, 1.5, 0xff3d81, 0xffffff);
          this.hooks.onPlayerHit(p.pos);
        }
        continue;
      }

      // Plasma pulses as it travels so it never blends into the background.
      const s = 1 + Math.sin(p.life * 22) * 0.16;
      this.scale.set(s, s, s);
      this.m.compose(p.pos, this.q.identity(), this.scale);
      this.plasmaMesh.setMatrixAt(i, this.m);
    }
    this.plasmaMesh.instanceMatrix.needsUpdate = true;
  }

  private hitEnemy(e: Enemy, at: THREE.Vector3, damage: number): void {
    this.damageDealt += damage;
    e.hp -= damage;
    e.flash = 1;
    for (const m of e.visual.mats) m.uniforms.uHit.value = 1;

    if (e.hp > 0) {
      this.particles.burst(at, {
        count: 9,
        color: 0xffffff,
        color2: enemyProfiles[e.kind].color,
        speed: 26,
        life: 0.3,
        size: 1.7,
        drag: 5,
      });
      this.impacts.flash(at, 4.2, 0xffffff, 0.12);
      this.hooks.onEnemyHit(at, false);
      return;
    }

    const p = enemyProfiles[e.kind];
    // Scratch, not a clone: every consumer below copies out of it, and this is
    // the hot path the "nothing allocates during play" note above refers to.
    const pos = this.killPos.copy(e.visual.group.position);

    // The kill: a hot white core, a coloured debris shell, two rings and a
    // flash. This is the moment the whole VFX layer exists to serve.
    this.particles.burst(pos, {
      count: 46,
      color: 0xffffff,
      color2: p.color,
      speed: 62,
      life: 0.72,
      size: 3.1,
      drag: 2.1,
    });
    this.particles.burst(pos, {
      count: 22,
      color: p.color,
      color2: 0x38263a,
      speed: 30,
      life: 1.5,
      size: 1.5,
      drag: 0.7,
      gravity: 5,
    });
    this.impacts.explosion(pos, p.size * 0.85, p.color, 0xffffff);

    e.alive = false;
    e.visual.group.visible = false;
    this.hooks.onEnemyHit(pos, true);
    this.hooks.onKill(e.kind, pos, p.xp);
  }

  /** Leave the field without dying — no reward, no debris, just a fold-out. */
  private disengage(e: Enemy, showEffect = true): void {
    if (showEffect) {
      this.impacts.flash(e.visual.group.position, 6, 0x9fd6ff, 0.2);
      this.particles.burst(e.visual.group.position, {
        count: 14,
        color: 0x9fd6ff,
        speed: 30,
        life: 0.35,
        size: 2,
        drag: 5,
      });
    }
    e.alive = false;
    e.visual.group.visible = false;
  }

  /**
   * Closest-approach test between a swept segment and a sphere.
   *
   * A point test is not good enough here: a bolt covers seven metres in a frame
   * and a drone is three across, so plain position checks tunnel straight
   * through targets at a rate players absolutely notice.
   */
  private segmentHitsSphere(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, r: number): boolean {
    this.seg.subVectors(b, a);
    const len2 = this.seg.lengthSq();
    this.toC.subVectors(c, a);
    if (len2 < 1e-8) return this.toC.lengthSq() <= r * r;
    const t = clamp(this.toC.dot(this.seg) / len2, 0, 1);
    this.w.copy(a).addScaledVector(this.seg, t);
    return this.w.distanceToSquared(c) <= r * r;
  }

  /**
   * Stand every hostile down without killing them. Called when a node breaks:
   * the fight is over, and leaving stragglers to shoot at a ship that is now
   * parked for reading would be both unfair and absurd.
   */
  standDown(): void {
    for (const kind of Object.keys(this.pools) as EnemyKind[]) {
      for (const e of this.pools[kind]) if (e.alive) this.disengage(e);
    }
    for (const p of this.plasma) p.life = 0;
  }

  clear(): void {
    for (const kind of Object.keys(this.pools) as EnemyKind[]) {
      for (const e of this.pools[kind]) {
        e.alive = false;
        e.visual.group.visible = false;
      }
    }
    for (let i = 0; i < MAX_BOLTS; i++) {
      this.bolts[i].life = 0;
      this.boltMesh.setMatrixAt(i, this.m.identity().scale(this.hidden));
    }
    for (let i = 0; i < MAX_PLASMA; i++) {
      this.plasma[i].life = 0;
      this.plasmaMesh.setMatrixAt(i, this.m.identity().scale(this.hidden));
    }
    this.boltMesh.instanceMatrix.needsUpdate = true;
    this.plasmaMesh.instanceMatrix.needsUpdate = true;
    this.waveAge.clear();
  }

  dispose(): void {
    for (const kind of Object.keys(this.pools) as EnemyKind[]) {
      for (const e of this.pools[kind]) e.visual.dispose();
    }
    this.boltGeo.dispose();
    this.plasmaGeo.dispose();
    this.boltMat.dispose();
    this.plasmaMat.dispose();
    this.boltMesh.dispose();
    this.plasmaMesh.dispose();
  }
}
