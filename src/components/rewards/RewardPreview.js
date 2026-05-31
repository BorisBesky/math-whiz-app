import React from "react";
import { getCharacterById } from "./rewardConfig";

const ItemPreview = ({ item }) => {
  const color = item?.color || "#7c3aed";
  const accent = item?.accentColor || "#f6c844";

  return (
    <svg
      viewBox="0 0 120 88"
      className="h-full w-full"
      role="img"
      aria-label={`${item.name} preview`}
    >
      <defs>
        <linearGradient id={`bg-${item.id}`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#eff6ff" />
          <stop offset="100%" stopColor="#ecfdf5" />
        </linearGradient>
      </defs>
      <rect width="120" height="88" rx="10" fill={`url(#bg-${item.id})`} />
      <ellipse cx="60" cy="75" rx="32" ry="6" fill="#c7d2fe" opacity="0.55" />
      {renderShape(item.shape, color, accent)}
    </svg>
  );
};

const CharacterPortrait = ({ characterId }) => {
  const character = getCharacterById(characterId);
  const color = character.accent;

  return (
    <svg
      viewBox="0 0 64 64"
      className="mx-auto mb-2 h-12 w-12"
      role="img"
      aria-label={`${character.name} preview`}
    >
      <circle cx="32" cy="32" r="30" fill="#f8fafc" />
      {renderCharacter(character.id, color)}
    </svg>
  );
};

const renderShape = (shape, color, accent) => {
  switch (shape) {
    case "cap":
      return (
        <>
          <path d="M36 40c4-15 42-15 46 0v8H36z" fill={color} />
          <path d="M56 48h35c5 0 8 4 4 7H56z" fill={accent} />
        </>
      );
    case "wizardHat":
      return (
        <>
          <path d="M60 14 39 62h42z" fill={color} />
          <path d="M37 62h46v9H37z" fill={accent} />
          <circle cx="61" cy="25" r="4" fill={accent} />
          <circle cx="54" cy="42" r="3" fill={accent} />
        </>
      );
    case "crown":
      return (
        <>
          <path d="M35 58V30l15 15 11-22 11 22 15-15v28z" fill={color} />
          <rect x="35" y="58" width="52" height="9" rx="3" fill={accent} />
        </>
      );
    case "antenna":
      return (
        <>
          <rect x="57" y="24" width="6" height="36" rx="3" fill={color} />
          <circle cx="60" cy="19" r="10" fill={accent} />
          <circle cx="60" cy="19" r="4" fill="#fff" opacity="0.8" />
        </>
      );
    case "roundGlasses":
      return (
        <>
          <circle cx="45" cy="43" r="13" fill="none" stroke={color} strokeWidth="5" />
          <circle cx="75" cy="43" r="13" fill="none" stroke={color} strokeWidth="5" />
          <path d="M58 43h5" stroke={accent} strokeWidth="5" strokeLinecap="round" />
        </>
      );
    case "starGlasses":
      return (
        <>
          <path d="m43 25 5 11 12 2-9 8 2 12-10-6-10 6 2-12-9-8 12-2z" fill={color} />
          <path d="m77 25 5 11 12 2-9 8 2 12-10-6-10 6 2-12-9-8 12-2z" fill={accent} />
          <path d="M55 43h10" stroke="#334155" strokeWidth="4" strokeLinecap="round" />
        </>
      );
    case "goggles":
      return (
        <>
          <rect x="30" y="34" width="60" height="22" rx="9" fill={color} />
          <rect x="37" y="38" width="18" height="14" rx="5" fill={accent} />
          <rect x="65" y="38" width="18" height="14" rx="5" fill={accent} />
        </>
      );
    case "scarf":
      return (
        <>
          <path d="M32 39c9 12 48 12 56 0l5 11c-13 14-54 14-66 0z" fill={color} />
          <path d="M68 50h14v27H68z" fill={accent} />
          <path d="M76 50h12v22H76z" fill={color} opacity="0.75" />
        </>
      );
    case "bowTie":
      return (
        <>
          <path d="M58 44 28 27v34zM62 44l30-17v34z" fill={color} />
          <circle cx="60" cy="44" r="8" fill={accent} />
        </>
      );
    case "medal":
      return (
        <>
          <path d="M43 18 60 47 77 18" fill="none" stroke={accent} strokeWidth="7" strokeLinecap="round" />
          <circle cx="60" cy="56" r="16" fill={color} />
          <path d="m60 47 3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1z" fill="#fff7ed" />
        </>
      );
    case "cape":
      return (
        <>
          <path d="M39 24h42l11 52H28z" fill={color} />
          <path d="M42 24h36v8H42z" fill={accent} />
        </>
      );
    case "jetpack":
      return (
        <>
          <rect x="38" y="22" width="18" height="42" rx="5" fill={color} />
          <rect x="64" y="22" width="18" height="42" rx="5" fill={color} />
          <path d="M42 64h10l-5 13zM68 64h10l-5 13z" fill={accent} />
        </>
      );
    case "backpack":
      return (
        <>
          <rect x="41" y="22" width="38" height="48" rx="10" fill={color} />
          <rect x="48" y="40" width="24" height="18" rx="5" fill={accent} />
          <path d="M42 35c-13 7-13 23 0 28M78 35c13 7 13 23 0 28" fill="none" stroke="#475569" strokeWidth="4" />
        </>
      );
    case "sneakers":
      return (
        <>
          <path d="M25 56h30c4 0 7 5 4 9H26c-6 0-7-6-1-9z" fill={color} />
          <path d="M63 56h30c4 0 7 5 4 9H64c-6 0-7-6-1-9z" fill={color} />
          <path d="M34 56h12M72 56h12" stroke={accent} strokeWidth="4" strokeLinecap="round" />
        </>
      );
    case "skates":
      return (
        <>
          <path d="M28 48h28v15H27c-6 0-5-15 1-15zM65 48h28v15H64c-6 0-5-15 1-15z" fill={color} />
          <path d="M26 68h32M63 68h32" stroke={accent} strokeWidth="4" strokeLinecap="round" />
        </>
      );
    case "boots":
      return (
        <>
          <path d="M31 35h22v29H27c-5 0-5-9 0-9h4zM68 35h22v29H64c-5 0-5-9 0-9h4z" fill={color} />
          <path d="M34 42h16M71 42h16" stroke={accent} strokeWidth="4" strokeLinecap="round" />
        </>
      );
    case "wand":
      return (
        <>
          <path d="M39 65 79 25" stroke={color} strokeWidth="7" strokeLinecap="round" />
          <path d="m83 13 5 11 12 1-9 8 3 12-11-6-10 6 3-12-9-8 12-1z" fill={accent} />
        </>
      );
    case "book":
      return (
        <>
          <path d="M32 23h27c6 0 10 4 10 10v34H42c-6 0-10-4-10-10z" fill={color} />
          <path d="M61 23h27v44H61z" fill={accent} />
          <path d="M45 36h12M45 47h12M69 36h12M69 47h12" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
        </>
      );
    case "partyDress":
    case "rainbowDress":
      return (
        <>
          <path d="M47 18h26l20 57H27z" fill={color} />
          <path d="M43 33h34" stroke={accent} strokeWidth="7" strokeLinecap="round" />
          <circle cx="46" cy="68" r="4" fill={accent} />
          <circle cx="60" cy="70" r="4" fill={accent} />
          <circle cx="74" cy="68" r="4" fill={accent} />
        </>
      );
    case "twirlSkirt":
    case "sportSkirt":
      return (
        <>
          <path d="M40 35h40l12 34H28z" fill={color} />
          <path d="M41 35h38v8H41z" fill={accent} />
          <path d="M49 43 42 69M60 43v26M71 43l7 26" stroke="#fff" strokeWidth="3" opacity="0.55" />
        </>
      );
    case "comfyShorts":
    case "sportShorts":
      return (
        <>
          <path d="M36 33h48v34H65l-5-17-5 17H36z" fill={color} />
          <path d="M38 33h44v8H38z" fill={accent} />
          <path d="M60 43v22" stroke="#fff" strokeWidth="4" opacity="0.65" />
        </>
      );
    case "heartNecklace":
      return (
        <>
          <path d="M40 26c5 30 35 30 40 0" fill="none" stroke={accent} strokeWidth="5" strokeLinecap="round" />
          <path d="M60 56c-13-8-18-15-14-22 3-5 10-5 14 1 4-6 11-6 14-1 4 7-1 14-14 22z" fill={color} />
        </>
      );
    case "friendshipBracelet":
      return (
        <>
          <ellipse cx="60" cy="47" rx="29" ry="18" fill="none" stroke={color} strokeWidth="7" />
          {[39, 50, 61, 72, 83].map((x) => (
            <circle key={x} cx={x} cy="36" r="4" fill={accent} />
          ))}
        </>
      );
    case "sparkleRing":
      return (
        <>
          <circle cx="60" cy="52" r="20" fill="none" stroke={color} strokeWidth="7" />
          <path d="m60 19 6 10 11 2-8 8 2 11-11-5-10 5 1-11-8-8 11-2z" fill={accent} />
        </>
      );
    default:
      return <circle cx="60" cy="44" r="24" fill={color} />;
  }
};

const renderCharacter = (characterId, color) => {
  if (characterId === "milo-robot") {
    return (
      <>
        <rect x="19" y="25" width="26" height="25" rx="6" fill="#9ca3af" />
        <circle cx="32" cy="19" r="12" fill="#9ca3af" />
        <rect x="24" y="17" width="16" height="6" rx="2" fill="#0f172a" />
        <circle cx="28" cy="20" r="2" fill={color} />
        <circle cx="36" cy="20" r="2" fill={color} />
      </>
    );
  }
  if (characterId === "pip-penguin") {
    return (
      <>
        <ellipse cx="32" cy="36" rx="17" ry="22" fill="#334155" />
        <circle cx="32" cy="20" r="13" fill="#334155" />
        <ellipse cx="32" cy="38" rx="10" ry="16" fill="#f8fafc" />
        <circle cx="28" cy="19" r="2" fill="#111827" />
        <circle cx="36" cy="19" r="2" fill="#111827" />
        <path d="M32 22 26 27h12z" fill="#fb923c" />
      </>
    );
  }
  if (characterId === "cora-cat") {
    return (
      <>
        <circle cx="32" cy="33" r="18" fill={color} />
        <path d="M17 20 22 6l11 12M47 20 42 6 31 18" fill={color} />
        <circle cx="26" cy="31" r="2.5" fill="#111827" />
        <circle cx="38" cy="31" r="2.5" fill="#111827" />
        <path d="M32 35 28 39h8z" fill="#f9a8d4" />
      </>
    );
  }
  if (characterId === "sunny-bird") {
    return (
      <>
        <ellipse cx="32" cy="36" rx="18" ry="20" fill={color} />
        <circle cx="32" cy="20" r="14" fill={color} />
        <path d="M32 22 22 29h20z" fill="#fb923c" />
        <circle cx="27" cy="18" r="2" fill="#111827" />
        <circle cx="37" cy="18" r="2" fill="#111827" />
      </>
    );
  }
  if (characterId === "leo-boy" || characterId === "mia-girl") {
    const hair = characterId === "leo-boy" ? "#7c2d12" : "#4a044e";
    return (
      <>
        <rect x="22" y="32" width="20" height="22" rx="6" fill={color} />
        <circle cx="32" cy="20" r="13" fill="#f2c7a0" />
        <path d="M20 19c1-12 23-17 26 1-8-4-15-2-26-1z" fill={hair} />
        <circle cx="27" cy="21" r="2" fill="#111827" />
        <circle cx="37" cy="21" r="2" fill="#111827" />
      </>
    );
  }
  return (
    <>
      <ellipse cx="32" cy="38" rx="18" ry="21" fill={color} />
      <circle cx="32" cy="22" r="14" fill={color} />
      <circle cx="27" cy="21" r="2" fill="#111827" />
      <circle cx="37" cy="21" r="2" fill="#111827" />
    </>
  );
};

export { CharacterPortrait, ItemPreview };
