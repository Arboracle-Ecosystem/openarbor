/**
 * Open Arbor v2.0 Mobile-First Web Field Tool & Multi-Page Bundle Entrypoint
 * Bundles the certified Open Arbor engines (rootZone, ordinanceEngine,
 * ecosystemBenefits, rapEngine, leoRapEngine, soilFunction, fieldObservationLog)
 * and bioregional municipal ordinance datasets without modifying any engine logic under src/ or data/.
 */

import {
  calculateCRZ,
  calculateTPZ,
  calculateSRZ,
  calculateMultiStemDBH,
  unionRootZoneArea,
} from '../src/core/rootZone.js';

import {
  evaluateTreeInventory,
  permitDetermination,
  permitSummary,
  computeMitigationPlan,
  evaluateSiteContext,
  renderSiteMapSVG,
  estimateRootZoneRemediation,
  statusLabel,
} from '../src/core/ordinanceEngine.js';

import {
  CONDITION_FACTORS,
  estimateTreeAge,
  calculateTreeEcosystemBenefits,
  toGeoJSONFeatureCollection,
} from '../src/core/ecosystemBenefits.js';

import {
  decodePlusCode,
  validateJsonSchema,
  evaluateBiomechanicsAndRhizosphere,
  computeHolobiontValuation,
  computeSanctuaryScorecardRollup,
  lintRapEvidentiaryReport,
  lintRcaEvidentiaryReport,
  computeRegenerativePracticeEconomics,
  computeCanonicalSha256,
  compileRapEvidentiaryMarkdown,
  compileRcaEvidentiaryMarkdown,
  compilePreservationCounterNotice,
  mintOpenBadgeAttestation,
} from '../src/core/rapEngine.js';

import {
  validateSoilFunction,
  estimateSoilSpongeCapacity,
} from '../src/core/soilFunction.js';

import {
  computePhasedStewardshipTriage,
  compileLeoRapBrief,
  compileLeoRcaBrief,
  verifyLeoRapNarrative,
  verifyLeoRcaNarrative,
  runLeoRapSelfAudit,
  runLeoRcaSelfAudit,
  composeArboristHandoffBrief,
} from '../src/core/leoRapEngine.js';

import {
  FORBIDDEN_PII_KEYS,
  coarsenPlusCode,
  redactPotentialPii,
  assertZeroClientPii,
  createFieldObservationRecord,
  verifyFieldObservationRecord,
  serializeObservationCohortJsonl,
  summarizeObservationCohort,
} from '../src/core/fieldObservationLog.js';

import txOrdinances from '../data/ordinances/central_texas_ordinances.json';
import orOrdinances from '../data/ordinances/rogue_valley_oregon_ordinances.json';
import rapAssessmentSchema from '../schemas/rap_assessment.schema.json';
import rapFieldObservationSchema from '../schemas/rap_field_observation.schema.json';
import municipalOrdinanceSchema from '../schemas/municipal-ordinance.schema.json';

const rcaAssessmentSchema = rapAssessmentSchema;
import forestryToolsCatalog from '../data/catalog/forestry-tools.json';
import {
  CENTRAL_TEXAS_SPECIES,
  ALL_SPECIES_PRESETS,
  FIXED_PARITY_CASES,
  DEFAULT_STAND_TREES,
} from './presets.js';

import {
  initDemoExtrasUI,
  initSharedThemeToggle,
  bindDialogLightDismissFallback,
} from './pages/demo-extras.js';
import {
  initLivingLensUI,
  initVeilAndHandoffChrome,
  openArboristHandoffDialog,
} from './pages/living-lens-ui.js';
import { initToolsCatalogUI } from './pages/tools-ui.js';
import { initOrdinancesExplorerUI } from './pages/ordinances-ui.js';
import { initMcpPlaygroundUI } from './pages/mcp-ui.js';
import { initSpecViewerUI } from './pages/spec-ui.js';
import {
  ENGINE_VERSION,
  DATASET_VERSION,
  DATASET_LAST_VERIFIED,
  MEDFORD_PONDEROSA_CASE,
  GALLERY_CASES,
  encodeAssessmentPermalink,
  decodeAssessmentPermalink,
  formatStickyDeterminationSummary,
  inspectMunicipalityProvenance,
  renderExpandableHashHtml,
} from './pages/masterwork-core.js';
import {
  getUnitSystem,
  isImperialUnits,
  setUnitSystem,
  cmToIn,
  inToCm,
  mToFt,
  ftToM,
  mmHrToInHr,
  inHrToMmHr,
  fmtDualInCm,
  fmtDualFromCm,
  fmtDualFtM,
  fmtDualFromMeters,
  fmtDualAreaSqftSqm,
  fmtDualAreaFromSqm,
  fmtDualSoilVolFromM3,
  fmtDualBiocharFromLiters,
  fmtDualGallons,
  fmtDualMassFromKg,
  fmtDualMassFromLbs,
  fmtDualPressureFromPsi,
} from './pages/unit-system.js';

export {
  calculateCRZ,
  calculateTPZ,
  calculateSRZ,
  calculateMultiStemDBH,
  unionRootZoneArea,
  evaluateTreeInventory,
  permitDetermination,
  permitSummary,
  computeMitigationPlan,
  evaluateSiteContext,
  renderSiteMapSVG,
  estimateRootZoneRemediation,
  statusLabel,
  CONDITION_FACTORS,
  estimateTreeAge,
  calculateTreeEcosystemBenefits,
  toGeoJSONFeatureCollection,
  validateSoilFunction,
  estimateSoilSpongeCapacity,
  decodePlusCode,
  validateJsonSchema,
  evaluateBiomechanicsAndRhizosphere,
  computeHolobiontValuation,
  computeSanctuaryScorecardRollup,
  lintRapEvidentiaryReport,
  lintRcaEvidentiaryReport,
  computeRegenerativePracticeEconomics,
  computeCanonicalSha256,
  compileRapEvidentiaryMarkdown,
  compileRcaEvidentiaryMarkdown,
  compilePreservationCounterNotice,
  mintOpenBadgeAttestation,
  computePhasedStewardshipTriage,
  compileLeoRapBrief,
  compileLeoRcaBrief,
  verifyLeoRapNarrative,
  verifyLeoRcaNarrative,
  runLeoRapSelfAudit,
  runLeoRcaSelfAudit,
  composeArboristHandoffBrief,
  FORBIDDEN_PII_KEYS,
  coarsenPlusCode,
  redactPotentialPii,
  assertZeroClientPii,
  createFieldObservationRecord,
  verifyFieldObservationRecord,
  serializeObservationCohortJsonl,
  summarizeObservationCohort,
  txOrdinances,
  orOrdinances,
  rapAssessmentSchema,
  rapFieldObservationSchema,
  rcaAssessmentSchema,
  municipalOrdinanceSchema,
  forestryToolsCatalog,
  CENTRAL_TEXAS_SPECIES,
  ALL_SPECIES_PRESETS,
  FIXED_PARITY_CASES,
  DEFAULT_STAND_TREES,
  ENGINE_VERSION,
  DATASET_VERSION,
  DATASET_LAST_VERIFIED,
  MEDFORD_PONDEROSA_CASE,
  GALLERY_CASES,
  encodeAssessmentPermalink,
  decodeAssessmentPermalink,
  formatStickyDeterminationSummary,
  inspectMunicipalityProvenance,
  renderExpandableHashHtml,
  getUnitSystem,
  setUnitSystem,
};

const OLC_CHARS = '23456789CFGHJMPQRVWX';

export const ALL_MUNICIPALITIES = [
  ...(txOrdinances.municipalities || []),
  ...(orOrdinances.municipalities || []),
];

export const CENTRAL_TEXAS_MUNICIPALITIES = txOrdinances.municipalities || [];
export const ROGUE_VALLEY_MUNICIPALITIES = orOrdinances.municipalities || [];

export function findMunicipality(id) {
  if (!id) return null;
  return ALL_MUNICIPALITIES.find((m) => m.id === id) || null;
}

let latestAssessment = null;
let latestResult = null;

/**
 * Expose the latest single-tree assessment and evaluation result for Mode 1, Mode 2, and Mode 3 modules.
 */
export function getLatestFieldState() {
  return { latestAssessment, latestResult };
}

/**
 * Inspect a municipal ordinance record for missing or unverified statutory fields.
 */
export function getOrdinanceUnverifiedNotices(muni) {
  if (!muni) return ['Municipality record not found in verified commons.'];
  const notices = [];
  const rawJson = JSON.stringify(muni);
  if (/UNVERIFIED/i.test(rawJson)) {
    notices.push('Contains explicit UNVERIFIED statutory annotation in dataset.');
  }
  if (!muni.permit_triggers_by_work_type) {
    notices.push('permit_triggers_by_work_type is UNVERIFIED / not yet codified in dataset; verify work-type permit triggers directly with municipal staff.');
  }
  if (!muni.plan_rules?.root_zone) {
    notices.push('plan_rules.root_zone is UNVERIFIED / not yet codified in dataset; engine defaults to standard 1.0 ft/in DBH CRZ.');
  }
  if (!muni.plan_rules?.survey) {
    notices.push('plan_rules.survey is UNVERIFIED / not yet codified in dataset; engine defaults to quadratic multi-stem rule.');
  }
  return notices;
}

/**
 * Encode latitude and longitude into a 10-character Open Location Code (Plus Code).
 */
export function encodePlusCode(lat, lng) {
  let cleanLat = Math.max(-90, Math.min(89.9999, Number(lat) + 90));
  let cleanLng = Math.max(-180, Math.min(179.9999, Number(lng) + 180));
  let resolution = 20;
  let chars = '';

  for (let i = 0; i < 5; i += 1) {
    const latDigit = Math.min(19, Math.max(0, Math.floor(cleanLat / resolution)));
    const lngDigit = Math.min(19, Math.max(0, Math.floor(cleanLng / resolution)));
    chars += OLC_CHARS[latDigit] + OLC_CHARS[lngDigit];
    cleanLat -= latDigit * resolution;
    cleanLng -= lngDigit * resolution;
    resolution /= 20;
  }

  return `${chars.slice(0, 8)}+${chars.slice(8, 10)}`;
}

/**
 * Run the full Open Arbor v2.0 deterministic pipeline on an RAP_v2 assessment
 * and municipal ordinance context. Used by both the browser UI and parity verification.
 */
