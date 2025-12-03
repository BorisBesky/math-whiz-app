// This script imports previously hardcoded store items into Firebase Storage
// It downloads images from their current URLs and uploads them to Firebase Storage
// Then creates the image-metadata.json file with the proper structure
//
// Usage: 
//   node scripts/import-store-items.js [--dry-run] [--bucket=bucket-name]
//
// Options:
//   --dry-run          Preview what will happen without making changes
//   --bucket=name      Specify custom storage bucket name
//
// Environment variables required:
// - FIREBASE_PROJECT_ID
// - FIREBASE_CLIENT_EMAIL
// - FIREBASE_PRIVATE_KEY
// - REACT_APP_FIREBASE_STORAGE_BUCKET (optional, defaults to {PROJECT_ID}.appspot.com)

require('dotenv').config();
const admin = require('firebase-admin');
const { getStorage } = require('firebase-admin/storage');
const fetch = require('node-fetch');
const path = require('path');

// Original hardcoded store items
const originalStoreItems = [
  { id: "bg1", name: "Silly Giraffe", url: "https://images4whizkids.s3.us-east-2.amazonaws.com/A_funny_cute_plastic_toy_gira-3.jpg", theme: "animals" },
  { id: "bg2", name: "Cool Lion", url: "https://images4whizkids.s3.us-east-2.amazonaws.com/A_cool_felt-stitched_toy_lion_w-1.jpg", theme: "animals" },
  { id: "bg3", name: "Playful Monkey", url: "https://images4whizkids.s3.us-east-2.amazonaws.com/A_playful_claymation-style_toy-0.jpg", theme: "animals" },
  { id: "bg4", name: "Happy Hippo", url: "https://images4whizkids.s3.us-east-2.amazonaws.com/Happy_Hippo_A_cheerful_round_h-0.jpg", theme: "animals" },
  { id: "bg5", name: "Zebra Stripes", url: "https://images4whizkids.s3.us-east-2.amazonaws.com/zebra.jpeg", theme: "animals" },
  { id: "bg6", name: "Funky Frog", url: "https://images4whizkids.s3.us-east-2.amazonaws.com/frog.jpeg", theme: "animals" },
  { id: "bg7", name: "Dapper Dog", url: "https://images4whizkids.s3.us-east-2.amazonaws.com/puppy_hat_and_a_monocle.jpg", theme: "animals" },
  { id: "bg8", name: "Cuddly Cat", url: "https://images4whizkids.s3.us-east-2.amazonaws.com/kitten.jpeg", theme: "animals" },
  { id: "bg9", name: "Penguin Party", url: "https://images4whizkids.s3.us-east-2.amazonaws.com/penguins.jpeg", theme: "animals" },
  { id: "bg10", name: "Bear Hugs", url: "https://images4whizkids.s3.us-east-2.amazonaws.com/polar_bear_cub_with_glasses.jpg", theme: "animals" },
  { id: "bg11", name: "Wacky Walrus", url: "https://images4whizkids.s3.us-east-2.amazonaws.com/walrus.jpeg", theme: "animals" },
  { id: "bg12", name: "Jumping Kangaroo", url: "https://images4whizkids.s3.us-east-2.amazonaws.com/kangaroo.jpeg", theme: "animals" },
  { id: "bg13", name: "Sleepy Sloth", url: "https://images4whizkids.s3.us-east-2.amazonaws.com/sloth.jpeg", theme: "animals" },
  { id: "bg14", name: "Clever Fox", url: "https://images4whizkids.s3.us-east-2.amazonaws.com/fox.jpeg", theme: "animals" },
  { id: "bg15", name: "Wise Owl", url: "https://images4whizkids.s3.us-east-2.amazonaws.com/owl.jpeg", theme: "animals" },
  { id: "bg16", name: "Busy Beaver", url: "https://images4whizkids.s3.us-east-2.amazonaws.com/beaver.jpeg", theme: "animals" },
  { id: "bg17", name: "Panda Peace", url: "https://images4whizkids.s3.us-east-2.amazonaws.com/panda.jpeg", theme: "animals" },
  { id: "bg18", name: "Koala Cuddles", url: "https://images4whizkids.s3.us-east-2.amazonaws.com/Koala2.jpg", theme: "animals" },
  { id: "bg19", name: "Raccoon Rascal", url: "https://images4whizkids.s3.us-east-2.amazonaws.com/racoon.jpeg", theme: "animals" },
  { id: "bg20", name: "Elephant Smiles", url: "https://images4whizkids.s3.us-east-2.amazonaws.com/elephant.jpeg", theme: "animals" },
  { id: "bg21", name: "Zombies and Witches Trick or Treat", url: "https://images4whizkids.s3.us-east-2.amazonaws.com/zombie-witches.jpg", theme: "halloween" },
  { id: "bg22", name: "Werewolf", url: "https://images4whizkids.s3.us-east-2.amazonaws.com/werewolf.jpg", theme: "halloween" },
  { id: "bg23", name: "Trick-or-Treaters", url: "https://images4whizkids.s3.us-east-2.amazonaws.com/tric-or-treaters.jpg", theme: "halloween" },
  { id: "bg24", name: "Skeleton Dancing", url: "https://images4whizkids.s3.us-east-2.amazonaws.com/skeleton-dancing.jpg", theme: "halloween" },
  { id: "bg25", name: "Scarecrow", url: "https://images4whizkids.s3.us-east-2.amazonaws.com/scarecrow.jpg", theme: "halloween" },
  { id: "bg26", name: "Mushroom", url: "https://images4whizkids.s3.us-east-2.amazonaws.com/mushroom.jpg", theme: "halloween" },
  { id: "bg27", name: "Kitten Pumpkin", url: "https://images4whizkids.s3.us-east-2.amazonaws.com/kitten-pumpkin.jpg", theme: "halloween" },
  { id: "bg28", name: "Gummy Worms", url: "https://images4whizkids.s3.us-east-2.amazonaws.com/gummy-worms.jpg", theme: "halloween" },
  { id: "bg29", name: "Ghost", url: "https://images4whizkids.s3.us-east-2.amazonaws.com/ghost.jpg", theme: "halloween" },
  { id: "bg30", name: "Bat", url: "https://images4whizkids.s3.us-east-2.amazonaws.com/bat.jpg", theme: "halloween" },
  { id: "bg31", name: "Forbidden Forest", url: "https://storage.googleapis.com/whiz-store-images/Forbidden%20Forest.jpg", theme: "magic" },
  { id: "bg32", name: "Frozen Black Lake", url: "https://storage.googleapis.com/whiz-store-images/Frozen%20Black%20Lake.jpg", theme: "magic" },
  { id: "bg33", name: "Gryffindor common room", url: "https://storage.googleapis.com/whiz-store-images/Gryffindor%20common%20room..jpg", theme: "magic" },
  { id: "bg34", name: "Hogsmeade Village", url: "https://storage.googleapis.com/whiz-store-images/Hogsmeade%20Village.jpg", theme: "magic" },
  { id: "bg35", name: "Owlery Tower", url: "https://storage.googleapis.com/whiz-store-images/Owlery%20Tower.jpg", theme: "magic" },
  { id: "bg36", name: "Quidditch Pitch", url: "https://storage.googleapis.com/whiz-store-images/Quidditch%20Pitch.jpg", theme: "magic" },
  { id: "bg37", name: "hogwarts library 2", url: "https://storage.googleapis.com/whiz-store-images/hogwarts%20library%202.jpg", theme: "magic" },
  { id: "bg38", name: "library", url: "https://storage.googleapis.com/whiz-store-images/library.jpg", theme: "magic" },
  { id: "bg39", name: "outside-hall", url: "https://storage.googleapis.com/whiz-store-images/outside-hall.jpg", theme: "magic" },
  { id: "bg40", name: "viaduct bridge", url: "https://storage.googleapis.com/whiz-store-images/viaduct%20bridge.jpg", theme: "magic" }
];

