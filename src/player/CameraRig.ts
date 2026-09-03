import * as THREE from 'three';
import { damp, clamp } from '../core/Math';
import type { Ship } from './Ship';

const BASE_FOV = 62;
const BOOST_FOV = 76;

/**
 * Chase camera with spring smoothing, boost FOV kick and a decaying shake
 * channel other systems can push into.
 */
export class CameraRig {
  private desired = new THREE.Vector3();
  private lookTarget = new THREE.Vector3();
  private lookCurrent = new THREE.Vector3();
  private offset = new THREE.Vector3(0, 3.6, 15.5);
  private shake = 0;
  private tmp = new THREE.Vector3();
  private initialised = false;

  constructor(private camera: THREE.PerspectiveCamera) {}

  addShake(amount: number): void {
    this.shake = Math.min(1.2, this.shake + amount);
  }

  snap(ship: Ship): void {
    this.computeDesired(ship);
    this.camera.position.copy(this.desired);
    this.lookCurrent.copy(this.lookTarget);
    this.camera.lookAt(this.lookCurrent);
    this.initialised = true;
  }

  private computeDesired(ship: Ship): void {
    this.desired.copy(this.offset).applyEuler(new THREE.Euler(ship.pitch * 0.5, ship.yaw, 0, 'YXZ'));
    this.desired.add(ship.object.position);

    ship.getForward(this.tmp);
    this.lookTarget.copy(ship.object.position).addScaledVector(this.tmp, 22);
  }

  update(ship: Ship, dt: number, elapsed: number): void {
    if (!this.initialised) {
      this.snap(ship);
      return;
    }
    this.computeDesired(ship);

    // Pull back slightly under boost for a sense of acceleration.
    this.offset.z = damp(this.offset.z, 15.5 + ship.boostAmount * 4.5, 3, dt);
    this.offset.y = damp(this.offset.y, 3.6 + ship.boostAmount * 0.8, 3, dt);

    this.camera.position.x = damp(this.camera.position.x, this.desired.x, 6.5, dt);
    this.camera.position.y = damp(this.camera.position.y, this.desired.y, 6.5, dt);
    this.camera.position.z = damp(this.camera.position.z, this.desired.z, 6.5, dt);

    this.lookCurrent.x = damp(this.lookCurrent.x, this.lookTarget.x, 9, dt);
    this.lookCurrent.y = damp(this.lookCurrent.y, this.lookTarget.y, 9, dt);
    this.lookCurrent.z = damp(this.lookCurrent.z, this.lookTarget.z, 9, dt);

    if (this.shake > 0.001) {
      const s = this.shake * this.shake;
      this.camera.position.x += Math.sin(elapsed * 61) * s * 0.6;
      this.camera.position.y += Math.cos(elapsed * 73) * s * 0.6;
      this.shake = Math.max(0, this.shake - dt * 1.8);
    }

    this.camera.lookAt(this.lookCurrent);
    this.camera.rotation.z += ship.roll * 0.35;

    const fov = BASE_FOV + (BOOST_FOV - BASE_FOV) * clamp(ship.boostAmount, 0, 1);
    if (Math.abs(this.camera.fov - fov) > 0.01) {
      this.camera.fov = damp(this.camera.fov, fov, 4, dt);
      this.camera.updateProjectionMatrix();
    }
  }
}
