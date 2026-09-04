import * as THREE from 'three';
import { sectors } from '../data/sectors';
import { mulberry32 } from '../core/Math';
import { Route, TUBE_RADIUS, makePose } from './Route';

const SLATE = new THREE.Color(0x5a6a84);
const GATE_SPACING = 58;
const GATE_RADIUS = TUBE_RADIUS + 15;
const DEBRIS_COUNT = 360;

/**
 * The corridor itself: navigation gates threaded along the route, structural
 * ribs, and a drifting debris field.
 *
 * The gates are load-bearing for the feel of the whole thing. They are the only
 * reason boost registers as speed rather than as a number going up: at 130
 * metres a second a ring sweeps past every half-second, and that cadence is
 * what the eye reads as velocity. They also make the route legible from a
 * standing start — follow the rings.
 */
export class Corridor {
  readonly object = new THREE.Group();

  private gates: THREE.InstancedMesh;
  private ribs: THREE.InstancedMesh;
  private debris: THREE.InstancedMesh;
  private gateMat: THREE.MeshBasicMaterial;
  private ribMat: THREE.MeshBasicMaterial;
  private debrisMat: THREE.MeshBasicMaterial;
  private gateGeo: THREE.TorusGeometry;
  private ribGeo: THREE.BufferGeometry;
  private debrisGeo: THREE.BufferGeometry;
  private debrisSeeds: Float32Array;
  private m = new THREE.Matrix4();
  private q = new THREE.Quaternion();
  private v = new THREE.Vector3();
  private up = new THREE.Vector3(0, 1, 0);
  private scaleVec = new THREE.Vector3();
  private axis = new THREE.Vector3(0, 0, 1);
  private pose = makePose();

