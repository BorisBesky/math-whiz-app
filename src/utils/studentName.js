const UID_LIKE_REGEX = /^[A-Za-z0-9]{20,40}$/;

const PLACEHOLDER_NAMES = new Set([
  'unnamed student',
  'young mathematician',
  'unknown',
  'student',
]);

const normalizeWhitespace = (value) => String(value || '').trim().replace(/\s+/g, ' ');

const isUidLike = (value) => UID_LIKE_REGEX.test(normalizeWhitespace(value));

const isPlaceholderName = (value) => PLACEHOLDER_NAMES.has(normalizeWhitespace(value).toLowerCase());

const shortId = (value, length = 6) => String(value || '').slice(0, length).toUpperCase();

const resolveFallbackName = (student = {}, fallback = 'Unnamed Student') => {
  const normalizedFallback = normalizeWhitespace(fallback).toLowerCase();
  if (normalizedFallback !== 'unnamed student') {
    return fallback;
  }

  const identifier = student.id || student.uid || student.studentId;
  if (!identifier) {
    return fallback;
  }

  return `Unnamed Student (${shortId(identifier)})`;
};

export const getStudentShortId = (student = {}, length = 6) => {
  const identifier = student.id || student.uid || student.studentId;
  if (!identifier) {
    return 'N/A';
  }
  return shortId(identifier, length);
};

const buildFullName = (student = {}) => {
  const first = normalizeWhitespace(student.firstName);
  const last = normalizeWhitespace(student.lastName);
  const full = `${first} ${last}`.trim();
  return full;
};

export const getStudentDisplayName = (student = {}, fallback = 'Unnamed Student') => {
  const candidates = [
    student.preferredName,
    student.displayName,
    student.studentName,
    student.name,
    student.fullName,
    buildFullName(student),
  ]
    .map(normalizeWhitespace)
    .filter(Boolean);

  const bestCandidate = candidates.find((candidate) => !isPlaceholderName(candidate) && !isUidLike(candidate));
  if (bestCandidate) {
    return bestCandidate;
  }

  return resolveFallbackName(student, fallback);
};

export const getStudentInitials = (student = {}) => {
  const displayName = getStudentDisplayName(student, '');
  if (displayName) {
    const parts = displayName.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return displayName.slice(0, 2).toUpperCase();
  }

  const email = normalizeWhitespace(student.email);
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }

  return 'ST';
};
