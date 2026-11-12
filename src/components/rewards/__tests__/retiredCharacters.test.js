import fs from "fs";
import path from "path";
import React from "react";
import { render, screen } from "@testing-library/react";
import CharacterStore from "../CharacterStore";
import {
  AVAILABLE_CHARACTERS,
  DEFAULT_CHARACTER_ID,
  RETIRED_CHARACTER_IDS,
  REWARD_CHARACTERS,
  getCharacterById,
  isCharacterAvailable,
  resolveSelectedCharacterId,
} from "../rewardConfig";

let mockViewerProps;
jest.mock("../CharacterViewer", () => (props) => {
  mockViewerProps = props;
  return <div data-testid="character-viewer" />;
});

const RETIRED_NAMES = [
  "Pip", "Cora", "Sunny", "Max", "Ava", "Rover",
  "Ollie", "Frost", "Nico", "Quinn", "Felix", "Bruno",
];

describe("retired characters", () => {
  test("retired characters are hidden from the available roster", () => {
    expect(RETIRED_CHARACTER_IDS).toHaveLength(12);
    const availableIds = AVAILABLE_CHARACTERS.map((character) => character.id);
    RETIRED_CHARACTER_IDS.forEach((id) => {
      expect(availableIds).not.toContain(id);
      expect(isCharacterAvailable(id)).toBe(false);
    });
    expect(availableIds).toEqual(
      expect.arrayContaining([DEFAULT_CHARACTER_ID, "milo-robot", "koko-monkey", "sage-owl"])
    );
  });

  test("retired definitions and model files stay in the repo", () => {
    RETIRED_CHARACTER_IDS.forEach((id) => {
      const character = REWARD_CHARACTERS.find((entry) => entry.id === id);
      expect(character).toBeTruthy();
      if (character.model) {
        const modelPath = path.join(process.cwd(), "public", character.model.split("?")[0]);
        expect(fs.existsSync(modelPath)).toBe(true);
      }
    });
  });

  test("saved selections of retired characters fall back to the default", () => {
    RETIRED_CHARACTER_IDS.forEach((id) => {
      expect(resolveSelectedCharacterId(id)).toBe(DEFAULT_CHARACTER_ID);
    });
    expect(resolveSelectedCharacterId("sage-owl")).toBe("sage-owl");
    expect(resolveSelectedCharacterId(undefined)).toBe(DEFAULT_CHARACTER_ID);
    expect(resolveSelectedCharacterId("not-a-character")).toBe(DEFAULT_CHARACTER_ID);
  });

  test("store hides retired characters and shows the default for a retired saved selection", () => {
    render(
      <CharacterStore
        userData={{
          selectedCharacterId: "felix-fox",
          ownedCharacters: ["buddy-bear", "felix-fox"],
          coins: 100,
        }}
        handleSelectCharacter={jest.fn()}
        handlePurchaseCharacter={jest.fn()}
      />
    );
    expect(mockViewerProps.characterId).toBe(DEFAULT_CHARACTER_ID);
    expect(screen.getByText(getCharacterById(DEFAULT_CHARACTER_ID).title)).toBeInTheDocument();
    RETIRED_NAMES.forEach((name) => {
      expect(screen.queryByText(name)).not.toBeInTheDocument();
    });
  });
});
