import React, { useState } from 'react';
import { getFirestore } from 'firebase/firestore';
import { BookOpenText, SlidersHorizontal } from 'lucide-react';
import { Alert, LoadingRow, SectionCard, SectionHeader } from '../PortalUI';
import useFeatureSettings from '../../../hooks/useFeatureSettings';
import { updateFeatureSettings } from '../../../services/featureSettings';

const cx = (...classes) => classes.filter(Boolean).join(' ');

const ToggleSwitch = ({ id, checked, disabled, onChange, labelledBy, describedBy }) => (
  <button
    id={id}
    type="button"
    role="switch"
    aria-checked={checked}
    aria-labelledby={labelledBy}
    aria-describedby={describedBy}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={cx(
      'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-60',
      checked ? 'bg-blue-600' : 'bg-gray-300'
    )}
  >
    <span
      aria-hidden="true"
      className={cx(
        'inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform',
        checked ? 'translate-x-5' : 'translate-x-0.5'
      )}
    />
  </button>
);

/**
 * Admin-only app settings. Currently one runtime feature switch: AI story
 * problems on the student quiz results screen. Writes go to
 * artifacts/{appId}/settings/features (Firestore rules: admin-only writes).
 */
const SettingsSection = ({ appId, userId }) => {
  const { settings, loading, error } = useFeatureSettings({ appId });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [savedMessage, setSavedMessage] = useState(null);

  const handleToggleAiStory = async (nextValue) => {
    setSaving(true);
    setSaveError(null);
    setSavedMessage(null);
    try {
      await updateFeatureSettings({
        db: getFirestore(),
        appId,
        updates: { aiStoryEnabled: nextValue },
        userId,
      });
      setSavedMessage(nextValue ? 'AI story problems are now on for students.' : 'AI story problems are now off for students.');
    } catch (err) {
      console.error('[SettingsSection] Failed to update feature settings', err);
      setSaveError(err?.message || 'Could not save the setting.');
    } finally {
      setSaving(false);
    }
  };

  const aiStoryEnabled = settings.aiStoryEnabled === true;

  return (
    <div className="space-y-6">
      <SectionCard className="p-4 sm:p-6">
        <SectionHeader
          icon={SlidersHorizontal}
          title="Features"
          description="Turn optional features on or off for every student. Changes apply immediately."
        />

        <div className="mt-5 space-y-3">
          {error && (
            <Alert tone="warning">
              Couldn&apos;t load the current settings, so these features are treated as off. {error.message}
            </Alert>
          )}
          {saveError && <Alert>Couldn&apos;t save the setting: {saveError}</Alert>}
          {savedMessage && !saveError && <Alert tone="success">{savedMessage}</Alert>}

          {loading ? (
            <LoadingRow label="Loading settings..." />
          ) : (
            <div className="flex items-start justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50/60 p-4">
              <div className="flex min-w-0 items-start gap-3">
                <span className="hidden h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white text-blue-600 ring-1 ring-gray-200 sm:inline-flex">
                  <BookOpenText className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p id="setting-ai-story-label" className="text-sm font-semibold text-gray-900">
                    AI story problems
                  </p>
                  <p id="setting-ai-story-description" className="mt-0.5 text-sm text-gray-500">
                    Shows a &ldquo;Create a Story Problem&rdquo; button on the quiz results screen that
                    generates a word problem with AI (limited to one per topic per day).
                  </p>
                  <p className="mt-2 text-xs font-medium text-gray-600">
                    Status:{' '}
                    <span className={aiStoryEnabled ? 'text-green-700' : 'text-gray-700'}>
                      {aiStoryEnabled ? 'On' : 'Off'}
                    </span>
                  </p>
                </div>
              </div>
              <ToggleSwitch
                id="setting-ai-story"
                checked={aiStoryEnabled}
                disabled={saving}
                onChange={handleToggleAiStory}
                labelledBy="setting-ai-story-label"
                describedBy="setting-ai-story-description"
              />
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
};

export default SettingsSection;