export function evaluateCompleteFieldCase(assessment, options = {}) {
  const schemaValidation = validateJsonSchema(assessment, rapAssessmentSchema);
  const lint = lintRapEvidentiaryReport(assessment);

  const ordId =
    options.ordinance_id ||
    assessment.structural_baseline?.municipal_permit_disposition?.jurisdiction_id ||
    'tx-austin';
  const municipality = findMunicipality(ordId);

  const compiledReport = compileRapEvidentiaryMarkdown(assessment, { municipality });
  const counterNotice = compilePreservationCounterNotice(assessment);
  const economics = computeRegenerativePracticeEconomics(assessment);
  const biomechanics = compiledReport.biomechanics;
  const valuation = compiledReport.valuation;

  const sb = assessment.structural_baseline || {};
  const coords = decodePlusCode(sb.plus_code_global) || municipality?.coordinates || { lat: 30.2672, lng: -97.7431 };
  const conditionClass = options.condition_class || 'Good';
  const siteCondition = options.site_condition || 'Open Grown / Parkland';

  const speciesEntry = ALL_SPECIES_PRESETS.find(
    (s) => s.scientific.toLowerCase() === String(sb.species_scientific || '').toLowerCase()
  );
  const growthFactor = speciesEntry?.growth_factor || 4.5;

  const ageEstimate = estimateTreeAge({
    dbh_inches: biomechanics.dbh_inches,
    base_growth_factor: growthFactor,
    site_condition: siteCondition,
  });

  const heightFt = Number(sb.height_m || 12) / 0.3048;
  const spreadFt = ((Number(sb.crown_spread_ns_m || 10) + Number(sb.crown_spread_ew_m || 10)) / 2) / 0.3048;

  const ecosystemBenefits = calculateTreeEcosystemBenefits({
    species_name: sb.species_scientific || 'Quercus virginiana',
    common_name: sb.species_common || 'Live Oak',
    dbh_inches: biomechanics.dbh_inches,
    height_feet: Math.round(heightFt * 10) / 10,
    canopy_spread_feet: Math.round(spreadFt * 10) / 10,
    condition_class: conditionClass,
  });

  const conditionScoreMap = {
    Excellent: 10,
    Good: 8,
    Fair: 6,
    Poor: 4,
    Critical: 2,
    Dead: 0,
  };

  const isRemovalProposed =
    Boolean(options.proposed_removal) ||
    sb.municipal_permit_disposition?.recommended_disposition === 'Removal_Last_Resort_Unmitigable_Hazard';

  const stemsInches =
    sb.is_multistem && Array.isArray(sb.stem_diameters_cm) && sb.stem_diameters_cm.length > 0
      ? sb.stem_diameters_cm.map((cm) => Math.round((Number(cm) / 2.54) * 10) / 10)
      : [biomechanics.dbh_inches];

  const treeInventoryInput = [
    {
      tag: sb.tree_tag || 'T-01',
      species_common: sb.species_common || 'Live Oak',
      species_scientific: sb.species_scientific || 'Quercus virginiana',
      stems_inches: stemsInches,
      dbh_inches: biomechanics.dbh_inches,
      lat: coords.lat,
      lng: coords.lng,
      condition_score: conditionScoreMap[conditionClass] ?? 8,
      removal: isRemovalProposed,
      pruning_date: options.pruning_date || null,
      crz_disturbed_pct: Number(options.crz_disturbed_pct) || 0,
      cutfill_within_half_crz: (Number(options.cutfill_depth_in) || 0) > 0,
      cutfill_depth_in: Number(options.cutfill_depth_in) || 0,
      impervious_pct: Number(options.impervious_pct) || 0,
      crown_removal_pct: Number(options.crown_removal_pct) || 0,
      actions:
        sb.municipal_permit_disposition?.recommended_disposition === 'Structural_Risk_Reduction_Pruning' ||
        options.pruning_date
          ? ['pruning']
          : [],
    },
  ];

  const evaluatedRows = evaluateTreeInventory(treeInventoryInput, municipality);
  const permit = permitDetermination(evaluatedRows, municipality);
  const permitText = permitSummary(permit);
  const mitigationActive = computeMitigationPlan(evaluatedRows, municipality);

  const removedComparisonRows = evaluateTreeInventory(
    [{ ...treeInventoryInput[0], removal: true }],
    municipality
  );
  const mitigationIfRemoved = computeMitigationPlan(removedComparisonRows, municipality);
  const soilRemediation = estimateRootZoneRemediation(evaluatedRows);
  const svgSiteMap = renderSiteMapSVG(evaluatedRows);

  const crz = calculateCRZ(
    biomechanics.dbh_inches,
    Number(municipality?.plan_rules?.root_zone?.crz_ft_per_inch) || 1.0,
    Number(municipality?.plan_rules?.root_zone?.crz_min_ft) || 0
  );
  const tpzUs11 = calculateTPZ(biomechanics.dbh_inches, 'inches', 'US_1_1');
  const tpzUs115 = calculateTPZ(biomechanics.dbh_inches, 'inches', 'US_1_1.5');
  const tpzAs4970 = calculateTPZ(biomechanics.dbh_inches, 'inches', 'Australian_AS4970');
  const tpzBs5837 = calculateTPZ(biomechanics.dbh_inches, 'inches', 'UK_BS5837');
  const srz = calculateSRZ(
    (Number(assessment.rhizosphere_and_root_collar?.root_flare_diameter_cm) || biomechanics.dbh_cm * 1.2) / 2.54,
    biomechanics.dbh_inches
  );

  const geojson = toGeoJSONFeatureCollection(evaluatedRows, {
    name: `OpenArbor_${sb.tree_tag || 'Assessment'}`,
    generated_at: options.generated_at || `${sb.assessment_date || '2026-10-28'}T00:00:00.000Z`,
    jurisdiction_id: ordId,
    jurisdiction_name: municipality?.name || ordId,
    ordinance_citation: municipality?.ordinance_numbers || '',
    rca_sha256: compiledReport.sha256,
  });

  if (geojson.features.length > 0) {
    geojson.features[0].properties = {
      ...geojson.features[0].properties,
      jurisdiction_id: ordId,
      protection_status: statusLabel(evaluatedRows[0]),
      permit_summary: permitText,
      ctla_10th_ed_depreciated_usd: valuation.ctla_10th_ed_depreciated_usd,
      holobiont_200yr_biological_equity_usd: valuation.holobiont_200yr_biological_equity_usd,
      annual_ecosystem_benefits_usd: ecosystemBenefits.total_annual_benefits_usd,
      estimated_age_years: ageEstimate.estimated_age_years,
      t_over_r_ratio: biomechanics.biomechanics.sound_shell_thickness_ratio_t_over_r,
      mattheck_stable: biomechanics.biomechanics.mattheck_criterion_satisfied,
      rca_sha256: compiledReport.sha256,
    };
  }

  const provenance = inspectMunicipalityProvenance(municipality);
  const soilInput = assessment.soil_and_microbiome_baseline || {};
  const soilSponge = estimateSoilSpongeCapacity({
    tiz_area_m2: Number(biomechanics.root_zones.tiz_area_sqm) || 100,
    infiltration_mm_hr: Number(soilInput.infiltration_rate_mm_hr ?? 18),
    organic_matter_percent: Number(soilInput.organic_matter_pct ?? 2.0),
  });

  const phasedTriage = computePhasedStewardshipTriage(assessment, economics);
  const leoEvalContext = {
    biomechanics,
    valuation,
    economics,
    triage: phasedTriage,
    municipality,
    rootZones: { crz, srz },
    assessment_sha256: compiledReport.sha256,
    evaluatedRow: evaluatedRows[0],
    permitText,
    mitigationIfRemoved,
    provenance,
  };
  const leoBrief = compileLeoRapBrief(assessment, leoEvalContext);
  const leoVerification = verifyLeoRapNarrative(
    leoBrief.brief_markdown,
    assessment,
    leoEvalContext
  );
  const leoSelfAudit = runLeoRapSelfAudit(assessment, leoEvalContext);

  const oakWiltFlag = Array.isArray(evaluatedRows[0]?.flags)
    ? evaluatedRows[0].flags.find((f) => /oak wilt/i.test(f)) || ''
    : '';

  const handoffBrief = composeArboristHandoffBrief({
    speciesCommon: sb.species_common || 'Live Oak',
    speciesScientific: sb.species_scientific || 'Quercus virginiana',
    dbhInches: biomechanics.dbh_inches,
    cityLabel: provenance?.municipality_name || municipality?.name || ordId,
    protectionStatus: statusLabel(evaluatedRows[0]),
    tOverR: biomechanics.biomechanics.sound_shell_thickness_ratio_t_over_r,
    sonicTomographyVerified: Boolean(sb.sonic_tomography_or_resistograph_uri),
    crzFeet: crz.radius_feet,
    holobiontUsd: valuation.holobiont_200yr_biological_equity_usd,
    ctlaUsd: valuation.ctla_10th_ed_depreciated_usd,
    cashInLieuUsd: mitigationIfRemoved?.cash_in_lieu_usd || 0,
    stage1Usd: phasedTriage.stages[0]?.client_price_usd || 0,
    removalBidUsd: phasedTriage.removal_bid_usd,
    marginMultiplier: phasedTriage.net_margin_multiplier,
    oakWiltWarning: oakWiltFlag,
    shareUrl: options.share_url || 'https://openarbor.org/demo/',
  });

  return {
    schemaValidation,
    lint,
    municipality,
    provenance,
    compiledReport,
    counterNotice,
    economics,
    biomechanics,
    valuation,
    ageEstimate,
    ecosystemBenefits,
    soilSponge,
    phasedTriage,
    leoEvalContext,
    leoBrief,
    leoVerification,
    leoSelfAudit,
    handoffBrief,
    evaluatedRow: evaluatedRows[0],
    permit,
    permitText,
    mitigationActive,
    mitigationIfRemoved,
    soilRemediation,
    svgSiteMap,
    rootZones: {
      crz,
      tpzUs11,
      tpzUs115,
      tpzAs4970,
      tpzBs5837,
      srz,
    },
    geojson,
  };
}

/**
 * Fallback & ARIA synchronization for :user-invalid / :user-valid per modern-web-guidance.
 */
const UserInvalidFallback = (() => {
  const dirtyState = new WeakMap();

  const updateState = (input) => {
    if (!input || typeof input.checkValidity !== 'function') return;
    const isValid = input.checkValidity();
    input.classList.toggle('user-invalid-fallback', !isValid);
    input.classList.toggle('user-valid-fallback', isValid);
    input.setAttribute('aria-invalid', isValid ? 'false' : 'true');
  };

  const syncAriaNative = (el) => {
    if (!el || typeof el.matches !== 'function' || typeof el.checkValidity !== 'function') return;
    try {
      const invalid = el.matches(':user-invalid');
      el.setAttribute('aria-invalid', invalid ? 'true' : 'false');
    } catch {
      updateState(el);
    }
  };

  const init = (root = document) => {
    const supportsNative =
      typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('selector(:user-invalid)');

    if (supportsNative) {
      root.addEventListener('blur', (e) => syncAriaNative(e.target), true);
      root.addEventListener('input', (e) => {
        if (e.target && typeof e.target.hasAttribute === 'function' && e.target.hasAttribute('aria-invalid')) {
          syncAriaNative(e.target);
        }
      });
      return;
    }

    const handleEvent = (event) => {
      const input = event.target;
      if (event.type === 'reset') {
        const controls = input.elements || [];
        for (const control of controls) {
          dirtyState.delete(control);
          control.classList.remove('user-invalid-fallback', 'user-valid-fallback');
          control.removeAttribute('aria-invalid');
        }
        return;
      }
      if (!input || typeof input.checkValidity !== 'function') return;
      if (event.type === 'input' || event.type === 'change') {
        const state = dirtyState.get(input) || { hasInteracted: false, hasBlurred: false };
        state.hasInteracted = true;
        dirtyState.set(input, state);
        if (state.hasBlurred) updateState(input);
      } else if (event.type === 'blur') {
        const state = dirtyState.get(input) || { hasInteracted: false, hasBlurred: false };
        state.hasBlurred = true;
        dirtyState.set(input, state);
        if (state.hasInteracted) updateState(input);
      }
    };

    root.addEventListener('blur', handleEvent, true);
    root.addEventListener('input', handleEvent);
    root.addEventListener('change', handleEvent);
    root.addEventListener('reset', handleEvent, true);
  };

  return { init };
})();

/**
 * Initialize the browser single-page field application.
 */
