import {
  getAccessoryById,
  getCharacterById,
  getColorRegions,
  getModelPartAccessories,
  REWARD_ACCESSORIES,
  REWARD_CHARACTERS,
} from "../rewardConfig";

describe("animal store characters", () => {
  test("registers Felix (fox) and Bruno (bear) as model characters", () => {
    const felix = getCharacterById("felix-fox");
    const bruno = getCharacterById("bruno-bear");
    expect(felix.name).toBe("Felix");
    expect(felix.model).toBe("/models/fox_parts.glb");
    expect(bruno.name).toBe("Bruno");
    expect(bruno.model).toBe("/models/bear_parts.glb");
    expect(REWARD_CHARACTERS.map((character) => character.id)).toEqual(
      expect.arrayContaining(["felix-fox", "bruno-bear"])
    );
  });

  test("base bodies expose only always-on parts (accessories are detachable)", () => {
    // Cap / backpack / shoes are NOT permanent color regions — they are
    // equippable accessories, so the base body only shows fur + clothing.
    expect(getColorRegions("felix-fox").map((region) => region.id)).toEqual([
      "fur",
      "hoodie",
      "pants",
    ]);
    expect(getColorRegions("bruno-bear").map((region) => region.id)).toEqual([
      "fur",
      "hoodie",
      "pants",
    ]);
  });

  test("folds the sliver anatomy meshes into the fur region", () => {
    const foxFur = getColorRegions("felix-fox").find((r) => r.id === "fur");
    expect(foxFur.materialNames).toEqual([
      "part_0_head",
      "part_1_ears",
      "part_2_body",
      "part_3_tail",
    ]);
    const bearFur = getColorRegions("bruno-bear").find((r) => r.id === "fur");
    expect(bearFur.materialNames).toEqual(["part_0_head", "part_1_body"]);
  });
});

describe("animal detachable accessories", () => {
  test("maps each character's detachable meshes to accessory categories", () => {
    expect(getModelPartAccessories("felix-fox")).toEqual({
      hat: "part_6_cap",
      back: "part_7_backpack",
    });
    expect(getModelPartAccessories("bruno-bear")).toEqual({
      hat: "part_5_cap",
      back: "part_6_backpack",
      feet: "part_4_shoes",
    });
    // Procedural characters have no detachable model parts.
    expect(getModelPartAccessories("buddy-bear")).toBeNull();
  });

  test("registers cap/backpack/shoes accessories in the right tabs, scoped per character", () => {
    const cases = [
      { id: "felix-cap", category: "hat", part: "part_6_cap", owner: "felix-fox" },
      { id: "felix-backpack", category: "back", part: "part_7_backpack", owner: "felix-fox" },
      { id: "bruno-cap", category: "hat", part: "part_5_cap", owner: "bruno-bear" },
      { id: "bruno-backpack", category: "back", part: "part_6_backpack", owner: "bruno-bear" },
      { id: "bruno-shoes", category: "feet", part: "part_4_shoes", owner: "bruno-bear" },
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
    ["felix-fox", "bruno-bear"].forEach((characterId) => {
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
