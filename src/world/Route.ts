import * as THREE from 'three';
import { sectors } from '../data/sectors';

/**
 * The flight path.
 *
 * The first draft of this site let the visitor fly anywhere in a large box,
 * which meant they could — and did — end up staring at empty space with no idea
 * what to do. The route replaces that freedom with a single spline: forward
 * progress is automatic and monotonic, and steering only moves the ship inside
 * a tube around the centreline. You cannot get lost, you cannot back out of a
 * sector by accident, and every encounter can be authored at a known distance
 * because the camera is guaranteed to arrive facing it.
 */

/** How far off the centreline the ship may fly. */
export const TUBE_RADIUS = 54;

/** Arc-length samples. 3000 over ~3 km is a sample every metre or so. */
const SAMPLES = 3000;

const WORLD_UP = new THREE.Vector3(0, 1, 0);

export interface Pose {
  position: THREE.Vector3;
  tangent: THREE.Vector3;
  right: THREE.Vector3;
  up: THREE.Vector3;
}

export const makePose = (): Pose => ({
  position: new THREE.Vector3(),
  tangent: new THREE.Vector3(0, 0, -1),
  right: new THREE.Vector3(1, 0, 0),
  up: new THREE.Vector3(0, 1, 0),
});

export class Route {
  readonly curve: THREE.CatmullRomCurve3;
  readonly length: number;

  /** Distance along the route at which each sector's node sits, by index. */
  readonly sectorDistance: number[] = [];

  private cumulative: Float32Array;
  private samples: THREE.Vector3[] = [];
  private tmpA = new THREE.Vector3();

  constructor() {
    // A lead-in ahead of the first sector gives the title card something to
    // fly through, and a run-out past the last keeps the end tangent sane.
    const anchors = [
      new THREE.Vector3(0, 14, 150),
      ...sectors.map((s) => new THREE.Vector3(...s.position)),
    ];
    const last = anchors[anchors.length - 1];
    anchors.push(new THREE.Vector3(last.x, last.y + 30, last.z - 420));

    this.curve = new THREE.CatmullRomCurve3(anchors, false, 'catmullrom', 0.5);

    // Uniform-t samples plus a cumulative length table. three's own
    // getPointAt() does this internally on every call; caching it once means
    // the per-frame lookup is a binary search rather than a curve evaluation.
    this.cumulative = new Float32Array(SAMPLES + 1);
    let total = 0;
    let prev: THREE.Vector3 | null = null;
    for (let i = 0; i <= SAMPLES; i++) {
      const p = this.curve.getPoint(i / SAMPLES);
      this.samples.push(p);
      if (prev) total += p.distanceTo(prev);
      this.cumulative[i] = total;
      prev = p;
    }
    this.length = total;

    // Anchor each sector to the closest point on the sampled centreline. The
    // spline does not pass exactly through its control points once tension is
    // applied, so measuring beats assuming.
    for (const def of sectors) {
      const anchor = this.tmpA.set(...def.position);
      let bestI = 0;
      let bestD = Infinity;
      for (let i = 0; i <= SAMPLES; i++) {
        const d = this.samples[i].distanceToSquared(anchor);
        if (d < bestD) {
          bestD = d;
          bestI = i;
        }
      }
      this.sectorDistance.push(this.cumulative[bestI]);
    }
  }

  /** Curve parameter for a distance along the route. */
  tAt(distance: number): number {
    const d = Math.max(0, Math.min(this.length, distance));
    let lo = 0;
    let hi = SAMPLES;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.cumulative[mid] < d) lo = mid + 1;
      else hi = mid;
    }
    const i = Math.max(1, lo);
    const a = this.cumulative[i - 1];
    const b = this.cumulative[i];
    const f = b > a ? (d - a) / (b - a) : 0;
    return (i - 1 + f) / SAMPLES;
  }

  /**
   * Position and a stable orthonormal frame at a distance along the route.
   *
   * The frame is built from world up rather than the curve's own binormal:
   * a Frenet frame flips whenever curvature reverses, which would roll the
   * whole world sideways halfway down a corridor.
   */
  poseAt(distance: number, out: Pose): Pose {
    const t = this.tAt(distance);
    this.curve.getPoint(t, out.position);
    this.curve.getTangent(t, out.tangent).normalize();
    out.right.crossVectors(out.tangent, WORLD_UP);
    if (out.right.lengthSq() < 1e-6) out.right.set(1, 0, 0);
    out.right.normalize();
    out.up.crossVectors(out.right, out.tangent).normalize();
    return out;
  }

  /** Distance at which the run-in to a sector's encounter begins. */
  approachDistance(index: number, lead: number): number {
    return Math.max(0, this.sectorDistance[index] - lead);
  }

  dispose(): void {
    this.samples.length = 0;
  }
}
