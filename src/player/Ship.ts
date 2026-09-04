import * as THREE from 'three';
import type { InputState } from '../core/Input';
import { clamp, damp } from '../core/Math';
import { hullMaterial, glowMaterial, type HullMaterial } from '../shaders/hull';
import { Trail } from '../fx/Trail';
import { Route, TUBE_RADIUS, makePose, type Pose } from '../world/Route';

export const CRUISE_SPEED = 68;
export const BOOST_SPEED = 132;
export const BRAKE_SPEED = 34;

/** How fast the ship can slide across the tube. */
const LATERAL_SPEED = 62;

/**
 * The player craft, flown on the rail.
 *
 * Forward motion is a distance along the route; the only real degrees of freedom
 * are where in the cross-section of the tube the ship sits, and how fast it is
 * travelling. That sounds restrictive and is exactly the point — every visitor
 * ends up looking at the thing they are supposed to be looking at, and the
 * combat can be authored knowing where the camera will be.
 *
 * `barrier` is how the mission script holds the ship at a locked node: the
 * available room ahead caps the speed, so the craft glides to a hover instead of
 * slamming into an invisible wall.
 */
export class Ship {
  readonly object = new THREE.Group();
  readonly hull = new THREE.Group();
  readonly trail: Trail;

  /** Metres travelled along the route. */
  distance = 0;
  /** Offset from the centreline: x is right, y is up, in route-frame metres. */
  readonly offset = new THREE.Vector2();
  private offsetVel = new THREE.Vector2();

  speed = CRUISE_SPEED;
  boostAmount = 0;
  bank = 0;
  nose = 0;

  /** Hull integrity, 0→1. Never fatal; see Combat for why. */
  integrity = 1;
  /** Rises on a hit, decays — drives the damage vignette. */
  damageFlash = 0;
  /** Seconds of invulnerability after a hit, so one sentry cannot chain-stun. */
  private mercy = 0;

  /** Distance the ship may not pass. The mission script owns this. */
  barrier = Infinity;
  /** True while the mission is holding the ship short of a locked node. */
  held = false;
  /** Set while a dossier is open: the craft coasts to a stop and waits. */
  hold = false;

  readonly pose: Pose = makePose();

  private velocity = new THREE.Vector3();
  private prevPos = new THREE.Vector3();
  private basis = new THREE.Matrix4();
  private quat = new THREE.Quaternion();
  private tilt = new THREE.Quaternion();
  private euler = new THREE.Euler(0, 0, 0, 'YXZ');
  private tmp = new THREE.Vector3();

  private engines: THREE.Mesh[] = [];
  private enginePlume: THREE.Mesh;
  private plumeMat: THREE.MeshBasicMaterial;
  private intakeMat: THREE.MeshBasicMaterial;
  private canards: THREE.Object3D[] = [];
  private hullMats: HullMaterial[] = [];
  private disposables: Array<THREE.BufferGeometry | THREE.Material> = [];

  /** Local-space muzzle positions, in hull units. */
  private readonly muzzles = [new THREE.Vector3(2.2, -0.1, -2.4), new THREE.Vector3(-2.2, -0.1, -2.4)];

