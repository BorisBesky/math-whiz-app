export const DEFAULT_CHARACTER_ID = "buddy-bear";
export const CHARACTER_PRICE = 60;

export const REWARD_CHARACTERS = [
  {
    id: "buddy-bear",
    name: "Buddy",
    title: "Toy Bear",
    accent: "#b98252",
    summary: "A cozy bear who looks great in hats, capes, and adventure gear.",
  },
  {
    id: "milo-robot",
    name: "Milo",
    title: "Round Robot",
    accent: "#38bdf8",
    summary: "A cheerful robot with bright gadgets, badges, and headphones.",
  },
  {
    id: "pip-penguin",
    name: "Pip",
    title: "Penguin Pal",
    accent: "#334155",
    summary: "A tiny penguin friend ready for goggles, scarves, and skates.",
  },
  {
    id: "cora-cat",
    name: "Cora",
    title: "Toy Cat",
    accent: "#f59e0b",
    summary: "A curious cat with dress-up options for cozy and fancy looks.",
  },
  {
    id: "sunny-bird",
    name: "Sunny",
    title: "Yellow Bird",
    accent: "#facc15",
    summary: "A bright bird who loves little hats, charms, and colorful outfits.",
  },
  {
    id: "leo-boy",
    name: "Leo",
    title: "Boy Hero",
    accent: "#2563eb",
    summary: "A friendly kid avatar for shorts, jewelry, and adventure gear.",
  },
  {
    id: "mia-girl",
    name: "Mia",
    title: "Girl Hero",
    accent: "#ec4899",
    summary: "A cheerful kid avatar for dresses, skirts, jewelry, and props.",
  },
  {
    id: "max-boy",
    name: "Max",
    title: "Explorer Boy",
    accent: "#3b82f6",
    summary: "A detailed 3D explorer ready for adventure.",
    model: "/models/boy.glb",
  },
  {
    id: "ava-girl",
    name: "Ava",
    title: "Explorer Girl",
    accent: "#db2777",
    summary: "A detailed 3D explorer with a bright smile.",
    model: "/models/girl.glb",
  },
  {
    id: "rover-dog",
    name: "Rover",
    title: "Happy Dog",
    accent: "#d97706",
    summary: "A playful 3D pup who loves to tag along.",
    model: "/models/dog.glb",
  },
  {
    id: "ollie-owl",
    name: "Ollie",
    title: "Wise Owl",
    accent: "#8b5cf6",
    summary: "A wise little 3D owl with big curious eyes.",
    model: "/models/owl.glb",
  },
  {
    id: "frost-penguin",
    name: "Frost",
    title: "Snow Penguin",
    accent: "#0ea5e9",
    summary: "A cool 3D penguin straight from the snow.",
    model: "/models/pinguin.glb",
  },
];

// Characters whose look is hand-built from primitives (and therefore support
// the dress-up accessories). GLB model characters are buy-only for now.
export const PROCEDURAL_CHARACTER_IDS = REWARD_CHARACTERS.filter(
  (character) => !character.model
).map((character) => character.id);

export const isModelCharacter = (characterId) =>
  Boolean(getCharacterById(characterId)?.model);

export const ACCESSORY_CATEGORIES = [
  { id: "hat", label: "Hats" },
  { id: "eyewear", label: "Glasses" },
  { id: "dress", label: "Dresses" },
  { id: "skirt", label: "Skirts" },
  { id: "shorts", label: "Shorts" },
  { id: "jewelry", label: "Jewelry" },
  { id: "neckwear", label: "Neckwear" },
  { id: "back", label: "Back Gear" },
  { id: "feet", label: "Shoes" },
  { id: "prop", label: "Props" },
];

// Categories that cannot be worn at the same time. Equipping one clears the
// others (e.g. a skirt and shorts can't be worn together; a dress already
// includes a skirt so it excludes both lower garments).
export const CATEGORY_CONFLICTS = {
  dress: ["skirt", "shorts"],
  skirt: ["shorts", "dress"],
  shorts: ["skirt", "dress"],
};

export const getConflictingCategories = (category) =>
  CATEGORY_CONFLICTS[category] || [];

// Nine-color palette offered by the character color picker.
export const COLOR_SWATCHES = [
  "#ef4444", // red
  "#fb923c", // orange
  "#f6c844", // yellow
  "#48d1a5", // green
  "#38bdf8", // sky
  "#2563eb", // blue
  "#7c3aed", // purple
  "#ec4899", // pink
  "#9ca3af", // gray
  "#f2c7a0", // skin
  "#92400e", // brown
  "#111827", // black
  "#ffffff", // white
];

