import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { bus } from './Events';
import { clamp, damp } from './Math';
import { CompositeShader } from '../shaders/composite';

export interface QualityTier {
  id: number;
  name: string;
  pixelRatio: number;
  bloomStrength: number;
  starCount: number;
  /** Scales environment prop counts. */
  detail: number;
  /** Particle budget. */
  particles: number;
  grain: boolean;
}

export const TIERS: QualityTier[] = [
  { id: 0, name: 'Low', pixelRatio: 1, bloomStrength: 0.5, starCount: 2600, detail: 0.5, particles: 1500, grain: false },
  { id: 1, name: 'Medium', pixelRatio: 1.3, bloomStrength: 0.68, starCount: 4800, detail: 0.8, particles: 3000, grain: true },
  { id: 2, name: 'High', pixelRatio: 1.85, bloomStrength: 0.85, starCount: 8000, detail: 1, particles: 5000, grain: true },
];

/**
 * Renderer, camera, post-processing chain and the adaptive quality governor.
 *
 * Bloom is not decoration here, it is the art direction: every emissive edge,
 * bolt, shield cell and explosion core is authored expecting it, which is why it
 * stays enabled on every tier and only its strength moves. What gets cut on a
 * weak device is resolution, prop density and particle count — never the look.
 *
 * The composite pass is driven from gameplay. Boost, damage and explosions write
 * uniforms every frame, so the *frame itself* reacts: streaks stretch, the edges
 * go red, the screen punches white. Feedback the player feels before they read.
 */
export class Engine {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly composer: EffectComposer;

  private bloomPass: UnrealBloomPass;
  private compositePass: ShaderPass;
  private renderPass: RenderPass;

  /** Smoothed post-processing drivers. */
  private boost = 0;
  private damage = 0;
  private flash = 0;

  tier: QualityTier;
  private frameSamples: number[] = [];
  private lastDowngrade = 0;

  constructor(readonly canvas: HTMLCanvasElement) {
    this.tier = pickInitialTier();

    // ?tier=0|1|2 pins the quality tier. Useful when capturing screenshots or
    // reproducing a report from a device you do not have.
    const forced = new URLSearchParams(location.search).get('tier');
    if (forced !== null) {
      const n = Number(forced);
      if (Number.isFinite(n) && TIERS[clamp(n, 0, TIERS.length - 1)]) this.tier = TIERS[clamp(n, 0, TIERS.length - 1)];
    }

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      powerPreference: 'high-performance',
      stencil: false,
      alpha: false,
    });
    this.renderer.setClearColor(0x03040a, 1);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.95;

    // Far plane has to clear the whole route plus its debris shell.
    this.camera = new THREE.PerspectiveCamera(66, 1, 0.6, 6000);
    this.camera.position.set(0, 6, 40);

    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    // Threshold is the single most important number in this file. Too low and
    // the nebula, the fog and every dim surface bloom together into a white
    // wash that swallows the scene; 0.62 keeps the glow on things that are
    // genuinely emissive — bolts, shield cells, engine bells, explosions — so
    // they read as light sources against a dark world instead of everything
    // reading as fog.
    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), this.tier.bloomStrength, 0.72, 0.62);
    this.composer.addPass(this.bloomPass);

    this.compositePass = new ShaderPass(CompositeShader);
    this.composer.addPass(this.compositePass);

    this.composer.addPass(new OutputPass());

    this.applyTier(this.tier);
    this.resize();
    window.addEventListener('resize', this.resize, { passive: true });
    window.addEventListener('orientationchange', this.resize, { passive: true });
  }

  private applyTier(tier: QualityTier): void {
    this.tier = tier;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, tier.pixelRatio));
    this.bloomPass.strength = tier.bloomStrength;
    this.compositePass.uniforms.amount.value = tier.grain ? 0.028 : 0;
    this.resize();
    bus.emit('quality:change', { tier: tier.id });
  }

  setTier(id: number): void {
    const t = TIERS[clamp(id, 0, TIERS.length - 1)];
    if (t.id !== this.tier.id) this.applyTier(t);
  }

  resize = (): void => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
    const px = this.renderer.getPixelRatio();
    this.compositePass.uniforms.resolution.value.set(w * px, h * px);
  };

  /** Targets for the post drivers; the render step eases toward them. */
  setPost(boost: number, damage: number, accent: THREE.Color): void {
    this.boost = boost;
    this.damage = damage;
    (this.compositePass.uniforms.uAccent.value as THREE.Color).lerp(accent, 0.08);
  }

  /** Punch the screen. Called on explosions and node breaks. */
  punch(amount: number): void {
    this.flash = Math.min(1.1, this.flash + amount);
  }

  /** Rolling frame-time watchdog. Only ever steps quality down. */
  private governQuality(dt: number, now: number): void {
    this.frameSamples.push(dt);
    if (this.frameSamples.length < 90) return;
    const avg = this.frameSamples.reduce((a, b) => a + b, 0) / this.frameSamples.length;
    this.frameSamples.length = 0;

    if (avg > 1 / 38 && this.tier.id > 0 && now - this.lastDowngrade > 6000) {
      this.lastDowngrade = now;
      this.applyTier(TIERS[this.tier.id - 1]);
    }
  }

  render(dt: number, elapsed: number): void {
    const u = this.compositePass.uniforms;
    u.time.value = elapsed;
    // Boost eases in slower than it eases out, so acceleration feels like effort
    // and letting go feels like relief.
    u.uBoost.value = damp(u.uBoost.value as number, this.boost, 3, dt);
    u.uDamage.value = damp(u.uDamage.value as number, this.damage, 4, dt);
    this.flash = Math.max(0, this.flash - dt * 3.4);
    u.uFlash.value = this.flash;

    this.composer.render();
    this.governQuality(dt, performance.now());
  }

  dispose(): void {
    window.removeEventListener('resize', this.resize);
    window.removeEventListener('orientationchange', this.resize);
    this.composer.dispose();
    this.renderer.dispose();
  }
}

function pickInitialTier(): QualityTier {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = nav.hardwareConcurrency ?? 4;
  const mem = nav.deviceMemory ?? 4;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const small = Math.min(window.innerWidth, window.innerHeight) < 700;

  if (coarse && (cores <= 4 || mem <= 3)) return TIERS[0];
  if (coarse || small || cores <= 4 || mem <= 4) return TIERS[1];
  return TIERS[2];
}
