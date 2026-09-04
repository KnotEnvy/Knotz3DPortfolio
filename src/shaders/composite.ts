import * as THREE from 'three';

/**
 * The final full-screen pass: radial speed streaks, chromatic aberration,
 * damage vignette, hit flash, film grain and a scanline.
 *
 * Every one of these is driven by a uniform the game writes each frame, which
 * is what makes the flying feel physical — the frame itself reacts to boost,
 * damage and explosions instead of the ship being the only thing that moves.
 */
export const CompositeShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    time: { value: 0 },
    resolution: { value: new THREE.Vector2(1, 1) },
    amount: { value: 0.028 },
    vignette: { value: 0.85 },
    /** 0→1 boost. Drives radial streaking and barrel-ish colour spread. */
    uBoost: { value: 0 },
    /** 0→1 recent damage. Red edge pulse. */
    uDamage: { value: 0 },
    /** 0→1 white screen flash for big explosions. */
    uFlash: { value: 0 },
    /** Accent colour of the current sector, used to tint the flash and edges. */
    uAccent: { value: new THREE.Color(0x4de1c1) },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    precision highp float;

    uniform sampler2D tDiffuse;
    uniform float time;
    uniform float amount;
    uniform float vignette;
    uniform float uBoost;
    uniform float uDamage;
    uniform float uFlash;
    uniform vec3 uAccent;
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

      // Radial streak. Six taps pulled toward the centre, weighted so the
      // frame edges smear hard under boost while the middle stays readable —
      // the cheapest convincing speed cue there is.
      float streak = uBoost * 0.06 + uFlash * 0.02;
      vec3 col = vec3(0.0);
      if (streak > 0.0005) {
        float total = 0.0;
        for (int i = 0; i < 6; i++) {
          float f = float(i) / 5.0;
          float w = 1.0 - f * 0.72;
          vec2 s = uv - c * f * streak * (0.35 + r2 * 2.2);
          col += texture2D(tDiffuse, s).rgb * w;
          total += w;
        }
        col /= total;
      } else {
        col = texture2D(tDiffuse, uv).rgb;
      }

      // Chromatic aberration, stronger toward the edges and under boost.
      float ca = (r2 * 0.0032) * (1.0 + uBoost * 2.6 + uFlash * 3.0);
      col.r = mix(col.r, texture2D(tDiffuse, uv + c * ca).r, 0.9);
      col.b = mix(col.b, texture2D(tDiffuse, uv - c * ca).b, 0.9);

      // Grain.
      float n = hash(uv * resolution + fract(time) * 373.0);
      col += (n - 0.5) * amount;

      // Vignette.
      col *= mix(1.0, 1.0 - r2 * 1.2, vignette);

      // Damage: a red rim that breathes, so low hull is felt before it is read.
      if (uDamage > 0.001) {
        float edge = smoothstep(0.06, 0.42, r2);
        float beat = 0.7 + 0.3 * sin(time * 7.0);
        col = mix(col, vec3(0.85, 0.06, 0.16), edge * uDamage * 0.65 * beat);
      }

      // Explosion flash, tinted with the sector accent so it never reads grey.
      col += mix(vec3(1.0), uAccent, 0.35) * uFlash * 0.55;

      // Scanline. Subtle enough to survive on a phone, present enough to sell
      // the terminal fiction on a desktop.
      col *= 1.0 - 0.012 * step(0.5, fract(uv.y * resolution.y * 0.5));

      gl_FragColor = vec4(col, 1.0);
    }
  `,
};
