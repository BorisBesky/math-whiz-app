import * as THREE from "three";
import { HANGING_ANCHORS, addHangingSway } from "../hangingSway";

// A character root with a holder (stands in for a bone) carrying a 1-unit tall panel
// that hangs from y=1 down to y=0 behind (or in front of) the body.
const scene = (z = -0.2) => {
  const root = new THREE.Group();
  const holder = new THREE.Group();
  root.add(holder);
  const geometry = new THREE.PlaneGeometry(0.4, 1, 1, 4);
  const panel = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
  panel.position.set(0, 0.5, z);
  holder.add(panel);
  root.updateMatrixWorld(true);
  return { root, holder, panel, geometry };
};

const worldVertices = (mesh) => {
  mesh.updateMatrixWorld(true);
  const pos = mesh.geometry.attributes.position;
  return Array.from({ length: pos.count }, (_, i) =>
    new THREE.Vector3().fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld)
  );
};

// Moves the holder forward (+Z, the character's front) with a burst of acceleration.
const lurchForward = (root, holder, sway, frames = 12) => {
  for (let i = 1; i <= frames; i += 1) {
    holder.position.z = 0.004 * i * i;
    root.updateMatrixWorld(true);
    sway.update(1 / 60, i / 60);
  }
};

describe("addHangingSway", () => {
  test("capes and scarves are the hanging anchors", () => {
    expect(HANGING_ANCHORS).toEqual({ backTop: "behind", neckWrap: "front" });
  });

  test("wraps the item in a pivot at its top without moving it", () => {
    const { root, holder, panel } = scene();
    const before = worldVertices(panel);
    const sway = addHangingSway(panel, root, "behind");
    expect(sway.pivot.parent).toBe(holder);
    expect(panel.parent).toBe(sway.pivot);
    expect(sway.pivot.position.y).toBeCloseTo(1);
    worldVertices(panel).forEach((v, i) => {
      expect(v.distanceTo(before[i])).toBeLessThan(1e-6);
    });
  });

  test("the hem lags behind when the body lurches forward; the top stays put", () => {
    const { root, holder, panel } = scene();
    const sway = addHangingSway(panel, root, "behind");
    const rest = worldVertices(panel);
    lurchForward(root, holder, sway);
    expect(sway.state.x).toBeGreaterThan(0.1);
    const moved = worldVertices(panel);
    const shift = holder.position.z;
    const top = moved.findIndex((v, i) => rest[i].y > 0.99);
    const hem = moved.findIndex((v, i) => rest[i].y < 0.01);
    expect(moved[top].z - rest[top].z).toBeCloseTo(shift, 5);
    expect(moved[hem].z - rest[hem].z).toBeLessThan(shift - 0.05);
  });

  test("a scarf tail in front never swings back into the body", () => {
    const { root, holder, panel } = scene(0.2);
    const sway = addHangingSway(panel, root, "front");
    lurchForward(root, holder, sway, 30);
    expect(sway.state.x).toBeLessThanOrEqual(0.08 + 1e-9);
  });

  test("bends a copy, leaving shared source geometry untouched", () => {
    const { root, holder, panel, geometry } = scene();
    const original = Float32Array.from(geometry.attributes.position.array);
    const sway = addHangingSway(panel, root, "behind");
    lurchForward(root, holder, sway);
    expect(panel.geometry).not.toBe(geometry);
    expect(Array.from(geometry.attributes.position.array)).toEqual(Array.from(original));
  });

  test("settles back to hanging after the body stops", () => {
    const { root, holder, panel } = scene();
    const sway = addHangingSway(panel, root, "behind");
    lurchForward(root, holder, sway);
    sway.settle(6, 0);
    expect(Math.abs(sway.state.x)).toBeLessThan(0.1);
    expect(Math.abs(sway.state.vx)).toBeLessThan(0.3);
  });

  test("ignores items that are not in the scene", () => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(), new THREE.MeshBasicMaterial());
    expect(addHangingSway(mesh, new THREE.Group())).toBeNull();
  });
});
