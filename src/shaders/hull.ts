import * as THREE from 'three';

/**
 * The look of every solid object in this world.
 *
 * Standard PBR materials need real lights and an environment map to stop
 * looking like grey clay, and both are expensive on a phone. This does the
 * opposite: a near-black body, two hard-coded directional terms for shape, and
 * a Fresnel rim that lights every silhouette edge in the object's accent
 * colour. The result reads as machined neon hardware, costs one cheap shader,
 * and — because the rim is brightest exactly where the object meets the
 * background — it survives bloom without smearing into a white blob.
 */

export interface HullOptions {
  /** Accent colour: the rim, the emissive seams and the hit flash tint. */
  color: number;
  /** Body colour. Defaults to a very dark blue so the rim does the work. */
  base?: number;
  /** Rim intensity. 1 is assertive; 0.4 is background scenery. */
  rim?: number;
  /** Fresnel exponent. Higher is a tighter, sharper edge. */
  power?: number;
  /** Adds a travelling scanline band up the object's local Y. */
  scan?: boolean;
  /**
   * Panel-line density in local units. 0 disables. This is what stops every
   * surface reading as untextured plastic: without it the whole scene is one
   * fresnel formula repeated, and no amount of bloom makes that look built.
   */
  panel?: number;
  /** Emissive floor, so the body itself glows a little. */
  glow?: number;
  transparent?: boolean;
  opacity?: number;
}

