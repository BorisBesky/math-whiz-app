import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import {
  DEFAULT_CHARACTER_ID,
  getAccessoryById,
  getCharacterById,
} from "./rewardConfig";

// Loads a GLB once per URL and normalizes it: scaled to a consistent height,
// horizontally centered, and resting on the floor (y = 0). The cached, ready
// object is reused across mounts (only one viewer renders at a time), so it is
// never disposed — see the model branch in the effect cleanup.
const TARGET_HEIGHT = 2.0;
const modelCache = new Map();

const loadCharacterModel = (url) => {
  if (!modelCache.has(url)) {
    const loader = new GLTFLoader();
    const promise = loader.loadAsync(url).then((gltf) => {
      const root = gltf.scene;
      const box = new THREE.Box3().setFromObject(root);
      const size = box.getSize(new THREE.Vector3());
      root.scale.setScalar(TARGET_HEIGHT / (size.y || 1));
      const scaledBox = new THREE.Box3().setFromObject(root);
      const center = scaledBox.getCenter(new THREE.Vector3());
      root.position.x -= center.x;
      root.position.z -= center.z;
      root.position.y -= scaledBox.min.y;
      root.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      return root;
    });
    modelCache.set(url, promise);
  }
  return modelCache.get(url);
};

const makeMat = (color, options = {}) =>
  new THREE.MeshStandardMaterial({
    color,
    roughness: 0.55,
    metalness: options.metalness ?? 0.05,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0,
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

const addEye = (group, x, y, z, scale = 1) => {
  addMesh(
    group,
    new THREE.SphereGeometry(0.065 * scale, 20, 20),
    makeMat("#111827"),
    [x, y, z],
    [1, 1, 0.35]
  );
};

const addBear = (group) => {
  const fur = makeMat("#b98252");
  const muzzle = makeMat("#f5d0a9");
  const torso = addMesh(group, new THREE.SphereGeometry(0.72, 48, 36), fur, [0, 0.7, 0]);
  group.userData.clothable = [torso];
  addMesh(group, new THREE.SphereGeometry(0.45, 40, 32), fur, [0, 1.55, 0.03]);
  addMesh(group, new THREE.SphereGeometry(0.17, 28, 20), fur, [-0.34, 1.92, 0]);
  addMesh(group, new THREE.SphereGeometry(0.17, 28, 20), fur, [0.34, 1.92, 0]);
  addMesh(group, new THREE.SphereGeometry(0.2, 28, 20), muzzle, [0, 1.44, 0.39], [1.05, 0.72, 0.42]);
  addEye(group, -0.15, 1.63, 0.43);
  addEye(group, 0.15, 1.63, 0.43);
  addMesh(group, new THREE.SphereGeometry(0.055, 18, 18), makeMat("#111827"), [0, 1.47, 0.52]);
  addMesh(group, new THREE.SphereGeometry(0.2, 24, 20), fur, [-0.63, 0.78, 0.02], [0.65, 1.25, 0.65], [0, 0, -0.35]);
  addMesh(group, new THREE.SphereGeometry(0.2, 24, 20), fur, [0.63, 0.78, 0.02], [0.65, 1.25, 0.65], [0, 0, 0.35]);
  addMesh(group, new THREE.SphereGeometry(0.23, 24, 20), fur, [-0.3, 0.04, 0.16], [1.2, 0.55, 0.85]);
  addMesh(group, new THREE.SphereGeometry(0.23, 24, 20), fur, [0.3, 0.04, 0.16], [1.2, 0.55, 0.85]);
};

const addRobot = (group) => {
  const body = makeMat("#9ca3af", { metalness: 0.2 });
  const face = makeMat("#0f172a", { emissive: 0x082f49, emissiveIntensity: 0.25 });
  const trim = makeMat("#38bdf8", { emissive: 0x075985, emissiveIntensity: 0.15 });
  const torso = addMesh(group, new THREE.BoxGeometry(0.95, 1.1, 0.55), body, [0, 0.68, 0], null, [0, 0, 0]);
  group.userData.clothable = [torso];
  addMesh(group, new THREE.SphereGeometry(0.46, 44, 32), body, [0, 1.55, 0.01], [1, 0.9, 0.75]);
  addMesh(group, new THREE.BoxGeometry(0.58, 0.22, 0.035), face, [0, 1.56, 0.36]);
  addMesh(group, new THREE.SphereGeometry(0.035, 16, 16), trim, [-0.16, 1.57, 0.39]);
  addMesh(group, new THREE.SphereGeometry(0.035, 16, 16), trim, [0.16, 1.57, 0.39]);
  addMesh(group, new THREE.BoxGeometry(0.18, 0.55, 0.22), body, [-0.65, 0.73, 0], null, [0, 0, -0.2]);
  addMesh(group, new THREE.BoxGeometry(0.18, 0.55, 0.22), body, [0.65, 0.73, 0], null, [0, 0, 0.2]);
  addMesh(group, new THREE.SphereGeometry(0.13, 22, 18), trim, [-0.67, 0.38, 0.02]);
  addMesh(group, new THREE.SphereGeometry(0.13, 22, 18), trim, [0.67, 0.38, 0.02]);
  addMesh(group, new THREE.BoxGeometry(0.24, 0.18, 0.32), body, [-0.25, 0.04, 0.08]);
  addMesh(group, new THREE.BoxGeometry(0.24, 0.18, 0.32), body, [0.25, 0.04, 0.08]);
  addMesh(group, new THREE.CylinderGeometry(0.05, 0.05, 0.28, 16), trim, [0, 2.02, 0], null, [0, 0, 0]);
  addMesh(group, new THREE.SphereGeometry(0.08, 18, 18), trim, [0, 2.2, 0]);
};

const addPenguin = (group) => {
  const dark = makeMat("#334155");
  const belly = makeMat("#f8fafc");
  const beak = makeMat("#fb923c");
  const torso = addMesh(group, new THREE.SphereGeometry(0.62, 48, 36), dark, [0, 0.76, 0], [0.9, 1.2, 0.82]);
  group.userData.clothable = [torso];
  addMesh(group, new THREE.SphereGeometry(0.39, 42, 30), dark, [0, 1.58, 0]);
  addMesh(group, new THREE.SphereGeometry(0.44, 36, 28), belly, [0, 0.7, 0.38], [0.72, 1, 0.24]);
  addMesh(group, new THREE.SphereGeometry(0.18, 28, 20), belly, [0, 1.48, 0.36], [1.3, 0.9, 0.22]);
  addEye(group, -0.13, 1.67, 0.36);
  addEye(group, 0.13, 1.67, 0.36);
  addMesh(group, new THREE.ConeGeometry(0.08, 0.2, 4), beak, [0, 1.54, 0.48], [1, 0.7, 1.25], [Math.PI / 2, Math.PI / 4, 0]);
  addMesh(group, new THREE.SphereGeometry(0.16, 24, 16), dark, [-0.48, 0.82, 0], [0.5, 1.35, 0.34], [0, 0, 0.55]);
  addMesh(group, new THREE.SphereGeometry(0.16, 24, 16), dark, [0.48, 0.82, 0], [0.5, 1.35, 0.34], [0, 0, -0.55]);
  addMesh(group, new THREE.SphereGeometry(0.2, 24, 16), beak, [-0.24, 0.03, 0.14], [1.25, 0.32, 0.72]);
  addMesh(group, new THREE.SphereGeometry(0.2, 24, 16), beak, [0.24, 0.03, 0.14], [1.25, 0.32, 0.72]);
};

const addCat = (group) => {
  const fur = makeMat("#f59e0b");
  const muzzle = makeMat("#fed7aa");
  const innerEar = makeMat("#f9a8d4");
  const torso = addMesh(group, new THREE.SphereGeometry(0.58, 44, 34), fur, [0, 0.72, 0], [0.92, 1.15, 0.82]);
  group.userData.clothable = [torso];
  addMesh(group, new THREE.SphereGeometry(0.42, 40, 30), fur, [0, 1.56, 0.02]);
  addMesh(group, new THREE.ConeGeometry(0.18, 0.34, 3), fur, [-0.28, 1.9, 0], null, [0, 0, 0.45]);
  addMesh(group, new THREE.ConeGeometry(0.18, 0.34, 3), fur, [0.28, 1.9, 0], null, [0, 0, -0.45]);
  addMesh(group, new THREE.ConeGeometry(0.09, 0.2, 3), innerEar, [-0.28, 1.9, 0.04], null, [0, 0, 0.45]);
  addMesh(group, new THREE.ConeGeometry(0.09, 0.2, 3), innerEar, [0.28, 1.9, 0.04], null, [0, 0, -0.45]);
  addMesh(group, new THREE.SphereGeometry(0.17, 24, 18), muzzle, [0, 1.43, 0.38], [1.25, 0.72, 0.42]);
  addEye(group, -0.14, 1.62, 0.4);
  addEye(group, 0.14, 1.62, 0.4);
  addMesh(group, new THREE.ConeGeometry(0.045, 0.08, 3), makeMat("#f472b6"), [0, 1.47, 0.42], null, [Math.PI / 2, 0, Math.PI]);
  addMesh(group, new THREE.SphereGeometry(0.16, 22, 18), fur, [-0.55, 0.76, 0.03], [0.55, 1.25, 0.5], [0, 0, -0.45]);
  addMesh(group, new THREE.SphereGeometry(0.16, 22, 18), fur, [0.55, 0.76, 0.03], [0.55, 1.25, 0.5], [0, 0, 0.45]);
  addMesh(group, new THREE.SphereGeometry(0.2, 24, 18), fur, [-0.24, 0.03, 0.14], [1.05, 0.45, 0.8]);
  addMesh(group, new THREE.SphereGeometry(0.2, 24, 18), fur, [0.24, 0.03, 0.14], [1.05, 0.45, 0.8]);
};

const addBird = (group) => {
  const feather = makeMat("#facc15");
  const wing = makeMat("#f59e0b");
  const beak = makeMat("#fb923c");
  const torso = addMesh(group, new THREE.SphereGeometry(0.58, 44, 34), feather, [0, 0.72, 0], [0.85, 1.12, 0.78]);
  group.userData.clothable = [torso];
  addMesh(group, new THREE.SphereGeometry(0.38, 40, 28), feather, [0, 1.55, 0]);
  addMesh(group, new THREE.ConeGeometry(0.06, 0.25, 18), feather, [-0.09, 1.94, 0], null, [0.35, 0, -0.2]);
  addMesh(group, new THREE.ConeGeometry(0.06, 0.25, 18), feather, [0.05, 1.96, 0], null, [0.2, 0, 0.1]);
  addEye(group, -0.13, 1.64, 0.36);
  addEye(group, 0.13, 1.64, 0.36);
  addMesh(group, new THREE.ConeGeometry(0.09, 0.22, 4), beak, [0, 1.53, 0.43], [1, 0.75, 1.2], [Math.PI / 2, Math.PI / 4, 0]);
  addMesh(group, new THREE.SphereGeometry(0.18, 24, 18), wing, [-0.5, 0.8, 0], [0.48, 1.3, 0.28], [0, 0, 0.65]);
  addMesh(group, new THREE.SphereGeometry(0.18, 24, 18), wing, [0.5, 0.8, 0], [0.48, 1.3, 0.28], [0, 0, -0.65]);
  addMesh(group, new THREE.SphereGeometry(0.17, 24, 16), beak, [-0.22, 0.02, 0.15], [1.15, 0.28, 0.62]);
  addMesh(group, new THREE.SphereGeometry(0.17, 24, 16), beak, [0.22, 0.02, 0.15], [1.15, 0.28, 0.62]);
};

const addHuman = (group, variant) => {
  const skin = makeMat("#f2c7a0");
  const hair = makeMat(variant === "girl" ? "#4a044e" : "#7c2d12");
  const shirt = makeMat(variant === "girl" ? "#ec4899" : "#2563eb");
  const shorts = makeMat(variant === "girl" ? "#7c3aed" : "#0f766e");
  addMesh(group, new THREE.SphereGeometry(0.38, 40, 30), skin, [0, 1.62, 0]);
  addMesh(group, new THREE.SphereGeometry(0.39, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2), hair, [0, 1.73, 0.01], [1.08, 0.88, 1]);
  if (variant === "girl") {
    addMesh(group, new THREE.SphereGeometry(0.17, 24, 18), hair, [-0.36, 1.48, -0.02], [0.6, 1.4, 0.55]);
    addMesh(group, new THREE.SphereGeometry(0.17, 24, 18), hair, [0.36, 1.48, -0.02], [0.6, 1.4, 0.55]);
  }
  addEye(group, -0.12, 1.63, 0.34, 0.85);
  addEye(group, 0.12, 1.63, 0.34, 0.85);
  addMesh(group, new THREE.SphereGeometry(0.025, 12, 10), makeMat("#ef4444"), [0, 1.48, 0.34], [2.5, 0.7, 0.35]);
  const torso = addMesh(group, new THREE.BoxGeometry(0.6, 0.64, 0.34), shirt, [0, 0.92, 0]);
  addMesh(group, new THREE.SphereGeometry(0.13, 20, 16), skin, [-0.44, 0.98, 0], [0.58, 1.8, 0.58], [0, 0, -0.12]);
  addMesh(group, new THREE.SphereGeometry(0.13, 20, 16), skin, [0.44, 0.98, 0], [0.58, 1.8, 0.58], [0, 0, 0.12]);
  const hipL = addMesh(group, new THREE.BoxGeometry(0.25, 0.26, 0.26), shorts, [-0.16, 0.46, 0.04]);
  const hipR = addMesh(group, new THREE.BoxGeometry(0.25, 0.26, 0.26), shorts, [0.16, 0.46, 0.04]);
  const legL = addMesh(group, new THREE.CapsuleGeometry(0.075, 0.34, 8, 16), skin, [-0.16, 0.15, 0.04]);
  const legR = addMesh(group, new THREE.CapsuleGeometry(0.075, 0.34, 8, 16), skin, [0.16, 0.15, 0.04]);
  group.userData.clothable = [torso];
  group.userData.lowerBody = [hipL, hipR, legL, legR];
  addMesh(group, new THREE.BoxGeometry(0.24, 0.1, 0.34), makeMat("#ffffff"), [-0.18, -0.08, 0.12]);
  addMesh(group, new THREE.BoxGeometry(0.24, 0.1, 0.34), makeMat("#ffffff"), [0.18, -0.08, 0.12]);
};

const getRig = (characterId) => {
  if (characterId === "milo-robot") {
    return {
      topY: 2.04,
      eyeY: 1.57,
      neckY: 1.2,
      backY: 0.78,
      backZ: -0.36,
      footY: 0.04,
      propY: 0.7,
      outfitY: 0.85,
      waistY: 0.32,
      handX: 0.67,
      handY: 0.38,
      handZ: 0.12,
      legX: 0.25,
      faceZ: 0.4,
      garmentZ: 0.32,
      garmentWidth: 0.55,
      garmentHeight: 0.62,
      lowerWidth: 0.5,
      lowerY: 0.18,
      lowerZ: 0.32,
      shoeX: 0.25,
      shoeZ: 0.18,
      fit: "box",
    };
  }
  if (characterId === "pip-penguin") {
    return {
      topY: 2.0,
      eyeY: 1.67,
      neckY: 1.3,
      backY: 0.85,
      backZ: -0.6,
      footY: 0.03,
      propY: 0.78,
      outfitY: 0.9,
      waistY: 0.45,
      handX: 0.52,
      handY: 0.6,
      handZ: 0.42,
      legX: 0.24,
      faceZ: 0.4,
      garmentZ: 0.52,
      garmentWidth: 0.52,
      garmentHeight: 0.52,
      lowerWidth: 0.46,
      lowerY: 0.35,
      lowerZ: 0.5,
      shoeX: 0.24,
      shoeZ: 0.18,
      fit: "round",
    };
  }
  if (characterId === "sunny-bird") {
    return {
      topY: 1.97,
      eyeY: 1.64,
      neckY: 1.28,
      backY: 0.82,
      backZ: -0.55,
      footY: 0.03,
      propY: 0.74,
      outfitY: 0.85,
      waistY: 0.45,
      handX: 0.48,
      handY: 0.6,
      handZ: 0.4,
      legX: 0.22,
      faceZ: 0.4,
      garmentZ: 0.48,
      garmentWidth: 0.48,
      garmentHeight: 0.5,
      lowerWidth: 0.42,
      lowerY: 0.35,
      lowerZ: 0.46,
      shoeX: 0.22,
      shoeZ: 0.18,
      fit: "round",
    };
  }
  if (characterId === "leo-boy" || characterId === "mia-girl") {
    return {
      topY: 2.04,
      eyeY: 1.63,
      neckY: 1.28,
      backY: 0.95,
      backZ: -0.22,
      footY: -0.08,
      propY: 0.95,
      outfitY: 1.1,
      waistY: 0.62,
      handX: 0.45,
      handY: 0.72,
      handZ: 0.08,
      legX: 0.16,
      faceZ: 0.38,
      garmentZ: 0.22,
      garmentWidth: 0.42,
      garmentHeight: 0.5,
      lowerWidth: 0.4,
      lowerY: 0.42,
      lowerZ: 0.18,
      shoeX: 0.18,
      shoeZ: 0.12,
      fit: "human",
    };
  }
  if (characterId === "cora-cat") {
    return {
      topY: 2.0,
      eyeY: 1.62,
      neckY: 1.28,
      backY: 0.82,
      backZ: -0.58,
      footY: 0.03,
      propY: 0.74,
      outfitY: 0.85,
      waistY: 0.45,
      handX: 0.5,
      handY: 0.55,
      handZ: 0.4,
      legX: 0.24,
      faceZ: 0.42,
      garmentZ: 0.46,
      garmentWidth: 0.5,
      garmentHeight: 0.52,
      lowerWidth: 0.46,
      lowerY: 0.35,
      lowerZ: 0.46,
      shoeX: 0.24,
      shoeZ: 0.16,
      fit: "round",
    };
  }
  return {
    topY: 2.03,
    eyeY: 1.63,
    neckY: 1.32,
    backY: 0.85,
    backZ: -0.85,
    footY: 0.04,
    propY: 0.78,
    outfitY: 0.92,
    waistY: 0.55,
    handX: 0.6,
    handY: 0.55,
    handZ: 0.46,
    legX: 0.3,
    faceZ: 0.45,
    garmentZ: 0.62,
    garmentWidth: 0.58,
    garmentHeight: 0.6,
    lowerWidth: 0.55,
    lowerY: 0.32,
    lowerZ: 0.58,
    shoeX: 0.3,
    shoeZ: 0.18,
    fit: "round",
  };
};

const addHat = (group, item, rig) => {
  const color = makeMat(item.color);
  const accent = makeMat(item.accentColor);
  if (item.shape === "wizardHat") {
    addMesh(group, new THREE.ConeGeometry(0.26, 0.58, 28), color, [0, rig.topY + 0.22, 0], null, [0.07, 0, -0.06]);
    addMesh(group, new THREE.TorusGeometry(0.25, 0.045, 14, 40), accent, [0, rig.topY - 0.06, 0.01], [1, 0.35, 1], [Math.PI / 2, 0, 0]);
    addMesh(group, new THREE.SphereGeometry(0.055, 16, 12), accent, [0.03, rig.topY + 0.55, 0]);
    return;
  }
  if (item.shape === "crown") {
    addMesh(group, new THREE.CylinderGeometry(0.25, 0.28, 0.18, 6, 1, true), color, [0, rig.topY + 0.03, 0]);
    [-0.16, 0, 0.16].forEach((x, index) => {
      addMesh(group, new THREE.ConeGeometry(0.07, 0.18, 4), accent, [x, rig.topY + 0.2 + (index === 1 ? 0.04 : 0), 0.02], null, [0, Math.PI / 4, 0]);
    });
    return;
  }
  if (item.shape === "antenna") {
    addMesh(group, new THREE.CylinderGeometry(0.025, 0.025, 0.5, 14), color, [0, rig.topY + 0.28, 0]);
    addMesh(group, new THREE.SphereGeometry(0.095, 18, 14), accent, [0, rig.topY + 0.58, 0]);
    return;
  }
  addMesh(group, new THREE.SphereGeometry(0.29, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2), color, [0, rig.topY - 0.04, 0.02], [1, 0.72, 1]);
  addMesh(group, new THREE.BoxGeometry(0.36, 0.055, 0.18), accent, [0, rig.topY - 0.11, 0.2]);
};

const addEyewear = (group, item, rig) => {
  const mat = makeMat(item.color);
  const glass = makeMat(item.accentColor, { metalness: 0.15 });
  const y = rig.eyeY;
  const z = rig.faceZ;
  if (item.shape === "goggles") {
    addMesh(group, new THREE.BoxGeometry(0.25, 0.14, 0.035), glass, [-0.15, y, z]);
    addMesh(group, new THREE.BoxGeometry(0.25, 0.14, 0.035), glass, [0.15, y, z]);
    addMesh(group, new THREE.BoxGeometry(0.7, 0.045, 0.045), mat, [0, y, z + 0.01]);
    return;
  }
  if (item.shape === "starGlasses") {
    addMesh(group, new THREE.TetrahedronGeometry(0.14), mat, [-0.15, y, z + 0.02], [1, 0.65, 0.18], [0, 0, 0.75]);
    addMesh(group, new THREE.TetrahedronGeometry(0.14), mat, [0.15, y, z + 0.02], [1, 0.65, 0.18], [0, 0, -0.75]);
    addMesh(group, new THREE.BoxGeometry(0.18, 0.025, 0.025), mat, [0, y, z + 0.02]);
    return;
  }
  addMesh(group, new THREE.TorusGeometry(0.105, 0.016, 12, 28), mat, [-0.15, y, z], [1, 1, 0.18]);
  addMesh(group, new THREE.TorusGeometry(0.105, 0.016, 12, 28), mat, [0.15, y, z], [1, 1, 0.18]);
  addMesh(group, new THREE.BoxGeometry(0.12, 0.022, 0.022), mat, [0, y, z]);
};

// The group is rendered with a constant base Y offset (see CharacterViewer).
// World-space clip planes must account for it so garment bands line up with
// the body in local rig coordinates.
const GROUP_Y_OFFSET = -0.15;

// Local-space bounding box (relative to the character group) for a set of
// meshes that are direct children of the group.
const localBox = (meshes) => {
  const box = new THREE.Box3();
  meshes.forEach((mesh) => {
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
    const b = mesh.geometry.boundingBox.clone();
    b.applyMatrix4(
      new THREE.Matrix4().compose(mesh.position, mesh.quaternion, mesh.scale)
    );
    box.union(b);
  });
  return box;
};

// Body measurements derived from the character's own meshes, so clothing
// adapts to each character instead of relying on hand-tuned offsets.
const bodyMetrics = (group) => {
  const torso = group.userData.clothable || [];
  const lower = group.userData.lowerBody || torso;
  const box = localBox(torso.concat(lower));
  const center = new THREE.Vector3();
  box.getCenter(center);
  const halfW = Math.max(box.max.x, -box.min.x);
  const halfD = Math.max(box.max.z, -box.min.z);
  return { torso, lower, center, halfW, halfD, top: box.max.y, bottom: box.min.y };
};

// Approximate body half-width at a given height, treating the torso as an
// ellipsoid. Keeps clothing snug at the waist/neck instead of using the
// widest point of the whole body.
const bodyRadiusAt = (metrics, y) => {
  const cy = (metrics.top + metrics.bottom) / 2;
  const hy = Math.max((metrics.top - metrics.bottom) / 2, 0.001);
  const t = Math.min(Math.abs(y - cy) / hy, 0.985);
  return metrics.halfW * Math.sqrt(1 - t * t);
};

// Horizontal clip planes (world space) keeping a material visible only within
// the local [bottomY, topY] vertical band.
const bandPlanes = (bottomY, topY) => {
  const planes = [];
  if (bottomY != null)
    planes.push(new THREE.Plane(new THREE.Vector3(0, 1, 0), -(bottomY + GROUP_Y_OFFSET)));
  if (topY != null)
    planes.push(new THREE.Plane(new THREE.Vector3(0, -1, 0), topY + GROUP_Y_OFFSET));
  return planes;
};

// Clones the character's own surface meshes, inflates them a hair so they sit
// just outside the "skin," recolors them, and clips them to a vertical band.
// This blends the garment directly onto the body surface for a perfect fit.
const addSurfaceLayer = (group, meshes, color, { bottomY, topY, inflate = 1.06 }) => {
  const material = makeMat(color);
  material.side = THREE.DoubleSide;
  material.clippingPlanes = bandPlanes(bottomY, topY);
  material.clipShadows = true;
  meshes.forEach((mesh) => {
    const layer = new THREE.Mesh(mesh.geometry, material);
    layer.position.copy(mesh.position);
    layer.quaternion.copy(mesh.quaternion);
    layer.scale.copy(mesh.scale).multiplyScalar(inflate);
    layer.castShadow = true;
    layer.receiveShadow = true;
    group.add(layer);
  });
};

// A flared, open-ended skirt that starts at the body's actual waist width and
// widens toward the hem. Its elliptical cross-section matches the body.
const addFlare = (group, color, { waistY, hemY, waistR, hemR, center, depthRatio }) => {
  const mat = makeMat(color);
  mat.side = THREE.DoubleSide;
  const skirt = addMesh(
    group,
    new THREE.CylinderGeometry(waistR, hemR, Math.max(waistY - hemY, 0.05), 28, 1, true),
    mat,
    [center.x, (waistY + hemY) / 2, center.z],
    [1, 1, depthRatio]
  );
  skirt.castShadow = true;
};

const addWaistband = (group, color, { waistY, radius, center, depthRatio }) => {
  addMesh(
    group,
    new THREE.TorusGeometry(radius, 0.03, 10, 40),
    makeMat(color),
    [center.x, waistY, center.z],
    [1, 1, depthRatio],
    [Math.PI / 2, 0, 0]
  );
};

const addDress = (group, item, rig) => {
  const metrics = bodyMetrics(group);
  const { torso, center, top } = metrics;
  const depthRatio = metrics.halfD / metrics.halfW;
  const waistY = rig.waistY;
  // Bodice: conforms to the torso from the waist up to the neckline.
  addSurfaceLayer(group, torso, item.color, {
    bottomY: waistY,
    topY: top - 0.05,
    inflate: 1.07,
  });
  // Skirt flares from the waist down to a hem above the feet. Waist radius is
  // measured at the actual waist height so it hugs instead of ballooning.
  const hemY = Math.max(rig.footY + 0.1, waistY - 0.75);
  const waistR = bodyRadiusAt(metrics, waistY) * 1.05;
  addFlare(group, item.color, {
    waistY,
    hemY,
    waistR,
    hemR: waistR * 1.35,
    center,
    depthRatio,
  });
  addWaistband(group, item.accentColor, { waistY, radius: waistR, center, depthRatio });
  // Neckline trim.
  const neckR = bodyRadiusAt(metrics, top - 0.09) + 0.02;
  addMesh(
    group,
    new THREE.TorusGeometry(neckR, 0.02, 8, 36),
    makeMat(item.accentColor),
    [center.x, top - 0.09, center.z],
    [1, 1, depthRatio],
    [Math.PI / 2, 0, 0]
  );
};

const addSkirt = (group, item, rig) => {
  const metrics = bodyMetrics(group);
  const { center } = metrics;
  const depthRatio = metrics.halfD / metrics.halfW;
  const waistY = rig.waistY;
  const hemY = Math.max(rig.footY + 0.12, waistY - 0.5);
  const waistR = bodyRadiusAt(metrics, waistY) * 1.04;
  addFlare(group, item.color, {
    waistY,
    hemY,
    waistR,
    hemR: waistR * 1.4,
    center,
    depthRatio,
  });
  addWaistband(group, item.accentColor, { waistY, radius: waistR, center, depthRatio });
};

const addShorts = (group, item, rig) => {
  const metrics = bodyMetrics(group);
  const { lower, center, halfD } = metrics;
  const depthRatio = metrics.halfD / metrics.halfW;
  const isHuman = rig.fit === "human";
  const waistY = rig.waistY;
  const bottomY = isHuman ? rig.footY + 0.34 : waistY - 0.34;
  // Conforms to the lower body / legs, blending directly onto the surface.
  addSurfaceLayer(group, lower, item.color, {
    bottomY,
    topY: waistY + 0.02,
    inflate: isHuman ? 1.2 : 1.08,
  });
  addWaistband(group, item.accentColor, {
    waistY,
    radius: bodyRadiusAt(metrics, waistY) * 1.06,
    center,
    depthRatio,
  });
  // Center seam on the front.
  addMesh(
    group,
    new THREE.BoxGeometry(0.02, (waistY - bottomY) * 0.8, 0.03),
    makeMat("#1e3a8a"),
    [center.x, (waistY + bottomY) / 2, center.z + halfD * 1.04]
  );
};

// Anchor (local x/y/z) of a character's hand/paw/flipper for held or worn
// wrist items. Falls back to legacy fields when not specified per character.
const handAnchor = (rig) => ({
  x: rig.fit === "round" ? rig.handX * 0.82 : rig.handX,
  y: rig.handY ?? rig.propY ?? 0.6,
  z: rig.handZ ?? 0.16,
});

const frontSurfaceZ = (metrics, rig, y, offset = 0.06) => {
  if (rig.fit === "human") return rig.garmentZ + offset;
  if (rig.fit === "box") return rig.garmentZ + offset;
  const depthRatio = metrics.halfD / metrics.halfW;
  return metrics.center.z + bodyRadiusAt(metrics, y) * depthRatio + offset;
};

const backSurfaceZ = (metrics, rig, y, offset = 0.08) => {
  if (rig.fit === "human") return rig.backZ - offset;
  const depthRatio = metrics.halfD / metrics.halfW;
  return metrics.center.z - bodyRadiusAt(metrics, y) * depthRatio - offset;
};

const addJewelry = (group, item, rig) => {
  const mat = makeMat(item.color);
  const accent = makeMat(item.accentColor);
  if (item.shape === "friendshipBracelet") {
    const h = handAnchor(rig);
    addMesh(group, new THREE.TorusGeometry(0.095, 0.022, 10, 30), mat, [-h.x, h.y, h.z + 0.03], [1, 1, 0.72], [Math.PI / 2, 0.2, 0]);
    [-0.045, 0, 0.045].forEach((offset, index) => {
      addMesh(group, new THREE.SphereGeometry(0.024, 10, 10), index === 1 ? accent : mat, [-h.x + offset, h.y + 0.065, h.z + 0.065]);
    });
    return;
  }
  if (item.shape === "sparkleRing") {
    const h = handAnchor(rig);
    addMesh(group, new THREE.TorusGeometry(0.055, 0.014, 8, 24), mat, [h.x, h.y, h.z + 0.055], [1, 1, 0.72], [Math.PI / 2, -0.2, 0]);
    addMesh(group, new THREE.OctahedronGeometry(0.065), accent, [h.x, h.y + 0.06, h.z + 0.105]);
    return;
  }
  // Necklace: chain wrapped around the neck at the real body radius, pendant
  // resting on the chest.
  const metrics = bodyMetrics(group);
  const depthRatio = metrics.halfD / metrics.halfW;
  const y = rig.neckY - 0.05;
  const r = bodyRadiusAt(metrics, y) + 0.02;
  const frontZ = frontSurfaceZ(metrics, rig, y, rig.fit === "human" ? 0.045 : 0.14);
  addMesh(group, new THREE.TorusGeometry(r + 0.035, 0.018, 8, 44), accent, [metrics.center.x, y, metrics.center.z + 0.02], [1, 1, depthRatio], [Math.PI / 2, 0, 0]);
  const pendantY = rig.fit === "human" ? y - 0.2 : y - 0.14;
  const pendantScale = rig.fit === "human" ? 1.35 : 1;
  addMesh(group, new THREE.SphereGeometry(0.055 * pendantScale, 18, 14), mat, [metrics.center.x - 0.045, pendantY, frontZ], [1, 1, 0.55]);
  addMesh(group, new THREE.SphereGeometry(0.055 * pendantScale, 18, 14), mat, [metrics.center.x + 0.045, pendantY, frontZ], [1, 1, 0.55]);
  addMesh(group, new THREE.ConeGeometry(0.08 * pendantScale, 0.12 * pendantScale, 24), mat, [metrics.center.x, pendantY - 0.065, frontZ], [1, 1, 0.45], [Math.PI, 0, Math.PI / 4]);
};

const addNeckwear = (group, item, rig) => {
  const mat = makeMat(item.color);
  const accent = makeMat(item.accentColor);
  const metrics = bodyMetrics(group);
  const depthRatio = metrics.halfD / metrics.halfW;
  const collarY = rig.neckY;
  const collarR = bodyRadiusAt(metrics, collarY);
  const frontZ = frontSurfaceZ(metrics, rig, collarY, rig.fit === "human" ? 0.045 : 0.14);
  if (item.shape === "bowTie") {
    const bowY = collarY - 0.03;
    addMesh(group, new THREE.SphereGeometry(0.13, 24, 18), mat, [metrics.center.x - 0.12, bowY, frontZ], [1.25, 0.62, 0.28], [0, 0, -0.18]);
    addMesh(group, new THREE.SphereGeometry(0.13, 24, 18), mat, [metrics.center.x + 0.12, bowY, frontZ], [1.25, 0.62, 0.28], [0, 0, 0.18]);
    addMesh(group, new THREE.SphereGeometry(0.062, 16, 12), accent, [metrics.center.x, bowY, frontZ + 0.025], [0.9, 1.05, 0.5]);
    return;
  }
  if (item.shape === "medal") {
    addMesh(group, new THREE.TorusGeometry(collarR + 0.06, 0.018, 8, 44), accent, [metrics.center.x, collarY, metrics.center.z + 0.02], [1, 1, depthRatio], [Math.PI / 2, 0, 0]);
    const medalY = rig.fit === "box" ? collarY - 0.18 : collarY - 0.28;
    const medalScale = rig.fit === "box" ? 0.9 : 1;
    addMesh(group, new THREE.CylinderGeometry(0.13 * medalScale, 0.13 * medalScale, 0.04, 30), mat, [metrics.center.x, medalY, frontZ + 0.02], null, [Math.PI / 2, 0, 0]);
    addMesh(group, new THREE.SphereGeometry(0.035 * medalScale, 12, 10), accent, [metrics.center.x, medalY, frontZ + 0.055], [1, 1, 0.4]);
    return;
  }
  // Scarf: thick wrap around the neck + a tail hanging down the front.
  addMesh(group, new THREE.TorusGeometry(collarR + 0.06, 0.055, 12, 44), mat, [metrics.center.x, collarY, metrics.center.z + 0.02], [1, 1, depthRatio], [Math.PI / 2, 0, 0]);
  addMesh(group, new THREE.BoxGeometry(0.15, 0.46, 0.08), accent, [metrics.center.x + 0.08, collarY - 0.28, frontZ], null, [0, 0, -0.14]);
  addMesh(group, new THREE.BoxGeometry(0.13, 0.32, 0.07), mat, [metrics.center.x - 0.08, collarY - 0.18, frontZ + 0.01], null, [0, 0, 0.18]);
};

const addBackGear = (group, item, rig) => {
  const mat = makeMat(item.color);
  const accent = makeMat(item.accentColor);
  const metrics = bodyMetrics(group);
  const backZ = backSurfaceZ(metrics, rig, rig.backY, rig.fit === "human" ? 0.16 : 0.1);
  const frontZ = frontSurfaceZ(metrics, rig, rig.backY, rig.fit === "human" ? 0.03 : 0.08);
  const strapTopY = Math.min(rig.neckY - 0.08, rig.backY + 0.32);
  const strapMidY = rig.fit === "human" ? rig.backY - 0.05 : rig.backY - 0.1;
  const strapX = rig.fit === "human" ? 0.18 : Math.max(0.22, rig.garmentWidth * 0.42);
  if (item.shape === "jetpack") {
    addMesh(group, new THREE.BoxGeometry(0.32, 0.55, 0.16), mat, [-0.2, rig.backY, backZ - 0.05]);
    addMesh(group, new THREE.BoxGeometry(0.32, 0.55, 0.16), mat, [0.2, rig.backY, backZ - 0.05]);
    addMesh(group, new THREE.ConeGeometry(0.09, 0.18, 18), accent, [-0.2, rig.backY - 0.38, backZ - 0.05], null, [Math.PI, 0, 0]);
    addMesh(group, new THREE.ConeGeometry(0.09, 0.18, 18), accent, [0.2, rig.backY - 0.38, backZ - 0.05], null, [Math.PI, 0, 0]);
    addMesh(group, new THREE.BoxGeometry(0.09, 0.5, 0.055), accent, [-strapX, strapMidY, frontZ], null, [0, 0, -0.14]);
    addMesh(group, new THREE.BoxGeometry(0.09, 0.5, 0.055), accent, [strapX, strapMidY, frontZ], null, [0, 0, 0.14]);
    return;
  }
  if (item.shape === "backpack") {
    const packWidth = rig.fit === "human" ? 0.42 : Math.max(0.46, rig.garmentWidth * 0.9);
    const packHeight = rig.fit === "human" ? 0.64 : 0.58;
    const packDepth = rig.fit === "human" ? 0.18 : 0.16;
    addMesh(group, new THREE.BoxGeometry(packWidth, packHeight, packDepth), mat, [0, rig.backY, backZ]);
    addMesh(group, new THREE.BoxGeometry(packWidth * 0.58, 0.14, 0.035), accent, [0, rig.backY + 0.08, backZ - packDepth * 0.52]);
    addMesh(group, new THREE.BoxGeometry(0.08, 0.58, 0.06), mat, [-strapX, strapMidY, frontZ], null, [0, 0, -0.14]);
    addMesh(group, new THREE.BoxGeometry(0.08, 0.58, 0.06), mat, [strapX, strapMidY, frontZ], null, [0, 0, 0.14]);
    addMesh(group, new THREE.BoxGeometry(0.32, 0.065, 0.06), accent, [0, strapMidY - 0.08, frontZ + 0.02]);
    return;
  }
  const capeWidth = rig.fit === "human" ? 0.42 : Math.max(0.42, rig.garmentWidth * 0.88);
  addMesh(group, new THREE.ConeGeometry(capeWidth, 0.92, 4), mat, [0, rig.backY - 0.18, backZ], [1, 1, 0.16], [0, Math.PI / 4, Math.PI]);
  addMesh(group, new THREE.BoxGeometry(capeWidth * 0.9, 0.055, 0.06), accent, [0, rig.backY + 0.3, backZ + 0.04]);
  addMesh(group, new THREE.BoxGeometry(0.11, 0.42, 0.06), mat, [-rig.garmentWidth * 0.62, rig.backY - 0.12, frontZ - 0.02], null, [0, 0, 0.08]);
  addMesh(group, new THREE.BoxGeometry(0.11, 0.42, 0.06), mat, [rig.garmentWidth * 0.62, rig.backY - 0.12, frontZ - 0.02], null, [0, 0, -0.08]);
  addMesh(group, new THREE.SphereGeometry(0.07, 16, 12), accent, [-strapX, strapTopY, frontZ + 0.025], [1, 1, 0.5]);
  addMesh(group, new THREE.SphereGeometry(0.07, 16, 12), accent, [strapX, strapTopY, frontZ + 0.025], [1, 1, 0.5]);
};

const addFeet = (group, item, rig) => {
  const mat = makeMat(item.color);
  const accent = makeMat(item.accentColor);
  const isHuman = rig.fit === "human";
  const shoeY = rig.footY + (isHuman ? 0.05 : 0);
  const shoeZ = rig.shoeZ + (isHuman ? 0.12 : 0);
  const shoeX = isHuman ? rig.shoeX + 0.015 : rig.shoeX;
  const shoe = item.shape === "boots"
    ? new THREE.BoxGeometry(isHuman ? 0.28 : 0.32, isHuman ? 0.32 : 0.24, isHuman ? 0.44 : 0.38)
    : new THREE.BoxGeometry(isHuman ? 0.34 : 0.34, isHuman ? 0.24 : 0.16, isHuman ? 0.54 : 0.42);
  addMesh(group, shoe, mat, [-shoeX, shoeY, shoeZ]);
  addMesh(group, shoe, mat, [shoeX, shoeY, shoeZ]);
  if (item.shape === "skates") {
    addMesh(group, new THREE.BoxGeometry(isHuman ? 0.38 : 0.38, 0.04, 0.07), accent, [-shoeX, shoeY - 0.16, shoeZ + 0.1]);
    addMesh(group, new THREE.BoxGeometry(isHuman ? 0.38 : 0.38, 0.04, 0.07), accent, [shoeX, shoeY - 0.16, shoeZ + 0.1]);
    addMesh(group, new THREE.BoxGeometry(isHuman ? 0.25 : 0.18, 0.035, 0.045), makeMat("#f8fafc"), [-shoeX, shoeY + 0.05, shoeZ + 0.28]);
    addMesh(group, new THREE.BoxGeometry(isHuman ? 0.25 : 0.18, 0.035, 0.045), makeMat("#f8fafc"), [shoeX, shoeY + 0.05, shoeZ + 0.28]);
    if (isHuman) {
      const toeZ = rig.faceZ + 0.02;
      addMesh(group, new THREE.BoxGeometry(0.28, 0.13, 0.08), mat, [-shoeX, rig.footY + 0.08, toeZ]);
      addMesh(group, new THREE.BoxGeometry(0.28, 0.13, 0.08), mat, [shoeX, rig.footY + 0.08, toeZ]);
      addMesh(group, new THREE.BoxGeometry(0.22, 0.035, 0.035), accent, [-shoeX, rig.footY - 0.02, toeZ + 0.02]);
      addMesh(group, new THREE.BoxGeometry(0.22, 0.035, 0.035), accent, [shoeX, rig.footY - 0.02, toeZ + 0.02]);
    }
  } else {
    addMesh(group, new THREE.BoxGeometry(isHuman ? 0.26 : 0.22, 0.045, 0.045), accent, [-shoeX, shoeY + 0.08, shoeZ + 0.3]);
    addMesh(group, new THREE.BoxGeometry(isHuman ? 0.26 : 0.22, 0.045, 0.045), accent, [shoeX, shoeY + 0.08, shoeZ + 0.3]);
    addMesh(group, new THREE.BoxGeometry(isHuman ? 0.32 : 0.24, 0.04, 0.05), makeMat("#f8fafc"), [-shoeX, shoeY - (item.shape === "boots" ? 0.18 : 0.12), shoeZ + 0.2]);
    addMesh(group, new THREE.BoxGeometry(isHuman ? 0.32 : 0.24, 0.04, 0.05), makeMat("#f8fafc"), [shoeX, shoeY - (item.shape === "boots" ? 0.18 : 0.12), shoeZ + 0.2]);
    if (isHuman && item.shape !== "boots") {
      const toeZ = rig.faceZ + 0.02;
      addMesh(group, new THREE.BoxGeometry(0.3, 0.13, 0.08), mat, [-shoeX, rig.footY + 0.08, toeZ]);
      addMesh(group, new THREE.BoxGeometry(0.3, 0.13, 0.08), mat, [shoeX, rig.footY + 0.08, toeZ]);
      addMesh(group, new THREE.BoxGeometry(0.22, 0.035, 0.035), accent, [-shoeX, rig.footY + 0.12, toeZ + 0.03]);
      addMesh(group, new THREE.BoxGeometry(0.22, 0.035, 0.035), accent, [shoeX, rig.footY + 0.12, toeZ + 0.03]);
    }
  }
};

const addProp = (group, item, rig) => {
  const mat = makeMat(item.color);
  const accent = makeMat(item.accentColor);
  const h = handAnchor(rig);
  if (item.shape === "book") {
    addMesh(group, new THREE.BoxGeometry(0.3, 0.36, 0.06), mat, [h.x, h.y + 0.06, h.z + 0.06], null, [0.1, -0.3, -0.1]);
    addMesh(group, new THREE.BoxGeometry(0.04, 0.36, 0.07), accent, [h.x - 0.12, h.y + 0.06, h.z + 0.08], null, [0.1, -0.3, -0.1]);
    return;
  }
  // Wand: shaft rising from the hand with a star/charm at the tip.
  addMesh(group, new THREE.CylinderGeometry(0.022, 0.022, 0.5, 12), mat, [h.x, h.y + 0.2, h.z], null, [0, 0, -0.3]);
  addMesh(group, new THREE.SphereGeometry(0.07, 18, 14), accent, [h.x + 0.15, h.y + 0.42, h.z]);
};

const addAccessory = (group, item, rig) => {
  if (!item) return;
  if (item.category === "hat") addHat(group, item, rig);
  if (item.category === "eyewear") addEyewear(group, item, rig);
  if (item.category === "dress") addDress(group, item, rig);
  if (item.category === "skirt") addSkirt(group, item, rig);
  if (item.category === "shorts") addShorts(group, item, rig);
  if (item.category === "jewelry") addJewelry(group, item, rig);
  if (item.category === "neckwear") addNeckwear(group, item, rig);
  if (item.category === "back") addBackGear(group, item, rig);
  if (item.category === "feet") addFeet(group, item, rig);
  if (item.category === "prop") addProp(group, item, rig);
};

const disposeObject = (object) => {
  object.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach((material) => material.dispose());
      } else {
        child.material.dispose();
      }
    }
  });
};

