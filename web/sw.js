/**
 * Open Arbor v2.2 Offline Field Mode Service Worker (web/sw.js)
 * Cache-first offline execution engine for /demo/, /cases/, /ordinances/, /tools/, /mcp/, /spec/, and /methods/.
 * Resolves all pre-cached paths relative to self.registration.scope so it operates identically
 * at root (/) on openarbor.org and at subpath (/openarbor/) on GitHub Pages.
 */

const CACHE_NAME = 'openarbor-field-v2.5.0';

const PRECACHE_PATHS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-68.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './styles.css',
  './openarbor-bundle.js',
  './docs/index.html',
  './docs/docs.css',
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
  './schemas/rap_assessment.schema.json',
  './schemas/rap_openbadge_v3.schema.json',
  './schemas/rap_field_observation.schema.json',
  './schemas/rca_assessment.schema.json',
  './schemas/rca_openbadge_v3.schema.json',
  './agents/openarbor-steward/SKILL.md',
  './agents/openarbor-steward/AGENTS.md',
  './agents/openarbor-steward/claude-agent.md',
  './agents/openarbor-steward/hermes-steward.yaml',
  './agents/openarbor-steward/README.md',
  './LICENSE',
  './LICENSE-DATA',
  './NOTICE',
  './CONTRIBUTING.md',
  './docs/LAYERS.md',
    './docs/00_MASTER_BLUEPRINT.html',
    './docs/13_RAP_PRACTICE_SPECIFICATION_v1.html',
    './docs/13_RCA_PRACTICE_SPECIFICATION_v1.html',
    './docs/16_RAP_AND_RAPPER_ARCHITECTURE.html',
    './docs/CONTRIBUTING_ORDINANCES.html',
    './docs/DOCUMENTATION_ARCHITECTURE.html',
    './docs/LAYERS.html',
    './docs/START_QUICKSTART.html',
    './docs/START_WHAT_OPEN_ARBOR_IS.html',
    './docs/TOOLS_DIRECTORY.html',
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

async function lookupCachedOrFallback(cache, request, url) {
  let cached = await cache.match(request, { ignoreSearch: true });
  if (cached) return cached;

  if (url.pathname.endsWith('/')) {
    const indexUrl = new URL(`${url.pathname}index.html`, url.origin).href;
    cached = await cache.match(indexUrl, { ignoreSearch: true });
    if (cached) return cached;
  } else if (!url.pathname.split('/').pop().includes('.')) {
    const indexUrl = new URL(`${url.pathname}/index.html`, url.origin).href;
    const indexCached = await cache.match(indexUrl, { ignoreSearch: true });
    if (indexCached) {
      return Response.redirect(`${url.origin}${url.pathname}/${url.search}`, 301);
    }
  }

  if (request.mode === 'navigate') {
    const fallbackIndex = new URL('./index.html', self.registration.scope).href;
    const fallbackResp = await cache.match(fallbackIndex, { ignoreSearch: true });
    if (fallbackResp) return fallbackResp;
  }

  return null;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      // Network-first when online so new deploys (CSS, HTML, JS) take effect immediately on first load;
      // instant pre-cached fallback when offline in the field.
      try {
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.ok && !networkResponse.redirected) {
          await cache.put(request, networkResponse.clone());
          if (url.pathname.endsWith('/')) {
            const indexUrl = new URL(`${url.pathname}index.html`, url.origin).href;
            await cache.put(indexUrl, networkResponse.clone());
          }
        }
        return networkResponse;
      } catch (err) {
        const offlineMatch = await lookupCachedOrFallback(cache, request, url);
        if (offlineMatch) return offlineMatch;
        throw err;
      }
    })()
  );
});
