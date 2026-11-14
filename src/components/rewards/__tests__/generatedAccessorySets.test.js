import fs from "fs";
import path from "path";
import * as THREE from "three";
import {
  GENERATED_CHARACTER_ACCESSORY_SETS,
  REWARD_ACCESSORIES,
  getAccessoryById,
  isAccessoryOwned,
  resolveEquippedAccessory,
} from "../rewardConfig";
import { getGeneratedAccessoryFit, getGeneratedAnchors } from "../generatedFits";
import { fitGeneratedAccessory } from "../generatedAccessoryFit";

jest.mock("three/examples/jsm/loaders/GLTFLoader.js", () => ({
  GLTFLoader: jest.fn(),
}));

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

describe("fitGeneratedAccessory", () => {
  const createTemplateMesh = () => {
    const geometry = new THREE.BoxGeometry(0.4, 0.5, 0.3);
    const material = new THREE.MeshBasicMaterial();
    return new THREE.Mesh(geometry, material);
  };

  test.each(Object.entries(GENERATED_CHARACTER_ACCESSORY_SETS))(
    "places every %s accessory with finite transforms and valid scales",
    (characterId, itemIds) => {
      const template = createTemplateMesh();
      const anchors = getGeneratedAnchors(characterId);
      itemIds.forEach((itemId) => {
        const fit = getGeneratedAccessoryFit(itemId, characterId);
        const objects = fitGeneratedAccessory(template, fit, anchors);
        const expectedCount = fit.anchor === "feet" ? 2 : 1;
        expect(objects).toHaveLength(expectedCount);
        expect(objects[0].scale.x).toBeGreaterThan(0);

        objects.forEach((obj) => {
          expect(Number.isFinite(obj.position.x)).toBe(true);
          expect(Number.isFinite(obj.position.y)).toBe(true);
          expect(Number.isFinite(obj.position.z)).toBe(true);
          expect(obj.scale.y).toBeGreaterThan(0);
          expect(obj.scale.z).toBeGreaterThan(0);
        });
      });
    }
  );

  test("mirrors foot scale and offsetX across left and right feet and preserves bodyZ override", () => {
    const template = createTemplateMesh();
    const anchors = getGeneratedAnchors("milo-robot");
    const bootsFit = getGeneratedAccessoryFit("milo-rocket-boots", "milo-robot");
    const boots = fitGeneratedAccessory(template, bootsFit, anchors);
    expect(boots).toHaveLength(2);
    expect(boots[0].scale.x).toBeGreaterThan(0);
    expect(boots[1].scale.x).toBeLessThan(0);
    expect(Math.abs(boots[0].scale.x)).toBeCloseTo(Math.abs(boots[1].scale.x));
    expect(boots[0].position.x + boots[1].position.x).toBeCloseTo(
      anchors.footLeft[0] + anchors.footRight[0],
      5
    );

    const miaAnchors = getGeneratedAnchors("mia-girl");
    const dressFit = getGeneratedAccessoryFit("party-dress", "mia-girl");
    const dress = fitGeneratedAccessory(template, dressFit, miaAnchors);
    expect(dress).toHaveLength(1);
    expect(dress[0].position.z).toBeCloseTo(
      miaAnchors.bodyZ + (dressFit.offsetZ || 0),
      5
    );

    const pinaforeFit = getGeneratedAccessoryFit("mia-pinafore", "mia-girl");
    const pinafore = fitGeneratedAccessory(template, pinaforeFit, miaAnchors);
    expect(pinafore).toHaveLength(1);
    expect(pinafore[0].children.length).toBeGreaterThan(1);

    expect(getAccessoryById("milo-hard-hat")).toBeUndefined();
    expect(GENERATED_CHARACTER_ACCESSORY_SETS["milo-robot"]).not.toContain("milo-hard-hat");
  });
});

