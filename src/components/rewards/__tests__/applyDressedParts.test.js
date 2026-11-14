import * as THREE from "three";
import { applyDressedParts } from "../generatedAccessoryFit";

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
});
