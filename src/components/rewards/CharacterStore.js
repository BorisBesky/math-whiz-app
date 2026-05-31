import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle, Coins, Heart, Undo2 } from "lucide-react";
import CharacterViewer from "./CharacterViewer";
import { CharacterPortrait, ItemPreview } from "./RewardPreview";
import {
  ACCESSORY_CATEGORIES,
  CHARACTER_PRICE,
  DEFAULT_CHARACTER_ID,
  REWARD_ACCESSORIES,
  REWARD_CHARACTERS,
  getCharacterById,
} from "./rewardConfig";

const isCategoryAvailableForCharacter = (categoryId, characterId) =>
  characterId !== "leo-boy" || !["dress", "skirt"].includes(categoryId);

const CharacterStore = ({
  userData,
  purchaseFeedback,
  handleSelectCharacter,
  handlePurchaseCharacter,
  handlePurchaseAccessory,
  handleEquipAccessory,
  handleUnequipAccessory,
}) => {
  const selectedCharacterId = userData?.selectedCharacterId || DEFAULT_CHARACTER_ID;
  const selectedCharacter = getCharacterById(selectedCharacterId);
  const ownedCharacterIds = userData?.ownedCharacters || [DEFAULT_CHARACTER_ID];
  const ownedAccessoryIds = userData?.ownedAccessories || [];
  const equippedForCharacter =
    userData?.equippedAccessories?.[selectedCharacterId] || {};
  const [activeCategory, setActiveCategory] = useState(ACCESSORY_CATEGORIES[0].id);
  const [previewItem, setPreviewItem] = useState(null);

  const availableCategories = useMemo(
    () =>
      ACCESSORY_CATEGORIES.filter(
        (category) =>
          isCategoryAvailableForCharacter(category.id, selectedCharacterId) &&
          REWARD_ACCESSORIES.some(
            (item) =>
              item.category === category.id &&
              item.characterIds.includes(selectedCharacterId)
          )
      ),
    [selectedCharacterId]
  );

  const visibleItems = useMemo(
    () =>
      REWARD_ACCESSORIES.filter(
        (item) =>
          isCategoryAvailableForCharacter(item.category, selectedCharacterId) &&
          item.category === activeCategory &&
          item.characterIds.includes(selectedCharacterId)
      ),
    [activeCategory, selectedCharacterId]
  );

  const activeCategoryLabel =
    ACCESSORY_CATEGORIES.find((category) => category.id === activeCategory)?.label ||
    "Accessories";
  const previewEquippedItems = previewItem
    ? { ...equippedForCharacter, [previewItem.category]: previewItem.id }
    : equippedForCharacter;

  useEffect(() => {
    setPreviewItem(null);
  }, [activeCategory, selectedCharacterId]);

  useEffect(() => {
    if (
      availableCategories.length > 0 &&
      !availableCategories.some((category) => category.id === activeCategory)
    ) {
      setActiveCategory(availableCategories[0].id);
    }
  }, [activeCategory, availableCategories]);

  return (
    <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(280px,0.9fr)_minmax(0,1.1fr)]">
      <section className="min-w-0 rounded-lg border border-sky-100 bg-white p-4 shadow-card">
        {/* Compact character picker row at the top */}
        <div className="-mx-1 mb-3 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1">
          {REWARD_CHARACTERS.map((character) => {
            const isOwned = ownedCharacterIds.includes(character.id);
            const isSelected = character.id === selectedCharacterId;
            return (
              <button
                key={character.id}
                type="button"
                onClick={() =>
                  isOwned
                    ? handleSelectCharacter(character.id)
                    : handlePurchaseCharacter(character)
                }
                aria-pressed={isSelected}
                className={`relative w-[4.5rem] shrink-0 snap-start rounded-lg border px-1 py-1.5 text-center transition active:scale-95 ${
                  isSelected
                    ? "border-brand-blue bg-blue-50 text-blue-700 shadow-sm"
                    : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200 hover:bg-white"
                }`}
              >
                <CharacterPortrait characterId={character.id} />
                <span className="block truncate text-xs font-bold leading-tight">
                  {character.name}
                </span>
                {isSelected && (
                  <span className="absolute right-0.5 top-0.5 text-brand-blue">
                    <CheckCircle size={14} />
                  </span>
                )}
                {!isOwned && (
                  <span className="absolute left-0.5 top-0.5 inline-flex items-center gap-0.5 rounded-full bg-brand-purple px-1 py-0.5 text-[10px] font-bold leading-none text-white">
                    <Coins size={9} />
                    {CHARACTER_PRICE}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Character stage with name + title overlaid on the background */}
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-sky-50 via-white to-emerald-50">
          <CharacterViewer
            characterId={selectedCharacterId}
            equippedItems={previewEquippedItems}
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/45 via-black/20 to-transparent px-4 pb-3 pt-10">
            <h3 className="font-display text-2xl font-bold leading-tight text-white drop-shadow">
              {selectedCharacter.name}
            </h3>
            <p className="text-sm font-bold text-white/85 drop-shadow">
              {selectedCharacter.title}
            </p>
          </div>
        </div>
      </section>

      <section className="min-w-0 rounded-lg border border-gray-100 bg-white p-4 shadow-card">
        {purchaseFeedback && (
          <div
            className={`mb-4 rounded-lg border p-3 text-center text-sm font-bold animate-slide-up ${
              purchaseFeedback.type === "success"
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {purchaseFeedback.message}
          </div>
        )}

        <div className="mb-4 overflow-x-auto">
          <div className="flex min-w-max gap-2">
            {availableCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.id)}
                className={`rounded-lg px-3 py-2 text-sm font-bold transition active:scale-95 ${
                  activeCategory === category.id
                    ? "bg-brand-blue text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2">
          {visibleItems.length === 0 ? (
            <div className="w-full rounded-lg border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm font-bold text-gray-400">
              No {activeCategoryLabel.toLowerCase()} for {selectedCharacter.name} yet.
            </div>
          ) : visibleItems.map((item) => {
            const isOwned = ownedAccessoryIds.includes(item.id);
            const isEquipped = equippedForCharacter[item.category] === item.id;
            const isPreviewing = previewItem?.id === item.id;

            return (
              <article
                key={item.id}
                onMouseEnter={() => setPreviewItem(item)}
                onPointerDown={() => setPreviewItem(item)}
                onFocus={() => setPreviewItem(item)}
                onClick={() => setPreviewItem(item)}
                className={`flex min-h-[244px] w-56 shrink-0 snap-start flex-col rounded-lg border bg-gray-50 p-3 transition ${
                  isPreviewing
                    ? "border-brand-blue ring-2 ring-blue-100"
                    : "border-gray-100"
                }`}
                tabIndex={0}
              >
                <div className="mb-3 overflow-hidden rounded-lg border border-white bg-white shadow-sm">
                  <ItemPreview item={item} />
                </div>
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-gray-800">{item.name}</h4>
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                      {activeCategoryLabel}
                    </p>
                  </div>
                  <span className="flex h-9 w-9 shrink-0 overflow-hidden rounded-lg border-2 border-white shadow-sm">
                    <span className="h-full flex-1" style={{ backgroundColor: item.color }} />
                    <span className="h-full flex-1" style={{ backgroundColor: item.accentColor }} />
                  </span>
                </div>
                <div className="mt-auto flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 text-sm font-bold text-amber-600">
                    <Coins size={16} /> {item.price}
                  </span>
                  {isOwned ? (
                    <button
                      type="button"
                      onClick={() => handleEquipAccessory(item)}
                      disabled={isEquipped}
                      className={`inline-flex min-w-[104px] items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold transition active:scale-95 ${
                        isEquipped
                          ? "cursor-default bg-green-100 text-green-700"
                          : "bg-brand-mint text-white hover:opacity-90"
                      }`}
                    >
                      {isEquipped ? (
                        <>
                          <CheckCircle size={16} /> Equipped
                        </>
                      ) : (
                        <>
                          <Heart size={16} /> Equip
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handlePurchaseAccessory(item)}
                      className="inline-flex min-w-[104px] items-center justify-center gap-1.5 rounded-lg bg-brand-purple px-3 py-2 text-sm font-bold text-white transition hover:opacity-90 active:scale-95"
                    >
                      <Coins size={16} /> Buy
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-2xl font-bold text-gray-800">
              Character Shop
            </h3>
            <p className="text-sm text-gray-500">
              Buy and equip accessories for {selectedCharacter.name}.
            </p>
          </div>
          {equippedForCharacter[activeCategory] && (
            <button
              type="button"
              onClick={() => {
                setPreviewItem(null);
                handleUnequipAccessory(activeCategory);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-600 transition hover:bg-gray-50 active:scale-95"
            >
              <Undo2 size={16} /> Clear {activeCategoryLabel}
            </button>
          )}
        </div>
      </section>
    </div>
  );
};

export default CharacterStore;
