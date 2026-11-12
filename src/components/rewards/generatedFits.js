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
    headWidth: 1.19, headZ: 0, eyeY: 1.52, faceZ: 0.5,
    neckY: 1.2, chestY: 0.95, chestFrontZ: 0.42, backZ: -0.54, torsoWidth: 1.3,
    waistY: 0.36, hipWidth: 0.98,
    handLeft: [-0.5, 0.55, 0.0], handRight: [0.5, 0.55, 0.0],
    footLeft: [-0.25, 0, -0.06], footRight: [0.23, 0, -0.08], footLength: 0.54,
  },
  "milo-robot": {
    headWidth: 1.0, headZ: 0, eyeY: 1.66, faceZ: 0.5,
    neckY: 1.3, chestY: 1.05, chestFrontZ: 0.47, backZ: -0.5, torsoWidth: 1.05,
    waistY: 0.5, hipWidth: 0.95,
    handLeft: [-0.61, 0.4, 0.07], handRight: [0.62, 0.4, 0.05],
    footLeft: [-0.26, 0, -0.06], footRight: [0.27, 0, -0.06], footLength: 0.44,
  },
  "leo-boy": {
    headWidth: 1.05, headZ: -0.06, crownY: 1.86, eyeY: 1.38, faceZ: 0.36,
    neckY: 1.07, chestY: 0.85, chestFrontZ: 0.2, backZ: -0.16, torsoWidth: 0.62,
    waistY: 0.54, hipWidth: 0.55,
    handLeft: [-0.3, 0.47, 0.02], handRight: [0.33, 0.47, 0.02],
    footLeft: [-0.2, 0, 0.08], footRight: [0.22, 0, 0.08], footLength: 0.4,
  },
  "mia-girl": {
    headWidth: 1.1, headZ: -0.05, crownY: 1.88, eyeY: 1.4, faceZ: 0.35,
    neckY: 1.1, chestY: 0.88, chestFrontZ: 0.23, backZ: -0.3, torsoWidth: 0.58,
    waistY: 0.6, hipWidth: 0.57,
    handLeft: [-0.28, 0.52, 0.02], handRight: [0.3, 0.52, 0.02],
    footLeft: [-0.18, 0, 0.13], footRight: [0.22, 0, 0.13], footLength: 0.36,
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
//  heightScale: optional extra vertical scale (shortens long skirts)
//  offsetY / offsetZ: fine-tuning in units
export const GENERATED_ACCESSORY_FITS = {
  "sunny-red-cap": { anchor: "head", size: 0.92, sink: 0.38 },
  "star-wizard-hat": { anchor: "head", size: 0.9, sink: 0.12 },
  "gold-crown": { anchor: "head", size: 0.62, sink: 0.15 },
  "robot-antenna": { anchor: "head", size: 0.9, sink: 0.5 },
  "round-sky-glasses": { anchor: "eyes", size: 0.72, offsetY: -0.08 },
  "star-spark-glasses": { anchor: "eyes", size: 0.74, offsetY: -0.07 },
  "snow-goggles": { anchor: "eyes", size: 0.86 },
  "party-dress": { anchor: "dress", size: 1.28 },
  "rainbow-dress": { anchor: "dress", size: 1.28 },
  "twirl-skirt": { anchor: "waist", size: 1.6, heightScale: 0.6 },
  "sport-skirt": { anchor: "waist", size: 1.45, heightScale: 0.75 },
  "comfy-shorts": { anchor: "waist", size: 1.32 },
  "sport-shorts": { anchor: "waist", size: 1.32 },
  "heart-necklace": { anchor: "neckFront", size: 0.42, offsetZ: -0.04 },
  "friendship-bracelet": { anchor: "handLeft", size: 0.24 },
  "sparkle-ring": { anchor: "handRight", size: 0.16 },
  "rainbow-scarf": { anchor: "neckWrap", size: 0.85 },
  "bright-bow-tie": { anchor: "neckFront", size: 0.38, offsetY: 0.02 },
  "math-medal": { anchor: "chest", size: 0.32 },
  "hero-cape": { anchor: "backTop", size: 0.82, rotationY: Math.PI, rotationX: 0.12 },
  "rocket-pack": { anchor: "back", size: 0.75, rotationY: Math.PI },
  "explorer-backpack": { anchor: "back", size: 0.7, rotationY: Math.PI },
  "mint-sneakers": { anchor: "feet", size: 1.12, rotationY: -Math.PI / 2 },
  "polar-skates": { anchor: "feet", size: 1.12, rotationY: -Math.PI / 2 },
  "moon-boots": { anchor: "feet", size: 0.95, rotationY: -Math.PI / 2 },
  "sparkle-wand": { anchor: "handRight", size: 0.6 },
  "quiz-book": { anchor: "handRight", size: 0.4, offsetZ: 0.08 },
};

export const getGeneratedAnchors = (characterId) =>
  GENERATED_CHARACTER_ANCHORS[characterId] || null;

export const getGeneratedAccessoryFit = (itemId) =>
  GENERATED_ACCESSORY_FITS[itemId] || null;

export const generatedAccessoryUrl = (itemId) => `${GENERATED_ACCESSORY_DIR}/${itemId}.glb`;