  constructor(route: Route) {
    const count = Math.floor(route.length / GATE_SPACING);

    this.gateGeo = new THREE.TorusGeometry(GATE_RADIUS, 0.42, 5, 64);
    this.gateMat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });

    // A gate a few metres from the camera is a solid bar across the frame, and
    // additive blending plus bloom turns that bar white. Fading by view depth
    // keeps the tunnel cadence without the strobe.
    const fadeByDepth = (shader: THREE.WebGLProgramParametersWithUniforms) => {
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying float vViewDepth;')
        .replace('#include <fog_vertex>', '#include <fog_vertex>\n\tvViewDepth = -mvPosition.z;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vViewDepth;')
        .replace(
          '#include <opaque_fragment>',
          '\tdiffuseColor.a *= smoothstep(26.0, 150.0, vViewDepth) * (1.0 - smoothstep(1100.0, 1900.0, vViewDepth));\n#include <opaque_fragment>',
        );
    };
    this.gateMat.onBeforeCompile = fadeByDepth;

    this.ribMat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    this.ribMat.onBeforeCompile = fadeByDepth;

    const gatePlacements: { pos: THREE.Vector3; quat: THREE.Quaternion; color: THREE.Color }[] = [];
    const ribPlacements: { pos: THREE.Vector3; quat: THREE.Quaternion; color: THREE.Color; len: number }[] = [];
    const colorA = new THREE.Color();
    const colorB = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const d = (i + 0.5) * GATE_SPACING;
      route.poseAt(d, this.pose);

      // Colour blends between the two nearest sectors, so travelling between
      // them is a continuous gradient rather than a hard cut.
      const { a, b, f } = nearestPair(route, d);
      colorA.set(sectors[a].color);
      colorB.set(sectors[b].color);
      const color = colorA.clone().lerp(colorB, f);

      // Clear a bubble around each node: gates crossing the boss would wreck
      // the read of the fight.
      const nearNode = route.sectorDistance.some((sd) => Math.abs(sd - d) < 130);
      if (nearNode) continue;

      const quat = new THREE.Quaternion().setFromUnitVectors(this.axis, this.pose.tangent);
      gatePlacements.push({ pos: this.pose.position.clone(), quat, color });

      // Ribs: four short struts on the diagonals, giving the tube a skeleton.
      if (i % 2 === 0) {
        for (const [ox, oy] of [
          [0.72, 0.72],
          [-0.72, 0.72],
          [0.72, -0.72],
          [-0.72, -0.72],
        ]) {
          const p = this.pose.position
            .clone()
            .addScaledVector(this.pose.right, ox * GATE_RADIUS)
            .addScaledVector(this.pose.up, oy * GATE_RADIUS);
          ribPlacements.push({ pos: p, quat, color, len: GATE_SPACING * 1.9 });
        }
      }
    }

    this.gates = new THREE.InstancedMesh(this.gateGeo, this.gateMat, Math.max(1, gatePlacements.length));
    this.gates.name = 'corridor:gates';
    this.gates.frustumCulled = false;
    gatePlacements.forEach((g, i) => {
      this.m.compose(g.pos, g.quat, this.scaleVec.set(1, 1, 1));
      this.gates.setMatrixAt(i, this.m);
      this.gates.setColorAt(i, g.color);
    });
    this.gates.instanceMatrix.needsUpdate = true;
    if (this.gates.instanceColor) this.gates.instanceColor.needsUpdate = true;
    this.object.add(this.gates);

    this.ribGeo = new THREE.BoxGeometry(0.5, 0.5, 1);
    this.ribs = new THREE.InstancedMesh(this.ribGeo, this.ribMat, Math.max(1, ribPlacements.length));
    this.ribs.name = 'corridor:ribs';
    this.ribs.frustumCulled = false;
    ribPlacements.forEach((r, i) => {
      this.m.compose(r.pos, r.quat, this.scaleVec.set(1, 1, r.len));
      this.ribs.setMatrixAt(i, this.m);
      this.ribs.setColorAt(i, r.color);
    });
    this.ribs.instanceMatrix.needsUpdate = true;
    if (this.ribs.instanceColor) this.ribs.instanceColor.needsUpdate = true;
    this.object.add(this.ribs);

    // Debris: slow-tumbling chunks well outside the tube, for parallax. Faceted
    // rather than cubic, and desaturated toward slate, so they never read as
    // collectible — data shards are bright diamonds and nothing else is.
    this.debrisGeo = new THREE.DodecahedronGeometry(1, 0);
    this.debrisMat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
      toneMapped: false,
    });
    this.debris = new THREE.InstancedMesh(this.debrisGeo, this.debrisMat, DEBRIS_COUNT);
    this.debris.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.debris.name = 'corridor:debris';
    this.debris.frustumCulled = false;

    const rnd = mulberry32(0x9e3f);
    this.debrisSeeds = new Float32Array(DEBRIS_COUNT * 6);
    const c = new THREE.Color();
    for (let i = 0; i < DEBRIS_COUNT; i++) {
      const d = rnd() * route.length;
      route.poseAt(d, this.pose);
      const ang = rnd() * Math.PI * 2;
      const rad = TUBE_RADIUS + 40 + rnd() * 320;
      const p = this.pose.position
        .clone()
        .addScaledVector(this.pose.right, Math.cos(ang) * rad)
        .addScaledVector(this.pose.up, Math.sin(ang) * rad * 0.62);

      this.debrisSeeds[i * 6 + 0] = p.x;
      this.debrisSeeds[i * 6 + 1] = p.y;
      this.debrisSeeds[i * 6 + 2] = p.z;
      this.debrisSeeds[i * 6 + 3] = rnd() * Math.PI * 2;
      this.debrisSeeds[i * 6 + 4] = 1.4 + rnd() * rnd() * 8;
      this.debrisSeeds[i * 6 + 5] = 0.1 + rnd() * 0.4;

      const { a } = nearestPair(route, d);
      c.set(sectors[a].color)
        .lerp(SLATE, 0.68)
        .multiplyScalar(0.35 + rnd() * 0.5);
      this.debris.setColorAt(i, c);
    }
    if (this.debris.instanceColor) this.debris.instanceColor.needsUpdate = true;
    this.object.add(this.debris);
  }

  update(elapsed: number): void {
    this.gateMat.opacity = 0.24 + Math.sin(elapsed * 0.9) * 0.05;
    this.ribMat.opacity = 0.16 + Math.sin(elapsed * 0.9 + 1) * 0.04;

    for (let i = 0; i < DEBRIS_COUNT; i++) {
      const o = i * 6;
      const phase = this.debrisSeeds[o + 3];
      const scale = this.debrisSeeds[o + 4];
      const spin = this.debrisSeeds[o + 5];
      this.v.set(
        this.debrisSeeds[o + 0],
        this.debrisSeeds[o + 1] + Math.sin(elapsed * 0.2 + phase) * 4,
        this.debrisSeeds[o + 2],
      );
      this.q.setFromAxisAngle(this.up, elapsed * spin + phase);
      this.m.compose(this.v, this.q, this.scaleVec.setScalar(scale));
      this.debris.setMatrixAt(i, this.m);
    }
    this.debris.instanceMatrix.needsUpdate = true;
  }

  dispose(): void {
    this.gateGeo.dispose();
    this.ribGeo.dispose();
    this.debrisGeo.dispose();
    this.gateMat.dispose();
    this.ribMat.dispose();
    this.debrisMat.dispose();
    this.gates.dispose();
    this.ribs.dispose();
    this.debris.dispose();
  }
}

/** Which two sectors a distance sits between, and how far through. */
export function nearestPair(route: Route, distance: number): { a: number; b: number; f: number } {
  const sd = route.sectorDistance;
  if (distance <= sd[0]) return { a: 0, b: 0, f: 0 };
  for (let i = 0; i < sd.length - 1; i++) {
    if (distance <= sd[i + 1]) {
      const f = (distance - sd[i]) / Math.max(1, sd[i + 1] - sd[i]);
      return { a: i, b: i + 1, f };
    }
  }
  return { a: sd.length - 1, b: sd.length - 1, f: 0 };
}
