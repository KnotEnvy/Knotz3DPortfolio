import * as THREE from 'three';
import { sectors, type SectorDef } from '../data/sectors';
import { missions } from '../data/missions';
import { mulberry32 } from '../core/Math';
import { hullMaterial, glowMaterial, type HullMaterial } from '../shaders/hull';
import { Route, TUBE_RADIUS, makePose } from './Route';

/**
 * Per-sector set dressing.
 *
 * Six chapters of a résumé need to feel like six *places*, not one tunnel with
 * the accent colour swapped. Each sector's run-in is lined with structures drawn
 * from its own vocabulary — monoliths, towers, reactor arches, screen walls,
 * archive plates, antenna masts — so a returning visitor recognises where they
 * are before a single label loads.
 *
 * Everything is instanced per sector: one draw call for all of a sector's props,
 * two for its arches. The whole environment is a handful of draws.
 */

interface Band {
  def: SectorDef;
  props: THREE.InstancedMesh[];
  arches: THREE.InstancedMesh | null;
  mats: HullMaterial[];
  archMat: THREE.MeshBasicMaterial | null;
  accents: THREE.InstancedMesh | null;
  accentMat: THREE.MeshBasicMaterial | null;
}

export class Environment {
  readonly object = new THREE.Group();

  private bands: Band[] = [];
  private bin: Array<THREE.BufferGeometry | THREE.Material> = [];
  private m = new THREE.Matrix4();
  private q = new THREE.Quaternion();
  private s = new THREE.Vector3();
  private p = new THREE.Vector3();
  private euler = new THREE.Euler();
  private pose = makePose();
  private axisZ = new THREE.Vector3(0, 0, 1);

