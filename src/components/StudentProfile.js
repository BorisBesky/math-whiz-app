import React, { useMemo, useState } from 'react';
import { Check, Mail, User, Users } from 'lucide-react';
import { updateEmail, updateProfile } from 'firebase/auth';
import { updateDoc } from 'firebase/firestore';
import { getUserDocRef } from '../utils/firebaseHelpers';

const normalizeClassGrade = (gradeValue) => {
  if (!gradeValue) return null;
  const normalized = String(gradeValue).trim().toUpperCase();
  if (normalized === 'G3' || normalized.includes('3')) return 'G3';
  if (normalized === 'G4' || normalized.includes('4')) return 'G4';
  return null;
};

const StudentProfile = ({
  user,
  userData,
  setUserData,
  selectedGrade,
  enrolledClasses = [],
  selectedQuizClassIds = [],
  chooseQuizClass,
  returnToTopics,
}) => {
  const [displayName, setDisplayName] = useState(
    userData?.displayName || user?.displayName || ''
  );
  const [email, setEmail] = useState(userData?.email || user?.email || '');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const activeClass = useMemo(() => (
    enrolledClasses.find((classItem) => selectedQuizClassIds.includes(classItem.id))
  ), [enrolledClasses, selectedQuizClassIds]);

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    if (!user) return;

    const trimmedName = displayName.trim();
    const trimmedEmail = email.trim();
    const userDocRef = getUserDocRef(user.uid);
    const updates = {
      displayName: trimmedName || 'Young Mathematician',
      email: trimmedEmail || null,
    };

    setSaving(true);
    setFeedback(null);

    try {
      if (trimmedName !== (user.displayName || '')) {
        await updateProfile(user, { displayName: updates.displayName });
      }

      if (!user.isAnonymous && trimmedEmail && trimmedEmail !== user.email) {
        await updateEmail(user, trimmedEmail);
      }

      if (userDocRef) {
        await updateDoc(userDocRef, updates);
      }

      setUserData((prev) => (prev ? { ...prev, ...updates } : prev));
      setFeedback({ type: 'success', message: 'Profile updated.' });
    } catch (error) {
      const needsRecentLogin = error?.code === 'auth/requires-recent-login';
      setFeedback({
        type: 'error',
        message: needsRecentLogin
          ? 'Sign out and sign back in before changing your email.'
          : (error?.message || 'Could not update profile.'),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-16 pb-20 px-4">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 text-center">
          <p className="text-xs font-bold uppercase tracking-wide text-brand-purple">
            Student Profile
          </p>
          <h1 className="font-display text-3xl font-bold text-gray-800">
            Account and Class Settings
          </h1>
        </div>

        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-card border border-gray-100 bg-white/90 p-5 shadow-card backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-100 text-brand-purple">
                <User size={22} aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-gray-800">
                  Student Info
                </h2>
                <p className="text-sm text-gray-500">
                  Update the name shown in Math Whiz.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <label className="block">
                <span className="mb-1 block text-sm font-bold text-gray-700">
                  Name
                </span>
                <input
                  type="text"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  className="w-full rounded-button border border-gray-200 bg-white px-4 py-3 text-gray-800 outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-purple-100"
                  placeholder="Young Mathematician"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-bold text-gray-700">
                  Email
                </span>
                <div className="flex items-center gap-2 rounded-button border border-gray-200 bg-white px-4 py-3 focus-within:border-brand-purple focus-within:ring-2 focus-within:ring-purple-100">
                  <Mail size={18} className="shrink-0 text-gray-400" aria-hidden="true" />
                  <input
                    type="email"
                    value={email}
                    disabled={user?.isAnonymous}
                    onChange={(event) => setEmail(event.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-gray-800 outline-none disabled:text-gray-400"
                    placeholder={user?.isAnonymous ? 'Create an account to add email' : 'student@example.com'}
                  />
                </div>
                {user?.isAnonymous && (
                  <p className="mt-1 text-xs text-gray-500">
                    Guest students can add email after creating an account.
                  </p>
                )}
              </label>

              {feedback && (
                <p className={`rounded-button px-3 py-2 text-sm font-semibold ${
                  feedback.type === 'success'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}>
                  {feedback.message}
                </p>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-button bg-brand-purple px-5 py-3 font-display font-bold text-white shadow-card transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          </section>

          <section className="rounded-card border border-gray-100 bg-white/90 p-5 shadow-card backdrop-blur-sm">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-100 text-green-700">
                  <Users size={22} aria-hidden="true" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-gray-800">
                    Class for Practice
                  </h2>
                  <p className="text-sm text-gray-500">
                    Topics and uploaded questions follow the selected class grade.
                  </p>
                </div>
              </div>
              <span className="self-start rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-brand-purple sm:self-center">
                {activeClass
                  ? `${normalizeClassGrade(activeClass.gradeLevel || activeClass.grade) || selectedGrade} active`
                  : `${selectedGrade} active`}
              </span>
            </div>

            {enrolledClasses.length > 0 ? (
              <div className="grid gap-3">
                {enrolledClasses.map((classItem) => {
                  const classGrade = normalizeClassGrade(classItem.gradeLevel || classItem.grade);
                  const isSelected = selectedQuizClassIds.includes(classItem.id);
                  return (
                    <button
                      key={classItem.id}
                      type="button"
                      onClick={() => chooseQuizClass?.(classItem.id, classGrade)}
                      className={`flex items-center justify-between gap-4 rounded-card border p-4 text-left transition ${
                        isSelected
                          ? 'border-brand-purple bg-purple-50 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-purple-200 hover:bg-purple-50/60'
                      }`}
                    >
                      <span className="min-w-0">
                        <span className={`block truncate font-display text-lg font-bold ${
                          isSelected ? 'text-brand-purple' : 'text-gray-800'
                        }`}>
                          {classItem.name || 'Unnamed class'}
                        </span>
                        <span className="mt-1 block text-sm font-semibold text-gray-500">
                          {classGrade || classItem.gradeLevel || classItem.grade || 'Grade N/A'}
                        </span>
                      </span>
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                        isSelected
                          ? 'border-brand-purple bg-brand-purple text-white'
                          : 'border-gray-200 bg-white text-transparent'
                      }`}>
                        <Check size={18} strokeWidth={3} aria-hidden="true" />
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-card border border-dashed border-gray-200 bg-gray-50 p-5 text-center">
                <p className="font-semibold text-gray-700">
                  No enrolled classes yet.
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Join a class to use teacher-uploaded questions and focus settings.
                </p>
              </div>
            )}
          </section>
        </div>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={returnToTopics}
            className="rounded-full border border-gray-200 bg-white/90 px-5 py-2.5 text-sm font-bold text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            Back to Topics
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
