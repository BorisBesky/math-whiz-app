import * as THREE from "three";
import { applyDressedParts, attachToSkeleton } from "../generatedAccessoryFit";

jest.mock("three/examples/jsm/loaders/GLTFLoader.js", () => ({ GLTFLoader: jest.fn() }));

const dressedModel = () => {
  const root = new THREE.Group();
  ["body", "body__leo-explorer-hat", "item__leo-explorer-hat", "item__leo-medal"].forEach((name) => {
    const mesh = new THREE.Mesh();
    mesh.name = name;
    root.add(mesh);
  });
  return root;
};

const visibility = (root) =>
  Object.fromEntries(root.children.map((child) => [child.name, child.visible]));

describe("applyDressedParts", () => {
  test("hides every built-in item when nothing is worn", () => {
    const root = dressedModel();
    expect(applyDressedParts(root, []).size).toBe(0);
    expect(visibility(root)).toEqual({
      body: true,
      "body__leo-explorer-hat": true,
      "item__leo-explorer-hat": false,
      "item__leo-medal": false,
    });
  });

  test("shows a worn item and hides the body region it replaces", () => {
    const root = dressedModel();
    const handled = applyDressedParts(root, ["leo-explorer-hat", "leo-backpack"]);
    expect([...handled]).toEqual(["leo-explorer-hat"]);
    expect(visibility(root)).toEqual({
      body: true,
      "body__leo-explorer-hat": false,
      "item__leo-explorer-hat": true,
      "item__leo-medal": false,
    });
  });

  test("hides a region shared by several items while any of them is worn", () => {
    const root = new THREE.Group();
    const shared = new THREE.Mesh();
    shared.name = "body__leo-explorer-hat+sunny-red-cap";
    root.add(shared);
    applyDressedParts(root, ["sunny-red-cap"]);
    expect(shared.visible).toBe(false);
    applyDressedParts(root, ["leo-backpack"]);
    expect(shared.visible).toBe(true);
  });

  test("drops the part of an item that would poke through another worn item", () => {
    const root = new THREE.Group();
    ["item__sport-shorts", "item__sport-shorts~leo-sneakers"].forEach((name) => {
      const mesh = new THREE.Mesh();
      mesh.name = name;
      root.add(mesh);
    });
    expect([...applyDressedParts(root, ["sport-shorts"])]).toEqual(["sport-shorts"]);
    expect(visibility(root)).toEqual({ "item__sport-shorts": true, "item__sport-shorts~leo-sneakers": true });
    applyDressedParts(root, ["sport-shorts", "leo-sneakers"]);
    expect(visibility(root)).toEqual({ "item__sport-shorts": true, "item__sport-shorts~leo-sneakers": false });
  });
});

describe("attachToSkeleton", () => {
  const rigged = () => {
    const root = new THREE.Group();
    [["handL", 0.3], ["handR", -0.3]].forEach(([name, x]) => {
      const bone = new THREE.Bone();
      bone.name = name;
      bone.position.set(x, 0.5, 0);
      root.add(bone);
    });
    return root;
  };

  test("puts a hand prop on the nearest hand bone, keeping its place", () => {
    const root = rigged();
    const container = new THREE.Group();
    root.add(container);
    const prop = new THREE.Mesh();
    prop.position.set(-0.28, 0.45, 0.05);
    expect(attachToSkeleton(root, container, prop, "handRight")).toBe(true);
    expect(prop.parent.name).toBe("handR");
    const world = new THREE.Vector3().setFromMatrixPosition(prop.matrixWorld);
    expect(world.x).toBeCloseTo(-0.28);
    expect(world.y).toBeCloseTo(0.45);
  });

  test("does nothing for characters without a skeleton", () => {
    const root = new THREE.Group();
    expect(attachToSkeleton(root, root, new THREE.Mesh(), "head")).toBe(false);
  });
});
