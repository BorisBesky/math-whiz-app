import { runTransaction } from "firebase/firestore";
import { getCharacterById, getCharacterSkillById } from "../components/rewards/rewardConfig";

// Skill purchases are permanent and must be idempotent: a double click or a
// second open tab may never charge twice for the same animation.
export async function purchaseCharacterSkill(db, profileRef, skillId, characterId) {
  const skill = getCharacterSkillById(skillId);
  if (
    !skill ||
    skill.included ||
    skill.characterId !== characterId ||
    !profileRef
  ) {
    throw new Error("This character move is unavailable. Please try again.");
  }

  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(profileRef);
    if (!snapshot.exists()) {
      throw new Error("Your profile is still loading. Please try again.");
    }

    const profile = snapshot.data();
    const ownedCharacters = Array.isArray(profile.ownedCharacters)
      ? profile.ownedCharacters
      : [];
    if (!ownedCharacters.includes(characterId)) {
      throw new Error(
        `Buy ${getCharacterById(characterId).name} before unlocking this move.`
      );
    }

    const ownedSkills = Array.isArray(profile.ownedCharacterSkills)
      ? [...new Set(profile.ownedCharacterSkills)]
      : [];
    if (ownedSkills.includes(skill.id)) return { alreadyOwned: true, skill };

    const coins = Number.isFinite(profile.coins) ? profile.coins : 0;
    if (coins < skill.price) {
      throw new Error(
        `You need ${skill.price - coins} more coins. Keep practicing!`
      );
    }

    transaction.update(profileRef, {
      coins: coins - skill.price,
      ownedCharacterSkills: [...ownedSkills, skill.id],
    });
    return { alreadyOwned: false, skill };
  });
}
