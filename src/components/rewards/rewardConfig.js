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
  {
    id: "willow-wizard",
    name: "Willow",
    title: "Wizard Girl",
    accent: "#7c3aed",
    summary: "A magical 3D wizard with separately colorable parts.",
    model: "/models/wizard_parts.glb",
  },
  {
    id: "nico-kid",
    name: "Nico",
    title: "Hoodie Kid",
    accent: "#2563eb",
    summary: "A 3D kid ready for hoodies, caps, and backpack adventures.",
    model: "/models/kid1_parts.glb",
  },
  {
    id: "quinn-kid",
    name: "Quinn",
    title: "Street Kid",
    accent: "#f97316",
    summary: "A 3D kid with street style and separately colorable gear.",
    model: "/models/kid2_parts.glb",
  },
  {
    id: "felix-fox",
    name: "Felix",
    title: "Clever Fox",
    accent: "#e8935a",
    summary: "A 3D fox in a hoodie with a cap and backpack — recolor every piece.",
    model: "/models/fox_parts.glb",
  },
  {
    id: "bruno-bear",
    name: "Bruno",
    title: "Big Bear",
    accent: "#a16207",
    summary: "A cuddly 3D bear ready for hoodie, pants, shoes, cap, and backpack colors.",
    model: "/models/bear_parts.glb",
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
  "max-boy": [
    { id: "skin", label: "Skin", default: "#f2c7a0" },
    { id: "hair", label: "Hair", default: "#7c2d12" },
    {
      id: "shirt",
      label: "Shirt",
      default: "#2563eb",
      materialNames: ["shirt_front", "shirt_back"],
    },
    {
      id: "pants",
      label: "Pants",
      default: "#0f766e",
      materialNames: ["pants_front", "pants_back"],
    },
  ],
  "ava-girl": [
    { id: "skin", label: "Skin", default: "#f2c7a0" },
    { id: "hair", label: "Hair", default: "#4a044e" },
    {
      id: "shirt",
      label: "Shirt",
      default: "#ec4899",
      materialNames: ["shirt_front", "shirt_back"],
    },
    {
      id: "skirt",
      label: "Skirt",
      default: "#7c3aed",
      materialNames: ["pants_front", "pants_back"],
    },
  ],
  "rover-dog": [
    {
      id: "fur",
      label: "Fur",
      default: "#d97706",
      materialNames: ["fur", "fur_dark"],
    },
    { id: "muzzle", label: "Muzzle", default: "#fed7aa" },
    { id: "belly_front", label: "Belly", default: "#ffedd5" },
  ],
  "ollie-owl": [
    {
      id: "feather",
      label: "Feathers",
      default: "#8b5cf6",
      materialNames: ["feather", "feather_dark"],
    },
    { id: "belly_front", label: "Belly", default: "#fef3c7" },
    { id: "face", label: "Face", default: "#faf5ff" },
    { id: "beak", label: "Beak", default: "#fb923c" },
  ],
  "frost-penguin": [
    {
      id: "body",
      label: "Body",
      default: "#334155",
      materialNames: ["body", "body_dark"],
    },
    { id: "belly_front", label: "Belly", default: "#f8fafc" },
    { id: "beak", label: "Beak", default: "#fb923c" },
    { id: "foot", label: "Feet", default: "#f59e0b" },
  ],
  "willow-wizard": [
    {
      id: "head",
      label: "Skin",
      default: "#f2c7a0",
      group: "body",
      materialNames: ["part_0_head"],
    },
    {
      id: "feather",
      label: "Feather",
      default: "#f87171",
      group: "body",
      materialNames: ["part_1_feather"],
    },
    {
      id: "hat",
      label: "Hat",
      default: "#bef264",
      group: "body",
      materialNames: ["part_2_hat"],
    },
    {
      id: "torso",
      label: "Torso",
      default: "#86efac",
      group: "body",
      materialNames: ["part_3_torso body"],
    },
    {
      id: "cloak",
      label: "Cloak",
      default: "#67e8f9",
      group: "body",
      materialNames: ["part_4_cloak"],
    },
    {
      id: "hands",
      label: "Hands",
      default: "#818cf8",
      group: "body",
      materialNames: ["part_5_hands"],
    },
    {
      id: "staff",
      label: "Staff",
      default: "#a78bfa",
      group: "body",
      materialNames: ["part_6_magic staff"],
    },
    {
      id: "orb",
      label: "Orb",
      default: "#f472b6",
      group: "body",
      materialNames: ["part_7_orb"],
    },
    { id: "eyes", label: "Eyes", default: "#2563eb", group: "face" },
    { id: "brows", label: "Brows", default: "#4a044e", group: "face" },
    { id: "lips", label: "Lips", default: "#db2777", group: "face" },
    { id: "blush", label: "Blush", default: "#fb7185", group: "face" },
    { id: "eyeshadow", label: "Shadow", default: "#a78bfa", group: "face" },
  ],
  // Nico base body only. Cap, backpack and sneakers are detachable accessories
  // (see MODEL_PART_ACCESSORIES), so they are not permanent color regions.
  "nico-kid": [
    { id: "head", label: "Skin", default: "#f2c7a0", materialNames: ["part_0_head"] },
    { id: "hair", label: "Hair", default: "#1f2937", materialNames: ["part_1_hair"] },
    { id: "torso", label: "Torso", default: "#f2c7a0", materialNames: ["part_2_torso_body"] },
    { id: "hoodie", label: "Hoodie", default: "#2563eb", materialNames: ["part_3_hoodie"] },
    { id: "pants", label: "Pants", default: "#1e3a8a", materialNames: ["part_4_pants"] },
  ],
  // Quinn base body only. Cap, backpack and sneakers are detachable accessories.
  "quinn-kid": [
    { id: "head", label: "Skin", default: "#e8b48a", materialNames: ["part_0_head"] },
    { id: "hair", label: "Hair", default: "#7c2d12", materialNames: ["part_1_hair"] },
    { id: "torso", label: "Torso", default: "#e8b48a", materialNames: ["part_2_torso_body"] },
    { id: "hoodie", label: "Hoodie", default: "#f97316", materialNames: ["part_3_hoodie"] },
    { id: "pants", label: "Pants", default: "#0f766e", materialNames: ["part_4_pants"] },
  ],
  // Felix Fox base body only. Cap and backpack are detachable accessories (see
  // MODEL_PART_ACCESSORIES), so they are not permanent color regions. The fox's
  // small ears/tail meshes are folded into "Fur" so they take the fur color
  // instead of rendering as untinted default material.
  "felix-fox": [
    {
      id: "fur",
      label: "Fur",
      default: "#e8935a",
      materialNames: ["part_0_head", "part_1_ears", "part_2_body", "part_3_tail"],
    },
    { id: "hoodie", label: "Hoodie", default: "#2563eb", materialNames: ["part_4_hoodie"] },
    { id: "pants", label: "Pants", default: "#1e3a8a", materialNames: ["part_5_pants"] },
  ],
  // Bruno Bear base body only. Cap, backpack and shoes are detachable
  // accessories. The chunky bear's head merged into the body mesh during part
  // extraction, so "Fur" covers both and there is no separate head control.
  "bruno-bear": [
    {
      id: "fur",
      label: "Fur",
      default: "#a16207",
      materialNames: ["part_0_head", "part_1_body"],
    },
    { id: "hoodie", label: "Hoodie", default: "#16a34a", materialNames: ["part_2_hoodie"] },
    { id: "pants", label: "Pants", default: "#ea580c", materialNames: ["part_3_pants"] },
  ],
};

