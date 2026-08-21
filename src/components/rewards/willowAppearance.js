import * as THREE from "three";
import { getAccessoryById } from "./rewardConfig";

export const WILLOW_CHARACTER_ID = "willow-wizard";

export const WILLOW_RIG = {
  faceX: 0.11,
  topY: 1.74,
  eyeY: 1.33,
  neckY: 0.96,
  backY: 0.5,
  backZ: -0.55,
  footY: 0.02,
  propY: 0.68,
  outfitY: 0.55,
  waistY: 0.36,
  handX: 0.5,
  handY: 0.67,
  handZ: 0.08,
  legX: 0.16,
  faceZ: 0.22,
  garmentZ: 0.1,
  garmentWidth: 0.48,
  garmentHeight: 0.55,
  lowerWidth: 0.46,
  lowerY: 0.22,
  lowerZ: 0.08,
  shoeX: 0.14,
  shoeZ: 0.1,
  fit: "human",
};

// Front-projected UV window in the head mesh's local space. Chosen so the
// sculpted eye / nose / mouth landmarks land on FEATURE_UV.
export const WILLOW_FACE_UV_WINDOW = {
  minX: -0.30,
  maxX: 0.50,
  minY: 0.02,
  maxY: 0.62,
  minZ: -0.02,
};

export const WILLOW_FACE_FEATURE_UV = {
  leftEye: [0.23, 0.41],
  rightEye: [0.77, 0.41],
  nose: [0.5, 0.30],
  mouth: [0.5, 0.20],
  blush: [0.12, 0.32],
};

// Keep a skin gutter around the face atlas so triangles that straddle the
// face/back boundary interpolate through skin, not across the painted eyes.
const FACE_ATLAS_PAD = 0.22;
const SKIN_ISLAND_UV = [0.03, 0.03];

export const faceUVToAtlasUV = ([u, v]) => [
  FACE_ATLAS_PAD + u * (1 - 2 * FACE_ATLAS_PAD),
  FACE_ATLAS_PAD + v * (1 - 2 * FACE_ATLAS_PAD),
];

const HIDDEN_PARTS = {
  hat: ["part_2_hat", "part_1_feather"],
  prop: ["part_6_magic staff", "part_7_orb"],
  cloak: ["part_4_cloak"],
};

const makeMat = (color, options = {}) =>
  new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.5,
    metalness: options.metalness ?? 0.05,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1,
  });

const addMesh = (group, geometry, material, position, scale, rotation) => {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  if (scale) mesh.scale.set(...scale);
  if (rotation) mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
};

const pickColor = (colors = {}, region, fallback) => colors[region] || fallback;

const hexToRgb = (hex) => {
  const value = String(hex || "").replace("#", "");
  const full = value.length === 3 ? value.split("").map((part) => part + part).join("") : value;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return { r: 242, g: 199, b: 160 };
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
};

export const localPositionToFaceUV = (x, y, z, window = WILLOW_FACE_UV_WINDOW) => {
  if (z < window.minZ) return SKIN_ISLAND_UV;
  const u = (x - window.minX) / (window.maxX - window.minX);
  const v = (y - window.minY) / (window.maxY - window.minY);
  if (u < -0.04 || u > 1.04 || v < -0.04 || v > 1.04) return SKIN_ISLAND_UV;
  return faceUVToAtlasUV([Math.min(Math.max(u, 0), 1), Math.min(Math.max(v, 0), 1)]);
};

export const applyWillowHeadFaceUVs = (geometry, window = WILLOW_FACE_UV_WINDOW) => {
  const position = geometry.attributes.position;
  const uvs = new Float32Array(position.count * 2);
  for (let i = 0; i < position.count; i += 1) {
    const [u, v] = localPositionToFaceUV(
      position.getX(i),
      position.getY(i),
      position.getZ(i),
      window
    );
    uvs[i * 2] = u;
    uvs[i * 2 + 1] = v;
  }
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.userData.willowFaceUv = "atlas-v3";
};

