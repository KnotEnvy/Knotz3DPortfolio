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

      // Chromatic aberration, stronger toward the edges and under boost. Kept
      // subtle: the starfield is made of near-pixel-sized points, and splitting
      // a one-pixel feature by two pixels does not fringe it, it triples it into
      // three coloured dots and the whole sky turns to rainbow confetti.
      float ca = (r2 * 0.0014) * (1.0 + uBoost * 1.8 + uFlash * 1.6);

      // Radial streak. Taps are pulled toward the centre, weighted so the frame
      // edges smear hard under boost while the middle stays readable — the
      // cheapest convincing speed cue there is.
      //
      // The per-channel offsets are applied *inside* this loop on purpose. An
      // earlier version streaked into the colour and then re-sampled tDiffuse
      // for the red and blue channels afterwards, which threw the streak away on
      // two channels out of three and left boost looking green and noisy rather
      // than fast.
      // Boost has to read as direction, not as brightness. At 0.06 the radial
      // pull was subtle enough that the frame's speckle read as noise sitting on
      // a still image rather than as the frame moving — the streak has to be the
      // loudest thing about a boosted frame or the effect is doing nothing.
      float streak = uBoost * 0.105 + uFlash * 0.02;
      vec3 col;
      if (streak > 0.0005) {
        vec3 accum = vec3(0.0);
        float total = 0.0;
        for (int i = 0; i < 5; i++) {
          float f = float(i) / 4.0;
          float w = 1.0 - f * 0.72;
          vec2 base = uv - c * f * streak * (0.35 + r2 * 2.2);
          accum.r += texture2D(tDiffuse, base + c * ca).r * w;
          accum.g += texture2D(tDiffuse, base).g * w;
          accum.b += texture2D(tDiffuse, base - c * ca).b * w;
          total += w;
        }
        col = accum / total;
      } else {
        col.r = texture2D(tDiffuse, uv + c * ca).r;
        col.g = texture2D(tDiffuse, uv).g;
        col.b = texture2D(tDiffuse, uv - c * ca).b;
      }

      // Grain.
      float n = hash(uv * resolution + fract(time) * 373.0);
      col += (n - 0.5) * amount;

      // Vignette.
      col *= mix(1.0, 1.0 - r2 * 1.2, vignette);

      // Damage: a red rim that breathes, so low hull is felt before it is read.
      //
      // The stops matter. r2 only reaches 0.5 in the corners, so an inner stop
      // of 0.06 saturated across most of the frame — during a boss fight, where
      // sentries fire continuously, the whole screen sat under a red wash and
      // the sector's own colour identity disappeared. Keep it on the edges.
      if (uDamage > 0.001) {
        float edge = smoothstep(0.26, 0.5, r2);
        float beat = 0.7 + 0.3 * sin(time * 7.0);
        col = mix(col, vec3(0.85, 0.06, 0.16), edge * uDamage * 0.4 * beat);
      }

      // Explosion flash, tinted with the sector accent so it never reads grey.
      // Deliberately modest: a flash should be a punch you feel over a few
      // frames, not a white-out you have to sit through.
      col += mix(vec3(1.0), uAccent, 0.28) * uFlash * 0.34;

      // Scanline. Subtle enough to survive on a phone, present enough to sell
      // the terminal fiction on a desktop.
      col *= 1.0 - 0.012 * step(0.5, fract(uv.y * resolution.y * 0.5));

      gl_FragColor = vec4(col, 1.0);
    }
  `,
};
