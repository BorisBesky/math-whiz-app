import React from "react";
import { CheckCircle, Coins, X } from "lucide-react";
import { STORE_BACKGROUND_COST } from "../constants/appConstants";

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
}) => {
  // Dynamically derive themes from storeItems, normalize to lowercase
  const uniqueThemes = [...new Set(storeItems.map((item) => item.theme?.toLowerCase()).filter(Boolean))];

  // Format theme names: capitalize first letter
  const formatThemeLabel = (theme) => {
    return theme.charAt(0).toUpperCase() + theme.slice(1);
  };

  const themes = uniqueThemes.map((theme) => ({
    key: theme,
    label: formatThemeLabel(theme),
  }));

  const filteredItems = storeItems.filter((it) => it.theme?.toLowerCase() === storeTheme);

  return (
    <div
      ref={storeContainerRef}
      className="w-full max-w-5xl mx-auto bg-white/80 backdrop-blur-md p-6 sm:p-8 rounded-card shadow-card border border-white/60 mt-16 relative animate-fade-in"
      data-tutorial-id="store-container"
    >
      <h2 className="text-3xl font-display font-bold text-gray-800 mb-1 text-center" data-tutorial-id="store-title">
        Rewards Store
      </h2>
      <p className="text-sm text-gray-500 mb-6 text-center" data-tutorial-id="store-description">
        Spend your coins on awesome backgrounds!
      </p>

      {/* Theme Tabs — pill style */}
      <div className="overflow-x-auto mb-6" data-tutorial-id="store-tabs">
        <div className="flex justify-center gap-2 min-w-max px-4">
          {themes.map((t) => (
            <button
              key={t.key}
              onClick={() => setStoreTheme(t.key)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 whitespace-nowrap active:scale-95 ${
                storeTheme === t.key
                  ? "bg-brand-purple text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {purchaseFeedback && (
        <div
          className={`p-3 rounded-button mb-6 text-center font-bold text-sm animate-slide-up ${
            purchaseFeedback.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {purchaseFeedback.message}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" data-tutorial-id="store-items">
        {filteredItems.length === 0 ? (
          <div className="col-span-full text-center text-gray-400 py-12 font-display">
            No items in this theme yet.
          </div>
        ) : (
          filteredItems.map((item) => {
            const isOwned = userData?.ownedBackgrounds?.includes(item.id) ?? false;
            const isActive = userData?.activeBackground === item.id;

            return (
              <div
                key={item.id}
                className="rounded-card border border-gray-100 bg-white p-3 flex flex-col items-center justify-between shadow-card hover:shadow-card-hover transition-all duration-300 group"
              >
                <div className="relative w-full mb-3 overflow-hidden rounded-xl">
                  <img
                    src={item.url}
                    alt={item.name}
                    loading="lazy"
                    onClick={(event) => handleStoreImageClick(item, event)}
                    className="w-full h-32 object-cover bg-gray-100 cursor-pointer group-hover:scale-105 transition-transform duration-300"
                  />
                  {isOwned && (
                    <span className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-green-500 text-white' : 'bg-white/90 text-gray-600'}`}>
                      {isActive ? 'Active' : 'Owned'}
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-sm mb-2 text-gray-700 text-center">{item.name}</h4>
                {isOwned ? (
                  <button
                    onClick={() => handleSetBackground(item.id)}
                    disabled={isActive}
                    className={`w-full font-bold text-sm py-2 px-3 rounded-button transition-all duration-200 active:scale-95 ${
                      isActive
                        ? "bg-green-100 text-green-600 cursor-default"
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
                    className="w-full bg-brand-purple text-white font-bold text-sm py-2 px-3 rounded-button hover:opacity-90 active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5"
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
      <div className="text-center mt-8">
        <button
          onClick={returnToTopics}
          className="bg-brand-blue text-white font-display font-bold py-2.5 px-8 rounded-button hover:opacity-90 active:scale-95 transition-all duration-200 shadow-sm"
        >
          Back to Topics
        </button>
      </div>

      {/* Image Preview Modal */}
      {popupImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4"
          onClick={handleClosePopupImage}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center">
            <button
              onClick={handleClosePopupImage}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
              aria-label="Close"
            >
              <X className="w-8 h-8" />
            </button>
            <img
              src={popupImage.url}
              alt={popupImage.name}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl bg-white"
            />
            <div className="mt-4 text-white text-center">
              <h3 className="text-xl font-bold">{popupImage.name}</h3>
              {popupImage.description && (
                <p className="text-gray-300 mt-1 max-w-2xl">{popupImage.description}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RewardsStore;