  constructor(route: Route, private detail = 1) {
    const keep = <T extends THREE.BufferGeometry | THREE.Material>(x: T): T => {
      this.bin.push(x);
      return x;
    };

    sectors.forEach((def, index) => {
      const mission = missions[index];
      const nodeD = route.sectorDistance[index];
      // The band runs from a little before the previous node's standoff to just
      // past this one, so the transition between vocabularies happens while the
      // player is travelling rather than mid-fight.
      const from = index === 0 ? 0 : Math.max(0, route.sectorDistance[index - 1] + 120);
      const to = nodeD + 150;
      const span = Math.max(120, to - from);

      const rnd = mulberry32(0x1234 + index * 7919);
      // Structures need a much hotter rim than anything else in the scene.
      // They are dark objects against a near-black sky at 200 metres, where a
      // subtle Fresnel edge simply is not there — an earlier pass tuned these
      // like foreground props and the entire environment was invisible.
      // Bright enough to read at two hundred metres, dim enough that a slab
      // passing close to the lens does not bloom across the whole frame. Fog
      // now supplies the depth cue, so the rim no longer has to.
      const mat = keep(
        hullMaterial({ color: def.color, base: 0x0d1424, rim: 1.15, power: 2.2, glow: 0.045, scan: true }),
      );

      // Three silhouettes per sector rather than one. A single rescaled box
      // repeated forty times reads as scattered planks; three shapes in the same
      // material vocabulary read as architecture, for the cost of two extra
      // draw calls.
      const geos = propGeometries(def.form).map((g) => {
        const kept = keep(g);
        kept.computeBoundingSphere();
        return kept;
      });

      // Clearance is derived from each geometry's own bounds rather than a
      // hand-maintained table of widths. The table version silently let a
      // scaled-up VENTURES tower sit eight metres off the flight line, because
      // it accounted only for the box's width while these props are also
      // displaced vertically and yawed.
      const radii = geos.map((g) => g.boundingSphere?.radius ?? 20);

      // Density matters more than any single silhouette here. Scattered thinly
      // and far out, structures read as specks and the corridor reads as empty
      // space with a boss at the end of it.
      const count = Math.round((mission.lead > 0 ? 96 : 68) * this.detail);
      const perVariant = Math.ceil(count / geos.length) + 4;
      const props = geos.map((g, v) => {
        const im = new THREE.InstancedMesh(g, mat, perVariant);
        im.name = `env:props:${def.id}:${v}`;
        im.frustumCulled = false;
        return im;
      });

      const placed = geos.map(() => 0);
      for (let i = 0; i < count; i++) {
        const t = (i + 0.5) / count;
        const d = from + span * t;

        // Keep a clear bubble around every node. A forty-metre archive plate
        // drifting across the boss is not atmosphere, it is an obstruction.
        if (route.sectorDistance.some((sd) => Math.abs(sd - d) < 110)) continue;

        route.poseAt(d, this.pose);

        const variant = i % geos.length;
        const sc = propScale(def.form, rnd);

        // Push the prop out by its own scaled bounding radius on top of the
        // tube. Anything less and the player flies through the scenery.
        const side = i % 2 === 0 ? 1 : -1;
        const radius = radii[variant] * Math.max(sc.x, sc.y, sc.z);
        const clearance = TUBE_RADIUS + 34 + radius;
        const out = clearance + rnd() * rnd() * 200;
        const vert = (rnd() - 0.5) * 150;

        this.p
          .copy(this.pose.position)
          .addScaledVector(this.pose.right, side * out)
          .addScaledVector(this.pose.up, vert);

        // Orient to the rail frame, then yaw a little for variety.
        this.q.setFromUnitVectors(this.axisZ, this.pose.tangent);
        this.euler.set(0, (rnd() - 0.5) * 1.2, (rnd() - 0.5) * 0.22);
        this.q.multiply(new THREE.Quaternion().setFromEuler(this.euler));

        this.m.compose(this.p, this.q, sc);
        if (placed[variant] < perVariant) props[variant].setMatrixAt(placed[variant]++, this.m);
      }
      // Unused slots would otherwise render as identity-matrix props stacked at
      // the world origin.
      props.forEach((im, v) => {
        im.count = placed[v];
        im.instanceMatrix.needsUpdate = true;
        this.object.add(im);
      });

      // Arches: hero geometry straddling the rail. Only some forms get them,
      // because a corridor where everything is an arch stops reading as one.
      let arches: THREE.InstancedMesh | null = null;
      let archMat: THREE.MeshBasicMaterial | null = null;
      if (def.form === 'reactor' || def.form === 'beacon' || def.form === 'spine') {
        archMat = keep(glowMaterial(def.color, 0.22));
        const archGeo = keep(archGeometry(def.form));
        const n = Math.max(3, Math.round(6 * this.detail));
        arches = new THREE.InstancedMesh(archGeo, archMat, n);
        arches.name = `env:arches:${def.id}`;
        arches.frustumCulled = false;
        let archesPlaced = 0;
        for (let i = 0; i < n; i++) {
          const d = from + span * ((i + 0.6) / n);
          if (route.sectorDistance.some((sd) => Math.abs(sd - d) < 110)) continue;
          route.poseAt(d, this.pose);
          this.q.setFromUnitVectors(this.axisZ, this.pose.tangent);
          const k = 1 + i * 0.06;
          this.m.compose(this.pose.position, this.q, this.s.set(k, k, 1));
          arches.setMatrixAt(archesPlaced++, this.m);
        }
        arches.count = archesPlaced;
        arches.instanceMatrix.needsUpdate = true;
        this.object.add(arches);
      }

      // Accent lights: small bright quads scattered on the props' side of the
      // corridor. Cheap, and they give the bloom something to chew on so the
      // flanks are not just dark silhouettes.
      const accentMat = keep(glowMaterial(def.color, 0.42));
      const accentGeo = keep(new THREE.SphereGeometry(1, 6, 5));
      const an = Math.round(70 * this.detail);
      const accents = new THREE.InstancedMesh(accentGeo, accentMat, an);
      accents.name = `env:accents:${def.id}`;
      accents.frustumCulled = false;
      for (let i = 0; i < an; i++) {
        const d = from + span * rnd();
        route.poseAt(d, this.pose);
        const ang = rnd() * Math.PI * 2;
        const rad = TUBE_RADIUS + 16 + rnd() * 190;
        this.p
          .copy(this.pose.position)
          .addScaledVector(this.pose.right, Math.cos(ang) * rad)
          .addScaledVector(this.pose.up, Math.sin(ang) * rad * 0.7);
        const k = 0.5 + rnd() * 1.6;
        this.m.compose(this.p, this.q.identity(), this.s.setScalar(k));
        accents.setMatrixAt(i, this.m);
      }
      accents.instanceMatrix.needsUpdate = true;
      this.object.add(accents);

      this.bands.push({ def, props, arches, mats: [mat], archMat, accents, accentMat });
    });
  }

