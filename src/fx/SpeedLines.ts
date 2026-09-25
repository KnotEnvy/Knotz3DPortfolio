import * as THREE from 'three';

/**
 * Warp streaks: long thin lines rushing past the lens under boost.
 *
 * The composite pass already smears the frame radially, but a smear only ever
 * reads as blur — the eye needs discrete things going past to feel velocity.
 * Reviewers kept describing boost as "fine speckle" for exactly that reason.
 * These are the discrete things.
 *
 * Everything lives in camera space and is animated in the vertex shader from a
 * single phase uniform, so the CPU cost is one float per frame whatever the
 * line count. The lines sit in an annulus around the view axis, well outside
 * the ship and the reticle, so they frame the action rather than cross it.
 */

const COUNT = 140;
const DEPTH = 260;

const VERT = /* glsl */ `
  attribute vec4 aSeed;
  attribute float aEnd;
  uniform float uPhase;
  uniform float uLen;
  uniform float uAmount;
  varying float vFade;
  varying float vEnd;

  void main() {
    float z = -${DEPTH.toFixed(1)} + mod(aSeed.z * ${DEPTH.toFixed(1)} + uPhase, ${DEPTH.toFixed(1)});
    // Tail trails further from the lens than the head; length grows with speed.
    z -= (1.0 - aEnd) * uLen * aSeed.w;
    vec3 p = vec3(cos(aSeed.x) * aSeed.y, sin(aSeed.x) * aSeed.y * 0.7, z);
    // Fade in out of the distance and out before a line can touch the lens.
    float head = -${DEPTH.toFixed(1)} + mod(aSeed.z * ${DEPTH.toFixed(1)} + uPhase, ${DEPTH.toFixed(1)});
    vFade = smoothstep(-${DEPTH.toFixed(1)}, -${(DEPTH * 0.55).toFixed(1)}, head) * (1.0 - smoothstep(-14.0, -2.0, head)) * uAmount;
    vEnd = aEnd;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  varying float vFade;
  varying float vEnd;
  void main() {
    // Bright at the head, gone at the tail.
    gl_FragColor = vec4(uColor * vFade * vEnd * vEnd, 1.0);
  }
`;

export class SpeedLines {
  readonly object: THREE.LineSegments;
  private mat: THREE.ShaderMaterial;
  private geo: THREE.BufferGeometry;
  private phase = 0;
  private amount = 0;

  constructor() {
    const seed = new Float32Array(COUNT * 2 * 4);
    const end = new Float32Array(COUNT * 2);
    // Positions are computed in the shader; three still wants the attribute.
    const pos = new Float32Array(COUNT * 2 * 3);
    for (let i = 0; i < COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 14 + Math.pow(Math.random(), 0.7) * 34;
      const z = Math.random();
      const len = 0.5 + Math.random() * 0.8;
      for (let k = 0; k < 2; k++) {
        const o = (i * 2 + k) * 4;
        seed[o] = angle;
        seed[o + 1] = radius;
        seed[o + 2] = z;
        seed[o + 3] = len;
        end[i * 2 + k] = k;
      }
    }
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
    this.geo.setAttribute('aEnd', new THREE.BufferAttribute(end, 1));

    this.mat = new THREE.ShaderMaterial({
      uniforms: {
        uPhase: { value: 0 },
        uLen: { value: 20 },
        uAmount: { value: 0 },
        uColor: { value: new THREE.Color(0xbff6ff) },
      },
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });

    this.object = new THREE.LineSegments(this.geo, this.mat);
    this.object.frustumCulled = false;
    this.object.renderOrder = 5;
    this.object.visible = false;
  }

  /**
   * `boost` 0→1 is the main driver; `speed` adds a faint trace on a fast
   * transit; `warp` is the arrival burst, briefly stronger than any boost.
   */
  update(dt: number, speed: number, boost: number, warp: number, accent: THREE.Color): void {
    const target = Math.min(1.4, boost * 1.05 + Math.max(0, (speed - 96) / 60) * 0.25 + warp * 1.4);
    this.amount += (target - this.amount) * Math.min(1, dt * 6);
    this.object.visible = this.amount > 0.01;
    if (!this.object.visible) return;
    // Lines travel faster than the ship does: they are a feeling, not a
    // measurement, and at true speed they crawl.
    this.phase += dt * (speed * 2.4 + warp * 900);
    const u = this.mat.uniforms;
    // Wrapped on a whole number of cycles, so the wrap is invisible.
    u.uPhase.value = this.phase % (DEPTH * 100);
    u.uLen.value = 10 + boost * 38 + warp * 90;
    u.uAmount.value = this.amount * 0.55;
    (u.uColor.value as THREE.Color).setRGB(0.75, 0.95, 1).lerp(accent, 0.35);
  }

  dispose(): void {
    this.geo.dispose();
    this.mat.dispose();
  }
}
