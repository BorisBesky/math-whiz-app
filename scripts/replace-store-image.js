#!/usr/bin/env node
/**
 * Replace a Firebase Storage store-images file and update image-metadata.json
 * in place, preserving the existing item id so owned/active backgrounds keep
 * working.
 *
 * Usage:
 *   node scripts/replace-store-image.js \
 *     --match-filename=time-turner-adventure-1764857634923.jpg \
 *     --file=/path/to/welcomeintomathwhiz-magic.mp4
 *
 * Options:
 *   --match-filename=name   Existing metadata filename to replace (required unless --match-id)
 *   --match-id=id           Existing metadata id to replace (required unless --match-filename)
 *   --file=path             Local file to upload (required)
 *   --new-filename=name     Filename to store (defaults to the local file's basename)
 *   --dry-run               Preview without writing
 *   --bucket=name           Override storage bucket
 *   --keep-old              Leave the previous storage object in place
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const { getStorage } = require('firebase-admin/storage');

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const keepOld = args.includes('--keep-old');

function argValue(prefix) {
  const match = args.find((arg) => arg.startsWith(`${prefix}=`));
  return match ? match.slice(prefix.length + 1) : null;
}

const matchFilename = argValue('--match-filename');
const matchId = argValue('--match-id');
const localFile = argValue('--file');
const newFilenameOverride = argValue('--new-filename');
const customBucketName = argValue('--bucket');

const CONTENT_TYPES = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

function contentTypeFor(filename) {
  return CONTENT_TYPES[path.extname(filename).toLowerCase()] || 'application/octet-stream';
}

function initAdmin() {
  if (admin.apps.length) {
    return;
  }

  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('FIREBASE_PRIVATE_KEY environment variable is required');
  }

  privateKey = privateKey.replace(/\\n/g, '\n');
  if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
    privateKey = Buffer.from(privateKey, 'base64').toString('utf8');
  }
  if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
    throw new Error('Private key format invalid - missing BEGIN PRIVATE KEY marker');
  }

  let storageBucket =
    customBucketName || process.env.REACT_APP_FIREBASE_STORAGE_BUCKET;
  if (storageBucket && storageBucket.endsWith('.firebaseapp.com')) {
    storageBucket = `${process.env.FIREBASE_PROJECT_ID}.appspot.com`;
  }
  if (!storageBucket) {
    storageBucket = `${process.env.FIREBASE_PROJECT_ID}.appspot.com`;
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
    storageBucket,
  });

  console.log(`📦 Using storage bucket: ${storageBucket}`);
}

async function readMetadata(bucket) {
  const metadataFile = bucket.file('store-images/image-metadata.json');
  const [exists] = await metadataFile.exists();
  if (!exists) {
    throw new Error('store-images/image-metadata.json not found');
  }
  const [content] = await metadataFile.download();
  const metadata = JSON.parse(content.toString('utf-8'));
  if (!Array.isArray(metadata.images)) {
    throw new Error('image-metadata.json is missing an images array');
  }
  return { metadata, metadataFile };
}

async function replaceStoreImage() {
  if (!matchFilename && !matchId) {
    throw new Error('Provide --match-filename or --match-id');
  }
  if (!localFile) {
    throw new Error('Provide --file=/path/to/new-media');
  }
  if (!fs.existsSync(localFile)) {
    throw new Error(`Local file not found: ${localFile}`);
  }

  const newFilename = newFilenameOverride || path.basename(localFile);
  const buffer = fs.readFileSync(localFile);

  initAdmin();
  const bucket = getStorage().bucket();
  const { metadata, metadataFile } = await readMetadata(bucket);

  const imageIndex = metadata.images.findIndex((img) => {
    if (matchId && img.id === matchId) {
      return true;
    }
    if (matchFilename && img.filename === matchFilename) {
      return true;
    }
    return false;
  });

  if (imageIndex === -1) {
    const available = metadata.images
      .map((img) => `${img.id || '(no id)'}  ${img.filename || '(no filename)'}`)
      .join('\n  ');
    throw new Error(
      `No store image matched ${matchId || matchFilename}. Available:\n  ${available}`
    );
  }

  const existing = metadata.images[imageIndex];
  const oldFilename = existing.filename;
  const updated = {
    ...existing,
    filename: newFilename,
  };

  console.log('\n🎬 Replace store image');
  console.log('======================');
  console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Match: ${matchId || matchFilename}`);
  console.log(`Id (preserved): ${existing.id}`);
  console.log(`Name: ${existing.name}`);
  console.log(`Theme: ${existing.theme}`);
  console.log(`Old filename: ${oldFilename}`);
  console.log(`New filename: ${newFilename}`);
  console.log(`Local file: ${localFile} (${(buffer.length / 1024).toFixed(1)} KB)`);
  console.log(`Content-Type: ${contentTypeFor(newFilename)}`);

  if (isDryRun) {
    console.log('\n[DRY RUN] No files were uploaded or deleted.');
    return;
  }

  const newFile = bucket.file(`store-images/${newFilename}`);
  await newFile.save(buffer, {
    metadata: {
      contentType: contentTypeFor(newFilename),
      cacheControl: 'public, max-age=3600',
      metadata: {
        uploadedAt: new Date().toISOString(),
        replacedFrom: oldFilename || '',
      },
    },
  });
  await newFile.makePublic();

  metadata.images[imageIndex] = updated;
  await metadataFile.save(JSON.stringify(metadata, null, 2), {
    metadata: { contentType: 'application/json' },
  });
  await metadataFile.makePublic();

  if (!keepOld && oldFilename && oldFilename !== newFilename) {
    const oldFile = bucket.file(`store-images/${oldFilename}`);
    const [oldExists] = await oldFile.exists();
    if (oldExists) {
      await oldFile.delete();
      console.log(`🗑️  Deleted store-images/${oldFilename}`);
    }
  }

  const publicUrl = `https://storage.googleapis.com/${bucket.name}/store-images/${encodeURIComponent(newFilename)}`;
  console.log(`✅ Uploaded store-images/${newFilename}`);
  console.log(`🔗 ${publicUrl}`);
}

replaceStoreImage()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error(`\n❌ ${error.message}`);
    process.exit(1);
  });