  update(elapsed: number): void {
    for (const b of this.bands) {
      for (const m of b.mats) m.uniforms.uTime.value = elapsed;
      if (b.archMat) b.archMat.opacity = 0.15 + Math.sin(elapsed * 0.7 + b.def.index) * 0.06;
      if (b.accentMat) b.accentMat.opacity = 0.3 + Math.sin(elapsed * 2.1 + b.def.index * 1.7) * 0.14;
    }
  }

  dispose(): void {
    for (const b of this.bands) {
      for (const im of b.props) im.dispose();
      b.arches?.dispose();
      b.accents?.dispose();
    }
    for (const d of this.bin) d.dispose();
    this.bin.length = 0;
  }
}

/**
 * The silhouette vocabulary for each sector: three related shapes that share a
 * language, so a band reads as one place built by one civilisation rather than
 * as a row of identical blocks.
 */
function propGeometries(form: SectorDef['form']): THREE.BufferGeometry[] {
  switch (form) {
    // ORIGIN: raw monoliths and pylons. Nothing built yet, just the material.
    case 'knot':
      return [
        new THREE.BoxGeometry(6, 46, 6, 1, 3, 1),
        new THREE.ConeGeometry(7, 34, 4, 1),
        new THREE.BoxGeometry(17, 24, 8, 1, 2, 1),
      ];
    // VENTURES: towers and blocks. Two businesses, built upward.
    case 'twin':
      return [
        new THREE.BoxGeometry(14, 78, 14, 1, 6, 1),
        new THREE.CylinderGeometry(8, 13, 62, 6, 4),
        new THREE.BoxGeometry(32, 30, 18, 2, 2, 1),
      ];
    // THE FORGE: pressure vessels, coils and pipe racks.
    case 'reactor':
      return [
        new THREE.CapsuleGeometry(6, 26, 5, 10),
        new THREE.TorusGeometry(14, 3.2, 6, 20),
        new THREE.BoxGeometry(9, 44, 9, 1, 4, 1),
      ];
    // ARCADE: screen walls, cabinet bodies and neon tubes.
    case 'cabinet':
      return [
        new THREE.BoxGeometry(30, 22, 2.5),
        new THREE.BoxGeometry(15, 32, 11, 1, 3, 1),
        new THREE.CylinderGeometry(1.6, 1.6, 42, 8),
      ];
    // TRACK RECORD: archive plates, columns and rings.
    case 'spine':
      return [
        new THREE.BoxGeometry(46, 2.6, 22),
        new THREE.BoxGeometry(11, 34, 11, 1, 3, 1),
        new THREE.TorusGeometry(19, 1.8, 4, 10),
      ];
    // UPLINK: masts, dishes and relay nodes.
    case 'beacon':
      return [
        new THREE.CylinderGeometry(0.8, 3.2, 66, 7),
        new THREE.ConeGeometry(11, 18, 7, 1, true),
        new THREE.IcosahedronGeometry(7, 0),
      ];
  }
}

function propScale(form: SectorDef['form'], rnd: () => number): THREE.Vector3 {
  const j = 0.7 + rnd() * 1.0;
  switch (form) {
    case 'twin':
      return new THREE.Vector3(j, 0.6 + rnd() * 1.6, j);
    case 'spine':
      return new THREE.Vector3(0.7 + rnd() * 0.9, j, 0.7 + rnd() * 0.7);
    case 'beacon':
      return new THREE.Vector3(j, 0.5 + rnd() * 1.5, j);
    default:
      return new THREE.Vector3(j, j, j);
  }
}

function archGeometry(form: SectorDef['form']): THREE.BufferGeometry {
  switch (form) {
    case 'reactor':
      return new THREE.TorusGeometry(TUBE_RADIUS + 46, 4.2, 6, 40);
    case 'spine':
      return new THREE.TorusGeometry(TUBE_RADIUS + 52, 2.4, 4, 6);
    default:
      return new THREE.TorusGeometry(TUBE_RADIUS + 58, 1.8, 4, 32);
  }
}
