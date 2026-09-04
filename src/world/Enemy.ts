import * as THREE from 'three';
import { hullMaterial, glowMaterial, type HullMaterial } from '../shaders/hull';
import type { EnemyKind } from '../data/missions';

export interface EnemyVisual {
  group: THREE.Group;
  mats: HullMaterial[];
  /** The threat marker's own material — driven per frame for spin and pulse. */
  marker: THREE.ShaderMaterial;
  /** Additive parts whose opacity is driven by hit flash and death fade. */
  glows: THREE.MeshBasicMaterial[];
  /** Sub-objects the update loop spins. */
  spin: THREE.Object3D[];
  /** Radius used for both hit tests and explosion sizing. */
  radius: number;
  dispose(): void;
}

/**
 * Hostile silhouettes.
 *
 * Four shapes that are distinguishable at a glance and at distance, because in
 * a game where the player has one second to decide whether something is
 * dangerous, the silhouette *is* the tutorial. Discs drift, darts weave, spikes
 * charge, turrets shoot. Nobody has to be told.
 */
export function buildEnemy(kind: EnemyKind, color: number, size: number): EnemyVisual {
  const bin: Array<THREE.BufferGeometry | THREE.Material> = [];
  const keep = <T extends THREE.BufferGeometry | THREE.Material>(x: T): T => {
    bin.push(x);
    return x;
  };
  const group = new THREE.Group();
  const mats: HullMaterial[] = [];
  const glows: THREE.MeshBasicMaterial[] = [];
  const spin: THREE.Object3D[] = [];

  // Hot rim, near-black body, and a white-hot eye. Hostiles have to separate
  // from a sector's own colour scheme at a glance and at distance.
  const shell = keep(hullMaterial({ color, base: 0x1c0a08, rim: 2.4, power: 1.5, glow: 0.16, panel: 0.9 }));
  mats.push(shell);

  const eye = (r: number, z: number, c = 0xffffff) => {
    const m = keep(glowMaterial(c, 0.95));
    glows.push(m);
    const mesh = new THREE.Mesh(keep(new THREE.SphereGeometry(r, 12, 10)), m);
    mesh.position.z = z;
    return mesh;
  };

  switch (kind) {
    case 'drone': {
      // A flat hex plate with a single central eye. Reads as "slow, harmless,
      // shoot me" — which is exactly what the first sector needs.
      const plate = new THREE.Mesh(keep(new THREE.CylinderGeometry(1.5, 1.1, 0.42, 6)), shell);
      plate.rotation.x = Math.PI / 2;
      group.add(plate);
      group.add(eye(0.42, -0.32, color));
      for (const s of [1, -1]) {
        const finGeo = keep(new THREE.BoxGeometry(0.14, 0.9, 1.1));
        const fin = new THREE.Mesh(finGeo, shell);
        fin.position.set(s * 1.3, 0, 0.5);
        fin.rotation.z = s * 0.4;
        group.add(fin);
      }
      const halo = keep(glowMaterial(color, 0.4));
      glows.push(halo);
      const ring = new THREE.Mesh(keep(new THREE.TorusGeometry(1.7, 0.06, 4, 24)), halo);
      ring.rotation.x = Math.PI / 2;
      spin.push(ring);
      group.add(ring);
      break;
    }

    case 'weaver': {
      // A forward-swept dart: narrow head, wide trailing vanes.
      const shape = new THREE.Shape();
      shape.moveTo(0, -2);
      shape.lineTo(1.5, 1.3);
      shape.lineTo(0.45, 1.6);
      shape.lineTo(0, 0.4);
      shape.lineTo(-0.45, 1.6);
      shape.lineTo(-1.5, 1.3);
      shape.lineTo(0, -2);
      const geo = keep(new THREE.ExtrudeGeometry(shape, { depth: 0.34, bevelEnabled: false }));
      const body = new THREE.Mesh(geo, shell);
      body.rotation.x = Math.PI / 2;
      body.position.y = 0.17;
      group.add(body);
      group.add(eye(0.3, -1.2, 0xffffff));
      const spineMat = keep(glowMaterial(color, 0.85));
      glows.push(spineMat);
      const spineMesh = new THREE.Mesh(keep(new THREE.BoxGeometry(0.12, 0.12, 3.1)), spineMat);
      spineMesh.position.z = -0.2;
      group.add(spineMesh);
      break;
    }

    case 'lancer': {
      // A long spike wrapped in accelerator rings. Unmistakably pointed at you.
      const spike = new THREE.Mesh(keep(new THREE.ConeGeometry(0.62, 5.2, 5)), shell);
      spike.rotation.x = -Math.PI / 2;
      group.add(spike);
      const tail = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.55, 0.3, 1.6, 5)), shell);
      tail.rotation.x = Math.PI / 2;
      tail.position.z = 2.9;
      group.add(tail);
      for (let i = 0; i < 3; i++) {
        const m = keep(glowMaterial(color, 0.75 - i * 0.16));
        glows.push(m);
        const ring = new THREE.Mesh(keep(new THREE.TorusGeometry(0.85 + i * 0.16, 0.075, 4, 20)), m);
        ring.position.z = 0.4 + i * 1.0;
        spin.push(ring);
        group.add(ring);
      }
      group.add(eye(0.34, -2.5, 0xfff0d0));
      break;
    }

    case 'sentry': {
      // Heavy, static, obviously armed: a faceted core, a shield cage that
      // spins, and a barrel that tracks the player.
      const core = new THREE.Mesh(keep(new THREE.OctahedronGeometry(1.55, 1)), shell);
      group.add(core);
      spin.push(core);

      const cageMat = keep(
        new THREE.MeshBasicMaterial({
          color,
          wireframe: true,
          transparent: true,
          opacity: 0.42,
          toneMapped: false,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      glows.push(cageMat as unknown as THREE.MeshBasicMaterial);
      const cage = new THREE.Mesh(keep(new THREE.IcosahedronGeometry(2.5, 0)), cageMat);
      spin.push(cage);
      group.add(cage);

      const barrel = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.3, 0.42, 2.6, 10)), shell);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.z = -1.5;
      group.add(barrel);

      const mouthMat = keep(glowMaterial(0xffd0f0, 0.95));
      glows.push(mouthMat);
      const mouth = new THREE.Mesh(keep(new THREE.CircleGeometry(0.34, 14)), mouthMat);
      mouth.position.z = -2.82;
      mouth.rotation.y = Math.PI;
      group.add(mouth);
      break;
    }
  }

  // A camera-facing halo so a hostile is findable even when it is small, far
  // away, or silhouetted against a bright structure. This is the single biggest
  // readability win available and it costs one extra quad per enemy.
  const haloMat = keep(
    new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(color) },
        uTime: { value: 0 },
        uHit: { value: 0 },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          // Billboard: strip rotation from the model-view matrix so the quad
          // always faces the camera regardless of how the hull is oriented.
          vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
          // Hold a minimum apparent size. Left to shrink with the hull, a marker
          // on a hostile 300 units out is a couple of pixels, and the only lever
          // left is brightness — which trades invisibility for a bloom blob and
          // destroys the bracket shape that carries the meaning. Past this range
          // the marker stops shrinking; inside it, it tracks the hull normally.
          float grow = max(1.0, -mv.z / 150.0);
          mv.xy += position.xy * grow;
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;
        uniform vec3 uColor;
        uniform float uTime;
        uniform float uHit;
        varying vec2 vUv;
        void main() {
          vec2 q = vUv - 0.5;
          float r = length(q) * 2.0;
          if (r > 1.0) discard;

          /*
           * Four rotating brackets, not a ring.
           *
           * Colour alone could not carry this. Threat owns the red-orange
           * wedge, but two sectors are lit in hot pink and crimson, so against
           * their architecture a red ring is a red shape among red shapes and
           * reviewers kept reporting that they could not tell a hostile from
           * scenery at a glance. Hue was the wrong channel to fight over.
           *
           * Nothing else in this world rotates on its own axis at a constant
           * rate, and no piece of architecture is drawn as a broken bracket. A
           * marker that spins and is cut into four arcs is therefore
           * unmistakable at any size, against any backdrop, in any sector,
           * without spending a colour it does not have to spend.
           */
          float ang = atan(q.y, q.x) + uTime * 0.9;
          float seg = abs(fract(ang / 1.5707963 + 0.5) - 0.5) * 2.0;
          float bracket = smoothstep(0.30, 0.52, seg);

          // The arc the brackets are cut out of.
          float band = smoothstep(0.60, 0.71, r) * smoothstep(0.90, 0.80, r);
          float ring = band * bracket;

          // A dark moat outside the brackets, and the reason this is drawn with
          // normal blending rather than additively. Hostiles cluster around the
          // node, the brightest object in the frame; an additive marker over a
          // bloom source has nothing left to add and dissolves into the glow,
          // so the one layer that must stay readable was the first to go. A
          // band that takes light away separates against any background.
          float moat = smoothstep(0.84, 0.93, r) * smoothstep(1.0, 0.95, r);

          // A slow pulse, so a stationary hostile still moves.
          float pulse = 0.86 + 0.14 * sin(uTime * 3.4);

          /*
           * The brackets are nearly white, not threat-red.
           *
           * Red is the threat identity and the hull keeps it, but a marker has
           * a different job from an identity: it has to be found against
           * whatever happens to be behind it, and two of the six sectors are
           * lit in hot pink and crimson. A red bracket inside a pink shield is
           * camouflage. Near-white over a dark moat reads against every
           * backdrop in the game, and no sector owns it — which is exactly why
           * reticles are neutral in almost everything that ships.
           */
          vec3 markCol = mix(uColor, vec3(1.0), 0.5);

          // Unpremultiplied: the moat contributes alpha but no colour, so it
          // reads as a shadow under the brackets.
          float a = clamp(ring * 0.95 * pulse + moat * 0.55 + uHit * 0.35, 0.0, 1.0);
          // Kept under the bloom threshold on purpose. Pushed past it the brackets
          // stop being brackets and become white blobs: the shape carries the
          // meaning here, and bloom is what destroys shape.
          vec3 col = markCol * (0.95 * ring * pulse) + vec3(1.0) * uHit * 0.45;
          gl_FragColor = vec4(col, a);
        }
      `,
      transparent: true,
      depthWrite: false,
    }),
  );
  const halo = new THREE.Mesh(keep(new THREE.PlaneGeometry(9, 9)), haloMat);
  // Threat markers are an information layer: they draw after the world so a
  // node or a prop can never end up sorted in front of the thing it is marking.
  halo.renderOrder = 5;
  group.add(halo);

  group.scale.setScalar(size / 2.6);

  return {
    group,
    mats,
    marker: haloMat,
    glows,
    spin,
    radius: size * 1.05,
    dispose() {
      for (const d of bin) d.dispose();
      bin.length = 0;
    },
  };
}
