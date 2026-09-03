import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { bus } from './Events';
import { clamp } from './Math';
import { GrainShader } from '../shaders/grain';

export interface QualityTier {
  id: number;
  name: string;
  pixelRatio: number;
  bloom: boolean;
  bloomStrength: number;
  starCount: number;
  shardSegments: number;
  grain: boolean;
}

export const TIERS: QualityTier[] = [
  { id: 0, name: 'Low', pixelRatio: 1, bloom: false, bloomStrength: 0, starCount: 2200, shardSegments: 0, grain: false },
  { id: 1, name: 'Medium', pixelRatio: 1.25, bloom: true, bloomStrength: 0.5, starCount: 4200, shardSegments: 1, grain: true },
  { id: 2, name: 'High', pixelRatio: 1.75, bloom: true, bloomStrength: 0.85, starCount: 7000, shardSegments: 2, grain: true },
];

/**
 * Renderer, camera and post-processing chain, plus the adaptive quality
 * governor. Frame time is sampled continuously; if the device cannot hold the
 * budget we drop a tier rather than letting the experience stutter.
 */
export class Engine {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly composer: EffectComposer;

  private bloomPass: UnrealBloomPass;
  private grainPass: ShaderPass;
  private renderPass: RenderPass;

  tier: QualityTier;
  private frameSamples: number[] = [];
  private lastDowngrade = 0;

  constructor(readonly canvas: HTMLCanvasElement) {
    this.tier = pickInitialTier();

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: this.tier.id > 0,
      powerPreference: 'high-performance',
      stencil: false,
      alpha: false,
    });
    this.renderer.setClearColor(0x03040a, 1);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.camera = new THREE.PerspectiveCamera(62, 1, 0.5, 4200);
    this.camera.position.set(0, 4, 40);

    this.scene.fog = new THREE.FogExp2(0x04060f, 0.0022);

    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), this.tier.bloomStrength, 0.72, 0.2);
    this.bloomPass.enabled = this.tier.bloom;
    this.composer.addPass(this.bloomPass);

    this.grainPass = new ShaderPass(GrainShader);
    this.grainPass.enabled = this.tier.grain;
    this.composer.addPass(this.grainPass);

    this.composer.addPass(new OutputPass());

    this.applyTier(this.tier);
    this.resize();
    window.addEventListener('resize', this.resize, { passive: true });
  }

  private applyTier(tier: QualityTier): void {
    this.tier = tier;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, tier.pixelRatio));
    this.bloomPass.enabled = tier.bloom;
    this.bloomPass.strength = tier.bloomStrength;
    this.grainPass.enabled = tier.grain;
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
    this.grainPass.uniforms.resolution.value.set(w * px, h * px);
  };

  /** Rolling frame-time watchdog. Only ever steps quality down, never up-and-down. */
  private governQuality(dt: number, now: number): void {
    this.frameSamples.push(dt);
    if (this.frameSamples.length < 90) return;
    const avg = this.frameSamples.reduce((a, b) => a + b, 0) / this.frameSamples.length;
    this.frameSamples.length = 0;

    // Below ~38fps sustained, and we have not just downgraded: drop a tier.
    if (avg > 1 / 38 && this.tier.id > 0 && now - this.lastDowngrade > 6000) {
      this.lastDowngrade = now;
      this.applyTier(TIERS[this.tier.id - 1]);
    }
  }

  render(dt: number, elapsed: number): void {
    this.grainPass.uniforms.time.value = elapsed;
    this.composer.render();
    this.governQuality(dt, performance.now());
  }

  dispose(): void {
    window.removeEventListener('resize', this.resize);
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
