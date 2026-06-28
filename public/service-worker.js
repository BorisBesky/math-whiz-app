const CACHE_NAME = 'math-whiz-student-shell-v1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/math-whiz-title.webp',
  '/wizard-logo-192.svg',
  '/wizard-logo-512.svg',
  '/images/default-background.webp',
];

const isSameOriginRequest = (request) => {
  try {
    return new URL(request.url).origin === self.location.origin;
  } catch {
    return false;
  }
};

const putInCache = async (request, response) => {
  if (!response || response.status !== 200 || response.type === 'opaque') {
    return;
  }

  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response.clone());
};

const networkFirstNavigation = async (request) => {
  try {
    const response = await fetch(request);
    await putInCache('/index.html', response);
    return response;
  } catch {
    return (
      (await caches.match(request)) ||
      (await caches.match('/index.html')) ||
      (await caches.match('/'))
    );
  }
};

const cacheFirstAsset = async (request) => {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  const response = await fetch(request);
  await putInCache(request, response);
  return response;
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => (
      Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      )
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET' || !isSameOriginRequest(request)) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (['script', 'style', 'font', 'image', 'worker'].includes(request.destination)) {
    event.respondWith(cacheFirstAsset(request));
  }
});