const rgb01 = (hex) => {
  const { r, g, b } = hexToRgb(hex);
  return [r / 255, g / 255, b / 255];
};

const ellipseWeight = (px, py, { x, y, rx, ry, tilt = 0 }) => {
  const dx = px - x;
  const dy = py - y;
  const c = Math.cos(tilt);
  const s = Math.sin(tilt);
  const lx = (dx * c + dy * s) / rx;
  const ly = (-dx * s + dy * c) / ry;
  const d = lx * lx + ly * ly;
  if (d >= 1) return 0;
  return (1 - d) ** 0.55;
};

// Local-space tints that follow the sculpted eye sockets, brow ridges, and lips.
export const WILLOW_FACE_LANDMARKS = {
  leftEye: { x: -0.116, y: 0.266, rx: 0.092, ry: 0.044, tilt: 0.22, minZ: 0.1 },
  rightEye: { x: 0.316, y: 0.266, rx: 0.092, ry: 0.044, tilt: -0.22, minZ: 0.1 },
  leftBrow: { x: -0.13, y: 0.348, rx: 0.11, ry: 0.022, tilt: 0.28, minZ: 0.08 },
  rightBrow: { x: 0.33, y: 0.348, rx: 0.11, ry: 0.022, tilt: -0.28, minZ: 0.08 },
  leftShadow: { x: -0.116, y: 0.3, rx: 0.08, ry: 0.022, tilt: 0.22, minZ: 0.1 },
  rightShadow: { x: 0.316, y: 0.3, rx: 0.08, ry: 0.022, tilt: -0.22, minZ: 0.1 },
  lips: { x: 0.1, y: 0.145, rx: 0.055, ry: 0.022, tilt: 0, minZ: 0.12 },
  leftBlush: { x: -0.06, y: 0.2, rx: 0.07, ry: 0.04, tilt: 0, minZ: 0.08 },
  rightBlush: { x: 0.26, y: 0.2, rx: 0.07, ry: 0.04, tilt: 0, minZ: 0.08 },
};

export const paintWillowFaceVertexColor = (x, y, z, skinRgb, tints) => {
  let color = skinRgb;
  const layer = (landmark, tint, strength) => {
    if (z < landmark.minZ) return;
    const weight = ellipseWeight(x, y, landmark) * strength;
    if (weight <= 0) return;
    color = [
      color[0] + (tint[0] - color[0]) * weight,
      color[1] + (tint[1] - color[1]) * weight,
      color[2] + (tint[2] - color[2]) * weight,
    ];
  };
  layer(WILLOW_FACE_LANDMARKS.leftBlush, tints.blush, 0.35);
  layer(WILLOW_FACE_LANDMARKS.rightBlush, tints.blush, 0.35);
  layer(WILLOW_FACE_LANDMARKS.leftShadow, tints.shadow, 0.45);
  layer(WILLOW_FACE_LANDMARKS.rightShadow, tints.shadow, 0.45);
  layer(WILLOW_FACE_LANDMARKS.leftBrow, tints.brows, 0.92);
  layer(WILLOW_FACE_LANDMARKS.rightBrow, tints.brows, 0.92);
  layer(WILLOW_FACE_LANDMARKS.lips, tints.lips, 0.85);
  layer(WILLOW_FACE_LANDMARKS.leftEye, tints.eyes, 1);
  layer(WILLOW_FACE_LANDMARKS.rightEye, tints.eyes, 1);
  return color;
};

export const applyWillowFaceVertexColors = (geometry, colors = {}) => {
  const position = geometry.attributes.position;
  const skin = rgb01(pickColor(colors, "head", "#f2c7a0"));
  const tints = {
    eyes: rgb01(pickColor(colors, "eyes", "#2563eb")),
    brows: rgb01(pickColor(colors, "brows", "#4a044e")),
    lips: rgb01(pickColor(colors, "lips", "#db2777")),
    blush: rgb01(pickColor(colors, "blush", "#fb7185")),
    shadow: rgb01(pickColor(colors, "eyeshadow", "#a78bfa")),
  };
  const data = new Float32Array(position.count * 3);
  for (let i = 0; i < position.count; i += 1) {
    const [r, g, b] = paintWillowFaceVertexColor(
      position.getX(i),
      position.getY(i),
      position.getZ(i),
      skin,
      tints
    );
    data[i * 3] = r;
    data[i * 3 + 1] = g;
    data[i * 3 + 2] = b;
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(data, 3));
};