// Detachable parts baked into a model character's GLB that are surfaced as
// equippable accessories instead of always-on geometry. Maps
// characterId -> { accessoryCategory: meshName }. CharacterViewer hides these
// meshes unless the matching accessory (same category, same characterId) is
// equipped, in which case it shows the mesh and tints it to the accessory color.
export const MODEL_PART_ACCESSORIES = {
  "felix-fox": { hat: "part_6_cap", back: "part_7_backpack" },
  "bruno-bear": { hat: "part_5_cap", back: "part_6_backpack", feet: "part_4_shoes" },
  "nico-kid": { hat: "part_7_cap", back: "part_6_backpack", feet: "part_5_sneakers" },
  "quinn-kid": { hat: "part_7_cap", back: "part_6_backpack", feet: "part_5_sneakers" },
};

export const getModelPartAccessories = (characterId) =>
  MODEL_PART_ACCESSORIES[characterId] || null;

export const getColorRegions = (characterId) =>
  CHARACTER_COLOR_REGIONS[characterId] || [];

const ALL_CHARACTER_IDS = PROCEDURAL_CHARACTER_IDS;
const SOFT_CHARACTER_IDS = ALL_CHARACTER_IDS.filter((id) => id !== "milo-robot");
const WILLOW_ID = "willow-wizard";
const withWillow = (ids) => (ids.includes(WILLOW_ID) ? ids : [...ids, WILLOW_ID]);
const OUTFIT_CHARACTER_IDS = SOFT_CHARACTER_IDS;
const DRESS_SKIRT_CHARACTER_IDS = ["cora-cat", "sunny-bird", "mia-girl", WILLOW_ID];
const KID_CHARACTER_IDS = ["leo-boy", "mia-girl"];
const WILLOW_WARDROBE_IDS = withWillow(SOFT_CHARACTER_IDS);

export const FACE_FEATURE_SLOTS = [
  { id: "eyes", label: "Eyes" },
  { id: "brows", label: "Brows" },
  { id: "makeup", label: "Makeup" },
];

