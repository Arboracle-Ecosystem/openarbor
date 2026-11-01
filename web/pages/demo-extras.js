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
} from '../../src/core/rcaEngine.js';

import rcaAssessmentSchema from '../../schemas/rca_assessment.schema.json';
import {
  ALL_SPECIES_PRESETS,
  DEFAULT_STAND_TREES,
  FIXED_PARITY_CASES,
} from '../presets.js';
import { getLatestFieldState } from '../app.js';

const round1 = (n) => Math.round(Number(n || 0) * 10) / 10;
const round2 = (n) => Math.round(Number(n || 0) * 100) / 100;

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

    if (btn) {
      if (stored === 'dark') {
        btn.textContent = 'Theme: Dark';
      } else if (stored === 'light') {
        btn.textContent = 'Theme: Light';
      } else {
        btn.textContent = `Theme: Auto (${sys === 'dark' ? 'Dark' : 'Light'})`;
      }
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

  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = new URL('../sw.js', import.meta.url).pathname;
      navigator.serviceWorker.register(swUrl).catch(() => {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      });
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
    if (btnMapSvg) btnMapSvg.classList.toggle('active', mode === 'svg');
    if (btnMapLeaflet) btnMapLeaflet.classList.toggle('active', mode === 'leaflet');
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
          `<strong>${sb.tree_tag || 'Tree'} Tree Influence Zone (TIZ / TPZ 1.5x)</strong><br>Radius: ${tpzMeters} m (${round1(tpzMeters / 0.3048)} ft)`
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
          `<strong>${sb.tree_tag || 'Tree'} Critical Root Zone (CRZ)</strong><br>Radius: ${crzMeters} m (${round1(crzMeters / 0.3048)} ft)<br>Species: <em>${sb.species_scientific || 'Quercus virginiana'}</em>`
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
          `<strong>${sb.tree_tag || 'Tree'} Structural Root Zone (AS 4970 SRZ)</strong><br>Radius: ${srzMeters} m (${round1(srzMeters / 0.3048)} ft)`
        )
        .addTo(leafletVectorGroup);

      L.circleMarker([lat, lng], {
        radius: 5,
        color: '#ffffff',
        fillColor: '#2d6a4f',
        fillOpacity: 1,
      })
        .bindPopup(
          `<strong>${sb.tree_tag || 'Tree'} (${sb.species_common || 'Live Oak'})</strong><br>DBH: ${round1(dbhIn)} in (${sb.dbh_cm} cm)<br>Plus Code: <code>${sb.plus_code_global}</code>`
        )
        .addTo(leafletVectorGroup);

      if (parcelStatus) {
        parcelStatus.textContent = `Rendered OGC CRS84 GeoJSON rings at (${lat.toFixed(4)}, ${lng.toFixed(4)}): SRZ = ${srzMeters} m, CRZ = ${crzMeters} m, TIZ/TPZ = ${tpzMeters} m.`;
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
  const standTbody = document.getElementById('stand-builder-tbody');
  const btnStandAdd = document.getElementById('btn-stand-add-tree');
  const btnStandReset = document.getElementById('btn-stand-reset');
  const inputStandParcelSqm = document.getElementById('input-stand-parcel-sqm');

  function renderStandTableRows() {
    if (!standTbody) return;
    const speciesOptions = ALL_SPECIES_PRESETS.map(
      (s) => `<option value="${s.scientific} (${s.common})">${s.common} (${s.scientific})</option>`
    ).join('');
    const caseOptions = FIXED_PARITY_CASES.map(
      (c) => `<option value="${c.id}">${c.label}</option>`
    ).join('');

    standTbody.innerHTML = standTrees
      .map(
        (t, idx) => `
        <tr data-stand-idx="${idx}">
          <td>
            <input type="text" class="stand-input-tag" value="${t.tag}" aria-label="Tree Tag row ${idx + 1}">
          </td>
          <td>
            <select class="stand-input-species" aria-label="Species row ${idx + 1}">
              <option value="${t.species}">${t.species}</option>
              ${speciesOptions}
            </select>
          </td>
          <td>
            <input type="number" class="stand-input-dbh" min="1" max="200" step="0.5" value="${t.dbh_inches}" aria-label="DBH inches row ${idx + 1}">
          </td>
          <td>
            <input type="number" class="stand-input-x" min="-500" max="500" step="1" value="${t.x_ft}" aria-label="Local X feet row ${idx + 1}">
          </td>
          <td>
            <input type="number" class="stand-input-y" min="-500" max="500" step="1" value="${t.y_ft}" aria-label="Local Y feet row ${idx + 1}">
          </td>
          <td>
            <select class="stand-input-case" aria-label="Diagnostic template row ${idx + 1}">
              ${caseOptions.replace(`value="${t.case_id}"`, `value="${t.case_id}" selected`)}
            </select>
          </td>
          <td>
            <button type="button" class="btn btn-outline btn-stand-remove" data-remove-idx="${idx}" ${standTrees.length <= 1 ? 'disabled' : ''}>Remove</button>
          </td>
        </tr>
      `
      )
      .join('');
  }

  standTbody?.addEventListener('input', (e) => {
    const row = e.target.closest('tr[data-stand-idx]');
    if (!row) return;
    const idx = Number(row.dataset.standIdx);
    const item = standTrees[idx];
    if (!item) return;

    item.tag = row.querySelector('.stand-input-tag')?.value.trim() || `T-${idx + 1}`;
    item.species = row.querySelector('.stand-input-species')?.value || item.species;
    item.dbh_inches = Math.max(1, Number(row.querySelector('.stand-input-dbh')?.value) || 12);
    item.x_ft = Number(row.querySelector('.stand-input-x')?.value) || 0;
    item.y_ft = Number(row.querySelector('.stand-input-y')?.value) || 0;
    item.case_id = row.querySelector('.stand-input-case')?.value || FIXED_PARITY_CASES[0].id;

    renderStandUnionOutputs();
  });

  standTbody?.addEventListener('click', (e) => {
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
      y_ft: (nextNum % 2 === 0 ? 12 : -10),
      case_id: 'case-1-austin-live-oak',
    });
    renderStandUnionAndScorecard();
  });

  btnStandReset?.addEventListener('click', () => {
    standTrees = JSON.parse(JSON.stringify(DEFAULT_STAND_TREES));
    renderStandUnionAndScorecard();
  });

  inputStandParcelSqm?.addEventListener('input', () => {
    renderStandUnionOutputs();
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

    metricsEl.innerHTML = `
      <div class="metric-box">
        <span class="metric-label">Gross Summed CRZ Area</span>
        <strong class="metric-value"><span id="gross_crz_area_sq_ft">${grossCrzAreaSqFt.toLocaleString()}</span> sq ft</strong>
        <span class="metric-sub">${round1(grossCrzAreaSqFt * 0.092903)} m2 un-deduplicated sum</span>
      </div>
      <div class="metric-box highlight-box">
        <span class="metric-label">1-ft Grid De-Duplicated Union Area</span>
        <strong class="metric-value text-accent"><span id="union_crz_area_sq_ft">${unionCrzAreaSqFt.toLocaleString()}</span> sq ft</strong>
        <span class="metric-sub">${round1(unionCrzAreaSqFt * 0.092903)} m2 net rhizosphere footprint</span>
      </div>
      <div class="metric-box">
        <span class="metric-label">Overlap Saved (De-Duplicated)</span>
        <strong class="metric-value"><span id="overlap_reduction_sq_ft">${overlapReductionSqFt.toLocaleString()}</span> sq ft (${overlapPct}%)</strong>
        <span class="metric-sub">Prevents double-billing mulch &amp; AirSpade work</span>
      </div>
      <div class="metric-box">
        <span class="metric-label">Stand Tree Count &amp; Total DBH</span>
        <strong class="metric-value">${locatedTrees.length} trees (${round1(locatedTrees.reduce((s, r) => s + r.dbh, 0))} in)</strong>
        <span class="metric-sub">1-ft Cartesian grid union verified</span>
      </div>
    `;

    const svgMarkup = renderSiteMapSVG(locatedTrees, { width: 680, height: 340 });
    svgWrapEl.innerHTML = svgMarkup || '<p class="hint">Add located trees to render the SVG stand union map.</p>';
    if (svgSummaryEl) {
      svgSummaryEl.innerHTML = `Net Union CRZ: <strong>${unionCrzAreaSqFt.toLocaleString()} sq ft</strong> | Overlap Saved: <strong>${overlapReductionSqFt.toLocaleString()} sq ft (${overlapPct}%)</strong>`;
    }

    // Build RCA_v2 assessments for each tree in the stand to run computeSanctuaryScorecardRollup
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

    const parcelSqm = Math.max(100, Number(inputStandParcelSqm?.value) || 4047);
    const rollup = computeSanctuaryScorecardRollup(standAssessments, parcelSqm);
    const sc = rollup.sanctuary_scorecard;
    const eq = rollup.ecological_equity;
    const compositeTier = getEcologicalTier(sc.composite_sanctuary_score);

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
          <strong>${rollup.spatial_coverage.canopy_coverage_parcel_pct}% (${rollup.spatial_coverage.total_canopy_projection_sqm} m2 / ${rollup.parcel_area_sqm} m2)</strong>
        </div>
      `;
    }

    const dimensionRows = [
      {
        name: 'Soil Health Index',
        score: sc.soil_health_index,
        driver: 'Top-15cm bulk density (g/cm3), steady-state infiltration (mm/hr), SOM (%), and F:B fungal ratio weighted by TIZ area',
      },
      {
        name: 'Canopy Coverage',
        score: sc.canopy_coverage_index,
        driver: `Live Crown Ratio-weighted dripline projection (${rollup.spatial_coverage.total_canopy_projection_sqm} m2 across ${rollup.parcel_area_sqm} m2 parcel)`,
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
            <td><strong>${d.name}</strong></td>
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
    const rawCredId = inputCredId?.value.trim() || 'ISA TX-362025A / RCA-001';
    const issuerUri = inputIssuerUri?.value.trim() || 'https://openarbor.org/issuers/open-arbor-alliance';
    const evidenceBaseUri = inputEvidenceUri?.value.trim() || 'https://openarbor.org/reports/rca-v2/';

    const practitionerMeta = {
      id: `did:web:openarbor.org:stewards:${practitionerName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      practitioner_name: practitionerName,
      credential_id: `https://openarbor.org/credentials/rca-verified/${encodeURIComponent(rawCredId.replace(/\s+/g, '-'))}`,
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
      rcaAssessmentSchema
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
          <span class="badge badge-neutral">Anchored Report #1 SHA-256: <code id="report_sha256">${anchoredPrimarySha256.slice(0, 16)}...</code></span>
        </div>
        <div class="sha-box">
          <span>Credential Proof Value:</span>
          <code>${minted.proof.proofValue}</code>
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
            <span class="metric-sub">Anchored <code>report_sha256</code>: <code>${anchoredPrimarySha256}</code></span>
          </div>
          <div class="verdict-right">
            <span class="metric-label">Recomputed Canonical SHA-256</span>
            <code>${recomputedHash}</code>
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
            <span class="metric-sub">Anchored <code>report_sha256</code>: <code>${anchoredPrimarySha256}</code></span>
          </div>
          <div class="verdict-right">
            <span class="metric-label">Recomputed Tampered SHA-256</span>
            <code class="text-danger">${recomputedHash}</code>
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
    a.download = 'openarbor-rca-verified.ob3.json';
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
}
