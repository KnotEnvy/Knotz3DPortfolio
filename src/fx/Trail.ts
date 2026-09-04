import * as THREE from 'three';

/**
 * A ribbon trail behind a moving object.
 *
 * Built from a rolling history of world positions, expanded into a triangle
 * strip that always faces the camera. The width tapers and the colour fades
 * along the tail, so a banking ship leaves a readable arc of light rather than
 * a hard line. This is what makes the flying look fast at any speed.
 */
export class Trail {
  readonly object: THREE.Mesh;

  private geo: THREE.BufferGeometry;
  private mat: THREE.ShaderMaterial;
  private points: THREE.Vector3[] = [];
  private pos: Float32Array;
  private prog: Float32Array;
  private head = 0;
  private filled = 0;

  private tmpDir = new THREE.Vector3();
  private tmpSide = new THREE.Vector3();
  private toCam = new THREE.Vector3();

  constructor(
    private segments: number,
    private width: number,
    color: number,
    private minStep = 0.6,
  ) {
    const verts = segments * 2;
    this.pos = new Float32Array(verts * 3);
    this.prog = new Float32Array(verts);

    for (let i = 0; i < segments; i++) this.points.push(new THREE.Vector3());

    const index: number[] = [];
    for (let i = 0; i < segments - 1; i++) {
      const a = i * 2;
      index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }

    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.geo.setAttribute('aProg', new THREE.BufferAttribute(this.prog, 1));
    this.geo.setIndex(index);
    this.geo.setDrawRange(0, 0);

    this.mat = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(color) },
        uHot: { value: new THREE.Color(0xffffff) },
        uIntensity: { value: 1 },
      },
      vertexShader: /* glsl */ `
        attribute float aProg;
        varying float vProg;
        varying float vDepth;
        void main() {
          vProg = aProg;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vDepth = -mv.z;
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;
        uniform vec3 uColor;
        uniform vec3 uHot;
        uniform float uIntensity;
        varying float vProg;
        varying float vDepth;
        void main() {
          // vProg is 1 at the nozzle, 0 at the tail.
          float a = pow(vProg, 1.7);

          // The chase camera sits *behind* the ship, so the tail of this ribbon
          // runs straight through the lens — and a two-metre-wide strip a metre
          // from the near plane fills a third of the screen. Fading by view
          // depth is what keeps the trail a trail instead of a fog bank.
          a *= smoothstep(8.0, 34.0, vDepth);

          vec3 c = mix(uColor, uHot, pow(vProg, 3.0));
          gl_FragColor = vec4(c * (a * 2.2) * uIntensity, a * 0.85 * uIntensity);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });

    this.object = new THREE.Mesh(this.geo, this.mat);
    this.object.frustumCulled = false;
  }

  /** Jump the whole trail to a point — use on spawn or after a warp. */
  reset(at: THREE.Vector3): void {
    for (const p of this.points) p.copy(at);
    this.head = 0;
    this.filled = 0;
    this.geo.setDrawRange(0, 0);
  }

  setIntensity(v: number): void {
    this.mat.uniforms.uIntensity.value = v;
  }

  /**
   * Push a new head position. Samples are only recorded once the object has
   * actually travelled `minStep`, so a stationary object does not collapse the
   * ribbon into a single degenerate point.
   */
  update(head: THREE.Vector3, camera: THREE.Camera): void {
    const last = this.points[this.head];
    if (this.filled === 0 || last.distanceToSquared(head) > this.minStep * this.minStep) {
      this.head = (this.head + 1) % this.segments;
      this.points[this.head].copy(head);
      this.filled = Math.min(this.segments, this.filled + 1);
    } else {
      // Keep the nozzle glued to the object between samples.
      this.points[this.head].copy(head);
    }

    if (this.filled < 3) {
      this.geo.setDrawRange(0, 0);
      return;
    }

    const camPos = camera.getWorldPosition(this.toCam);

    for (let i = 0; i < this.filled; i++) {
      // Walk backwards from the head so index 0 is always the newest vertex.
      const idx = (this.head - i + this.segments * 2) % this.segments;
      const p = this.points[idx];
      const nextIdx = (idx - 1 + this.segments) % this.segments;
      const prevIdx = (idx + 1) % this.segments;

      this.tmpDir.subVectors(this.points[prevIdx], this.points[nextIdx]);
      if (this.tmpDir.lengthSq() < 1e-8) this.tmpDir.set(0, 0, 1);
      this.tmpDir.normalize();

      // Side vector faces the camera: the ribbon is always broadside on.
      this.tmpSide.subVectors(camPos, p).cross(this.tmpDir);
      if (this.tmpSide.lengthSq() < 1e-8) this.tmpSide.set(1, 0, 0);
      this.tmpSide.normalize();

      const prog = 1 - i / (this.filled - 1);
      const w = this.width * (0.15 + prog * 0.85);

      const o = i * 6;
      this.pos[o + 0] = p.x + this.tmpSide.x * w;
      this.pos[o + 1] = p.y + this.tmpSide.y * w;
      this.pos[o + 2] = p.z + this.tmpSide.z * w;
      this.pos[o + 3] = p.x - this.tmpSide.x * w;
      this.pos[o + 4] = p.y - this.tmpSide.y * w;
      this.pos[o + 5] = p.z - this.tmpSide.z * w;

      this.prog[i * 2 + 0] = prog;
      this.prog[i * 2 + 1] = prog;
    }

    this.geo.setDrawRange(0, (this.filled - 1) * 6);
    (this.geo.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    (this.geo.getAttribute('aProg') as THREE.BufferAttribute).needsUpdate = true;
  }

  dispose(): void {
    this.geo.dispose();
    this.mat.dispose();
  }
}
