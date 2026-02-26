#!/usr/bin/env node
/**
 * One-time script to generate angle example images via Gemini API.
 * Usage: node scripts/generate-angle-images.js
 *
 * Requires GEMINI_API_KEY in .env
 */

require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'images', 'angles');

const ANGLE_EXAMPLES = [
  // Acute angle examples (~40-50 degrees)
  {
    name: "open scissors",
    file: "acute-scissors",
    prompt: "A simple, clean educational illustration showing open scissors viewed from the side. The two scissor blades form a clearly visible ACUTE angle (about 40 degrees). The angle between the blades is highlighted with two bold magenta/pink lines and a small orange arc marking the acute angle at the pivot point. White background, flat design, minimal detail, suitable for 4th grade math education. Do not include any text, labels, numbers, or degree measurements in the image. Square format."
  },
  {
    name: "slice of pizza tip",
    file: "acute-pizza",
    prompt: "A simple, clean educational illustration showing a single slice of pizza with the pointed tip clearly forming an ACUTE angle (about 35 degrees). The two edges of the pizza slice are highlighted with bold magenta/pink lines and a small orange arc marks the acute angle at the tip. White background, flat design, minimal detail, suitable for 4th grade math education. Do not include any text, labels, numbers, or degree measurements in the image. Square format."
  },
  {
    name: "clock hands at 1:00",
    file: "acute-clock-1",
    prompt: "A simple, clean educational illustration showing an analog clock face with the hour hand pointing to 1 and the minute hand pointing to 12, forming a clearly visible ACUTE angle (about 30 degrees). The two clock hands are highlighted with bold magenta/pink color and a small orange arc marks the acute angle between them. White background, flat design, minimal detail, suitable for 4th grade math education. Do not include any text, labels, numbers, or degree measurements in the image. Square format."
  },
  {
    name: "partially opened book",
    file: "acute-book",
    prompt: "A simple, clean educational illustration showing a book partially opened, viewed from the side. The two covers form a clearly visible ACUTE angle (about 45 degrees). The angle between the covers is highlighted with bold magenta/pink lines and a small orange arc marks the acute angle at the spine. White background, flat design, minimal detail, suitable for 4th grade math education. Do not include any text, labels, numbers, or degree measurements in the image. Square format."
  },
  {
    name: "roof peak on a steep house",
    file: "acute-roof",
    prompt: "A simple, clean educational illustration showing the roof peak of a steep house. The two roof slopes meet at the top forming a clearly visible ACUTE angle (about 50 degrees). The angle at the peak is highlighted with bold magenta/pink lines along the roof edges and a small orange arc marking the acute angle. White background, flat design, minimal detail, suitable for 4th grade math education. Do not include any text, labels, numbers, or degree measurements in the image. Square format."
  },
  {
    name: "letter V shape",
    file: "acute-v-shape",
    prompt: "A simple, clean educational illustration showing a large letter V shape. The two lines of the V form a clearly visible ACUTE angle (about 40 degrees) at the bottom. The angle is highlighted with bold magenta/pink lines and a small orange arc marking the acute angle at the bottom vertex. White background, flat design, minimal detail, suitable for 4th grade math education. Do not include any text, labels, numbers, or degree measurements in the image. Square format."
  },
  {
    name: "narrow road fork",
    file: "acute-road-fork",
    prompt: "A simple, clean educational illustration showing a road splitting into a narrow fork, viewed from above. The two roads form a clearly visible ACUTE angle (about 35 degrees). The angle between the roads is highlighted with bold magenta/pink lines and a small orange arc marking the acute angle at the fork point. White background, flat design, minimal detail, suitable for 4th grade math education. Do not include any text, labels, numbers, or degree measurements in the image. Square format."
  },
  {
    name: "paper folded into a sharp corner",
    file: "acute-folded-paper",
    prompt: "A simple, clean educational illustration showing a piece of paper folded to create a sharp corner/crease. The fold creates a clearly visible ACUTE angle (about 45 degrees). The angle at the fold is highlighted with bold magenta/pink lines and a small orange arc marking the acute angle. White background, flat design, minimal detail, suitable for 4th grade math education. Do not include any text, labels, numbers, or degree measurements in the image. Square format."
  },

  // Right angle examples (exactly 90 degrees)
  {
    name: "corner of a book",
    file: "right-book-corner",
    prompt: "A simple, clean educational illustration showing the corner of a book from above, with the two edges meeting at exactly 90 degrees forming a RIGHT ANGLE. The two edges are highlighted with bold magenta/pink lines and a small square symbol marks the right angle at the corner. White background, flat design, minimal detail, suitable for 4th grade math education. Do not include any text, labels, numbers, or degree measurements in the image. Square format."
  },
  {
    name: "corner of a window frame",
    file: "right-window",
    prompt: "A simple, clean educational illustration showing the corner of a window frame where two frame pieces meet at exactly 90 degrees forming a RIGHT ANGLE. The two frame edges are highlighted with bold magenta/pink lines and a small square symbol marks the right angle. White background, flat design, minimal detail, suitable for 4th grade math education. Do not include any text, labels, numbers, or degree measurements in the image. Square format."
  },
  {
    name: "corner of a square tile",
    file: "right-tile",
    prompt: "A simple, clean educational illustration showing a square floor tile with one corner prominently featuring a RIGHT ANGLE (exactly 90 degrees). The two edges at the corner are highlighted with bold magenta/pink lines and a small square symbol marks the right angle. White background, flat design, minimal detail, suitable for 4th grade math education. Do not include any text, labels, numbers, or degree measurements in the image. Square format."
  },
  {
    name: "edge where wall meets floor",
    file: "right-wall-floor",
    prompt: "A simple, clean educational illustration showing a side view of a wall meeting a floor at exactly 90 degrees forming a RIGHT ANGLE. The wall and floor edges are highlighted with bold magenta/pink lines and a small square symbol marks the right angle where they meet. White background, flat design, minimal detail, suitable for 4th grade math education. Do not include any text, labels, numbers, or degree measurements in the image. Square format."
  },
  {
    name: "corner of a picture frame",
    file: "right-picture-frame",
    prompt: "A simple, clean educational illustration showing a picture frame with one corner prominently featuring a RIGHT ANGLE (exactly 90 degrees). The two frame edges at the corner are highlighted with bold magenta/pink lines and a small square symbol marks the right angle. White background, flat design, minimal detail, suitable for 4th grade math education. Do not include any text, labels, numbers, or degree measurements in the image. Square format."
  },
  {
    name: "corner of a notebook",
    file: "right-notebook",
    prompt: "A simple, clean educational illustration showing a notebook with one corner prominently featuring a RIGHT ANGLE (exactly 90 degrees). The two edges at the corner are highlighted with bold magenta/pink lines and a small square symbol marks the right angle. White background, flat design, minimal detail, suitable for 4th grade math education. Do not include any text, labels, numbers, or degree measurements in the image. Square format."
  },
  {
    name: "intersection of perpendicular streets",
    file: "right-streets",
    prompt: "A simple, clean educational illustration showing an aerial/top-down view of two streets crossing at exactly 90 degrees forming a RIGHT ANGLE. The two streets are highlighted with bold magenta/pink lines and a small square symbol marks the right angle at the intersection. White background, flat design, minimal detail, suitable for 4th grade math education. Do not include any text, labels, numbers, or degree measurements in the image. Square format."
  },
  {
    name: "corner of a rectangular table",
    file: "right-table",
    prompt: "A simple, clean educational illustration showing the corner of a rectangular table from above, with the two edges meeting at exactly 90 degrees forming a RIGHT ANGLE. The two edges are highlighted with bold magenta/pink lines and a small square symbol marks the right angle. White background, flat design, minimal detail, suitable for 4th grade math education. Do not include any text, labels, numbers, or degree measurements in the image. Square format."
  },

  // Obtuse angle examples (~120-130 degrees)
  {
    name: "laptop half-open",
    file: "obtuse-laptop",
    prompt: "A simple, clean educational illustration showing a laptop computer half-open, viewed from the side. The screen and keyboard form a clearly visible OBTUSE angle (about 120 degrees). The angle between screen and keyboard is highlighted with bold magenta/pink lines and a large orange arc marking the obtuse angle. White background, flat design, minimal detail, suitable for 4th grade math education. Do not include any text, labels, numbers, or degree measurements in the image. Square format."
  },
  {
    name: "door opened wide",
    file: "obtuse-door",
    prompt: "A simple, clean educational illustration showing a door opened wide from above/top-down view. The door and wall form a clearly visible OBTUSE angle (about 130 degrees). The angle is highlighted with bold magenta/pink lines and a large orange arc marking the obtuse angle between door and wall. White background, flat design, minimal detail, suitable for 4th grade math education. Do not include any text, labels, numbers, or degree measurements in the image. Square format."
  },
  {
    name: "clock hands at 4:00",
    file: "obtuse-clock-4",
    prompt: "A simple, clean educational illustration showing an analog clock face with the hour hand pointing to 4 and the minute hand pointing to 12, forming a clearly visible OBTUSE angle (about 120 degrees). The two clock hands are highlighted with bold magenta/pink color and a large orange arc marks the obtuse angle between them. White background, flat design, minimal detail, suitable for 4th grade math education. Do not include any text, labels, numbers, or degree measurements in the image. Square format."
  },
  {
    name: "wide pair of tongs",
    file: "obtuse-tongs",
    prompt: "A simple, clean educational illustration showing a pair of kitchen tongs opened wide. The two arms form a clearly visible OBTUSE angle (about 130 degrees). The angle between the arms is highlighted with bold magenta/pink lines and a large orange arc marking the obtuse angle at the pivot. White background, flat design, minimal detail, suitable for 4th grade math education. Do not include any text, labels, numbers, or degree measurements in the image. Square format."
  },
  {
    name: "reclining beach chair angle",
    file: "obtuse-beach-chair",
    prompt: "A simple, clean educational illustration showing a beach/lounge chair reclined, viewed from the side. The seat and backrest form a clearly visible OBTUSE angle (about 130 degrees). The angle is highlighted with bold magenta/pink lines and a large orange arc marking the obtuse angle. White background, flat design, minimal detail, suitable for 4th grade math education. Do not include any text, labels, numbers, or degree measurements in the image. Square format."
  },
  {
    name: "open mailbox lid",
    file: "obtuse-mailbox",
    prompt: "A simple, clean educational illustration showing a mailbox with its lid opened wide, viewed from the side. The lid and body form a clearly visible OBTUSE angle (about 120 degrees). The angle is highlighted with bold magenta/pink lines and a large orange arc marking the obtuse angle. White background, flat design, minimal detail, suitable for 4th grade math education. Do not include any text, labels, numbers, or degree measurements in the image. Square format."
  },
  {
    name: "tree branch splitting wide",
    file: "obtuse-tree-branch",
    prompt: "A simple, clean educational illustration showing a tree trunk with two branches splitting apart widely. The two branches form a clearly visible OBTUSE angle (about 130 degrees). The angle between the branches is highlighted with bold magenta/pink lines and a large orange arc marking the obtuse angle. White background, flat design, minimal detail, suitable for 4th grade math education. Do not include any text, labels, numbers, or degree measurements in the image. Square format."
  },
  {
    name: "opened umbrella rib section",
    file: "obtuse-umbrella",
    prompt: "A simple, clean educational illustration showing a side view of an opened umbrella with two ribs/spokes visible. The two ribs form a clearly visible OBTUSE angle (about 120 degrees). The angle between the ribs is highlighted with bold magenta/pink lines and a large orange arc marking the obtuse angle. White background, flat design, minimal detail, suitable for 4th grade math education. Do not include any text, labels, numbers, or degree measurements in the image. Square format."
  },

  // Straight angle examples (exactly 180 degrees)
  {
    name: "flat table edge",
    file: "straight-table-edge",
    prompt: "A simple, clean educational illustration showing the flat edge of a table from the side, forming a perfectly STRAIGHT ANGLE (180 degrees). The flat surface is highlighted with a bold magenta/pink line and a semicircular orange arc marks the straight angle along the edge. White background, flat design, minimal detail, suitable for 4th grade math education. Do not include any text, labels, numbers, or degree measurements in the image. Square format."
  },
  {
    name: "horizon line",
    file: "straight-horizon",
    prompt: "A simple, clean educational illustration showing a flat horizon line across the image, forming a perfectly STRAIGHT ANGLE (180 degrees). The horizon is highlighted with a bold magenta/pink line and a semicircular orange arc marks the straight angle. White background with minimal sky and ground detail, flat design, suitable for 4th grade math education. Do not include any text, labels, numbers, or degree measurements in the image. Square format."
  },
  {
    name: "straight ruler edge",
    file: "straight-ruler",
    prompt: "A simple, clean educational illustration showing a straight ruler laid flat, forming a perfectly STRAIGHT ANGLE (180 degrees) along its edge. The ruler edge is highlighted with a bold magenta/pink line and a semicircular orange arc marks the straight angle. White background, flat design, minimal detail, suitable for 4th grade math education. Do not include any text, labels, numbers, or degree measurements in the image. Square format."
  },
  {
    name: "taut jump rope",
    file: "straight-jump-rope",
    prompt: "A simple, clean educational illustration showing a taut/stretched jump rope held straight between two hands, forming a perfectly STRAIGHT ANGLE (180 degrees). The rope is highlighted with a bold magenta/pink line and a semicircular orange arc marks the straight angle. White background, flat design, minimal detail, suitable for 4th grade math education. Do not include any text, labels, numbers, or degree measurements in the image. Square format."
  },
  {
    name: "straight road segment",
    file: "straight-road",
    prompt: "A simple, clean educational illustration showing a straight road from above/aerial view, forming a perfectly STRAIGHT ANGLE (180 degrees). The road center line is highlighted with a bold magenta/pink line and a semicircular orange arc marks the straight angle. White background, flat design, minimal detail, suitable for 4th grade math education. Do not include any text, labels, numbers, or degree measurements in the image. Square format."
  },
  {
    name: "edge of a shelf",
    file: "straight-shelf",
    prompt: "A simple, clean educational illustration showing the straight edge of a wall shelf from the front, forming a perfectly STRAIGHT ANGLE (180 degrees). The shelf edge is highlighted with a bold magenta/pink line and a semicircular orange arc marks the straight angle. White background, flat design, minimal detail, suitable for 4th grade math education. Do not include any text, labels, numbers, or degree measurements in the image. Square format."
  },
  {
    name: "fully opened book laid flat",
    file: "straight-flat-book",
    prompt: "A simple, clean educational illustration showing a book fully opened and laid completely flat, viewed from the side. The two covers form a perfectly STRAIGHT ANGLE (180 degrees). The flat line is highlighted with a bold magenta/pink line and a semicircular orange arc marks the straight angle at the spine. White background, flat design, minimal detail, suitable for 4th grade math education. Do not include any text, labels, numbers, or degree measurements in the image. Square format."
  },
  {
    name: "straight line on notebook paper",
    file: "straight-notebook-line",
    prompt: "A simple, clean educational illustration showing a straight horizontal line drawn on notebook paper, forming a perfectly STRAIGHT ANGLE (180 degrees). The line is highlighted with bold magenta/pink color and a semicircular orange arc marks the straight angle at the center. White background, flat design, minimal detail, suitable for 4th grade math education. Do not include any text, labels, numbers, or degree measurements in the image. Square format."
  },
];

