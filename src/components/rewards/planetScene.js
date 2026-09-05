import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { PLANET_ITEMS } from './planetConfig';

const RADIUS = 4;
const UP = new THREE.Vector3(0, 1, 0);
export const planetNormal = ([lat, lon]) => new THREE.Vector3(
  Math.cos(lat * Math.PI / 180) * Math.sin(lon * Math.PI / 180),
  Math.sin(lat * Math.PI / 180),
  Math.cos(lat * Math.PI / 180) * Math.cos(lon * Math.PI / 180)
);

function landscape(n) {
  const lon = Math.atan2(n.x, n.z);
  const shore = -0.54 + Math.sin(lon * 3 + 0.6) * 0.13;
  const coastDistance = Math.min(n.y - shore, n.z < -0.5 ? Math.abs(n.y + 0.15) - 0.13 : Infinity);
  const sea = coastDistance < 0;
  const ripple = Math.sin(n.x * 19 + n.y * 7) * Math.cos(n.z * 15) * 0.014;
  const biomeEdge = Math.sin(lon * 7) * 0.045 + Math.cos(n.y * 17) * 0.04;
  return {
    height: sea ? RADIUS : RADIUS + Math.min(1, coastDistance / 0.045) * (0.06 + ripple + Math.max(0, n.y) * 0.035),
    color: sea ? coastDistance > -0.035 ? '#65bfd4' : '#479fc5' : coastDistance < 0.02 ? '#e4d4a0' : n.y > 0.69 + biomeEdge ? '#e2eee9' : lon > 0.62 + biomeEdge * 2 && lon < 2.7 ? '#e4c88c' : lon < -0.65 + biomeEdge * 2 ? '#9bc56e' : '#72b882',
    sea,
  };
}

