import * as THREE from 'three';
import { mulberry32 } from '../core/Math';

const VERT = /* glsl */ `
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aPhase;
  uniform float uTime;
  uniform float uPixelRatio;
  varying vec3 vColor;
  varying float vTwinkle;

  void main() {
    vColor = aColor;
    vTwinkle = 0.65 + 0.35 * sin(uTime * 1.4 + aPhase);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uPixelRatio * (260.0 / max(-mv.z, 1.0));
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vTwinkle;

  void main() {
    vec2 d = gl_PointCoord - 0.5;
    float r = length(d);
    if (r > 0.5) discard;
    // Soft core with a wide falloff halo.
    float core = smoothstep(0.5, 0.0, r);
    float halo = smoothstep(0.5, 0.15, r);
    gl_FragColor = vec4(vColor * (core * 0.6 + halo * 1.4) * vTwinkle, core);
  }
`;

/**
 * Deterministic point-cloud starfield wrapped around the play volume. The seed
 * is fixed so the sky is identical on every visit — it is scenery, not noise.
 */
export class Starfield {
  readonly object: THREE.Points;
  private material: THREE.ShaderMaterial;

  constructor(count: number, pixelRatio: number) {
    const rnd = mulberry32(0x5163);
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const size = new Float32Array(count);
    const phase = new Float32Array(count);

    const palette = [
      new THREE.Color(0x9fd6ff),
      new THREE.Color(0xffffff),
      new THREE.Color(0x4de1c1),
      new THREE.Color(0xff8fbf),
      new THREE.Color(0xffd9a0),
    ];

    for (let i = 0; i < count; i++) {
      // Spread through a long box that encloses the whole sector corridor.
      pos[i * 3 + 0] = (rnd() - 0.5) * 2600;
      pos[i * 3 + 1] = (rnd() - 0.5) * 1100;
      pos[i * 3 + 2] = rnd() * -2600 + 400;

      const c = palette[(rnd() * palette.length) | 0];
      const dim = 0.45 + rnd() * 0.55;
      col[i * 3 + 0] = c.r * dim;
      col[i * 3 + 1] = c.g * dim;
      col[i * 3 + 2] = c.b * dim;

      size[i] = 0.7 + rnd() * rnd() * 3.4;
      phase[i] = rnd() * Math.PI * 2;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: pixelRatio },
      },
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.object = new THREE.Points(geo, this.material);
    this.object.frustumCulled = false;
  }

  update(elapsed: number, pixelRatio: number): void {
    this.material.uniforms.uTime.value = elapsed;
    this.material.uniforms.uPixelRatio.value = pixelRatio;
  }

  dispose(): void {
    this.object.geometry.dispose();
    this.material.dispose();
  }
}
