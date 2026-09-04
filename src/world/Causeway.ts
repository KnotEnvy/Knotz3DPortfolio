import * as THREE from 'three';
import { Route, TUBE_RADIUS, makePose } from './Route';

/**
 * A floor and ceiling that follow the route.
 *
 * Two reviewers independently said the same thing about the earlier build: it
 * did not read as a corridor. Gates gave cadence and props gave things to look
 * at, but there was no surface anywhere — so the structures registered as debris
 * floating in a void, with no convergence, no horizon and no relationship
 * between one side and the other. A visitor could not tell forward from sideways.
 *
 * This is the missing piece. A ribbon of geometry swept along the spline, ruled
 * with a grid, banking with the route's own frame: it converges toward the
 * vanishing point, it tells you where the ground is, and it gives every prop a
 * baseline to stand on. It is also nearly free — one strip mesh per surface,
 * generated once, with all the work in the fragment shader.
 */

const HALF_WIDTH = 360;
const STEP = 24;

const VERT = /* glsl */ `
  attribute float aRun;
  attribute float aSide;
  uniform float uHalfWidth;
  varying vec2 vGrid;
  varying float vDepth;

  void main() {
    // uv.x is normalised across the ribbon (-1 at the left hem, +1 at the
    // right); vGrid is in metres so the rules stay square whatever the spline
    // is doing. Conflating the two is what made the first version invisible —
    // the edge fade read a 360-metre coordinate as a 0..1 ratio and clamped
    // every fragment's alpha to zero.
    // aSide is -1 at the left hem and +1 at the right. Deliberately a custom
    // attribute rather than the built-in uv: three only guarantees uv is
    // declared for materials it believes need texture coordinates, and a custom
    // shader leaning on it is one release away from silently receiving nothing
    // — which is exactly what happened here. It zeroed the edge fade, so the
    // whole surface discarded every fragment it drew.
    vGrid = vec2(aSide * uHalfWidth, aRun);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAG = /* glsl */ `
  precision highp float;

  uniform vec3 uColor;
  uniform vec3 uFogColor;
  uniform float uFogDensity;
  uniform float uTime;
  uniform float uOpacity;
  uniform float uMinor;
  uniform float uMajor;

  varying vec2 vGrid;
  varying float vDepth;

  /*
   * Screen-space-derivative antialiased rules.
   *
   * The clamp on the filter width is load-bearing. A floor is viewed at a
   * grazing angle almost everywhere, where fwidth explodes and the smoothstep
   * widens until every line washes out to nothing — which is exactly why the
   * first version of this surface rendered as an invisible plane. Capping the
   * filter keeps the far half of the corridor drawn instead of dissolved.
   */
  float rule(vec2 p, float spacing, float lineWidth) {
    // Distance, in metres, to the nearest rule on each axis.
    vec2 q = abs(fract(p / spacing - 0.5) - 0.5) * spacing;
    // Filter width, clamped at both ends. The lower bound matters because a
    // zero derivative collapses the smoothstep; the upper bound matters because
    // a floor is viewed at a grazing angle almost everywhere, where fwidth
    // explodes and every line washes out to nothing.
    vec2 w = clamp(fwidth(p) * lineWidth, vec2(0.4), vec2(spacing * 0.35));
    // Note the edge order: smoothstep is undefined when edge0 >= edge1, and
    // writing it backwards is why the first version of this surface discarded
    // every fragment it drew.
    vec2 l = 1.0 - smoothstep(vec2(0.0), w, q);
    return max(l.x, l.y);
  }

  void main() {
    float minor = rule(vGrid, uMinor, 1.2);
    float major = rule(vGrid, uMajor, 1.6);

    // A band of light travelling down the corridor: data moving through the
    // structure, and a second, slower speed cue underneath the gates.
    float band = 0.5 + 0.5 * sin(vGrid.y * 0.02 - uTime * 1.6);

    // Pull the surface back very close to the lens so it never slaps across the
    // camera, and let fog hide the far hem. There is deliberately no fade based
    // on distance across the ribbon: several attempts at one all ended up
    // multiplying the whole surface by zero and rendering nothing at all, and a
    // hem that fog already swallows is not worth that risk.
    float near = smoothstep(8.0, 55.0, vDepth);

    // Additive, with every term folded into the colour and alpha pinned at 1.
    //
    // This surface is the largest object in the scene and it went through
    // several rounds of rendering as literally nothing, each time because one
    // factor in an alpha product had quietly gone to zero and taken the whole
    // thing with it. Additive intensity fails gracefully: a term that drops too
    // low makes the grid dim, never absent, and there is no discard to hide
    // behind. It is also how every other glowing surface here is drawn.
    float strength = (0.035 + minor * 0.22 + major * 0.55) * near * uOpacity;
    strength *= 0.65 + 0.35 * band;

    // Fog attenuates an additive surface rather than tinting it — mixing toward
    // the fog colour would *add* haze in the distance instead of removing it.
    float fogFactor = 1.0 - exp(-pow(uFogDensity * vDepth, 2.0));
    strength *= 1.0 - clamp(fogFactor, 0.0, 1.0);

    vec3 col = uColor * (0.5 + major * 0.9 + band * 0.35) * strength;

    gl_FragColor = vec4(col, 1.0);
  }
