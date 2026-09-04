import * as THREE from 'three';
import type { SectorDef } from '../data/sectors';
import { createLandmark, type Landmark } from './Landmark';
import { makeLabel } from './Label';
import { clamp, damp, smoothstep } from '../core/Math';
import { glowMaterial } from '../shaders/hull';
import type { Particles } from '../fx/Particles';
import type { Impacts } from '../fx/Impacts';

export type NodeState = 'idle' | 'engaged' | 'breached' | 'decrypted';

/**
 * A shield bubble that has to be broken before the core can be hit.
 *
 * Two-stage bosses exist because a single health bar teaches nothing. The shield
 * gives the player something that visibly reacts on the very first shot — the
 * hex cells light up where the bolt landed — and its collapse is the beat that
 * says "now hurt the thing inside".
 */
const SHIELD_VERT = /* glsl */ `
  varying vec3 vLocal;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  void main() {
    vLocal = position;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vViewDir = normalize(cameraPosition - world.xyz);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const SHIELD_FRAG = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uHealth;
  uniform float uFlash;
  uniform vec3 uHitPoint;
  uniform float uHitAge;
  varying vec3 vLocal;
  varying vec3 vNormalW;
  varying vec3 vViewDir;

  // Hex distance field on a spherical shell, derived from the two dominant
  // axes of the local position. Cheap, and the seams read as panel joins.
  float hexGrid(vec2 p) {
    p *= 5.5;
    vec2 q = vec2(p.x * 1.1547, p.y + p.x * 0.5774);
    vec2 f = fract(q);
    vec2 i = floor(q);
    float d = min(min(f.x, f.y), 1.0 - max(f.x, f.y));
    // Silence the unused-warning-free path: i participates via jitter.
    d += 0.02 * fract(sin(dot(i, vec2(12.9898, 78.233))) * 43758.5453);
    return smoothstep(0.0, 0.09, d);
  }

  void main() {
    vec3 N = normalize(vNormalW);
    vec3 V = normalize(vViewDir);
    float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 2.2);

    vec3 d = normalize(vLocal);
    float cells = 1.0 - hexGrid(vec2(atan(d.z, d.x) * 0.7, d.y * 1.6));

    // Impact ripple: a ring expanding from the last hit point.
    float ring = 0.0;
    if (uHitAge < 1.0) {
      float dist = distance(normalize(uHitPoint), d);
      float r = uHitAge * 1.7;
      ring = smoothstep(0.22, 0.0, abs(dist - r)) * (1.0 - uHitAge);
    }

    float breathe = 0.5 + 0.5 * sin(uTime * 1.4 + d.y * 3.0);

    // Restrained on purpose. This is a 26-metre additive sphere with the
    // sector's landmark inside it — push the brightness and the shield stops
    // reading as a shield and becomes an opaque glowing ball that hides the
    // thing the visitor came to look at. Impact ripples and the hit flash are
    // the only parts allowed to go genuinely bright.
    float a = (0.025 + cells * 0.07 + fres * 0.26) * uHealth;
    a += ring * 0.7 + uFlash * 0.3;

    vec3 col = uColor * (0.28 + cells * 0.25 + fres * 0.8 + ring * 2.6 + uFlash * 1.6);
    col += vec3(1.0) * ring * 1.2;
    col *= 0.7 + breathe * 0.3;

    gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
  }
`;

/**
 * One chapter of the résumé as a place, and as a fight.
 *
 * The landmark is not scenery any more — it is the encryption node holding the
 * dossier. You are stopped short of it, you break its shield, you break its
 * core, and it opens. Turning the sector's identity object into the boss means
 * the reward for winning is the content itself, which is the only progression
 * currency this site actually cares about.
 */
export class Sector {
  readonly object = new THREE.Group();
  readonly landmark: Landmark;

  /** Rail distance of the node. Assigned by World from the Route. */
  distance = 0;

