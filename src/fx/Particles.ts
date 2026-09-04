import * as THREE from 'three';

/**
 * One pooled GPU point-sprite system for every particle in the game:
 * explosions, sparks, muzzle flashes, engine wash, shard bursts, node debris.
 *
 * Design notes that matter:
 *  - Fixed-size typed arrays, allocated once. Nothing in this file allocates
 *    during play, so there is no GC sawtooth in the frame graph.
 *  - Simulation runs on the CPU (a few thousand particles is nothing) but the
 *    *rendering* is a single draw call with a custom shader, so overdraw and
 *    fill are the only real costs.
 *  - Particles are drawn additively with a soft radial falloff and no depth
 *    write, which is what lets bloom turn a dense burst into a genuine
 *    hot core rather than a cloud of visible sprites.
 */

const MAX = 5000;

const VERT = /* glsl */ `
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aLife;

  uniform float uPixelRatio;
  uniform float uScale;

  varying vec3 vColor;
  varying float vLife;

  void main() {
    vColor = aColor;
    vLife = aLife;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    // Shrink as the particle dies, and scale with perspective.
    float s = aSize * uScale * (0.25 + 0.75 * aLife);
    gl_PointSize = s * uPixelRatio * (300.0 / max(-mv.z, 1.0));
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  varying vec3 vColor;
  varying float vLife;

  void main() {
    vec2 d = gl_PointCoord - 0.5;
    float r = length(d);
    if (r > 0.5) discard;
    // Hot core plus a wide soft halo: the core is what bloom latches onto.
    float core = smoothstep(0.5, 0.02, r);
    float halo = smoothstep(0.5, 0.2, r);
    float a = vLife * vLife;
    gl_FragColor = vec4(vColor * (core * 1.8 + halo * 0.9), a * core);
  }
`;

export interface BurstOptions {
  count: number;
  color: THREE.Color | number;
  /** Metres per second, randomised per particle up to this. */
  speed: number;
  /** Seconds. */
  life: number;
  size: number;
  /** Velocity inherited from whatever spawned the burst. */
  inherit?: THREE.Vector3;
  /** 0 = isotropic sphere, 1 = tight cone along `dir`. */
  focus?: number;
  dir?: THREE.Vector3;
  /** Per-second velocity damping. 0 keeps momentum, 4 stops almost at once. */
  drag?: number;
  /** Secondary colour; particles lerp between the two randomly. */
  color2?: THREE.Color | number;
  /** Downward pull, for debris that should fall out of a blast. */
  gravity?: number;
}

export class Particles {
  readonly object: THREE.Points;

  private geo: THREE.BufferGeometry;
  private mat: THREE.ShaderMaterial;

  private pos: Float32Array;
  private col: Float32Array;
  private size: Float32Array;
  private lifeAttr: Float32Array;

  private vel: Float32Array;
  private age: Float32Array;
  private ttl: Float32Array;
  private drag: Float32Array;
  private grav: Float32Array;

  /** Ring-buffer cursor. Oldest particles are recycled under pressure. */
  private cursor = 0;
  private live = 0;

  private cA = new THREE.Color();
  private cB = new THREE.Color();
  private tmp = new THREE.Vector3();

