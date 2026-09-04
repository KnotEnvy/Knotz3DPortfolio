import * as THREE from 'three';
import type { SectorDef } from '../data/sectors';
import { hullMaterial } from '../shaders/hull';

export interface Landmark {
  object: THREE.Object3D;
  update(elapsed: number, dt: number, activation: number, decrypted: boolean): void;
  dispose(): void;
}

const disposables: Array<THREE.BufferGeometry | THREE.Material> = [];
const track = <T extends THREE.BufferGeometry | THREE.Material>(x: T): T => {
  disposables.push(x);
  return x;
};

const glowMat = (color: number, opacity = 1) =>
  track(
    new THREE.MeshBasicMaterial({
      color,
      transparent: opacity < 1,
      opacity,
      toneMapped: false,
    }),
  );

// Landmarks share the scene's Fresnel hull look rather than standard PBR: no
// lights to rig, and the rim picks out every edge of these silhouettes, which
// is the whole reason they are recognisable from a kilometre out.
const shellMat = (color: number) =>
  // The objective. It was graded identically to the scenery it stands in,
  // which is the wrong way round for the one structure the whole sector is
  // about — it should be the thing you pick out of the frame first after the
  // things shooting at you.
  track(hullMaterial({ color, base: 0x0a1220, rim: 1.5, power: 2.1, glow: 0.08, panel: 3.5 }));

const wireMat = (color: number, opacity: number) =>
  track(new THREE.LineBasicMaterial({ color, transparent: true, opacity, toneMapped: false }));

/** Wireframe overlay for a mesh, using edge extraction rather than triangle wires. */
function edges(geo: THREE.BufferGeometry, color: number, opacity = 0.55, threshold = 18): THREE.LineSegments {
  return new THREE.LineSegments(track(new THREE.EdgesGeometry(geo, threshold)), wireMat(color, opacity));
}

/**
 * Every sector gets a distinct silhouette so the world is navigable from a
 * distance — you learn the map by shape, not by reading labels.
 */
export function createLandmark(def: SectorDef): Landmark {
  switch (def.form) {
    case 'knot':
      return knot(def.color);
    case 'twin':
      return twin(def.color);
    case 'reactor':
      return reactor(def.color);
    case 'cabinet':
      return cabinet(def.color);
    case 'spine':
      return spine(def.color);
    case 'beacon':
      return beacon(def.color);
  }
}

/* ---------------------------------------------------------------- ORIGIN */

function knot(color: number): Landmark {
  const group = new THREE.Group();

  // A smooth torus knot has no hard edges, so EdgesGeometry gives nothing to
  // draw. The silhouette comes from a coarse wireframe shell instead.
  const solid = new THREE.Mesh(track(new THREE.TorusKnotGeometry(13, 3.1, 180, 20, 2, 3)), shellMat(color));
  const wire = new THREE.Mesh(
    track(new THREE.TorusKnotGeometry(13.4, 3.35, 72, 8, 2, 3)),
    track(new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: 0.26, toneMapped: false })),
  );

  const core = new THREE.Mesh(track(new THREE.IcosahedronGeometry(5.2, 1)), glowMat(color));

  // Two face-on rings so the landmark still reads from a level approach.
  const ringA = new THREE.Mesh(track(new THREE.TorusGeometry(23, 0.3, 6, 110)), glowMat(color, 0.55));
  const ringB = new THREE.Mesh(track(new THREE.TorusGeometry(28, 0.22, 6, 110)), glowMat(color, 0.3));
  ringB.rotation.y = Math.PI / 2;

  group.add(solid, wire, core, ringA, ringB);

  return {
    object: group,
    update(t, _dt, act) {
      group.rotation.y = t * 0.16;
      solid.rotation.x = Math.sin(t * 0.11) * 0.22;
      wire.rotation.x = solid.rotation.x;
      core.scale.setScalar((1 + Math.sin(t * 1.6) * 0.05) * (0.9 + act * 0.35));
      ringA.rotation.z = t * 0.35;
      ringA.rotation.x = Math.PI / 2 + Math.sin(t * 0.4) * 0.35;
      ringB.rotation.z = -t * 0.25;
    },
    dispose() {},
  };
}