  constructor(accent = 0x4de1c1) {
    const keep = <T extends THREE.BufferGeometry | THREE.Material>(x: T): T => {
      this.disposables.push(x);
      return x;
    };

    const shell = keep(hullMaterial({ color: accent, base: 0x0b1220, rim: 1.15, power: 2.2, glow: 0.06, panel: 0.85 }));
    const shellDark = keep(hullMaterial({ color: accent, base: 0x060a12, rim: 0.7, power: 3.0, panel: 1.2 }));
    this.hullMats.push(shell, shellDark);

    // Fuselage: a long faceted spine. Five sides rather than six so the top
    // face reads as a flat deck from behind — the only angle the player ever
    // actually sees, and the one the silhouette has to earn.
    const nose = new THREE.Mesh(keep(new THREE.ConeGeometry(0.88, 6.2, 5, 1)), shell);
    nose.rotation.x = -Math.PI / 2;
    nose.rotation.z = Math.PI / 10;
    nose.position.z = -2.2;
    this.hull.add(nose);

    // Chines: a hard edge running the length of the nose. This is the single
    // detail that stops the craft reading as a generic cone with wings.
    const chineGeo = keep(new THREE.BoxGeometry(0.16, 0.22, 5.4));
    for (const side of [1, -1]) {
      const chine = new THREE.Mesh(chineGeo, shell);
      chine.position.set(side * 0.72, -0.12, -1.9);
      chine.rotation.y = side * 0.06;
      this.hull.add(chine);
    }

    // Dorsal spine from canopy to tail.
    const spine = new THREE.Mesh(keep(new THREE.BoxGeometry(0.34, 0.5, 4.6)), shellDark);
    spine.position.set(0, 0.62, 1.1);
    this.hull.add(spine);

    const body = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.95, 1.15, 3.4, 6, 1)), shell);
    body.rotation.x = Math.PI / 2;
    body.position.z = 1.4;
    this.hull.add(body);

    // Glowing intake ring at the shoulder — a bright anchor point so the eye
    // has somewhere to land on a dark hull.
    this.intakeMat = keep(glowMaterial(accent, 0.9));
    const intake = new THREE.Mesh(keep(new THREE.TorusGeometry(1.2, 0.14, 6, 24)), this.intakeMat);
    intake.position.z = 0.1;
    this.hull.add(intake);

    // Canopy. Deliberately dim: at rim 1.7 with a glow floor this was the
    // brightest thing on the craft and bloomed into a white ball that ate the
    // whole nose.
    const canopy = new THREE.Mesh(
      keep(new THREE.SphereGeometry(0.62, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2)),
      keep(
        hullMaterial({
          color: 0x5fc8e8,
          base: 0x0a1c2c,
          rim: 0.85,
          power: 2.4,
          glow: 0.02,
          transparent: true,
          opacity: 0.5,
        }),
      ),
    );
    canopy.position.set(0, 0.46, -1.1);
    canopy.scale.z = 1.9;
    this.hull.add(canopy);

    // Swept delta wings with a bright leading edge.
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, -2.4);
    wingShape.lineTo(0.5, 1.4);
    wingShape.lineTo(3.9, 2.5);
    wingShape.lineTo(4.2, 1.55);
    wingShape.lineTo(1.5, -2.7);
    wingShape.lineTo(0, -2.4);
    const wingGeo = keep(new THREE.ExtrudeGeometry(wingShape, { depth: 0.18, bevelEnabled: false }));
    const edgeGeo = keep(new THREE.BoxGeometry(0.1, 0.1, 4.2));
    const edgeMat = keep(glowMaterial(accent, 0.85));

    for (const side of [1, -1]) {
      const wing = new THREE.Mesh(wingGeo, shellDark);
      wing.rotation.x = -Math.PI / 2;
      wing.scale.x = side;
      wing.position.set(0, -0.12, 0);
      this.hull.add(wing);

      const edge = new THREE.Mesh(edgeGeo, edgeMat);
      edge.position.set(side * 2.25, -0.06, -0.1);
      edge.rotation.y = side * -0.62;
      this.hull.add(edge);

      // Canards that deflect when the ship banks. Tiny detail, but it makes
      // the craft feel like a machine responding rather than a prop rotating.
      const canard = new THREE.Group();
      const fin = new THREE.Mesh(keep(new THREE.BoxGeometry(1.5, 0.1, 0.62)), shellDark);
      fin.position.x = side * 0.75;
      canard.add(fin);
      canard.position.set(side * 0.85, 0.1, -2.5);
      this.canards.push(canard);
      this.hull.add(canard);

      // Upturned winglet: reads instantly at any distance and gives the
      // planform a recognisable outline against the corridor.
      const winglet = new THREE.Mesh(keep(new THREE.BoxGeometry(0.14, 1.3, 1.5)), shellDark);
      winglet.position.set(side * 3.5, 0.5, 1.1);
      winglet.rotation.z = side * 0.34;
      this.hull.add(winglet);

      // Ventral fin, angled down and out.
      const ventral = new THREE.Mesh(keep(new THREE.BoxGeometry(0.12, 0.95, 1.2)), shellDark);
      ventral.position.set(side * 1.5, -0.62, 1.9);
      ventral.rotation.z = side * -0.55;
      this.hull.add(ventral);

      // Wingtip nacelle + engine bell.
      const nacelle = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.34, 0.44, 2.1, 10)), shell);
      nacelle.rotation.x = Math.PI / 2;
      nacelle.position.set(side * 2.5, -0.05, 1.7);
      this.hull.add(nacelle);

      const bell = new THREE.Mesh(keep(new THREE.CircleGeometry(0.42, 18)), keep(glowMaterial(0x7fe8dc, 0.7)));
      bell.position.set(side * 2.5, -0.05, 2.78);
      this.engines.push(bell);
      this.hull.add(bell);
    }

    // Twin tail fins.
    const finGeo = keep(new THREE.BoxGeometry(0.12, 1.35, 1.5));
    for (const side of [1, -1]) {
      const f = new THREE.Mesh(finGeo, shellDark);
      f.position.set(side * 0.7, 0.68, 2.2);
      f.rotation.z = side * 0.28;
      this.hull.add(f);
    }

    const mainBell = new THREE.Mesh(keep(new THREE.CircleGeometry(0.72, 20)), keep(glowMaterial(0x8ff0e2, 0.75)));
    mainBell.position.set(0, 0, 3.15);
    this.engines.push(mainBell);
    this.hull.add(mainBell);

    // Exhaust cone that stretches with throttle.
    //
    // Kept deliberately small and dim. The chase camera looks straight down the
    // throat of this thing, so it is the one object in the scene guaranteed to
    // be close to the lens — an earlier, larger version blew out the entire
    // bottom third of the frame once bloom got hold of it.
    this.plumeMat = keep(glowMaterial(accent, 0.22));
    this.enginePlume = new THREE.Mesh(keep(new THREE.ConeGeometry(0.5, 3, 12, 1, true)), this.plumeMat);
    this.enginePlume.rotation.x = -Math.PI / 2;
    this.enginePlume.position.set(0, 0, 4.4);
    this.hull.add(this.enginePlume);

    this.hull.scale.setScalar(0.62);
    this.object.add(this.hull);

    this.trail = new Trail(46, 0.42, accent, 0.9);
  }

  /** World-space muzzle position for hardpoint `i`. */
  muzzle(i: number, out: THREE.Vector3): THREE.Vector3 {
    return out.copy(this.muzzles[i % this.muzzles.length]).multiplyScalar(0.62).applyMatrix4(this.object.matrixWorld);
  }

  /** Unit vector the nose points down. */
  forward(out: THREE.Vector3): THREE.Vector3 {
    return out.set(0, 0, -1).applyQuaternion(this.object.quaternion).normalize();
  }

  /** World position a little behind the tail, where the trail attaches. */
  tail(out: THREE.Vector3): THREE.Vector3 {
    return out.set(0, 0, 2.4).multiplyScalar(0.62).applyMatrix4(this.object.matrixWorld);
  }

  reset(route: Route, distance: number): void {
    this.distance = distance;
    this.offset.set(0, 0);
    this.offsetVel.set(0, 0);
    this.speed = CRUISE_SPEED;
    this.boostAmount = 0;
    this.bank = 0;
    this.nose = 0;
    this.hold = false;
    this.sync(route, 0);
    this.prevPos.copy(this.object.position);
    this.trail.reset(this.object.position);
  }

  /** Apply damage. Returns true if the hit landed (mercy window not active). */
  damage(amount: number): boolean {
    if (this.mercy > 0) return false;
    this.integrity = clamp(this.integrity - amount, 0, 1);
    this.damageFlash = 1;
    this.mercy = 0.9;
    return true;
  }

  step(input: InputState, dt: number, elapsed: number, route: Route): void {
    this.mercy = Math.max(0, this.mercy - dt);
    this.damageFlash = Math.max(0, this.damageFlash - dt * 1.5);
    // Hull knits itself back together slowly. This is a portfolio: the failure
    // state has to be embarrassment, never a wall between a client and the CV.
    if (this.mercy <= 0) this.integrity = Math.min(1, this.integrity + dt * 0.055);

    this.boostAmount = damp(this.boostAmount, this.hold ? 0 : input.boost, 4, dt);

    // --- forward -------------------------------------------------------
    let target: number;
    if (this.hold) target = 0;
    else if (input.brake) target = BRAKE_SPEED;
    else target = CRUISE_SPEED + (BOOST_SPEED - CRUISE_SPEED) * this.boostAmount;

    // Room ahead caps the speed, so hitting a locked node is a glide to a stop.
    const room = this.barrier - this.distance;
    if (room < 90) target = Math.min(target, Math.max(0, room * 0.9));

    // Held at a locked node: the mission has taken the throttle away, which the
    // HUD has to say out loud. Otherwise the readout shows 0 m/s next to a lit
    // BOOST chip while the corridor streaks past, and a visitor with no idea
    // what a standoff is reads that combination as a broken speedometer.
    this.held = room < 3 && this.barrier !== Infinity;

    this.speed = damp(this.speed, target, this.hold ? 2.6 : 3.2, dt);
    if (this.speed < 0.05) this.speed = 0;
    this.distance = Math.min(this.barrier, this.distance + this.speed * dt);

    // --- lateral -------------------------------------------------------
    // Accelerate toward the commanded offset rather than snapping to it: the
    // craft has mass, and the overshoot is where the bank animation lives.
    const cmdX = input.steer * LATERAL_SPEED;
    const cmdY = input.pitch * LATERAL_SPEED * 0.82;
    this.offsetVel.x = damp(this.offsetVel.x, this.hold ? 0 : cmdX, 7, dt);
    this.offsetVel.y = damp(this.offsetVel.y, this.hold ? 0 : cmdY, 7, dt);
    this.offset.x += this.offsetVel.x * dt;
    this.offset.y += this.offsetVel.y * dt;

    // Soft circular containment. Past the tube wall the ship is pushed back and
    // the velocity into the wall is killed, so it slides along instead of
    // juddering against it.
    const r = Math.hypot(this.offset.x, this.offset.y);
    if (r > TUBE_RADIUS) {
      const k = TUBE_RADIUS / r;
      this.offset.x *= k;
      this.offset.y *= k;
      const nx = this.offset.x / TUBE_RADIUS;
      const ny = this.offset.y / TUBE_RADIUS;
      const into = this.offsetVel.x * nx + this.offsetVel.y * ny;
      if (into > 0) {
        this.offsetVel.x -= nx * into;
        this.offsetVel.y -= ny * into;
      }
    }

    // Bank into the turn, pitch the nose with vertical motion.
    this.bank = damp(this.bank, clamp(-this.offsetVel.x / LATERAL_SPEED, -1, 1) * 0.78, 6, dt);
    this.nose = damp(this.nose, clamp(this.offsetVel.y / LATERAL_SPEED, -1, 1) * 0.34, 6, dt);

    this.sync(route, elapsed);
    if (dt > 0) this.velocity.subVectors(this.object.position, this.prevPos).multiplyScalar(1 / dt);

    // --- visuals -------------------------------------------------------
    const throttle = 0.42 + this.boostAmount * 0.58 + (this.speed / BOOST_SPEED) * 0.2;
    this.enginePlume.scale.set(0.85 + this.boostAmount * 0.25, 0.6 + this.boostAmount * 1.5, 0.85 + this.boostAmount * 0.25);
    this.plumeMat.opacity = (0.07 + this.boostAmount * 0.2) * (this.speed > 1 ? 1 : 0.15);
    for (const e of this.engines) {
      e.scale.setScalar(0.6 + throttle * 0.35 + Math.sin(elapsed * 26) * 0.035);
    }
    this.intakeMat.opacity = 0.6 + Math.sin(elapsed * 3.1) * 0.14 + this.boostAmount * 0.3;
    this.canards.forEach((c, i) => {
      c.rotation.x = this.bank * (i === 0 ? 0.5 : -0.5) + this.nose * 0.4;
    });
    // Idle bob, scaled down at speed so it never fights the flight model.
    const calm = 1 - this.boostAmount * 0.7;
    this.hull.position.y = Math.sin(elapsed * 2.1) * 0.06 * calm;
    // No throttle, no trail: a ship parked at a node for reading should not be
    // laying down a wake.
    const moving = Math.min(1, this.speed / 24);
    this.trail.setIntensity((0.14 + throttle * 0.5) * moving);
  }

  /** Place and orient the craft from the current rail state. */
  private sync(route: Route, elapsed: number): void {
    route.poseAt(this.distance, this.pose);
    const p = this.pose;

    this.prevPos.copy(this.object.position);
    this.object.position
      .copy(p.position)
      .addScaledVector(p.right, this.offset.x)
      .addScaledVector(p.up, this.offset.y);

    // Orientation: align to the rail frame, then add the craft's own attitude.
    // The object's local +Z points backwards, so the basis takes -tangent.
    this.tmp.copy(p.tangent).negate();
    this.basis.makeBasis(p.right, p.up, this.tmp);
    this.quat.setFromRotationMatrix(this.basis);

    // Lead the nose slightly into the direction of travel across the tube.
    const yaw = clamp(this.offsetVel.x / LATERAL_SPEED, -1, 1) * -0.36;
    this.euler.set(this.nose, yaw, this.bank + Math.sin(elapsed * 1.3) * 0.012);
    this.tilt.setFromEuler(this.euler);
    this.object.quaternion.copy(this.quat).multiply(this.tilt);
    this.object.updateMatrixWorld(true);
  }

  updateTrail(camera: THREE.Camera): void {
    this.trail.update(this.tail(this.tmp), camera);
  }

  get hullMaterials(): HullMaterial[] {
    return this.hullMats;
  }

  /** World velocity over the last step, for inheriting into particles. */
  get worldVelocity(): THREE.Vector3 {
    return this.velocity;
  }

  dispose(): void {
    for (const d of this.disposables) d.dispose();
    this.disposables = [];
    this.trail.dispose();
  }
}
