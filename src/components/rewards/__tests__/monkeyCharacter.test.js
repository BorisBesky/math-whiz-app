import {
  getCharacterById,
  getCharacterSkillById,
  getCharacterSkills,
  getColorRegions,
  getModelPartAccessories,
  REWARD_CHARACTERS,
} from "../rewardConfig";

describe("monkey store character", () => {
  test("registers Koko as a model character", () => {
    const koko = getCharacterById("koko-monkey");
    expect(koko.name).toBe("Koko");
    expect(koko.model).toBe("/models/monkey_parts.glb?v=animated-1");
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

  test("uses semantic material controls that follow Koko's animated parts", () => {
    const covered = getColorRegions("koko-monkey").flatMap(
      (region) => region.materialNames || [region.id]
    );
    expect(covered.sort()).toEqual([
      "koko_belly",
      "koko_ears",
      "koko_face",
      "koko_fur",
      "koko_tail",
    ].sort());
  });

  test("includes a free hello plus purchasable jump and floss skills", () => {
    expect(getCharacterSkills("koko-monkey")).toEqual([
      expect.objectContaining({ id: "koko-wave", animation: "Wave", included: true, price: 0 }),
      expect.objectContaining({ id: "koko-jump", animation: "Jump", price: 15 }),
      expect.objectContaining({ id: "koko-floss", animation: "Floss", price: 25 }),
    ]);
    expect(getCharacterSkillById("koko-floss")).toEqual(
      expect.objectContaining({ characterId: "koko-monkey", animation: "Floss" })
    );
  });

  test("has no detachable accessories (the model carries no gear meshes)", () => {
    expect(getModelPartAccessories("koko-monkey")).toBeNull();
  });
});
