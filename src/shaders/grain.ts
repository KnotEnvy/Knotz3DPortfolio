import * as THREE from 'three';

/**
 * Film grain + subtle vignette + chromatic edge shift. Costs one full-screen
 * pass and does more for the "expensive" feel of the scene than any amount of
 * extra geometry.
 */
export const GrainShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    time: { value: 0 },
    resolution: { value: new THREE.Vector2(1, 1) },
    amount: { value: 0.03 },
    vignette: { value: 0.9 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float time;
    uniform float amount;
    uniform float vignette;
    uniform vec2 resolution;
    varying vec2 vUv;

    float hash(vec2 p) {
      p = fract(p * vec2(443.897, 441.423));
      p += dot(p, p + 19.19);
      return fract(p.x * p.y);
    }

    void main() {
      vec2 uv = vUv;
      vec2 c = uv - 0.5;
      float r2 = dot(c, c);

      // Chromatic aberration grows toward the edges of the frame.
      float ca = r2 * 0.0035;
      vec3 col;
      col.r = texture2D(tDiffuse, uv + c * ca).r;
      col.g = texture2D(tDiffuse, uv).g;
      col.b = texture2D(tDiffuse, uv - c * ca).b;

      // Animated grain, resolution-independent.
      float n = hash(uv * resolution + fract(time) * 373.0);
      col += (n - 0.5) * amount;

      // Vignette.
      col *= mix(1.0, 1.0 - r2 * 1.15, vignette);

      // Faint scanline to sell the terminal aesthetic without hurting legibility.
      col *= 1.0 - 0.014 * step(0.5, fract(uv.y * resolution.y * 0.5));

      gl_FragColor = vec4(col, 1.0);
    }
  `,
};
