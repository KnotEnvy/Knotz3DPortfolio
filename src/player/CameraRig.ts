import * as THREE from 'three';
import { damp, clamp } from '../core/Math';
import type { Ship } from './Ship';

const BASE_FOV = 66;
const BOOST_FOV = 84;

/**
 * Chase camera for rail flight.
 *
 * The rig sits in the ship's rail frame rather than its world orientation: it
 * trails the craft along the tube, but its own up stays welded to the route's
 * up. That is the difference between a corridor that feels like a corridor and
 * one that rolls sickeningly every time the spline curves.
 *
 * The camera also lags the ship's lateral offset deliberately. Trailing the
 * slide by a fraction of a second is what makes a hard bank feel like weight
 * instead of a teleport.
 */
export class CameraRig {
  private desired = new THREE.Vector3();
  private lookTarget = new THREE.Vector3();
  private lookCurrent = new THREE.Vector3();
  private shake = 0;
  private shakeDecay = 1.8;
  private lagX = 0;
  private lagY = 0;
  private back = 17;
  private high = 4.2;
  private tmp = new THREE.Vector3();
  private up = new THREE.Vector3(0, 1, 0);
  private initialised = false;
  private roll = 0;

  constructor(private camera: THREE.PerspectiveCamera) {}

  addShake(amount: number, decay = 1.8): void {
    this.shake = Math.min(1.6, this.shake + amount);
    this.shakeDecay = decay;
  }

  snap(ship: Ship): void {
    this.lagX = ship.offset.x;
    this.lagY = ship.offset.y;
    this.compute(ship);
    this.camera.position.copy(this.desired);
    this.lookCurrent.copy(this.lookTarget);
    this.up.copy(ship.pose.up);
    this.camera.up.copy(this.up);
    this.camera.lookAt(this.lookCurrent);
    this.initialised = true;
  }

  private compute(ship: Ship): void {
    const p = ship.pose;

    // Anchor behind the ship *along the rail*, offset by the lagged slide.
    this.desired
      .copy(p.position)
      .addScaledVector(p.tangent, -this.back)
      .addScaledVector(p.right, this.lagX)
      .addScaledVector(p.up, this.lagY + this.high);

    // Aim well ahead so the corridor, not the hull, dominates the frame.
    this.lookTarget
      .copy(p.position)
      .addScaledVector(p.tangent, 46)
      .addScaledVector(p.right, ship.offset.x * 0.72)
      .addScaledVector(p.up, ship.offset.y * 0.72 + 1.6);
  }

  update(ship: Ship, dt: number, elapsed: number): void {
    if (!this.initialised) {
      this.snap(ship);
      return;
    }

    // Lag is the whole feel of the camera. Fast enough to keep the ship in
    // frame, slow enough that a slide reads as effort.
    this.lagX = damp(this.lagX, ship.offset.x, 6.5, dt);
    this.lagY = damp(this.lagY, ship.offset.y, 7.5, dt);

    // Pull back and drop under boost.
    this.back = damp(this.back, 17 + ship.boostAmount * 7.5, 3.4, dt);
    this.high = damp(this.high, 4.2 - ship.boostAmount * 1.1, 3.4, dt);

    this.compute(ship);

    this.camera.position.x = damp(this.camera.position.x, this.desired.x, 9, dt);
    this.camera.position.y = damp(this.camera.position.y, this.desired.y, 9, dt);
    this.camera.position.z = damp(this.camera.position.z, this.desired.z, 9, dt);

    this.lookCurrent.x = damp(this.lookCurrent.x, this.lookTarget.x, 11, dt);
    this.lookCurrent.y = damp(this.lookCurrent.y, this.lookTarget.y, 11, dt);
    this.lookCurrent.z = damp(this.lookCurrent.z, this.lookTarget.z, 11, dt);

    // Keep the camera's up on the route frame, smoothed so spline curvature
    // never snaps the horizon.
    this.up.lerp(ship.pose.up, Math.min(1, dt * 5));
    this.camera.up.copy(this.up).normalize();

    if (this.shake > 0.001) {
      const s = this.shake * this.shake;
      // Two incommensurate frequencies per axis so the shake never looks like
      // a sine wave, which is the tell of a cheap screen shake.
      this.tmp
        .copy(ship.pose.right)
        .multiplyScalar((Math.sin(elapsed * 61) + Math.sin(elapsed * 97) * 0.6) * s * 0.9)
        .addScaledVector(ship.pose.up, (Math.cos(elapsed * 73) + Math.cos(elapsed * 113) * 0.6) * s * 0.9);
      this.camera.position.add(this.tmp);
      this.shake = Math.max(0, this.shake - dt * this.shakeDecay);
    }

    this.camera.lookAt(this.lookCurrent);

    // A touch of counter-roll on top of lookAt. Applied after, because lookAt
    // resets the roll channel every frame.
    this.roll = damp(this.roll, ship.bank * 0.42, 5, dt);
    this.camera.rotateZ(this.roll);

    const fov = BASE_FOV + (BOOST_FOV - BASE_FOV) * clamp(ship.boostAmount, 0, 1);
    if (Math.abs(this.camera.fov - fov) > 0.02) {
      this.camera.fov = damp(this.camera.fov, fov, 5, dt);
      this.camera.updateProjectionMatrix();
    }
  }
}