// Original procedural scenery, built with the app's existing Three.js runtime.
// Shared geometry/materials keep the complete planet small and deterministic.
export function buildPlanetWorld() {
  const world = new THREE.Group();
  const itemGroups = new Map();
  const previewGroups = new Map();
  const animated = [];
  const movingObjects = new Set();
  const mergedGeometries = [];
  const materials = new Map();
  const geometries = {
    box: new THREE.BoxGeometry(1, 1, 1),
    ball: new THREE.IcosahedronGeometry(1, 1),
    rock: new THREE.IcosahedronGeometry(1, 0),
    cone: new THREE.ConeGeometry(1, 1, 6),
    cylinder: new THREE.CylinderGeometry(1, 1, 1, 10),
    taper: new THREE.CylinderGeometry(0.65, 1, 1, 10),
    roof: new THREE.CylinderGeometry(0, 1, 1, 4, 1),
    dome: new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    ring: new THREE.TorusGeometry(1, 0.055, 5, 24),
    wave: new THREE.TorusGeometry(1, 0.025, 3, 14, Math.PI * 0.65),
    gem: new THREE.CylinderGeometry(1, 1, 1, 6),
  };
  const triangle = new THREE.Shape();
  triangle.moveTo(-0.5, 0);
  triangle.lineTo(0.5, 0);
  triangle.lineTo(0, 1);
  triangle.closePath();
  geometries.gable = new THREE.ExtrudeGeometry(triangle, { depth: 1, bevelEnabled: false, steps: 1 });
  geometries.gable.translate(0, 0, -0.5);
  for (let i = 0; i < 8; i += 1) {
    geometries[`balloon-${i}`] = new THREE.SphereGeometry(1, 5, 12, i * Math.PI / 4, Math.PI / 4);
  }
  // All primitives use the same attributes/index format so different shapes
  // with one material can be merged without losing any detail.
  Object.entries(geometries).forEach(([key, geometry]) => {
    if (geometry.index) { geometries[key] = geometry.toNonIndexed(); geometry.dispose(); }
    geometries[key].clearGroups();
  });
  function mesh(parent, kind, color, pos, scale, rotation = [0, 0, 0]) {
    if (!materials.has(color)) materials.set(color, new THREE.MeshStandardMaterial({ color, roughness: 0.88, flatShading: true }));
    const object = new THREE.Mesh(geometries[kind], materials.get(color));
    object.position.set(...pos);
    object.scale.set(...scale);
    object.rotation.set(...rotation);
    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  }
  function group(parent, x = 0, y = 0, z = 0) {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    parent.add(g);
    return g;
  }
  function beam(g, from, to, radius = 0.01, color = '#876444') {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const direction = b.clone().sub(a);
    const object = mesh(g, 'cylinder', color, a.add(b).multiplyScalar(0.5).toArray(), [radius, direction.length(), radius]);
    object.quaternion.setFromUnitVectors(UP, direction.normalize());
    return object;
  }
  function flower(g, color = '#ed86bd', size = 1) {
    const f = group(g);
    f.scale.setScalar(size);
    mesh(f, 'cylinder', '#528b58', [0, 0.07, 0], [0.009, 0.14, 0.009]);
    mesh(f, 'ball', '#79b86c', [0.025, 0.065, 0], [0.044, 0.012, 0.019], [0, 0, 0.5]);
    for (let j = 0; j < 5; j += 1) {
      const a = j * Math.PI * 2 / 5;
      mesh(f, 'ball', color, [Math.cos(a) * 0.036, 0.15, Math.sin(a) * 0.036], [0.034, 0.017, 0.029]);
    }
    mesh(f, 'ball', '#ffd467', [0, 0.168, 0], [0.022, 0.014, 0.022]);
  }
  function fern(g) {
    for (let j = 0; j < 5; j += 1) {
      const f = group(g);
      f.rotation.y = j * Math.PI * 2 / 5;
      beam(f, [0, 0, 0], [0.14, 0.13, 0], 0.006, '#477f54');
      for (let k = 1; k < 5; k += 1) [-1, 1].forEach((s) => {
        mesh(f, 'ball', '#72b77c', [k * 0.028, k * 0.025, s * 0.018], [0.035, 0.009, 0.019], [0, s * 0.5, 0.4]);
      });
    }
  }
  function lantern(g) {
    mesh(g, 'cylinder', '#596c82', [0, 0.2, 0], [0.016, 0.4, 0.016]);
    mesh(g, 'box', '#ffe29a', [0, 0.43, 0], [0.075, 0.1, 0.075]);
    mesh(g, 'roof', '#596c82', [0, 0.5, 0], [0.077, 0.045, 0.077], [0, Math.PI / 4, 0]);
    [-1, 1].forEach((x) => [-1, 1].forEach((z) => beam(g, [x * 0.04, 0.37, z * 0.04], [x * 0.04, 0.49, z * 0.04], 0.007, '#596c82')));
  }
  function tent(g, color = '#f2ba65') {
    mesh(g, 'gable', color, [0, 0.01, 0], [0.65, 0.46, 0.56]);
    mesh(g, 'gable', '#586875', [0, 0.025, 0.287], [0.32, 0.33, 0.015]);
    beam(g, [0, 0.49, -0.36], [0, 0.49, 0.36], 0.015);
    [-1, 1].forEach((s) => {
      beam(g, [0, 0.47, s * 0.29], [0, 0.015, s * 0.58], 0.006, '#fff1cf');
      beam(g, [-0.33, 0.02, s * 0.27], [0, 0.47, s * 0.27], 0.009, '#fff1cf');
      beam(g, [0.33, 0.02, s * 0.27], [0, 0.47, s * 0.27], 0.009, '#fff1cf');
      mesh(g, 'box', '#876444', [0, 0.025, s * 0.58], [0.025, 0.07, 0.025]);
    });
    mesh(g, 'box', '#eb9068', [0, 0.025, 0.39], [0.26, 0.018, 0.16]);
  }
  function random(seed) {
    let value = seed;
    return () => { value = (value * 1664525 + 1013904223) >>> 0; return value / 4294967296; };
  }
  function scatter(parent, count, seed, spread, make) {
    const rand = random(seed);
    for (let i = 0; i < count; i += 1) {
      const angle = rand() * Math.PI * 2;
      const distance = Math.sqrt(rand()) * spread;
      const g = group(parent, Math.cos(angle) * distance, 0, Math.sin(angle) * distance);
      // Settle decorations into the curved ground instead of floating at its edges.
      g.position.y = -distance * distance / (2 * RADIUS);
      g.rotation.y = rand() * Math.PI * 2;
      g.scale.setScalar(0.65 + rand() * 0.5);
      make(g, i, rand);
    }
  }
  function pine(g, i = 0) {
    mesh(g, 'cylinder', '#826b4f', [0, 0.22, 0], [0.045, 0.44, 0.045]);
    mesh(g, 'cone', i % 2 ? '#357968' : '#428e69', [0, 0.33, 0], [0.26, 0.4, 0.26]);
    mesh(g, 'cone', '#4f9c73', [0, 0.52, 0], [0.21, 0.38, 0.21], [0, 0.35, 0]);
    mesh(g, 'cone', '#73b785', [0, 0.7, 0], [0.145, 0.35, 0.145]);
    [-1, 1].forEach((s) => beam(g, [0, 0.21, 0], [s * 0.14, 0.34, 0], 0.019));
  }
  function rock(g, x, z, size = 0.14) {
    mesh(g, 'rock', '#a9b29a', [x, size * 0.5, z], [size, size * 0.7, size * 0.8], [0, x, 0.2]);
  }
  function leafy(g, apples = false) {
    mesh(g, 'cylinder', '#7e6650', [0, 0.23, 0], [0.055, 0.46, 0.055]);
    [-1, 1].forEach((s) => beam(g, [0, 0.28, 0], [s * 0.16, 0.49, 0.015], 0.025));
    mesh(g, 'ball', '#79ad5d', [0, 0.53, 0], [0.31, 0.33, 0.29]);
    mesh(g, 'ball', '#a2c975', [-0.13, 0.61, 0.05], [0.2, 0.21, 0.22]);
    mesh(g, 'ball', '#8cbd68', [0.17, 0.55, 0.035], [0.21, 0.23, 0.22]);
    if (apples) for (let i = 0; i < 6; i += 1) {
      const a = i * 2.4;
      const p = group(g, Math.sin(a) * 0.28, 0.47 + (i % 3) * 0.11, Math.cos(a) * 0.28);
      mesh(p, 'ball', '#e97162', [0, 0, 0], [0.046, 0.05, 0.046]);
      mesh(p, 'cylinder', '#876444', [0, 0.049, 0], [0.006, 0.026, 0.006]);
      mesh(p, 'ball', '#477f54', [0.018, 0.055, 0], [0.026, 0.009, 0.011]);
    }
  }
  function fence(g, x, z, length, angle = 0) {
    const f = group(g, x, 0, z);
    f.rotation.y = angle;
    for (let i = 0; i < 6; i += 1) mesh(f, 'box', '#ded4ad', [-length / 2 + i * length / 5, 0.13, 0], [0.035, 0.29, 0.035]);
    [0.08, 0.2].forEach((y) => mesh(f, 'box', '#ded4ad', [0, y, 0], [length + 0.06, 0.03, 0.03]));
  }
  function cottage(g, color = '#d1bd91', roof = '#a96750') {
    mesh(g, 'box', '#b8b9b1', [0, 0.025, 0], [0.66, 0.075, 0.55]);
    mesh(g, 'box', color, [0, 0.22, 0], [0.58, 0.44, 0.47]);
    mesh(g, 'gable', roof, [0, 0.43, 0], [0.73, 0.3, 0.62]);
    for (let i = 1; i < 5; i += 1) [-1, 1].forEach((s) => {
      beam(g, [s * i * 0.072, 0.735 - i * 0.06, -0.314], [s * i * 0.072, 0.735 - i * 0.06, 0.314], 0.008, '#d6b18c');
    });
    [-1, 1].forEach((s) => {
      beam(g, [0, 0.74, 0.317], [s * 0.365, 0.435, 0.317], 0.02, '#f5e9ca');
      mesh(g, 'box', '#f5e9ca', [s * 0.28, 0.235, 0.24], [0.026, 0.4, 0.02]);
    });
    mesh(g, 'box', '#6e7860', [-0.05, 0.13, 0.241], [0.12, 0.26, 0.025]);
    [-0.2, 0.17].forEach((x) => {
      mesh(g, 'box', '#7c7960', [x, 0.26, 0.244], [0.13, 0.14, 0.026]);
      mesh(g, 'box', '#f5d991', [x, 0.26, 0.26], [0.088, 0.1, 0.018]);
      mesh(g, 'box', '#f5e9ca', [x, 0.26, 0.274], [0.01, 0.11, 0.012]);
      mesh(g, 'box', '#f5e9ca', [x, 0.26, 0.274], [0.1, 0.012, 0.012]);
      [-1, 1].forEach((s) => mesh(g, 'box', '#6a9ba1', [x + s * 0.078, 0.26, 0.258], [0.035, 0.14, 0.02]));
      mesh(g, 'box', '#bc825f', [x, 0.17, 0.28], [0.16, 0.046, 0.07]);
      [-0.045, 0.045].forEach((dx) => flower(group(g, x + dx, 0.19, 0.29), '#ea85b2', 0.38));
    });
    mesh(g, 'box', '#b4a48a', [0.17, 0.62, -0.09], [0.09, 0.27, 0.1]);
    mesh(g, 'box', '#7d8490', [0.17, 0.76, -0.09], [0.12, 0.035, 0.13]);
    mesh(g, 'ball', '#ffd467', [-0.018, 0.14, 0.261], [0.012, 0.012, 0.012]);
    mesh(g, 'box', '#bdc0b6', [-0.05, 0.025, 0.31], [0.2, 0.04, 0.11]);
    for (let i = 0; i < 5; i += 1) rock(g, (i % 2) * 0.035 - 0.07, 0.36 + i * 0.09, 0.06);
  }
  function water(g, size = 0.48) {
    mesh(g, 'cylinder', '#b1c7a1', [0, 0.005, 0], [size + 0.075, 0.06, size * 0.73 + 0.07]);
    mesh(g, 'cylinder', '#58bacb', [0, 0.04, 0], [size, 0.025, size * 0.73]);
    [0.48, 0.77].forEach((s) => mesh(g, 'ring', '#b8edf0', [0, 0.057, 0], [size * s, size * s * 0.73, 0.18], [-Math.PI / 2, 0, 0]));
  }
  function boat(g) {
    mesh(g, 'taper', '#987452', [0, 0.09, 0], [0.2, 0.15, 0.43], [Math.PI, 0, 0]);
    mesh(g, 'box', '#ccb28a', [0, 0.17, 0], [0.31, 0.025, 0.63]);
    mesh(g, 'cylinder', '#76624c', [0, 0.53, 0], [0.018, 0.75, 0.018]);
    mesh(g, 'gable', '#fff1cf', [0.14, 0.34, 0], [0.32, 0.52, 0.013], [0, 0, 0.2]);
    mesh(g, 'gable', '#ef937f', [-0.13, 0.36, 0], [0.23, 0.37, 0.012], [0, 0, -0.25]);
    beam(g, [-0.26, 0.34, 0.01], [0.29, 0.34, 0.01], 0.012);
    [-1, 1].forEach((s) => beam(g, [0, 0.9, 0], [0, 0.18, s * 0.3], 0.005, '#fff1cf'));
    for (let i = 0; i < 8; i += 1) mesh(g, 'box', '#9b7957', [0, 0.187, -0.28 + i * 0.08], [0.3, 0.006, 0.008]);
    mesh(g, 'ring', '#f1f5f9', [0.16, 0.2, -0.16], [0.058, 0.058, 0.55], [0, Math.PI / 2, 0]);
    mesh(g, 'box', '#876444', [0, 0.04, -0.36], [0.025, 0.15, 0.12]);
    return g;
  }
  function palm(g) {
    mesh(g, 'taper', '#aa8c5c', [0.06, 0.35, 0], [0.06, 0.7, 0.055], [0, 0, -0.16]);
    for (let j = 0; j < 6; j += 1) mesh(g, 'ring', '#8f714d', [j * 0.016 + 0.01, j * 0.1 + 0.08, 0], [0.055, 0.051, 0.35], [Math.PI / 2, 0.16, 0]);
    [-0.05, 0, 0.05].forEach((x) => mesh(g, 'ball', '#9b7957', [0.11 + x, 0.65, 0.055], [0.046, 0.052, 0.046]));
    for (let i = 0; i < 7; i += 1) {
      const a = i * Math.PI * 2 / 7;
      const f = group(g, 0.11, 0.7, 0);
      f.rotation.y = a;
      mesh(f, 'ball', i % 2 ? '#679968' : '#7b9e64', [0.19, 0.03, 0], [0.34, 0.045, 0.085], [0, 0, -0.2]);
      for (let j = 1; j < 5; j += 1) [-1, 1].forEach((s) => mesh(f, 'ball', '#8abf76', [j * 0.08, 0.055 - j * 0.011, s * 0.047], [0.09, 0.013, 0.029], [0, s * 0.6, -0.15]));
    }
  }
  const terrain = new THREE.SphereGeometry(RADIUS, 100, 64).toNonIndexed();
  const positions = terrain.attributes.position;
  const colors = [];
  for (let i = 0; i < positions.count; i += 3) {
    const center = new THREE.Vector3();
    for (let j = 0; j < 3; j += 1) center.add(new THREE.Vector3().fromBufferAttribute(positions, i + j));
    center.normalize();
    const color = new THREE.Color(landscape(center).color);
    const lightness = Math.sin(i * 13.37) * 0.019;
    color.offsetHSL(0, 0, lightness);
    for (let j = 0; j < 3; j += 1) {
      const n = new THREE.Vector3().fromBufferAttribute(positions, i + j).normalize();
      const height = landscape(n).height;
      positions.setXYZ(i + j, n.x * height, n.y * height, n.z * height);
      colors.push(color.r, color.g, color.b);
    }
  }
  terrain.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  terrain.computeVertexNormals();
  const terrainMesh = new THREE.Mesh(terrain, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, flatShading: true }));
  terrainMesh.receiveShadow = true;
  world.add(terrainMesh);

  function onSurface(position) {
    const n = planetNormal(position);
    const g = group(world);
    g.position.copy(n).multiplyScalar(landscape(n).height);
    g.quaternion.setFromUnitVectors(UP, n);
    return g;
  }

  // A welcoming free world: the land, sea, clouds, starter tent, trees, and path.
  const starter = onSurface([-5, -24]);
  tent(starter);
  lantern(group(starter, 0.4, 0, 0.28));
  leafy(group(starter, -0.49, -0.01, -0.2));
  rock(starter, 0.35, 0.1);
  for (let i = 0; i < 25; i += 1) {
    const p = onSurface([-5 + Math.sin(i * 0.18) * 5, -20 + i * 1.3]);
    mesh(p, 'rock', '#d8ceab', [0, 0.035, 0], [0.044, 0.018, 0.037]);
  }
  [[40, -39], [-25, 7], [38, 129], [0, -122]].forEach((p) => rock(onSurface(p), 0, 0, 0.2));
  const ocean = group(world);
  for (let i = 0; i < 34; i += 1) {
    const position = [-44 - (i % 4) * 7, -172 + i * 137.5 % 360];
    if (!landscape(planetNormal(position)).sea) continue;
    const w = onSurface(position);
    mesh(w, 'wave', '#a4dae7', [0, 0.012, 0], [0.17, 0.08, 0.35], [-Math.PI / 2, 0, 0.2]);
    mesh(w, 'wave', '#7dc8df', [0.05, 0.01, -0.075], [0.11, 0.05, 0.3], [-Math.PI / 2, 0, 0.2]);
    ocean.attach(w);
  }

  PLANET_ITEMS.forEach((item) => {
    const g = onSurface(item.position);
    g.name = item.id;
    itemGroups.set(item.id, g);
    switch (item.kind) {
      case 'forest':
        scatter(g, 19, 17, 0.82, (p, i) => pine(p, i));
        scatter(g, 6, 29, 0.9, (p) => rock(p, 0, 0, 0.16));
        scatter(g, 8, 39, 0.8, (p) => fern(p));
        mesh(g, 'cylinder', '#876444', [0.2, 0.065, 0.67], [0.075, 0.48, 0.075], [0, 0, Math.PI / 2]);
        [-0.045, 0.445].forEach((x) => {
          mesh(g, 'cylinder', '#d9ba87', [x, 0.065, 0.67], [0.065, 0.008, 0.065], [0, 0, Math.PI / 2]);
          mesh(g, 'ring', '#a3845d', [x, 0.065, 0.67], [0.04, 0.04, 0.3], [0, Math.PI / 2, 0]);
        });
        break;
      case 'flowers':
        scatter(g, 50, 22, 0.86, (p, i) => {
          flower(p, ['#ed86bd', '#fff1cf', '#a99de9', '#f5b482'][i % 4]);
        });
        for (let i = 0; i < 3; i += 1) {
          const butterfly = group(g, 0, 0.3, 0);
          movingObjects.add(butterfly);
          mesh(butterfly, 'cylinder', '#596c82', [0, 0, 0], [0.007, 0.065, 0.007], [Math.PI / 2, 0, 0]);
          const wings = [-1, 1].map((s) => mesh(butterfly, 'ball', i % 2 ? '#a99de9' : '#ffd467', [s * 0.04, 0, 0], [0.048, 0.008, 0.041]));
          animated.push((t) => {
            butterfly.position.set(Math.sin(t * 0.5 + i * 2) * 0.5, 0.32 + Math.sin(t + i) * 0.05, Math.cos(t * 0.6 + i * 2) * 0.5);
            wings.forEach((wing, j) => { wing.rotation.z = Math.sin(t * 10) * (j ? -0.6 : 0.6); });
          });
        }
        break;
      case 'camp': {
        tent(group(g, -0.3, 0, -0.1), '#ed986c');
        lantern(group(g, -0.65, 0, 0.27));
        const fire = group(g, 0.25, 0, 0.25);
        for (let i = 0; i < 8; i += 1) rock(fire, Math.sin(i * Math.PI / 4) * 0.18, Math.cos(i * Math.PI / 4) * 0.18, 0.065);
        mesh(fire, 'cylinder', '#745340', [0, 0.07, 0], [0.045, 0.31, 0.045], [Math.PI / 2, 0, 0.4]);
        mesh(fire, 'cylinder', '#876444', [0, 0.05, 0], [0.038, 0.3, 0.038], [Math.PI / 2, 0, -0.7]);
        const flame = mesh(fire, 'cone', '#eba955', [0, 0.19, 0], [0.09, 0.3, 0.09]);
        movingObjects.add(flame);
        mesh(fire, 'cone', '#f3d78b', [0, 0.17, 0.04], [0.048, 0.19, 0.048]);
        animated.push((t) => { flame.scale.y = 0.27 + Math.sin(t * 7) * 0.04; });
        for (let i = 0; i < 4; i += 1) {
          const ember = mesh(fire, 'ball', '#ffd467', [0, 0.3, 0], [0.009, 0.012, 0.009]);
          movingObjects.add(ember);
          animated.push((t) => { const age = (t * 0.5 + i / 4) % 1; ember.position.set(Math.sin(t + i) * age * 0.08, 0.2 + age * 0.35, 0.01); ember.scale.setScalar(0.012 * (1 - age)); });
        }
        mesh(g, 'cylinder', '#987452', [0.57, 0.07, 0.24], [0.07, 0.42, 0.07], [Math.PI / 2, 0, 0]);
        pine(group(g, 0.22, -0.02, -0.4));
        break;
      }
      case 'pond':
        water(g, 0.57);
        [0, 1, 2].forEach((i) => mesh(g, 'cylinder', '#7b9e65', [-0.27 + i * 0.19, 0.063, i % 2 * 0.19 - 0.1], [0.09, 0.012, 0.068]));
        mesh(g, 'ball', '#f1e6be', [0.21, 0.12, 0.1], [0.11, 0.067, 0.066]);
        mesh(g, 'ball', '#f1e6be', [0.28, 0.2, 0.1], [0.05, 0.052, 0.048]);
        mesh(g, 'cone', '#cf9856', [0.34, 0.19, 0.1], [0.027, 0.07, 0.027], [0, 0, -Math.PI / 2]);
        [-1, 1].forEach((s) => mesh(g, 'ball', '#35465c', [0.297, 0.212, 0.1 + s * 0.04], [0.009, 0.009, 0.007]));
        flower(group(g, -0.25, 0.046, -0.1), '#ed86bd', 0.65);
        for (let i = 0; i < 9; i += 1) {
          const x = -0.34 + i * 0.055;
          beam(g, [x, 0, -0.34], [x + 0.018, 0.25 + (i % 3) * 0.04, -0.34], 0.008, '#528b58');
          mesh(g, 'cylinder', '#9b7957', [x + 0.018, 0.26 + (i % 3) * 0.04, -0.34], [0.02, 0.065, 0.02]);
        }
        scatter(g, 8, 33, 0.67, (p) => rock(p, 0, 0, 0.085));
        break;
      case 'cottage':
        cottage(g);
        fence(g, 0, 0.65, 1.05);
        fence(g, -0.52, 0.1, 0.95, Math.PI / 2);
        leafy(group(g, 0.48, -0.02, -0.26));
        lantern(group(g, -0.34, 0, 0.4));
        scatter(group(g, 0.34, 0, 0.42), 8, 62, 0.15, (p, i) => flower(p, i % 2 ? '#a99de9' : '#ffd467', 0.6));
        break;
      case 'orchard':
        scatter(g, 8, 31, 0.7, (p) => leafy(p, true));
        fence(g, 0.1, 0.73, 1.2);
        [-0.2, 0.2].forEach((x) => {
          const crate = group(g, x, 0, 0.46);
          mesh(crate, 'box', '#9b7957', [0, 0.025, 0], [0.22, 0.04, 0.2]);
          [0.04, 0.09, 0.14].forEach((y) => [-1, 1].forEach((s) => {
            mesh(crate, 'box', '#d9ba87', [s * 0.105, y, 0], [0.015, 0.03, 0.22]);
            mesh(crate, 'box', '#d9ba87', [0, y, s * 0.1], [0.22, 0.03, 0.015]);
          }));
          for (let i = 0; i < 6; i += 1) mesh(crate, 'ball', i % 2 ? '#e97162' : '#ed986c', [-0.06 + (i % 3) * 0.06, 0.11, i > 2 ? 0.04 : -0.04], [0.035, 0.038, 0.035]);
        });
        break;
      case 'windmill': {
        mesh(g, 'taper', '#e0cf9e', [0, 0.45, 0], [0.24, 0.9, 0.24]);
        mesh(g, 'cone', '#a67954', [0, 1.02, 0], [0.3, 0.33, 0.3]);
        mesh(g, 'box', '#8d795a', [0, 0.14, 0.24], [0.13, 0.28, 0.03]);
        const sails = group(g, 0, 0.76, 0.29);
        movingObjects.add(sails);
        for (let i = 0; i < 4; i += 1) {
          const arm = group(sails);
          arm.rotation.z = i * Math.PI / 2;
          mesh(arm, 'box', '#a99165', [0, 0.31, 0], [0.04, 0.65, 0.03]);
          mesh(arm, 'box', '#ecdfb5', [0.06, 0.38, 0], [0.13, 0.38, 0.018]);
          [0, 0.12].forEach((x) => mesh(arm, 'box', '#a99165', [x, 0.38, 0.014], [0.013, 0.39, 0.016]));
          for (let j = 0; j < 5; j += 1) mesh(arm, 'box', '#a99165', [0.06, 0.2 + j * 0.09, 0.014], [0.14, 0.013, 0.016]);
        }
        mesh(sails, 'ball', '#8f7852', [0, 0, 0.025], [0.075, 0.075, 0.04]);
        animated.push((t) => { sails.rotation.z = t * 0.3; });
        mesh(g, 'cylinder', '#b8b9b1', [0, 0.025, 0], [0.3, 0.08, 0.3]);
        [-1, 1].forEach((s) => mesh(g, 'box', '#76b2c4', [s * 0.18, 0.49, 0.15], [0.055, 0.11, 0.02], [0, s * 0.65, 0]));
        mesh(g, 'cylinder', '#dbbd6e', [-0.43, 0.12, 0.3], [0.12, 0.25, 0.12], [0, 0, Math.PI / 2]);
        [-0.52, -0.35].forEach((x) => mesh(g, 'ring', '#9b7957', [x, 0.12, 0.3], [0.124, 0.124, 0.35], [0, Math.PI / 2, 0]));
        for (let row = 0; row < 5; row += 1) for (let col = 0; col < 8; col += 1) {
          mesh(g, 'cone', '#c9b167', [0.4 + row * 0.065, 0.06, -0.3 + col * 0.08], [0.027, 0.14, 0.027]);
          mesh(g, 'cylinder', '#9b9856', [0.4 + row * 0.065, 0.035, -0.3 + col * 0.08], [0.006, 0.11, 0.006]);
        }
        break;
      }
      case 'mountains':
        scatter(g, 7, 43, 0.57, (p, i) => {
          const height = 0.55 + (i % 3) * 0.25;
          mesh(p, 'cone', '#8eaaa6', [0, height / 2, 0], [0.35, height, 0.33]);
          mesh(p, 'cone', '#e7ead8', [0, height * 0.83, 0], [0.125, height * 0.35, 0.12]);
          mesh(p, 'rock', '#6d929e', [0.13, height * 0.25, 0.18], [0.16, height * 0.34, 0.16]);
          mesh(p, 'rock', '#f0f7f7', [-0.045, height * 0.68, 0.1], [0.105, 0.06, 0.12]);
        });
        scatter(g, 7, 145, 0.76, (p, i) => { p.scale.multiplyScalar(0.4); pine(p, i); });
        break;
      case 'crystals':
        scatter(g, 13, 65, 0.69, (p, i) => {
          const h = 0.35 + (i % 4) * 0.22;
          p.rotation.z = (i % 3 - 1) * 0.17;
          mesh(p, 'gem', i % 2 ? '#85b8dd' : '#b6a2e0', [0, h * 0.43, 0], [0.1, h * 0.86, 0.09]);
          mesh(p, 'cone', '#cde8f3', [0, h, 0], [0.1, h * 0.28, 0.09]);
          mesh(p, 'box', '#e4f5ff', [0.035, h * 0.57, 0.081], [0.013, h * 0.34, 0.009]);
          rock(p, 0.06, 0, 0.14);
          mesh(p, 'cone', '#a99de9', [-0.11, 0.11, 0.025], [0.06, 0.3, 0.06], [0, 0, 0.32]);
        });
        break;
      case 'lighthouse': {
        mesh(g, 'cylinder', '#b8b6a0', [0, 0.02, 0], [0.43, 0.07, 0.42]);
        for (let i = 0; i < 5; i += 1) mesh(g, 'cylinder', i % 2 ? '#ba705d' : '#e7dcc0', [0, 0.13 + i * 0.19, 0], [0.19 - i * 0.012, 0.19, 0.19 - i * 0.012]);
        mesh(g, 'cylinder', '#697c76', [0, 1.02, 0], [0.24, 0.055, 0.24]);
        mesh(g, 'cylinder', '#f1d797', [0, 1.13, 0], [0.13, 0.18, 0.13]);
        mesh(g, 'cone', '#ad6557', [0, 1.3, 0], [0.25, 0.19, 0.25]);
        [1.03, 1.13].forEach((y) => mesh(g, 'ring', '#596c82', [0, y, 0], [0.225, 0.225, 0.2], [Math.PI / 2, 0, 0]));
        for (let i = 0; i < 8; i += 1) {
          const a = i * Math.PI / 4;
          beam(g, [Math.sin(a) * 0.224, 1.03, Math.cos(a) * 0.224], [Math.sin(a) * 0.224, 1.13, Math.cos(a) * 0.224], 0.008, '#596c82');
          beam(g, [Math.sin(a) * 0.133, 1.04, Math.cos(a) * 0.133], [Math.sin(a) * 0.133, 1.23, Math.cos(a) * 0.133], 0.011, '#596c82');
        }
        mesh(g, 'box', '#596c82', [0, 0.17, 0.195], [0.09, 0.19, 0.02]);
        [0.45, 0.78].forEach((z) => [-0.055, 0.295].forEach((x) => mesh(g, 'cylinder', '#876444', [x, -0.015, z], [0.021, 0.19, 0.021])));
        for (let i = 0; i < 5; i += 1) mesh(g, 'box', '#ac956e', [0.12, -0.04, 0.4 + i * 0.11], [0.28, 0.04, 0.08]);
        boat(group(g, -0.5, -0.05, 0.6)).scale.setScalar(0.5);
        break;
      }
      case 'palms':
        water(g, 0.32);
        [[-0.4, -0.15], [0.3, -0.3], [0.42, 0.25], [-0.35, 0.31]].forEach(([x, z]) => palm(group(g, x, -0.015, z)));
        for (let i = 0; i < 5; i += 1) mesh(g, 'ball', '#fff1cf', [0.14 + i * 0.055, 0.015, 0.31], [0.03, 0.018, 0.027], [0, i, 0]);
        break;
      case 'ruins':
        [-0.45, -0.15, 0.15, 0.45].forEach((x, i) => {
          const h = i % 2 ? 0.62 : 0.9;
          mesh(g, 'box', '#c3a77a', [x, 0.04, 0], [0.23, 0.09, 0.24]);
          mesh(g, 'cylinder', '#e0c793', [x, h / 2, 0], [0.075, h, 0.075]);
          mesh(g, 'box', '#e6cd99', [x, h, 0], [0.22, 0.09, 0.23]);
          for (let j = 0; j < 8; j += 1) {
            const a = j * Math.PI / 4;
            mesh(g, 'cylinder', '#c3a77a', [x + Math.sin(a) * 0.075, h / 2, Math.cos(a) * 0.075], [0.009, h * 0.88, 0.009]);
          }
          [0.1, h - 0.06].forEach((y) => mesh(g, 'cylinder', '#e6cd99', [x, y, 0], [0.1, 0.055, 0.1]));
        });
        for (let i = 0; i < 9; i += 1) {
          const a = (i + 0.5) * Math.PI / 9;
          mesh(g, 'box', i === 4 ? '#f5e9ca' : '#dcc38f', [-0.3 + Math.cos(a) * 0.15, 0.87 + Math.sin(a) * 0.19, 0], [0.079, 0.12, 0.21], [0, 0, a - Math.PI / 2]);
        }
        for (let row = 0; row < 4; row += 1) for (let col = 0; col < 7; col += 1) mesh(g, 'box', (row + col) % 2 ? '#c3a77a' : '#85aaa2', [-0.45 + col * 0.15, -0.005, 0.2 + row * 0.12], [0.14, 0.025, 0.11]);
        fern(group(g, 0.46, 0, 0.2));
        scatter(g, 8, 45, 0.66, (p) => rock(p, 0, 0, 0.13));
        break;
      case 'mushrooms':
        scatter(g, 13, 78, 0.63, (p, i) => {
          mesh(p, 'cylinder', '#e3d4b0', [0, 0.16, 0], [0.035, 0.32, 0.035]);
          mesh(p, 'dome', i % 2 ? '#b76f70' : '#cc997d', [0, 0.27, 0], [0.18, 0.14, 0.18]);
          mesh(p, 'ball', '#efdeb8', [0.065, 0.39, 0.01], [0.036, 0.015, 0.029]);
          mesh(p, 'cylinder', '#f5e9ca', [0, 0.275, 0], [0.17, 0.012, 0.17]);
          for (let j = 0; j < 6; j += 1) {
            const a = j * Math.PI / 3;
            mesh(p, 'ball', '#fff1cf', [Math.cos(a) * 0.11, 0.375, Math.sin(a) * 0.11], [0.023, 0.01, 0.023]);
            beam(p, [0, 0.265, 0], [Math.cos(a) * 0.165, 0.265, Math.sin(a) * 0.165], 0.007, '#c3a77a');
          }
        });
        scatter(g, 6, 109, 0.68, (p) => fern(p));
        break;
      case 'waterfall': {
        water(g, 0.56);
        [0, 1, 2].forEach((i) => {
          mesh(g, 'rock', i % 2 ? '#819e9c' : '#91aaa4', [0, 0.2 + i * 0.23, -0.18 - i * 0.04], [0.42 - i * 0.045, 0.24, 0.3]);
          mesh(g, 'ball', '#79ad5d', [-0.24, 0.32 + i * 0.23, -0.16], [0.14, 0.035, 0.14]);
        });
        mesh(g, 'box', '#58bacb', [0.055, 0.42, 0.115], [0.19, 0.74, 0.04], [-0.18, 0, 0]);
        [-0.015, 0.04, 0.095].forEach((x) => mesh(g, 'box', '#b8edf0', [x, 0.43, 0.14], [0.018, 0.7, 0.017], [-0.18, 0, 0]));
        mesh(g, 'box', '#58bacb', [0.055, 0.8, -0.11], [0.2, 0.025, 0.33]);
        for (let i = 0; i < 9; i += 1) mesh(g, 'ball', '#e4f5ff', [-0.1 + i * 0.035, 0.075, 0.24 + (i % 2) * 0.05], [0.033, 0.018, 0.025]);
        for (let i = 0; i < 6; i += 1) {
          const drop = mesh(g, 'ball', '#d3ece0', [0.06, 0.3, 0.04], [0.018, 0.035, 0.018]);
          movingObjects.add(drop);
          animated.push((t) => { drop.position.y = 0.07 + (1 - ((t * 0.65 + i / 6) % 1)) * 0.72; drop.position.z = 0.23 - drop.position.y * 0.18; });
        }
        pine(group(g, -0.48, -0.02, -0.3));
        fern(group(g, 0.4, 0, -0.03));
        for (let i = 0; i < 8; i += 1) mesh(g, 'box', '#bc946c', [-0.36 + i * 0.1, 0.075 + Math.sin(i * Math.PI / 7) * 0.06, 0.43], [0.09, 0.028, 0.18]);
        break;
      }
      case 'sailboat':
        boat(g);
        animated.push((t) => { g.position.copy(planetNormal(item.position)).multiplyScalar(RADIUS + Math.sin(t * 1.2) * 0.025); });
        break;
      case 'observatory': {
        mesh(g, 'cylinder', '#c5c3b0', [0, 0.22, 0], [0.4, 0.44, 0.4]);
        mesh(g, 'dome', '#829ba6', [0, 0.44, 0], [0.43, 0.36, 0.43]);
        mesh(g, 'box', '#e8dba8', [0, 0.21, 0.4], [0.12, 0.23, 0.035]);
        mesh(g, 'cylinder', '#b4a378', [0.2, 0.8, 0.21], [0.07, 0.56, 0.07], [0.8, 0, -0.5]);
        mesh(g, 'cylinder', '#6c888d', [0.31, 0.96, 0.37], [0.09, 0.035, 0.09], [0.8, 0, -0.5]);
        mesh(g, 'cylinder', '#9be6f5', [0.32, 0.976, 0.384], [0.065, 0.036, 0.065], [0.8, 0, -0.5]);
        for (let i = 0; i < 8; i += 1) {
          const a = i * Math.PI / 4;
          for (let j = 0; j < 7; j += 1) {
            const b = j * Math.PI / 14;
            const c = (j + 1) * Math.PI / 14;
            beam(g, [Math.cos(a) * Math.cos(b) * 0.432, 0.44 + Math.sin(b) * 0.363, Math.sin(a) * Math.cos(b) * 0.432], [Math.cos(a) * Math.cos(c) * 0.432, 0.44 + Math.sin(c) * 0.363, Math.sin(a) * Math.cos(c) * 0.432], 0.008, '#cde8f3');
          }
          if (i !== 2) mesh(g, 'box', '#76b2c4', [Math.cos(a) * 0.395, 0.24, Math.sin(a) * 0.395], [0.095, 0.14, 0.015], [0, Math.PI / 2 - a, 0]);
        }
        [0, 1, 2].forEach((i) => mesh(g, 'box', '#b8b9b1', [0, 0.02 + i * 0.032, 0.59 - i * 0.07], [0.27, 0.04, 0.1]));
        lantern(group(g, -0.3, 0, 0.48));
        break;
      }
      case 'village':
        [[-0.42, 0, '#d4bb9d', '#98829c'], [0.36, -0.24, '#e2cda2', '#aa7965'], [0.2, 0.49, '#b7c3a0', '#6e8c84']].forEach(([x, z, c, r]) => {
          const house = group(g, x, -0.01, z);
          house.scale.setScalar(0.75);
          cottage(house, c, r);
        });
        fence(g, -0.32, 0.63, 0.75);
        leafy(group(g, -0.5, -0.03, -0.47));
        lantern(group(g, -0.16, 0, 0.27));
        lantern(group(g, 0.53, 0, 0.5));
        mesh(g, 'box', '#bc946c', [-0.58, 0.12, 0.36], [0.3, 0.03, 0.13]);
        mesh(g, 'box', '#bc946c', [-0.58, 0.22, 0.31], [0.3, 0.1, 0.025]);
        [-0.68, -0.48].forEach((x) => mesh(g, 'box', '#596c82', [x, 0.07, 0.36], [0.02, 0.12, 0.1]));
        scatter(group(g, 0.63, 0, -0.03), 6, 75, 0.16, (p) => flower(p, '#ed86bd', 0.6));
        break;
      case 'balloon': {
        const balloon = group(g, 0, 0.9, 0);
        movingObjects.add(balloon);
        for (let i = 0; i < 8; i += 1) mesh(balloon, `balloon-${i}`, ['#ed986c', '#fff1cf', '#89b9d1', '#fff1cf'][i % 4], [0, 0.69, 0], [0.39, 0.49, 0.39]);
        mesh(balloon, 'taper', '#ed986c', [0, 0.25, 0], [0.1, 0.2, 0.1], [Math.PI, 0, 0]);
        mesh(balloon, 'box', '#a3845d', [0, 0, 0], [0.22, 0.15, 0.2]);
        [-0.09, 0.09].forEach((x) => [-0.08, 0.08].forEach((z) => beam(balloon, [x, 0.04, z], [x * 1.6, 0.36, z * 1.6], 0.009, '#fff1cf')));
        [-0.045, 0, 0.045, 0.075].forEach((y) => [-1, 1].forEach((s) => {
          mesh(balloon, 'box', '#d9ba87', [0, y, s * 0.102], [0.224, 0.009, 0.008]);
          mesh(balloon, 'box', '#d9ba87', [s * 0.112, y, 0], [0.008, 0.009, 0.2]);
        }));
        mesh(balloon, 'cone', '#ffd467', [0, 0.17, 0], [0.027, 0.095, 0.027]);
        animated.push((t) => { balloon.position.y = 0.9 + Math.sin(t * 0.7) * 0.09; });
        break;
      }
      default: break;
    }
    // Capture just the reward itself for its shop image, before neighboring
    // trees and paths are attached. Geometry and materials remain shared.
    const preview = g.clone(true);
    preview.position.set(0, 0, 0);
    preview.quaternion.identity();
    previewGroups.set(item.id, preview);
    // Each reward grows a small neighborhood, giving the completed world the
    // lush, lived-in feel of the reference without charging for every pebble.
    const rand = random(PLANET_ITEMS.indexOf(item) * 71 + 123);
    const count = item.kind === 'forest' ? 28 : item.kind === 'flowers' ? 30 : item.kind === 'sailboat' || item.kind === 'balloon' ? 0 : 12;
    for (let i = 0; i < count; i += 1) {
      const a = rand() * Math.PI * 2;
      const distance = 8 + rand() * 9;
      const position = [THREE.MathUtils.clamp(item.position[0] + Math.sin(a) * distance, -70, 76), item.position[1] + Math.cos(a) * distance];
      if (landscape(planetNormal(position)).sea) continue;
      const detail = onSurface(position);
      detail.scale.setScalar(0.45 + rand() * 0.45);
      if (item.kind === 'forest' || item.kind === 'camp' || item.kind === 'waterfall') pine(detail, i);
      else if (item.kind === 'orchard' || item.kind === 'cottage' || item.kind === 'village') leafy(detail, item.kind === 'orchard');
      else if (item.kind === 'flowers') {
        mesh(detail, 'ball', ['#d5aac2', '#e9d995', '#ad9ac7'][i % 3], [0, 0.055, 0], [0.055, 0.04, 0.055]);
      } else rock(detail, 0, 0, 0.12 + rand() * 0.1);
      g.attach(detail);
    }
    if (item.position[0] > -35 && item.position[0] < 45 && Math.abs(item.position[1]) < 80) {
      const start = planetNormal([-5, -24]);
      const end = planetNormal(item.position);
      const steps = Math.ceil(start.angleTo(end) * 40);
      for (let i = 3; i < steps - 4; i += 1) {
        const n = start.clone().lerp(end, i / steps).normalize();
        if (landscape(n).sea) continue;
        const path = group(world);
        path.position.copy(n).multiplyScalar(landscape(n).height + 0.012);
        path.quaternion.setFromUnitVectors(UP, n);
        mesh(path, 'rock', '#d4cba3', [0, 0, 0], [0.034, 0.012, 0.028]);
        g.attach(path);
      }
    }
    // Animation callbacks may run for hidden objects, but they do not render.
    g.visible = false;
  });

  const clouds = group(world);
  [[27, -100], [64, -47], [-12, 82], [-49, 103], [-38, -38], [45, 152], [0, -163]].forEach((p, i) => {
    const n = planetNormal(p);
    const c = group(clouds);
    c.position.copy(n).multiplyScalar(4.75 + (i % 2) * 0.12);
    c.quaternion.setFromUnitVectors(UP, n);
    [-0.2, -0.08, 0.08, 0.22].forEach((x, j) => mesh(c, 'ball', '#f4f8ff', [x, j === 1 ? 0.075 : 0, 0], [0.18, j === 1 ? 0.16 : 0.11, 0.13]));
  });
  animated.push((t) => { clouds.rotation.y = t * 0.014; });

  // Batch static scenery by material per reward. Visibility still switches per
  // purchase, while hundreds of little trees/flowers take only a few draw calls.
  function batchStatic(root) {
    root.updateWorldMatrix(true, true);
    const inverse = root.matrixWorld.clone().invert();
    const batches = new Map();
    const visit = (node) => {
      if (movingObjects.has(node)) return;
      if (node.isMesh) {
        const geometry = node.geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse, node.matrixWorld));
        if (!batches.has(node.material)) batches.set(node.material, { geometries: [], objects: [] });
        batches.get(node.material).geometries.push(geometry);
        batches.get(node.material).objects.push(node);
      }
      node.children.forEach(visit);
    };
    root.children.forEach(visit);
    batches.forEach((batch, material) => {
      const geometry = mergeGeometries(batch.geometries);
      batch.geometries.forEach((part) => part.dispose());
      if (!geometry) return;
      mergedGeometries.push(geometry);
      const merged = new THREE.Mesh(geometry, material);
      merged.castShadow = true;
      merged.receiveShadow = true;
      root.add(merged);
      batch.objects.forEach((object) => object.removeFromParent());
    });
  }
  itemGroups.forEach(batchStatic);
  previewGroups.forEach(batchStatic);
  batchStatic(starter);
  batchStatic(clouds);
  batchStatic(ocean);

  return {
    radius: RADIUS,
    world,
    itemGroups,
    previewGroups,
    update: (time) => animated.forEach((animate) => animate(time)),
    dispose: () => {
      terrain.dispose();
      terrainMesh.material.dispose();
      Object.values(geometries).forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      mergedGeometries.forEach((geometry) => geometry.dispose());
    },
  };
}