  constructor(pixelRatio: number, private budget = MAX) {
    const n = this.budget;
    this.pos = new Float32Array(n * 3);
    this.col = new Float32Array(n * 3);
    this.size = new Float32Array(n);
    this.lifeAttr = new Float32Array(n);
    this.vel = new Float32Array(n * 3);
    this.age = new Float32Array(n);
    this.ttl = new Float32Array(n);
    this.drag = new Float32Array(n);
    this.grav = new Float32Array(n);

    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.geo.setAttribute('aColor', new THREE.BufferAttribute(this.col, 3));
    this.geo.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1));
    this.geo.setAttribute('aLife', new THREE.BufferAttribute(this.lifeAttr, 1));
    this.geo.setDrawRange(0, 0);

    this.mat = new THREE.ShaderMaterial({
      uniforms: {
        uPixelRatio: { value: pixelRatio },
        uScale: { value: 1 },
      },
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.object = new THREE.Points(this.geo, this.mat);
    this.object.frustumCulled = false;
  }

  get count(): number {
    return this.live;
  }

  burst(origin: THREE.Vector3, o: BurstOptions): void {
    this.cA.set(o.color as THREE.ColorRepresentation);
    this.cB.set((o.color2 ?? o.color) as THREE.ColorRepresentation);

    const focus = o.focus ?? 0;
    const dir = o.dir;
    const n = Math.min(o.count, this.budget);

    for (let k = 0; k < n; k++) {
      const i = this.cursor;
      this.cursor = (this.cursor + 1) % this.budget;

      const o3 = i * 3;
      this.pos[o3 + 0] = origin.x;
      this.pos[o3 + 1] = origin.y;
      this.pos[o3 + 2] = origin.z;

      // Uniform point on a sphere, then optionally bent toward `dir`.
      const u = Math.random() * 2 - 1;
      const th = Math.random() * Math.PI * 2;
      const s = Math.sqrt(Math.max(0, 1 - u * u));
      this.tmp.set(s * Math.cos(th), s * Math.sin(th), u);
      if (dir && focus > 0) {
        this.tmp.lerp(dir, focus).normalize();
      }

      // Cubed random gives a dense core with a few fast outliers, which is what
      // real debris looks like — a flat distribution reads as a fuzzy ball.
      const r = Math.random();
      const speed = o.speed * (0.25 + r * r * 0.75);
      this.vel[o3 + 0] = this.tmp.x * speed + (o.inherit?.x ?? 0);
      this.vel[o3 + 1] = this.tmp.y * speed + (o.inherit?.y ?? 0);
      this.vel[o3 + 2] = this.tmp.z * speed + (o.inherit?.z ?? 0);

      const mix = Math.random();
      this.col[o3 + 0] = this.cA.r + (this.cB.r - this.cA.r) * mix;
      this.col[o3 + 1] = this.cA.g + (this.cB.g - this.cA.g) * mix;
      this.col[o3 + 2] = this.cA.b + (this.cB.b - this.cA.b) * mix;

      this.size[i] = o.size * (0.55 + Math.random() * 0.9);
      this.ttl[i] = o.life * (0.6 + Math.random() * 0.7);
      this.age[i] = 0;
      this.lifeAttr[i] = 1;
      this.drag[i] = o.drag ?? 1.2;
      this.grav[i] = o.gravity ?? 0;
    }

    this.live = Math.min(this.budget, this.live + n);
  }

  /** A short directional spray — muzzle flashes and thruster wash. */
  jet(origin: THREE.Vector3, dir: THREE.Vector3, color: number, count = 6, speed = 26): void {
    this.burst(origin, {
      count,
      color,
      speed,
      life: 0.28,
      size: 2.2,
      dir,
      focus: 0.86,
      drag: 5,
    });
  }

  update(dt: number): void {
    if (this.live === 0) {
      this.geo.setDrawRange(0, 0);
      return;
    }

    let highest = 0;
    let alive = 0;

    for (let i = 0; i < this.budget; i++) {
      if (this.lifeAttr[i] <= 0) continue;

      this.age[i] += dt;
      const t = this.age[i] / this.ttl[i];
      if (t >= 1) {
        this.lifeAttr[i] = 0;
        continue;
      }

      const o3 = i * 3;
      const d = Math.exp(-this.drag[i] * dt);
      this.vel[o3 + 0] *= d;
      this.vel[o3 + 1] = this.vel[o3 + 1] * d - this.grav[i] * dt;
      this.vel[o3 + 2] *= d;

      this.pos[o3 + 0] += this.vel[o3 + 0] * dt;
      this.pos[o3 + 1] += this.vel[o3 + 1] * dt;
      this.pos[o3 + 2] += this.vel[o3 + 2] * dt;

      // Ease-out fade so the tail of a burst lingers as embers.
      this.lifeAttr[i] = 1 - t * t;
      alive++;
      highest = i;
    }

    this.live = alive;
    const n = alive > 0 ? highest + 1 : 0;
    this.geo.setDrawRange(0, n);
    if (n > 0) {
      (this.geo.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
      (this.geo.getAttribute('aColor') as THREE.BufferAttribute).needsUpdate = true;
      (this.geo.getAttribute('aSize') as THREE.BufferAttribute).needsUpdate = true;
      (this.geo.getAttribute('aLife') as THREE.BufferAttribute).needsUpdate = true;
    }
  }

  setPixelRatio(px: number): void {
    this.mat.uniforms.uPixelRatio.value = px;
  }

  /** Quality tiers scale every particle down rather than dropping the system. */
  setScale(s: number): void {
    this.mat.uniforms.uScale.value = s;
  }

  clear(): void {
    this.lifeAttr.fill(0);
    this.live = 0;
    this.geo.setDrawRange(0, 0);
  }

  dispose(): void {
    this.geo.dispose();
    this.mat.dispose();
  }
}
