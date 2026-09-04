import * as THREE from 'three';
import { hullMaterial, glowMaterial, type HullMaterial } from '../shaders/hull';
import type { EnemyKind } from '../data/missions';

export interface EnemyVisual {
  group: THREE.Group;
  mats: HullMaterial[];
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
      uniforms: { uColor: { value: new THREE.Color(color) } },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          // Billboard: strip rotation from the model-view matrix so the quad
          // always faces the camera regardless of how the hull is oriented.
          vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
          mv.xy += position.xy;
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;
        uniform vec3 uColor;
        varying vec2 vUv;
        void main() {
          float r = length(vUv - 0.5) * 2.0;
          if (r > 1.0) discard;

          // A ring rather than a disc, so the marker frames the hull instead of
          // hiding it.
          float ring = smoothstep(0.66, 0.78, r) * smoothstep(0.93, 0.85, r);

          // A dark moat immediately outside the ring, and the reason this is
          // drawn with normal blending rather than additively. Hostiles cluster
          // around the node, which is the brightest object in the frame; an
          // additive marker over a bloom source has nothing left to add and
          // simply dissolves into the glow, so the one layer that has to stay
          // readable — where the things shooting at you are — was the first to
          // go. A band that takes light away separates against any background.
          float moat = smoothstep(0.85, 0.93, r) * smoothstep(1.0, 0.95, r);

          // Unpremultiplied: the moat contributes alpha but no colour, so it
          // reads as a shadow, while the ring carries the threat colour lifted
          // toward white so it still holds up against a bright core behind it.
          float a = clamp(ring * 0.92 + moat * 0.55, 0.0, 1.0);
          vec3 col = (uColor * 1.5 + vec3(0.22)) * ring;
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
    glows,
    spin,
    radius: size * 1.05,
    dispose() {
      for (const d of bin) d.dispose();
      bin.length = 0;
    },
  };
}
