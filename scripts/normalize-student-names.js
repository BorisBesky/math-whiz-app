// Load environment variables from .env file
require('dotenv').config();

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const BATCH_LIMIT = 450;
const UID_LIKE_REGEX = /^[A-Za-z0-9]{20,40}$/;
const PLACEHOLDER_NAMES = new Set([
  'unnamed student',
  'young mathematician',
  'unknown',
  'student',
]);

function normalizeWhitespace(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function isUidLike(value) {
  return UID_LIKE_REGEX.test(normalizeWhitespace(value));
}

function isPlaceholderName(value) {
  return PLACEHOLDER_NAMES.has(normalizeWhitespace(value).toLowerCase());
}

function shortId(value, length = 6) {
  return String(value || '').slice(0, length).toUpperCase();
}

function parseArgs() {
  const args = process.argv.slice(2);
  const execute = args.includes('--execute') || args.includes('--apply');
  const appIdArg = args.find((arg) => arg.startsWith('--app-id='));
  const limitArg = args.find((arg) => arg.startsWith('--limit='));

  let limit;
  if (limitArg) {
    const rawLimit = Number(limitArg.split('=')[1]);
    if (Number.isNaN(rawLimit) || rawLimit <= 0) {
      console.error('❌ Invalid --limit value. Expected a positive integer.');
      process.exit(1);
    }
    limit = rawLimit;
  }

  return {
    execute,
    appId: appIdArg ? appIdArg.split('=')[1] : undefined,
    limit,
  };
}

function getProfilePathParts(path) {
  const parts = path.split('/');
  if (parts.length !== 6) {
    return null;
  }
  const [root, appId, usersSegment, userId, mathWhizSegment, profileId] = parts;
  if (root !== 'artifacts' || usersSegment !== 'users' || mathWhizSegment !== 'math_whiz_data' || profileId !== 'profile') {
    return null;
  }
  return { appId, userId };
}

function resolveStudentDisplayName(profile = {}) {
  const firstName = normalizeWhitespace(profile.firstName);
  const lastName = normalizeWhitespace(profile.lastName);
  const fullName = `${firstName} ${lastName}`.trim();

  const candidates = [
    profile.preferredName,
    profile.displayName,
    profile.studentName,
    profile.name,
    profile.fullName,
    fullName,
  ]
    .map(normalizeWhitespace)
    .filter(Boolean);

  const bestCandidate = candidates.find((candidate) => !isPlaceholderName(candidate) && !isUidLike(candidate));
  if (bestCandidate) {
    return bestCandidate;
  }

  return 'Unnamed Student';
}

function validateEnvironment() {
  const hasServiceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const hasIndividualFields = process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY;

  if (!hasServiceAccountJson && !hasIndividualFields) {
    console.error('❌ Missing Firebase configuration. Set FIREBASE_SERVICE_ACCOUNT_KEY or individual service account fields.');
    process.exit(1);
  }
}

function initializeFirebaseAdmin() {
  validateEnvironment();

  let credential;
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    credential = cert(serviceAccount);
  } else {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (privateKey && !privateKey.includes('BEGIN PRIVATE KEY')) {
      privateKey = Buffer.from(privateKey, 'base64').toString('utf8');
    }
    privateKey = privateKey.replace(/\\n/g, '\n');

    credential = cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    });
  }

  const app = initializeApp({
    credential,
    projectId: process.env.FIREBASE_PROJECT_ID,
  });

  return getFirestore(app);
}

