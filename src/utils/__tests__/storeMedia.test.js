import { isVideoStoreMedia } from '../storeMedia';

describe('isVideoStoreMedia', () => {
  it('treats mp4, webm, and mov files as video', () => {
    expect(isVideoStoreMedia('welcomeintomathwhiz-magic.mp4')).toBe(true);
    expect(isVideoStoreMedia('https://storage.googleapis.com/bucket/store-images/clip.webm')).toBe(true);
    expect(isVideoStoreMedia('https://example.com/bg.MOV?generation=1')).toBe(true);
  });

  it('treats still image files as non-video', () => {
    expect(isVideoStoreMedia('time-turner-adventure-1764857634923.jpg')).toBe(false);
    expect(isVideoStoreMedia('https://storage.googleapis.com/bucket/store-images/scene.png')).toBe(false);
    expect(isVideoStoreMedia('poster.webp')).toBe(false);
    expect(isVideoStoreMedia('not-video.mp4.jpg')).toBe(false);
  });

  it('returns false for empty values', () => {
    expect(isVideoStoreMedia()).toBe(false);
    expect(isVideoStoreMedia('')).toBe(false);
    expect(isVideoStoreMedia(null)).toBe(false);
  });
});
