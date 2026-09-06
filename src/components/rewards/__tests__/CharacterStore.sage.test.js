import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import CharacterStore from "../CharacterStore";

let mockViewerProps;
jest.mock("../CharacterViewer", () => (props) => {
  mockViewerProps = props;
  return <div data-testid="sage-viewer" />;
});

test("previews Sage without selecting or purchasing, then buys at the normal character price", () => {
  const select = jest.fn();
  const buy = jest.fn();
  render(<CharacterStore
    userData={{ selectedCharacterId: "buddy-bear", ownedCharacters: ["buddy-bear"], coins: 100 }}
    handleSelectCharacter={select}
    handlePurchaseCharacter={buy}
  />);

  fireEvent.click(screen.getByRole("button", { name: /Sage preview Sage/ }));
  expect(mockViewerProps.characterId).toBe("sage-owl");
  expect(mockViewerProps.colors).toEqual(expect.objectContaining({
    feathers: "#79513a", face: "#f3dec0", book: "#913b2c",
  }));
  expect(select).not.toHaveBeenCalled();
  expect(buy).not.toHaveBeenCalled();
  expect(screen.queryByTestId("character-skills")).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Buy Sage · 60" }));
  expect(buy).toHaveBeenCalledWith(expect.objectContaining({ id: "sage-owl" }));
});

test("selects an owned Sage without charging for its included idle animations", () => {
  const select = jest.fn();
  const buy = jest.fn();
  render(<CharacterStore
    userData={{ selectedCharacterId: "buddy-bear", ownedCharacters: ["buddy-bear", "sage-owl"] }}
    handleSelectCharacter={select}
    handlePurchaseCharacter={buy}
  />);
  fireEvent.click(screen.getByRole("button", { name: /Sage preview Sage/ }));
  expect(select).toHaveBeenCalledWith("sage-owl");
  expect(buy).not.toHaveBeenCalled();
  expect(screen.queryByRole("button", { name: "Buy Sage · 60" })).not.toBeInTheDocument();
});
