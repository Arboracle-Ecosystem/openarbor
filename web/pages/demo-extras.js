/**
 * Open Arbor v2.0 Live Engine Demo Extras & Shared Theme Controller
 * Implements:
 *   1. initSharedThemeToggle() following modern color-scheme & localStorage guidance
 *   2. 3-Mode Workspace Switcher (Mode 1: Single-Tree, Mode 2: Multi-Tree Stand Union, Mode 3: Open Badges 3.0 Minter)
 *   3. Interactive Parcel Map (Leaflet 1.9.4 on-demand loader + OSM / ESRI Aerial / Optional Google Satellite)
 *   4. Multi-Tree Stand Union (1-ft spatial grid de-duplication + 5-Dimension Sanctuary Scorecard Rollup)
 *   5. Open Badges 3.0 Attestation Minter + Live Cryptographic SHA-256 Tamper-Detection Simulator
 */

import {
  calculateCRZ,
  calculateSRZ,
  unionRootZoneArea,
} from '../../src/core/rootZone.js';

import {
  renderSiteMapSVG,
} from '../../src/core/ordinanceEngine.js';

import {
  decodePlusCode,
  computeSanctuaryScorecardRollup,
  computeCanonicalSha256,
  mintOpenBadgeAttestation,
} from '../../src/core/rapEngine.js';

import {
  createFieldObservationRecord,
  verifyFieldObservationRecord,
  serializeObservationCohortJsonl,
  summarizeObservationCohort,
} from '../../src/core/fieldObservationLog.js';

import rapAssessmentSchema from '../../schemas/rap_assessment.schema.json';
import rapFieldObservationSchema from '../../schemas/rap_field_observation.schema.json';
import {
  ALL_SPECIES_PRESETS,
  DEFAULT_STAND_TREES,
  FIXED_PARITY_CASES,
} from '../presets.js';
import { getLatestFieldState } from '../app.js';
import { renderExpandableHashHtml } from './masterwork-core.js';
import {
  getUnitSystem,
  isImperialUnits,
  setUnitSystem,
  fmtDualFromMeters,
  fmtDualInCm,
  fmtDualAreaFromSqm,
  fmtDualParcelFromSqm,
  inToCm,
  cmToIn,
  ftToM,
  mToFt,
} from './unit-system.js';

const RIPARIAN_GROVE_STAND_TREES = [
  {
    tag: 'ATX-QV-101',
    species: 'Quercus virginiana (Live Oak)',
    dbh_inches: 34.0,
    x_ft: 0,
    y_ft: 0,
    case_id: 'case-1-austin-live-oak',
  },
  {
    tag: 'ATX-QV-102',
    species: 'Quercus virginiana (Live Oak)',
    dbh_inches: 28.0,
    x_ft: 24,
    y_ft: 12,
    case_id: 'case-1-austin-live-oak',
  },
  {
    tag: 'GTN-CI-204',
    species: 'Carya illinoinensis (Pecan)',
    dbh_inches: 31.0,
    x_ft: 46,
    y_ft: -6,
    case_id: 'case-2-georgetown-pecan',
  },
  {
    tag: 'GTN-CI-205',
    species: 'Carya illinoinensis (Pecan)',
    dbh_inches: 24.5,
    x_ft: 68,
    y_ft: 8,
    case_id: 'case-2-georgetown-pecan',
  },
  {
    tag: 'RIP-TD-301',
    species: 'Taxodium distichum (Bald Cypress)',
    dbh_inches: 36.0,
    x_ft: 34,
    y_ft: -32,
    case_id: 'case-1-austin-live-oak',
  },
  {
    tag: 'RIP-UC-302',
    species: 'Ulmus crassifolia (Cedar Elm)',
    dbh_inches: 19.5,
    x_ft: -18,
    y_ft: 20,
    case_id: 'case-2-georgetown-pecan',
  },
  {
    tag: 'RIP-QM-303',
    species: 'Quercus macrocarpa (Bur Oak)',
    dbh_inches: 29.0,
    x_ft: -26,
    y_ft: -16,
    case_id: 'case-1-austin-live-oak',
  },
  {
    tag: 'LHT-QS-309',
    species: 'Quercus stellata (Post Oak)',
    dbh_inches: 21.0,
    x_ft: 8,
    y_ft: -28,
    case_id: 'case-3-liberty-hill-post-oak',
  },
];

const round1 = (n) => Math.round(Number(n || 0) * 10) / 10;
const round2 = (n) => Math.round(Number(n || 0) * 100) / 100;

function labelSvgMarkup(svgHtml, labelText) {
  const raw = String(svgHtml || '').trim();
  if (!raw.startsWith('<svg')) return raw;
  const safe = String(labelText || 'Deterministic Root Protection Map')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  if (raw.includes('role="img"')) return raw;
  return raw.replace(
    /^<svg\b/,
    `<svg role="img" aria-label="${safe}"`
  ).replace(/>/, `><title>${safe}</title>`);
}

/**
 * Pointer-coordinate light-dismiss fallback for <dialog closedby="any">
 * on browsers where HTMLDialogElement.prototype.closedBy is not yet supported.
 * Checks pointerdown + pointerup against getBoundingClientRect() rather than event.target.
 */
export function bindDialogLightDismissFallback(dialog) {
  if (!dialog || typeof HTMLDialogElement === 'undefined') return;
  if ('closedBy' in HTMLDialogElement.prototype) return;
  if (dialog.dataset.lightDismissBound) return;
  dialog.dataset.lightDismissBound = 'true';

  const isOutside = (e) => {
    if (e.clientX === 0 && e.clientY === 0) return false;
    const rect = dialog.getBoundingClientRect();
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      (e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom)
    );
  };

  let pointerDownOutside = false;
  dialog.addEventListener('pointerdown', (e) => {
    pointerDownOutside = isOutside(e);
  });
  dialog.addEventListener('pointerup', (e) => {
    if (pointerDownOutside && isOutside(e)) {
      dialog.close();
    }
    pointerDownOutside = false;
  });
}

/**
 * Shared Theme Toggle across all Open Arbor pages.
 * Synchronizes <meta name="color-scheme">, localStorage('color-scheme'), and #oa-theme-toggle button text.
 */
