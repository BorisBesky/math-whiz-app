// Placement data for the textured characters and accessories generated with
// the local ComfyUI text-to-3D flow (Z-Image + TRELLIS 2). Character GLBs live
// in /models/generated, accessory GLBs in /models/accessories.
//
// All anchor values are in CharacterViewer's normalized model space: the
// character is scaled to 2.0 units tall, centered on x/z, feet at y = 0, face
// toward +z. Values were measured from each mesh (width profile, face, feet,
// arm extremes) and then adjusted by eye in the viewer.

export const GENERATED_ACCESSORY_DIR = "/models/accessories";

export const GENERATED_CHARACTER_ANCHORS = {
  "buddy-bear": {
    headWidth: 1.19, headZ: 0, crownY: 1.9, eyeX: 0, eyeY: 1.448, faceZ: 0.5,
    neckY: 1.2, chestY: 0.95, chestFrontZ: 0.42, backZ: -0.54, bodyZ: -0.08, torsoWidth: 1.3,
    waistY: 0.36, hipWidth: 0.98,
    handLeft: [-0.62, 0.56, 0.14], handRight: [0.62, 0.56, 0.14],
    footLeft: [-0.26, 0, -0.08], footRight: [0.256, 0, -0.076], footLength: 0.54,
  },
  "milo-robot": {
    headWidth: 1.0, headZ: 0.06, crownY: 1.98, eyeX: -0.002, eyeY: 1.576, faceZ: 0.5,
    neckY: 1.3, chestY: 1.05, chestFrontZ: 0.47, backZ: -0.5, bodyZ: -0.02, torsoWidth: 1.05,
    waistY: 0.5, hipWidth: 0.95,
    handLeft: [-0.65, 0.44, 0.08], handRight: [0.65, 0.44, 0.08],
    footLeft: [-0.265, 0, -0.1], footRight: [0.275, 0, -0.1], footLength: 0.44,
  },
  "leo-boy": {
    headWidth: 1.05, headZ: -0.02, crownY: 1.9, eyeX: 0.012, eyeY: 1.354, faceZ: 0.36,
    neckY: 1.04, chestY: 0.85, chestFrontZ: 0.18, backZ: -0.14, bodyZ: 0.028, torsoWidth: 0.62,
    waistY: 0.54, hipWidth: 0.56,
    handLeft: [-0.31, 0.5, 0.04], handRight: [0.33, 0.5, 0.04],
    footLeft: [-0.176, 0, 0.072], footRight: [0.215, 0, 0.072], footLength: 0.42,
  },
  "mia-girl": {
    headWidth: 1.1, headZ: -0.02, crownY: 1.92, eyeX: 0.018, eyeY: 1.376, faceZ: 0.35,
    neckY: 1.06, chestY: 0.88, chestFrontZ: 0.23, backZ: -0.3, bodyZ: 0.061, torsoWidth: 0.58,
    waistY: 0.6, hipWidth: 0.57,
    handLeft: [-0.3, 0.52, 0.05], handRight: [0.31, 0.52, 0.05],
    footLeft: [-0.163, 0, 0.12], footRight: [0.214, 0, 0.12], footLength: 0.38,
  },
};

