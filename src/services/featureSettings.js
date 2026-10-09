// Runtime, admin-controlled feature switches.
//
// Stored in Firestore at artifacts/{appId}/settings/features. Any signed-in
// user can read it; only admins can write it (see firestore/fs.rules). The
// story-problem Netlify function (gemini-proxy) reads the same document.
//
// Fallbacks are deliberately conservative: a missing document uses the
// defaults in src/config/features.json (all off), and a read error is treated
// as "disabled" so a feature never turns on by accident.
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import featureDefaults from '../config/features.json';

export const FEATURE_SETTINGS_COLLECTION = 'settings';
export const FEATURE_SETTINGS_DOC_ID = 'features';

export const DEFAULT_FEATURE_SETTINGS = Object.freeze({
  aiStoryEnabled: Boolean(featureDefaults.aiStoryEnabled),
});

export const DISABLED_FEATURE_SETTINGS = Object.freeze({
  aiStoryEnabled: false,
});

export const getFeatureSettingsRef = (db, appId) => (
  doc(db, 'artifacts', appId, FEATURE_SETTINGS_COLLECTION, FEATURE_SETTINGS_DOC_ID)
);

/** Normalise raw document data: only an explicit boolean `true` enables. */
export const normalizeFeatureSettings = (data) => {
  if (!data) return { ...DEFAULT_FEATURE_SETTINGS };
  return {
    aiStoryEnabled: data.aiStoryEnabled === true,
  };
};

export const subscribeFeatureSettings = ({ db, appId, onChange, onError }) => {
  if (!db || !appId) {
    onChange({ ...DISABLED_FEATURE_SETTINGS });
    return () => {};
  }
  return onSnapshot(
    getFeatureSettingsRef(db, appId),
    (snapshot) => {
      onChange(normalizeFeatureSettings(snapshot.exists() ? snapshot.data() : null));
    },
    (error) => {
      console.warn('[featureSettings] Could not read feature settings; treating features as disabled.', error?.message || error);
      onChange({ ...DISABLED_FEATURE_SETTINGS });
      if (onError) onError(error);
    }
  );
};

export const updateFeatureSettings = async ({ db, appId, updates, userId }) => {
  if (!db || !appId) throw new Error('Firestore is not initialized');
  const payload = {};
  if (typeof updates?.aiStoryEnabled === 'boolean') payload.aiStoryEnabled = updates.aiStoryEnabled;
  if (Object.keys(payload).length === 0) throw new Error('No valid feature settings to update');
  await setDoc(
    getFeatureSettingsRef(db, appId),
    { ...payload, updatedAt: serverTimestamp(), updatedBy: userId || null },
    { merge: true }
  );
};
