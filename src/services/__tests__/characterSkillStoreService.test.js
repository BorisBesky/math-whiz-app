import { runTransaction } from "firebase/firestore";
import { purchaseCharacterSkill } from "../characterSkillStoreService";

jest.mock("firebase/firestore", () => ({ runTransaction: jest.fn() }));

const db = {};
const ref = { id: "student-profile" };
let profile;
let transaction;

beforeEach(() => {
  profile = {
    coins: 60,
    ownedCharacters: ["buddy-bear", "koko-monkey"],
    ownedCharacterSkills: [],
  };
  transaction = {
    get: jest.fn(async () => ({ exists: () => true, data: () => profile })),
    update: jest.fn((_, updates) => {
      profile = { ...profile, ...updates };
    }),
  };
  runTransaction.mockImplementation((_, callback) => callback(transaction));
});

test("purchases Koko's jump at the catalog price", async () => {
  await purchaseCharacterSkill(db, ref, "koko-jump", "koko-monkey");
  expect(profile.coins).toBe(45);
  expect(profile.ownedCharacterSkills).toEqual(["koko-jump"]);
});

test("cannot charge twice for the same move", async () => {
  await purchaseCharacterSkill(db, ref, "koko-floss", "koko-monkey");
  const result = await purchaseCharacterSkill(db, ref, "koko-floss", "koko-monkey");
  expect(result.alreadyOwned).toBe(true);
  expect(profile.coins).toBe(35);
  expect(transaction.update).toHaveBeenCalledTimes(1);
});

test("requires the character and the current stored coin balance", async () => {
  profile.ownedCharacters = ["buddy-bear"];
  await expect(
    purchaseCharacterSkill(db, ref, "koko-jump", "koko-monkey")
  ).rejects.toThrow("Buy Koko");

  profile.ownedCharacters.push("koko-monkey");
  profile.coins = 14;
  await expect(
    purchaseCharacterSkill(db, ref, "koko-jump", "koko-monkey")
  ).rejects.toThrow("1 more coins");
  expect(transaction.update).not.toHaveBeenCalled();
});

test("rejects included, unknown, and mismatched moves", async () => {
  await expect(
    purchaseCharacterSkill(db, ref, "koko-wave", "koko-monkey")
  ).rejects.toThrow("unavailable");
  await expect(
    purchaseCharacterSkill(db, ref, "made-up", "koko-monkey")
  ).rejects.toThrow("unavailable");
  await expect(
    purchaseCharacterSkill(db, ref, "koko-jump", "buddy-bear")
  ).rejects.toThrow("unavailable");
  expect(transaction.update).not.toHaveBeenCalled();
});
