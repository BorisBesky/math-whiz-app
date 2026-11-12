import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Generated (ComfyUI text-to-3D) accessory GLBs: loaded raw and cached per URL,
// then fitted onto a generated character with the anchors in generatedFits.js.
// Kept free of React so it can be exercised outside the app.
const accessoryCache = new Map();

export const loadAccessoryModel = (url) => {
  if (!accessoryCache.has(url)) {
    accessoryCache.set(url, new GLTFLoader().loadAsync(url).then((gltf) => gltf.scene));
  }
  return accessoryCache.get(url);
};

// Geometry stays shared with the cache; materials are per instance so the
// viewer's cleanup can dispose them without breaking the cached source.
const cloneWithOwnMaterials = (source) => {
  const clone = source.clone(true);
  clone.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;
    if (child.material) child.material = child.material.clone();
  });
  return clone;
};

// Returns the placed object(s) for one accessory: centered on its bounding box,
// scaled against the character's body measurements, moved to its anchor.
// Feet items return a right/left pair (the left one mirrored).
export const fitGeneratedAccessory = (source, fit, anchors) => {
  const place = (mirror = false) => {
    const inner = cloneWithOwnMaterials(source);
    // Euler order XYZ applies the Y turn first, so rotationX tilts in body space.
    inner.rotation.set(fit.rotationX || 0, fit.rotationY || 0, 0, "XYZ");
    const pivot = new THREE.Group();
    pivot.add(inner);
    pivot.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(inner);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    inner.position.sub(center);
    // Optional vertical squash (e.g. shorten a long skirt) on top of the uniform fit.
    const heightScale = fit.heightScale || 1;
    size.y *= heightScale;

    const a = anchors;
    const bodyZ = (a.chestFrontZ + a.backZ) / 2;
    const byWidth = (measure) => (measure * fit.size) / (size.x || 1);
    let scale = 1;
    let x = 0;
    let y = 0;
    let z = bodyZ;
    switch (fit.anchor) {
      case "head": {
        scale = byWidth(a.headWidth);
        const h = size.y * scale;
        y = (a.crownY ?? 2.0) - (fit.sink ?? 0.3) * h + h / 2;
        z = a.headZ;
        break;
      }
      case "eyes":
        scale = byWidth(a.headWidth);
        // Frames face +z with the temple arms/strap running back into the head,
        // so the front of the bounding box sits just in front of the face.
        y = a.eyeY;
        z = a.faceZ + 0.06 - (size.z * scale) / 2;
        break;
      case "neckFront":
        scale = byWidth(a.torsoWidth);
        y = a.neckY - (size.y * scale) / 2;
        z = a.chestFrontZ + (size.z * scale) / 2;
        break;
      case "chest":
        scale = byWidth(a.torsoWidth);
        y = a.chestY;
        z = a.chestFrontZ + (size.z * scale) / 2;
        break;
      case "neckWrap":
        scale = byWidth(a.torsoWidth);
        y = a.neckY;
        break;
      case "back":
        scale = byWidth(a.torsoWidth);
        y = a.chestY - 0.1;
        z = a.backZ - (size.z * scale) / 2 + 0.04;
        break;
      case "backTop":
        // Hangs from the shoulders (capes): top edge at the neck line.
        scale = byWidth(a.torsoWidth);
        y = a.neckY - (size.y * scale) / 2;
        z = a.backZ - (size.z * scale) / 2 + 0.04;
        break;
      case "dress":
        scale = byWidth(a.torsoWidth);
        y = a.neckY - 0.02 - (size.y * scale) / 2;
        y = Math.max(y, (size.y * scale) / 2 + 0.04);
        break;
      case "waist":
        scale = byWidth(a.hipWidth);
        y = a.waistY + 0.06 - (size.y * scale) / 2;
        // Short-legged characters: keep the hem just above the ground.
        y = Math.max(y, (size.y * scale) / 2 + 0.04);
        break;
      case "feet": {
        const foot = mirror ? a.footLeft : a.footRight;
        scale = (a.footLength * fit.size) / (size.z || 1);
        [x, , z] = foot;
        y = (size.y * scale) / 2;
        break;
      }
      case "handLeft":
      case "handRight":
        scale = fit.size / (Math.max(size.x, size.y, size.z) || 1);
        [x, y, z] = fit.anchor === "handLeft" ? a.handLeft : a.handRight;
        break;
      default:
        break;
    }
    pivot.scale.setScalar(scale);
    pivot.scale.y *= heightScale;
    if (mirror) pivot.scale.x *= -1;
    pivot.position.set(x, y + (fit.offsetY || 0), z + (fit.offsetZ || 0));
    return pivot;
  };
  return fit.anchor === "feet" ? [place(false), place(true)] : [place(false)];
};