export function initFieldToolUI() {
  if (typeof document === 'undefined') return;
  const form = document.getElementById('field-assessment-form');
  if (!form) return;

  UserInvalidFallback.init(form);

  let activePreset = JSON.parse(JSON.stringify(FIXED_PARITY_CASES[0]));
  let activePreviewTab = 'geojson';
  let canonicalFieldState = {
    dbh_cm: 76.2,
    stem_diameters_cm: [76.2],
    height_m: 16.5,
    spread_ns_m: 22.0,
    spread_ew_m: 24.0,
    cutfill_in: 2,
    root_flare_cm: 98.0,
    burial_depth_cm: 16.0,
    trench_length_m: 8.5,
    trench_width_cm: 30.0,
    trench_depth_cm: 35.0,
    rce_radius_m: 1.0,
    infiltration_mm_hr: 16.0,
    airspade_psi: 150,
  };

  const el = (id) => document.getElementById(id);

  // Populate Municipality dropdown with ALL 8 municipalities grouped by TX and OR
  const muniSelect = el('input-ordinance-id');
  function populateMunicipalitySelect() {
    if (!muniSelect) return;
    const prevVal = muniSelect.value;
    const imp = isImperialUnits();
    const fmtMuniThresholds = (m) => {
      const pStr = imp
        ? `${m.dbh_threshold_inches} in`
        : `${inToCm(m.dbh_threshold_inches, 1)} cm / ${m.dbh_threshold_inches} in`;
      const hStr =
        m.heritage_threshold_inches !== null && m.heritage_threshold_inches !== undefined
          ? imp
            ? `${m.heritage_threshold_inches} in`
            : `${inToCm(m.heritage_threshold_inches, 1)} cm / ${m.heritage_threshold_inches} in`
          : 'N/A';
      return `${m.name}, ${m.state} (Protected &gt;= ${pStr}, Heritage &gt;= ${hStr})`;
    };

    const txOptions = CENTRAL_TEXAS_MUNICIPALITIES.map(
      (m) => `<option value="${m.id}">${fmtMuniThresholds(m)}</option>`
    ).join('');
    const orOptions = ROGUE_VALLEY_MUNICIPALITIES.map(
      (m) => `<option value="${m.id}">${fmtMuniThresholds(m)}</option>`
    ).join('');

    muniSelect.innerHTML = [
      `<optgroup label="Central Texas (TX)">${txOptions}</optgroup>`,
      `<optgroup label="Rogue Valley, Oregon (OR)">${orOptions}</optgroup>`,
    ].join('');
    if (prevVal) {
      muniSelect.value = prevVal;
    }
  }
  populateMunicipalitySelect();

  // Populate Species preset dropdown
  const speciesSelect = el('input-species-preset');
  if (speciesSelect) {
    speciesSelect.innerHTML = [
      ...ALL_SPECIES_PRESETS.map(
        (s) => `<option value="${s.scientific}">${s.common} (${s.scientific})</option>`
      ),
      `<option value="custom">Custom Species (Enter below)</option>`,
    ].join('');
  }

  // Populate Preset quick buttons with all 5 GALLERY_CASES
  const presetBar = el('preset-buttons');
  if (presetBar) {
    presetBar.innerHTML = GALLERY_CASES.map(
      (c, idx) =>
        `<button type="button" class="btn-preset ${idx === 0 ? 'active' : ''}" data-case-id="${c.id}">${c.label}</button>`
    ).join('');

    presetBar.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-case-id]');
      if (!btn) return;
      const found = GALLERY_CASES.find((c) => c.id === btn.dataset.caseId);
      if (!found) return;
      document.querySelectorAll('.btn-preset').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      loadCaseIntoForm(found);
    });
  }

  let currentPermalinkHash = '';
  let isReceiverModeActive = false;

  function escapeUiHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function setInputMeta(inputId, labelId, hintId, meta) {
    const input = el(inputId);
    const label = el(labelId);
    const hint = el(hintId);
    if (label && meta.label) label.textContent = meta.label;
    if (hint && meta.hint) hint.textContent = meta.hint;
    if (input) {
      if (meta.min !== undefined) input.min = String(meta.min);
      if (meta.max !== undefined) input.max = String(meta.max);
      if (meta.step !== undefined) input.step = String(meta.step);
      if (meta.value !== undefined) input.value = String(meta.value);
    }
  }

  function syncUnitInputsUI() {
    const imp = isImperialUnits();
    const dbhInEl = el('input-dbh-inches');
    const dbhCmEl = el('input-dbh-cm');
    const dbhInVal = Math.round((canonicalFieldState.dbh_cm / 2.54) * 100) / 100;

    if (imp) {
      if (dbhInEl) {
        dbhInEl.readOnly = false;
        dbhInEl.required = true;
      }
      if (dbhCmEl) {
        dbhCmEl.readOnly = true;
        dbhCmEl.required = false;
      }
      setInputMeta('input-dbh-inches', 'label-dbh-in', 'hint-dbh-in', {
        label: 'Trunk DBH (Inches)',
        hint: 'Diameter at 4.5 ft (0.5 to 500 in)',
        min: 0.5,
        max: 500,
        step: 0.1,
        value: dbhInVal,
      });
      setInputMeta('input-dbh-cm', 'label-dbh-cm', 'hint-dbh-cm', {
        label: 'Synced DBH (cm)',
        hint: 'Synced metric diameter (cm)',
        min: 1,
        max: 1500,
        step: 0.01,
        value: canonicalFieldState.dbh_cm,
      });
      setInputMeta('input-stems-inches', 'label-stems', 'hint-stems', {
        label: 'Stem Diameters (Inches, comma-separated)',
        hint: 'Example: 20, 14, 10 (in)',
        value: canonicalFieldState.stem_diameters_cm.map((cm) => cmToIn(cm, 1)).join(', '),
      });
      setInputMeta('input-height-m', 'label-height', 'hint-height', {
        label: 'Tree Height (ft)',
        hint: `Total height (${mToFt(canonicalFieldState.height_m, 1)} ft = ${canonicalFieldState.height_m} m)`,
        min: 1.5,
        max: 450,
        step: 0.5,
        value: mToFt(canonicalFieldState.height_m, 1),
      });
      setInputMeta('input-infiltration', 'label-inf', 'hint-inf', {
        label: 'Soil Infiltration (in/hr)',
        hint: `Ring infiltrometer (${mmHrToInHr(canonicalFieldState.infiltration_mm_hr)} in/hr = ${canonicalFieldState.infiltration_mm_hr} mm/hr)`,
        min: 0,
        max: 80,
        step: 0.05,
        value: mmHrToInHr(canonicalFieldState.infiltration_mm_hr),
      });
      setInputMeta('input-spread-ns-m', 'label-spread-ns', 'hint-ns', {
        label: 'Crown Spread N-S (ft)',
        hint: 'North-South dripline (ft)',
        min: 1.5,
        max: 450,
        step: 0.5,
        value: mToFt(canonicalFieldState.spread_ns_m, 1),
      });
      setInputMeta('input-spread-ew-m', 'label-spread-ew', 'hint-ew', {
        label: 'Crown Spread E-W (ft)',
        hint: 'East-West dripline (ft)',
        min: 1.5,
        max: 450,
        step: 0.5,
        value: mToFt(canonicalFieldState.spread_ew_m, 1),
      });
      setInputMeta('input-cutfill-in', 'label-cutfill', 'hint-cutfill', {
        label: 'Cut/Fill Depth Inside 1/2 CRZ (in)',
        hint: 'Typically max 4 in (10.2 cm) allowed',
        min: 0,
        max: 60,
        step: 0.5,
        value: Math.round(canonicalFieldState.cutfill_in * 100) / 100,
      });
      setInputMeta('input-root-flare-cm', 'label-rfd', 'hint-rfd', {
        label: 'Root Flare Diameter (in)',
        hint: 'Basal flare for AS 4970 SRZ (in)',
        min: 0.5,
        max: 1000,
        step: 0.2,
        value: cmToIn(canonicalFieldState.root_flare_cm, 1),
      });
      setInputMeta('input-burial-depth-cm', 'label-burial', 'hint-burial', {
        label: 'Root Flare Burial Depth (in)',
        hint: 'Soil or mulch burial above flare (in)',
        min: 0,
        max: 80,
        step: 0.2,
        value: cmToIn(canonicalFieldState.burial_depth_cm, 1),
      });
      setInputMeta('input-trench-length-m', 'label-trench-len', 'hint-trench-len', {
        label: 'Trench Length (ft)',
        hint: 'Mean spoke length (ft)',
        min: 0,
        max: 165,
        step: 0.5,
        value: mToFt(canonicalFieldState.trench_length_m, 1),
      });
      setInputMeta('input-trench-width-cm', 'label-tw', 'hint-tw', {
        label: 'Trench Width (in)',
        hint: 'Default 11.8 in (30 cm)',
        min: 0,
        max: 40,
        step: 0.2,
        value: cmToIn(canonicalFieldState.trench_width_cm, 1),
      });
      setInputMeta('input-trench-depth-cm', 'label-td', 'hint-td', {
        label: 'Trench Depth (in)',
        hint: 'Default 13.8 in (35 cm)',
        min: 0,
        max: 40,
        step: 0.2,
        value: cmToIn(canonicalFieldState.trench_depth_cm, 1),
      });
      setInputMeta('input-rce-radius-m', 'label-rce', 'hint-rce', {
        label: 'Root Collar Basin Radius (ft)',
        hint: 'Excavation radius around flare (ft)',
        min: 0,
        max: 35,
        step: 0.2,
        value: mToFt(canonicalFieldState.rce_radius_m, 1),
      });
      setInputMeta('input-airspade-psi', 'label-psi', 'hint-psi', {
        label: 'AirSpade Pressure (psi)',
        hint: `Supersonic nozzle (${Math.round(canonicalFieldState.airspade_psi)} psi = ${Math.round(canonicalFieldState.airspade_psi * 0.0689476 * 10) / 10} bar)`,
        min: 0,
        max: 250,
        step: 5,
        value: Math.round(canonicalFieldState.airspade_psi),
      });
    } else {
      if (dbhCmEl) {
        dbhCmEl.readOnly = false;
        dbhCmEl.required = true;
      }
      if (dbhInEl) {
        dbhInEl.readOnly = true;
        dbhInEl.required = false;
      }
      setInputMeta('input-dbh-inches', 'label-dbh-in', 'hint-dbh-in', {
        label: 'Synced DBH (Inches)',
        hint: 'Synced US Imperial diameter (in)',
        min: 0.5,
        max: 500,
        step: 0.1,
        value: dbhInVal,
      });
      setInputMeta('input-dbh-cm', 'label-dbh-cm', 'hint-dbh-cm', {
        label: 'Trunk DBH (cm)',
        hint: 'Diameter at 1.37 m (1.3 to 1270 cm)',
        min: 1,
        max: 1500,
        step: 0.1,
        value: canonicalFieldState.dbh_cm,
      });
      setInputMeta('input-stems-inches', 'label-stems', 'hint-stems', {
        label: 'Stem Diameters (cm, comma-separated)',
        hint: 'Example: 50.8, 35.6, 25.4 (cm)',
        value: canonicalFieldState.stem_diameters_cm.join(', '),
      });
      setInputMeta('input-height-m', 'label-height', 'hint-height', {
        label: 'Tree Height (m)',
        hint: `Total height (${canonicalFieldState.height_m} m = ${mToFt(canonicalFieldState.height_m, 1)} ft)`,
        min: 0.5,
        max: 140,
        step: 0.1,
        value: canonicalFieldState.height_m,
      });
      setInputMeta('input-infiltration', 'label-inf', 'hint-inf', {
        label: 'Soil Infiltration (mm/hr)',
        hint: `Ring infiltrometer (${canonicalFieldState.infiltration_mm_hr} mm/hr = ${mmHrToInHr(canonicalFieldState.infiltration_mm_hr)} in/hr)`,
        min: 0,
        max: 2000,
        step: 0.5,
        value: canonicalFieldState.infiltration_mm_hr,
      });
      setInputMeta('input-spread-ns-m', 'label-spread-ns', 'hint-ns', {
        label: 'Crown Spread N-S (m)',
        hint: 'North-South dripline (m)',
        min: 0.5,
        max: 140,
        step: 0.5,
        value: canonicalFieldState.spread_ns_m,
      });
      setInputMeta('input-spread-ew-m', 'label-spread-ew', 'hint-ew', {
        label: 'Crown Spread E-W (m)',
        hint: 'East-West dripline (m)',
        min: 0.5,
        max: 140,
        step: 0.5,
        value: canonicalFieldState.spread_ew_m,
      });
      setInputMeta('input-cutfill-in', 'label-cutfill', 'hint-cutfill', {
        label: 'Cut/Fill Depth Inside 1/2 CRZ (cm)',
        hint: 'Typically max 10.2 cm (4 in) allowed',
        min: 0,
        max: 150,
        step: 0.5,
        value: inToCm(canonicalFieldState.cutfill_in, 1),
      });
      setInputMeta('input-root-flare-cm', 'label-rfd', 'hint-rfd', {
        label: 'Root Flare Diameter (cm)',
        hint: 'Basal flare for AS 4970 SRZ (cm)',
        min: 1,
        max: 2500,
        step: 0.5,
        value: canonicalFieldState.root_flare_cm,
      });
      setInputMeta('input-burial-depth-cm', 'label-burial', 'hint-burial', {
        label: 'Root Flare Burial Depth (cm)',
        hint: 'Soil or mulch burial above flare (cm)',
        min: 0,
        max: 200,
        step: 0.5,
        value: canonicalFieldState.burial_depth_cm,
      });
      setInputMeta('input-trench-length-m', 'label-trench-len', 'hint-trench-len', {
        label: 'Trench Length (m)',
        hint: 'Mean spoke length (m)',
        min: 0,
        max: 50,
        step: 0.1,
        value: canonicalFieldState.trench_length_m,
      });
      setInputMeta('input-trench-width-cm', 'label-tw', 'hint-tw', {
        label: 'Trench Width (cm)',
        hint: 'Default 30 cm (11.8 in)',
        min: 0,
        max: 100,
        step: 1,
        value: canonicalFieldState.trench_width_cm,
      });
      setInputMeta('input-trench-depth-cm', 'label-td', 'hint-td', {
        label: 'Trench Depth (cm)',
        hint: 'Default 35 cm (13.8 in)',
        min: 0,
        max: 100,
        step: 1,
        value: canonicalFieldState.trench_depth_cm,
      });
      setInputMeta('input-rce-radius-m', 'label-rce', 'hint-rce', {
        label: 'Root Collar Basin Radius (m)',
        hint: 'Excavation radius around flare (m)',
        min: 0,
        max: 10,
        step: 0.05,
        value: canonicalFieldState.rce_radius_m,
      });
      setInputMeta('input-airspade-psi', 'label-psi', 'hint-psi', {
        label: 'AirSpade Pressure (bar)',
        hint: `Supersonic nozzle (${Math.round(canonicalFieldState.airspade_psi * 0.0689476 * 10) / 10} bar = ${Math.round(canonicalFieldState.airspade_psi)} psi)`,
        min: 0,
        max: 18,
        step: 0.5,
        value: Math.round(canonicalFieldState.airspade_psi * 0.0689476 * 10) / 10,
      });
    }
  }

  function getCurrentCaseStateFromForm() {
    return {
      id: activePreset?.id || 'field-case',
      label: activePreset?.label || 'Field Assessment',
      ordinance_id: el('input-ordinance-id')?.value || 'tx-austin',
      condition_class: el('input-condition-class')?.value || 'Good',
      site_condition: el('input-site-condition')?.value || 'Open Grown / Parkland',
      proposed_removal: Boolean(el('input-proposed-removal')?.checked),
      pruning_date: el('input-pruning-date')?.value || '',
      crz_disturbed_pct: Number(el('input-crz-disturbed-pct')?.value) || 0,
      cutfill_depth_in: Math.max(0, Number(canonicalFieldState.cutfill_in) || 0),
      impervious_pct: Number(el('input-impervious-pct')?.value) || 0,
      crown_removal_pct: Number(el('input-crown-removal-pct')?.value) || 0,
      assessment: latestAssessment,
    };
  }

  function loadCaseIntoForm(caseObj) {
    activePreset = JSON.parse(JSON.stringify(caseObj));
    const a = activePreset.assessment;
    const sb = a.structural_baseline;
    const rh = a.rhizosphere_and_root_collar;
    const air = rh.airspade_radial_trenching_geometry;
    const soil = a.soil_and_microbiome_baseline;
    const myco = soil.mycorrhizal_and_fungal_observations;
    const traq = sb.isa_traq_risk;
    const disp = sb.municipal_permit_disposition;

    el('input-ordinance-id').value = activePreset.ordinance_id || disp.jurisdiction_id || 'tx-austin';
    el('input-tree-tag').value = sb.tree_tag || 'ATX-QV-101';
    el('input-assessment-date').value = sb.assessment_date || '2026-10-28';
    el('input-plus-code').value = sb.plus_code_global || '86247784+VP';

    const matchedSpecies = ALL_SPECIES_PRESETS.find(
      (s) => s.scientific.toLowerCase() === String(sb.species_scientific || '').toLowerCase()
    );
    el('input-species-preset').value = matchedSpecies ? matchedSpecies.scientific : 'custom';
    el('input-species-common').value = sb.species_common || 'Live Oak';
    el('input-species-scientific').value = sb.species_scientific || 'Quercus virginiana';
    el('input-taxon-id').value = sb.inaturalist_taxon_id || 49005;

    const isMulti = Boolean(sb.is_multistem);
    el('input-multistem-mode').value = isMulti ? sb.multistem_aggregation_method || 'largest_plus_half' : 'single_stem';
    canonicalFieldState = {
      dbh_cm: sb.dbh_cm,
      stem_diameters_cm:
        isMulti && Array.isArray(sb.stem_diameters_cm) && sb.stem_diameters_cm.length > 0
          ? [...sb.stem_diameters_cm]
          : [sb.dbh_cm],
      height_m: sb.height_m,
      spread_ns_m: sb.crown_spread_ns_m,
      spread_ew_m: sb.crown_spread_ew_m,
      cutfill_in: activePreset.cutfill_depth_in ?? 0,
      root_flare_cm: rh.root_flare_diameter_cm,
      burial_depth_cm: rh.root_flare_burial_depth_cm,
      trench_length_m: air.trench_length_m,
      trench_width_cm: air.trench_width_cm,
      trench_depth_cm: air.trench_depth_cm,
      rce_radius_m: air.root_collar_excavation_radius_m,
      infiltration_mm_hr: soil.infiltration_rate_mm_hr,
      airspade_psi: air.operating_pressure_psi,
    };

    el('input-condition-class').value = activePreset.condition_class || 'Good';
    el('input-site-condition').value = activePreset.site_condition || 'Open Grown / Parkland';
    el('input-lcr-pct').value = sb.live_crown_ratio_pct;

    el('input-disposition').value = disp.recommended_disposition || 'Preservation_With_Rhizosphere_Remediation';
    el('input-proposed-removal').checked =
      Boolean(activePreset.proposed_removal) ||
      disp.recommended_disposition === 'Removal_Last_Resort_Unmitigable_Hazard';
    el('input-pruning-date').value = activePreset.pruning_date || '';
    el('input-crz-disturbed-pct').value = activePreset.crz_disturbed_pct ?? 0;
    el('input-impervious-pct').value = activePreset.impervious_pct ?? 0;
    el('input-crown-removal-pct').value = activePreset.crown_removal_pct ?? 0;

    el('input-t-over-r').value = sb.sound_shell_thickness_ratio_t_over_r ?? 0.38;
    el('input-codit').value = sb.codit_wall_response_rating || 'Wall_4_Active_Barrier_Zone';
    if (el('input-tomogram-uri')) {
      el('input-tomogram-uri').value = sb.sonic_tomography_or_resistograph_uri || '';
    }
    el('input-sgr-count').value = rh.stem_girdling_root_count;
    el('input-sgr-severity').value = rh.stem_girdling_root_severity;

    el('input-trench-count').value = air.trench_count;

    el('input-bulk-density').value = soil.bulk_density_g_cm3;
    el('input-som-pct').value = soil.organic_matter_pct;
    el('input-soil-ph').value = soil.soil_ph;
    el('input-fb-ratio').value = myco.fungal_to_bacterial_biomass_ratio ?? 0.5;
    el('input-myco-guild').value = myco.dominant_mycorrhizal_guild || 'Ectomycorrhizal_EM';
    if (el('input-lab-sample-id')) {
      el('input-lab-sample-id').value = soil.lab_sample_id || 'SOIL-LAB-001';
    }
    if (el('input-ref-ecosystem')) {
      el('input-ref-ecosystem').value =
        a.understory_and_guild_prescription?.reference_ecosystem_name ||
        'Central Texas Live Oak Savanna';
    }
    if (el('input-stim-hypothesis')) {
      el('input-stim-hypothesis').value =
        a.outcome_monitoring_schedule?.stim_hypothesis_statement || '';
    }

    el('input-traq-level').value = traq.assessment_level;
    el('input-traq-part').value = traq.primary_tree_part_of_concern || 'Root_Collar';
    el('input-traq-lof').value = traq.likelihood_of_failure;
    el('input-traq-loi').value = traq.likelihood_of_impact;
    el('input-traq-lofi').value = traq.likelihood_of_failure_and_impact;
    el('input-traq-cof').value = traq.consequences_of_failure;
    el('input-traq-overall').value = traq.overall_risk_rating;
    el('input-traq-residual').value = traq.residual_risk_rating || 'Low';

    syncUnitInputsUI();
    toggleMultiStemInputs();
    recalculateAndRender();
  }

  function toggleMultiStemInputs() {
    const mode = el('input-multistem-mode').value;
    const multiWrap = el('multistem-input-wrap');
    const singleWrap = el('singlestem-input-wrap');
    if (mode === 'single_stem') {
      multiWrap.hidden = true;
      singleWrap.hidden = false;
    } else {
      multiWrap.hidden = false;
      singleWrap.hidden = true;
    }
  }

  el('input-species-preset')?.addEventListener('change', () => {
    const val = el('input-species-preset').value;
    const found = ALL_SPECIES_PRESETS.find((s) => s.scientific === val);
    if (found) {
      el('input-species-common').value = found.common;
      el('input-species-scientific').value = found.scientific;
      el('input-taxon-id').value = found.taxon_id;
      el('input-myco-guild').value = found.guild;
      recalculateAndRender();
    }
  });

  el('input-multistem-mode')?.addEventListener('change', () => {
    toggleMultiStemInputs();
    syncDbhFromInputs();
    recalculateAndRender();
  });

  function syncDbhFromInputs() {
    const mode = el('input-multistem-mode').value;
    const imp = isImperialUnits();
    if (mode === 'single_stem') {
      if (imp) {
        const dbhIn = Math.max(0.1, Number(el('input-dbh-inches').value) || 20);
        canonicalFieldState.dbh_cm = Math.round(dbhIn * 2.54 * 100) / 100;
        el('input-dbh-cm').value = String(canonicalFieldState.dbh_cm);
      } else {
        const dbhCm = Math.max(0.5, Number(el('input-dbh-cm').value) || 50.8);
        canonicalFieldState.dbh_cm = Math.round(dbhCm * 100) / 100;
        el('input-dbh-inches').value = String(Math.round((canonicalFieldState.dbh_cm / 2.54) * 100) / 100);
      }
    } else {
      const rawStems = String(el('input-stems-inches').value || '')
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => n > 0);
      const stemsIn = imp
        ? rawStems.length > 0
          ? rawStems
          : [20, 14]
        : rawStems.length > 0
        ? rawStems.map((cm) => cm / 2.54)
        : [20, 14];
      const aggIn = calculateMultiStemDBH(stemsIn, mode);
      canonicalFieldState.stem_diameters_cm = stemsIn.map(
        (d) => Math.round(d * 2.54 * 100) / 100
      );
      canonicalFieldState.dbh_cm = Math.round(aggIn * 2.54 * 100) / 100;
      el('input-dbh-inches').value = String(aggIn);
      el('input-dbh-cm').value = String(canonicalFieldState.dbh_cm);
    }
  }

  function handleUnitFieldInput(target) {
    if (!target || !target.id) return;
    const imp = isImperialUnits();
    const raw = Number(target.value);
    switch (target.id) {
      case 'input-dbh-inches':
        if (imp && Number.isFinite(raw) && raw > 0) {
          canonicalFieldState.dbh_cm = Math.round(raw * 2.54 * 100) / 100;
          el('input-dbh-cm').value = String(canonicalFieldState.dbh_cm);
        }
        break;
      case 'input-dbh-cm':
        if (!imp && Number.isFinite(raw) && raw > 0) {
          canonicalFieldState.dbh_cm = Math.round(raw * 100) / 100;
          el('input-dbh-inches').value = String(
            Math.round((canonicalFieldState.dbh_cm / 2.54) * 100) / 100
          );
        }
        break;
      case 'input-stems-inches':
        syncDbhFromInputs();
        break;
      case 'input-height-m':
        if (Number.isFinite(raw) && raw > 0) {
          canonicalFieldState.height_m = imp ? ftToM(raw, 2) : Math.round(raw * 100) / 100;
        }
        break;
      case 'input-infiltration':
        if (Number.isFinite(raw) && raw >= 0) {
          canonicalFieldState.infiltration_mm_hr = imp ? inHrToMmHr(raw) : Math.round(raw * 10) / 10;
        }
        break;
      case 'input-spread-ns-m':
        if (Number.isFinite(raw) && raw > 0) {
          canonicalFieldState.spread_ns_m = imp ? ftToM(raw, 2) : Math.round(raw * 100) / 100;
        }
        break;
      case 'input-spread-ew-m':
        if (Number.isFinite(raw) && raw > 0) {
          canonicalFieldState.spread_ew_m = imp ? ftToM(raw, 2) : Math.round(raw * 100) / 100;
        }
        break;
      case 'input-cutfill-in':
        if (Number.isFinite(raw) && raw >= 0) {
          canonicalFieldState.cutfill_in = imp ? raw : cmToIn(raw, 2);
        }
        break;
      case 'input-root-flare-cm':
        if (Number.isFinite(raw) && raw > 0) {
          canonicalFieldState.root_flare_cm = imp ? inToCm(raw, 1) : Math.round(raw * 10) / 10;
        }
        break;
      case 'input-burial-depth-cm':
        if (Number.isFinite(raw) && raw >= 0) {
          canonicalFieldState.burial_depth_cm = imp ? inToCm(raw, 1) : Math.round(raw * 10) / 10;
        }
        break;
      case 'input-trench-length-m':
        if (Number.isFinite(raw) && raw >= 0) {
          canonicalFieldState.trench_length_m = imp ? ftToM(raw, 2) : Math.round(raw * 100) / 100;
        }
        break;
      case 'input-trench-width-cm':
        if (Number.isFinite(raw) && raw >= 0) {
          canonicalFieldState.trench_width_cm = imp ? inToCm(raw, 1) : Math.round(raw * 10) / 10;
        }
        break;
      case 'input-trench-depth-cm':
        if (Number.isFinite(raw) && raw >= 0) {
          canonicalFieldState.trench_depth_cm = imp ? inToCm(raw, 1) : Math.round(raw * 10) / 10;
        }
        break;
      case 'input-rce-radius-m':
        if (Number.isFinite(raw) && raw >= 0) {
          canonicalFieldState.rce_radius_m = imp ? ftToM(raw, 2) : Math.round(raw * 100) / 100;
        }
        break;
      case 'input-airspade-psi':
        if (Number.isFinite(raw) && raw >= 0) {
          canonicalFieldState.airspade_psi = imp
            ? Math.round(raw)
            : Math.round(raw / 0.0689476);
        }
        break;
      default:
        break;
    }
  }

  // GPS-to-Plus-Code button
  el('btn-gps-locate')?.addEventListener('click', () => {
    const statusSpan = el('gps-status');
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      if (statusSpan) statusSpan.textContent = 'Geolocation API not available on this device.';
      return;
    }
    if (statusSpan) statusSpan.textContent = 'Acquiring GPS fix...';
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const plus = encodePlusCode(pos.coords.latitude, pos.coords.longitude);
        el('input-plus-code').value = plus;
        if (statusSpan) {
          statusSpan.textContent = `GPS locked: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)} (${plus})`;
        }
        recalculateAndRender();
      },
      (err) => {
        if (statusSpan) statusSpan.textContent = `GPS unavailable (${err.message}). Using entered Plus Code.`;
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });

  // Build RAP_v2 assessment JSON from current form state
  function buildAssessmentFromForm() {
    const base = JSON.parse(JSON.stringify(activePreset.assessment));
    const sb = base.structural_baseline;
    const rh = base.rhizosphere_and_root_collar;
    const air = rh.airspade_radial_trenching_geometry;
    const soil = base.soil_and_microbiome_baseline;
    const myco = soil.mycorrhizal_and_fungal_observations;
    const traq = sb.isa_traq_risk;
    const disp = sb.municipal_permit_disposition;

    const ordId = el('input-ordinance-id').value || 'tx-austin';
    const muni = findMunicipality(ordId);

    sb.tree_tag = el('input-tree-tag').value.trim() || 'ATX-TREE-01';
    sb.assessment_date = el('input-assessment-date').value || '2026-10-28';
    sb.plus_code_global = (el('input-plus-code').value.trim() || '86247784+VP').toUpperCase();
    sb.species_common = el('input-species-common').value.trim() || 'Live Oak';
    sb.species_scientific = el('input-species-scientific').value.trim() || 'Quercus virginiana';
    sb.inaturalist_taxon_id = Math.max(1, Math.round(Number(el('input-taxon-id').value) || 49005));

    const mode = el('input-multistem-mode').value;
    if (mode === 'single_stem') {
      sb.is_multistem = false;
      sb.multistem_aggregation_method = 'single_stem';
      delete sb.stem_diameters_cm;
      sb.dbh_cm = Math.max(0.5, Number(canonicalFieldState.dbh_cm) || 50.8);
    } else {
      const validStemsCm =
        Array.isArray(canonicalFieldState.stem_diameters_cm) &&
        canonicalFieldState.stem_diameters_cm.length > 0
          ? canonicalFieldState.stem_diameters_cm
          : [50.8, 35.56];
      sb.is_multistem = true;
      sb.multistem_aggregation_method = mode;
      sb.stem_diameters_cm = [...validStemsCm];
      sb.dbh_cm = Math.max(0.5, Number(canonicalFieldState.dbh_cm) || 50.8);
    }

    sb.height_m = Math.max(0.5, Number(canonicalFieldState.height_m) || 15);
    sb.crown_spread_ns_m = Math.max(0.5, Number(canonicalFieldState.spread_ns_m) || 15);
    sb.crown_spread_ew_m = Math.max(0.5, Number(canonicalFieldState.spread_ew_m) || 15);
    sb.live_crown_ratio_pct = Math.min(100, Math.max(0, Number(el('input-lcr-pct').value) || 70));

    sb.sound_shell_thickness_ratio_t_over_r = Math.min(
      1.0,
      Math.max(0.0, Number(el('input-t-over-r').value) || 0.35)
    );
    sb.codit_wall_response_rating = el('input-codit').value.trim() || 'Wall_4_Active_Barrier_Zone';
    const tomogramUri = el('input-tomogram-uri')?.value.trim() || '';
    if (tomogramUri) {
      sb.sonic_tomography_or_resistograph_uri = tomogramUri;
    } else {
      delete sb.sonic_tomography_or_resistograph_uri;
    }

    rh.root_flare_diameter_cm = Math.max(
      1,
      Number(canonicalFieldState.root_flare_cm) || sb.dbh_cm * 1.25
    );
    rh.root_flare_burial_depth_cm = Math.max(0, Number(canonicalFieldState.burial_depth_cm) || 0);
    rh.stem_girdling_root_count = Math.max(0, Math.round(Number(el('input-sgr-count').value) || 0));
    rh.stem_girdling_root_severity = el('input-sgr-severity').value || 'None';

    air.trench_count = Math.max(0, Math.round(Number(el('input-trench-count').value) || 6));
    air.trench_length_m = Math.max(0, Number(canonicalFieldState.trench_length_m) || 6.5);
    air.trench_width_cm = Math.max(0, Number(canonicalFieldState.trench_width_cm) || 30);
    air.trench_depth_cm = Math.max(0, Number(canonicalFieldState.trench_depth_cm) || 35);
    air.root_collar_excavation_radius_m = Math.max(
      0,
      Number(canonicalFieldState.rce_radius_m) || 0.9
    );
    air.operating_pressure_psi = Math.max(0, Number(canonicalFieldState.airspade_psi) || 150);

    soil.bulk_density_g_cm3 = Math.min(2.65, Math.max(0.1, Number(el('input-bulk-density').value) || 1.45));
    soil.infiltration_rate_mm_hr = Math.max(0, Number(canonicalFieldState.infiltration_mm_hr) || 20);
    soil.organic_matter_pct = Math.min(100, Math.max(0, Number(el('input-som-pct').value) || 2.8));
    soil.soil_ph = Math.min(11, Math.max(2, Number(el('input-soil-ph').value) || 7.2));
    myco.fungal_to_bacterial_biomass_ratio = Math.max(0, Number(el('input-fb-ratio').value) || 0.5);
    myco.dominant_mycorrhizal_guild = el('input-myco-guild').value || 'Ectomycorrhizal_EM';
    if (el('input-lab-sample-id')?.value.trim()) {
      soil.lab_sample_id = el('input-lab-sample-id').value.trim();
    }
    if (el('input-ref-ecosystem')?.value.trim() && base.understory_and_guild_prescription) {
      base.understory_and_guild_prescription.reference_ecosystem_name = el('input-ref-ecosystem').value.trim();
    }
    if (el('input-stim-hypothesis')?.value.trim() && base.outcome_monitoring_schedule) {
      base.outcome_monitoring_schedule.stim_hypothesis_statement = el('input-stim-hypothesis').value.trim();
    }

    traq.assessment_level = el('input-traq-level').value;
    traq.primary_tree_part_of_concern = el('input-traq-part').value;
    traq.likelihood_of_failure = el('input-traq-lof').value;
    traq.likelihood_of_impact = el('input-traq-loi').value;
    traq.likelihood_of_failure_and_impact = el('input-traq-lofi').value;
    traq.consequences_of_failure = el('input-traq-cof').value;
    traq.overall_risk_rating = el('input-traq-overall').value;
    traq.residual_risk_rating = el('input-traq-residual').value;

    disp.jurisdiction_id = ordId;
    disp.ordinance_citation =
      muni?.permit_triggers_by_work_type?.citation ||
      muni?.mitigation_fee_schedule?.citation ||
      muni?.ordinance_numbers ||
      'Municipal Tree Code';
    disp.recommended_disposition = el('input-disposition').value;

    // Check if current assessment matches unmodified preset
    const isUnmodifiedPreset =
      JSON.stringify({
        ordId,
        tag: sb.tree_tag,
        dbh_cm: sb.dbh_cm,
        t_over_r: sb.sound_shell_thickness_ratio_t_over_r,
        tomogramUri,
        disp: disp.recommended_disposition,
        rfd: rh.root_flare_diameter_cm,
        burial: rh.root_flare_burial_depth_cm,
        sgr: rh.stem_girdling_root_count,
        trenchCount: air.trench_count,
        trenchLen: air.trench_length_m,
        bd: soil.bulk_density_g_cm3,
        inf: soil.infiltration_rate_mm_hr,
        som: soil.organic_matter_pct,
        fb: myco.fungal_to_bacterial_biomass_ratio,
        traqOverall: traq.overall_risk_rating,
      }) ===
      JSON.stringify({
        ordId: activePreset.ordinance_id,
        tag: activePreset.assessment.structural_baseline.tree_tag,
        dbh_cm: activePreset.assessment.structural_baseline.dbh_cm,
        t_over_r: activePreset.assessment.structural_baseline.sound_shell_thickness_ratio_t_over_r,
        tomogramUri: activePreset.assessment.structural_baseline.sonic_tomography_or_resistograph_uri || '',
        disp: activePreset.assessment.structural_baseline.municipal_permit_disposition.recommended_disposition,
        rfd: activePreset.assessment.rhizosphere_and_root_collar.root_flare_diameter_cm,
        burial: activePreset.assessment.rhizosphere_and_root_collar.root_flare_burial_depth_cm,
        sgr: activePreset.assessment.rhizosphere_and_root_collar.stem_girdling_root_count,
        trenchCount:
          activePreset.assessment.rhizosphere_and_root_collar.airspade_radial_trenching_geometry.trench_count,
        trenchLen:
          activePreset.assessment.rhizosphere_and_root_collar.airspade_radial_trenching_geometry.trench_length_m,
        bd: activePreset.assessment.soil_and_microbiome_baseline.bulk_density_g_cm3,
        inf: activePreset.assessment.soil_and_microbiome_baseline.infiltration_rate_mm_hr,
        som: activePreset.assessment.soil_and_microbiome_baseline.organic_matter_pct,
        fb: activePreset.assessment.soil_and_microbiome_baseline.mycorrhizal_and_fungal_observations
          .fungal_to_bacterial_biomass_ratio,
        traqOverall: activePreset.assessment.structural_baseline.isa_traq_risk.overall_risk_rating,
      });

    if (isUnmodifiedPreset) {
      return JSON.parse(JSON.stringify(activePreset.assessment));
    }

    // Recompute root zones and dual_valuation when user edits biometrics in the form
    const dbhIn = sb.dbh_cm / 2.54;
    const crz = calculateCRZ(dbhIn, 1.0);
    const srz = calculateSRZ(rh.root_flare_diameter_cm / 2.54, dbhIn);
    rh.crz_radius_m = Math.max(0.5, crz.radius_meters);
    rh.srz_radius_m = Math.max(0.5, srz.radius_meters);
    rh.tiz_radius_m = Math.max(0.5, Math.round(crz.radius_meters * 1.5 * 100) / 100);

    const val = computeHolobiontValuation(base);
    sb.dual_valuation = {
      ctla_10th_ed_depreciated_usd: val.ctla_10th_ed_depreciated_usd,
      holobiont_200yr_biological_equity_usd: val.holobiont_200yr_biological_equity_usd,
      veteran_keystone_habitat_multiplier: val.veteran_keystone_habitat_multiplier,
      valuation_delta_usd: val.valuation_delta_usd,
    };

    const tempEval = evaluateTreeInventory(
      [
        {
          tag: sb.tree_tag,
          species_common: sb.species_common,
          species_scientific: sb.species_scientific,
          dbh_inches: dbhIn,
          removal: disp.recommended_disposition === 'Removal_Last_Resort_Unmitigable_Hazard',
        },
      ],
      muni
    );
    const tempPermit = permitDetermination(tempEval, muni);
    disp.protection_tier = tempEval[0].heritage
      ? 'Heritage'
      : tempEval[0].protected
      ? 'Protected'
      : tempEval[0].excepted
      ? 'Excepted_Species'
      : 'Unprotected';
    disp.permit_required = Boolean(tempPermit.required);

    return base;
  }

  function recalculateAndRender() {
    try {
      const assessment = buildAssessmentFromForm();
      const options = {
        ordinance_id: el('input-ordinance-id').value || 'tx-austin',
        condition_class: el('input-condition-class').value || 'Good',
        site_condition: el('input-site-condition').value || 'Open Grown / Parkland',
        proposed_removal: el('input-proposed-removal').checked,
        pruning_date: el('input-pruning-date').value || null,
        crz_disturbed_pct: Number(el('input-crz-disturbed-pct').value) || 0,
        cutfill_depth_in: Math.max(0, Number(canonicalFieldState.cutfill_in) || 0),
        impervious_pct: Number(el('input-impervious-pct').value) || 0,
        crown_removal_pct: Number(el('input-crown-removal-pct').value) || 0,
      };

      const res = evaluateCompleteFieldCase(assessment, options);
      latestAssessment = assessment;
      latestResult = res;
      renderAllOutputs(assessment, res);

      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new CustomEvent('openarbor:field-updated', { detail: { assessment, result: res } }));
      }
    } catch (err) {
      const errBanner = el('error-banner');
      if (errBanner) {
        errBanner.hidden = false;
        errBanner.textContent = `Calculation Notice: ${err.message}`;
      }
    }
  }

  function renderAllOutputs(assessment, res) {
    const errBanner = el('error-banner');
    if (errBanner) errBanner.hidden = true;

    const imp = isImperialUnits();
    const muni = res.municipality;
    const row = res.evaluatedRow;
    const bio = res.biomechanics;
    const val = res.valuation;
    const econ = res.economics;
    const eco = res.ecosystemBenefits;
    const age = res.ageEstimate;
    const mitIfRemoved = res.mitigationIfRemoved;
    const mitActive = res.mitigationActive;
    const labeledSiteMapSvg = (() => {
      const raw = String(res.svgSiteMap || '').trim();
      if (!raw.startsWith('<svg') || raw.includes('role="img"')) return raw;
      const safeLabel = escapeUiHtml(
        `ANSI A300 Part 5 and AS 4970 root protection map for ${assessment?.structural_baseline?.tree_tag || 'specimen'} (CRZ radius ${fmtDualFtM(res.rootZones.crz.radius_feet, res.rootZones.crz.radius_meters)}, SRZ radius ${fmtDualFtM(res.rootZones.srz.radius_feet, res.rootZones.srz.radius_meters)})`
      );
      return raw
        .replace(/^<svg\b/, `<svg role="img" aria-label="${safeLabel}"`)
        .replace(/>/, `><title>${safeLabel}</title>`);
    })();

    // 0. D1 Permalink & D2 Sticky Determination Bar Updates
    currentPermalinkHash = encodeAssessmentPermalink(getCurrentCaseStateFromForm());
    const fullShareUrl =
      typeof window !== 'undefined' && window.location
        ? `${window.location.origin}${window.location.pathname}${currentPermalinkHash}`
        : `https://openarbor.org/demo/${currentPermalinkHash}`;

    const permalinkDisplayEl = el('permalink-url-display');
    if (permalinkDisplayEl) {
      if ('value' in permalinkDisplayEl) {
        permalinkDisplayEl.value = fullShareUrl;
      } else {
        permalinkDisplayEl.textContent = fullShareUrl;
      }
    }

    const sticky = formatStickyDeterminationSummary(res);
    if (sticky) {
      const stStatus = el('sticky-status-val');
      const stDbh = el('sticky-dbh-val');
      const stCrz = el('sticky-crz-val');
      const stRep = el('sticky-replacement-val');
      const stCash = el('sticky-cash-val');
      if (stStatus) stStatus.textContent = `${sticky.status} (${sticky.permit_required})`;
      if (stDbh) stDbh.textContent = imp ? sticky.dbh : fmtDualInCm(bio.dbh_inches, bio.dbh_cm);
      if (stCrz) stCrz.textContent = imp ? sticky.crz : fmtDualFtM(res.rootZones.crz.radius_feet, res.rootZones.crz.radius_meters);
      if (stRep) {
        stRep.textContent = imp
          ? sticky.replacement_owed
          : fmtDualInCm(mitIfRemoved?.replacement_inches_owed || 0);
      }
      if (stCash) stCash.textContent = sticky.cash_in_lieu;
    }

    // D5. Provenance Surface & "What this record does not know" Panel
    const prov = inspectMunicipalityProvenance(muni);
    const provMetaStrip = el('provenance-meta-strip');
    const provUnverifiedPanel = el('provenance-unverified-panel');
    if (prov && provMetaStrip && provUnverifiedPanel) {
      provMetaStrip.innerHTML = `
        <span><strong>Dataset Version:</strong> ${prov.dataset_version}</span>
        <span><strong>Record ID:</strong> <code>${prov.record_id}</code></span>
        <span><strong>Record Tier:</strong> <span class="badge ${prov.record_tier === 'Full_Rule_Record' ? 'badge-protected' : 'badge-warn'}">${prov.record_tier}</span></span>
        <span><strong>Last Verified:</strong> ${prov.last_verified}</span>
        <span><strong>Primary Citation:</strong> <a href="${prov.source_url}" target="_blank" rel="noopener noreferrer">${prov.primary_citation}</a></span>
      `;

      if (prov.unverified_gaps.length === 0) {
        provUnverifiedPanel.innerHTML = `
          <div class="oa-prov-title"><strong>What this record does not know (<code>UNVERIFIED</code> statutory boundaries)</strong></div>
          <p class="clean-note" style="margin: 4px 0 0;"><code>Full_Rule_Record</code>: All 6 schema rule domains (DBH thresholds, species overrides, work-type permit triggers, survey rules, root-zone impact limits, and pruning standards) are encoded and cited.</p>
        `;
      } else {
        provUnverifiedPanel.innerHTML = `
          <div class="oa-prov-title"><strong>What this record does not know (<code>UNVERIFIED</code> statutory boundaries)</strong></div>
          <p class="muni-subtext" style="margin: 4px 0 6px;">This municipality is currently encoded at the <code>${prov.record_tier}</code> tier (${prov.unverified_gaps.length} unverified statutory sub-sections):</p>
          <ul class="flag-list">
            ${prov.unverified_gaps
              .map(
                (g) =>
                  `<li><strong><code>${g.field}</code> (status: <code>${g.status}</code>):</strong> ${g.description}</li>`
              )
              .join('')}
          </ul>
        `;
      }
    }

    // D6. Evidentiary Print Report (#evidentiary-print-sheet)
    const printBodyEl = el('print-report-dynamic-body');
    if (printBodyEl && prov) {
      const sb = assessment.structural_baseline || {};
      const rh = assessment.rhizosphere_and_root_collar || {};
      const provPrintHtml =
        prov.unverified_gaps.length === 0
          ? `<p><strong>Full_Rule_Record:</strong> All 6 schema rule domains (DBH thresholds, species overrides, work-type permit triggers, survey rules, root-zone impact limits, and pruning standards) are encoded and cited.</p>`
          : `<ul>${prov.unverified_gaps
              .map(
                (g) =>
                  `<li><strong>${g.field} (${g.status}):</strong> ${g.description}</li>`
              )
              .join('')}</ul>`;

      printBodyEl.innerHTML = `
        <div class="oa-print-header">
          <h2 class="oa-print-title">Open Arbor Evidentiary Determination Report</h2>
          <p class="oa-print-subtitle">
            <strong>Tree Tag:</strong> ${sb.tree_tag || 'T-01'} |
            <strong>Species:</strong> ${sb.species_common || 'Live Oak'} (<em>${sb.species_scientific || 'Quercus virginiana'}</em>) |
            <strong>Jurisdiction:</strong> ${prov.municipality_name} (<code>${prov.record_id}</code>)
          </p>
          <p class="oa-print-meta">
            <strong>Ordinance Citation:</strong> ${prov.primary_citation} |
            <strong>Dataset Version:</strong> ${prov.dataset_version} |
            <strong>Last Verified:</strong> ${prov.last_verified} |
            <strong>Record Tier:</strong> ${prov.record_tier}
          </p>
          <p class="oa-print-meta">
            <strong>Canonical SHA-256 Digest:</strong> ${renderExpandableHashHtml(res.compiledReport.sha256)}<br>
            <strong>Shareable Permalink Address:</strong> ${renderExpandableHashHtml(fullShareUrl, { headChars: 28, tailChars: 12 })}
          </p>
        </div>

        <section class="oa-print-section">
          <h3>Table 1. Tree Structural &amp; Biomechanical Baseline</h3>
          <div tabindex="0" role="region" aria-label="Table 1. Tree Structural and Biomechanical Baseline" class="table-wrapper">
            <table class="data-table" style="--label-1: 'DBH &amp; Method'; --label-2: 'Height &amp; Spread'; --label-3: 'Plus Code'; --label-4: 'Mattheck t/R'; --label-5: 'Flare Burial'; --label-6: 'SRZ / CRZ / TIZ';">
              <thead>
                <tr>
                  <th scope="col">DBH &amp; Method</th>
                  <th scope="col">Height &amp; Crown Spread</th>
                  <th scope="col">Global Plus Code</th>
                  <th scope="col">Mattheck t/R &amp; Stability</th>
                  <th scope="col">Root Flare Burial</th>
                  <th scope="col">Protection Zone Radii (SRZ / CRZ / TIZ)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${fmtDualInCm(bio.dbh_inches, bio.dbh_cm)} [${sb.multistem_aggregation_method || 'single_stem'}]</td>
                  <td>H: ${fmtDualFromMeters(sb.height_m)} | N-S: ${fmtDualFromMeters(sb.crown_spread_ns_m)} | E-W: ${fmtDualFromMeters(sb.crown_spread_ew_m)}</td>
                  <td><code>${sb.plus_code_global}</code></td>
                  <td>t/R = ${bio.biomechanics.sound_shell_thickness_ratio_t_over_r} (${bio.biomechanics.mattheck_criterion_satisfied ? 'Stable >= 0.30' : 'Thinning < 0.30'})</td>
                  <td>${fmtDualFromCm(rh.root_flare_burial_depth_cm ?? 0)} burial (Flare: ${fmtDualFromCm(rh.root_flare_diameter_cm)})</td>
                  <td>SRZ: ${fmtDualFtM(res.rootZones.srz.radius_feet, res.rootZones.srz.radius_meters)} | CRZ: ${fmtDualFtM(res.rootZones.crz.radius_feet, res.rootZones.crz.radius_meters)} | TIZ: ${fmtDualFromMeters(bio.root_zones.tiz_radius_meters)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="oa-print-section">
          <h3>Table 2. Municipal Ordinance Determination, Mitigation Schedule &amp; Epistemic Boundaries</h3>
          <div tabindex="0" role="region" aria-label="Table 2. Municipal Ordinance Determination and Mitigation Schedule" class="table-wrapper">
            <table class="data-table" style="--label-1: 'Protection Status'; --label-2: 'Permit Verdict'; --label-3: 'Replacement Owed'; --label-4: 'Cash-in-Lieu';">
              <thead>
                <tr>
                  <th scope="col">Protection Status</th>
                  <th scope="col">Permit Verdict</th>
                  <th scope="col">Replacement Caliper Owed (If Removed)</th>
                  <th scope="col">Cash-in-Lieu Obligation (If Removed)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>${statusLabel(row)}</strong></td>
                  <td><strong>${res.permit.unknown ? 'Verify with City (UNVERIFIED)' : res.permit.required ? 'PERMIT REQUIRED' : 'No Permit Triggered'}</strong> (${res.permitText})</td>
                  <td>${mitIfRemoved ? `${fmtDualInCm(mitIfRemoved.replacement_inches_owed)} (${mitIfRemoved.replacement_trees_owed} trees)` : '0 in'}</td>
                  <td><strong>$${Number(mitIfRemoved?.cash_in_lieu_usd || 0).toLocaleString()}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="oa-print-epistemic">
            <strong>What this record does not know (Epistemic &amp; Statutory Boundaries):</strong>
            ${provPrintHtml}
          </div>
        </section>

        <section class="oa-print-section">
          <h3>Figure 1. Deterministic Root Protection Zone Map (ANSI A300 Part 5 / AS 4970)</h3>
          <div id="print-svg-map-holder" class="oa-print-map">${labeledSiteMapSvg}</div>
        </section>

        <section class="oa-print-section">
          <h3>Table 3. Dual Valuation &amp; Allometric Ecosystem Services</h3>
          <div tabindex="0" role="region" aria-label="Table 3. Dual Valuation and Allometric Ecosystem Services" class="table-wrapper">
            <table class="data-table" style="--label-1: 'CTLA 10th Ed. Value'; --label-2: '200-Yr Holobiont Equity'; --label-3: 'John White Est. Age'; --label-4: 'Annual Services';">
              <thead>
                <tr>
                  <th scope="col">CTLA 10th Ed. Depreciated Value</th>
                  <th scope="col">200-Yr Holobiont Biological Equity</th>
                  <th scope="col">John White (FCIN12) Est. Age</th>
                  <th scope="col">Annual Stormwater / Energy / Carbon Flow</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong class="oa-valuation-appraisal-val">$${val.ctla_10th_ed_depreciated_usd.toLocaleString()}</strong> <span class="oa-model-assumption-note">CTLA Trunk Formula model (assumes $65/sq in regional cost)</span></td>
                  <td><span class="oa-valuation-hypothesis-val">$${val.holobiont_200yr_biological_equity_usd.toLocaleString()}</span> <span class="oa-model-assumption-note">Experimental 200-yr holobiont model (${val.veteran_keystone_habitat_multiplier}x keystone; uncalibrated survival curve)</span></td>
                  <td>${age.estimated_age_years} yrs (${age.site_condition})</td>
                  <td>${fmtDualGallons(eco.avoided_runoff_gallons_yr, '/yr')} | ${eco.cooling_savings_kwh_yr} kWh/yr | ${fmtDualMassFromLbs(eco.carbon_storage_lbs, ' C')} ($${eco.total_annual_benefits_usd}/yr Nowak model)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="oa-print-signature-block">
          <h3>Practitioner Evidentiary Attestation &amp; Signature Block</h3>
          <p>
            <strong>Practitioner Name:</strong> ${escapeUiHtml(el('input-assessor-name')?.value.trim() || 'George Steward')} &nbsp;|&nbsp;
            <strong>Credential:</strong> ${escapeUiHtml(el('input-assessor-credential')?.value.trim() || 'ISA Certified Arborist TX-362025A / Oak Wilt Qualified')} &nbsp;|&nbsp;
            <strong>Assessment Date:</strong> ${sb.assessment_date || '2026-10-28'}
          </p>
          <div style="margin: 8px 0;"><strong>Canonical Evidence SHA-256:</strong> ${renderExpandableHashHtml(res.compiledReport.sha256)}</div>
          <p style="margin-top: 18px;">
            <strong>Practitioner Signature:</strong> ___________________________ &nbsp;&nbsp;&nbsp;&nbsp;
            <strong>Date Signed:</strong> _______________
          </p>
        </section>
      `;
    }

    // 1. Municipal Ordinance Lookup Summary Banner & UNVERIFIED Check
    const citationBannerEl = el('ordinance-citation-banner');
    const unverifiedNotices = getOrdinanceUnverifiedNotices(muni);
    if (citationBannerEl && muni) {
      if (unverifiedNotices.length > 0) {
        citationBannerEl.innerHTML = `
          <div>
            <span class="badge badge-warn">UNVERIFIED STATUTORY FIELDS NOTICE</span>
            <strong>${muni.name}, ${muni.state}:</strong> ${muni.ordinance_numbers}
          </div>
          <ul class="flag-list" style="margin-top: 6px;">
            ${unverifiedNotices.map((n) => `<li><strong>UNVERIFIED:</strong> ${n}</li>`).join('')}
          </ul>
        `;
      } else {
        citationBannerEl.innerHTML = `
          <div>
            <span class="badge badge-protected">VERIFIED STATUTORY RECORD</span>
            <strong>${muni.name}, ${muni.state}:</strong> ${muni.ordinance_numbers}
          </div>
        `;
      }
    }

    if (muni) {
      const oakMonths = muni.plan_rules?.pruning?.oak_months;
      const oakWindowText = Array.isArray(oakMonths)
        ? `Permitted Oak pruning months: ${oakMonths.join(', ')} (${muni.plan_rules?.pruning?.citation || 'Oak Wilt Rule'})`
        : `${muni.plan_rules?.pruning?.standard || 'ANSI A300 Part 1'} (${muni.plan_rules?.pruning?.citation || 'Verify seasonal Oak Wilt window with local forester'})`;

      const protThreshStr = fmtDualInCm(muni.dbh_threshold_inches);
      const heritThreshStr =
        muni.heritage_threshold_inches !== null && muni.heritage_threshold_inches !== undefined
          ? fmtDualInCm(muni.heritage_threshold_inches)
          : 'N/A';

      el('muni-lookup-card').innerHTML = `
        <div class="muni-header">
          <div>
            <strong>${muni.name}, ${muni.state}</strong>
            <span class="badge badge-neutral">${muni.id}</span>
          </div>
          <a href="${muni.source_url}" target="_blank" rel="noopener noreferrer" class="muni-link">Statutory Code Reference</a>
        </div>
        <p class="muni-citation">${muni.ordinance_numbers}</p>
        <div class="metric-grid metric-grid-4">
          <div class="metric-box">
            <span class="metric-label">Protected Threshold</span>
            <strong class="metric-value">${protThreshStr} DBH</strong>
          </div>
          <div class="metric-box">
            <span class="metric-label">Heritage Threshold</span>
            <strong class="metric-value">${heritThreshStr} DBH</strong>
          </div>
          <div class="metric-box">
            <span class="metric-label">Multi-Stem Formula</span>
            <strong class="metric-value">${muni.plan_rules?.survey?.multi_trunk || 'quadratic'}</strong>
          </div>
          <div class="metric-box">
            <span class="metric-label">CRZ Disturbance Trigger</span>
            <strong class="metric-value">${muni.plan_rules?.root_zone?.removal_if_disturbed_pct ? `&gt;${muni.plan_rules.root_zone.removal_if_disturbed_pct}% = Removal` : imp ? '1.0 ft / in DBH' : '0.12 m / cm DBH (1.0 ft/in)'}</strong>
          </div>
        </div>
        <p class="muni-subtext"><strong>Oak Wilt &amp; Pruning:</strong> ${oakWindowText}</p>
        <p class="muni-subtext"><strong>Excepted Species:</strong> ${(muni.excepted_species || []).join('; ') || 'None listed'}</p>
      `;
    }

    // 2. Ordinance Verdict & Root Zone Card
    const statusText = statusLabel(row);
    const statusClass = row.heritage
      ? 'badge-heritage'
      : row.protected
      ? 'badge-protected'
      : row.excepted
      ? 'badge-neutral'
      : 'badge-warn';

    const flagsHtml =
      row.flags && row.flags.length > 0
        ? `<ul class="flag-list">${row.flags.map((f) => `<li>${f}</li>`).join('')}</ul>`
        : `<p class="clean-note">Zero ordinance or seasonal Oak Wilt violations triggered for current work parameters.</p>`;

    const externalSvgMapContainer = el('svg-map-container');
    const svgMapMarkup = `
      <div class="svg-map-wrap">
        <div class="svg-map-header">
          <span><strong>ANSI A300 Part 5 / ISA BMP To-Scale Root Protection Map</strong> (Fence Radius: ${fmtDualFtM(row.fence_ft)})</span>
          <span>Soil Invigoration Budget: <strong>$${res.soilRemediation.total_usd.toLocaleString()}</strong></span>
        </div>
        ${labeledSiteMapSvg}
      </div>
    `;

    el('verdict-ordinance-body').innerHTML = `
      <div class="verdict-banner">
        <div>
          <span class="metric-label">Evaluated Municipal Status</span>
          <div class="verdict-title-row">
            <strong class="verdict-big">${statusText}</strong>
            <span class="badge ${statusClass}">${fmtDualInCm(row.dbh, bio.dbh_cm)} DBH</span>
          </div>
        </div>
        <div class="verdict-right">
          <span class="metric-label">Permit Verdict</span>
          <strong>${res.permit.unknown ? 'Verify with City (UNVERIFIED)' : res.permit.required ? 'PERMIT REQUIRED' : 'No Permit Triggered'}</strong>
        </div>
      </div>
      <p class="citation-callout"><strong>Statutory Permit Determination:</strong> ${res.permitText} ${res.permit.citation ? `(${res.permit.citation})` : ''}</p>
      ${flagsHtml}

      <div class="metric-grid metric-grid-3">
        <div class="metric-box">
          <span class="metric-label">Critical Root Zone (CRZ)</span>
          <strong class="oa-determination-value">${fmtDualFtM(res.rootZones.crz.radius_feet, res.rootZones.crz.radius_meters)}</strong>
          <span class="metric-sub">${fmtDualAreaSqftSqm(res.rootZones.crz.area_sqft, res.rootZones.crz.area_sqm)}</span>
        </div>
        <div class="metric-box">
          <span class="metric-label">Structural Root Zone (SRZ)</span>
          <strong class="oa-determination-value">${fmtDualFtM(res.rootZones.srz.radius_feet, res.rootZones.srz.radius_meters)}</strong>
          <span class="metric-sub">AS 4970 Windthrow Plate</span>
        </div>
        <div class="metric-box">
          <span class="metric-label">Tree Influence Zone (TIZ)</span>
          <strong class="oa-determination-value">${fmtDualFromMeters(bio.root_zones.tiz_radius_meters)} radius</strong>
          <span class="metric-sub">${fmtDualAreaFromSqm(bio.root_zones.tiz_area_sqm)} Holobiont Footprint</span>
        </div>
      </div>

      <div tabindex="0" role="region" aria-label="Municipal Mitigation Scenarios" class="table-wrapper">
        <table class="data-table" style="--label-1: 'Mitigation Scenario'; --label-2: 'Exemption Cap'; --label-3: 'Replacement Owed'; --label-4: 'Cash-in-Lieu Fee'; --label-5: 'Unpermitted Penalty';">
          <thead>
            <tr>
              <th scope="col">Mitigation Scenario (${muni?.mitigation_fee_schedule?.citation || 'Ordinance'})</th>
              <th scope="col">Exemption Cap</th>
              <th scope="col">Replacement Owed</th>
              <th scope="col">Cash-in-Lieu Fee</th>
              <th scope="col">Unpermitted Penalty</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Current Field Plan (${row.removal ? 'Removal Triggered' : 'Preserved'})</th>
              <td>${mitActive ? `${fmtDualInCm(mitActive.exemption_cap_inches)} (${mitActive.exemption_pct}%)` : 'N/A'}</td>
              <td>${mitActive ? `${fmtDualInCm(mitActive.replacement_inches_owed)} (${mitActive.replacement_trees_owed} trees)` : '0 in'}</td>
              <td><strong>$${(mitActive?.cash_in_lieu_usd || 0).toLocaleString()}</strong></td>
              <td>$${(mitActive?.unpermitted_penalty?.total_penalty_usd || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <th scope="row">Liability If Tree Liquidated / Destroyed</th>
              <td>${mitIfRemoved ? `${fmtDualInCm(mitIfRemoved.exemption_cap_inches)} (${mitIfRemoved.exemption_pct}%)` : 'N/A'}</td>
              <td>${mitIfRemoved ? `${fmtDualInCm(mitIfRemoved.replacement_inches_owed)} (${mitIfRemoved.replacement_trees_owed} trees)` : '0 in'}</td>
              <td><strong class="text-danger">$${(mitIfRemoved?.cash_in_lieu_usd || 0).toLocaleString()}</strong></td>
              <td class="text-danger">$${(mitIfRemoved?.unpermitted_penalty?.total_penalty_usd || 0).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>
      ${externalSvgMapContainer ? '' : svgMapMarkup}
    `;

    if (externalSvgMapContainer) {
      externalSvgMapContainer.innerHTML = svgMapMarkup;
    }

    // 3. Allometric Valuation, Holobiont Equity & 5-Year Practice Economics Card
    const mattheckClass = bio.biomechanics.mattheck_criterion_satisfied ? 'badge-protected' : 'badge-danger';
    el('verdict-valuation-body').innerHTML = `
      <div class="metric-grid metric-grid-4">
        <div class="metric-box">
          <span class="metric-label">Regional Appraisal Model (CTLA 10th Ed.)</span>
          <strong class="oa-valuation-appraisal-val">$${val.ctla_10th_ed_depreciated_usd.toLocaleString()}</strong>
          <span class="oa-model-assumption-note">Trunk Formula model ($65/sq in regional base; Allometric structural estimate: $${eco.structural_value_usd.toLocaleString()})</span>
        </div>
        <div class="metric-box">
          <span class="metric-label">Experimental Ecosystem Hypothesis (200-Yr Holobiont)</span>
          <strong class="oa-valuation-hypothesis-val">$${val.holobiont_200yr_biological_equity_usd.toLocaleString()}</strong>
          <span class="oa-model-assumption-note">Uncalibrated 200-yr survival model (${val.veteran_keystone_habitat_multiplier}x keystone multiplier; ${val.inversion_ratio}x CTLA; see docs/LAYERS.md)</span>
        </div>
        <div class="metric-box">
          <span class="metric-label">John White (FCIN12) Est. Age</span>
          <strong class="metric-value">${age.estimated_age_years} yrs</strong>
          <span class="metric-sub">Adjusted Factor: ${age.adjusted_growth_factor} (${age.site_condition})</span>
        </div>
        <div class="metric-box">
          <span class="metric-label">Mattheck Shell Stability (t/R)</span>
          <strong class="metric-value">${bio.biomechanics.sound_shell_thickness_ratio_t_over_r}</strong>
          <span class="badge ${mattheckClass}">${bio.biomechanics.mattheck_criterion_satisfied ? 't/R &gt;= 0.30 Sound' : 't/R &lt; 0.30 Thinning'}</span>
        </div>
      </div>

      <h3 class="sub-heading">Annual &amp; 20-Year Allometric Ecosystem Services (Nowak / McPherson / Xiao)</h3>
      <div class="metric-grid metric-grid-4">
        <div class="metric-box">
          <span class="metric-label">Carbon Stored</span>
          <strong class="metric-value">${fmtDualMassFromLbs(eco.carbon_storage_lbs)}</strong>
          <span class="metric-sub">$${eco.carbon_storage_value_usd.toLocaleString()} (${fmtDualMassFromLbs(eco.co2_equivalent_lbs_yr, ' CO2/yr')})</span>
        </div>
        <div class="metric-box">
          <span class="metric-label">Stormwater Intercepted</span>
          <strong class="metric-value">${fmtDualGallons(eco.avoided_runoff_gallons_yr, '/yr')}</strong>
          <span class="metric-sub">Canopy Cover: ${fmtDualAreaSqftSqm(eco.canopy_cover_sqft)}</span>
        </div>
        <div class="metric-box">
          <span class="metric-label">Cooling &amp; Air Quality</span>
          <strong class="metric-value">${eco.cooling_savings_kwh_yr} kWh/yr</strong>
          <span class="metric-sub">${fmtDualMassFromLbs(eco.pollution_removal_lbs_yr, '/yr')} pollutants removed</span>
        </div>
        <div class="metric-box">
          <span class="metric-label">Projected 20-Yr Service Value</span>
          <strong class="metric-value">$${eco.projected_20yr_benefits_usd.toLocaleString()}</strong>
          <span class="metric-sub">$${eco.total_annual_benefits_usd}/yr direct annual flow</span>
        </div>
      </div>

      <h3 class="sub-heading">5-Year Practice Economics: Regenerative Stewardship vs. One-Time Tree Removal</h3>
      <div tabindex="0" role="region" aria-label="5-Year Practice Economics Comparison" class="table-wrapper">
        <table class="data-table" style="--label-1: 'Practice Model'; --label-2: '5-Yr Gross Revenue'; --label-3: 'Practitioner Net Margin'; --label-4: 'Recurring Revenue Share'; --label-5: 'Client Holobiont Equity Impact';">
          <thead>
            <tr>
              <th scope="col">Practice Model</th>
              <th scope="col">5-Yr Gross Revenue</th>
              <th scope="col">Practitioner Net Margin</th>
              <th scope="col">Recurring Revenue Share</th>
              <th scope="col">Client Holobiont Equity Impact</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">RAP 5-Year Regenerative Stewardship</th>
              <td>$${econ.regenerative_stewardship_model.five_year_gross_revenue_usd.toLocaleString()}</td>
              <td><strong class="text-accent">$${econ.regenerative_stewardship_model.net_practitioner_margin_usd.toLocaleString()} (${econ.comparison.margin_multiplier}x)</strong></td>
              <td>${econ.regenerative_stewardship_model.recurring_revenue_share_pct}%</td>
              <td>Preserves <strong>$${econ.regenerative_stewardship_model.client_biological_equity_preserved_usd.toLocaleString()}</strong></td>
            </tr>
            <tr>
              <th scope="row">Legacy Contractor Removal Bid</th>
              <td>$${econ.legacy_removal_model.one_time_gross_bid_usd.toLocaleString()}</td>
              <td>$${econ.legacy_removal_model.net_practitioner_margin_usd.toLocaleString()}</td>
              <td>0%</td>
              <td class="text-danger">Destroys $${econ.legacy_removal_model.client_biological_equity_destroyed_usd.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="sub-heading">Engine-Scaled Pneumatic Rhizosphere &amp; Bio-Amendment Bill of Materials</h3>
      <div class="metric-grid metric-grid-4">
        <div class="metric-box">
          <span class="metric-label">Decompacted Soil Volume</span>
          <strong class="metric-value">${fmtDualSoilVolFromM3(bio.rhizosphere_prescription.total_decompacted_soil_m3)}</strong>
          <span class="metric-sub">AirSpade @ ${fmtDualPressureFromPsi(bio.rhizosphere_prescription.operating_pressure_psi)}</span>
        </div>
        <div class="metric-box">
          <span class="metric-label">Pre-Charged Biochar</span>
          <strong class="metric-value">${fmtDualBiocharFromLiters(bio.rhizosphere_prescription.amendments.precharged_biochar_liters)}</strong>
          <span class="metric-sub">Humate: ${fmtDualMassFromKg(bio.rhizosphere_prescription.amendments.fungal_humate_kg)}</span>
        </div>
        <div class="metric-box">
          <span class="metric-label">Fungal Compost</span>
          <strong class="metric-value">${fmtDualSoilVolFromM3(bio.rhizosphere_prescription.amendments.fungal_compost_m3)}</strong>
          <span class="metric-sub">SGR Relief Ratio: ${bio.rhizosphere_prescription.vascular_constriction_relief_ratio}</span>
        </div>
        <div class="metric-box">
          <span class="metric-label">Ramial Woodchip Mulch</span>
          <strong class="metric-value">${fmtDualSoilVolFromM3(bio.rhizosphere_prescription.amendments.ramial_woodchip_mulch_m3)}</strong>
          <span class="metric-sub">${fmtDualFromCm(8)} horizon across TIZ</span>
        </div>
      </div>
    `;

    // 4. Evidentiary Linter Status & SHA-256 Digest
    const lintStatusBadge = res.lint.valid
      ? `<span class="badge badge-protected">PASS (${res.lint.passed_checks.length} Evidentiary Checks Verified)</span>`
      : `<span class="badge badge-danger">BLOCKED (${res.lint.errors.length} Evidentiary Violation(s))</span>`;

    const schemaStatusBadge = res.schemaValidation.valid
      ? `<span class="badge badge-protected">RAP_v2 Schema Valid</span>`
      : `<span class="badge badge-danger">Schema Error (${res.schemaValidation.errors.length})</span>`;

    const lintErrorsHtml =
      res.lint.errors.length > 0
        ? `<ul class="flag-list">${res.lint.errors.map((e) => `<li>${e}</li>`).join('')}</ul>`
        : '';

    el('verdict-linter-header').innerHTML = `
      <div class="linter-row">
        <div>
          <strong>ASCA / RAP-Spec v2.0 Evidentiary Gate:</strong>
          ${lintStatusBadge}
          ${schemaStatusBadge}
        </div>
        <div class="sha-box">
          <span>SHA-256:</span>
          ${renderExpandableHashHtml(res.compiledReport.sha256)}
        </div>
      </div>
      ${lintErrorsHtml}
    `;

    // 5. Arborist Receiver Banner (#shared-brief-receiver-banner) when #oa1= hash is active
    const sbRec = assessment.structural_baseline || {};
    const oakFlagText = Array.isArray(row?.flags)
      ? row.flags.find((f) => /oak wilt/i.test(f)) || ''
      : '';
    const liveHandoff = composeArboristHandoffBrief({
      speciesCommon: sbRec.species_common || 'Live Oak',
      speciesScientific: sbRec.species_scientific || 'Quercus virginiana',
      dbhInches: bio.dbh_inches,
      cityLabel: prov?.municipality_name || `${muni?.name || ''}, ${muni?.state || ''}`,
      protectionStatus: statusText,
      tOverR: bio.biomechanics.sound_shell_thickness_ratio_t_over_r,
      sonicTomographyVerified: Boolean(sbRec.sonic_tomography_or_resistograph_uri),
      crzFeet: res.rootZones.crz.radius_feet,
      holobiontUsd: val.holobiont_200yr_biological_equity_usd,
      ctlaUsd: val.ctla_10th_ed_depreciated_usd,
      cashInLieuUsd: mitIfRemoved?.cash_in_lieu_usd || 0,
      stage1Usd: res.phasedTriage.stages[0]?.client_price_usd || 0,
      removalBidUsd: res.phasedTriage.removal_bid_usd,
      marginMultiplier: res.phasedTriage.net_margin_multiplier,
      oakWiltWarning: oakFlagText,
      shareUrl: fullShareUrl,
    });

    const receiverBanner = el('shared-brief-receiver-banner');
    if (receiverBanner) {
      receiverBanner.hidden = !isReceiverModeActive;
      if (isReceiverModeActive) {
        const recHeading = el('receiver-specimen-heading');
        const recMeta = el('receiver-meta-line');
        const recTruck = el('receiver-truck-summary');
        if (recHeading) {
          recHeading.textContent = `${sbRec.species_common || 'Tree'} (${sbRec.tree_tag || 'T-01'}): ${fmtDualInCm(bio.dbh_inches, bio.dbh_cm)} DBH in ${prov?.municipality_name || muni?.name || 'Local Jurisdiction'}`;
        }
        if (recMeta) {
          recMeta.textContent = `Status: ${statusText} | Statutory CRZ: ${fmtDualFtM(res.rootZones.crz.radius_feet, res.rootZones.crz.radius_meters)} | Mattheck t/R: ${bio.biomechanics.sound_shell_thickness_ratio_t_over_r} | Day-1 Stage 1 Triage: $${res.phasedTriage.stages[0]?.client_price_usd.toLocaleString()}`;
        }
        if (recTruck) {
          recTruck.innerHTML = `<pre class="code-preview" style="margin: 0; white-space: pre-wrap;">${escapeUiHtml(liveHandoff.arborist_truck_summary)}</pre>`;
        }
      }
    }

    // 6. Innate LEO-RAP Answer-First Verdict, 3-Stage Phased Stewardship Triage & Soil Sponge
    const phasedBody = el('phased-triage-body');
    if (phasedBody && res.leoBrief && res.phasedTriage && res.soilSponge) {
      const af = res.leoBrief.answer_first;
      const tr = res.phasedTriage;
      const sp = res.soilSponge;
      const stage1 = tr.stages[0];
      const isSoundShell = bio.biomechanics.mattheck_criterion_satisfied;
      const stormLabel = imp ? ' / 1-in storm' : ' / 25 mm storm';

      const stageCardsHtml = tr.stages
        .map(
          (st) => `
            <div class="oa-triage-stage">
              <div class="oa-triage-stage-main">
                <span class="oa-stage-tag">Stage ${st.stage_number} &middot; ${escapeUiHtml(st.window)}</span>
                <strong class="oa-stage-title">${escapeUiHtml(st.title)}</strong>
                <p class="muni-subtext oa-stage-desc">${escapeUiHtml(st.scope)}</p>
              </div>
              <div class="oa-triage-stage-metrics">
                <span class="oa-stage-price">$${st.client_price_usd.toLocaleString()}</span>
                <span class="metric-sub">Arborist net margin: $${st.practitioner_net_usd.toLocaleString()}</span>
              </div>
            </div>
          `
        )
        .join('');

      phasedBody.innerHTML = `
        <div class="oa-innate-verdict-card${isSoundShell ? '' : ' is-thin-shell'}">
          <div class="oa-innate-verdict-top">
            <span class="badge ${isSoundShell ? 'badge-protected' : 'badge-warn'}">${isSoundShell ? 'Mattheck Sound Cylinder (t/R &gt;= 0.30)' : 'Level 3 Tomography Review Required (t/R &lt; 0.30)'}</span>
            <button type="button" class="btn btn-secondary btn-xs" data-open-handoff-modal="true">Send to Arborist</button>
          </div>
          <p class="oa-innate-verdict-headline">${escapeUiHtml(af.headline_verdict)}</p>
          <p class="oa-innate-verdict-prose"><strong>Structural Truth:</strong> ${escapeUiHtml(af.structural_truth)}</p>
          <p class="oa-innate-verdict-prose"><strong>Statutory &amp; Seasonal Truth:</strong> ${escapeUiHtml(af.statutory_and_seasonal_truth)}</p>
          <p class="oa-innate-verdict-prose"><strong>Stewardship vs. Liquidation:</strong> ${escapeUiHtml(af.stewardship_vs_liquidation)}</p>
          <p class="muni-subtext" style="margin: 4px 0 0;"><strong>Physical Falsifier (STIM Kill Criterion):</strong> ${escapeUiHtml(af.falsifier)}</p>
        </div>

        <h3 class="sub-heading">3-Stage Phased Stewardship Triage vs. One-Time Chainsaw Removal</h3>
        <div class="metric-grid metric-grid-4">
          <div class="metric-box highlight-box">
            <span class="metric-label">Stage 1 Day-1 Root-Collar Triage</span>
            <strong class="metric-value text-accent">$${stage1.client_price_usd.toLocaleString()}</strong>
            <span class="metric-sub">${tr.day_one_undercuts_removal ? `Saves $${tr.day_one_savings_vs_removal_usd.toLocaleString()} vs. Day-1 removal` : 'Immediate diagnostic &amp; collar relief'}</span>
          </div>
          <div class="metric-box">
            <span class="metric-label">One-Time Chainsaw Removal</span>
            <strong class="metric-value">$${tr.removal_bid_usd.toLocaleString()}</strong>
            <span class="metric-sub">Plus $${(mitIfRemoved?.cash_in_lieu_usd || 0).toLocaleString()} city mitigation exposure</span>
          </div>
          <div class="metric-box">
            <span class="metric-label">5-Year Arborist Net Margin Advantage</span>
            <strong class="metric-value text-accent">${tr.net_margin_multiplier}x ($${tr.full_5yr_practitioner_net_usd.toLocaleString()})</strong>
            <span class="metric-sub">vs. $${tr.removal_practitioner_net_usd.toLocaleString()} one-time removal net</span>
          </div>
          <div class="metric-box">
            <span class="metric-label">Vadose Soil Sponge Capacity</span>
            <strong class="metric-value">${fmtDualGallons(sp.storm_1in_capture_gallons)}${stormLabel}</strong>
            <span class="metric-sub">${fmtDualGallons(sp.som_sponge_capacity_gallons)} SOM reserve (${escapeUiHtml(sp.infiltration_class)})</span>
          </div>
        </div>

        <div class="oa-triage-grid">
          ${stageCardsHtml}
        </div>
      `;
    }

    // 7. Behind the Veil: Live LEO-RAP Epistemic & Anti-Liquidation Oracle Verifier
    const leoStatusEl = el('leo-status-header');
    const leoAuditEl = el('leo-self-audit-badge');
    const leoTextarea = el('leo-narrative-textarea');
    if (leoStatusEl && res.leoBrief) {
      leoStatusEl.innerHTML = `<strong>Live Epistemic Header:</strong> <code>${escapeUiHtml(res.leoBrief.status_line)}</code>`;
    }
    if (leoAuditEl && res.leoSelfAudit) {
      const auditOk = res.leoSelfAudit.self_audit_passed;
      leoAuditEl.innerHTML = auditOk
        ? `<span class="badge badge-protected">Self-Audit Gate PASS: ${res.leoSelfAudit.fixtures_tested}/3 Negative Sabotage Fixtures Caught</span>`
        : `<span class="badge badge-danger">Self-Audit Gate Defect (${escapeUiHtml(res.leoSelfAudit.error_code || 'FAILED')})</span>`;
    }
    if (leoTextarea && res.leoBrief) {
      leoTextarea.value = res.leoBrief.brief_markdown;
    }
    renderLeoVerificationBanner(res.leoVerification);

    renderActivePreview();
  }

  function renderLeoVerificationBanner(verReport) {
    const bannerEl = el('leo-verify-result');
    if (!bannerEl || !verReport) return;
    if (verReport.valid) {
      bannerEl.style.borderLeftColor = 'var(--accent-green)';
      bannerEl.innerHTML = `
        <div>
          <span class="metric-label">Deterministic LEO-RAP Oracle Verifier</span>
          <div class="verdict-title-row">
            <strong class="verdict-big text-accent">VERIFIED CLEAN (0 Errors)</strong>
            <span class="badge badge-protected">${verReport.checked_anchors} Oracle Anchors Matched</span>
          </div>
          <span class="metric-sub">Reconciled unverified tokens: ${verReport.unverified_count} | Mattheck t/R = ${verReport.t_over_r}</span>
        </div>
      `;
    } else {
      bannerEl.style.borderLeftColor = 'var(--danger-red)';
      bannerEl.innerHTML = `
        <div style="width: 100%;">
          <span class="metric-label">Deterministic LEO-RAP Oracle Verifier</span>
          <div class="verdict-title-row">
            <strong class="verdict-big text-danger">BLOCKED (${verReport.errors.length} Violation${verReport.errors.length === 1 ? '' : 's'} Caught)</strong>
            <span class="badge badge-danger">Anti-Liquidation &amp; Provenance Gate</span>
          </div>
          <ul class="flag-list" style="margin-top: 8px;">
            ${verReport.errors.map((err) => `<li><code>${escapeUiHtml(err)}</code></li>`).join('')}
          </ul>
        </div>
      `;
    }
  }

  function getActivePreviewContent() {
    if (!latestResult || !latestAssessment) return '';
    if (activePreviewTab === 'geojson') {
      return JSON.stringify(latestResult.geojson, null, 2);
    }
    if (activePreviewTab === 'report') {
      return latestResult.compiledReport.markdown;
    }
    if (activePreviewTab === 'counternotice') {
      return latestResult.counterNotice.notice_markdown;
    }
    if (activePreviewTab === 'json') {
      return JSON.stringify(latestAssessment, null, 2);
    }
    return '';
  }

  function renderActivePreview() {
    const pre = el('export-preview-code');
    if (pre) {
      pre.textContent = getActivePreviewContent();
    }
  }

  // Preview tab switching
  document.querySelectorAll('[data-preview-tab]').forEach((tabBtn) => {
    tabBtn.addEventListener('click', () => {
      document.querySelectorAll('[data-preview-tab]').forEach((b) => {
        const isCurrent = b === tabBtn;
        b.classList.toggle('active', isCurrent);
        b.setAttribute('aria-selected', isCurrent ? 'true' : 'false');
      });
      activePreviewTab = tabBtn.dataset.previewTab;
      renderActivePreview();
    });
  });

  function triggerDownload(filename, content, mimeType = 'text/plain;charset=utf-8') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  el('btn-download-geojson')?.addEventListener('click', () => {
    if (!latestResult) return;
    const tag = latestAssessment?.structural_baseline?.tree_tag || 'tree';
    triggerDownload(
      `${tag.toLowerCase()}-openarbor.geojson`,
      JSON.stringify(latestResult.geojson, null, 2),
      'application/geo+json;charset=utf-8'
    );
  });

  el('btn-download-report')?.addEventListener('click', () => {
    if (!latestResult) return;
    const tag = latestAssessment?.structural_baseline?.tree_tag || 'tree';
    triggerDownload(
      `${tag.toLowerCase()}-rap-report.md`,
      latestResult.compiledReport.markdown,
      'text/markdown;charset=utf-8'
    );
  });

  el('btn-download-notice')?.addEventListener('click', () => {
    if (!latestResult) return;
    const tag = latestAssessment?.structural_baseline?.tree_tag || 'tree';
    triggerDownload(
      `${tag.toLowerCase()}-counter-notice.md`,
      latestResult.counterNotice.notice_markdown,
      'text/markdown;charset=utf-8'
    );
  });

  el('btn-download-json')?.addEventListener('click', () => {
    if (!latestAssessment) return;
    const tag = latestAssessment?.structural_baseline?.tree_tag || 'tree';
    triggerDownload(
      `${tag.toLowerCase()}-rap-v2.json`,
      JSON.stringify(latestAssessment, null, 2),
      'application/json;charset=utf-8'
    );
  });

  el('btn-copy-preview')?.addEventListener('click', async () => {
    const content = getActivePreviewContent();
    const copyBtn = el('btn-copy-preview');
    if (navigator.clipboard && content) {
      await navigator.clipboard.writeText(content);
      const prev = copyBtn.textContent;
      copyBtn.textContent = 'Copied to Clipboard';
      setTimeout(() => {
        copyBtn.textContent = prev;
      }, 1800);
    }
  });

  // Import existing RAP_v2 or legacy RCA_v2 JSON file
  el('input-import-json')?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        loadCaseIntoForm({
          id: 'imported-case',
          label: 'Imported JSON',
          ordinance_id:
            parsed.structural_baseline?.municipal_permit_disposition?.jurisdiction_id || 'tx-austin',
          condition_class: 'Good',
          site_condition: 'Open Grown / Parkland',
          proposed_removal:
            parsed.structural_baseline?.municipal_permit_disposition?.recommended_disposition ===
            'Removal_Last_Resort_Unmitigable_Hazard',
          assessment: parsed,
        });
      } catch (err) {
        const errBanner = el('error-banner');
        if (errBanner) {
          errBanner.hidden = false;
          errBanner.textContent = `JSON Import Error: ${err.message}`;
        }
      }
    };
    reader.readAsText(file);
  });

  // Live update on any form input or change
  form.addEventListener('input', (e) => {
    handleUnitFieldInput(e.target);
    recalculateAndRender();
  });
  form.addEventListener('change', (e) => {
    handleUnitFieldInput(e.target);
    recalculateAndRender();
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    recalculateAndRender();
    el('results-section')?.scrollIntoView({ behavior: 'smooth' });
  });

  if (typeof window !== 'undefined') {
    window.addEventListener('oa:unitschange', () => {
      populateMunicipalitySelect();
      syncUnitInputsUI();
      recalculateAndRender();
    });
  }

  // Wire Copy Verdict Link & Export Print Report controls (D1, D2, D6)
  async function handleCopyVerdictLink(btnEl) {
    if (!currentPermalinkHash) {
      currentPermalinkHash = encodeAssessmentPermalink(getCurrentCaseStateFromForm());
    }
    if (typeof window !== 'undefined' && window.history && typeof window.history.replaceState === 'function') {
      window.history.replaceState(null, '', currentPermalinkHash);
    }
    const fullUrl =
      typeof window !== 'undefined' && window.location
        ? `${window.location.origin}${window.location.pathname}${currentPermalinkHash}`
        : `https://openarbor.org/demo/${currentPermalinkHash}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(fullUrl);
      } catch {
        // Fallback when clipboard permission is unavailable
      }
    }
    if (btnEl) {
      const prev = btnEl.textContent;
      btnEl.textContent = 'Verdict Link Copied';
      setTimeout(() => {
        btnEl.textContent = prev;
      }, 1800);
    }
  }

  el('btn-copy-verdict-link')?.addEventListener('click', (e) => handleCopyVerdictLink(e.currentTarget));
  el('btn-copy-verdict-link-secondary')?.addEventListener('click', (e) => handleCopyVerdictLink(e.currentTarget));

  el('btn-export-print-report')?.addEventListener('click', () => {
    if (typeof window !== 'undefined' && typeof window.print === 'function') {
      window.print();
    }
  });

  function openCurrentFieldHandoffDialog() {
    if (!latestAssessment || !latestResult) return;
    if (!currentPermalinkHash) {
      currentPermalinkHash = encodeAssessmentPermalink(getCurrentCaseStateFromForm());
    }
    const shareUrl =
      typeof window !== 'undefined' && window.location
        ? `${window.location.origin}${window.location.pathname}${currentPermalinkHash}`
        : `https://openarbor.org/demo/${currentPermalinkHash}`;
    const sb = latestAssessment.structural_baseline || {};
    const row = latestResult.evaluatedRow;
    const oakFlag = Array.isArray(row?.flags)
      ? row.flags.find((f) => /oak wilt/i.test(f)) || ''
      : '';

    const dlg = el('arborist-handoff-dialog');
    if (dlg) bindDialogLightDismissFallback(dlg);

    openArboristHandoffDialog({
      speciesCommon: sb.species_common || 'Live Oak',
      speciesScientific: sb.species_scientific || 'Quercus virginiana',
      dbhInches: latestResult.biomechanics.dbh_inches,
      cityLabel:
        latestResult.provenance?.municipality_name ||
        `${latestResult.municipality?.name || ''}, ${latestResult.municipality?.state || ''}`,
      protectionStatus: statusLabel(row),
      tOverR: latestResult.biomechanics.biomechanics.sound_shell_thickness_ratio_t_over_r,
      sonicTomographyVerified: Boolean(sb.sonic_tomography_or_resistograph_uri),
      crzFeet: latestResult.rootZones.crz.radius_feet,
      holobiontUsd: latestResult.valuation.holobiont_200yr_biological_equity_usd,
      ctlaUsd: latestResult.valuation.ctla_10th_ed_depreciated_usd,
      cashInLieuUsd: latestResult.mitigationIfRemoved?.cash_in_lieu_usd || 0,
      stage1Usd: latestResult.phasedTriage.stages[0]?.client_price_usd || 0,
      removalBidUsd: latestResult.phasedTriage.removal_bid_usd,
      marginMultiplier: latestResult.phasedTriage.net_margin_multiplier,
      oakWiltWarning: oakFlag,
      shareUrl,
    });
  }

  const handoffDialogEl = el('arborist-handoff-dialog');
  if (handoffDialogEl) {
    bindDialogLightDismissFallback(handoffDialogEl);
  }

  el('btn-send-to-arborist')?.addEventListener('click', openCurrentFieldHandoffDialog);
  el('btn-header-send-arborist')?.addEventListener('click', openCurrentFieldHandoffDialog);
  el('phased-triage-body')?.addEventListener('click', (e) => {
    if (e.target.closest('[data-open-handoff-modal]')) {
      openCurrentFieldHandoffDialog();
    }
  });

  el('btn-handoff-print')?.addEventListener('click', () => {
    const dlg = el('arborist-handoff-dialog');
    if (dlg && dlg.open) dlg.close();
    el('btn-export-print-report')?.click();
  });

  el('btn-receiver-print-sheet')?.addEventListener('click', () => {
    const deepVeil = el('veil-deep-forensics');
    if (deepVeil) deepVeil.open = true;
    const assessorInput = el('input-assessor-name');
    if (assessorInput) assessorInput.focus();
    el('btn-export-print-report')?.click();
  });

  el('btn-receiver-lift-veil')?.addEventListener('click', () => {
    document.querySelectorAll('details.oa-veil').forEach((d) => {
      d.open = true;
    });
    const veilBtn = el('oa-veil-mode-toggle');
    if (veilBtn) {
      veilBtn.setAttribute('aria-pressed', 'true');
      veilBtn.textContent = 'Layer: Heartwood';
    }
    el('veil-deep-forensics')?.scrollIntoView({ behavior: 'smooth' });
  });

  // Live LEO-RAP Oracle Verifier & Conflicted Chainsaw Bid Sabotage Simulator
  el('leo-narrative-textarea')?.addEventListener('input', () => {
    if (!latestAssessment || !latestResult) return;
    const raw = el('leo-narrative-textarea')?.value || '';
    const check = verifyLeoRapNarrative(raw, latestAssessment, latestResult.leoEvalContext);
    renderLeoVerificationBanner(check);
  });

  el('btn-leo-verify-clean')?.addEventListener('click', () => {
    if (!latestAssessment || !latestResult?.leoBrief) return;
    const textarea = el('leo-narrative-textarea');
    if (textarea) {
      textarea.value = latestResult.leoBrief.brief_markdown;
    }
    const cleanCheck = verifyLeoRapNarrative(
      latestResult.leoBrief.brief_markdown,
      latestAssessment,
      latestResult.leoEvalContext
    );
    renderLeoVerificationBanner(cleanCheck);
  });

  el('btn-leo-sabotage-test')?.addEventListener('click', () => {
    if (!latestAssessment || !latestResult?.leoBrief) return;
    const inputTOverR = Number(
      latestAssessment.structural_baseline?.sound_shell_thickness_ratio_t_over_r ?? 0.34
    );
    const soundAssessment =
      inputTOverR >= 0.30
        ? latestAssessment
        : {
            ...latestAssessment,
            structural_baseline: {
              ...(latestAssessment.structural_baseline || {}),
              sound_shell_thickness_ratio_t_over_r: 0.34,
            },
          };
    const soundContext =
      inputTOverR >= 0.30
        ? latestResult.leoEvalContext
        : {
            ...latestResult.leoEvalContext,
            biomechanics: null,
            valuation: null,
            economics: null,
            triage: null,
          };
    const baseMarkdown =
      inputTOverR >= 0.30
        ? latestResult.leoBrief.brief_markdown
        : compileLeoRapBrief(soundAssessment, soundContext).brief_markdown;

    const driftedMarkdown = baseMarkdown.replace(
      /\[\[oracle:root_zone\.crz_ft=[^\]]+\]\]/,
      '[[oracle:root_zone.crz_ft=999.9]]'
    );
    const sabotagedText = `${driftedMarkdown}\n\nConflicted Removal Bid Addendum: Due to hollow heartwood appearance, we recommend immediate hazard tree removal and claim CRZ = 999.9 ft.`;

    const textarea = el('leo-narrative-textarea');
    if (textarea) {
      textarea.value = sabotagedText;
    }
    const sabotageCheck = verifyLeoRapNarrative(sabotagedText, soundAssessment, soundContext);
    renderLeoVerificationBanner(sabotageCheck);
  });

  function tryRestoreFromUrlHash() {
    if (typeof window === 'undefined' || !window.location || !window.location.hash) {
      isReceiverModeActive = false;
      return false;
    }
    if (!window.location.hash.startsWith('#oa1=')) {
      isReceiverModeActive = false;
      return false;
    }
    try {
      const decoded = decodeAssessmentPermalink(window.location.hash);
      if (decoded && decoded.assessment) {
        isReceiverModeActive = true;
        document.querySelectorAll('.btn-preset').forEach((b) => {
          b.classList.toggle('active', b.dataset.caseId === decoded.id);
        });
        loadCaseIntoForm(decoded);
        return true;
      }
    } catch {
      // Ignore malformed hash and fall back to default preset
    }
    isReceiverModeActive = false;
    return false;
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('hashchange', () => {
      tryRestoreFromUrlHash();
    });
  }

  // Load initial state from #oa1= permalink if present, otherwise Case 1: Austin Live Oak
  if (!tryRestoreFromUrlHash()) {
    loadCaseIntoForm(FIXED_PARITY_CASES[0]);
  }
}

function initAllOpenArborPages() {
  initSharedThemeToggle();
  initLivingLensUI();
  initVeilAndHandoffChrome();
  initFieldToolUI();
  initDemoExtrasUI();
  initToolsCatalogUI();
  initOrdinancesExplorerUI();
  initMcpPlaygroundUI();
  initSpecViewerUI();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllOpenArborPages);
  } else {
    initAllOpenArborPages();
  }
}
