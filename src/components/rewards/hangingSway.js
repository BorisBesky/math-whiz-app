import * as THREE from "three";

// Secondary motion for items that hang off a character (capes, scarf tails): a damped
// spring per item that lags behind the body, keeps hanging toward gravity when the body
// leans, and flutters a little at rest. The item bends rather than swinging rigidly:
// vertices are rotated about the hang point by an amount that grows with distance below
// it, so the collar/neck wrap stays put and the hem moves most.
//
// Which side of the item the body is on matters, so the hem never swings into it:
//   "behind" - the body is in front of the item (capes)
//   "front"  - the body is behind the item (scarf tails hanging down the chest)
export const HANGING_ANCHORS = {
  backTop: "behind",
  neckWrap: "front",
};

const STIFFNESS = 26; // rad/s^2 per rad (about 0.8 Hz, a short cloth pendulum)
const DAMPING = 3.2;
const INERTIA = 5; // how strongly the hang point's acceleration swings the hem
const GRAVITY_FOLLOW = 0.75; // 1 = always hangs straight down, 0 = moves rigidly with the body
const FLUTTER = 0.035; // rad, idle breeze
// Swing limits in radians: [toward the body, away from it] and sideways.
const LIMITS = { behind: [-0.1, 0.65], front: [-0.08, 0.6], side: 0.45 };

const Y_UP = new THREE.Vector3(0, 1, 0);

// Bounds of `object` in `space` (an ancestor's local frame).
const boundsIn = (object, space) => {
  const box = new THREE.Box3();
  const toSpace = new THREE.Matrix4().copy(space.matrixWorld).invert();
  const local = new THREE.Box3();
  object.traverse((child) => {
    if (!child.isMesh || !child.geometry) return;
    if (!child.geometry.boundingBox) child.geometry.computeBoundingBox();
    local.copy(child.geometry.boundingBox).applyMatrix4(
      new THREE.Matrix4().multiplyMatrices(toSpace, child.matrixWorld)
    );
    box.union(local);
  });
  return box;
};