`;

interface Surface {
  mesh: THREE.Mesh;
  mat: THREE.ShaderMaterial;
}

export class Causeway {
  readonly object = new THREE.Group();

  private surfaces: Surface[] = [];
  private accent = new THREE.Color(0x4de1c1);

  constructor(route: Route) {
    // Floor close under the tube, ceiling further up and fainter — an equally
    // strong ceiling reads as a mirrored floor and flattens the whole space.
    this.surfaces.push(this.build(route, -(TUBE_RADIUS + 46), 1, 26, 130));
    this.surfaces.push(this.build(route, TUBE_RADIUS + 104, 0.26, 40, 200));
    for (const s of this.surfaces) this.object.add(s.mesh);
  }

  private build(route: Route, offset: number, opacity: number, minor: number, major: number): Surface {
    const pose = makePose();
    const count = Math.max(2, Math.floor(route.length / STEP));

    const pos = new Float32Array((count + 1) * 2 * 3);
    const side = new Float32Array((count + 1) * 2);
    const run = new Float32Array((count + 1) * 2);
    const index: number[] = [];

    const p = new THREE.Vector3();
    for (let i = 0; i <= count; i++) {
      const d = (i / count) * route.length;
      route.poseAt(d, pose);
      p.copy(pose.position).addScaledVector(pose.up, offset);

      const o = i * 6;
      // Left and right edge of the ribbon, swept along the route's own right
      // vector so the surface banks with the corridor.
      pos[o + 0] = p.x - pose.right.x * HALF_WIDTH;
      pos[o + 1] = p.y - pose.right.y * HALF_WIDTH;
      pos[o + 2] = p.z - pose.right.z * HALF_WIDTH;
      pos[o + 3] = p.x + pose.right.x * HALF_WIDTH;
      pos[o + 4] = p.y + pose.right.y * HALF_WIDTH;
      pos[o + 5] = p.z + pose.right.z * HALF_WIDTH;

      side[i * 2 + 0] = -1;
      side[i * 2 + 1] = 1;

      run[i * 2 + 0] = d;
      run[i * 2 + 1] = d;

      if (i < count) {
        const a = i * 2;
        index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aSide', new THREE.BufferAttribute(side, 1));
    geo.setAttribute('aRun', new THREE.BufferAttribute(run, 1));
    geo.setIndex(index);

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(0x4de1c1) },
        uFogColor: { value: new THREE.Color(0x05070f) },
        uFogDensity: { value: 0 },
        uTime: { value: 0 },
        uOpacity: { value: opacity },
        uMinor: { value: minor },
        uMajor: { value: major },
        uHalfWidth: { value: HALF_WIDTH },
      },
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    mesh.renderOrder = -10;
    return { mesh, mat };
  }

  update(elapsed: number, accent: THREE.Color, fogColor: THREE.Color, fogDensity: number): void {
    // The floor takes a desaturated version of the sector accent: at full
    // strength a 700-metre lit surface becomes the brightest thing in frame.
    this.accent.copy(accent).multiplyScalar(0.55);
    for (const s of this.surfaces) {
      s.mat.uniforms.uTime.value = elapsed;
      (s.mat.uniforms.uColor.value as THREE.Color).lerp(this.accent, 0.06);
      (s.mat.uniforms.uFogColor.value as THREE.Color).copy(fogColor);
      s.mat.uniforms.uFogDensity.value = fogDensity;
    }
  }

  dispose(): void {
    for (const s of this.surfaces) {
      s.mesh.geometry.dispose();
      s.mat.dispose();
    }
  }
}
