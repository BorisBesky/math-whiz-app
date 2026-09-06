// Validate the exported artifact with the same loader/mixer used in the store.
// Run after Blender regeneration: node scripts/validate-sage-owl.mjs
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";

const data = await readFile(new URL("../public/models/sage_owl.glb", import.meta.url));
const gltf = await new GLTFLoader().parseAsync(
  data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength), ""
);
assert.deepEqual(gltf.animations.map(({ name }) => name).sort(), ["Blink", "HeadSpin", "Idle", "WingFlap"]);
const box = new THREE.Box3().setFromObject(gltf.scene);
assert(box.min.y > -0.02 && box.max.y < 2.9, "Model must stand on its perch and fit the viewer");
let meshes = 0;
gltf.scene.traverse(node => { if (node.isMesh) meshes += 1; });
assert(meshes < 55, `Too many draw calls for mobile: ${meshes}`);

function performance(name) {
  const root = clone(gltf.scene);
  const mixer = new THREE.AnimationMixer(root);
  const clip = THREE.AnimationClip.findByName(gltf.animations, name);
  const action = mixer.clipAction(clip);
  action.setLoop(THREE.LoopOnce, 1);
  action.clampWhenFinished = true;
  action.play();
  const bones = {};
  root.traverse(node => { if (node.isBone) bones[node.name.replace(/[^a-z]/gi, "")] = node; });
  for (const bone of ["head", "body", "wingL", "wingR", "eyeL", "eyeR"])
    assert(bones[bone], `Missing ${bone} animation pivot`);
  return {
    clip,
    sample(time) {
      action.reset().play();
      mixer.setTime(time);
      root.updateMatrixWorld(true);
      return Object.fromEntries(Object.entries(bones).map(([key, node]) => [key, {
        rotation: node.getWorldQuaternion(new THREE.Quaternion()),
        position: node.getWorldPosition(new THREE.Vector3()),
        scale: node.scale.clone(),
      }]));
    },
  };
}

const idle = performance("Idle");
assert.equal(idle.clip.duration, 24);
const start = idle.sample(0);
const end = idle.sample(24);
for (const bone of Object.keys(start)) {
  assert(start[bone].rotation.angleTo(end[bone].rotation) < 0.001, `${bone} pops at the idle seam`);
  assert(start[bone].position.distanceTo(end[bone].position) < 0.001, `${bone} jumps at the idle seam`);
  assert(start[bone].scale.distanceTo(end[bone].scale) < 0.001, `${bone} changes size at the idle seam`);
}

for (const name of ["Idle", "HeadSpin"]) {
  const run = performance(name);
  let previousYaw = 0, totalYaw = 0;
  for (let t = 0; t <= run.clip.duration; t += 1 / 48) {
    const pose = run.sample(t);
    const facing = new THREE.Vector3(0, 0, 1).applyQuaternion(pose.head.rotation);
    const yaw = Math.atan2(facing.x, facing.z);
    if (t > 0) totalYaw += Math.atan2(Math.sin(yaw - previousYaw), Math.cos(yaw - previousYaw));
    previousYaw = yaw;
    assert(pose.body.rotation.angleTo(start.body.rotation) < 0.002, "Head spin must not turn the body");
  }
  assert(Math.abs(Math.abs(totalYaw) - 2 * Math.PI) < 0.02, `${name} must contain a true full head spin`);
}
const wingRun = performance("WingFlap");
const wings = wingRun.sample(1.42);
assert(wings.wingL.rotation.angleTo(start.wingL.rotation) > 0.65);
assert(wings.wingR.rotation.angleTo(start.wingR.rotation) > 0.65);
const blinkRun = performance("Blink");
const blink = blinkRun.sample(11 / 24);
assert(blink.eyeL.scale.y < 0.08 && blink.eyeR.scale.y < 0.08, "Both eyes must close");
assert(blinkRun.sample(0.9).eyeL.scale.y > 0.99, "Eyes must reopen");
assert(idle.sample(1.95).eyeL.scale.y < 0.12, "Idle must blink automatically");
assert(idle.sample(4.12).wingL.rotation.angleTo(start.wingL.rotation) > 0.6, "Idle must flap automatically");
assert(idle.sample(8).wingL.rotation.angleTo(start.wingL.rotation) < 0.01, "Wings must rest between flaps");

console.log(`Sage GLB passed: ${meshes} meshes, ${(data.length / 1024).toFixed(0)} KiB, 4 playable clips, seamless 24s idle, full 360° head turn, independent wings and blinking.`);
