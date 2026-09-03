import * as THREE from 'three';
import { sectors } from '../data/sectors';
import { mulberry32 } from '../core/Math';

const SLATE = new THREE.Color(0x6f8098);
const GATE_SPACING = 44;
const GATE_RADIUS = 64;
const DEBRIS_COUNT = 220;

/**
 * The route between sectors: a spline of neon gates plus drifting debris.
 *
 * Without this the space between landmarks is empty and a visitor who
 * over-steers sees nothing at all. The gates double as navigation — follow the
 * rings and you cannot get lost — and give the boost a sense of real speed.
 */
export class Corridor {
  readonly object = new THREE.Group();
  readonly curve: THREE.CatmullRomCurve3;

  private gates: THREE.InstancedMesh;
  private debris: THREE.InstancedMesh;
  private gateMat: THREE.MeshBasicMaterial;
  private debrisMat: THREE.MeshBasicMaterial;
  private gateGeo: THREE.TorusGeometry;
  private debrisGeo: THREE.BufferGeometry;
  private debrisSeeds: Float32Array;
  private m = new THREE.Matrix4();
  private q = new THREE.Quaternion();
  private v = new THREE.Vector3();
  private up = new THREE.Vector3(0, 1, 0);
  private scaleVec = new THREE.Vector3();
  private axis = new THREE.Vector3(0, 0, 1);

  constructor(start: THREE.Vector3) {
    const points = [start.clone(), ...sectors.map((s) => new THREE.Vector3(...s.position))];
    // Run the curve a little past the last sector so the tangent stays sane.
    const last = points[points.length - 1];
    points.push(new THREE.Vector3(last.x, last.y, last.z - 120));
    this.curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.4);

    const length = this.curve.getLength();
    const count = Math.floor(length / GATE_SPACING);

    this.gateGeo = new THREE.TorusGeometry(GATE_RADIUS, 0.3, 5, 56);
    this.gateMat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.26,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });

    // A gate sweeping a few metres past the camera is a solid bar across the
    // frame, and additive blending plus bloom turns it white. Fading by view
    // depth keeps the tunnel effect without the strobe.
    this.gateMat.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying float vViewDepth;')
        .replace('#include <fog_vertex>', '#include <fog_vertex>\n\tvViewDepth = -mvPosition.z;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vViewDepth;')
        .replace(
          '#include <opaque_fragment>',
          '\tdiffuseColor.a *= smoothstep(22.0, 120.0, vViewDepth) * (1.0 - smoothstep(900.0, 1500.0, vViewDepth));\n#include <opaque_fragment>',
        );
    };

    const placed: { pos: THREE.Vector3; quat: THREE.Quaternion; color: THREE.Color }[] = [];
    const tangent = new THREE.Vector3();
    const colorA = new THREE.Color();
    const colorB = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const t = (i + 0.5) / count;
      const pos = this.curve.getPointAt(t);

      // Gates would clutter the landmarks, so clear a bubble around each sector.
      const nearSector = sectors.some(
        (s) => pos.distanceTo(new THREE.Vector3(...s.position)) < s.radius * 1.15,
      );
      if (nearSector) continue;

      this.curve.getTangentAt(t, tangent);
      const quat = new THREE.Quaternion().setFromUnitVectors(this.axis, tangent);

      // Colour blends between the two sectors this gate sits between.
      const seg = t * (sectors.length - 1);
      const i0 = Math.min(sectors.length - 1, Math.floor(seg));
      const i1 = Math.min(sectors.length - 1, i0 + 1);
      colorA.set(sectors[i0].color);
      colorB.set(sectors[i1].color);
      placed.push({ pos, quat, color: colorA.clone().lerp(colorB, seg - i0) });
    }

    this.gates = new THREE.InstancedMesh(this.gateGeo, this.gateMat, placed.length);
    this.gates.frustumCulled = false;
    placed.forEach((g, i) => {
      this.m.compose(g.pos, g.quat, new THREE.Vector3(1, 1, 1));
      this.gates.setMatrixAt(i, this.m);
      this.gates.setColorAt(i, g.color);
    });
    this.gates.instanceMatrix.needsUpdate = true;
    if (this.gates.instanceColor) this.gates.instanceColor.needsUpdate = true;
    this.object.add(this.gates);

    // Debris: slow-tumbling motes scattered around the route.
    // Cubes, not octahedra: collectible shards are diamonds, and the two must
    // never be confusable at a glance.
    this.debrisGeo = new THREE.BoxGeometry(1, 1, 1);
    this.debrisMat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.26,
      depthWrite: false,
      toneMapped: false,
    });
    this.debris = new THREE.InstancedMesh(this.debrisGeo, this.debrisMat, DEBRIS_COUNT);
    this.debris.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.debris.frustumCulled = false;

    const rnd = mulberry32(0x9e3f);
    this.debrisSeeds = new Float32Array(DEBRIS_COUNT * 5);
    const c = new THREE.Color();
    for (let i = 0; i < DEBRIS_COUNT; i++) {
      const t = rnd();
      const p = this.curve.getPointAt(t);
      const spread = 60 + rnd() * 120;
      this.debrisSeeds[i * 5 + 0] = p.x + (rnd() - 0.5) * spread;
      this.debrisSeeds[i * 5 + 1] = p.y + (rnd() - 0.5) * spread * 0.7;
      this.debrisSeeds[i * 5 + 2] = p.z + (rnd() - 0.5) * spread;
      this.debrisSeeds[i * 5 + 3] = rnd() * Math.PI * 2;
      this.debrisSeeds[i * 5 + 4] = 0.3 + rnd() * 0.9;

      // Desaturated toward slate so debris reads as scenery, not as loot.
      c.set(sectors[(rnd() * sectors.length) | 0].color)
        .lerp(SLATE, 0.62)
        .multiplyScalar(0.5 + rnd() * 0.4);
      this.debris.setColorAt(i, c);
    }
    if (this.debris.instanceColor) this.debris.instanceColor.needsUpdate = true;
    this.object.add(this.debris);
  }

  update(elapsed: number): void {
    this.gateMat.opacity = 0.2 + Math.sin(elapsed * 0.9) * 0.05;

    for (let i = 0; i < DEBRIS_COUNT; i++) {
      const o = i * 5;
      const phase = this.debrisSeeds[o + 3];
      const scale = this.debrisSeeds[o + 4];
      this.v.set(
        this.debrisSeeds[o + 0],
        this.debrisSeeds[o + 1] + Math.sin(elapsed * 0.25 + phase) * 3.5,
        this.debrisSeeds[o + 2],
      );
      this.q.setFromAxisAngle(this.up, elapsed * 0.3 + phase);
      this.m.compose(this.v, this.q, this.scaleVec.setScalar(scale));
      this.debris.setMatrixAt(i, this.m);
    }
    this.debris.instanceMatrix.needsUpdate = true;
  }

  dispose(): void {
    this.gateGeo.dispose();
    this.gateMat.dispose();
    this.debrisGeo.dispose();
    this.debrisMat.dispose();
    this.gates.dispose();
    this.debris.dispose();
  }
}