/* -------------------------------------------------------------- VENTURES */

function twin(color: number): Landmark {
  const group = new THREE.Group();
  const towers: THREE.Object3D[] = [];

  for (const [i, x] of [-13, 13].entries()) {
    const h = i === 0 ? 34 : 26;
    const geo = track(new THREE.BoxGeometry(9, h, 9, 1, 4, 1));
    const t = new THREE.Group();
    const m = new THREE.Mesh(geo, shellMat(color));
    const w = edges(geo, color, 0.55);
    const cap = new THREE.Mesh(track(new THREE.BoxGeometry(11, 0.9, 11)), glowMat(color, 0.85));
    cap.position.y = h / 2 + 1.2;
    t.add(m, w, cap);
    t.position.set(x, h / 2 - 10, i === 0 ? -3 : 4);
    towers.push(t);
    group.add(t);
  }

  // Connecting bridge: the two businesses feed each other.
  const bridgeGeo = track(new THREE.BoxGeometry(28, 0.6, 2.4));
  const bridge = new THREE.Mesh(bridgeGeo, glowMat(color, 0.6));
  bridge.position.y = 4;
  bridge.rotation.y = -0.2;
  group.add(bridge);

  const ringGeo = track(new THREE.TorusGeometry(24, 0.35, 8, 120));
  const ring = new THREE.Mesh(ringGeo, glowMat(color, 0.5));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -12;
  group.add(ring);

  return {
    object: group,
    update(t, _dt, act) {
      group.rotation.y = Math.sin(t * 0.14) * 0.3;
      ring.rotation.z = t * 0.32;
      ring.position.y = -12 + Math.sin(t * 0.7) * 1.6;
      towers.forEach((tw, i) => {
        tw.position.y += Math.sin(t * 0.9 + i * 1.7) * 0.012;
      });
      bridge.scale.x = 1 + act * 0.04;
    },
    dispose() {},
  };
}

/* ----------------------------------------------------------------- FORGE */

function reactor(color: number): Landmark {
  const group = new THREE.Group();

  const coreGeo = track(new THREE.IcosahedronGeometry(9, 2));
  const core = new THREE.Mesh(coreGeo, shellMat(color));
  const coreWire = edges(coreGeo, color, 0.5, 12);
  const inner = new THREE.Mesh(track(new THREE.IcosahedronGeometry(5.4, 1)), glowMat(color));
  group.add(core, coreWire, inner);

  // Three orbital rings on skewed axes — the accelerator silhouette.
  const rings: THREE.Mesh[] = [];
  const radii = [17, 21.5, 26];
  for (let i = 0; i < 3; i++) {
    const r = new THREE.Mesh(track(new THREE.TorusGeometry(radii[i], 0.34, 8, 140)), glowMat(color, 0.62 - i * 0.12));
    r.rotation.set(Math.PI / 2 + i * 0.5, i * 0.9, i * 0.3);
    rings.push(r);
    group.add(r);
  }

  // Orbiting nodes: the "neurons" of the reactor.
  const nodeGeo = track(new THREE.OctahedronGeometry(1.1, 0));
  const nodeMat = glowMat(color, 0.9);
  const nodes = new THREE.InstancedMesh(nodeGeo, nodeMat, 14);
  nodes.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  group.add(nodes);

  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const v = new THREE.Vector3();
  const sc = new THREE.Vector3(1, 1, 1);

  return {
    object: group,
    update(t, _dt, act) {
      group.rotation.y = t * 0.1;
      rings.forEach((r, i) => {
        r.rotation.z = t * (0.35 + i * 0.18) * (i % 2 ? -1 : 1);
        r.rotation.x = Math.PI / 2 + i * 0.5 + Math.sin(t * 0.3 + i) * 0.2;
      });
      inner.scale.setScalar(1 + Math.sin(t * 2.4) * 0.08 + act * 0.2);
      core.rotation.y = -t * 0.2;

      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2 + t * (0.5 + (i % 3) * 0.2);
        const r = 14 + (i % 4) * 4;
        v.set(Math.cos(a) * r, Math.sin(a * 1.7 + i) * 6, Math.sin(a) * r);
        q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), a);
        m.compose(v, q, sc);
        nodes.setMatrixAt(i, m);
      }
      nodes.instanceMatrix.needsUpdate = true;
    },
    dispose() {},
  };
}

