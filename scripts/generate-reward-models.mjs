import fs from "node:fs/promises";
import path from "node:path";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

// Node does not provide FileReader, but GLTFExporter uses it internally.
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buffer) => {
      this.result = buffer;
      this.onloadend?.();
    });
  }

  readAsDataURL(blob) {
    blob.arrayBuffer().then((buffer) => {
      const base64 = Buffer.from(buffer).toString("base64");
      this.result = `data:${blob.type};base64,${base64}`;
      this.onloadend?.();
    });
  }
};

const OUTPUT_DIR = path.resolve("public/models");

const material = (name, color, options = {}) => {
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.62,
    metalness: options.metalness ?? 0.02,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1,
  });
  mat.name = name;
  return mat;
};

const makePalette = (entries) =>
  Object.fromEntries(
    Object.entries(entries).map(([name, value]) => [name, material(name, value)])
  );

const addMesh = (
  group,
  name,
  geometry,
  mat,
  position = [0, 0, 0],
  scale = [1, 1, 1],
  rotation = [0, 0, 0]
) => {
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.scale.set(...scale);
  mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
};

const addAnchor = (group, name, position) => {
  const anchor = new THREE.Object3D();
  anchor.name = name;
  anchor.position.set(...position);
  group.add(anchor);
  return anchor;
};

const sphere = (radius, width = 32, height = 24) =>
  new THREE.SphereGeometry(radius, width, height);

const capsule = (radius, length, capSegments = 8, radialSegments = 24) =>
  new THREE.CapsuleGeometry(radius, length, capSegments, radialSegments);

const roundedBox = (width, height, depth) =>
  new THREE.BoxGeometry(width, height, depth, 3, 3, 3);

const addEyes = (group, mat, y, z, gap = 0.12, scale = 1) => {
  addMesh(group, "eye_left_front", sphere(0.035 * scale, 16, 12), mat, [-gap, y, z], [1, 1, 0.5]);
  addMesh(group, "eye_right_front", sphere(0.035 * scale, 16, 12), mat, [gap, y, z], [1, 1, 0.5]);
};

