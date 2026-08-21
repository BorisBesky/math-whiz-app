import { getColorRegions, REWARD_ACCESSORIES } from "../rewardConfig";
import * as THREE from "three";
import {
  applyWillowHeadFaceUVs,
  getWillowHiddenPartNames,
  localPositionToFaceUV,
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
    const { x, y } = WILLOW_FACE_LANDMARKS.leftEye;
    const socket = paintWillowFaceVertexColor(x, y, 0.2, skin, tints);
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

  test("can wear dresses, hats, glasses, and props", () => {
    const wearable = REWARD_ACCESSORIES.filter((item) =>
      item.characterIds.includes(willowId)
    );
    const categories = wearable.map((item) => item.category);
    expect(categories).toEqual(
      expect.arrayContaining([
        "hat",
        "eyewear",
        "dress",
        "skirt",
        "jewelry",
        "neckwear",
        "back",
        "feet",
        "prop",
      ])
    );
    expect(wearable.some((item) => item.category === "shorts")).toBe(false);
    expect(wearable.some((item) => item.shape === "antenna")).toBe(false);
  });

  test("hides baked parts when store items replace them", () => {
    expect(getWillowHiddenPartNames({})).toEqual(new Set());
    expect(getWillowHiddenPartNames({ hat: "gold-crown" })).toEqual(
      new Set(["part_2_hat", "part_1_feather"])
    );
    expect(getWillowHiddenPartNames({ prop: "sparkle-wand" })).toEqual(
      new Set(["part_6_magic staff", "part_7_orb"])
    );
    expect(getWillowHiddenPartNames({ dress: "party-dress" })).toEqual(
      new Set(["part_4_cloak"])
    );
    expect(getWillowHiddenPartNames({ back: "hero-cape" })).toEqual(
      new Set(["part_4_cloak"])
    );
    expect(getWillowHiddenPartNames({ back: "explorer-backpack" })).toEqual(new Set());
  });

  test("projects sculpted face landmarks onto the head UV atlas", () => {
    const leftEye = localPositionToFaceUV(0.058, 0.394, 0.213);
    const rightEye = localPositionToFaceUV(0.152, 0.409, 0.232);
    const mouth = localPositionToFaceUV(0.097, 0.277, 0.202);
    const backOfHead = localPositionToFaceUV(0.1, 0.3, -0.4);
    expect(leftEye[0]).toBeGreaterThan(0.3);
    expect(leftEye[0]).toBeLessThan(0.5);
    expect(leftEye[1]).toBeGreaterThan(0.45);
    expect(rightEye[0]).toBeGreaterThan(leftEye[0]);
    expect(mouth[1]).toBeLessThan(leftEye[1]);
    expect(backOfHead[0]).toBeLessThan(0.1);
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
    expect(geometry.attributes.uv.getX(1)).toBeLessThan(0.1);
    expect(geometry.userData.willowFaceUv).toBe("atlas-v3");
  });
});