const CharacterViewer = ({
  characterId = DEFAULT_CHARACTER_ID,
  equippedItems = {},
  className = "",
}) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.localClippingEnabled = true;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    container.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.set(0, 1.25, 5.2);
    camera.lookAt(0, 1, 0);

    const ambient = new THREE.HemisphereLight(0xffffff, 0x94a3b8, 2.2);
    scene.add(ambient);
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(2.5, 4, 3);
    keyLight.castShadow = true;
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0xfef3c7, 1.2);
    fillLight.position.set(-3, 2.5, 2);
    scene.add(fillLight);

    const floor = addMesh(
      scene,
      new THREE.CylinderGeometry(1.2, 1.2, 0.08, 64),
      makeMat("#e0f2fe"),
      [0, -0.14, 0],
      [1, 1, 1]
    );
    floor.receiveShadow = true;

    const group = new THREE.Group();
    group.position.y = -0.15;
    scene.add(group);

    const character = getCharacterById(characterId);
    let cancelled = false;
    let modelObject = null;
    let pmrem = null;
    let envTexture = null;

    if (character.model) {
      // GLB model characters only: image-based lighting + filmic tone mapping
      // so their PBR materials are lit realistically instead of dark/flat.
      // Procedural characters keep the original plain lighting.
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      pmrem = new THREE.PMREMGenerator(renderer);
      envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environment = envTexture;

      // Load the mesh, no dress-up accessories yet.
      loadCharacterModel(character.model)
        .then((root) => {
          if (cancelled) return;
          modelObject = root;
          group.add(root);
        })
        .catch((error) => {
          // eslint-disable-next-line no-console
          console.error(`Failed to load character model: ${character.model}`, error);
        });
    } else {
      if (character.id === "milo-robot") {
        addRobot(group);
      } else if (character.id === "pip-penguin") {
        addPenguin(group);
      } else if (character.id === "cora-cat") {
        addCat(group);
      } else if (character.id === "sunny-bird") {
        addBird(group);
      } else if (character.id === "leo-boy") {
        addHuman(group, "boy");
      } else if (character.id === "mia-girl") {
        addHuman(group, "girl");
      } else {
        addBear(group);
      }

      const rig = getRig(character.id);
      Object.values(equippedItems || {})
        .map(getAccessoryById)
        .filter(Boolean)
        .forEach((item) => addAccessory(group, item, rig));
    }

    let isDragging = false;
    let lastX = 0;
    let manualRotation = 0;

    const onPointerDown = (event) => {
      isDragging = true;
      lastX = event.clientX;
      renderer.domElement.setPointerCapture?.(event.pointerId);
    };
    const onPointerMove = (event) => {
      if (!isDragging) return;
      const delta = event.clientX - lastX;
      lastX = event.clientX;
      manualRotation += delta * 0.012;
    };
    const onPointerUp = (event) => {
      isDragging = false;
      renderer.domElement.releasePointerCapture?.(event.pointerId);
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointerleave", onPointerUp);

    const resize = () => {
      const width = Math.max(container.clientWidth, 260);
      const height = Math.max(container.clientHeight, 300);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();

    let resizeFrame;
    const scheduleResize = () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(resize);
    };
    window.addEventListener("resize", scheduleResize);

    let frameId;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const time = performance.now() * 0.001;
      group.rotation.y = manualRotation + Math.sin(time * 0.8) * 0.08;
      group.position.y = -0.15 + Math.sin(time * 1.8) * 0.025;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
      cancelAnimationFrame(resizeFrame);
      window.removeEventListener("resize", scheduleResize);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointerleave", onPointerUp);
      // Detach the cached model so it survives for reuse; only dispose the
      // procedurally built meshes.
      if (modelObject) group.remove(modelObject);
      disposeObject(scene);
      if (envTexture) {
        scene.environment = null;
        envTexture.dispose();
        pmrem.dispose();
      }
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [characterId, equippedItems]);

  return (
    <div
      ref={containerRef}
      className={`min-h-[320px] w-full cursor-grab active:cursor-grabbing ${className}`}
      aria-label={`${getCharacterById(characterId).name} 3D character preview`}
      role="img"
    />
  );
};

export default CharacterViewer;