export function initSharedThemeToggle() {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  let meta = document.querySelector('meta[name="color-scheme"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'color-scheme';
    meta.content = 'light dark';
    document.head.appendChild(meta);
  }

  const btn = document.getElementById('oa-theme-toggle');
  const mql =
    typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-color-scheme: dark)')
      : { matches: true, addEventListener: null };

  const getSystemScheme = () => (mql.matches ? 'dark' : 'light');

  const getStoredScheme = () => {
    try {
      return localStorage.getItem('color-scheme');
    } catch {
      return null;
    }
  };

  const applyThemeState = () => {
    const stored = getStoredScheme();
    const sys = getSystemScheme();
    const effective = stored === 'light' || stored === 'dark' ? stored : sys;
    meta.content = stored === 'light' || stored === 'dark' ? stored : 'light dark';
    document.documentElement.dataset.theme = effective;

    const themeColorHex = effective === 'dark' ? '#08110b' : '#f6f5ef';
    const themeColorMetas = document.querySelectorAll('meta[name="theme-color"]');
    if (themeColorMetas.length > 0) {
      themeColorMetas.forEach((m) => {
        if (!m.hasAttribute('media')) {
          m.content = themeColorHex;
        } else if (stored === 'light' || stored === 'dark') {
          m.content = themeColorHex;
        } else if (m.getAttribute('media')?.includes('dark')) {
          m.content = '#08110b';
        } else {
          m.content = '#f6f5ef';
        }
      });
    }

    if (btn) {
      const effective = stored === 'dark' || stored === 'light' ? stored : sys;
      btn.textContent = `Theme: ${effective === 'dark' ? 'Dark' : 'Light'}`;
    }
  };

  applyThemeState();

  if (typeof mql.addEventListener === 'function') {
    mql.addEventListener('change', () => applyThemeState());
  }

  if (btn && !btn.dataset.themeBound) {
    btn.dataset.themeBound = 'true';
    btn.addEventListener('click', () => {
      const stored = getStoredScheme();
      const sys = getSystemScheme();
      const currentEffective = stored === 'light' || stored === 'dark' ? stored : sys;
      const targetScheme = currentEffective === 'dark' ? 'light' : 'dark';

      try {
        if (targetScheme === sys) {
          localStorage.removeItem('color-scheme');
          meta.content = 'light dark';
        } else {
          localStorage.setItem('color-scheme', targetScheme);
          meta.content = targetScheme;
        }
      } catch {
        meta.content = targetScheme;
      }

      applyThemeState();
    });
  }

  // Root-level US Imperial / Metric Unit Selector (#oa-units-toggle)
  setUnitSystem(getUnitSystem(), false);
  const unitsBtn = document.getElementById('oa-units-toggle');
  if (unitsBtn && !unitsBtn.dataset.unitsBound) {
    unitsBtn.dataset.unitsBound = 'true';
    unitsBtn.addEventListener('click', () => {
      const nextUnits = getUnitSystem() === 'imperial' ? 'metric' : 'imperial';
      setUnitSystem(nextUnits, true);
    });
  }

  // Progressive-enhancement Web Install control (modern-web-guidance install-web-app)
  const installBtn = document.getElementById('oa-install-app-btn');
  const installStatus = document.getElementById('oa-install-status');
  if (installBtn && !installBtn.dataset.oaInstallBound) {
    installBtn.dataset.oaInstallBound = 'true';
    const isStandalone =
      (typeof window.matchMedia === 'function' &&
        window.matchMedia('(display-mode: standalone)').matches) ||
      window.navigator?.standalone === true;

    const markInstallUnavailable = (msg) => {
      installBtn.setAttribute('aria-disabled', 'true');
      installBtn.textContent = 'Installed';
      if (installStatus && msg) {
        installStatus.textContent = msg;
      }
    };

    if (!isStandalone) {
      if (typeof navigator !== 'undefined' && 'install' in navigator && typeof navigator.install === 'function') {
        installBtn.hidden = false;
        installBtn.addEventListener('click', async () => {
          if (installBtn.getAttribute('aria-disabled') === 'true') return;
          try {
            await navigator.install();
            if (installStatus) {
              installStatus.textContent = 'Open Arbor field instrument installation initiated.';
            }
          } catch (err) {
            if (err && err.name !== 'AbortError' && installStatus) {
              installStatus.textContent = 'App installation could not be completed right now.';
            }
          }
        });
      } else {
        let deferredInstallPrompt = null;
        window.addEventListener('beforeinstallprompt', (event) => {
          // Do not suppress Android Chrome's native Richer Install UI bottom prompt;
          // also surface our explicit in-header #oa-install-app-btn control.
          deferredInstallPrompt = event;
          installBtn.hidden = false;
          installBtn.classList.remove('btn-secondary');
          installBtn.classList.add('btn-primary');
          installBtn.removeAttribute('aria-disabled');
          installBtn.textContent = 'Install App';
        });

        installBtn.addEventListener('click', async () => {
          if (!deferredInstallPrompt || installBtn.getAttribute('aria-disabled') === 'true') {
            return;
          }
          const promptEvent = deferredInstallPrompt;
          deferredInstallPrompt = null;
          installBtn.setAttribute('aria-disabled', 'true');
          try {
            await promptEvent.prompt();
            const choice = await promptEvent.userChoice;
            if (choice && choice.outcome === 'accepted') {
              markInstallUnavailable('Open Arbor installed for offline field work.');
            } else {
              installBtn.removeAttribute('aria-disabled');
              if (installStatus) {
                installStatus.textContent = 'Install prompt dismissed. Refresh later to install again.';
              }
            }
          } catch {
            installBtn.removeAttribute('aria-disabled');
            if (installStatus) {
              installStatus.textContent = 'Install prompt unavailable.';
            }
          }
        });
      }

      window.addEventListener('appinstalled', () => {
        markInstallUnavailable('Open Arbor installed for offline field work.');
      });
    }
  }

  // Polite Offline / Online Field Mode Indicator Pill
  const themeControl = document.querySelector('.oa-theme-control');
  if (themeControl && !document.getElementById('oa-offline-pill')) {
    const offlinePill = document.createElement('span');
    offlinePill.id = 'oa-offline-pill';
    offlinePill.className = 'oa-offline-pill';
    offlinePill.setAttribute('role', 'status');
    offlinePill.setAttribute('aria-live', 'polite');
    offlinePill.hidden = typeof navigator !== 'undefined' ? navigator.onLine !== false : true;
    offlinePill.textContent = offlinePill.hidden ? '' : 'Offline Field Cache';
    themeControl.prepend(offlinePill);

    const syncConnectivity = () => {
      const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
      offlinePill.hidden = !isOffline;
      offlinePill.textContent = isOffline ? 'Offline Field Cache' : '';
    };
    window.addEventListener('offline', syncConnectivity);
    window.addEventListener('online', syncConnectivity);
  }

  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    const hadController = Boolean(navigator.serviceWorker.controller);
    let reloadingForSw = false;
    if (hadController) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!reloadingForSw) {
          reloadingForSw = true;
          window.location.reload();
        }
      });
    }
    window.addEventListener('load', () => {
      const swUrl = new URL('./sw.js', import.meta.url).pathname;
      navigator.serviceWorker
        .register(swUrl, { updateViaCache: 'none' })
        .then((reg) => reg.update().catch(() => {}))
        .catch(() => {});
    });
  }
}

/**
 * Determine ecological tier badge for a 0 to 100 Sanctuary Scorecard score.
 */
function getEcologicalTier(score) {
  const s = Number(score) || 0;
  if (s >= 80) {
    return { label: 'Regenerative Sanctuary', badgeClass: 'badge-protected' };
  }
  if (s >= 60) {
    return { label: 'Functional Canopy', badgeClass: 'badge-heritage' };
  }
  if (s >= 40) {
    return { label: 'Transitional Stand', badgeClass: 'badge-warn' };
  }
  return { label: 'Degraded Site', badgeClass: 'badge-danger' };
}

/**
 * Dynamically load Leaflet 1.9.4 CSS and JS on demand when switching to Interactive Parcel Map.
 */
let leafletLoadPromise = null;
function ensureLeafletLoaded() {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window environment'));
  if (window.L) return Promise.resolve(window.L);
  if (leafletLoadPromise) return leafletLoadPromise;

  leafletLoadPromise = new Promise((resolve, reject) => {
    const cssId = 'oa-leaflet-css';
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.crossOrigin = '';
    script.onload = () => {
      if (window.L) resolve(window.L);
      else reject(new Error('Leaflet loaded without global L'));
    };
    script.onerror = () => {
      leafletLoadPromise = null;
      reject(new Error('Failed to load Leaflet 1.9.4 from CDN'));
    };
    document.head.appendChild(script);
  });

  return leafletLoadPromise;
}