export const FACE_LOOK_OPTIONS = {
  [WILLOW_ID]: {
    eyes: [
      { id: "round", label: "Round" },
      { id: "almond", label: "Almond" },
      { id: "sparkle", label: "Sparkle" },
      { id: "sleepy", label: "Sleepy" },
      { id: "cat", label: "Cat" },
    ],
    brows: [
      { id: "soft", label: "Soft" },
      { id: "arched", label: "Arched" },
      { id: "bold", label: "Bold" },
      { id: "none", label: "None" },
    ],
    makeup: [
      { id: "none", label: "None" },
      { id: "natural", label: "Natural" },
      { id: "glam", label: "Glam" },
      { id: "witch", label: "Witch" },
    ],
  },
};

export const DEFAULT_FACE_LOOKS = {
  [WILLOW_ID]: { eyes: "round", brows: "soft", makeup: "natural" },
};

export const getFaceLookOptions = (characterId) =>
  FACE_LOOK_OPTIONS[characterId] || null;

export const getDefaultFaceLooks = (characterId) =>
  DEFAULT_FACE_LOOKS[characterId] || {};

export const getResolvedFaceLooks = (characterId, savedLooks = {}) => ({
  ...getDefaultFaceLooks(characterId),
  ...savedLooks,
});

export const getColorRegionsByGroup = (characterId, group) =>
  getColorRegions(characterId).filter((region) => (region.group || "body") === group);