// How each generated accessory sits on a character.
//  anchor:     head | eyes | neckFront | neckWrap | chest | back | backTop | dress | waist | feet | handRight | handLeft
//  size:       target width as a fraction of the anchor's body measure (head, torso, hips),
//              or absolute size in units for hand items (largest dimension)
//  sink:       hats only - fraction of the hat's height that sits below the anchors' crownY (default 2.0,
//              lower for characters with tall hair)
//  rotationY:  radians applied to the GLB before fitting (front of generated items faces +z)
//  rotationX:  optional tilt in radians (applied after rotationY)
//  rotationZ:  optional roll in radians
//  widthScale / heightScale / depthScale: optional per-axis scale multipliers
//  offsetX / offsetY / offsetZ: fine-tuning in units
export const GENERATED_ACCESSORY_FITS = {
  "sunny-red-cap": {
    anchor: "head", size: 1.14, widthScale: 1.08, depthScale: 1.14,
    sink: 0.52, rotationX: -0.04, rotationY: -0.24, offsetY: -0.02, offsetZ: 0.04,
  },
  "star-wizard-hat": { anchor: "head", size: 0.9, sink: 0.12 },
  "gold-crown": { anchor: "head", size: 0.62, sink: 0.15 },
  "robot-antenna": {
    anchor: "head", size: 1.02, widthScale: 1.02, heightScale: 0.88,
    sink: 0.62, offsetY: -0.03, offsetZ: 0.02,
  },
  "round-sky-glasses": {
    anchor: "eyes", size: 0.72, offsetY: -0.02, offsetZ: -0.04,
  },
  "star-spark-glasses": {
    anchor: "eyes", size: 0.7, offsetY: -0.02, offsetZ: -0.025,
  },
  "snow-goggles": { anchor: "eyes", size: 0.86 },
  "party-dress": { anchor: "dress", size: 1.28 },
  "rainbow-dress": { anchor: "dress", size: 1.28 },
  "twirl-skirt": {
    anchor: "waist", size: 1.45,
  },
  "sport-skirt": {
    anchor: "waist", size: 1.42,
  },
  "comfy-shorts": {
    anchor: "waist", size: 1.32,
  },
  "sport-shorts": {
    anchor: "waist", size: 1.3,
  },
  "heart-necklace": {
    anchor: "neckFront", size: 0.28,
    rotationX: -0.1, offsetX: 0.015, offsetY: -0.12, offsetZ: -0.01,
  },
  "friendship-bracelet": { anchor: "handLeft", size: 0.24 },
  "sparkle-ring": { anchor: "handRight", size: 0.16 },
  "rainbow-scarf": {
    anchor: "neckWrap", size: 0.85,
  },
  "bright-bow-tie": { anchor: "neckFront", size: 0.38, offsetY: 0.02 },
  "math-medal": { anchor: "chest", size: 0.32 },
  "hero-cape": { anchor: "backTop", size: 0.82, rotationY: Math.PI, rotationX: 0.12 },
  "rocket-pack": {
    anchor: "back", size: 0.76, rotationY: Math.PI, offsetY: 0.05, offsetZ: 0.24,
  },
  "explorer-backpack": { anchor: "back", size: 0.7, rotationY: Math.PI },
  "mint-sneakers": { anchor: "feet", size: 1.12, rotationY: -Math.PI / 2 },
  "polar-skates": { anchor: "feet", size: 1.12, rotationY: -Math.PI / 2 },
  "moon-boots": { anchor: "feet", size: 0.95, rotationY: -Math.PI / 2 },
  "sparkle-wand": {
    anchor: "handRight", size: 0.68,
    rotationX: 0.22, rotationY: -0.15, rotationZ: -0.45,
    offsetX: 0.11, offsetY: 0.14, offsetZ: 0.12,
  },
  "quiz-book": {
    anchor: "handRight", size: 0.4,
    rotationX: -0.18, rotationY: 0.28, rotationZ: -0.14,
    offsetX: 0.05, offsetY: -0.03, offsetZ: 0.09,
  },
  // Character-specific items.
  "buddy-straw-hat": {
    anchor: "head", size: 1.12, widthScale: 1.08, heightScale: 0.86, depthScale: 1.06,
    sink: 0.38, rotationX: 0.04, offsetY: 0.02, offsetZ: 0.0,
  },
  "buddy-nightcap": {
    anchor: "head", size: 0.98, widthScale: 1.04, heightScale: 0.8, depthScale: 1.08,
    sink: 0.42, rotationX: 0.02, offsetY: -0.01, offsetZ: -0.02,
  },
  "buddy-honey-pot": {
    anchor: "handRight", size: 0.44,
    rotationX: 0.08, rotationY: -0.25, rotationZ: -0.08,
    offsetX: 0.04, offsetY: -0.04, offsetZ: 0.1,
  },
  "buddy-picnic-basket": {
    anchor: "handRight", size: 0.46,
    rotationX: 0.06, rotationY: -0.28,
    offsetX: 0.04, offsetY: -0.14, offsetZ: 0.08,
  },
  "buddy-overalls": {
    anchor: "dress", size: 1.18,
  },
  "milo-hard-hat": {
    anchor: "head", size: 1.16, widthScale: 1.06, heightScale: 0.92, depthScale: 0.98,
    sink: 0.62, rotationX: 0.03, offsetY: -0.05, offsetZ: -0.01,
  },
  "milo-visor": {
    anchor: "eyes", size: 0.98, rotationX: -0.02, offsetY: -0.03, offsetZ: -0.015,
  },
  "milo-wrench": {
    anchor: "handRight", size: 0.58,
    rotationX: 0.55, rotationY: -0.35, rotationZ: -0.28,
    offsetX: 0.04, offsetY: 0.12, offsetZ: 0.16,
  },
  "milo-magnet": {
    anchor: "handRight", size: 0.42,
    rotationX: 0.35, rotationY: -0.3, rotationZ: -0.25,
    offsetX: 0.03, offsetY: -0.02, offsetZ: 0.12,
  },
  "milo-rocket-boots": {
    anchor: "feet", size: 1.28, widthScale: 1.28, heightScale: 0.88, depthScale: 1.2,
    rotationY: -Math.PI / 2, offsetX: 0.01, offsetZ: 0.09,
  },
  "leo-explorer-hat": {
    anchor: "head", size: 1.36, widthScale: 1.06, depthScale: 1.12,
    sink: 0.72, rotationX: 0.02, offsetY: -0.04, offsetZ: -0.02,
  },
  "leo-hero-mask": {
    anchor: "eyes", size: 0.82, widthScale: 1.05,
    rotationX: 0.28, offsetY: 0.03, offsetZ: 0.09,
  },
  "leo-soccer-ball": {
    anchor: "handRight", size: 0.3,
    offsetX: 0.03, offsetY: -0.02, offsetZ: 0.07,
  },
  "leo-skateboard": {
    anchor: "handLeft", size: 0.72,
    rotationY: -0.45, rotationZ: 0.1,
    offsetX: -0.09, offsetY: -0.04, offsetZ: 0.05,
  },
  "mia-flower-crown": {
    anchor: "head", size: 0.9, widthScale: 0.98, depthScale: 0.92,
    sink: 0.62, rotationX: -1.38, offsetY: -0.03, offsetZ: -0.03,
  },
  "mia-hair-bow": {
    anchor: "head", size: 0.5, sink: 0.28,
    rotationX: -0.18, offsetY: 0.01, offsetZ: 0.14,
  },
  "mia-tiara": {
    anchor: "head", size: 0.64, sink: 0.38,
    rotationX: 0.14, offsetY: -0.01, offsetZ: 0.13,
  },
  "mia-heart-sunglasses": {
    anchor: "eyes", size: 0.7, offsetY: -0.01, offsetZ: -0.015,
  },
  "mia-pinafore": {
    anchor: "dress", size: 1.48,
  },
  // Per-character versions of formerly shared items.
  "buddy-bow-tie": {
    anchor: "neckFront", size: 0.32,
    rotationX: -0.22, offsetY: 0.01, offsetZ: -0.105,
  },
  "milo-bow-tie": {
    anchor: "neckFront", size: 0.34,
    rotationX: -0.08, offsetY: 0.02, offsetZ: -0.065,
  },
  "buddy-medal": {
    anchor: "chest", size: 0.28,
    rotationX: -0.06, offsetY: -0.14, offsetZ: -0.045,
  },
  "milo-medal": {
    anchor: "chest", size: 0.3,
    rotationX: -0.08, offsetY: -0.08, offsetZ: -0.04,
  },
  "leo-medal": {
    anchor: "chest", size: 0.32,
    rotationX: -0.08, offsetX: 0.015, offsetY: -0.06, offsetZ: 0.0,
  },
  "buddy-backpack": {
    anchor: "back", size: 0.7, rotationY: Math.PI,
    rotationX: 0.04, offsetY: 0.06, offsetZ: 0.62,
  },
  "leo-backpack": {
    anchor: "back", size: 0.76, rotationY: Math.PI,
    rotationX: 0.06, offsetX: 0.015, offsetY: 0.04, offsetZ: 0.22,
  },
  "buddy-cape": {
    anchor: "backTop", size: 1.0,
  },
  "leo-cape": {
    anchor: "backTop", size: 0.96,
  },
  "leo-bracelet": {
    anchor: "handLeft", size: 0.2,
    rotationX: 1.35, rotationZ: 0.15,
    offsetX: 0.01, offsetY: 0.07, offsetZ: -0.01,
  },
  "mia-bracelet": {
    anchor: "handLeft", size: 0.2,
    rotationX: 1.45, rotationZ: 0.15,
    offsetX: 0.01, offsetY: 0.06, offsetZ: 0.0,
  },
  "leo-sneakers": {
    anchor: "feet", size: 1.18, widthScale: 1.38, heightScale: 0.92,
    rotationY: -Math.PI / 2, offsetX: 0.01, offsetZ: 0.02,
  },
  "mia-sneakers": {
    anchor: "feet", size: 1.18, widthScale: 1.28, heightScale: 0.98,
    rotationY: Math.PI / 2, offsetX: 0.005, offsetZ: -0.01,
  },
  "mia-butterfly-wings": {
    anchor: "back", size: 2.55, rotationY: Math.PI,
    rotationX: 0.06, offsetY: 0.32, offsetZ: -0.02,
  },
};

// Per-character adjustments merged over the shared fit above, for items whose
// generic placement doesn't suit one body (keyed by item id, then character id).
export const GENERATED_ACCESSORY_FIT_OVERRIDES = {};

export const getGeneratedAnchors = (characterId) =>
  GENERATED_CHARACTER_ANCHORS[characterId] || null;

export const getGeneratedAccessoryFit = (itemId, characterId) => {
  const fit = GENERATED_ACCESSORY_FITS[itemId];
  if (!fit) return null;
  return {
    itemId,
    characterId,
    ...fit,
    ...GENERATED_ACCESSORY_FIT_OVERRIDES[itemId]?.[characterId],
  };
};

export const generatedAccessoryUrl = (itemId) => `${GENERATED_ACCESSORY_DIR}/${itemId}.glb`;