const VERT = /* glsl */ `
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  varying vec3 vLocal;
  varying float vDepth;

  void main() {
    vLocal = position;
    #ifdef USE_INSTANCING
      vec4 world = modelMatrix * instanceMatrix * vec4(position, 1.0);
      vNormalW = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
    #else
      vec4 world = modelMatrix * vec4(position, 1.0);
      vNormalW = normalize(mat3(modelMatrix) * normal);
    #endif
    vViewDir = normalize(cameraPosition - world.xyz);
    vec4 mv = viewMatrix * world;
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAG = /* glsl */ `
  precision highp float;

  uniform vec3 uColor;
  uniform vec3 uBase;
  uniform float uRim;
  uniform float uPower;
  uniform float uGlow;
  uniform float uTime;
  uniform float uHit;
  uniform float uScan;
  uniform float uOpacity;
  uniform vec3 uFogColor;
  uniform float uFogDensity;
  uniform float uPanel;

  varying vec3 vNormalW;
  varying vec3 vViewDir;
  varying vec3 vLocal;
  varying float vDepth;

  void main() {
    vec3 N = normalize(vNormalW);
    vec3 V = normalize(vViewDir);

    // Two fixed lights: a cool key from high right, a warm fill from low left.
    // Hard-coded because the whole scene shares one lighting story and a real
    // light rig would only ever be told to reproduce this.
    float key = max(dot(N, normalize(vec3(0.45, 0.8, 0.35))), 0.0);
    float fill = max(dot(N, normalize(vec3(-0.6, -0.25, -0.7))), 0.0);

    float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), uPower);

    vec3 col = uBase * (0.22 + key * 0.75 + fill * 0.3);

    /*
     * Procedural panelling.
     *
     * Triplanar so it works on any shape without UVs, and weighted by the
     * surface normal so the lines run across faces rather than smearing down
     * them. Two frequencies: wide plates, and a finer seam every fourth plate.
     *
     * This is the cheapest available answer to "everything is flat emissive
     * with no material variation" — it gives every hull, prop, enemy and
     * landmark a sense of being fabricated out of parts, from one extra dozen
     * instructions, with no texture fetch and no extra draw.
     */
    if (uPanel > 0.0) {
      vec3 p = vLocal / uPanel;
      vec3 seam = abs(fract(p) - 0.5);
      vec3 fw = fwidth(p) * 1.5;
      vec3 lines = 1.0 - smoothstep(vec3(0.0), max(fw, vec3(0.015)), seam);
      vec3 an = abs(N);
      // Triplanar weights: a line only counts on the two axes across the face.
      float plate = clamp(lines.x * (1.0 - an.x) + lines.y * (1.0 - an.y) + lines.z * (1.0 - an.z), 0.0, 1.0);

      vec3 q = p * 0.25;
      vec3 seam2 = abs(fract(q) - 0.5);
      vec3 fw2 = fwidth(q) * 1.5;
      vec3 lines2 = 1.0 - smoothstep(vec3(0.0), max(fw2, vec3(0.01)), seam2);
      float major = clamp(lines2.x * (1.0 - an.x) + lines2.y * (1.0 - an.y) + lines2.z * (1.0 - an.z), 0.0, 1.0);

      /*
       * Seam lines are high frequency, and high frequency is exactly what
       * distance destroys. Worse than destroys: once a plate is about a pixel
       * across, every fragment is "on a line", plate saturates to 1, and the
       * whole surface goes uniformly dark — panelling that actively makes
       * things look worse the further away they are. Fade the line terms out
       * before they reach that point.
       */
      float cellPx = max(max(fw.x, fw.y), fw.z);
      float lineFade = 1.0 - smoothstep(0.22, 0.5, cellPx);

      // Recessed seams read as shadow; the wider joins pick up a little of the
      // accent, as though light is leaking out of the structure.
      col *= 1.0 - plate * 0.62 * lineFade;
      col += uColor * major * 0.28 * lineFade;

      /*
       * Per-plate tone, which is what actually carries the material story at
       * gameplay range. Reviewers kept saying the panelling "all but disappears
       * under fog and bloom" at combat distance, and they were right: lines
       * alone cannot survive it. Plate *values* are low frequency, so they
       * survive any distance the geometry itself does — a distant hull reads as
       * assembled out of slightly mismatched panels rather than as one flat
       * shape, which is the whole point.
       */
      vec3 cell = floor(p);
      float tone = fract(sin(dot(cell, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
      col *= 0.90 + tone * 0.20;
    }

    col += uColor * fres * uRim * 1.9;
    col += uColor * uGlow;

    // Travelling band: reads as data moving through the structure.
    if (uScan > 0.5) {
      float band = smoothstep(0.9, 1.0, sin(vLocal.y * 0.22 - uTime * 1.7) * 0.5 + 0.5);
      col += uColor * band * 0.28;
    }

    // Damage flash: blow the whole surface toward white on a hit so the player
    // gets unambiguous feedback even when the impact particles are off-screen.
    col = mix(col, vec3(2.4), uHit * 0.8);

    // Exponential-squared fog, matching three's own FogExp2 so custom-shaded
    // objects sit in the same atmosphere as everything else.
    //
    // This is doing far more work than "a bit of haze". Without it nothing in
    // the scene recedes: a structure six hundred metres down a curving corridor
    // renders exactly as crisp as the ship, so it reads as an object directly in
    // front of the player rather than as distant scenery, and the corridor loses
    // all sense of depth.
    float fogFactor = 1.0 - exp(-pow(uFogDensity * vDepth, 2.0));
    col = mix(col, uFogColor, clamp(fogFactor, 0.0, 1.0));

    gl_FragColor = vec4(col, uOpacity);
  }
`;

export type HullMaterial = THREE.ShaderMaterial & {
  /** Push toward 1 on impact; decay it yourself each frame. */
  hit: number;
};

export function hullMaterial(opts: HullOptions): HullMaterial {
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(opts.color) },
      uBase: { value: new THREE.Color(opts.base ?? 0x080d18) },
      uRim: { value: opts.rim ?? 1 },
      uPower: { value: opts.power ?? 2.6 },
      uGlow: { value: opts.glow ?? 0.05 },
      uTime: { value: 0 },
      uHit: { value: 0 },
      uScan: { value: opts.scan ? 1 : 0 },
      uOpacity: { value: opts.opacity ?? 1 },
      uFogColor: { value: new THREE.Color(0x05070f) },
      uFogDensity: { value: 0 },
      uPanel: { value: opts.panel ?? 0 },
    },
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: opts.transparent ?? false,
  }) as HullMaterial;

  mat.hit = 0;
  registry.add(mat);
  return mat;
}

/**
 * Every hull material ever created, so the world can push one fog setting into
 * all of them. A WeakSet would be tidier but this needs to be iterable, and the
 * set is bounded by the number of distinct materials in the scene (tens).
 */
const registry = new Set<HullMaterial>();

/** Apply the scene's fog to every hull material. Called once per frame. */
export function setHullFog(color: THREE.Color, density: number): void {
  for (const m of registry) {
    (m.uniforms.uFogColor.value as THREE.Color).copy(color);
    m.uniforms.uFogDensity.value = density;
  }
}

/** Drop materials that have been disposed, so the registry cannot grow forever. */
export function forgetHullMaterial(mat: HullMaterial): void {
  registry.delete(mat);
}

/** Decay every hull material's flash. Called once per frame with the set in use. */
export function decayHits(mats: HullMaterial[], dt: number, elapsed: number): void {
  for (const m of mats) {
    if (m.hit > 0) {
      m.hit = Math.max(0, m.hit - dt * 4.5);
      m.uniforms.uHit.value = m.hit;
    }
    m.uniforms.uTime.value = elapsed;
  }
}

/**
 * Additive glow for beams, halos, engine bells and anything that is pure light.
 * Kept as one factory so bloom behaves consistently across the whole scene.
 */
export function glowMaterial(color: number, opacity = 1): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
}