async function normalizeStudentNames() {
  const { execute, appId: appIdFromArg, limit } = parseArgs();
  const appId = appIdFromArg || process.env.APP_ID || 'default-app-id';
  const db = initializeFirebaseAdmin();

  console.log(execute ? '🚀 EXECUTION MODE' : '🔍 DRY RUN MODE');
  console.log(`Target appId: ${appId}`);
  if (limit) {
    console.log(`Processing limit: ${limit}`);
  }
  console.log('Reading student profiles from collectionGroup(math_whiz_data)...\n');

  const stats = {
    inspected: 0,
    appMatched: 0,
    skippedNonStudentRole: 0,
    skippedNoChange: 0,
    toUpdate: 0,
    updated: 0,
    errors: 0,
  };

  const preview = [];
  const updates = [];

  const snap = await db.collectionGroup('math_whiz_data').get();

  for (const docSnap of snap.docs) {
    stats.inspected += 1;

    const parsed = getProfilePathParts(docSnap.ref.path);
    if (!parsed || parsed.appId !== appId) {
      continue;
    }

    stats.appMatched += 1;
    const profile = docSnap.data() || {};

    if (profile.role !== 'student') {
      stats.skippedNonStudentRole += 1;
      continue;
    }

    const normalized = resolveStudentDisplayName(profile);
    const isUnnamed = normalized === 'Unnamed Student';
    const normalizedDisplayName = isUnnamed
      ? `Unnamed Student (${shortId(parsed.userId)})`
      : normalized;

    const currentDisplayName = normalizeWhitespace(profile.displayName);
    const currentName = normalizeWhitespace(profile.name);
    const shouldUpdateDisplayName = currentDisplayName !== normalizedDisplayName;
    const shouldUpdateName = !isUnnamed && (!currentName || isPlaceholderName(currentName) || isUidLike(currentName));
    const shouldUpdateNeedsNameReview = profile.needsNameReview !== isUnnamed;

    if (!shouldUpdateDisplayName && !shouldUpdateName && !shouldUpdateNeedsNameReview) {
      stats.skippedNoChange += 1;
      continue;
    }

    stats.toUpdate += 1;

    const updatePayload = {
      displayName: normalizedDisplayName,
      needsNameReview: isUnnamed,
      normalizedNameAt: new Date(),
    };
    if (shouldUpdateName) {
      updatePayload.name = normalizedDisplayName;
    }

    updates.push({
      ref: docSnap.ref,
      payload: updatePayload,
      userId: parsed.userId,
      beforeDisplayName: profile.displayName || '',
      beforeName: profile.name || '',
      beforeNeedsNameReview: profile.needsNameReview,
      afterDisplayName: normalizedDisplayName,
      afterNeedsNameReview: isUnnamed,
    });

    if (preview.length < 25) {
      preview.push({
        userId: parsed.userId,
        beforeDisplayName: profile.displayName || '(empty)',
        beforeName: profile.name || '(empty)',
        beforeNeedsNameReview: profile.needsNameReview,
        afterDisplayName: normalizedDisplayName,
        afterNeedsNameReview: isUnnamed,
        updateNameField: shouldUpdateName,
      });
    }

    if (limit && updates.length >= limit) {
      break;
    }
  }

  console.log('Summary:');
  console.log(`- Inspected docs: ${stats.inspected}`);
  console.log(`- In target appId: ${stats.appMatched}`);
  console.log(`- Skipped non-students: ${stats.skippedNonStudentRole}`);
  console.log(`- Skipped unchanged: ${stats.skippedNoChange}`);
  console.log(`- Candidate updates: ${stats.toUpdate}`);

  if (preview.length > 0) {
    console.log('\nPreview of updates (first 25):');
    preview.forEach((item) => {
      console.log(`- ${item.userId}`);
      console.log(`    displayName: "${item.beforeDisplayName}" -> "${item.afterDisplayName}"`);
      console.log(`    name: "${item.beforeName}"${item.updateNameField ? ` -> "${item.afterDisplayName}"` : ' (unchanged)'}`);
      console.log(`    needsNameReview: ${item.beforeNeedsNameReview ?? '(missing)'} -> ${item.afterNeedsNameReview}`);
    });
  }

  if (!execute || updates.length === 0) {
    console.log('\nNo writes performed. Re-run with --execute to apply changes.');
    return;
  }

  console.log('\nApplying updates in batches...');
  for (let index = 0; index < updates.length; index += BATCH_LIMIT) {
    const chunk = updates.slice(index, index + BATCH_LIMIT);
    const batch = db.batch();

    chunk.forEach((entry) => {
      batch.set(entry.ref, entry.payload, { merge: true });
    });

    try {
      await batch.commit();
      stats.updated += chunk.length;
      console.log(`- Batch ${Math.floor(index / BATCH_LIMIT) + 1}: committed ${chunk.length} updates`);
    } catch (error) {
      stats.errors += chunk.length;
      console.error(`- Batch ${Math.floor(index / BATCH_LIMIT) + 1}: failed (${error.message})`);
    }
  }

  console.log('\nExecution complete:');
  console.log(`- Updated profiles: ${stats.updated}`);
  console.log(`- Failed updates: ${stats.errors}`);
}

normalizeStudentNames()
  .then(() => {
    console.log('\n✅ Done');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  });
