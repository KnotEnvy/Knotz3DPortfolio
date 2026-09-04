import * as THREE from 'three';

/**
 * Shockwave rings and camera-facing flash discs.
 *
 * Particles alone make an explosion look like confetti. What sells a detonation
 * is the silhouette work around it: an expanding ring that thins as it grows,
 * and a bright disc that blooms hard for two frames and is gone. Both are
 * pooled instanced meshes, so twenty simultaneous explosions are still two
 * draw calls.
 */

const RINGS = 24;
const FLASHES = 24;

interface Slot {
  active: boolean;
  age: number;
  ttl: number;
  radius: number;
  origin: THREE.Vector3;
  /** Ring orientation, or identity for camera-facing flashes. */
  quat: THREE.Quaternion;
  color: THREE.Color;
  width: number;
}

const makeSlots = (n: number): Slot[] =>
  Array.from({ length: n }, () => ({
    active: false,
    age: 0,
    ttl: 1,
    radius: 1,
    origin: new THREE.Vector3(),
    quat: new THREE.Quaternion(),
    color: new THREE.Color(),
    width: 1,
  }));

export class Impacts {
  readonly object = new THREE.Group();

  private ringMesh: THREE.InstancedMesh;
  private flashMesh: THREE.InstancedMesh;
  private ringGeo: THREE.BufferGeometry;
  private flashGeo: THREE.BufferGeometry;
  private ringMat: THREE.MeshBasicMaterial;
  private flashMat: THREE.ShaderMaterial;

  private rings = makeSlots(RINGS);
  private flashes = makeSlots(FLASHES);

  private m = new THREE.Matrix4();
  private s = new THREE.Vector3();
  private q = new THREE.Quaternion();
  private hidden = new THREE.Vector3(0, 0, 0);