// Wraps `object` (already in the scene) in a pivot at its hang point and returns a
// controller whose update(dt, time) moves the hem. `characterRoot` sets the axes: its
// +Z is the character's front, +Y up. Call dispose() to free the per-item geometry copies.
export const addHangingSway = (object, characterRoot, side = "behind") => {
  const parent = object.parent;
  if (!parent) return null;
  characterRoot.updateMatrixWorld(true);
  parent.updateMatrixWorld(true);

  // Hang point: top-centre of the item, measured in the character's frame.
  const box = boundsIn(object, characterRoot);
  if (box.isEmpty()) return null;
  const height = box.max.y - box.min.y;
  if (height <= 0) return null;
  const hang = new THREE.Vector3((box.min.x + box.max.x) / 2, box.max.y, (box.min.z + box.max.z) / 2);
  const pivot = new THREE.Group();
  pivot.name = `sway__${object.name || "item"}`;
  pivot.position.copy(characterRoot.localToWorld(hang.clone()));
  characterRoot.getWorldQuaternion(pivot.quaternion);
  characterRoot.getWorldScale(pivot.scale);
  // Place the pivot in world space, then hand it to the item's parent (bone or holder).
  pivot.applyMatrix4(new THREE.Matrix4().copy(parent.matrixWorld).invert());
  parent.add(pivot);
  pivot.updateMatrixWorld(true);
  pivot.attach(object);

  // Per-mesh rest data in pivot space. Geometry is copied: the source may be shared.
  pivot.updateMatrixWorld(true);
  const toPivot = new THREE.Matrix4().copy(pivot.matrixWorld).invert();
  const length = height;
  const meshes = [];
  object.traverse((child) => {
    if (!child.isMesh || !child.geometry?.attributes?.position) return;
    const original = child.geometry;
    child.geometry = original.clone();
    child.geometry.userData.willowFaceInstance = true; // disposed with the viewer
    // A geometry built just for this item (not a shared cached one) is no longer used.
    if (original.userData.willowFaceInstance) original.dispose();
    const toLocal = new THREE.Matrix4().multiplyMatrices(toPivot, child.matrixWorld);
    const fromLocal = toLocal.clone().invert();
    const pos = child.geometry.attributes.position;
    const nrm = child.geometry.attributes.normal;
    const rest = new Float32Array(pos.count * 3);
    const restN = nrm ? new Float32Array(pos.count * 3) : null;
    const weight = new Float32Array(pos.count);
    const normalToLocal = new THREE.Matrix3().getNormalMatrix(toLocal);
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i += 1) {
      v.fromBufferAttribute(pos, i).applyMatrix4(toLocal);
      v.toArray(rest, i * 3);
      const below = THREE.MathUtils.clamp(-v.y / length, 0, 1);
      weight[i] = below * below * (3 - 2 * below) * 0.6 + below * 0.4;
      if (restN) {
        v.fromBufferAttribute(nrm, i).applyMatrix3(normalToLocal).normalize();
        v.toArray(restN, i * 3);
      }
    }
    meshes.push({
      geometry: child.geometry,
      rest,
      restN,
      weight,
      fromLocal,
      normalFromLocal: new THREE.Matrix3().getNormalMatrix(fromLocal),
    });
  });
  if (!meshes.length) return null;

  const limits = side === "front" ? LIMITS.front : LIMITS.behind;
  // Positive angle about X swings the hem backward (-Z); "front" items hang on the
  // other side of the body, so their "away" direction is the opposite sign.
  const awaySign = side === "front" ? -1 : 1;
  const state = { x: 0, z: 0, vx: 0, vz: 0 };
  const last = { pos: null, vel: new THREE.Vector3(), primed: 0 };
  const worldPos = new THREE.Vector3();
  const worldQuat = new THREE.Quaternion();
  const accel = new THREE.Vector3();
  const vel = new THREE.Vector3();
  const down = new THREE.Vector3();
  const q = new THREE.Quaternion();
  const qx = new THREE.Quaternion();
  const qz = new THREE.Quaternion();
  const X = new THREE.Vector3(1, 0, 0);
  const Z = new THREE.Vector3(0, 0, 1);
  const p = new THREE.Vector3();
  const n = new THREE.Vector3();

  const clampSwing = () => {
    const [toward, away] = limits;
    const lo = awaySign > 0 ? toward : -away;
    const hi = awaySign > 0 ? away : -toward;
    if (state.x < lo) { state.x = lo; state.vx = Math.max(0, state.vx); }
    if (state.x > hi) { state.x = hi; state.vx = Math.min(0, state.vx); }
    if (Math.abs(state.z) > LIMITS.side) {
      state.z = Math.sign(state.z) * LIMITS.side;
      state.vz = 0;
    }
  };

  const deform = () => {
    meshes.forEach(({ geometry, rest, restN, weight, fromLocal, normalFromLocal }) => {
      const pos = geometry.attributes.position;
      const nrm = geometry.attributes.normal;
      for (let i = 0; i < pos.count; i += 1) {
        const w = weight[i];
        qx.setFromAxisAngle(X, state.x * w);
        qz.setFromAxisAngle(Z, state.z * w);
        q.multiplyQuaternions(qz, qx);
        p.fromArray(rest, i * 3).applyQuaternion(q).applyMatrix4(fromLocal);
        pos.setXYZ(i, p.x, p.y, p.z);
        if (restN && nrm) {
          n.fromArray(restN, i * 3).applyQuaternion(q).applyMatrix3(normalFromLocal).normalize();
          nrm.setXYZ(i, n.x, n.y, n.z);
        }
      }
      pos.needsUpdate = true;
      if (nrm) nrm.needsUpdate = true;
      geometry.computeBoundingSphere();
    });
  };

  const update = (dt, time = 0) => {
    if (!(dt > 0)) return;
    pivot.updateWorldMatrix(true, false);
    pivot.getWorldPosition(worldPos);
    pivot.getWorldQuaternion(worldQuat);
    const scale = pivot.matrixWorld.getMaxScaleOnAxis() || 1;
    if (!last.pos) {
      last.pos = worldPos.clone();
    }
    vel.copy(worldPos).sub(last.pos).divideScalar(dt);
    // Skip the acceleration kick for the first frames (no velocity history yet).
    accel.copy(vel).sub(last.vel).divideScalar(dt);
    if (last.primed < 2) accel.set(0, 0, 0);
    last.primed += 1;
    last.pos.copy(worldPos);
    last.vel.copy(vel);
    const inv = worldQuat.clone().invert();
    accel.applyQuaternion(inv).divideScalar(scale * length);

    // Gravity in the pivot's frame: the angles that point the hem straight down.
    down.copy(Y_UP).negate().applyQuaternion(inv);
    const gx = Math.atan2(-down.z, -down.y);
    const gz = Math.atan2(down.x, -down.y);
    const flutter = FLUTTER * (Math.sin(time * 1.7) * 0.6 + Math.sin(time * 2.9 + 1.3) * 0.4);
    const targetX = gx * GRAVITY_FOLLOW + awaySign * (Math.abs(flutter) + FLUTTER * 0.5);
    const targetZ = gz * GRAVITY_FOLLOW + flutter * 0.5;

    // Semi-implicit Euler in a few sub-steps for stability on slow frames.
    const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
    const h = dt / steps;
    for (let s = 0; s < steps; s += 1) {
      const ax = -STIFFNESS * (state.x - targetX) - DAMPING * state.vx + INERTIA * accel.z;
      const az = -STIFFNESS * (state.z - targetZ) - DAMPING * state.vz - INERTIA * accel.x;
      state.vx += ax * h;
      state.vz += az * h;
      state.x += state.vx * h;
      state.z += state.vz * h;
      clampSwing();
    }
    deform();
  };

  // Runs the spring for `seconds` of simulated time with the body held still, so a
  // still frame (store thumbnails, tests) shows the settled pose.
  const settle = (seconds = 1.5, time = 0) => {
    for (let t = 0; t < seconds; t += 1 / 60) update(1 / 60, time + t);
  };

  const dispose = () => {
    meshes.forEach(({ geometry }) => geometry.dispose());
  };

  return { pivot, update, settle, dispose, state };
};