// Parse command line arguments
const isDryRun = process.argv.includes('--dry-run');

// Allow bucket name to be specified via command line: --bucket=name
let customBucketName = null;
const bucketArg = process.argv.find(arg => arg.startsWith('--bucket='));
if (bucketArg) {
  customBucketName = bucketArg.split('=')[1];
}

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!privateKey) {
      throw new Error('FIREBASE_PRIVATE_KEY environment variable is required');
    }

    // Handle different encoding scenarios
    try {
      // First try: Replace literal \n with actual newlines
      privateKey = privateKey.replace(/\\n/g, "\n");

      // Second try: If it's base64 encoded, decode it
      // Check if it doesn't already have the BEGIN/END markers
      if (!privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
        try {
          privateKey = Buffer.from(privateKey, "base64").toString("utf8");
        } catch (base64Error) {
          // If base64 decode fails, the key might be in a different format
          console.warn("Base64 decode failed, trying key as-is:", base64Error.message);
        }
      }

      // Third try: Ensure proper formatting
      if (!privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
        throw new Error("Private key format invalid - missing BEGIN PRIVATE KEY marker");
      }
      if (!privateKey.includes("-----END PRIVATE KEY-----")) {
        throw new Error("Private key format invalid - missing END PRIVATE KEY marker");
      }
    } catch (keyError) {
      console.error("Private key processing error:", keyError);
      throw new Error("Failed to process Firebase private key: " + keyError.message);
    }

    // Determine storage bucket name
    // Priority: command line arg > env var > default
    let storageBucket = customBucketName || process.env.REACT_APP_FIREBASE_STORAGE_BUCKET;
    
    // If bucket name ends with .firebaseapp.com, it's wrong - use .appspot.com instead
    if (storageBucket && storageBucket.endsWith('.firebaseapp.com')) {
      console.warn(`⚠️  Invalid bucket name "${storageBucket}" detected. Using default .appspot.com format.`);
      storageBucket = `${process.env.FIREBASE_PROJECT_ID}.appspot.com`;
    }
    
    // If no bucket specified, use default
    if (!storageBucket) {
      storageBucket = `${process.env.FIREBASE_PROJECT_ID}.appspot.com`;
    }
    
    if (customBucketName) {
      console.log(`📦 Using custom bucket from command line: ${storageBucket}`);
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
      databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
      storageBucket: storageBucket,
    });
    
    console.log(`📦 Using storage bucket: ${storageBucket}`);

    console.log('✅ Firebase Admin SDK initialized successfully.');
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin SDK:', error.message);
    console.error('Please ensure the following environment variables are set in your .env file:');
    console.error('- FIREBASE_PROJECT_ID');
    console.error('- FIREBASE_CLIENT_EMAIL');
    console.error('- FIREBASE_PRIVATE_KEY');
    process.exit(1);
  }
}