const isWillowHeadMesh = (child) =>
  Boolean(child?.isMesh && /part_0_head|^head$/i.test(child.name || ""));

export const applyWillowHeadTexture = (root, colors = {}) => {
  try {
    root.traverse((child) => {
      if (!isWillowHeadMesh(child)) return;
      applyWillowFaceVertexColors(child.geometry, colors);
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => {
        if (material.map?.userData?.willowFaceMap) {
          material.map.dispose();
          material.map = null;
        }
        material.vertexColors = true;
        material.color.set("#ffffff");
        material.roughness = 0.62;
        material.metalness = 0.02;
        material.needsUpdate = true;
      });
    });
  } catch (error) {
    // Keep the character visible even if face tinting fails.
    // eslint-disable-next-line no-console
    console.error("Failed to apply Willow face colors", error);
  }
};


export const getWillowHiddenPartNames = (equippedItems = {}) => {
  const hidden = new Set();
  if (equippedItems.hat) {
    HIDDEN_PARTS.hat.forEach((name) => hidden.add(name));
  }
  if (equippedItems.prop) {
    HIDDEN_PARTS.prop.forEach((name) => hidden.add(name));
  }
  const backItem = getAccessoryById(equippedItems.back);
  if (equippedItems.dress || equippedItems.skirt || backItem?.shape === "cape") {
    HIDDEN_PARTS.cloak.forEach((name) => hidden.add(name));
  }
  return hidden;
};

export const applyWillowPartVisibility = (root, equippedItems = {}) => {
  const hidden = getWillowHiddenPartNames(equippedItems);
  root.traverse((child) => {
    if (!child.isMesh) return;
    if (hidden.has(child.name)) {
      child.visible = false;
    }
  });
};

export const improveWillowMaterials = (root) => {
  root.traverse((child) => {
    if (!child.isMesh || !child.material) return;
    if (!child.geometry.attributes.normal) {
      child.geometry.computeVertexNormals();
    }
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    const name = `${child.name || ""} ${materials.map((material) => material.name || "").join(" ")}`;
    materials.forEach((material) => {
      if (name.includes("head") || name.includes("hands")) {
        material.roughness = 0.62;
        material.metalness = 0.02;
      } else if (name.includes("orb")) {
        material.roughness = 0.18;
        material.metalness = 0.35;
        material.userData.glow = true;
        material.emissive = material.color.clone();
        material.emissiveIntensity = 0.4;
      } else if (name.includes("staff")) {
        material.roughness = 0.32;
        material.metalness = 0.28;
      } else if (name.includes("feather")) {
        material.roughness = 0.72;
        material.metalness = 0.02;
      } else {
        material.roughness = 0.46;
        material.metalness = 0.08;
      }
    });
  });
};

export const addWillowFitProxies = (group) => {
  const hidden = makeMat("#000000", { transparent: true, opacity: 0 });
  const torso = addMesh(
    group,
    new THREE.SphereGeometry(0.46, 20, 16),
    hidden,
    [0.13, 0.48, -0.18],
    [1.08, 0.92, 0.7]
  );
  torso.visible = false;
  const head = addMesh(group, new THREE.SphereGeometry(0.4, 16, 12), hidden, [0.11, 1.34, -0.16]);
  head.visible = false;
  group.userData.clothable = [torso];
  group.userData.lowerBody = [torso];
  group.userData.head = head;
  group.userData.feet = [];
};

export const decorateWillowCharacter = (group) => {
  addWillowFitProxies(group);
};
