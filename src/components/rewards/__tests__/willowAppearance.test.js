import { getColorRegions, getModelPartAccessories, REWARD_ACCESSORIES } from "../rewardConfig";
import * as THREE from "three";
import {
  applyWillowHeadFaceUVs,
  paintWillowFaceVertexColor,
  WILLOW_FACE_LANDMARKS,
} from "../willowAppearance";

describe("Willow store customization", () => {
  const willowId = "willow-wizard";

  test("tints sculpted eye sockets without adding extra shapes", () => {
    const skin = [0.95, 0.78, 0.63];
    const tints = {
      eyes: [0.1, 0.3, 0.9],
      brows: [0.3, 0.1, 0.3],
      lips: [0.8, 0.2, 0.4],
      blush: [0.98, 0.5, 0.55],
      shadow: [0.6, 0.4, 0.9],
    };
    const iris = WILLOW_FACE_LANDMARKS.leftIris;
    const socket = paintWillowFaceVertexColor(
      iris.x + iris.rx * 0.65,
      iris.y,
      0.2,
      skin,
      tints
    );
    const cheek = paintWillowFaceVertexColor(0.1, 0.5, 0.2, skin, tints);
    expect(socket[2]).toBeGreaterThan(socket[0]);
    expect(Math.abs(cheek[0] - skin[0])).toBeLessThan(0.15);
  });

  test("includes face and outfit color regions", () => {
    const regions = getColorRegions(willowId);
    const ids = regions.map((region) => region.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        "head",
        "hat",
        "cloak",
        "eyes",
        "brows",
        "lips",
        "blush",
        "eyeshadow",
      ])
    );
    expect(regions.filter((region) => region.group === "face")).toHaveLength(5);
  });

  test("locks the original outfit instead of wearing store clothes", () => {
    const wearable = REWARD_ACCESSORIES.filter((item) =>
      item.characterIds.includes(willowId)
    );
    expect(wearable).toEqual([]);
  });

  test("keeps baked parts visible instead of hiding them for store items", () => {
    expect(getModelPartAccessories(willowId)).toBeNull();
  });

  test("projects sculpted face landmarks onto the head UV window", () => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(
        new Float32Array([
          0.058, 0.394, 0.213, 0.152, 0.409, 0.232, 0.097, 0.277, 0.202, 0.1, 0.3, -0.4,
        ]),
        3
      )
    );
    applyWillowHeadFaceUVs(geometry);
    const uv = geometry.attributes.uv;
    expect(uv.getX(0)).toBeGreaterThan(0.3);
    expect(uv.getX(0)).toBeLessThan(0.5);
    expect(uv.getY(0)).toBeGreaterThan(0.45);
    expect(uv.getX(1)).toBeGreaterThan(uv.getX(0));
    expect(uv.getY(2)).toBeLessThan(uv.getY(0));
    // Depth is blended in the shader; XY projection stays continuous at the back.
    expect(uv.getX(3)).toBeCloseTo(0.5);
  });

  test("writes front-projected UVs onto the head geometry", () => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(
        new Float32Array([0.058, 0.394, 0.213, 0.1, 0.3, -0.4]),
        3
      )
    );
    applyWillowHeadFaceUVs(geometry);
    expect(geometry.attributes.uv.getX(0)).toBeGreaterThan(0.3);
    expect(geometry.attributes.uv.getX(0)).toBeLessThan(0.5);
    expect(geometry.attributes.uv.getX(1)).toBeCloseTo(0.5);
  });
});
