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
  const sea = n.y < shore || (n.z < -0.5 && Math.abs(n.y + 0.15) < 0.13);
  const ripple = Math.sin(n.x * 19 + n.y * 7) * Math.cos(n.z * 15) * 0.014;
  const biomeEdge = Math.sin(lon * 7) * 0.045 + Math.cos(n.y * 17) * 0.04;
  return {
    height: sea ? RADIUS : RADIUS + 0.06 + ripple + Math.max(0, n.y) * 0.035,
    color: sea ? '#5896a2' : n.y > 0.69 + biomeEdge ? '#d5e3cc' : lon > 0.62 + biomeEdge * 2 && lon < 2.7 ? '#d9bd79' : lon < -0.65 + biomeEdge * 2 ? '#a7b879' : '#7eaa72',
    sea,
  };
}

// Original procedural scenery, built with the app's existing Three.js runtime.
// Shared geometry/materials keep the complete planet small and deterministic.
export function buildPlanetWorld() {
  const world = new THREE.Group();
  const itemGroups = new Map();
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
  };
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
    mesh(g, 'cone', i % 2 ? '#476f58' : '#4e8061', [0, 0.45, 0], [0.24, 0.57, 0.24]);
    mesh(g, 'cone', '#63906c', [0, 0.67, 0], [0.17, 0.43, 0.17]);
  }
  function rock(g, x, z, size = 0.14) {
    mesh(g, 'rock', '#a9b29a', [x, size * 0.5, z], [size, size * 0.7, size * 0.8], [0, x, 0.2]);
  }
  function leafy(g, apples = false) {
    mesh(g, 'cylinder', '#7e6650', [0, 0.23, 0], [0.055, 0.46, 0.055]);
    mesh(g, 'ball', '#7e9d58', [0, 0.53, 0], [0.31, 0.33, 0.29]);
    mesh(g, 'ball', '#92ad64', [-0.13, 0.61, 0.05], [0.2, 0.21, 0.22]);
    if (apples) for (let i = 0; i < 6; i += 1) {
      const a = i * 2.4;
      mesh(g, 'ball', '#ba6151', [Math.sin(a) * 0.24, 0.47 + (i % 3) * 0.11, Math.cos(a) * 0.24], [0.046, 0.05, 0.046]);
    }
  }
  function fence(g, x, z, length, angle = 0) {
    const f = group(g, x, 0, z);
    f.rotation.y = angle;
    for (let i = 0; i < 6; i += 1) mesh(f, 'box', '#ded4ad', [-length / 2 + i * length / 5, 0.13, 0], [0.035, 0.29, 0.035]);
    [0.08, 0.2].forEach((y) => mesh(f, 'box', '#ded4ad', [0, y, 0], [length + 0.06, 0.03, 0.03]));
  }
  function cottage(g, color = '#d1bd91', roof = '#a96750') {
    mesh(g, 'box', color, [0, 0.22, 0], [0.58, 0.44, 0.47]);
    mesh(g, 'roof', roof, [0, 0.56, 0], [0.51, 0.31, 0.43], [0, Math.PI / 4, 0]);
    mesh(g, 'box', '#6e7860', [-0.05, 0.13, 0.241], [0.12, 0.26, 0.025]);
    [-0.2, 0.17].forEach((x) => {
      mesh(g, 'box', '#7c7960', [x, 0.26, 0.244], [0.13, 0.14, 0.026]);
      mesh(g, 'box', '#f5d991', [x, 0.26, 0.26], [0.088, 0.1, 0.018]);
    });
    mesh(g, 'box', '#b4a48a', [0.17, 0.62, -0.09], [0.09, 0.27, 0.1]);
    for (let i = 0; i < 5; i += 1) rock(g, (i % 2) * 0.035 - 0.07, 0.36 + i * 0.09, 0.06);
  }
  function water(g, size = 0.48) {
    mesh(g, 'cylinder', '#b1c7a1', [0, 0.005, 0], [size + 0.075, 0.06, size * 0.73 + 0.07]);
    mesh(g, 'cylinder', '#78c0bd', [0, 0.04, 0], [size, 0.025, size * 0.73]);
  }
  function boat(g) {
    mesh(g, 'taper', '#987452', [0, 0.09, 0], [0.2, 0.15, 0.43], [Math.PI, 0, 0]);
    mesh(g, 'box', '#ccb28a', [0, 0.17, 0], [0.31, 0.025, 0.63]);
    mesh(g, 'cylinder', '#76624c', [0, 0.53, 0], [0.018, 0.75, 0.018]);
    mesh(g, 'cone', '#f2dfb0', [0.04, 0.58, 0], [0.28, 0.55, 0.025], [0, 0, -0.17]);
    return g;
  }
  function palm(g) {
    mesh(g, 'taper', '#aa8c5c', [0.06, 0.35, 0], [0.06, 0.7, 0.055], [0, 0, -0.16]);
    for (let i = 0; i < 7; i += 1) {
      const a = i * Math.PI * 2 / 7;
      const f = group(g, 0.11, 0.7, 0);
      f.rotation.y = a;
      mesh(f, 'ball', i % 2 ? '#679968' : '#7b9e64', [0.19, 0.03, 0], [0.34, 0.045, 0.085], [0, 0, -0.2]);
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
  mesh(starter, 'cone', '#dbc18a', [0, 0.2, 0], [0.3, 0.4, 0.25], [0, Math.PI / 4, 0]);
  mesh(starter, 'cone', '#7e7b58', [0, 0.11, 0.19], [0.1, 0.23, 0.02]);
  leafy(group(starter, -0.49, -0.01, -0.2));
  rock(starter, 0.35, 0.1);
  for (let i = 0; i < 25; i += 1) {
    const p = onSurface([-5 + Math.sin(i * 0.18) * 5, -20 + i * 1.3]);
    mesh(p, 'rock', '#d8ceab', [0, 0.035, 0], [0.044, 0.018, 0.037]);
  }
  [[40, -39], [-25, 7], [38, 129], [0, -122]].forEach((p) => rock(onSurface(p), 0, 0, 0.2));

  PLANET_ITEMS.forEach((item) => {
    const g = onSurface(item.position);
    g.name = item.id;
    itemGroups.set(item.id, g);
    switch (item.kind) {
      case 'forest':
        scatter(g, 19, 17, 0.82, (p, i) => pine(p, i));
        scatter(g, 6, 29, 0.9, (p) => rock(p, 0, 0, 0.16));
        break;
      case 'flowers':
        scatter(g, 50, 22, 0.86, (p, i) => {
          mesh(p, 'cylinder', '#6b8c58', [0, 0.06, 0], [0.009, 0.12, 0.009]);
          const color = ['#d5aac2', '#ebdba4', '#ad9ac7', '#e2bea9'][i % 4];
          mesh(p, 'ball', color, [0, 0.13, 0], [0.047, 0.025, 0.047]);
          mesh(p, 'ball', '#e7c86e', [0, 0.15, 0], [0.019, 0.012, 0.019]);
        });
        break;
      case 'camp': {
        const tent = group(g, -0.3, 0, -0.1);
        mesh(tent, 'cone', '#d4a36c', [0, 0.25, 0], [0.39, 0.5, 0.33], [0, Math.PI / 4, 0]);
        mesh(tent, 'cone', '#6a6751', [0, 0.16, 0.26], [0.15, 0.33, 0.025]);
        const fire = group(g, 0.25, 0, 0.25);
        for (let i = 0; i < 8; i += 1) rock(fire, Math.sin(i * Math.PI / 4) * 0.18, Math.cos(i * Math.PI / 4) * 0.18, 0.065);
        mesh(fire, 'cylinder', '#745340', [0, 0.07, 0], [0.045, 0.31, 0.045], [Math.PI / 2, 0, 0.4]);
        const flame = mesh(fire, 'cone', '#eba955', [0, 0.19, 0], [0.09, 0.3, 0.09]);
        movingObjects.add(flame);
        mesh(fire, 'cone', '#f3d78b', [0, 0.17, 0.04], [0.048, 0.19, 0.048]);
        animated.push((t) => { flame.scale.y = 0.27 + Math.sin(t * 7) * 0.04; });
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
        scatter(g, 8, 33, 0.67, (p) => rock(p, 0, 0, 0.085));
        break;
      case 'cottage':
        cottage(g);
        fence(g, 0, 0.65, 1.05);
        fence(g, -0.52, 0.1, 0.95, Math.PI / 2);
        leafy(group(g, 0.48, -0.02, -0.26));
        break;
      case 'orchard':
        scatter(g, 8, 31, 0.7, (p) => leafy(p, true));
        fence(g, 0.1, 0.73, 1.2);
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
        }
        mesh(sails, 'ball', '#8f7852', [0, 0, 0.025], [0.075, 0.075, 0.04]);
        animated.push((t) => { sails.rotation.z = t * 0.3; });
        for (let row = 0; row < 5; row += 1) for (let col = 0; col < 8; col += 1) {
          mesh(g, 'cone', '#c9b167', [0.4 + row * 0.065, 0.06, -0.3 + col * 0.08], [0.027, 0.14, 0.027]);
        }
        break;
      }
      case 'mountains':
        scatter(g, 7, 43, 0.57, (p, i) => {
          const height = 0.55 + (i % 3) * 0.25;
          mesh(p, 'cone', '#8eaaa6', [0, height / 2, 0], [0.35, height, 0.33]);
          mesh(p, 'cone', '#e7ead8', [0, height * 0.83, 0], [0.125, height * 0.35, 0.12]);
        });
        break;
      case 'crystals':
        scatter(g, 13, 65, 0.69, (p, i) => {
          const h = 0.35 + (i % 4) * 0.22;
          p.rotation.z = (i % 3 - 1) * 0.17;
          mesh(p, 'cylinder', i % 2 ? '#91c4c9' : '#addbd5', [0, h * 0.43, 0], [0.1, h * 0.86, 0.09]);
          mesh(p, 'cone', '#c5e2d9', [0, h, 0], [0.1, h * 0.28, 0.09]);
        });
        break;
      case 'lighthouse': {
        mesh(g, 'cylinder', '#b8b6a0', [0, 0.02, 0], [0.43, 0.07, 0.42]);
        for (let i = 0; i < 5; i += 1) mesh(g, 'cylinder', i % 2 ? '#ba705d' : '#e7dcc0', [0, 0.13 + i * 0.19, 0], [0.19 - i * 0.012, 0.19, 0.19 - i * 0.012]);
        mesh(g, 'cylinder', '#697c76', [0, 1.02, 0], [0.24, 0.055, 0.24]);
        mesh(g, 'cylinder', '#f1d797', [0, 1.13, 0], [0.13, 0.18, 0.13]);
        mesh(g, 'cone', '#ad6557', [0, 1.3, 0], [0.25, 0.19, 0.25]);
        for (let i = 0; i < 5; i += 1) mesh(g, 'box', '#ac956e', [0.12, -0.04, 0.4 + i * 0.11], [0.28, 0.04, 0.08]);
        boat(group(g, -0.5, -0.05, 0.6)).scale.setScalar(0.5);
        break;
      }
      case 'palms':
        water(g, 0.32);
        [[-0.4, -0.15], [0.3, -0.3], [0.42, 0.25], [-0.35, 0.31]].forEach(([x, z]) => palm(group(g, x, -0.015, z)));
        break;
      case 'ruins':
        [-0.45, -0.15, 0.15, 0.45].forEach((x, i) => {
          const h = i % 2 ? 0.62 : 0.9;
          mesh(g, 'box', '#c3a77a', [x, 0.04, 0], [0.23, 0.09, 0.24]);
          mesh(g, 'cylinder', '#e0c793', [x, h / 2, 0], [0.075, h, 0.075]);
          mesh(g, 'box', '#e6cd99', [x, h, 0], [0.22, 0.09, 0.23]);
        });
        mesh(g, 'box', '#dcc38f', [-0.29, 0.87, 0], [0.54, 0.13, 0.22], [0, 0, -0.08]);
        scatter(g, 8, 45, 0.66, (p) => rock(p, 0, 0, 0.13));
        break;
      case 'mushrooms':
        scatter(g, 13, 78, 0.63, (p, i) => {
          mesh(p, 'cylinder', '#e3d4b0', [0, 0.16, 0], [0.035, 0.32, 0.035]);
          mesh(p, 'dome', i % 2 ? '#b76f70' : '#cc997d', [0, 0.27, 0], [0.18, 0.14, 0.18]);
          mesh(p, 'ball', '#efdeb8', [0.065, 0.39, 0.01], [0.036, 0.015, 0.029]);
        });
        break;
      case 'waterfall': {
        water(g, 0.56);
        mesh(g, 'rock', '#81998c', [0, 0.39, -0.24], [0.43, 0.65, 0.33]);
        mesh(g, 'rock', '#9eb2a0', [-0.28, 0.23, -0.19], [0.26, 0.4, 0.27]);
        mesh(g, 'box', '#84cac5', [0.08, 0.39, 0.17], [0.16, 0.69, 0.045], [-0.19, 0, 0]);
        for (let i = 0; i < 6; i += 1) {
          const drop = mesh(g, 'ball', '#d3ece0', [0.06, 0.3, 0.04], [0.018, 0.035, 0.018]);
          movingObjects.add(drop);
          animated.push((t) => { drop.position.y = 0.07 + (1 - ((t * 0.65 + i / 6) % 1)) * 0.67; drop.position.z = 0.26 - drop.position.y * 0.19; });
        }
        pine(group(g, -0.48, -0.02, -0.3));
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
        break;
      case 'balloon': {
        const balloon = group(g, 0, 0.9, 0);
        movingObjects.add(balloon);
        mesh(balloon, 'ball', '#d79c78', [0, 0.64, 0], [0.39, 0.48, 0.39]);
        mesh(balloon, 'ball', '#e8d5a8', [0, 0.64, 0], [0.23, 0.485, 0.395]);
        mesh(balloon, 'box', '#a3845d', [0, 0, 0], [0.22, 0.15, 0.2]);
        [-0.09, 0.09].forEach((x) => mesh(balloon, 'cylinder', '#d3bf93', [x, 0.16, 0], [0.01, 0.3, 0.01]));
        animated.push((t) => { balloon.position.y = 0.9 + Math.sin(t * 0.7) * 0.09; });
        break;
      }
      default: break;
    }
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
    [-0.12, 0, 0.14].forEach((x, j) => mesh(c, 'ball', '#e0e7d2', [x, j === 1 ? 0.04 : 0, 0], [0.15, j === 1 ? 0.12 : 0.09, 0.1]));
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
  batchStatic(starter);
  batchStatic(clouds);

  return {
    world,
    itemGroups,
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
