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
        /*
         * Scenery is deliberately the dimmest thing in the frame.
         *
         * Every emissive surface used to sit at roughly the same intensity —
         * scenery at rim 1.05, the ship at 1.15 — so a combat frame had no
         * focal hierarchy at all and reviewers reported the eye had nowhere to
         * land first, and that hostiles were indistinguishable from
         * architecture. Bloom then smeared all of it together equally.
         *
         * The order that matters is threats, then your ship, then the objective
         * you are flying at, then the world it all happens in. Scenery is last,
         * so it is graded down until it reads as the place rather than as
         * something you might need to shoot.
         */
        hullMaterial({ color: def.color, base: 0x0c1220, rim: 0.62, power: 2.6, glow: 0.015, scan: true }),
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
        const clearance = TUBE_RADIUS + 82 + radius;
        const out = clearance + rnd() * rnd() * 260;
        // Biased downward so structures rise from the causeway floor instead of
        // hanging at arbitrary heights. Props scattered evenly above and below
        // the flight line read as debris; props standing on a surface read as
        // architecture.
        const vert = -TUBE_RADIUS - 20 + rnd() * rnd() * 150;

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
        archMat = keep(glowMaterial(def.color, 0.13));
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
      const accentMat = keep(glowMaterial(def.color, 0.26));
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
      if (b.archMat) b.archMat.opacity = 0.09 + Math.sin(elapsed * 0.7 + b.def.index) * 0.035;
      if (b.accentMat) b.accentMat.opacity = 0.19 + Math.sin(elapsed * 2.1 + b.def.index * 1.7) * 0.08;
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
 * A tapered, bevelled slab.
 *
 * Raw BoxGeometry is what made the flanks read as a bar chart: a box has no
 * chamfer, so its silhouette is four hard verticals and the Fresnel rim has
 * nothing to catch except the outline. A cylinder with a low segment count is a
 * prism — give it a different top and bottom radius and it tapers, and the extra
 * facets pick up the rim light along their length. Same cost, far better read.
 */
function slab(bottom: number, top: number, height: number, sides = 6, twist = 0): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(top, bottom, height, sides, 2);
  if (twist !== 0) g.rotateY(twist);
  return g;
}

/**
 * The silhouette vocabulary for each sector: three related shapes that share a
 * language, so a band reads as one place built by one civilisation rather than
 * as a row of identical blocks.
 */
function propGeometries(form: SectorDef['form']): THREE.BufferGeometry[] {
  switch (form) {
    // ORIGIN: monoliths and pylons. Nothing built yet, just the material.
    case 'knot':
      return [slab(5, 3.4, 46, 5), new THREE.ConeGeometry(7, 34, 5, 1), slab(11, 8, 24, 6, 0.4)];
    // VENTURES: towers and blocks. Two businesses, built upward.
    case 'twin':
      return [slab(11, 7, 78, 4, Math.PI / 4), slab(13, 8, 62, 6), slab(20, 16, 30, 8, 0.2)];
    // THE FORGE: pressure vessels, coils and pipe racks.
    case 'reactor':
      return [new THREE.CapsuleGeometry(6, 26, 5, 10), new THREE.TorusGeometry(14, 3.2, 6, 20), slab(7, 5, 44, 6)];
    // ARCADE: screen walls, cabinet bodies and neon tubes.
    case 'cabinet':
      return [slab(18, 15, 22, 4, Math.PI / 4), slab(11, 7, 32, 5), new THREE.CylinderGeometry(1.6, 1.6, 42, 8)];
    // TRACK RECORD: archive plates, columns and rings.
    case 'spine':
      return [slab(26, 22, 3.2, 8), slab(9, 6, 34, 6), new THREE.TorusGeometry(19, 1.8, 5, 12)];
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
  const j = 0.6 + rnd() * 0.85;
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