const addHuman = ({ variant }) => {
  const isGirl = variant === "girl";
  const palette = makePalette({
    skin: "#f2c7a0",
    blush: "#ef9a9a",
    eye: "#111827",
    hair: isGirl ? "#4a044e" : "#7c2d12",
    shirt_front: isGirl ? "#ec4899" : "#2563eb",
    shirt_back: isGirl ? "#be185d" : "#1d4ed8",
    pants_front: isGirl ? "#7c3aed" : "#0f766e",
    pants_back: isGirl ? "#5b21b6" : "#115e59",
    shoe: "#f8fafc",
    shoe_trim: "#94a3b8",
  });

  const group = new THREE.Group();
  group.name = `${variant}_semantic_model`;

  addMesh(group, "head", sphere(0.25), palette.skin, [0, 1.55, 0]);
  addMesh(group, "face_front", sphere(0.225, 32, 20), palette.skin, [0, 1.52, 0.09], [0.86, 0.9, 0.35]);
  addMesh(group, "hair_back", sphere(0.27, 32, 20), palette.hair, [0, 1.61, -0.02], [1.05, 1, 0.9]);
  addMesh(group, "hair_front", sphere(0.24, 32, 16), palette.hair, [0, 1.72, 0.08], [1.1, 0.45, 0.55]);
  if (isGirl) {
    addMesh(group, "hair_left_side", capsule(0.07, 0.35), palette.hair, [-0.24, 1.36, -0.02], [1, 1, 0.8]);
    addMesh(group, "hair_right_side", capsule(0.07, 0.35), palette.hair, [0.24, 1.36, -0.02], [1, 1, 0.8]);
  }
  addEyes(group, palette.eye, 1.57, 0.255, 0.09, 0.9);
  addMesh(group, "mouth_front", roundedBox(0.09, 0.012, 0.012), palette.blush, [0, 1.45, 0.255]);

  addMesh(group, "torso", roundedBox(0.46, 0.52, 0.26), palette.shirt_back, [0, 0.93, 0]);
  addMesh(group, "shirt_front", roundedBox(0.43, 0.48, 0.035), palette.shirt_front, [0, 0.93, 0.15]);
  addMesh(group, "front_badge", sphere(0.055, 18, 12), palette.shoe, [0.13, 1.05, 0.175], [1, 1, 0.25]);
  addMesh(group, "arm_left", capsule(0.055, 0.38), palette.skin, [-0.34, 0.91, 0.02], [1, 1, 1], [0, 0, -0.2]);
  addMesh(group, "arm_right", capsule(0.055, 0.38), palette.skin, [0.34, 0.91, 0.02], [1, 1, 1], [0, 0, 0.2]);
  addMesh(group, "hand_left_front", sphere(0.065, 18, 14), palette.skin, [-0.39, 0.68, 0.11]);
  addMesh(group, "hand_right_front", sphere(0.065, 18, 14), palette.skin, [0.39, 0.68, 0.11]);

  if (isGirl) {
    addMesh(group, "skirt_front", new THREE.CylinderGeometry(0.34, 0.43, 0.34, 32, 1, true), palette.pants_front, [0, 0.58, 0.02], [1, 1, 0.7]);
    addMesh(group, "skirt_back", new THREE.CylinderGeometry(0.34, 0.43, 0.34, 32, 1, true), palette.pants_back, [0, 0.58, -0.02], [1, 1, 0.7]);
  } else {
    addMesh(group, "shorts_left_front", roundedBox(0.2, 0.22, 0.18), palette.pants_front, [-0.11, 0.56, 0.06]);
    addMesh(group, "shorts_right_front", roundedBox(0.2, 0.22, 0.18), palette.pants_front, [0.11, 0.56, 0.06]);
    addMesh(group, "shorts_back", roundedBox(0.43, 0.2, 0.06), palette.pants_back, [0, 0.57, -0.1]);
  }

  addMesh(group, "leg_left", capsule(0.052, 0.32), palette.skin, [-0.12, 0.25, 0.03]);
  addMesh(group, "leg_right", capsule(0.052, 0.32), palette.skin, [0.12, 0.25, 0.03]);
  addMesh(group, "shoe_left", roundedBox(0.19, 0.08, 0.26), palette.shoe, [-0.12, 0.03, 0.08]);
  addMesh(group, "shoe_right", roundedBox(0.19, 0.08, 0.26), palette.shoe, [0.12, 0.03, 0.08]);
  addMesh(group, "shoe_left_trim_front", roundedBox(0.13, 0.025, 0.018), palette.shoe_trim, [-0.12, 0.065, 0.22]);
  addMesh(group, "shoe_right_trim_front", roundedBox(0.13, 0.025, 0.018), palette.shoe_trim, [0.12, 0.065, 0.22]);

  addAnchor(group, "anchor_front_face", [0, 1.55, 0.31]);
  addAnchor(group, "anchor_front_chest", [0, 1.03, 0.22]);
  addAnchor(group, "anchor_front_waist", [0, 0.62, 0.2]);
  addAnchor(group, "anchor_back", [0, 0.95, -0.2]);
  addAnchor(group, "anchor_hand_left", [-0.42, 0.7, 0.16]);
  addAnchor(group, "anchor_hand_right", [0.42, 0.7, 0.16]);
  return group;
};