// Recolorable surface regions per character. Each region id maps to one or
// more materials in CharacterViewer's builders; `default` is the base color.
export const CHARACTER_COLOR_REGIONS = {
  "buddy-bear": [
    { id: "body", label: "Fur", default: "#b98252" },
    { id: "muzzle", label: "Muzzle", default: "#f5d0a9" },
    { id: "nose", label: "Nose", default: "#111827" },
  ],
  "milo-robot": [
    { id: "body", label: "Body", default: "#9ca3af" },
    { id: "trim", label: "Trim", default: "#38bdf8" },
  ],
  "pip-penguin": [
    { id: "body", label: "Body", default: "#334155" },
    { id: "belly", label: "Belly", default: "#f8fafc" },
    { id: "beak", label: "Beak & Feet", default: "#fb923c" },
  ],
  "cora-cat": [
    { id: "body", label: "Fur", default: "#f59e0b" },
    { id: "muzzle", label: "Muzzle", default: "#fed7aa" },
    { id: "ears", label: "Inner Ears", default: "#f9a8d4" },
    { id: "nose", label: "Nose", default: "#f472b6" },
  ],
  "sunny-bird": [
    { id: "body", label: "Feathers", default: "#facc15" },
    { id: "wings", label: "Wings", default: "#f59e0b" },
    { id: "beak", label: "Beak & Feet", default: "#fb923c" },
  ],
  "leo-boy": [
    { id: "skin", label: "Skin", default: "#f2c7a0" },
    { id: "hair", label: "Hair", default: "#7c2d12" },
    { id: "shirt", label: "Shirt", default: "#2563eb" },
    { id: "pants", label: "Pants", default: "#0f766e" },
  ],
  "mia-girl": [
    { id: "skin", label: "Skin", default: "#f2c7a0" },
    { id: "hair", label: "Hair", default: "#4a044e" },
    { id: "shirt", label: "Shirt", default: "#ec4899" },
    { id: "pants", label: "Pants", default: "#7c3aed" },
  ],
};

export const getColorRegions = (characterId) =>
  CHARACTER_COLOR_REGIONS[characterId] || [];

const ALL_CHARACTER_IDS = PROCEDURAL_CHARACTER_IDS;
const SOFT_CHARACTER_IDS = ALL_CHARACTER_IDS.filter((id) => id !== "milo-robot");
const OUTFIT_CHARACTER_IDS = SOFT_CHARACTER_IDS;
const DRESS_SKIRT_CHARACTER_IDS = ["cora-cat", "sunny-bird", "mia-girl"];
const KID_CHARACTER_IDS = ["leo-boy", "mia-girl"];