/* ---------------------------------------------------------------- ARCADE */

function cabinet(color: number): Landmark {
  const group = new THREE.Group();

  const bodyGeo = track(new THREE.BoxGeometry(18, 30, 12));
  const body = new THREE.Mesh(bodyGeo, shellMat(color));
  group.add(body, edges(bodyGeo, color, 0.6));

  // Emissive screen with a moving scan pattern.
  const screenMat = track(
    new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(color) }, uAct: { value: 0 } },
      transparent: true,
      toneMapped: false,
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: /* glsl */ `
        uniform float uTime; uniform vec3 uColor; uniform float uAct; varying vec2 vUv;
        float box(vec2 p, vec2 b){ vec2 d = abs(p) - b; return length(max(d,0.0)) + min(max(d.x,d.y),0.0); }
        void main(){
          vec2 uv = vUv;
          // Marching invader-ish blocks.
          vec2 g = fract(uv * vec2(9.0, 7.0) + vec2(floor(uTime*2.0)*0.11, uTime * 0.18));
          float cell = step(0.62, g.x) * step(0.62, g.y);
          float scan = 0.5 + 0.5 * sin(uv.y * 90.0 - uTime * 6.0);
          float glow = 0.22 + cell * 0.9;
          vec3 c = uColor * (glow + scan * 0.12) * (0.7 + uAct * 0.8);
          gl_FragColor = vec4(c, 0.95);
        }`,
    }),
  );
  const screen = new THREE.Mesh(track(new THREE.PlaneGeometry(13, 10)), screenMat);
  screen.position.set(0, 6, 6.1);
  screen.rotation.x = -0.14;
  group.add(screen);

  const marqueeGeo = track(new THREE.BoxGeometry(19, 3.2, 1));
  const marquee = new THREE.Mesh(marqueeGeo, glowMat(color, 0.9));
  marquee.position.set(0, 16, 5.6);
  group.add(marquee);

  // Joystick + buttons on the control deck.
  const deck = new THREE.Mesh(track(new THREE.BoxGeometry(17, 1.2, 7)), shellMat(color));
  deck.position.set(0, -2.6, 8);
  deck.rotation.x = -0.25;
  group.add(deck);
  const stick = new THREE.Mesh(track(new THREE.CapsuleGeometry(0.5, 2.6, 4, 8)), glowMat(0xffffff, 0.9));
  stick.position.set(-4, -0.6, 8);
  group.add(stick);
  for (let i = 0; i < 3; i++) {
    const b = new THREE.Mesh(track(new THREE.CylinderGeometry(0.8, 0.8, 0.5, 16)), glowMat(color, 0.95));
    b.position.set(1 + i * 2.6, -1.4, 8);
    b.rotation.x = -0.25;
    group.add(b);
  }

  const podium = new THREE.Mesh(track(new THREE.CylinderGeometry(16, 18, 1.4, 48, 1, true)), glowMat(color, 0.28));
  podium.position.y = -16;
  group.add(podium);

  // The cabinet is authored at readable proportions, then trimmed so it does
  // not dwarf the rest of the map.
  group.scale.setScalar(0.85);

  return {
    object: group,
    update(t, _dt, act) {
      group.rotation.y = Math.sin(t * 0.2) * 0.35 + 0.15;
      group.position.y = Math.sin(t * 0.6) * 0.9;
      screenMat.uniforms.uTime.value = t;
      screenMat.uniforms.uAct.value = act;
      stick.rotation.z = Math.sin(t * 3.1) * 0.35;
      podium.rotation.y = -t * 0.3;
    },
    dispose() {},
  };
}