const addDog = () => {
  const palette = makePalette({
    fur: "#d97706",
    fur_dark: "#92400e",
    muzzle: "#fed7aa",
    belly_front: "#ffedd5",
    eye: "#111827",
    nose: "#111827",
    tongue: "#f472b6",
  });
  const group = new THREE.Group();
  group.name = "dog_semantic_model";

  addMesh(group, "body", sphere(0.38), palette.fur, [0, 0.72, 0], [1.18, 1.2, 0.78]);
  addMesh(group, "belly_front", sphere(0.3), palette.belly_front, [0, 0.68, 0.31], [1.05, 1.35, 0.24]);
  addMesh(group, "head", sphere(0.3), palette.fur, [0, 1.34, 0.05], [1.03, 0.95, 0.95]);
  addMesh(group, "muzzle_front", sphere(0.15), palette.muzzle, [0, 1.25, 0.31], [1.35, 0.82, 0.8]);
  addMesh(group, "nose_front", sphere(0.045, 16, 12), palette.nose, [0, 1.3, 0.43], [1.1, 0.8, 0.55]);
  addEyes(group, palette.eye, 1.4, 0.32, 0.1);
  addMesh(group, "tongue_front", sphere(0.045, 12, 8), palette.tongue, [0, 1.18, 0.41], [0.75, 1.1, 0.25]);
  addMesh(group, "ear_left", capsule(0.075, 0.26), palette.fur_dark, [-0.23, 1.36, -0.02], [0.9, 1, 0.6], [0, 0, 0.38]);
  addMesh(group, "ear_right", capsule(0.075, 0.26), palette.fur_dark, [0.23, 1.36, -0.02], [0.9, 1, 0.6], [0, 0, -0.38]);
  addMesh(group, "paw_left_front", sphere(0.105, 18, 12), palette.fur, [-0.2, 0.14, 0.21], [1.15, 0.55, 0.8]);
  addMesh(group, "paw_right_front", sphere(0.105, 18, 12), palette.fur, [0.2, 0.14, 0.21], [1.15, 0.55, 0.8]);
  addMesh(group, "tail_back", capsule(0.045, 0.34), palette.fur_dark, [0.34, 0.83, -0.28], [1, 1, 1], [0.7, 0.25, -0.65]);

  addAnchor(group, "anchor_front_face", [0, 1.34, 0.48]);
  addAnchor(group, "anchor_front_chest", [0, 0.88, 0.43]);
  addAnchor(group, "anchor_back", [0, 0.85, -0.34]);
  addAnchor(group, "anchor_hand_left", [-0.26, 0.32, 0.3]);
  addAnchor(group, "anchor_hand_right", [0.26, 0.32, 0.3]);
  return group;
};

const addOwl = () => {
  const palette = makePalette({
    feather: "#8b5cf6",
    feather_dark: "#5b21b6",
    belly_front: "#fef3c7",
    face: "#faf5ff",
    eye: "#111827",
    iris: "#facc15",
    beak: "#fb923c",
    foot: "#f59e0b",
  });
  const group = new THREE.Group();
  group.name = "owl_semantic_model";

  addMesh(group, "body", sphere(0.42), palette.feather, [0, 0.76, 0], [0.92, 1.28, 0.78]);
  addMesh(group, "belly_front", sphere(0.28), palette.belly_front, [0, 0.72, 0.32], [1, 1.35, 0.22]);
  addMesh(group, "head", sphere(0.33), palette.feather, [0, 1.42, 0.02], [1.05, 0.95, 0.95]);
  addMesh(group, "ear_tuft_left", new THREE.ConeGeometry(0.08, 0.18, 3), palette.feather_dark, [-0.18, 1.72, 0], [1, 1, 1], [0, 0, 0.28]);
  addMesh(group, "ear_tuft_right", new THREE.ConeGeometry(0.08, 0.18, 3), palette.feather_dark, [0.18, 1.72, 0], [1, 1, 1], [0, 0, -0.28]);
  addMesh(group, "face_disc_left_front", sphere(0.13, 24, 18), palette.face, [-0.11, 1.43, 0.28], [1.08, 1.05, 0.22]);
  addMesh(group, "face_disc_right_front", sphere(0.13, 24, 18), palette.face, [0.11, 1.43, 0.28], [1.08, 1.05, 0.22]);
  addMesh(group, "iris_left_front", sphere(0.055, 16, 12), palette.iris, [-0.11, 1.45, 0.33], [1, 1, 0.25]);
  addMesh(group, "iris_right_front", sphere(0.055, 16, 12), palette.iris, [0.11, 1.45, 0.33], [1, 1, 0.25]);
  addEyes(group, palette.eye, 1.45, 0.36, 0.11, 0.75);
  addMesh(group, "beak_front", new THREE.ConeGeometry(0.055, 0.13, 4), palette.beak, [0, 1.35, 0.36], [1, 1, 1.15], [Math.PI / 2, Math.PI / 4, 0]);
  addMesh(group, "wing_left", sphere(0.18, 24, 16), palette.feather_dark, [-0.34, 0.8, 0.02], [0.42, 1.35, 0.27], [0, 0, 0.35]);
  addMesh(group, "wing_right", sphere(0.18, 24, 16), palette.feather_dark, [0.34, 0.8, 0.02], [0.42, 1.35, 0.27], [0, 0, -0.35]);
  addMesh(group, "foot_left", sphere(0.09, 16, 10), palette.foot, [-0.13, 0.06, 0.16], [1.2, 0.35, 0.75]);
  addMesh(group, "foot_right", sphere(0.09, 16, 10), palette.foot, [0.13, 0.06, 0.16], [1.2, 0.35, 0.75]);

  addAnchor(group, "anchor_front_face", [0, 1.43, 0.42]);
  addAnchor(group, "anchor_front_chest", [0, 0.9, 0.4]);
  addAnchor(group, "anchor_back", [0, 0.85, -0.32]);
  addAnchor(group, "anchor_hand_left", [-0.38, 0.72, 0.16]);
  addAnchor(group, "anchor_hand_right", [0.38, 0.72, 0.16]);
  return group;
};