async function generateImage(genAI, description) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-3-pro-image-preview',
    generationConfig: {
      responseModalities: ['IMAGE'],
    },
  });

  const result = await model.generateContent(description);
  const response = result.response;

  if (response.candidates && response.candidates[0] && response.candidates[0].content) {
    const parts = response.candidates[0].content.parts;
    const imagePart = parts.find(part => part.inlineData);

    if (imagePart && imagePart.inlineData) {
      const base64Clean = imagePart.inlineData.data.replace(/^data:image\/\w+;base64,/, '');
      return Buffer.from(base64Clean, 'base64');
    }
  }

  throw new Error('No image generated in response');
}

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error('ERROR: GEMINI_API_KEY not found in .env');
    process.exit(1);
  }

  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  // Check which images already exist (to support resume)
  const existing = new Set(fs.readdirSync(OUTPUT_DIR).map(f => f.replace(/\.[^.]+$/, '')));

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < ANGLE_EXAMPLES.length; i++) {
    const example = ANGLE_EXAMPLES[i];

    if (existing.has(example.file)) {
      console.log(`[${i + 1}/${ANGLE_EXAMPLES.length}] SKIP ${example.file} (already exists)`);
      skipped++;
      continue;
    }

    console.log(`[${i + 1}/${ANGLE_EXAMPLES.length}] Generating ${example.file} — "${example.name}"...`);

    try {
      const buffer = await generateImage(genAI, example.prompt);
      const outPath = path.join(OUTPUT_DIR, `${example.file}.png`);
      fs.writeFileSync(outPath, buffer);
      console.log(`  ✓ Saved ${outPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
      generated++;
    } catch (err) {
      console.error(`  ✗ FAILED: ${err.message}`);
      failed++;
    }

    // Small delay between requests to avoid rate limiting
    if (i < ANGLE_EXAMPLES.length - 1) {
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  console.log(`\nDone! Generated: ${generated}, Skipped: ${skipped}, Failed: ${failed}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
