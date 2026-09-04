import * as THREE from 'three';

/**
 * The world-space sector marker.
 *
 * The first version drew the sector name as large flat white text on a sprite.
 * A reviewer called it a debug overlay, and they were right: nothing else in
 * this scene is opaque, unlit, or square-edged, so a slab of plain type floating
 * mid-frame read as something left switched on by mistake.
 *
 * This is the same information as a holographic tag instead — bracketed frame,
 * accent-tinted, drawn additively with the rest of the scene's light, with a
 * scanline and a leader line down to the object it labels. It reads as
 * projected rather than pasted, which is the whole difference.
 */
export function makeLabel(
  code: string,
  name: string,
  sub: string,
  color: number,
): { sprite: THREE.Sprite; dispose: () => void } {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = 1024;
  const H = 420;
  const canvas = document.createElement('canvas');
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);

  const hex = `#${color.toString(16).padStart(6, '0')}`;
  const cx = W / 2;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Leader line: ties the tag to the thing below it rather than leaving it
  // hovering in space.
  const grad = ctx.createLinearGradient(0, 250, 0, H);
  grad.addColorStop(0, hex);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.strokeStyle = grad;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, 250);
  ctx.lineTo(cx, H - 10);
  ctx.stroke();

  // Corner brackets. Four short strokes read as a frame without boxing the
  // type in, and they are the cheapest possible "this is an interface" cue.
  const bx = 250;
  const by = 44;
  const bw = 524;
  const bh = 190;
  const arm = 34;
  ctx.strokeStyle = hex;
  ctx.globalAlpha = 0.85;
  ctx.lineWidth = 3;
  for (const [x, y, dx, dy] of [
    [bx, by, 1, 1],
    [bx + bw, by, -1, 1],
    [bx, by + bh, 1, -1],
    [bx + bw, by + bh, -1, -1],
  ] as const) {
    ctx.beginPath();
    ctx.moveTo(x + dx * arm, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + dy * arm);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  ctx.font = '600 26px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = hex;
  ctx.globalAlpha = 0.9;
  ctx.fillText(code.toUpperCase(), cx, 78);
  ctx.globalAlpha = 1;

  ctx.font = '700 84px "Space Grotesk", system-ui, sans-serif';
  ctx.shadowColor = hex;
  ctx.shadowBlur = 34;
  ctx.fillStyle = '#eafcff';
  ctx.fillText(name, cx, 140);
  ctx.shadowBlur = 0;

  ctx.font = '400 27px "Inter", system-ui, sans-serif';
  ctx.fillStyle = hex;
  ctx.globalAlpha = 0.8;
  ctx.fillText(sub, cx, 200);
  ctx.globalAlpha = 1;

  // Horizontal scanlines across the tag, so it reads as a projection rather
  // than as printed type.
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  for (let y = by; y < by + bh; y += 4) ctx.fillRect(bx, y, bw, 1.6);
  ctx.globalCompositeOperation = 'source-over';

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  // Mipmaps matter here: a tag seen from a kilometre away is a handful of
  // pixels, and point-sampling 84px type down to that size produces a smear of
  // coloured speckle rather than a legible mark.
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.needsUpdate = true;

  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    // Additive, like every other light in the scene. Normal blending is what
    // made it sit on top of the world instead of inside it.
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(58, 24, 1);

  return {
    sprite,
    dispose: () => {
      tex.dispose();
      mat.dispose();
    },
  };
}
