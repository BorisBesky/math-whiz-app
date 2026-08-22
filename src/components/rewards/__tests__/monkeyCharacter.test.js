import {
  getCharacterById,
  getColorRegions,
  getModelPartAccessories,
  REWARD_CHARACTERS,
} from "../rewardConfig";

describe("monkey store character", () => {
  test("registers Koko as a model character", () => {
    const koko = getCharacterById("koko-monkey");
    expect(koko.name).toBe("Koko");
    expect(koko.model).toBe("/models/monkey_parts.glb");
    expect(REWARD_CHARACTERS.map((character) => character.id)).toEqual(
      expect.arrayContaining(["koko-monkey"])
    );
  });

  test("exposes fur / face / ears / tail color controls", () => {
    expect(getColorRegions("koko-monkey").map((region) => region.id)).toEqual([
      "fur",
      "face",
      "ears",
      "tail",
    ]);
  });

  test("covers every mesh in the model so nothing renders untinted", () => {
    const covered = getColorRegions("koko-monkey").flatMap(
      (region) => region.materialNames || [region.id]
    );
    expect(covered.sort()).toEqual([
      "part_0_head",
      "part_1_ears",
      "part_2_body",
      "part_3_arms",
      "part_4_legs",
      "part_5_tail",
    ].sort());
  });

  test("has no detachable accessories (the model carries no gear meshes)", () => {
    expect(getModelPartAccessories("koko-monkey")).toBeNull();
  });
});