export const REWARD_ACCESSORIES = [
  {
    id: "sunny-red-cap",
    name: "Red Cap",
    category: "hat",
    price: 10,
    color: "#ef4444",
    accentColor: "#f97316",
    shape: "cap",
    characterIds: WILLOW_WARDROBE_IDS,
  },
  {
    id: "star-wizard-hat",
    name: "Star Hat",
    category: "hat",
    price: 10,
    color: "#7c3aed",
    accentColor: "#f6c844",
    shape: "wizardHat",
    characterIds: withWillow(ALL_CHARACTER_IDS),
  },
  {
    id: "gold-crown",
    name: "Gold Crown",
    category: "hat",
    price: 10,
    color: "#f6c844",
    accentColor: "#fb923c",
    shape: "crown",
    characterIds: withWillow(ALL_CHARACTER_IDS),
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
    characterIds: withWillow(ALL_CHARACTER_IDS),
  },
  {
    id: "star-spark-glasses",
    name: "Star Specs",
    category: "eyewear",
    price: 10,
    color: "#ec4899",
    accentColor: "#fef08a",
    shape: "starGlasses",
    characterIds: WILLOW_WARDROBE_IDS,
  },
  {
    id: "snow-goggles",
    name: "Snow Goggles",
    category: "eyewear",
    price: 10,
    color: "#0f766e",
    accentColor: "#a7f3d0",
    shape: "goggles",
    characterIds: ["milo-robot", "pip-penguin", "sunny-bird", WILLOW_ID, ...KID_CHARACTER_IDS],
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
    characterIds: WILLOW_WARDROBE_IDS,
  },
  {
    id: "friendship-bracelet",
    name: "Friendship Bracelet",
    category: "jewelry",
    price: 10,
    color: "#7c3aed",
    accentColor: "#48d1a5",
    shape: "friendshipBracelet",
    characterIds: withWillow(ALL_CHARACTER_IDS),
  },
  {
    id: "sparkle-ring",
    name: "Sparkle Ring",
    category: "jewelry",
    price: 10,
    color: "#38bdf8",
    accentColor: "#f6c844",
    shape: "sparkleRing",
    characterIds: withWillow([...SOFT_CHARACTER_IDS, "milo-robot"]),
  },
  {
    id: "rainbow-scarf",
    name: "Rainbow Scarf",
    category: "neckwear",
    price: 10,
    color: "#f56565",
    accentColor: "#48d1a5",
    shape: "scarf",
    characterIds: WILLOW_WARDROBE_IDS,
  },
  {
    id: "bright-bow-tie",
    name: "Bow Tie",
    category: "neckwear",
    price: 10,
    color: "#ec4899",
    accentColor: "#fdf2f8",
    shape: "bowTie",
    characterIds: withWillow(ALL_CHARACTER_IDS),
  },
  {
    id: "math-medal",
    name: "Math Medal",
    category: "neckwear",
    price: 10,
    color: "#f6c844",
    accentColor: "#2563eb",
    shape: "medal",
    characterIds: withWillow(ALL_CHARACTER_IDS),
  },
  {
    id: "hero-cape",
    name: "Hero Cape",
    category: "back",
    price: 10,
    color: "#2563eb",
    accentColor: "#ef4444",
    shape: "cape",
    characterIds: WILLOW_WARDROBE_IDS,
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
    characterIds: WILLOW_WARDROBE_IDS,
  },
  {
    id: "mint-sneakers",
    name: "Mint Sneakers",
    category: "feet",
    price: 10,
    color: "#48d1a5",
    accentColor: "#ffffff",
    shape: "sneakers",
    characterIds: ["buddy-bear", "milo-robot", "cora-cat", WILLOW_ID, ...KID_CHARACTER_IDS],
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
    characterIds: withWillow(ALL_CHARACTER_IDS),
  },
  {
    id: "sparkle-wand",
    name: "Sparkle Wand",
    category: "prop",
    price: 10,
    color: "#ec4899",
    accentColor: "#f6c844",
    shape: "wand",
    characterIds: WILLOW_WARDROBE_IDS,
  },
  {
    id: "quiz-book",
    name: "Quiz Book",
    category: "prop",
    price: 10,
    color: "#2563eb",
    accentColor: "#f6c844",
    shape: "book",
    characterIds: withWillow(ALL_CHARACTER_IDS),
  },
  // Detachable parts of the fox/bear GLBs, surfaced as equippable accessories.
  // `modelPart` names the mesh CharacterViewer shows (and tints to `color`) when
  // the item is equipped; `shape` is only used for the 2D store-card icon.
  {
    id: "felix-cap",
    name: "Fox Cap",
    category: "hat",
    price: 10,
    color: "#ef4444",
    accentColor: "#f97316",
    shape: "cap",
    modelPart: "part_6_cap",
    characterIds: ["felix-fox"],
  },
  {
    id: "felix-backpack",
    name: "Fox Backpack",
    category: "back",
    price: 10,
    color: "#16a34a",
    accentColor: "#fbbf24",
    shape: "backpack",
    modelPart: "part_7_backpack",
    characterIds: ["felix-fox"],
  },
  {
    id: "bruno-cap",
    name: "Bear Cap",
    category: "hat",
    price: 10,
    color: "#7c3aed",
    accentColor: "#c4b5fd",
    shape: "cap",
    modelPart: "part_5_cap",
    characterIds: ["bruno-bear"],
  },
  {
    id: "bruno-backpack",
    name: "Bear Backpack",
    category: "back",
    price: 10,
    color: "#dc2626",
    accentColor: "#fbbf24",
    shape: "backpack",
    modelPart: "part_6_backpack",
    characterIds: ["bruno-bear"],
  },
  {
    id: "bruno-shoes",
    name: "Bear Shoes",
    category: "feet",
    price: 10,
    color: "#2563eb",
    accentColor: "#e0f2fe",
    shape: "sneakers",
    modelPart: "part_4_shoes",
    characterIds: ["bruno-bear"],
  },
  // Nico's detachable cap / backpack / sneakers (colors match his base look).
  {
    id: "nico-cap",
    name: "Nico Cap",
    category: "hat",
    price: 10,
    color: "#ef4444",
    accentColor: "#f97316",
    shape: "cap",
    modelPart: "part_7_cap",
    characterIds: ["nico-kid"],
  },
  {
    id: "nico-backpack",
    name: "Nico Backpack",
    category: "back",
    price: 10,
    color: "#f6c844",
    accentColor: "#2563eb",
    shape: "backpack",
    modelPart: "part_6_backpack",
    characterIds: ["nico-kid"],
  },
  {
    id: "nico-sneakers",
    name: "Nico Sneakers",
    category: "feet",
    price: 10,
    color: "#f8fafc",
    accentColor: "#2563eb",
    shape: "sneakers",
    modelPart: "part_5_sneakers",
    characterIds: ["nico-kid"],
  },
  // Quinn's detachable cap / backpack / sneakers (colors match her base look).
  {
    id: "quinn-cap",
    name: "Quinn Cap",
    category: "hat",
    price: 10,
    color: "#38bdf8",
    accentColor: "#f6c844",
    shape: "cap",
    modelPart: "part_7_cap",
    characterIds: ["quinn-kid"],
  },
  {
    id: "quinn-backpack",
    name: "Quinn Backpack",
    category: "back",
    price: 10,
    color: "#7c3aed",
    accentColor: "#f6c844",
    shape: "backpack",
    modelPart: "part_6_backpack",
    characterIds: ["quinn-kid"],
  },
  {
    id: "quinn-sneakers",
    name: "Quinn Sneakers",
    category: "feet",
    price: 10,
    color: "#111827",
    accentColor: "#38bdf8",
    shape: "sneakers",
    modelPart: "part_5_sneakers",
    characterIds: ["quinn-kid"],
  },
];

export const getCharacterById = (characterId) =>
  REWARD_CHARACTERS.find((character) => character.id === characterId) ||
  REWARD_CHARACTERS[0];

export const getAccessoryById = (itemId) =>
  REWARD_ACCESSORIES.find((item) => item.id === itemId);
