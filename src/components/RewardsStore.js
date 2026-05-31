import React, { useState } from "react";
import { CheckCircle, Coins, Image, Store, X } from "lucide-react";
import { STORE_BACKGROUND_COST } from "../constants/appConstants";
import CharacterStore from "./rewards/CharacterStore";

const BackgroundStore = ({
  storeItems,
  storeTheme,
  setStoreTheme,
  purchaseFeedback,
  userData,
  handlePurchase,
  handleSetBackground,
  handleStoreImageClick,
}) => {
  const uniqueThemes = [
    ...new Set(storeItems.map((item) => item.theme?.toLowerCase()).filter(Boolean)),
  ];

  const themes = uniqueThemes.map((theme) => ({
    key: theme,
    label: theme.charAt(0).toUpperCase() + theme.slice(1),
  }));

  const filteredItems = storeItems.filter(
    (it) => it.theme?.toLowerCase() === storeTheme
  );

  return (
    <>
      <div className="mb-6 overflow-x-auto" data-tutorial-id="store-tabs">
        <div className="flex min-w-max justify-center gap-2 px-4">
          {themes.map((theme) => (
            <button
              key={theme.key}
              onClick={() => setStoreTheme(theme.key)}
              className={`rounded-lg px-4 py-2 text-sm font-bold transition-all duration-200 active:scale-95 ${
                storeTheme === theme.key
                  ? "bg-brand-purple text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {theme.label}
            </button>
          ))}
        </div>
      </div>

      {purchaseFeedback && (
        <div
          className={`mb-6 rounded-lg border p-3 text-center text-sm font-bold animate-slide-up ${
            purchaseFeedback.type === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {purchaseFeedback.message}
        </div>
      )}

      <div
        className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
        data-tutorial-id="store-items"
      >
        {filteredItems.length === 0 ? (
          <div className="col-span-full py-12 text-center font-display text-gray-400">
            No items in this theme yet.
          </div>
        ) : (
          filteredItems.map((item) => {
            const isOwned = userData?.ownedBackgrounds?.includes(item.id) ?? false;
            const isActive = userData?.activeBackground === item.id;

            return (
              <div
                key={item.id}
                className="group flex flex-col items-center justify-between rounded-lg border border-gray-100 bg-white p-3 shadow-card transition-all duration-300 hover:shadow-card-hover"
              >
                <div className="relative mb-3 w-full overflow-hidden rounded-lg">
                  <img
                    src={item.url}
                    alt={item.name}
                    loading="lazy"
                    onClick={(event) => handleStoreImageClick(item, event)}
                    className="h-32 w-full cursor-pointer bg-gray-100 object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {isOwned && (
                    <span
                      className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        isActive
                          ? "bg-green-500 text-white"
                          : "bg-white/90 text-gray-600"
                      }`}
                    >
                      {isActive ? "Active" : "Owned"}
                    </span>
                  )}
                </div>
                <h4 className="mb-2 text-center text-sm font-bold text-gray-700">
                  {item.name}
                </h4>
                {isOwned ? (
                  <button
                    onClick={() => handleSetBackground(item.id)}
                    disabled={isActive}
                    className={`w-full rounded-lg px-3 py-2 text-sm font-bold transition-all duration-200 active:scale-95 ${
                      isActive
                        ? "cursor-default bg-green-100 text-green-600"
                        : "bg-gray-100 text-gray-700 hover:bg-brand-blue hover:text-white"
                    }`}
                  >
                    {isActive ? (
                      <span className="flex items-center justify-center gap-1.5">
                        <CheckCircle size={16} /> Active
                      </span>
                    ) : (
                      "Set Active"
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => handlePurchase(item)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-purple px-3 py-2 text-sm font-bold text-white transition-all duration-200 hover:opacity-90 active:scale-95"
                    data-tutorial-id="store-buy-button"
                  >
                    <Coins size={14} /> {STORE_BACKGROUND_COST}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </>
  );
};

const RewardsStore = ({
  storeItems,
  storeTheme,
  setStoreTheme,
  purchaseFeedback,
  userData,
  storeContainerRef,
  handlePurchase,
  handleSetBackground,
  handleStoreImageClick,
  handleClosePopupImage,
  popupImage,
  returnToTopics,
  handleSelectCharacter,
  handlePurchaseCharacter,
  handlePurchaseAccessory,
  handleEquipAccessory,
  handleUnequipAccessory,
}) => {
  const [storeMode, setStoreMode] = useState("characters");

  return (
    <div
      ref={storeContainerRef}
      className="relative mx-auto mt-16 w-full max-w-6xl animate-fade-in rounded-card border border-white/60 bg-white/85 p-4 shadow-card backdrop-blur-md sm:p-6"
      data-tutorial-id="store-container"
    >
      <div className="mb-5 flex flex-col gap-4 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
        <div>
          <h2
            className="font-display text-3xl font-bold text-gray-800"
            data-tutorial-id="store-title"
          >
            Rewards Store
          </h2>
          <p
            className="text-sm text-gray-500"
            data-tutorial-id="store-description"
          >
            Spend coins on characters, accessories, and backgrounds.
          </p>
        </div>

        <div className="inline-flex justify-center rounded-lg bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setStoreMode("characters")}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition active:scale-95 ${
              storeMode === "characters"
                ? "bg-white text-brand-blue shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Store size={16} /> Characters
          </button>
          <button
            type="button"
            onClick={() => setStoreMode("backgrounds")}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition active:scale-95 ${
              storeMode === "backgrounds"
                ? "bg-white text-brand-purple shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Image size={16} /> Backgrounds
          </button>
        </div>
      </div>

      {storeMode === "characters" ? (
        <CharacterStore
          userData={userData}
          purchaseFeedback={purchaseFeedback}
          handleSelectCharacter={handleSelectCharacter}
          handlePurchaseCharacter={handlePurchaseCharacter}
          handlePurchaseAccessory={handlePurchaseAccessory}
          handleEquipAccessory={handleEquipAccessory}
          handleUnequipAccessory={handleUnequipAccessory}
        />
      ) : (
        <BackgroundStore
          storeItems={storeItems}
          storeTheme={storeTheme}
          setStoreTheme={setStoreTheme}
          purchaseFeedback={purchaseFeedback}
          userData={userData}
          handlePurchase={handlePurchase}
          handleSetBackground={handleSetBackground}
          handleStoreImageClick={handleStoreImageClick}
        />
      )}

      <div className="mt-8 text-center">
        <button
          onClick={returnToTopics}
          className="rounded-lg bg-brand-blue px-8 py-2.5 font-display font-bold text-white shadow-sm transition-all duration-200 hover:opacity-90 active:scale-95"
        >
          Back to Topics
        </button>
      </div>

      {popupImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4"
          onClick={handleClosePopupImage}
        >
          <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col items-center">
            <button
              onClick={handleClosePopupImage}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
              aria-label="Close"
            >
              <X className="h-8 w-8" />
            </button>
            <img
              src={popupImage.url}
              alt={popupImage.name}
              className="max-h-[85vh] max-w-full rounded-lg bg-white object-contain shadow-2xl"
            />
            <div className="mt-4 text-center text-white">
              <h3 className="text-xl font-bold">{popupImage.name}</h3>
              {popupImage.description && (
                <p className="mt-1 max-w-2xl text-gray-300">
                  {popupImage.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RewardsStore;