/* ----------------------------------------------------------------- TRACK */

function spine(color: number): Landmark {
  const group = new THREE.Group();
  const plates: THREE.Object3D[] = [];
  const count = 6;

  for (let i = 0; i < count; i++) {
    const w = 22 - i * 1.9;
    const geo = track(new THREE.BoxGeometry(w, 0.9, 11));
    const plate = new THREE.Group();
    plate.add(new THREE.Mesh(geo, shellMat(color)), edges(geo, color, 0.7));
    plate.position.y = -14 + i * 6.2;
    plate.rotation.y = i * 0.42;
    plates.push(plate);
    group.add(plate);
  }

  const column = new THREE.Mesh(track(new THREE.CylinderGeometry(0.5, 0.5, 42, 12)), glowMat(color, 0.55));
  column.position.y = 2;
  group.add(column);

  const cap = new THREE.Mesh(track(new THREE.OctahedronGeometry(3.4, 0)), glowMat(color));
  cap.position.y = 25;
  group.add(cap);

  return {
    object: group,
    update(t, _dt, act) {
      plates.forEach((p, i) => {
        p.rotation.y = i * 0.42 + t * (0.12 + i * 0.02);
        p.position.y = -14 + i * 6.2 + Math.sin(t * 0.8 + i * 0.6) * 0.5;
      });
      cap.rotation.y = t * 0.9;
      cap.rotation.x = t * 0.5;
      cap.scale.setScalar(1 + act * 0.35 + Math.sin(t * 2) * 0.06);
    },
    dispose() {},
  };
}

/* ---------------------------------------------------------------- UPLINK */

function beacon(color: number): Landmark {
  const group = new THREE.Group();

  const mastGeo = track(new THREE.CylinderGeometry(0.9, 2.6, 42, 10));
  const mast = new THREE.Mesh(mastGeo, shellMat(color));
  group.add(mast, edges(mastGeo, color, 0.45));

  const orb = new THREE.Mesh(track(new THREE.IcosahedronGeometry(5, 2)), glowMat(color));
  orb.position.y = 24;
  group.add(orb);

  const cage = new THREE.Mesh(track(new THREE.IcosahedronGeometry(8.2, 1)), track(new THREE.MeshBasicMaterial({
    color,
    wireframe: true,
    transparent: true,
    opacity: 0.35,
    toneMapped: false,
  })));
  cage.position.y = 24;
  group.add(cage);

  // Expanding transmission rings.
  const pulses: THREE.Mesh[] = [];
  for (let i = 0; i < 4; i++) {
    const r = new THREE.Mesh(track(new THREE.RingGeometry(1, 1.35, 80)), glowMat(color, 0.5));
    r.rotation.x = Math.PI / 2;
    r.position.y = 24;
    pulses.push(r);
    group.add(r);
  }

  const base = new THREE.Mesh(track(new THREE.CylinderGeometry(14, 17, 2, 6)), shellMat(color));
  base.position.y = -22;
  group.add(base, (() => {
    const e = edges(track(new THREE.CylinderGeometry(14, 17, 2, 6)), color, 0.7);
    e.position.y = -22;
    return e;
  })());

  return {
    object: group,
    update(t, _dt, act) {
      group.rotation.y = t * 0.14;
      orb.rotation.y = -t * 0.6;
      orb.scale.setScalar(1 + Math.sin(t * 2.2) * 0.07 + act * 0.25);
      cage.rotation.y = t * 0.35;
      cage.rotation.z = t * 0.2;
      pulses.forEach((p, i) => {
        const phase = ((t * 0.35 + i / pulses.length) % 1);
        const s = 1 + phase * 34;
        p.scale.setScalar(s);
        (p.material as THREE.MeshBasicMaterial).opacity = (1 - phase) * 0.55 * (0.5 + act * 0.5);
      });
    },
    dispose() {},
  };
}

/** Landmark geometries and materials are cached module-wide; freed on teardown. */
export function disposeLandmarkCache(): void {
  for (const d of disposables) d.dispose();
  disposables.length = 0;
}
