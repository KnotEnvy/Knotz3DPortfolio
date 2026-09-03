import * as THREE from 'three';
import type { InputState } from '../core/Input';
import { clamp, damp } from '../core/Math';

export const CRUISE_SPEED = 34;
export const BOOST_SPEED = 78;

export interface ShipBounds {
  x: number;
  yMin: number;
  yMax: number;
  zMin: number;
  zMax: number;
}

/**
 * Arcade flight model: constant forward cruise with damped yaw/pitch and a
 * visual bank. Deliberately forgiving — this is a résumé, not a flight sim, and
 * a visitor should never be able to get lost or stuck.
 */
export class Ship {
  readonly object = new THREE.Group();
  readonly hull = new THREE.Group();
  readonly velocity = new THREE.Vector3();

  yaw = 0;
  pitch = 0;
  roll = 0;
  speed = CRUISE_SPEED;
  boostAmount = 0;
  /** Scales the cruise speed; dropped while a dossier is open so you can read. */
  cruiseScale = 1;

  private forward = new THREE.Vector3();
  private euler = new THREE.Euler(0, 0, 0, 'YXZ');
  private thrusters: THREE.Mesh[] = [];
  private plume: THREE.Mesh;
  private plumeMat: THREE.MeshBasicMaterial;
  private disposables: Array<THREE.BufferGeometry | THREE.Material> = [];

  constructor(private bounds: ShipBounds) {
    const keep = <T extends THREE.BufferGeometry | THREE.Material>(x: T): T => {
      this.disposables.push(x);
      return x;
    };

    const shell = keep(
      new THREE.MeshStandardMaterial({
        color: 0x0d1626,
        emissive: new THREE.Color(0x4de1c1).multiplyScalar(0.16),
        metalness: 0.85,
        roughness: 0.3,
      }),
    );
    const trim = keep(new THREE.MeshBasicMaterial({ color: 0x4de1c1, toneMapped: false }));
    const glass = keep(
      new THREE.MeshStandardMaterial({
        color: 0x9ff5ff,
        emissive: new THREE.Color(0x2f8fa0),
        metalness: 0.2,
        roughness: 0.08,
        transparent: true,
        opacity: 0.7,
      }),
    );

    // Fuselage: a stretched, tapered wedge.
    const bodyGeo = keep(new THREE.ConeGeometry(1.15, 5.4, 4, 1));
    const body = new THREE.Mesh(bodyGeo, shell);
    body.rotation.x = -Math.PI / 2;
    body.rotation.z = Math.PI / 4;
    this.hull.add(body);

    const canopy = new THREE.Mesh(keep(new THREE.SphereGeometry(0.62, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2)), glass);
    canopy.position.set(0, 0.42, -0.3);
    this.hull.add(canopy);

    // Delta wings.
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 1.6);
    wingShape.lineTo(3.4, -1.5);
    wingShape.lineTo(1.0, -1.9);
    wingShape.lineTo(0, -0.6);
    wingShape.lineTo(0, 1.6);
    const wingGeo = keep(new THREE.ExtrudeGeometry(wingShape, { depth: 0.16, bevelEnabled: false }));

    for (const side of [1, -1]) {
      const wing = new THREE.Mesh(wingGeo, shell);
      wing.rotation.x = -Math.PI / 2;
      wing.scale.x = side;
      wing.position.set(0, -0.08, 0.4);
      this.hull.add(wing);

      const edge = new THREE.Mesh(keep(new THREE.BoxGeometry(0.12, 0.14, 3.1)), trim);
      edge.position.set(side * 1.75, -0.02, 0.35);
      edge.rotation.y = side * 0.5;
      this.hull.add(edge);
    }

    const fin = new THREE.Mesh(keep(new THREE.BoxGeometry(0.14, 1.1, 1.5)), shell);
    fin.position.set(0, 0.55, 1.6);
    this.hull.add(fin);

