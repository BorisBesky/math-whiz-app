import React from 'react';
import { isVideoStoreMedia } from '../utils/storeMedia';

/**
 * Renders a store background as a still image or a looping muted video.
 */
const StoreMedia = ({
  url,
  alt = '',
  className = '',
  onClick,
  onError,
  loading = 'lazy',
  controls = false,
  autoPlay = true,
  preload = 'auto',
  ...rest
}) => {
  if (!url) {
    return null;
  }

  if (isVideoStoreMedia(url)) {
    return (
      <video
        src={url}
        className={className}
        autoPlay={autoPlay}
        loop
        muted
        playsInline
        preload={preload}
        controls={controls}
        onClick={onClick}
        aria-label={alt || undefined}
        {...rest}
      />
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      className={className}
      loading={loading}
      onClick={onClick}
      onError={onError}
      {...rest}
    />
  );
};

export default StoreMedia;
