import * as THREE from 'three';

/**
 * Crisp canvas-texture labels. Cheaper and sharper than any SDF setup at this
 * scale, and it keeps typography consistent with the DOM HUD.
 */
export function makeLabel(
  code: string,
  name: string,
  sub: string,
  color: number,
): { sprite: THREE.Sprite; dispose: () => void } {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = 1024;
  const H = 320;
  const canvas = document.createElement('canvas');
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);

  const hex = `#${color.toString(16).padStart(6, '0')}`;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = '600 30px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillText(code.toUpperCase(), W / 2, 52);

  ctx.font = '700 108px "Space Grotesk", system-ui, sans-serif';
  ctx.shadowColor = hex;
  ctx.shadowBlur = 40;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(name, W / 2, 146);
  ctx.shadowBlur = 0;

  ctx.font = '400 34px "Inter", system-ui, sans-serif';
  ctx.fillStyle = hex;
  ctx.fillText(sub, W / 2, 226);

  ctx.strokeStyle = hex;
  ctx.globalAlpha = 0.7;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 150, 272);
  ctx.lineTo(W / 2 + 150, 272);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;

  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(64, 20, 1);

  return {
    sprite,
    dispose: () => {
      tex.dispose();
      mat.dispose();
    },
  };
}
