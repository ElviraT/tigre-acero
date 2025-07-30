// Service Worker para caché y funcionalidad offline
const CACHE_NAME = 'tigre-de-acero-v1';
const OFFLINE_URL = '/offline.html';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/css/main.css',
  '/js/main.js',
  '/images/logo.png',
  '/images/hero/slider1.png',
  '/favicon.ico',
  '/site.webmanifest',
  OFFLINE_URL
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierto');
        return cache.addAll(PRECACHE_URLS);
      })
  );
  self.skipWaiting();
});

// Estrategia: Cache First, luego red
self.addEventListener('fetch', event => {
  // Solo manejar solicitudes GET
  if (event.request.method !== 'GET') return;

  // Ignorar solicitudes de extensiones de Chrome
  if (event.request.url.includes('extension')) return;

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clonar la solicitud
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          response => {
            // Verificar si recibimos una respuesta válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clonar la respuesta
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        ).catch(() => {
          // Si falla la red y no hay caché, mostrar página offline
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
          return new Response('', { status: 408, statusText: 'Solicitud de red fallida' });
        });
      })
    );
});

// Limpieza de cachés antiguos
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});
