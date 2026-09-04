import * as THREE from 'three';
import { Sector } from './Sector';
import { Starfield } from './Starfield';
import { Causeway } from './Causeway';
import { Corridor, nearestPair } from './Corridor';
import { Environment } from './Environment';
import { Nebula } from './Nebula';
import { Route } from './Route';
import { sectors as sectorDefs, type SectorId } from '../data/sectors';
import type { Particles } from '../fx/Particles';
import type { Impacts } from '../fx/Impacts';
import type { Ship } from '../player/Ship';
import { setHullFog } from '../shaders/hull';

const WHITE = new THREE.Color(0xffffff);

/** Deep-space base colours per sector, behind the nebula's accent clouds. */
const DEEP: Record<SectorId, number> = {
  origin: 0x050a14,
  ventures: 0x140615,
  forge: 0x0b0620,
  arcade: 0x160d05,
  track: 0x040b1c,
  uplink: 0x03110f,
};

/**
 * Owns the scene graph and the sense of place: the route, the six nodes, the
 * corridor, per-sector environments, the sky, and the colour grade that ties
 * them together.
 *
 * The colour work here matters more than any single object in it. Every frame,
 * the nebula, the fog and the CSS accent variable are all interpolated from the
 * two sectors the ship is between — so travelling from VENTURES to THE FORGE is
 * a continuous slide from magenta into violet across the sky, the haze and the
 * user interface at once. That is what makes the corridor feel like a journey
 * rather than a series of rooms.
 */
export class World {
  readonly group = new THREE.Group();
  readonly sectors: Sector[] = [];
  readonly route: Route;

  private starfield: Starfield;
  private causeway: Causeway;
  private corridor: Corridor;
  private environment: Environment;
  readonly nebula: Nebula;

  private colA = new THREE.Color();
  private colB = new THREE.Color();
  private accent = new THREE.Color();
  private deep = new THREE.Color();
  private cloud = new THREE.Color();
  private hotCloud = new THREE.Color();
  private fogTint = new THREE.Color();
  private fog: THREE.FogExp2;

  constructor(
    scene: THREE.Scene,
    particles: Particles,
    impacts: Impacts,
    starCount: number,
    pixelRatio: number,
    detail: number,
  ) {
    this.route = new Route();

    for (const def of sectorDefs) {
      const s = new Sector(def, particles, impacts);
      this.sectors.push(s);
      this.group.add(s.object);
    }
    // Each node's rail distance comes from the route, not from its own
    // coordinates: the spline does not pass exactly through its control points.
    this.sectors.forEach((s, i) => {
      s.distance = this.route.sectorDistance[i];
    });

    this.nebula = new Nebula(detail > 0.6 ? 1 : 0.75);
    scene.add(this.nebula.object);

    this.starfield = new Starfield(starCount, pixelRatio);
    this.group.add(this.starfield.object);

    // The floor and ceiling that make the corridor read as a corridor.
    this.causeway = new Causeway(this.route);
    this.group.add(this.causeway.object);

    this.corridor = new Corridor(this.route);
    this.group.add(this.corridor.object);

    this.environment = new Environment(this.route, detail);
    this.group.add(this.environment.object);

    this.fog = new THREE.FogExp2(0x05070f, 0.0012);
    scene.fog = this.fog;
  }

  /** Tag only the sector being flown to; see Sector.labelled. */
  setLabelled(index: number): void {
    this.sectors.forEach((s, i) => {
      s.labelled = i === index;
    });
  }

  sector(id: SectorId): Sector | undefined {
    return this.sectors.find((s) => s.def.id === id);
  }

  /** The two-sector blend at a distance, as a colour pair plus the mix. */
  paletteAt(distance: number): { accent: THREE.Color; deep: THREE.Color; hot: THREE.Color } {
    const { a, b, f } = nearestPair(this.route, distance);
    this.colA.set(sectorDefs[a].color);
    this.colB.set(sectorDefs[b].color);
    this.accent.copy(this.colA).lerp(this.colB, f);
    this.deep.set(DEEP[sectorDefs[a].id]).lerp(new THREE.Color(DEEP[sectorDefs[b].id]), f);
    return { accent: this.accent, deep: this.deep, hot: this.colB };
  }

  update(
    elapsed: number,
    dt: number,
    ship: Ship,
    pixelRatio: number,
  ): THREE.Color {
    this.starfield.update(elapsed, pixelRatio);

    this.corridor.update(elapsed);
    this.environment.update(elapsed);

    const { accent, deep } = this.paletteAt(ship.distance);

    // The sky takes a heavily dimmed sector accent for its clouds and a slightly
    // hotter one for the filaments. Both are scaled well down: the backdrop has
    // to sit *below* the bloom threshold or it drags the whole frame with it.
    this.cloud.copy(accent).multiplyScalar(0.34);
    this.hotCloud.copy(accent).lerp(WHITE, 0.35).multiplyScalar(0.5);
    this.nebula.setPalette(this.cloud.getHex(), this.hotCloud.getHex(), deep.getHex());
    this.nebula.update(elapsed, dt);

    // Fog glues distant structures into the sky rather than leaving them
    // floating on top of it — but only a trace of accent, and darker than the
    // sky itself, so haze never becomes a light source.
    this.fogTint.copy(deep).lerp(accent, 0.1).multiplyScalar(0.8);
    this.fog.color.lerp(this.fogTint, Math.min(1, dt * 1.2));
    setHullFog(this.fog.color, this.fog.density);
    this.causeway.update(elapsed, accent, this.fog.color, this.fog.density);

    for (const s of this.sectors) {
      s.update(elapsed, dt, ship.object.position);
    }

    return accent;
  }

  dispose(): void {
    for (const s of this.sectors) s.dispose();
    this.starfield.dispose();
    this.causeway.dispose();
    this.corridor.dispose();
    this.environment.dispose();
    this.nebula.dispose();
  }
}