export const REWARD_ACCESSORIES = [
  {
    id: "sunny-red-cap",
    name: "Red Cap",
    category: "hat",
    price: 10,
    color: "#ef4444",
    accentColor: "#f97316",
    shape: "cap",
    characterIds: SOFT_CHARACTER_IDS,
  },
  {
    id: "star-wizard-hat",
    name: "Star Hat",
    category: "hat",
    price: 10,
    color: "#7c3aed",
    accentColor: "#f6c844",
    shape: "wizardHat",
    characterIds: ALL_CHARACTER_IDS,
  },
  {
    id: "gold-crown",
    name: "Gold Crown",
    category: "hat",
    price: 10,
    color: "#f6c844",
    accentColor: "#fb923c",
    shape: "crown",
    characterIds: ALL_CHARACTER_IDS,
  },
  {
    id: "robot-antenna",
    name: "Spark Antenna",
    category: "hat",
    price: 10,
    color: "#22c55e",
    accentColor: "#38bdf8",
    shape: "antenna",
    characterIds: ["milo-robot"],
  },
  {
    id: "round-sky-glasses",
    name: "Sky Glasses",
    category: "eyewear",
    price: 10,
    color: "#2563eb",
    accentColor: "#dbeafe",
    shape: "roundGlasses",
    characterIds: ALL_CHARACTER_IDS,
  },
  {
    id: "star-spark-glasses",
    name: "Star Specs",
    category: "eyewear",
    price: 10,
    color: "#ec4899",
    accentColor: "#fef08a",
    shape: "starGlasses",
    characterIds: SOFT_CHARACTER_IDS,
  },
  {
    id: "snow-goggles",
    name: "Snow Goggles",
    category: "eyewear",
    price: 10,
    color: "#0f766e",
    accentColor: "#a7f3d0",
    shape: "goggles",
    characterIds: ["milo-robot", "pip-penguin", "sunny-bird", ...KID_CHARACTER_IDS],
  },
  {
    id: "party-dress",
    name: "Party Dress",
    category: "dress",
    price: 10,
    color: "#ec4899",
    accentColor: "#f6c844",
    shape: "partyDress",
    characterIds: DRESS_SKIRT_CHARACTER_IDS,
  },
  {
    id: "rainbow-dress",
    name: "Rainbow Dress",
    category: "dress",
    price: 10,
    color: "#7c3aed",
    accentColor: "#48d1a5",
    shape: "rainbowDress",
    characterIds: DRESS_SKIRT_CHARACTER_IDS,
  },
  {
    id: "twirl-skirt",
    name: "Twirl Skirt",
    category: "skirt",
    price: 10,
    color: "#38bdf8",
    accentColor: "#f6c844",
    shape: "twirlSkirt",
    characterIds: DRESS_SKIRT_CHARACTER_IDS,
  },
  {
    id: "sport-skirt",
    name: "Sport Skirt",
    category: "skirt",
    price: 10,
    color: "#22c55e",
    accentColor: "#ffffff",
    shape: "sportSkirt",
    characterIds: DRESS_SKIRT_CHARACTER_IDS,
  },
  {
    id: "comfy-shorts",
    name: "Comfy Shorts",
    category: "shorts",
    price: 10,
    color: "#2563eb",
    accentColor: "#93c5fd",
    shape: "comfyShorts",
    characterIds: OUTFIT_CHARACTER_IDS,
  },
  {
    id: "sport-shorts",
    name: "Sport Shorts",
    category: "shorts",
    price: 10,
    color: "#fb923c",
    accentColor: "#fef3c7",
    shape: "sportShorts",
    characterIds: OUTFIT_CHARACTER_IDS,
  },
  {
    id: "heart-necklace",
    name: "Heart Necklace",
    category: "jewelry",
    price: 10,
    color: "#ec4899",
    accentColor: "#f6c844",
    shape: "heartNecklace",
    characterIds: SOFT_CHARACTER_IDS,
  },
  {
    id: "friendship-bracelet",
    name: "Friendship Bracelet",
    category: "jewelry",
    price: 10,
    color: "#7c3aed",
    accentColor: "#48d1a5",
    shape: "friendshipBracelet",
    characterIds: ALL_CHARACTER_IDS,
  },
  {
    id: "sparkle-ring",
    name: "Sparkle Ring",
    category: "jewelry",
    price: 10,
    color: "#38bdf8",
    accentColor: "#f6c844",
    shape: "sparkleRing",
    characterIds: [...SOFT_CHARACTER_IDS, "milo-robot"],
  },
  {
    id: "rainbow-scarf",
    name: "Rainbow Scarf",
    category: "neckwear",
    price: 10,
    color: "#f56565",
    accentColor: "#48d1a5",
    shape: "scarf",
    characterIds: SOFT_CHARACTER_IDS,
  },
  {
    id: "bright-bow-tie",
    name: "Bow Tie",
    category: "neckwear",
    price: 10,
    color: "#ec4899",
    accentColor: "#fdf2f8",
    shape: "bowTie",
    characterIds: ALL_CHARACTER_IDS,
  },
  {
    id: "math-medal",
    name: "Math Medal",
    category: "neckwear",
    price: 10,
    color: "#f6c844",
    accentColor: "#2563eb",
    shape: "medal",
    characterIds: ALL_CHARACTER_IDS,
  },
  {
    id: "hero-cape",
    name: "Hero Cape",
    category: "back",
    price: 10,
    color: "#2563eb",
    accentColor: "#ef4444",
    shape: "cape",
    characterIds: SOFT_CHARACTER_IDS,
  },
  {
    id: "rocket-pack",
    name: "Rocket Pack",
    category: "back",
    price: 10,
    color: "#64748b",
    accentColor: "#fb923c",
    shape: "jetpack",
    characterIds: ["milo-robot"],
  },
  {
    id: "explorer-backpack",
    name: "Backpack",
    category: "back",
    price: 10,
    color: "#16a34a",
    accentColor: "#fbbf24",
    shape: "backpack",
    characterIds: SOFT_CHARACTER_IDS,
  },
  {
    id: "mint-sneakers",
    name: "Mint Sneakers",
    category: "feet",
    price: 10,
    color: "#48d1a5",
    accentColor: "#ffffff",
    shape: "sneakers",
    characterIds: ["buddy-bear", "milo-robot", "cora-cat", ...KID_CHARACTER_IDS],
  },
  {
    id: "polar-skates",
    name: "Polar Skates",
    category: "feet",
    price: 10,
    color: "#38bdf8",
    accentColor: "#e0f2fe",
    shape: "skates",
    characterIds: ["pip-penguin", "sunny-bird", ...KID_CHARACTER_IDS],
  },
  {
    id: "moon-boots",
    name: "Moon Boots",
    category: "feet",
    price: 10,
    color: "#7c3aed",
    accentColor: "#c4b5fd",
    shape: "boots",
    characterIds: ALL_CHARACTER_IDS,
  },
  {
    id: "sparkle-wand",
    name: "Sparkle Wand",
    category: "prop",
    price: 10,
    color: "#ec4899",
    accentColor: "#f6c844",
    shape: "wand",
    characterIds: SOFT_CHARACTER_IDS,
  },
  {
    id: "quiz-book",
    name: "Quiz Book",
    category: "prop",
    price: 10,
    color: "#2563eb",
    accentColor: "#f6c844",
    shape: "book",
    characterIds: ALL_CHARACTER_IDS,
  },
];

export const getCharacterById = (characterId) =>
  REWARD_CHARACTERS.find((character) => character.id === characterId) ||
  REWARD_CHARACTERS[0];

export const getAccessoryById = (itemId) =>
  REWARD_ACCESSORIES.find((item) => item.id === itemId);
