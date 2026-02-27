import { useEffect, useRef } from 'react';

const AdBanner = ({ adSlot, format = 'horizontal', className = '' }) => {
  const adRef = useRef(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (pushed.current) return;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // Ad blocker or script failed to load — fail silently
    }
  }, []);

  if (process.env.NODE_ENV !== 'production') {
    return (
      <div className={`bg-gray-200 text-gray-500 text-xs flex items-center justify-center ${className}`}
        style={{ height: 50 }}>
        Ad placeholder (dev mode)
      </div>
    );
  }

  return (
    <ins
      ref={adRef}
      className={`adsbygoogle ${className}`}
      style={{ display: 'block' }}
      data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
      data-ad-slot={adSlot}
      data-ad-format={format}
      data-full-width-responsive="true"
    />
  );
};

export default AdBanner;
