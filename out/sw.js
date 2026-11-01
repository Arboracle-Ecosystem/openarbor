/**
 * Open Arbor v2.0 Offline Field Mode Service Worker (web/sw.js)
 * Cache-first offline execution engine for /demo/, /cases/, /ordinances/, /tools/, /mcp/, /spec/, and /methods/.
 * Resolves all pre-cached paths relative to self.registration.scope so it operates identically
 * at root (/) on openarbor.org and at subpath (/openarbor/) on GitHub Pages.
 */

const CACHE_NAME = 'openarbor-field-v2.0.0';

const PRECACHE_PATHS = [
  './',
  './index.html',
  './styles.css',
  './openarbor-bundle.js',
  './demo/index.html',
  './cases/index.html',
  './cases/austin-heritage-live-oak/index.html',
  './cases/georgetown-multistem-pecan/index.html',
  './cases/liberty-hill-post-oak/index.html',
  './cases/ashland-oregon-white-oak/index.html',
  './cases/medford-ponderosa-pine/index.html',
  './methods/index.html',
  './tools/index.html',
  './ordinances/index.html',
  './mcp/index.html',
  './spec/index.html',
  './data/ordinances/central_texas_ordinances.json',
  './data/ordinances/rogue_valley_oregon_ordinances.json',
  './data/catalog/forestry-tools.json',
  './schemas/municipal-ordinance.schema.json',
  './schemas/rca_assessment.schema.json',
  './schemas/rca_openbadge_v3.schema.json',
];

function resolveScopeUrls() {
  const scopeBase = self.registration && self.registration.scope ? self.registration.scope : self.location.href;
  return PRECACHE_PATHS.map((relPath) => new URL(relPath, scopeBase).href);
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const urls = resolveScopeUrls();
      await Promise.allSettled(
        urls.map(async (url) => {
          const response = await fetch(url, { cache: 'reload' });
          if (response && response.ok) {
            await cache.put(url, response.clone());
          }
        })
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key.startsWith('openarbor-')) {
            return caches.delete(key);
          }
          return undefined;
        })
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      // 1. Check exact URL match (ignoring search query / hash)
      let cached = await cache.match(request, { ignoreSearch: true });

      // 2. Directory index fallback (e.g. /demo/ -> /demo/index.html or /demo -> /demo/index.html)
      if (!cached) {
        if (url.pathname.endsWith('/')) {
          const indexUrl = new URL(`${url.pathname}index.html`, url.origin).href;
          cached = await cache.match(indexUrl, { ignoreSearch: true });
        } else if (!url.pathname.split('/').pop().includes('.')) {
          const indexUrl = new URL(`${url.pathname}/index.html`, url.origin).href;
          cached = await cache.match(indexUrl, { ignoreSearch: true });
        }
      }

      if (cached) {
        // Refresh cache asynchronously in background when online
        event.waitUntil(
          (async () => {
            try {
              const fresh = await fetch(request);
              if (fresh && fresh.ok) {
                await cache.put(request, fresh.clone());
              }
            } catch {
              // Offline: keep serving cached response
            }
          })()
        );
        return cached;
      }

      try {
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.ok) {
          await cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      } catch (err) {
        // Fallback to cached root index if navigation request fails offline
        const fallbackIndex = new URL('./index.html', self.registration.scope).href;
        const fallbackResp = await cache.match(fallbackIndex, { ignoreSearch: true });
        if (fallbackResp) return fallbackResp;
        throw err;
      }
    })()
  );
});