  state: NodeState = 'idle';
  /**
   * Only the sector currently being flown to shows its tag. Every sector
   * showing one meant three or four tiny labels piled up around the vanishing
   * point at once, which read as a smear of coloured noise in the middle of the
   * frame rather than as signage.
   */
  labelled = false;
  maxHp = 20;
  hp = 20;
  /** Portion of maxHp absorbed by the shield. */
  shieldShare = 0.45;

  /** Collision radius for incoming fire. */
  readonly radius: number;

  private label: { sprite: THREE.Sprite; dispose: () => void };
  private shield: THREE.Mesh;
  private shieldMat: THREE.ShaderMaterial;
  private cage: THREE.Mesh;
  private cageMat: THREE.MeshBasicMaterial;
  private ring: THREE.Mesh;
  private ringMat: THREE.MeshBasicMaterial;
  private core: THREE.Mesh;
  private coreMat: THREE.MeshBasicMaterial;

  private hitFlash = 0;
  private hitAge = 2;
  private decryptTime = -1;
  private activation = 0;
  private bin: Array<THREE.BufferGeometry | THREE.Material> = [];

  constructor(
    readonly def: SectorDef,
    private particles: Particles,
    private impacts: Impacts,
  ) {
    this.object.position.set(...def.position);
    this.object.name = `sector:${def.id}`;
    this.radius = 26;

    const keep = <T extends THREE.BufferGeometry | THREE.Material>(x: T): T => {
      this.bin.push(x);
      return x;
    };

    this.landmark = createLandmark(def);
    this.object.add(this.landmark.object);

    this.label = makeLabel(def.code, def.name, def.subtitle, def.color);
    this.label.sprite.position.set(0, 56, 0);
    this.object.add(this.label.sprite);

    this.shieldMat = keep(
      new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color(def.color) },
          uTime: { value: 0 },
          uHealth: { value: 1 },
          uFlash: { value: 0 },
          uHitPoint: { value: new THREE.Vector3(0, 1, 0) },
          uHitAge: { value: 2 },
        },
        vertexShader: SHIELD_VERT,
        fragmentShader: SHIELD_FRAG,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      }),
    );
    this.shield = new THREE.Mesh(keep(new THREE.SphereGeometry(this.radius, 48, 32)), this.shieldMat);
    this.object.add(this.shield);

    // A hard wireframe cage over the soft shield: two overlapping frequencies
    // make the bubble read as engineered rather than as a bloom artefact.
    this.cageMat = keep(
      new THREE.MeshBasicMaterial({
        color: def.color,
        wireframe: true,
        transparent: true,
        opacity: 0.12,
        toneMapped: false,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    this.cage = new THREE.Mesh(keep(new THREE.IcosahedronGeometry(this.radius * 1.03, 2)), this.cageMat);
    this.object.add(this.cage);

    // Equatorial ring: the "this is a target" affordance, visible from far off.
    this.ringMat = keep(glowMaterial(def.color, 0.32));
    this.ring = new THREE.Mesh(keep(new THREE.TorusGeometry(this.radius * 1.5, 0.34, 6, 96)), this.ringMat);
    this.ring.rotation.x = Math.PI / 2.1;
    this.object.add(this.ring);

    // Exposed core, hidden until the shield drops.
    this.coreMat = keep(glowMaterial(0xffffff, 0));
    this.core = new THREE.Mesh(keep(new THREE.IcosahedronGeometry(6.4, 1)), this.coreMat);
    this.core.visible = false;
    this.object.add(this.core);

  }

  /** World position of the node, for aiming and collision. */
  get position(): THREE.Vector3 {
    return this.object.position;
  }

  get decrypted(): boolean {
    return this.state === 'decrypted';
  }

  get shielded(): boolean {
    return this.hp > this.maxHp * (1 - this.shieldShare);
  }

  /** 0→1 remaining, for the HUD boss bar. */
  get healthPct(): number {
    return clamp(this.hp / this.maxHp, 0, 1);
  }

  get shieldPct(): number {
    const band = this.maxHp * this.shieldShare;
    const into = this.hp - (this.maxHp - band);
    return clamp(into / band, 0, 1);
  }

  get corePct(): number {
    const band = this.maxHp * (1 - this.shieldShare);
    return clamp(this.hp / band, 0, 1);
  }

  arm(hp: number): void {
    this.maxHp = hp;
    this.hp = hp;
    this.state = 'engaged';
  }

  /** Restore to a pre-fight state, for a progress reset. */
  disarm(): void {
    this.state = 'idle';
    this.hp = this.maxHp;
    this.decryptTime = -1;
    this.core.visible = false;
    this.coreMat.opacity = 0;
    this.shieldMat.uniforms.uHealth.value = 1;
    this.shield.visible = true;
    this.cage.visible = true;
  }

  /**
   * Open the node without the fight. Used by the stall assist: a visitor who
   * cannot or will not shoot still gets the chapter, and still gets the
   * detonation that announces it.
   */
  forceDecrypt(): void {
    if (this.state === 'decrypted') return;
    this.hp = 0;
    if (this.state === 'idle') this.state = 'engaged';
    this.breachShield();
    this.beginDecrypt();
  }

  /** Mark as already-open, for a returning visitor who cleared it last time. */
  markDecrypted(): void {
    this.state = 'decrypted';
    this.hp = 0;
    this.decryptTime = 0;
    this.shield.visible = false;
    this.cage.visible = false;
    this.core.visible = true;
    this.coreMat.opacity = 0.9;
  }

  /** Take a hit. Returns true if it did damage. */
  hit(damage: number, at: THREE.Vector3): boolean {
    if (this.state === 'decrypted') return false;
    if (this.state === 'idle') return false;

    const wasShielded = this.shielded;
    this.hp = Math.max(0, this.hp - damage);
    this.hitFlash = 1;
    this.hitAge = 0;
    // The shader ripples from a *local* direction, so convert out of world space.
    this.shieldMat.uniforms.uHitPoint.value.copy(at).sub(this.object.position).normalize();

    if (wasShielded && !this.shielded) this.breachShield();
    // hit() returns early once decrypted, so reaching zero can only happen once.
    if (this.hp <= 0) this.beginDecrypt();
    return true;
  }

  private breachShield(): void {
    this.state = 'breached';
    const p = this.object.position;

    // Shatter: a bright ring on the shield's own radius plus a shell of debris
    // travelling outward at the shield surface, so the bubble visibly bursts.
    this.impacts.ring(p, this.radius * 2.6, this.def.color, 0.7);
    this.impacts.ring(p, this.radius * 1.6, 0xffffff, 0.45);
    this.impacts.flash(p, this.radius * 1.4, this.def.color, 0.3);
    this.particles.burst(p, {
      count: 120,
      color: this.def.color,
      color2: 0xffffff,
      speed: 96,
      life: 1.1,
      size: 2.6,
      drag: 1.5,
    });

    this.core.visible = true;
  }

  private beginDecrypt(): void {
    this.state = 'decrypted';
    this.decryptTime = 0;
    const p = this.object.position;

    // The payoff. Three rings on different axes, a huge particle bloom and a
    // white core flash — this is the biggest single effect in the game, because
    // it is the moment a chapter of the résumé unlocks.
    this.impacts.explosion(p, 12, this.def.color, 0xffffff);
    this.impacts.ring(p, this.radius * 5.5, 0xffffff, 1.1);
    this.impacts.ring(p, this.radius * 4.2, this.def.color, 0.9);
    this.particles.burst(p, {
      count: 260,
      color: 0xffffff,
      color2: this.def.color,
      speed: 150,
      life: 1.6,
      size: 3.4,
      drag: 1.1,
    });
    this.particles.burst(p, {
      count: 90,
      color: this.def.color,
      color2: 0x1a1030,
      speed: 60,
      life: 2.6,
      size: 2,
      drag: 0.5,
      gravity: 6,
    });
  }

  update(elapsed: number, dt: number, playerPos: THREE.Vector3): void {
    const dist = playerPos.distanceTo(this.object.position);
    const target = 1 - smoothstep(120, 620, dist);
    this.activation = damp(this.activation, target, 3, dt);

    this.landmark.update(elapsed, dt, this.activation, this.decrypted);

    if (this.hitFlash > 0) this.hitFlash = Math.max(0, this.hitFlash - dt * 4);
    this.hitAge = Math.min(2, this.hitAge + dt * 1.6);

    // Label: readable on the approach, gone by the time you are fighting. Held
    // on screen at close range it becomes a giant grey watermark across the
    // node you are supposed to be shooting.
    const near = smoothstep(1500, 700, dist);
    const tooClose = smoothstep(520, 260, dist);
    const show = this.labelled ? 1 : 0;
    (this.label.sprite.material as THREE.SpriteMaterial).opacity = clamp(near * (1 - tooClose) * show, 0, 1);
    this.label.sprite.position.y = 52 + Math.sin(elapsed * 0.7) * 1.4;
    this.label.sprite.scale.set(56, 23, 1);

    this.shieldMat.uniforms.uTime.value = elapsed;
    this.shieldMat.uniforms.uFlash.value = this.hitFlash;
    this.shieldMat.uniforms.uHitAge.value = this.hitAge;

    if (this.state === 'decrypted') {
      this.decryptTime += dt;
      const k = Math.min(1, this.decryptTime * 1.4);
      this.shieldMat.uniforms.uHealth.value = 0;
      this.shield.visible = false;
      this.cage.visible = false;
      this.core.visible = true;
      this.coreMat.opacity = 0.35 + 0.55 * k;
      this.core.scale.setScalar(1 + Math.sin(elapsed * 1.8) * 0.06 + (1 - k) * 2.4);
      this.ringMat.opacity = 0.28 + Math.sin(elapsed * 1.4) * 0.1;
      this.ring.scale.setScalar(1 + (1 - k) * 0.5);
    } else {
      const health = this.state === 'idle' ? 1 : this.shieldPct;
      this.shieldMat.uniforms.uHealth.value = 0.25 + health * 0.75;
      this.cageMat.opacity = 0.04 + health * 0.11 + this.hitFlash * 0.25;
      // Shield contracts as it fails, so its condition is legible at a glance.
      const s = 0.9 + health * 0.1;
      this.shield.scale.setScalar(s);
      this.cage.scale.setScalar(s);
      this.ringMat.opacity = 0.2 + this.activation * 0.14 + this.hitFlash * 0.35;

      if (this.state === 'breached') {
        this.coreMat.opacity = 0.5 + Math.sin(elapsed * 9) * 0.2 + this.hitFlash * 0.4;
        this.core.scale.setScalar(1 + Math.sin(elapsed * 7) * 0.12);
        // Vent sparks from the exposed core so it visibly reads as damaged.
        if (Math.random() < dt * 16) {
          this.particles.burst(this.object.position, {
            count: 3,
            color: 0xffffff,
            color2: this.def.color,
            speed: 44,
            life: 0.6,
            size: 2,
            drag: 2.2,
          });
        }
      }
    }

    this.core.rotation.y = elapsed * 0.7;
    this.core.rotation.x = elapsed * 0.4;
    this.cage.rotation.y = elapsed * 0.16;
    this.cage.rotation.x = elapsed * 0.09;
    this.ring.rotation.z = elapsed * 0.22;

  }

  dispose(): void {
    this.label.dispose();
    this.landmark.dispose();
    for (const d of this.bin) d.dispose();
    this.bin.length = 0;
  }
}
