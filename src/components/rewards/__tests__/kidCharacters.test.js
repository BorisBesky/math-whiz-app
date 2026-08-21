import {
  getAccessoryById,
  getCharacterById,
  getColorRegions,
  getModelPartAccessories,
  REWARD_ACCESSORIES,
  REWARD_CHARACTERS,
} from "../rewardConfig";

describe("kid store characters", () => {
  test("registers Nico and Quinn as model characters", () => {
    const nico = getCharacterById("nico-kid");
    const quinn = getCharacterById("quinn-kid");
    expect(nico.name).toBe("Nico");
    expect(nico.model).toBe("/models/kid1_parts.glb");
    expect(quinn.name).toBe("Quinn");
    expect(quinn.model).toBe("/models/kid2_parts.glb");
    expect(REWARD_CHARACTERS.map((character) => character.id)).toEqual(
      expect.arrayContaining(["nico-kid", "quinn-kid"])
    );
  });

  test("base bodies expose only always-on parts (cap/backpack/sneakers are detachable)", () => {
    ["nico-kid", "quinn-kid"].forEach((id) => {
      const regions = getColorRegions(id);
      expect(regions.map((region) => region.id)).toEqual([
        "head",
        "hair",
        "torso",
        "hoodie",
        "pants",
      ]);
    });
  });
});

describe("kid detachable accessories", () => {
  test("maps each kid's detachable meshes to accessory categories", () => {
    const expected = {
      hat: "part_7_cap",
      back: "part_6_backpack",
      feet: "part_5_sneakers",
    };
    expect(getModelPartAccessories("nico-kid")).toEqual(expected);
    expect(getModelPartAccessories("quinn-kid")).toEqual(expected);
  });

  test("registers cap/backpack/sneakers accessories in the right tabs, scoped per kid", () => {
    const cases = [
      { id: "nico-cap", category: "hat", part: "part_7_cap", owner: "nico-kid" },
      { id: "nico-backpack", category: "back", part: "part_6_backpack", owner: "nico-kid" },
      { id: "nico-sneakers", category: "feet", part: "part_5_sneakers", owner: "nico-kid" },
      { id: "quinn-cap", category: "hat", part: "part_7_cap", owner: "quinn-kid" },
      { id: "quinn-backpack", category: "back", part: "part_6_backpack", owner: "quinn-kid" },
      { id: "quinn-sneakers", category: "feet", part: "part_5_sneakers", owner: "quinn-kid" },
    ];
    cases.forEach(({ id, category, part, owner }) => {
      const item = getAccessoryById(id);
      expect(item).toBeTruthy();
      expect(item.category).toBe(category);
      expect(item.modelPart).toBe(part);
      expect(item.characterIds).toEqual([owner]);
    });
  });

  test("every detachable mesh has a matching accessory (nothing is stranded)", () => {
    ["nico-kid", "quinn-kid"].forEach((characterId) => {
      const partMap = getModelPartAccessories(characterId);
      Object.entries(partMap).forEach(([category, meshName]) => {
        const match = REWARD_ACCESSORIES.find(
          (item) =>
            item.category === category &&
            item.modelPart === meshName &&
            item.characterIds.includes(characterId)
        );
        expect(match).toBeTruthy();
      });
    });
  });
});
