const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4]\d|[01]?\d\d?)){3}$/)
);

export const registerServiceWorker = () => {
  if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

    if (isLocalhost) {
      fetch(swUrl, { headers: { 'Service-Worker': 'script' } })
        .then((response) => {
          const contentType = response.headers.get('content-type') || '';
          if (response.status === 404 || !contentType.includes('javascript')) {
            navigator.serviceWorker.ready.then((registration) => {
              registration.unregister();
            });
            return;
          }

          navigator.serviceWorker.register(swUrl).catch((error) => {
            console.warn('[serviceWorker] Registration failed:', error);
          });
        })
        .catch(() => {});
      return;
    }

    navigator.serviceWorker.register(swUrl).catch((error) => {
      console.warn('[serviceWorker] Registration failed:', error);
    });
  });
};
