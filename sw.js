const CACHE_NAME = 'sla-static-v1';

const OFFLINE_URL = '/offline.html';

const PRECACHE_URLS = [
  '/offline.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-512-maskable.png'
];

const NETWORK_ONLY_PREFIXES = [
  '/api',
  '/auth',
  '/login',
  '/logout',
  '/register',
  '/signup',
  '/account',
  '/profile',
  '/cart',
  '/checkout',
  '/order',
  '/orders',
  '/payment',
  '/payments',
  '/admin',
  '/delete-account'
];

function isNetworkOnlyPath(pathname) {
  return NETWORK_ONLY_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  );
}

function isCacheableResponse(response) {
  return Boolean(
    response &&
      response.ok &&
      response.status === 200 &&
      response.type === 'basic' &&
      !response.redirected &&
      !response.headers.get('set-cookie')
  );
}

async function handleNavigationRequest(request) {
  try {
    return await fetch(request);
  } catch (error) {
    const offlinePage = await caches.match(OFFLINE_URL);
    if (offlinePage) return offlinePage;
    return new Response(
      '<!DOCTYPE html><html lang="en-IN"><head><meta charset="UTF-8"><title>You\'re Offline - S.L.A Fruit Shop</title></head><body><h1>You\'re offline</h1></body></html>',
      { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}

async function handleStaticRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const networkUpdate = fetch(request)
    .then((response) => {
      if (isCacheableResponse(response)) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => undefined);

  if (cached) return cached;

  const fresh = await networkUpdate;
  if (fresh) return fresh;
  return Response.error();
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('sla-') && key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (isNetworkOnlyPath(url.pathname)) return;

  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    request.destination === 'font' ||
    request.destination === 'manifest'
  ) {
    event.respondWith(handleStaticRequest(request));
  }
});
