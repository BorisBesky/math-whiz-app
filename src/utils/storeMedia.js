const VIDEO_EXTENSION_PATTERN = /\.(mp4|webm|mov)(?=[?#]|$)/i;

/**
 * True when a store item URL or filename should play as video, not a still image.
 * CSS background-image cannot play MP4/WebM, so callers must render a <video>.
 */
export function isVideoStoreMedia(urlOrFilename = '') {
  if (typeof urlOrFilename !== 'string' || !urlOrFilename) {
    return false;
  }

  try {
    const path = urlOrFilename.includes('://')
      ? new URL(urlOrFilename).pathname
      : urlOrFilename;
    return VIDEO_EXTENSION_PATTERN.test(path);
  } catch {
    return VIDEO_EXTENSION_PATTERN.test(urlOrFilename);
  }
}
