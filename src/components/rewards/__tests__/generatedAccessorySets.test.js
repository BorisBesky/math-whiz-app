import fs from "fs";
import path from "path";
import {
  GENERATED_CHARACTER_ACCESSORY_SETS,
  REWARD_ACCESSORIES,
  getAccessoryById,
  isAccessoryOwned,
  resolveEquippedAccessory,
} from "../rewardConfig";
import { getGeneratedAccessoryFit, getGeneratedAnchors } from "../generatedFits";

const publicDir = path.join(__dirname, "..", "..", "..", "..", "public");

describe("generated character accessory sets", () => {
  const entries = Object.entries(GENERATED_CHARACTER_ACCESSORY_SETS);

  test.each(entries)("%s has anchors and a curated set", (characterId, itemIds) => {
    expect(getGeneratedAnchors(characterId)).not.toBeNull();
    expect(itemIds.length).toBeGreaterThanOrEqual(8);
    expect(new Set(itemIds).size).toBe(itemIds.length);
  });

  test.each(entries)("every %s item exists, is wearable, fits and has assets", (characterId, itemIds) => {
    itemIds.forEach((itemId) => {
      const item = getAccessoryById(itemId);
      expect(item).toBeDefined();
      expect(item.characterIds).toContain(characterId);
      expect(getGeneratedAccessoryFit(itemId, characterId)).not.toBeNull();
      expect(fs.existsSync(path.join(publicDir, "models", "accessories", `${itemId}.glb`))).toBe(true);
      expect(item.image).toBe(`/models/accessories/thumbs/${itemId}.jpg`);
      expect(fs.existsSync(path.join(publicDir, item.image))).toBe(true);
    });
  });

  test("generated characters can only wear items from their own set", () => {
    entries.forEach(([characterId, itemIds]) => {
      const wearable = REWARD_ACCESSORIES.filter((item) => item.characterIds.includes(characterId));
      expect(wearable.map((item) => item.id).sort()).toEqual([...itemIds].sort());
    });
  });

  test("character-specific items are not offered to other characters", () => {
    REWARD_ACCESSORIES.filter((item) => /^(buddy|milo|leo|mia)-/.test(item.id)).forEach((item) => {
      const owner = item.id.split("-")[0];
      expect(item.characterIds).toHaveLength(1);
      expect(item.characterIds[0].startsWith(owner)).toBe(true);
    });
  });
});

describe("per-character versions of formerly shared items", () => {
  const versions = REWARD_ACCESSORIES.filter((item) => item.legacyIds);

  test("each version replaces a real shared item in the same category", () => {
    expect(versions.length).toBe(13);
    versions.forEach((item) => {
      item.legacyIds.forEach((legacyId) => {
        expect(getAccessoryById(legacyId)?.category).toBe(item.category);
      });
    });
  });

  test("owning the shared item counts as owning every character's version", () => {
    expect(isAccessoryOwned(["explorer-backpack"], getAccessoryById("buddy-backpack"))).toBe(true);
    expect(isAccessoryOwned(["explorer-backpack"], getAccessoryById("leo-backpack"))).toBe(true);
    expect(isAccessoryOwned(["leo-backpack"], getAccessoryById("buddy-backpack"))).toBe(false);
    expect(isAccessoryOwned(["buddy-honey-pot"], getAccessoryById("buddy-honey-pot"))).toBe(true);
    expect(isAccessoryOwned([], getAccessoryById("buddy-honey-pot"))).toBe(false);
    expect(isAccessoryOwned(undefined, getAccessoryById("buddy-honey-pot"))).toBe(false);
  });

  test("no generated character is offered a shared item that has per-character versions", () => {
    const replaced = new Set(versions.flatMap((item) => item.legacyIds));
    Object.values(GENERATED_CHARACTER_ACCESSORY_SETS).flat().forEach((itemId) => {
      expect(replaced.has(itemId)).toBe(false);
    });
  });
});

describe("resolveEquippedAccessory", () => {
  test("keeps items the character can wear", () => {
    expect(resolveEquippedAccessory("buddy-honey-pot", "buddy-bear")?.id).toBe("buddy-honey-pot");
  });

  test("maps an old shared item to the character's own version", () => {
    expect(resolveEquippedAccessory("explorer-backpack", "buddy-bear")?.id).toBe("buddy-backpack");
    expect(resolveEquippedAccessory("explorer-backpack", "leo-boy")?.id).toBe("leo-backpack");
    expect(resolveEquippedAccessory("math-medal", "milo-robot")?.id).toBe("milo-medal");
  });

  test("drops items the character has no version of", () => {
    expect(resolveEquippedAccessory("gold-crown", "buddy-bear")).toBeNull();
    expect(resolveEquippedAccessory("buddy-honey-pot", "leo-boy")).toBeNull();
    expect(resolveEquippedAccessory(undefined, "leo-boy")).toBeNull();
  });
});