    // Engines.
    for (const x of [-0.72, 0.72]) {
      const nacelle = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.34, 0.42, 1.7, 12)), shell);
      nacelle.rotation.x = Math.PI / 2;
      nacelle.position.set(x, -0.05, 1.7);
      this.hull.add(nacelle);

      const glow = new THREE.Mesh(keep(new THREE.CircleGeometry(0.34, 16)), keep(new THREE.MeshBasicMaterial({
        color: 0x7ffff0,
        toneMapped: false,
        transparent: true,
        opacity: 0.95,
      })));
      glow.position.set(x, -0.05, 2.56);
      this.thrusters.push(glow);
      this.hull.add(glow);
    }

    // Exhaust plume — one additive cone that stretches with throttle.
    this.plumeMat = keep(
      new THREE.MeshBasicMaterial({
        color: 0x4de1c1,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    this.plume = new THREE.Mesh(keep(new THREE.ConeGeometry(0.75, 4.2, 12, 1, true)), this.plumeMat);
    this.plume.rotation.x = Math.PI / 2;
    this.plume.position.set(0, -0.05, 4.5);
    this.hull.add(this.plume);

    const halo = new THREE.PointLight(0x4de1c1, 90, 60, 2);
    halo.position.set(0, 0, 2);
    this.hull.add(halo);

    // The craft is authored at a comfortable modelling scale, then shrunk so the
    // world reads big around it rather than the other way round.
    this.hull.scale.setScalar(0.52);
    this.object.add(this.hull);
  }

  reset(position: THREE.Vector3, yaw = 0): void {
    this.object.position.copy(position);
    this.yaw = yaw;
    this.pitch = 0;
    this.roll = 0;
    this.cruiseScale = 1;
    this.speed = CRUISE_SPEED;
  }

  /** Unit vector the nose is pointing down. */
  getForward(target: THREE.Vector3): THREE.Vector3 {
    this.euler.set(this.pitch, this.yaw, 0);
    return target.set(0, 0, -1).applyEuler(this.euler);
  }

  step(input: InputState, dt: number, elapsed: number): void {
    const boostTarget = input.boost;
    this.boostAmount = damp(this.boostAmount, boostTarget, 3.4, dt);

    // Angular response. Yaw is snappier than pitch so the horizon stays stable.
    const yawRate = 1.15;
    const pitchRate = 4.5;
    this.yaw -= input.steer * yawRate * dt;
    this.pitch = clamp(damp(this.pitch, input.pitch * 0.55, pitchRate, dt), -0.85, 0.85);
    this.roll = damp(this.roll, -input.steer * 0.62, 5, dt);

    const cruise = CRUISE_SPEED * this.cruiseScale;
    const targetSpeed = cruise + (BOOST_SPEED - cruise) * this.boostAmount;
    this.speed = damp(this.speed, targetSpeed, 2.2, dt);

    this.getForward(this.forward);
    this.velocity.copy(this.forward).multiplyScalar(this.speed);
    this.object.position.addScaledVector(this.velocity, dt);

    this.applyBounds(dt);

    this.object.rotation.set(this.pitch, this.yaw, this.roll, 'YXZ');

    // Idle bob so the craft never looks frozen.
    this.hull.position.y = Math.sin(elapsed * 1.9) * 0.07;
    this.hull.rotation.z = Math.sin(elapsed * 1.3) * 0.03;

    const throttle = 0.55 + this.boostAmount * 0.45;
    this.plume.scale.set(throttle, 0.6 + this.boostAmount * 1.9, throttle);
    this.plumeMat.opacity = 0.18 + this.boostAmount * 0.45;
    for (const t of this.thrusters) {
      t.scale.setScalar(0.8 + this.boostAmount * 0.7 + Math.sin(elapsed * 22) * 0.05);
    }
  }

  /**
   * Soft containment. Rather than a hard wall, the ship is steered back toward
   * the corridor — a visitor who wanders off is gently turned around.
   */
  private applyBounds(dt: number): void {
    const p = this.object.position;
    const b = this.bounds;
    const margin = 40;

    const nudge = (over: number, axisTurn: number) => {
      if (over <= 0) return;
      const force = Math.min(1, over / margin);
      this.yaw += axisTurn * force * dt * 1.4;
    };

    nudge(p.x - b.x, p.z < 0 ? -1 : 1);
    nudge(-b.x - p.x, p.z < 0 ? 1 : -1);

    p.y = clamp(p.y, b.yMin, b.yMax);
    if (p.y <= b.yMin + 2 && this.pitch < 0) this.pitch = damp(this.pitch, 0.2, 6, dt);
    if (p.y >= b.yMax - 2 && this.pitch > 0) this.pitch = damp(this.pitch, -0.2, 6, dt);

    p.x = clamp(p.x, -b.x - margin, b.x + margin);
    p.z = clamp(p.z, b.zMin, b.zMax);
  }

  dispose(): void {
    for (const d of this.disposables) d.dispose();
    this.disposables = [];
  }
}
