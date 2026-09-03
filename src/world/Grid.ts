import * as THREE from 'three';

const VERT = /* glsl */ `
  varying vec2 vWorld;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uFocus;
  uniform float uFade;
  varying vec2 vWorld;

  // Anti-aliased grid lines using screen-space derivatives.
  float gridLine(vec2 p, float spacing, float width) {
    vec2 g = abs(fract(p / spacing - 0.5) - 0.5) * spacing;
    vec2 fw = fwidth(p) * width;
    vec2 l = smoothstep(fw, vec2(0.0), g);
    return max(l.x, l.y);
  }

  void main() {
    float minor = gridLine(vWorld, 12.0, 1.2);
    float major = gridLine(vWorld, 96.0, 1.8);

    // Distance fade from the camera focus point keeps the horizon clean.
    float d = length(vWorld - uFocus.xz);
    float fade = 1.0 - smoothstep(uFade * 0.25, uFade, d);

    // Travelling energy band moving along -Z, like data flowing through the floor.
    float band = 0.5 + 0.5 * sin(vWorld.y * 0.045 + uTime * 1.5);

    vec3 col = mix(uColorA, uColorB, clamp(major + band * 0.25, 0.0, 1.0));
    float a = (minor * 0.1 + major * 0.34) * fade;
    a *= 0.72 + 0.28 * band;

    if (a < 0.002) discard;
    gl_FragColor = vec4(col * (0.8 + major * 1.6), a);
  }
`;

/**
 * The neon floor and ceiling. Two large planes that follow the camera on X/Z so
 * the grid reads as infinite without any geometry streaming.
 */
export class Grid {
  readonly object = new THREE.Group();
  private material: THREE.ShaderMaterial;

  constructor() {
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColorA: { value: new THREE.Color(0x1b3a5c) },
        uColorB: { value: new THREE.Color(0x4de1c1) },
        uFocus: { value: new THREE.Vector3() },
        uFade: { value: 760 },
      },
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    const geo = new THREE.PlaneGeometry(2400, 2400, 1, 1);

    // Floor only. An overhead plane reads as a mirrored floor and fights the
    // starfield for the top half of the frame.
    const floor = new THREE.Mesh(geo, this.material);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -95;
    floor.frustumCulled = false;

    this.object.add(floor);
  }

  update(elapsed: number, focus: THREE.Vector3): void {
    this.material.uniforms.uTime.value = elapsed;
    this.material.uniforms.uFocus.value.copy(focus);
    for (const child of this.object.children) {
      child.position.x = focus.x;
      child.position.z = focus.z;
    }
  }

  dispose(): void {
    this.material.dispose();
    for (const c of this.object.children) (c as THREE.Mesh).geometry.dispose();
  }
}
