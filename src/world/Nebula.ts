import * as THREE from 'three';

/**
 * The sky.
 *
 * A flat clear colour behind a starfield is what made the first draft read as
 * "a few objects in a void". This is an inverted sphere locked to the camera,
 * shading a layered fractal-noise nebula whose two dominant colours are lerped
 * as the ship travels — so every sector genuinely looks like a different region
 * of space rather than the same black box with different props in it.
 *
 * The noise is value noise with analytic smoothing, four octaves, plus a second
 * warped lookup for the wispy filaments. Two texture-free noise fields at
 * skybox resolution cost far less than any equivalent cubemap download.
 */

const VERT = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = position;
    // Skybox: strip translation, keep rotation, force to the far plane.
    vec4 p = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.0);
    gl_Position = p.xyww;
  }
`;

const FRAG = /* glsl */ `
  precision highp float;

  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uDeep;
  uniform float uTime;
  uniform float uDensity;
  uniform vec3 uEye;
  varying vec3 vDir;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i + vec3(0, 0, 0)), hash(i + vec3(1, 0, 0)), f.x),
          mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
      mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x),
          mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y),
      f.z);
  }

  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p *= 2.03;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec3 d = normalize(vDir);

    // Very slow drift keeps the sky alive without ever drawing attention.
    /*
     * Parallax.
     *
     * A skybox is pinned to the camera's rotation and nothing else, so for the
     * whole length of a six-sector flight the backdrop is rigid: the ship moves
     * thousands of units and the sky behind it does not shift by a pixel. That
     * is why the corridor read as objects in a void — everything with depth cues
     * was in the foreground, and the largest surface in frame was flat.
     *
     * True parallax is impossible on a sphere at the far plane, but the noise
     * field it samples is volumetric, so drifting the sample point with the
     * camera gives the same read for one uniform.
     *
     * The rates matter more than the magnitude. The deep cloud barely moves,
     * which is correct — a nebula light-years out should not swim past the
     * canopy — while the filaments drift an order of magnitude faster. It is
     * that *difference* the eye reads as distance, not the absolute motion, so
     * the sky stays still enough to feel vast and still shifts enough that you
     * can tell you are travelling through it rather than dragging it along.
     */
    vec3 drift = uEye * 0.00045;
    vec3 p = d * 2.2 + drift + vec3(0.0, 0.0, uTime * 0.006);

    float base = fbm(p);
    // Domain warp: feed the first field back in to get filaments and voids
    // instead of the cotton-wool look plain fbm gives you.
    float wisp = fbm(p * 2.6 + drift * 4.0 + vec3(base * 2.4));

    /*
     * Thresholds are the whole ballgame here, and this shader has now been
     * wrong in both directions.
     *
     * Too generous and cloud covers the sky; since the sky sits behind
     * everything, bloom then lifts the entire frame into a pale wash and every
     * neon edge disappears into it. Too mean — which is what shipped after that
     * correction — and the fbm never clears the threshold at all, so an entire
     * noise field costs its shader time and renders as flat black. A reviewer
     * described the backdrop as "just a static starfield", which was a fair
     * description of a nebula that was not being drawn.
     *
     * These values are tuned to sit *under* the bloom threshold at their
     * brightest, so the nebula reads as depth rather than as a light source.
     */
    float cloud = pow(clamp(base * 1.1 + wisp * 0.4 - 0.52, 0.0, 1.0), 2.0) * uDensity;
    float hot = pow(clamp(wisp * 1.6 - 0.74, 0.0, 1.0), 2.6);

    // Ridged filaments: folding the noise about its midpoint turns soft blobs
    // into strands, which is what actually reads as a nebula rather than fog.
    float ridge = 1.0 - abs(wisp * 2.0 - 1.0);
    ridge = pow(clamp(ridge, 0.0, 1.0), 3.5) * cloud;

    /*
     * The galactic band.
     *
     * This is the difference between "a noise field" and "a place". A nebula
     * field with even coverage reads as haze no matter how much structure the
     * fbm carries, because nothing in it establishes an orientation or a scale
     * — the eye has no lane to follow. Real skies have a plane: a dense, tilted
     * belt of dust running across them, thinning out either side. Concentrating
     * the same amount of cloud into a belt costs nothing extra and gives the
     * corridor an implied up, a horizon and a direction of travel.
     *
     * Tilted off-axis so it never looks like a horizontal gradient, and
     * softened by the noise itself so the edges are ragged rather than banded.
     */
    vec3 planeAxis = normalize(vec3(0.19, 0.94, -0.28));
    float off = dot(d, planeAxis);
    float belt = 1.0 - smoothstep(0.0, 0.62, abs(off) - wisp * 0.13);
    belt = pow(clamp(belt, 0.0, 1.0), 1.6);

    // Voids matter as much as clouds: without genuinely empty sky the belt has
    // nothing to be dense against.
    cloud *= 0.28 + belt * 1.15;
    hot *= 0.2 + belt * 1.5;
    ridge *= 0.25 + belt * 1.4;

    // A cool rim well off the plane, so the empty half of the sky is not simply
    // black — it is the far side of the same volume.
    float rim = pow(clamp(abs(off), 0.0, 1.0), 2.2) * 0.16;

    vec3 col = uDeep * (0.68 + belt * 0.55);
    col += uColorA * cloud * 1.05;
    col += uColorA * rim;
    col += uColorB * hot * 0.95;
    col += uColorB * ridge * 0.6;

    /*
     * Distant unresolved star haze.
     *
     * This was sampled at near-pixel frequency, which is the difference between
     * "stars too far to resolve" and "sensor noise": at 620 cells the specks
     * were smaller than a pixel and dense enough that a reviewer read the whole
     * boosted frame as compression artefacts sitting on top of the scene. It
     * also doubled up with the real starfield, which is already drawing stars.
     *
     * Sparser and larger. Fewer cells clear the threshold, each one is big
     * enough to read as a point of light, and the field beneath stays haze.
     */
    float grain = hash(floor(d * 300.0));
    col += vec3(0.85, 0.9, 1.0) * pow(grain, 110.0) * 0.7;

    gl_FragColor = vec4(col, 1.0);
  }
