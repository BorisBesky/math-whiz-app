/* global __app_id */
import { doc } from "firebase/firestore";
import { db } from '../firebase';

export const getTodayDateString = () => {
  const today = new Date();
  return today.toISOString().split("T")[0]; // YYYY-MM-DD format
};

export const getUserDocRef = (userId) => {
  const appId = typeof __app_id !== "undefined" ? __app_id : "default-app-id";
  if (!userId) return null;
  return doc(
    db,
    "artifacts",
    appId,
    "users",
    userId,
    "math_whiz_data",
    "profile"
  );
};

export const sanitizeTopicName = (topicName) => {
  if (!topicName || typeof topicName !== 'string') {
    return 'unknown_topic';
  }
  return topicName
    .replace(/[().&\s]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
};

export const sanitizeObject = (obj) => {
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

export const encodeTopicForPath = (topic) => encodeURIComponent(topic);

export const decodeTopicFromPath = (topicParam) => {
  try {
    return decodeURIComponent(topicParam || '');
  } catch {
    return topicParam || '';
  }
};