const addPenguin = () => {
  const palette = makePalette({
    body: "#334155",
    body_dark: "#0f172a",
    belly_front: "#f8fafc",
    eye: "#111827",
    beak: "#fb923c",
    foot: "#f59e0b",
  });
  const group = new THREE.Group();
  group.name = "penguin_semantic_model";

  addMesh(group, "body", sphere(0.4), palette.body, [0, 0.72, 0], [0.86, 1.32, 0.76]);
  addMesh(group, "belly_front", sphere(0.29), palette.belly_front, [0, 0.7, 0.31], [0.9, 1.42, 0.22]);
  addMesh(group, "head", sphere(0.29), palette.body_dark, [0, 1.42, 0.02]);
  addMesh(group, "face_patch_front", sphere(0.17, 28, 18), palette.belly_front, [0, 1.37, 0.25], [1.25, 0.9, 0.2]);
  addEyes(group, palette.eye, 1.47, 0.29, 0.1);
  addMesh(group, "beak_front", new THREE.ConeGeometry(0.06, 0.16, 4), palette.beak, [0, 1.35, 0.38], [1, 0.75, 1.2], [Math.PI / 2, Math.PI / 4, 0]);
  addMesh(group, "flipper_left", sphere(0.15, 24, 14), palette.body_dark, [-0.35, 0.78, 0], [0.42, 1.35, 0.24], [0, 0, 0.48]);
  addMesh(group, "flipper_right", sphere(0.15, 24, 14), palette.body_dark, [0.35, 0.78, 0], [0.42, 1.35, 0.24], [0, 0, -0.48]);
  addMesh(group, "foot_left", sphere(0.105, 16, 10), palette.foot, [-0.16, 0.05, 0.17], [1.25, 0.32, 0.72]);
  addMesh(group, "foot_right", sphere(0.105, 16, 10), palette.foot, [0.16, 0.05, 0.17], [1.25, 0.32, 0.72]);

  addAnchor(group, "anchor_front_face", [0, 1.42, 0.42]);
  addAnchor(group, "anchor_front_chest", [0, 0.9, 0.42]);
  addAnchor(group, "anchor_back", [0, 0.85, -0.32]);
  addAnchor(group, "anchor_hand_left", [-0.38, 0.72, 0.15]);
  addAnchor(group, "anchor_hand_right", [0.38, 0.72, 0.15]);
  return group;
};

const normalizeGroup = (group) => {
  group.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(group);
  const size = box.getSize(new THREE.Vector3());
  group.scale.setScalar(2 / (size.y || 1));
  group.updateMatrixWorld(true);
  const scaledBox = new THREE.Box3().setFromObject(group);
  const center = scaledBox.getCenter(new THREE.Vector3());
  group.position.x -= center.x;
  group.position.z -= center.z;
  group.position.y -= scaledBox.min.y;
  return group;
};

const exportGlb = (group, fileName) =>
  new Promise((resolve, reject) => {
    const exporter = new GLTFExporter();
    const scene = new THREE.Scene();
    scene.name = `${fileName.replace(".glb", "")}_scene`;
    scene.add(normalizeGroup(group));
    exporter.parse(
      scene,
      async (result) => {
        const buffer = Buffer.from(result);
        await fs.writeFile(path.join(OUTPUT_DIR, fileName), buffer);
        resolve(buffer.byteLength);
      },
      reject,
      { binary: true }
    );
  });

const models = [
  ["boy.glb", () => addHuman({ variant: "boy" })],
  ["girl.glb", () => addHuman({ variant: "girl" })],
  ["dog.glb", addDog],
  ["owl.glb", addOwl],
  ["pinguin.glb", addPenguin],
];

await fs.mkdir(OUTPUT_DIR, { recursive: true });

for (const [fileName, create] of models) {
  const bytes = await exportGlb(create(), fileName);
  console.log(`${fileName} ${Math.round(bytes / 1024)} KB`);
}