/**
 * Initialize Mode 1 Spatial Map Switcher, Mode 2 Stand Union Builder, and Mode 3 Open Badges Minter.
 */
export function initDemoExtrasUI() {
  if (typeof document === 'undefined') return;

  const modeSingleEl = document.getElementById('demo-mode-single');
  const modeStandEl = document.getElementById('demo-mode-stand');
  const modeBadgeEl = document.getElementById('demo-mode-badge');
  const modeButtons = document.querySelectorAll('[data-demo-mode]');

  let activeMode = 'single';
  let activeMapLayerMode = 'svg';
  let sessionGmapsApiKey = '';
  let leafletMap = null;
  let leafletTileLayer = null;
  let leafletVectorGroup = null;

  // 1. Mode Switcher (Mode 1: Single, Mode 2: Stand, Mode 3: Badge)
  if (modeButtons.length > 0) {
    modeButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.demoMode || 'single';
        activeMode = mode;

        modeButtons.forEach((b) => {
          const isMatch = b.dataset.demoMode === mode;
          b.classList.toggle('active', isMatch);
          b.setAttribute('aria-selected', isMatch ? 'true' : 'false');
        });

        if (modeSingleEl) modeSingleEl.hidden = mode !== 'single';
        if (modeStandEl) modeStandEl.hidden = mode !== 'stand';
        if (modeBadgeEl) modeBadgeEl.hidden = mode !== 'badge';

        if (mode === 'stand') {
          renderStandUnionAndScorecard();
        } else if (mode === 'badge') {
          mintAndRenderOpenBadge();
        } else if (mode === 'single' && activeMapLayerMode === 'leaflet') {
          refreshLeafletParcelMap();
        }
      });
    });
  }

  // 2. Spatial Map Layer Switcher inside Output A (SVG CAD vs. Interactive Parcel Map)
  const btnMapSvg = document.getElementById('btn-map-mode-svg');
  const btnMapLeaflet = document.getElementById('btn-map-mode-leaflet');
  const svgMapContainer = document.getElementById('svg-map-container');
  const parcelMapPanel = document.getElementById('parcel-map-panel');
  const selectTileLayer = document.getElementById('select-parcel-tile-layer');
  const inputGmapsKey = document.getElementById('input-gmaps-api-key');
  const coordsReadout = document.getElementById('parcel-coords-readout');
  const parcelStatus = document.getElementById('parcel-map-status');

  function setSpatialMapMode(mode) {
    activeMapLayerMode = mode;
    if (btnMapSvg) {
      btnMapSvg.classList.toggle('active', mode === 'svg');
      btnMapSvg.setAttribute('aria-selected', mode === 'svg' ? 'true' : 'false');
    }
    if (btnMapLeaflet) {
      btnMapLeaflet.classList.toggle('active', mode === 'leaflet');
      btnMapLeaflet.setAttribute('aria-selected', mode === 'leaflet' ? 'true' : 'false');
    }
    if (svgMapContainer) svgMapContainer.hidden = mode !== 'svg';
    if (parcelMapPanel) parcelMapPanel.hidden = mode !== 'leaflet';
    if (mode === 'leaflet') {
      refreshLeafletParcelMap();
    }
  }

  btnMapSvg?.addEventListener('click', () => setSpatialMapMode('svg'));
  btnMapLeaflet?.addEventListener('click', () => setSpatialMapMode('leaflet'));

  inputGmapsKey?.addEventListener('input', () => {
    sessionGmapsApiKey = inputGmapsKey.value.trim();
    if (activeMapLayerMode === 'leaflet' && selectTileLayer?.value === 'gmaps') {
      refreshLeafletParcelMap();
    }
  });

  selectTileLayer?.addEventListener('change', () => {
    if (activeMapLayerMode === 'leaflet') {
      refreshLeafletParcelMap();
    }
  });

  async function refreshLeafletParcelMap() {
    const canvas = document.getElementById('leaflet-map-canvas');
    if (!canvas) return;

    const { latestAssessment, latestResult } = getLatestFieldState();
    const assessment = latestAssessment || FIXED_PARITY_CASES[0].assessment;
    const sb = assessment.structural_baseline || {};
    const rh = assessment.rhizosphere_and_root_collar || {};
    const decoded = decodePlusCode(sb.plus_code_global) || { lat: 30.2672, lng: -97.7431 };

    if (coordsReadout) {
      coordsReadout.value = `${decoded.lat.toFixed(4)}, ${decoded.lng.toFixed(4)} (${sb.plus_code_global || '86247784+VP'})`;
    }

    try {
      const L = await ensureLeafletLoaded();
      if (!leafletMap) {
        leafletMap = L.map(canvas).setView([decoded.lat, decoded.lng], 19);
        leafletVectorGroup = L.layerGroup().addTo(leafletMap);
      } else {
        leafletMap.setView([decoded.lat, decoded.lng], 19);
        setTimeout(() => leafletMap.invalidateSize(), 60);
      }

      if (leafletTileLayer) {
        leafletMap.removeLayer(leafletTileLayer);
      }

      const layerChoice = selectTileLayer?.value || 'osm';
      if (layerChoice === 'esri') {
        leafletTileLayer = L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          {
            maxZoom: 20,
            attribution: 'Tiles &copy; Esri, USGS, USDA NAIP',
          }
        ).addTo(leafletMap);
      } else if (layerChoice === 'gmaps') {
        const keyParam = sessionGmapsApiKey ? `&key=${encodeURIComponent(sessionGmapsApiKey)}` : '';
        leafletTileLayer = L.tileLayer(
          `https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}${keyParam}`,
          {
            maxZoom: 21,
            attribution: 'Map data &copy; Google Satellite',
          }
        ).addTo(leafletMap);
      } else {
        leafletTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 20,
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(leafletMap);
      }

      leafletVectorGroup.clearLayers();

      const dbhIn = (Number(sb.dbh_cm) || 76.2) / 2.54;
      const crzMeters = latestResult?.rootZones?.crz?.radius_meters || calculateCRZ(dbhIn, 1.0).radius_meters;
      const tpzMeters = latestResult?.rootZones?.tpzUs115?.radius_meters || round2(crzMeters * 1.5);
      const srzMeters =
        latestResult?.rootZones?.srz?.radius_meters ||
        calculateSRZ((Number(rh.root_flare_diameter_cm) || 90) / 2.54, dbhIn).radius_meters;

      const geoFeature = latestResult?.geojson?.features?.[0];
      const lat = geoFeature?.geometry?.coordinates?.[1] ?? decoded.lat;
      const lng = geoFeature?.geometry?.coordinates?.[0] ?? decoded.lng;

      // TIZ / 1.5x TPZ outer circle
      L.circle([lat, lng], {
        radius: tpzMeters,
        color: '#e9c46a',
        weight: 2,
        dashArray: '6, 4',
        fillColor: '#e9c46a',
        fillOpacity: 0.08,
      })
        .bindPopup(
          `<strong>${sb.tree_tag || 'Tree'} Tree Influence Zone (TIZ / TPZ 1.5x)</strong><br>Radius: ${fmtDualFromMeters(tpzMeters)}`
        )
        .addTo(leafletVectorGroup);

      // CRZ 1.0x circle
      L.circle([lat, lng], {
        radius: crzMeters,
        color: '#52b788',
        weight: 2.5,
        fillColor: '#52b788',
        fillOpacity: 0.18,
      })
        .bindPopup(
          `<strong>${sb.tree_tag || 'Tree'} Critical Root Zone (CRZ)</strong><br>Radius: ${fmtDualFromMeters(crzMeters)}<br>Species: <em>${sb.species_scientific || 'Quercus virginiana'}</em>`
        )
        .addTo(leafletVectorGroup);

      // SRZ inner windthrow plate circle
      L.circle([lat, lng], {
        radius: srzMeters,
        color: '#e63946',
        weight: 2,
        dashArray: '4, 4',
        fillColor: '#e63946',
        fillOpacity: 0.25,
      })
        .bindPopup(
          `<strong>${sb.tree_tag || 'Tree'} Structural Root Zone (AS 4970 SRZ)</strong><br>Radius: ${fmtDualFromMeters(srzMeters)}`
        )
        .addTo(leafletVectorGroup);

      L.circleMarker([lat, lng], {
        radius: 5,
        color: '#ffffff',
        fillColor: '#2d6a4f',
        fillOpacity: 1,
      })
        .bindPopup(
          `<strong>${sb.tree_tag || 'Tree'} (${sb.species_common || 'Live Oak'})</strong><br>DBH: ${fmtDualInCm(dbhIn, sb.dbh_cm)}<br>Plus Code: <code>${sb.plus_code_global}</code>`
        )
        .addTo(leafletVectorGroup);

      if (parcelStatus) {
        parcelStatus.textContent = `Rendered OGC CRS84 GeoJSON rings at (${lat.toFixed(4)}, ${lng.toFixed(4)}): SRZ = ${fmtDualFromMeters(srzMeters)}, CRZ = ${fmtDualFromMeters(crzMeters)}, TIZ/TPZ = ${fmtDualFromMeters(tpzMeters)}.`;
      }
    } catch (err) {
      if (parcelStatus) {
        parcelStatus.textContent = `Interactive map notice: ${err.message}. Use the Deterministic SVG CAD Map for offline vector inspection.`;
      }
    }
  }

  // Listen for single-tree form updates from app.js
  window.addEventListener('openarbor:field-updated', () => {
    if (activeMode === 'single' && activeMapLayerMode === 'leaflet') {
      refreshLeafletParcelMap();
    }
  });

  // =========================================================================
  // 3. MODE 2: MULTI-TREE STAND UNION & SANCTUARY SCORECARD ROLLUP
  // =========================================================================
  let standTrees = JSON.parse(JSON.stringify(DEFAULT_STAND_TREES));
  let canonicalStandParcelSqm = 4047;
  const standTableEl = document.getElementById('stand-builder-table');
  const standTbody = document.getElementById('stand-builder-tbody');
  const thStandDbh = document.getElementById('th-stand-dbh');
  const thStandX = document.getElementById('th-stand-x');
  const thStandY = document.getElementById('th-stand-y');
  const btnStandAdd = document.getElementById('btn-stand-add-tree');
  const btnStandReset = document.getElementById('btn-stand-reset');
  const btnStandLoadGrove = document.getElementById('btn-stand-load-grove');
  const inputStandParcelSqm = document.getElementById('input-stand-parcel-sqm');
  const labelStandParcel = document.getElementById('label-stand-parcel');
  const hintStandParcel = document.getElementById('hint-stand-parcel');

  function syncStandParcelInputUI() {
    if (!inputStandParcelSqm) return;
    const imp = isImperialUnits();
    if (imp) {
      if (labelStandParcel) labelStandParcel.textContent = 'Parcel Footprint Area (acres)';
      if (hintStandParcel) {
        hintStandParcel.textContent =
          'Default: 1.00 acre (43,560 sq ft / 4,047 m2) for Sanctuary Scorecard rollup';
      }
      inputStandParcelSqm.min = '0.02';
      inputStandParcelSqm.max = '250';
      inputStandParcelSqm.step = '0.05';
      inputStandParcelSqm.value = String(round2(canonicalStandParcelSqm / 4046.8564224));
    } else {
      if (labelStandParcel) labelStandParcel.textContent = 'Parcel Footprint Area (m2)';
      if (hintStandParcel) {
        hintStandParcel.textContent =
          'Default: 4,047 m2 (1.00 acre / 43,560 sq ft) for Sanctuary Scorecard rollup';
      }
      inputStandParcelSqm.min = '100';
      inputStandParcelSqm.max = '1000000';
      inputStandParcelSqm.step = '50';
      inputStandParcelSqm.value = String(Math.round(canonicalStandParcelSqm));
    }
  }

  syncStandParcelInputUI();

  function renderStandTableRows() {
    if (!standTbody) return;
    const imp = isImperialUnits();
    const dbhColLabel = imp ? 'DBH (in)' : 'DBH (cm)';
    const xColLabel = imp ? 'Local X (ft)' : 'Local X (m)';
    const yColLabel = imp ? 'Local Y (ft)' : 'Local Y (m)';

    if (thStandDbh) thStandDbh.textContent = dbhColLabel;
    if (thStandX) thStandX.textContent = xColLabel;
    if (thStandY) thStandY.textContent = yColLabel;
    if (standTableEl) {
      standTableEl.style.setProperty('--label-3', `'${dbhColLabel}'`);
      standTableEl.style.setProperty('--label-4', `'${xColLabel}'`);
      standTableEl.style.setProperty('--label-5', `'${yColLabel}'`);
    }

    const caseOptions = FIXED_PARITY_CASES.map(
      (c) => `<option value="${c.id}">${c.label}</option>`
    ).join('');

    standTbody.innerHTML = standTrees
      .map((t, idx) => {
        const presetValues = ALL_SPECIES_PRESETS.map(
          (s) => `${s.scientific} (${s.common})`
        );
        const hasCurrentSpecies = presetValues.includes(t.species);
        const speciesOpts = ALL_SPECIES_PRESETS.map((s) => {
          const val = `${s.scientific} (${s.common})`;
          const sel = val === t.species ? ' selected' : '';
          return `<option value="${val}"${sel}>${s.common} (${s.scientific})</option>`;
        }).join('');

        const dbhDisplay = imp ? t.dbh_inches : inToCm(t.dbh_inches, 1);
        const xDisplay = imp ? t.x_ft : ftToM(t.x_ft, 2);
        const yDisplay = imp ? t.y_ft : ftToM(t.y_ft, 2);
        const dbhMax = imp ? '200' : '508';
        const xyBound = imp ? '500' : '152';
        const xyStep = imp ? '1' : '0.5';

        return `
        <tr data-stand-idx="${idx}">
          <td>
            <input type="text" class="stand-input-tag" value="${t.tag}" aria-label="Tree Tag row ${idx + 1}">
          </td>
          <td>
            <select class="stand-input-species" aria-label="Species row ${idx + 1}">
              ${hasCurrentSpecies ? '' : `<option value="${t.species}" selected>${t.species}</option>`}
              ${speciesOpts}
            </select>
          </td>
          <td>
            <input type="number" class="stand-input-dbh" min="1" max="${dbhMax}" step="0.5" value="${dbhDisplay}" aria-label="${dbhColLabel} row ${idx + 1}">
          </td>
          <td>
            <input type="number" class="stand-input-x" min="-${xyBound}" max="${xyBound}" step="${xyStep}" value="${xDisplay}" aria-label="${xColLabel} row ${idx + 1}">
          </td>
          <td>
            <input type="number" class="stand-input-y" min="-${xyBound}" max="${xyBound}" step="${xyStep}" value="${yDisplay}" aria-label="${yColLabel} row ${idx + 1}">
          </td>
          <td>
            <select class="stand-input-case" aria-label="Diagnostic template row ${idx + 1}">
              ${caseOptions.replace(`value="${t.case_id}"`, `value="${t.case_id}" selected`)}
            </select>
          </td>
          <td>
            <div class="oa-stand-row-actions">
              <button type="button" class="btn btn-secondary btn-xs btn-stand-clone" data-clone-idx="${idx}">Clone</button>
              <button type="button" class="btn btn-outline btn-xs btn-stand-remove" data-remove-idx="${idx}" ${standTrees.length <= 1 ? 'disabled' : ''}>Remove</button>
            </div>
          </td>
        </tr>
      `;
      })
      .join('');
  }

  const handleStandRowEdit = (e) => {
    const row = e.target.closest('tr[data-stand-idx]');
    if (!row) return;
    const idx = Number(row.dataset.standIdx);
    const item = standTrees[idx];
    if (!item) return;

    const imp = isImperialUnits();
    const rawDbh = Number(row.querySelector('.stand-input-dbh')?.value) || (imp ? 12 : 30.5);
    const rawX = Number(row.querySelector('.stand-input-x')?.value) || 0;
    const rawY = Number(row.querySelector('.stand-input-y')?.value) || 0;

    item.tag = row.querySelector('.stand-input-tag')?.value.trim() || `T-${idx + 1}`;
    item.species = row.querySelector('.stand-input-species')?.value || item.species;
    item.dbh_inches = Math.max(1, imp ? rawDbh : cmToIn(rawDbh, 2));
    item.x_ft = imp ? rawX : mToFt(rawX, 2);
    item.y_ft = imp ? rawY : mToFt(rawY, 2);
    item.case_id = row.querySelector('.stand-input-case')?.value || FIXED_PARITY_CASES[0].id;

    renderStandUnionOutputs();
  };

  standTbody?.addEventListener('input', handleStandRowEdit);
  standTbody?.addEventListener('change', handleStandRowEdit);

  standTbody?.addEventListener('click', (e) => {
    const cloneBtn = e.target.closest('.btn-stand-clone');
    if (cloneBtn) {
      const idx = Number(cloneBtn.dataset.cloneIdx);
      const source = standTrees[idx];
      if (source) {
        const nextNum = standTrees.length + 1;
        standTrees.splice(idx + 1, 0, {
          ...JSON.parse(JSON.stringify(source)),
          tag: `${source.tag}-C${nextNum}`,
          x_ft: Number(source.x_ft || 0) + 12,
          y_ft: Number(source.y_ft || 0) + 8,
        });
        renderStandUnionAndScorecard();
      }
      return;
    }

    const rmBtn = e.target.closest('.btn-stand-remove');
    if (!rmBtn) return;
    const idx = Number(rmBtn.dataset.removeIdx);
    if (standTrees.length > 1 && idx >= 0 && idx < standTrees.length) {
      standTrees.splice(idx, 1);
      renderStandUnionAndScorecard();
    }
  });

  btnStandAdd?.addEventListener('click', () => {
    const nextNum = standTrees.length + 1;
    standTrees.push({
      tag: `ATX-QV-10${nextNum}`,
      species: 'Quercus virginiana (Live Oak)',
      dbh_inches: 24.0,
      x_ft: (nextNum - 1) * 14,
      y_ft: nextNum % 2 === 0 ? 12 : -10,
      case_id: 'case-1-austin-live-oak',
    });
    renderStandUnionAndScorecard();
  });

  btnStandReset?.addEventListener('click', () => {
    standTrees = JSON.parse(JSON.stringify(DEFAULT_STAND_TREES));
    canonicalStandParcelSqm = 4047;
    syncStandParcelInputUI();
    renderStandUnionAndScorecard();
  });

  btnStandLoadGrove?.addEventListener('click', () => {
    standTrees = JSON.parse(JSON.stringify(RIPARIAN_GROVE_STAND_TREES));
    canonicalStandParcelSqm = 6070;
    syncStandParcelInputUI();
    renderStandUnionAndScorecard();
  });

  inputStandParcelSqm?.addEventListener('input', () => {
    const rawVal = Number(inputStandParcelSqm.value);
    if (Number.isFinite(rawVal) && rawVal > 0) {
      canonicalStandParcelSqm = isImperialUnits()
        ? Math.max(100, rawVal * 4046.8564224)
        : Math.max(100, rawVal);
    }
    renderStandUnionOutputs();
  });

  window.addEventListener('oa:unitschange', () => {
    syncStandParcelInputUI();
    renderStandUnionAndScorecard();
    if (activeMode === 'single' && activeMapLayerMode === 'leaflet') {
      refreshLeafletParcelMap();
    }
  });

  function renderStandUnionAndScorecard() {
    renderStandTableRows();
    renderStandUnionOutputs();
  }

  function renderStandUnionOutputs() {
    const metricsEl = document.getElementById('stand-union-metrics');
    const svgWrapEl = document.getElementById('stand-union-svg');
    const svgSummaryEl = document.getElementById('stand-svg-summary');
    const scSummaryEl = document.getElementById('stand-scorecard-summary');
    const scTbodyEl = document.getElementById('stand-scorecard-tbody');
    if (!metricsEl || !svgWrapEl || !scTbodyEl) return;

    const imp = isImperialUnits();
    const baseLat = 30.2672;
    const baseLng = -97.7431;
    const FT_PER_DEG_LAT = 364000;
    const ftPerDegLng = FT_PER_DEG_LAT * Math.cos((baseLat * Math.PI) / 180);

    const locatedTrees = standTrees.map((t) => {
      const dbhIn = Math.max(1, Number(t.dbh_inches) || 12);
      const crz = calculateCRZ(dbhIn, 1.0);
      const lat = baseLat + (Number(t.y_ft) || 0) / FT_PER_DEG_LAT;
      const lng = baseLng + (Number(t.x_ft) || 0) / ftPerDegLng;
      return {
        ...t,
        dbh: dbhIn,
        lat,
        lng,
        crz_ft: crz.radius_feet,
        tpz_ft: crz.radius_feet,
        fence_ft: crz.radius_feet,
        crz_area: crz.area_sqft,
        removal: false,
      };
    });

    const grossCrzAreaSqFt = Math.round(
      locatedTrees.reduce((sum, r) => sum + r.crz_area, 0)
    );
    const unionRes = unionRootZoneArea(locatedTrees);
    const unionCrzAreaSqFt = unionRes.area_sqft;
    const overlapReductionSqFt = unionRes.overlap_saved_sqft;
    const overlapPct = grossCrzAreaSqFt > 0 ? round1((overlapReductionSqFt / grossCrzAreaSqFt) * 100) : 0;
    const grossSqm = round1(grossCrzAreaSqFt * 0.09290304);
    const unionSqm = round1(unionCrzAreaSqFt * 0.09290304);
    const savedSqm = round1(overlapReductionSqFt * 0.09290304);
    const totalDbhIn = round1(locatedTrees.reduce((s, r) => s + r.dbh, 0));

    metricsEl.innerHTML = imp
      ? `
      <div class="metric-box">
        <span class="metric-label">Gross Summed CRZ Area</span>
        <strong class="metric-value"><span id="gross_crz_area_sq_ft">${grossCrzAreaSqFt.toLocaleString()}</span> sq ft</strong>
        <span class="metric-sub">${grossSqm.toLocaleString()} m2 un-deduplicated sum</span>
      </div>
      <div class="metric-box highlight-box">
        <span class="metric-label">1-ft Grid De-Duplicated Union Area</span>
        <strong class="metric-value text-accent"><span id="union_crz_area_sq_ft">${unionCrzAreaSqFt.toLocaleString()}</span> sq ft</strong>
        <span class="metric-sub">${unionSqm.toLocaleString()} m2 net rhizosphere footprint</span>
      </div>
      <div class="metric-box">
        <span class="metric-label">Overlap Saved (De-Duplicated)</span>
        <strong class="metric-value"><span id="overlap_reduction_sq_ft">${overlapReductionSqFt.toLocaleString()}</span> sq ft (${overlapPct}%)</strong>
        <span class="metric-sub">${savedSqm.toLocaleString()} m2 saved; prevents double-billing mulch &amp; AirSpade</span>
      </div>
      <div class="metric-box">
        <span class="metric-label">Stand Tree Count &amp; Total DBH</span>
        <strong class="metric-value">${locatedTrees.length} trees (${fmtDualInCm(totalDbhIn)})</strong>
        <span class="metric-sub">1-ft Cartesian grid union verified</span>
      </div>
    `
      : `
      <div class="metric-box">
        <span class="metric-label">Gross Summed CRZ Area</span>
        <strong class="metric-value">${grossSqm.toLocaleString()} m2</strong>
        <span class="metric-sub"><span id="gross_crz_area_sq_ft">${grossCrzAreaSqFt.toLocaleString()}</span> sq ft un-deduplicated sum</span>
      </div>
      <div class="metric-box highlight-box">
        <span class="metric-label">1-ft Grid De-Duplicated Union Area</span>
        <strong class="metric-value text-accent">${unionSqm.toLocaleString()} m2</strong>
        <span class="metric-sub"><span id="union_crz_area_sq_ft">${unionCrzAreaSqFt.toLocaleString()}</span> sq ft net rhizosphere footprint</span>
      </div>
      <div class="metric-box">
        <span class="metric-label">Overlap Saved (De-Duplicated)</span>
        <strong class="metric-value">${savedSqm.toLocaleString()} m2 (${overlapPct}%)</strong>
        <span class="metric-sub"><span id="overlap_reduction_sq_ft">${overlapReductionSqFt.toLocaleString()}</span> sq ft saved; prevents double-billing mulch &amp; AirSpade</span>
      </div>
      <div class="metric-box">
        <span class="metric-label">Stand Tree Count &amp; Total DBH</span>
        <strong class="metric-value">${locatedTrees.length} trees (${fmtDualInCm(totalDbhIn)})</strong>
        <span class="metric-sub">1-ft Cartesian grid union verified</span>
      </div>
    `;

    const rawSvgMarkup = renderSiteMapSVG(locatedTrees, { width: 680, height: 340 });
    const svgMarkup = labelSvgMarkup(
      rawSvgMarkup,
      `Multi-tree stand root-zone overlap map for ${locatedTrees.length} specimens (net union CRZ ${unionCrzAreaSqFt.toLocaleString()} sq ft)`
    );
    svgWrapEl.innerHTML = svgMarkup || '<p class="hint">Add located trees to render the SVG stand union map.</p>';
    if (svgSummaryEl) {
      svgSummaryEl.innerHTML = imp
        ? `Net Union CRZ: <strong>${unionCrzAreaSqFt.toLocaleString()} sq ft (${unionSqm} m2)</strong> | Overlap Saved: <strong>${overlapReductionSqFt.toLocaleString()} sq ft (${overlapPct}%)</strong>`
        : `Net Union CRZ: <strong>${unionSqm} m2 (${unionCrzAreaSqFt.toLocaleString()} sq ft)</strong> | Overlap Saved: <strong>${savedSqm} m2 (${overlapPct}%)</strong>`;
    }

    // Build RAP_v2 assessments for each tree in the stand to run computeSanctuaryScorecardRollup
    const standAssessments = locatedTrees.map((t) => {
      const matchedCase =
        FIXED_PARITY_CASES.find((c) => c.id === t.case_id) || FIXED_PARITY_CASES[0];
      const clone = JSON.parse(JSON.stringify(matchedCase.assessment));
      clone.structural_baseline.tree_tag = t.tag;
      clone.structural_baseline.dbh_cm = round2(t.dbh * 2.54);
      clone.structural_baseline.lat = t.lat;
      clone.structural_baseline.lng = t.lng;
      const crzM = round2(t.crz_ft * 0.3048);
      clone.rhizosphere_and_root_collar.crz_radius_m = crzM;
      clone.rhizosphere_and_root_collar.tiz_radius_m = round2(crzM * 1.5);
      return clone;
    });

    const parcelSqm = Math.max(100, Math.round(canonicalStandParcelSqm));
    const rollup = computeSanctuaryScorecardRollup(standAssessments, parcelSqm);
    const sc = rollup.sanctuary_scorecard;
    const eq = rollup.ecological_equity;
    const compositeTier = getEcologicalTier(sc.composite_sanctuary_score);

    const canopyAreaStr = fmtDualAreaFromSqm(rollup.spatial_coverage.total_canopy_projection_sqm);
    const parcelAreaStr = fmtDualParcelFromSqm(rollup.parcel_area_sqm);

    if (scSummaryEl) {
      scSummaryEl.innerHTML = `
        <div>
          <span class="metric-label">Composite Open Sanctuary Scorecard Rating</span>
          <div class="verdict-title-row">
            <strong class="verdict-big">${sc.composite_sanctuary_score} / 100</strong>
            <span class="badge ${compositeTier.badgeClass}">${compositeTier.label}</span>
          </div>
          <span class="metric-sub">Stand Holobiont 200-Yr Equity: <strong>$${eq.total_holobiont_200yr_equity_usd.toLocaleString()}</strong> vs. Classical CTLA: $${eq.total_ctla_depreciated_usd.toLocaleString()} (${eq.inversion_ratio}x)</span>
        </div>
        <div class="verdict-right">
          <span class="metric-label">Canopy Coverage of Parcel</span>
          <strong>${rollup.spatial_coverage.canopy_coverage_parcel_pct}% (${canopyAreaStr} across ${parcelAreaStr})</strong>
        </div>
      `;
    }

    const dimensionRows = [
      {
        name: 'Soil Health Index',
        score: sc.soil_health_index,
        driver: 'Top-15cm bulk density (lb/cu ft & g/cm3), steady-state infiltration (in/hr & mm/hr), SOM (%), and F:B fungal ratio weighted by TIZ area',
      },
      {
        name: 'Canopy Coverage',
        score: sc.canopy_coverage_index,
        driver: `Live Crown Ratio-weighted dripline projection (${canopyAreaStr} across ${parcelAreaStr} parcel)`,
      },
      {
        name: 'Water Dynamics',
        score: sc.water_dynamics_index,
        driver: '60% vadose zone soil infiltration capacity + 40% canopy rainfall interception (Xiao et al. 2000)',
      },
      {
        name: 'Biodiversity Baseline',
        score: sc.biodiversity_baseline_index,
        driver: 'Unique iNaturalist taxa documented across host canopy trees, mycorrhizal symbionts, and understory companion guilds',
      },
      {
        name: 'Restoration Potential Score',
        score: sc.restoration_potential_score,
        driver: '60-month STIM target realization potential across SER International Principles recovery wheel',
      },
    ];

    scTbodyEl.innerHTML = dimensionRows
      .map((d) => {
        const tier = getEcologicalTier(d.score);
        return `
          <tr>
            <th scope="row">${d.name}</th>
            <td><strong>${d.score} / 100</strong></td>
            <td><span class="badge ${tier.badgeClass}">${tier.label}</span></td>
            <td>${d.driver}</td>
          </tr>
        `;
      })
      .join('');
  }

  // =========================================================================
  // 4. MODE 3: OPEN BADGES 3.0 ATTESTATION MINTER & TAMPER SIMULATOR
  // =========================================================================
  const inputPractitioner = document.getElementById('input-badge-practitioner');
  const inputCredId = document.getElementById('input-badge-credential-id');
  const inputIssuerUri = document.getElementById('input-badge-issuer-uri');
  const inputEvidenceUri = document.getElementById('input-badge-evidence-uri');
  const btnMintBadge = document.getElementById('btn-mint-badge');
  const btnDownloadBadge = document.getElementById('btn-download-badge');
  const btnCopyBadge = document.getElementById('btn-copy-badge');
  const badgeDigestBanner = document.getElementById('badge-digest-banner');
  const badgeJsonPreview = document.getElementById('badge-json-preview');

  const inputTamperTest = document.getElementById('input-tamper-test');
  const tamperBanner = document.getElementById('tamper-verification-banner');
  const btnTamperAttack = document.getElementById('btn-tamper-simulate-attack');
  const btnTamperRestore = document.getElementById('btn-tamper-restore');

  let latestMintedBadge = null;
  let anchoredPrimaryAssessment = null;
  let anchoredPrimarySha256 = '';

  function mintAndRenderOpenBadge() {
    if (!badgeJsonPreview) return;

    const { latestAssessment } = getLatestFieldState();
    const primaryAssessment = JSON.parse(
      JSON.stringify(latestAssessment || FIXED_PARITY_CASES[0].assessment)
    );
    const secondAssessment = JSON.parse(JSON.stringify(FIXED_PARITY_CASES[1].assessment));
    const thirdAssessment = JSON.parse(JSON.stringify(FIXED_PARITY_CASES[2].assessment));

    const practitionerName = inputPractitioner?.value.trim() || 'George Steward';
    const rawCredId = inputCredId?.value.trim() || 'ISA TX-362025A / RAPPER-001';
    const issuerUri = inputIssuerUri?.value.trim() || 'https://openarbor.org/issuers/open-arbor-alliance';
    const evidenceBaseUri = inputEvidenceUri?.value.trim() || 'https://openarbor.org/reports/rap-v2/';

    const practitionerMeta = {
      id: `did:web:openarbor.org:stewards:${practitionerName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      practitioner_name: practitionerName,
      credential_id: `https://openarbor.org/credentials/rapper/${encodeURIComponent(rawCredId.replace(/\s+/g, '-'))}`,
      validFrom: '2026-10-29T00:00:00Z',
      validUntil: '2027-10-29T00:00:00Z',
      legacy_statutory_equivalencies: {
        credential_category: 'ISA_Certified_Arborist',
        issuing_organization: 'International Society of Arboriculture / Open Arbor Alliance',
        credential_identifier: rawCredId,
        verification_url: 'https://openarbor.org/spec/',
      },
    };

    const minted = mintOpenBadgeAttestation(
      practitionerMeta,
      [primaryAssessment, secondAssessment, thirdAssessment],
      rapAssessmentSchema
    );

    // Apply custom Issuer URI and Evidence URI prefix if entered
    if (issuerUri) {
      minted.issuer.id = issuerUri;
    }
    if (evidenceBaseUri && Array.isArray(minted.evidence)) {
      const cleanBase = evidenceBaseUri.endsWith('/') ? evidenceBaseUri : `${evidenceBaseUri}/`;
      minted.evidence.forEach((ev, idx) => {
        ev.id = `${cleanBase}report-00${idx + 1}-${ev.report_sha256_hash.slice(0, 8)}.json`;
      });
    }

    // Recompute outer proof digest after URI customization
    const copyWithoutProof = { ...minted };
    delete copyWithoutProof.proof;
    const outerProofDigest = computeCanonicalSha256(copyWithoutProof);
    minted.proof.proofValue = `sha256:${outerProofDigest}`;

    latestMintedBadge = minted;
    anchoredPrimaryAssessment = primaryAssessment;
    anchoredPrimarySha256 = minted.evidence[0].report_sha256_hash;

    if (badgeDigestBanner) {
      badgeDigestBanner.innerHTML = `
        <div>
          <strong>W3C Verifiable Credential / Open Badges 3.0 Status:</strong>
          <span class="badge badge-protected">MINTED &amp; SCHEMA VERIFIED</span>
          <span class="metric-sub">Anchored Report #1 SHA-256: ${renderExpandableHashHtml(anchoredPrimarySha256, { codeId: 'report_sha256' })}</span>
        </div>
        <div class="sha-box">
          <span>Credential Proof Value:</span>
          ${renderExpandableHashHtml(minted.proof.proofValue, { headChars: 17, tailChars: 8 })}
        </div>
      `;
    }

    badgeJsonPreview.textContent = JSON.stringify(minted, null, 2);

    if (inputTamperTest) {
      inputTamperTest.value = JSON.stringify(primaryAssessment, null, 2);
      evaluateTamperInput();
    }
  }

  function evaluateTamperInput() {
    if (!inputTamperTest || !tamperBanner) return;
    const rawText = inputTamperTest.value;

    try {
      const parsed = JSON.parse(rawText);
      const recomputedHash = computeCanonicalSha256(parsed);
      const isMatch = recomputedHash === anchoredPrimarySha256;

      if (isMatch) {
        tamperBanner.style.borderLeftColor = 'var(--accent-green)';
        tamperBanner.innerHTML = `
          <div>
            <span class="metric-label">Cryptographic Integrity Verification</span>
            <div class="verdict-title-row">
              <strong class="verdict-big text-accent">VERIFIED MATCH</strong>
              <span class="badge badge-protected">Zero Byte Tampering Detected</span>
            </div>
            <div class="metric-sub">Anchored <code>report_sha256</code>: ${renderExpandableHashHtml(anchoredPrimarySha256)}</div>
          </div>
          <div class="verdict-right">
            <span class="metric-label">Recomputed Canonical SHA-256</span>
            ${renderExpandableHashHtml(recomputedHash)}
          </div>
        `;
      } else {
        tamperBanner.style.borderLeftColor = 'var(--danger-red)';
        tamperBanner.innerHTML = `
          <div>
            <span class="metric-label">Cryptographic Integrity Verification</span>
            <div class="verdict-title-row">
              <strong class="verdict-big text-danger">TAMPER DETECTED: SHA-256 MISMATCH</strong>
              <span class="badge badge-danger">Credential Evidence Invalidated</span>
            </div>
            <div class="metric-sub">Anchored <code>report_sha256</code>: ${renderExpandableHashHtml(anchoredPrimarySha256)}</div>
          </div>
          <div class="verdict-right">
            <span class="metric-label">Recomputed Tampered SHA-256</span>
            ${renderExpandableHashHtml(recomputedHash, { danger: true })}
          </div>
        `;
      }
    } catch (err) {
      tamperBanner.style.borderLeftColor = 'var(--danger-red)';
      tamperBanner.innerHTML = `
        <div>
          <span class="metric-label">Cryptographic Integrity Verification</span>
          <div class="verdict-title-row">
            <strong class="verdict-big text-danger">TAMPER DETECTED: MALFORMED JSON PAYLOAD</strong>
            <span class="badge badge-danger">Syntax Error</span>
          </div>
          <span class="metric-sub">${err.message}</span>
        </div>
      `;
    }
  }

  btnMintBadge?.addEventListener('click', () => mintAndRenderOpenBadge());
  inputPractitioner?.addEventListener('input', () => mintAndRenderOpenBadge());
  inputCredId?.addEventListener('input', () => mintAndRenderOpenBadge());
  inputIssuerUri?.addEventListener('input', () => mintAndRenderOpenBadge());
  inputEvidenceUri?.addEventListener('input', () => mintAndRenderOpenBadge());

  inputTamperTest?.addEventListener('input', () => evaluateTamperInput());

  btnTamperAttack?.addEventListener('click', () => {
    if (!anchoredPrimaryAssessment || !inputTamperTest) return;
    const tampered = JSON.parse(JSON.stringify(anchoredPrimaryAssessment));
    tampered.structural_baseline.sound_shell_thickness_ratio_t_over_r = 0.18;
    tampered.structural_baseline.municipal_permit_disposition.recommended_disposition =
      'Removal_Last_Resort_Unmitigable_Hazard';
    inputTamperTest.value = JSON.stringify(tampered, null, 2);
    evaluateTamperInput();
  });

  btnTamperRestore?.addEventListener('click', () => {
    if (!anchoredPrimaryAssessment || !inputTamperTest) return;
    inputTamperTest.value = JSON.stringify(anchoredPrimaryAssessment, null, 2);
    evaluateTamperInput();
  });

  btnDownloadBadge?.addEventListener('click', () => {
    if (!latestMintedBadge) mintAndRenderOpenBadge();
    if (!latestMintedBadge) return;
    const blob = new Blob([JSON.stringify(latestMintedBadge, null, 2)], {
      type: 'application/ld+json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'openarbor-rapper-verified.ob3.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  btnCopyBadge?.addEventListener('click', async () => {
    if (!latestMintedBadge) mintAndRenderOpenBadge();
    if (navigator.clipboard && latestMintedBadge) {
      await navigator.clipboard.writeText(JSON.stringify(latestMintedBadge, null, 2));
      const prev = btnCopyBadge.textContent;
      btnCopyBadge.textContent = 'Copied .ob3.json to Clipboard';
      setTimeout(() => {
        btnCopyBadge.textContent = prev;
      }, 1800);
    }
  });

  // Pre-initialize Stand Union and Badge Minter so their DOM containers are populated immediately
  if (standTbody) {
    renderStandUnionAndScorecard();
  }
  if (badgeJsonPreview) {
    mintAndRenderOpenBadge();
  }

  // =========================================================================
  // 5. LOCAL-FIRST RAP FIELD OBSERVATION LOG (INITIAL 10-CONSULTATION COHORT)
  // =========================================================================
  const obsStorageKey = 'openarbor_rap_observations_v1';
  const obsDecaySelect = document.getElementById('obs-decay-method');
  const obsStageSelect = document.getElementById('obs-stage-executed');
  const obsNotesInput = document.getElementById('obs-field-notes');
  const btnObsLog = document.getElementById('btn-log-field-observation');
  const btnObsExport = document.getElementById('btn-export-observations-jsonl');
  const btnObsClear = document.getElementById('btn-clear-observations');
  const obsProgressEl = document.getElementById('obs-cohort-progress');
  const obsListEl = document.getElementById('obs-cohort-list');

  function escObs(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function loadCohortRecords() {
    try {
      const raw = localStorage.getItem(obsStorageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveCohortRecords(records) {
    try {
      localStorage.setItem(obsStorageKey, JSON.stringify(records));
    } catch {
      // Ignore storage quota / private mode restrictions gracefully
    }
  }

  function renderObservationCohort() {
    if (!obsProgressEl || !obsListEl) return;
    const records = loadCohortRecords();
    const summary = summarizeObservationCohort(records, 10);

    obsProgressEl.innerHTML =
      `<strong>${summary.count} / ${summary.target_cohort_size}</strong> initial RAP cohort consultations logged ` +
      `(${summary.progress_pct}% progress) &middot; ` +
      `Instrument-verified: <strong>${summary.instrument_verified_count}</strong> &middot; ` +
      `Visual-only (t/R unmeasured): <strong>${summary.visual_only_count}</strong>`;

    if (records.length === 0) {
      obsListEl.innerHTML = '<p class="hint">No local observations recorded yet. Click "Record Anonymized Field Observation" to seal the active specimen with a coarsened watershed Plus Code and canonical SHA-256 digest.</p>';
      return;
    }

    obsListEl.innerHTML = records
      .slice()
      .reverse()
      .map((rec) => {
        const verified = verifyFieldObservationRecord(rec, rapFieldObservationSchema);
        const trText = rec.measured_t_over_r === null ? 'unmeasured (null)' : `t/R = ${rec.measured_t_over_r}`;
        const badge = verified.valid
          ? '<span class="badge badge-protected">SHA-256 Valid</span>'
          : '<span class="badge badge-danger">Verification Error</span>';
        return `
          <div class="citation-callout" style="margin-bottom: 8px;">
            <div>
              <strong>${escObs(rec.species_scientific)}</strong> (${escObs(rec.dbh_cm)} cm DBH)
              &middot; Cell <code>${escObs(rec.coarsened_plus_code)}</code>
              &middot; Method: <code>${escObs(rec.internal_decay_method)}</code> (${escObs(trText)})
              &middot; Stage: <code>${escObs(rec.stage_executed)}</code>
              ${badge}
            </div>
            <div class="metric-sub">
              ID: <code>${escObs(rec.observation_id)}</code> &middot; Digest: ${renderExpandableHashHtml(rec.canonical_sha256)}
              ${rec.field_notes ? `<br />Notes: ${escObs(rec.field_notes)}` : ''}
            </div>
          </div>
        `;
      })
      .join('');
  }

  if (obsProgressEl && obsListEl) {
    renderObservationCohort();

    btnObsLog?.addEventListener('click', () => {
      const { latestAssessment, latestResult } = getLatestFieldState();
      const sourceAssessment = latestAssessment || FIXED_PARITY_CASES[0].assessment;
      const sb = sourceAssessment.structural_baseline || {};
      const decayMethod = obsDecaySelect?.value || 'visual_only_unmeasured';
      const stageExecuted = obsStageSelect?.value || 'assessment_only';
      const notes = obsNotesInput?.value || '';

      const record = createFieldObservationRecord(sourceAssessment, {
        internal_decay_method: decayMethod,
        measured_t_over_r: sb.sound_shell_thickness_ratio_t_over_r,
        stage_executed: stageExecuted,
        field_notes: notes,
        municipality_id: latestResult?.municipality?.id || sb.municipal_permit_disposition?.jurisdiction_id || 'tx-austin',
        schema: rapFieldObservationSchema,
      });

      const records = loadCohortRecords();
      records.push(record);
      saveCohortRecords(records);
      if (obsNotesInput) obsNotesInput.value = '';
      renderObservationCohort();
    });

    btnObsExport?.addEventListener('click', () => {
      const records = loadCohortRecords();
      const jsonl = serializeObservationCohortJsonl(records, rapFieldObservationSchema);
      const blob = new Blob([jsonl], { type: 'application/x-ndjson;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'openarbor-rap-cohort.jsonl';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });

    btnObsClear?.addEventListener('click', () => {
      saveCohortRecords([]);
      renderObservationCohort();
    });
  }
}