/**
 * Extract filename from URL
 */
function getFilenameFromUrl(url, itemName) {
  try {
    const urlPath = new URL(url).pathname;
    const filename = path.basename(urlPath);
    // Decode URL-encoded filename
    return decodeURIComponent(filename);
  } catch (error) {
    // If URL parsing fails, generate filename from item name
    const sanitized = itemName.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
    const ext = url.match(/\.(jpg|jpeg|png|gif|webp)$/i)?.[1] || 'jpg';
    return `${sanitized}.${ext}`;
  }
}

/**
 * Download image from URL
 */
async function downloadImage(url) {
  try {
    console.log(`  Downloading from: ${url}`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const buffer = await response.buffer();
    return buffer;
  } catch (error) {
    throw new Error(`Failed to download image: ${error.message}`);
  }
}

/**
 * Upload image to Firebase Storage
 */
async function uploadImage(bucket, filename, buffer, contentType) {
  const filePath = `store-images/${filename}`;
  const file = bucket.file(filePath);

  if (isDryRun) {
    console.log(`  [DRY RUN] Would upload to: ${filePath}`);
    return filePath;
  }

  await file.save(buffer, {
    metadata: {
      contentType: contentType || 'image/jpeg',
      metadata: {
        uploadedAt: new Date().toISOString(),
      }
    }
  });

  // Make the file publicly accessible
  await file.makePublic();

  return filePath;
}

/**
 * Check if file already exists in Firebase Storage
 */
async function fileExists(bucket, filename) {
  const filePath = `store-images/${filename}`;
  const file = bucket.file(filePath);
  const [exists] = await file.exists();
  return exists;
}

/**
 * Check if bucket exists and is accessible
 */
async function checkBucketAccess(bucket) {
  try {
    const [exists] = await bucket.exists();
    if (!exists) {
      throw new Error(`Bucket "${bucket.name}" does not exist. Please create it in Firebase Console first.`);
    }
    
    // Try to list files to verify access
    await bucket.getFiles({ maxResults: 1 });
    return true;
  } catch (error) {
    if (error.message.includes('does not exist')) {
      throw error;
    }
    throw new Error(`Cannot access bucket "${bucket.name}": ${error.message}`);
  }
}

/**
 * Main import function
 */
async function importStoreItems() {
  const storage = getStorage();
  const bucket = storage.bucket();
  const bucketName = bucket.name;

  console.log('\n📦 Importing Store Items to Firebase Storage');
  console.log('==========================================\n');
  console.log(`Storage Bucket: ${bucketName}`);
  console.log(`Mode: ${isDryRun ? 'DRY RUN (no changes will be made)' : 'LIVE (will upload files)'}\n`);

  // Check if bucket exists and is accessible
  if (!isDryRun) {
    try {
      console.log('🔍 Checking bucket access...');
      await checkBucketAccess(bucket);
      console.log('✅ Bucket is accessible\n');
    } catch (error) {
      console.error('\n❌ Bucket Access Error:', error.message);
      console.error('\n📋 To fix this:');
      console.error('1. Go to Firebase Console: https://console.firebase.google.com/');
      console.error(`2. Select your project: ${process.env.FIREBASE_PROJECT_ID}`);
      console.error('3. Go to Storage section');
      console.error('4. Click "Get Started" or "Create bucket"');
      console.error(`5. Use bucket name: ${bucketName}`);
      console.error('6. Choose your preferred location');
      console.error('\nAlternatively, if you have a different bucket name, specify it with:');
      console.error(`   node scripts/import-store-items.js --bucket=your-bucket-name\n`);
      process.exit(1);
    }
  }

  const metadata = {
    images: []
  };

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const item of originalStoreItems) {
    try {
      console.log(`\nProcessing: ${item.name} (${item.id})`);

      // Extract filename from URL
      const filename = getFilenameFromUrl(item.url, item.name);
      console.log(`  Filename: ${filename}`);

      // Check if file already exists
      const exists = await fileExists(bucket, filename);
      if (exists) {
        console.log(`  ⚠️  File already exists, skipping upload`);
        skipCount++;
      } else {
        // Download image
        const imageBuffer = await downloadImage(item.url);
        console.log(`  ✅ Downloaded ${(imageBuffer.length / 1024).toFixed(2)} KB`);

        // Determine content type
        const contentType = filename.match(/\.(jpg|jpeg)$/i) ? 'image/jpeg' :
                           filename.match(/\.png$/i) ? 'image/png' :
                           filename.match(/\.gif$/i) ? 'image/gif' :
                           filename.match(/\.webp$/i) ? 'image/webp' : 'image/jpeg';

        // Upload to Firebase Storage
        await uploadImage(bucket, filename, imageBuffer, contentType);
        console.log(`  ✅ Uploaded to Firebase Storage`);
        successCount++;
      }

      // Add to metadata
      metadata.images.push({
        id: item.id,
        name: item.name,
        description: '', // Original items didn't have descriptions
        theme: item.theme,
        filename: filename
      });

    } catch (error) {
      console.error(`  ❌ Error processing ${item.name}:`, error.message);
      errorCount++;
    }
  }

  // Create/update metadata file
  console.log(`\n📝 Creating image-metadata.json...`);
  if (isDryRun) {
    console.log(`  [DRY RUN] Would create metadata with ${metadata.images.length} images`);
    console.log(`  Metadata preview:`, JSON.stringify(metadata, null, 2));
  } else {
    const metadataPath = 'store-images/image-metadata.json';
    const metadataFile = bucket.file(metadataPath);
    const metadataContent = JSON.stringify(metadata, null, 2);
    
    await metadataFile.save(metadataContent, {
      metadata: {
        contentType: 'application/json',
      }
    });

    // Make metadata file publicly accessible
    await metadataFile.makePublic();
    console.log(`  ✅ Created image-metadata.json`);
  }

  // Summary
  console.log('\n==========================================');
  console.log('📊 Import Summary');
  console.log('==========================================');
  console.log(`✅ Successfully uploaded: ${successCount}`);
  console.log(`⚠️  Skipped (already exists): ${skipCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📝 Total items in metadata: ${metadata.images.length}`);
  console.log('\n');

  if (isDryRun) {
    console.log('ℹ️  This was a dry run. No files were actually uploaded.');
    console.log('   Run without --dry-run to perform the actual import.\n');
  } else {
    console.log('✅ Import completed!');
    console.log(`   Metadata file: gs://${bucketName}/store-images/image-metadata.json`);
    console.log(`   Images folder: gs://${bucketName}/store-images/\n`);
  }
}

// Run the import
importStoreItems()
  .then(() => {
    console.log('✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });

