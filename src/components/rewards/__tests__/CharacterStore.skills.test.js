import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import CharacterStore from "../CharacterStore";

let mockViewerProps;
jest.mock("../CharacterViewer", () => (props) => {
  mockViewerProps = props;
  return <div data-testid="character-viewer" />;
});

const baseProps = {
  userData: {
    coins: 100,
    selectedCharacterId: "koko-monkey",
    ownedCharacters: ["buddy-bear", "koko-monkey"],
    ownedAccessories: [],
    equippedAccessories: {},
    characterColors: {},
    ownedCharacterSkills: [],
  },
  handleSelectCharacter: jest.fn(),
  handlePurchaseCharacter: jest.fn(),
  handlePurchaseAccessory: jest.fn(),
  handleEquipAccessory: jest.fn(),
  handleUnequipAccessory: jest.fn(),
  handleSetCharacterColor: jest.fn(),
  handlePurchaseCharacterSkill: jest.fn(),
};

describe("Koko character skills", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockViewerProps = null;
  });

  test("waves on hover and can perform the included hello move", () => {
    render(<CharacterStore {...baseProps} />);

    expect(mockViewerProps.hoverAnimation).toBe("Wave");
    const waveCard = screen.getByRole("article", { name: "Hello Wave skill" });
    fireEvent.click(within(waveCard).getByRole("button", { name: /perform/i }));
    expect(mockViewerProps.animationRequest).toEqual(
      expect.objectContaining({ name: "Wave", nonce: 1 })
    );
  });

  test("offers jump and floss as permanent coin purchases", () => {
    render(<CharacterStore {...baseProps} />);

    const jumpCard = screen.getByRole("article", { name: "Big Jump skill" });
    const flossCard = screen.getByRole("article", { name: "Floss Dance skill" });
    fireEvent.click(within(jumpCard).getByRole("button", { name: /buy · 15/i }));
    fireEvent.click(within(flossCard).getByRole("button", { name: /buy · 25/i }));

    expect(baseProps.handlePurchaseCharacterSkill).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ id: "koko-jump", animation: "Jump" }),
      "koko-monkey"
    );
    expect(baseProps.handlePurchaseCharacterSkill).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ id: "koko-floss", animation: "Floss" }),
      "koko-monkey"
    );
  });

  test("lets owned skills trigger their matching animation", () => {
    render(
      <CharacterStore
        {...baseProps}
        userData={{
          ...baseProps.userData,
          ownedCharacterSkills: ["koko-jump", "koko-floss"],
        }}
      />
    );

    const flossCard = screen.getByRole("article", { name: "Floss Dance skill" });
    fireEvent.click(within(flossCard).getByRole("button", { name: /perform/i }));
    expect(mockViewerProps.animationRequest).toEqual(
      expect.objectContaining({ name: "Floss", nonce: 1 })
    );
  });
});