  constructor() {
    // A thin annulus. Scaling it uniformly grows the ring; the shader-free
    // material means opacity has to be per-instance, which is what instanceColor
    // is doing here — colour doubles as brightness.
    this.ringGeo = new THREE.RingGeometry(0.86, 1, 64);
    this.ringMat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
      vertexColors: false,
    });
    this.ringMesh = new THREE.InstancedMesh(this.ringGeo, this.ringMat, RINGS);
    this.ringMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.ringMesh.frustumCulled = false;
    this.ringMesh.count = RINGS;

    // Flash disc with a radial falloff baked into the shader so one quad reads
    // as a spherical light burst.
    this.flashGeo = new THREE.PlaneGeometry(1, 1);
    this.flashMat = new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: /* glsl */ `
        attribute vec3 aTint;
        varying vec2 vUv;
        varying vec3 vTint;
        void main() {
          vUv = uv;
          vTint = aTint;
          gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;
        varying vec2 vUv;
        varying vec3 vTint;
        void main() {
          float r = length(vUv - 0.5) * 2.0;
          if (r > 1.0) discard;
          float core = pow(1.0 - r, 2.4);
          gl_FragColor = vec4(vTint * (core * 2.6 + (1.0 - r) * 0.5), core);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.flashMesh = new THREE.InstancedMesh(this.flashGeo, this.flashMat, FLASHES);
    this.flashMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.flashMesh.frustumCulled = false;
    this.flashMesh.count = FLASHES;

    // Per-instance tint for both meshes; brightness is folded into the colour
    // because there is no per-instance opacity in instanced rendering.
    const ringTint = new Float32Array(RINGS * 3);
    this.ringMesh.instanceColor = new THREE.InstancedBufferAttribute(ringTint, 3);
    const flashTint = new Float32Array(FLASHES * 3);
    this.flashGeo.setAttribute('aTint', new THREE.InstancedBufferAttribute(flashTint, 3));

    // Everything starts collapsed to nothing rather than hidden, so no
    // per-frame visibility churn is needed.
    for (let i = 0; i < RINGS; i++) this.ringMesh.setMatrixAt(i, this.m.identity().scale(this.hidden));
    for (let i = 0; i < FLASHES; i++) this.flashMesh.setMatrixAt(i, this.m.identity().scale(this.hidden));

    this.object.add(this.ringMesh, this.flashMesh);
  }

  private take(slots: Slot[]): Slot | null {
    for (const s of slots) if (!s.active) return s;
    // Under pressure, steal the oldest rather than dropping the newest — a
    // missing explosion is far more noticeable than a truncated one.
    let oldest = slots[0];
    for (const s of slots) if (s.age / s.ttl > oldest.age / oldest.ttl) oldest = s;
    return oldest;
  }

  /** Expanding ring oriented perpendicular to `normal`. */
  ring(origin: THREE.Vector3, radius: number, color: number, ttl = 0.55, normal?: THREE.Vector3): void {
    const s = this.take(this.rings);
    if (!s) return;
    s.active = true;
    s.age = 0;
    s.ttl = ttl;
    s.radius = radius;
    s.origin.copy(origin);
    s.color.set(color);
    s.width = 1;
    if (normal) {
      s.quat.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal.clone().normalize());
    } else {
      s.quat.identity();
    }
  }

  /** Camera-facing bright disc. */
  flash(origin: THREE.Vector3, radius: number, color: number, ttl = 0.24): void {
    const s = this.take(this.flashes);
    if (!s) return;
    s.active = true;
    s.age = 0;
    s.ttl = ttl;
    s.radius = radius;
    s.origin.copy(origin);
    s.color.set(color);
  }

  /** The full package: flash, two offset rings, for a real detonation. */
  explosion(origin: THREE.Vector3, scale: number, color: number, accent = 0xffffff): void {
    this.flash(origin, scale * 3.4, color, 0.26);
    this.flash(origin, scale * 1.5, accent, 0.16);
    this.ring(origin, scale * 5.5, color, 0.52);
    this.ring(origin, scale * 3.2, accent, 0.36);
  }

  update(dt: number, camera: THREE.Camera): void {
    const ringTint = this.ringMesh.instanceColor!;
    for (let i = 0; i < RINGS; i++) {
      const s = this.rings[i];
      if (!s.active) continue;
      s.age += dt;
      const t = s.age / s.ttl;
      if (t >= 1) {
        s.active = false;
        this.m.identity().scale(this.hidden);
        this.ringMesh.setMatrixAt(i, this.m);
        continue;
      }
      // Fast out, slow stop: 1 - (1-t)^3.
      const e = 1 - Math.pow(1 - t, 3);
      const r = s.radius * (0.12 + e * 0.88);
      // Fade as it grows, squared so the last third is nearly gone.
      const bright = Math.pow(1 - t, 2.2) * 2.2;
      this.s.set(r, r, r);
      this.m.compose(s.origin, s.quat, this.s);
      this.ringMesh.setMatrixAt(i, this.m);
      ringTint.setXYZ(i, s.color.r * bright, s.color.g * bright, s.color.b * bright);
    }
    this.ringMesh.instanceMatrix.needsUpdate = true;
    ringTint.needsUpdate = true;

    const flashTint = this.flashGeo.getAttribute('aTint') as THREE.InstancedBufferAttribute;
    camera.getWorldQuaternion(this.q);
    for (let i = 0; i < FLASHES; i++) {
      const s = this.flashes[i];
      if (!s.active) continue;
      s.age += dt;
      const t = s.age / s.ttl;
      if (t >= 1) {
        s.active = false;
        this.m.identity().scale(this.hidden);
        this.flashMesh.setMatrixAt(i, this.m);
        continue;
      }
      // Punch open in the first 20% of life, then decay.
      const grow = t < 0.2 ? t / 0.2 : 1;
      const r = s.radius * (0.4 + grow * 0.6) * (1 + t * 0.5);
      const bright = Math.pow(1 - t, 1.6) * 1.8;
      this.s.set(r, r, r);
      this.m.compose(s.origin, this.q, this.s);
      this.flashMesh.setMatrixAt(i, this.m);
      flashTint.setXYZ(i, s.color.r * bright, s.color.g * bright, s.color.b * bright);
    }
    this.flashMesh.instanceMatrix.needsUpdate = true;
    flashTint.needsUpdate = true;
  }

  clear(): void {
    for (const s of this.rings) s.active = false;
    for (const s of this.flashes) s.active = false;
    for (let i = 0; i < RINGS; i++) this.ringMesh.setMatrixAt(i, this.m.identity().scale(this.hidden));
    for (let i = 0; i < FLASHES; i++) this.flashMesh.setMatrixAt(i, this.m.identity().scale(this.hidden));
    this.ringMesh.instanceMatrix.needsUpdate = true;
    this.flashMesh.instanceMatrix.needsUpdate = true;
  }

  dispose(): void {
    this.ringGeo.dispose();
    this.flashGeo.dispose();
    this.ringMat.dispose();
    this.flashMat.dispose();
    this.ringMesh.dispose();
    this.flashMesh.dispose();
  }
}
