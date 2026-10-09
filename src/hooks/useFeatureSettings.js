import { useEffect, useState } from 'react';
import { getFirestore } from 'firebase/firestore';
import { DISABLED_FEATURE_SETTINGS, subscribeFeatureSettings } from '../services/featureSettings';

/**
 * Live view of the admin-controlled feature switches. Starts (and stays on
 * error) at "everything disabled" so gated UI never flashes on.
 */
const useFeatureSettings = ({ appId, enabled = true } = {}) => {
  const [settings, setSettings] = useState(DISABLED_FEATURE_SETTINGS);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled || !appId) {
      setSettings(DISABLED_FEATURE_SETTINGS);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    let db;
    try {
      db = getFirestore();
    } catch (err) {
      setSettings(DISABLED_FEATURE_SETTINGS);
      setError(err);
      setLoading(false);
      return undefined;
    }
    const unsubscribe = subscribeFeatureSettings({
      db,
      appId,
      onChange: (next) => {
        setSettings(next);
        setLoading(false);
      },
      onError: (err) => setError(err),
    });
    return unsubscribe;
  }, [appId, enabled]);

  return { settings, loading, error };
};

export default useFeatureSettings;