`;

export class Nebula {
  readonly object: THREE.Mesh;
  private material: THREE.ShaderMaterial;
  private targetA = new THREE.Color(0x1d2a63);
  private targetB = new THREE.Color(0x4de1c1);
  private targetDeep = new THREE.Color(0x04050c);

  constructor(density = 1) {
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uColorA: { value: new THREE.Color(0x1d2a63) },
        uColorB: { value: new THREE.Color(0x4de1c1) },
        uDeep: { value: new THREE.Color(0x04050c) },
        uTime: { value: 0 },
        uDensity: { value: density },
        uEye: { value: new THREE.Vector3() },
      },
      vertexShader: VERT,
      fragmentShader: FRAG,
      side: THREE.BackSide,
      depthWrite: false,
      depthTest: false,
      toneMapped: false,
    });

    // Radius is irrelevant — the vertex shader pins this to the far plane — but
    // a unit-ish sphere keeps the geometry cheap and the normals sane.
    this.object = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), this.material);
    this.object.frustumCulled = false;
    // Drawn before everything else, and never occludes.
    this.object.renderOrder = -1000;
  }

  /** Cross-fade toward a sector's palette. Called as the ship travels. */
  setPalette(a: number, b: number, deep: number): void {
    this.targetA.set(a);
    this.targetB.set(b);
    this.targetDeep.set(deep);
  }

  setDensity(v: number): void {
    this.material.uniforms.uDensity.value = v;
  }

  update(elapsed: number, dt: number, eye?: THREE.Vector3): void {
    this.material.uniforms.uTime.value = elapsed;
    if (eye) (this.material.uniforms.uEye.value as THREE.Vector3).copy(eye);
    const k = Math.min(1, dt * 1.1);
    (this.material.uniforms.uColorA.value as THREE.Color).lerp(this.targetA, k);
    (this.material.uniforms.uColorB.value as THREE.Color).lerp(this.targetB, k);
    (this.material.uniforms.uDeep.value as THREE.Color).lerp(this.targetDeep, k);
  }

  dispose(): void {
    this.object.geometry.dispose();
    this.material.dispose();
  }
}
