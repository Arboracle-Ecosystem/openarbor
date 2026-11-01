/**
 * Open Arbor v2.0 Mobile-First Web Field Tool & Multi-Page Bundle Entrypoint
 * Bundles the certified Open Arbor engines (rootZone, ordinanceEngine,
 * ecosystemBenefits, rcaEngine) and bioregional municipal ordinance datasets
 * without modifying any engine logic under src/ or data/.
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
  lintRcaEvidentiaryReport,
  computeRegenerativePracticeEconomics,
  computeCanonicalSha256,
  compileRcaEvidentiaryMarkdown,
  compilePreservationCounterNotice,
  mintOpenBadgeAttestation,
} from '../src/core/rcaEngine.js';

import txOrdinances from '../data/ordinances/central_texas_ordinances.json';
import orOrdinances from '../data/ordinances/rogue_valley_oregon_ordinances.json';
import rcaAssessmentSchema from '../schemas/rca_assessment.schema.json';
import municipalOrdinanceSchema from '../schemas/municipal-ordinance.schema.json';
import forestryToolsCatalog from '../data/catalog/forestry-tools.json';
import {
  CENTRAL_TEXAS_SPECIES,
  ALL_SPECIES_PRESETS,
  FIXED_PARITY_CASES,
  DEFAULT_STAND_TREES,
} from './presets.js';

import { initDemoExtrasUI, initSharedThemeToggle } from './pages/demo-extras.js';
import { initToolsCatalogUI } from './pages/tools-ui.js';
import { initOrdinancesExplorerUI } from './pages/ordinances-ui.js';
import { initMcpPlaygroundUI } from './pages/mcp-ui.js';
import { initSpecViewerUI } from './pages/spec-ui.js';

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
  decodePlusCode,
  validateJsonSchema,
  evaluateBiomechanicsAndRhizosphere,
  computeHolobiontValuation,
  computeSanctuaryScorecardRollup,
  lintRcaEvidentiaryReport,
  computeRegenerativePracticeEconomics,
  computeCanonicalSha256,
  compileRcaEvidentiaryMarkdown,
  compilePreservationCounterNotice,
  mintOpenBadgeAttestation,
  txOrdinances,
  orOrdinances,
  rcaAssessmentSchema,
  municipalOrdinanceSchema,
  forestryToolsCatalog,
  CENTRAL_TEXAS_SPECIES,
  ALL_SPECIES_PRESETS,
  FIXED_PARITY_CASES,
  DEFAULT_STAND_TREES,
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
 * Run the full Open Arbor v2.0 deterministic pipeline on an RCA_v2 assessment
 * and municipal ordinance context. Used by both the browser UI and parity verification.
 */
export function evaluateCompleteFieldCase(assessment, options = {}) {
  const schemaValidation = validateJsonSchema(assessment, rcaAssessmentSchema);
  const lint = lintRcaEvidentiaryReport(assessment);

  const ordId =
    options.ordinance_id ||
    assessment.structural_baseline?.municipal_permit_disposition?.jurisdiction_id ||
    'tx-austin';
  const municipality = findMunicipality(ordId);

  const compiledReport = compileRcaEvidentiaryMarkdown(assessment, { municipality });
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

  return {
    schemaValidation,
    lint,
    municipality,
    compiledReport,
    counterNotice,
    economics,
    biomechanics,
    valuation,
    ageEstimate,
    ecosystemBenefits,
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

  const el = (id) => document.getElementById(id);

  // Populate Municipality dropdown with ALL 8 municipalities grouped by TX and OR
  const muniSelect = el('input-ordinance-id');
  if (muniSelect) {
    const txOptions = CENTRAL_TEXAS_MUNICIPALITIES.map(
      (m) =>
        `<option value="${m.id}">${m.name}, ${m.state} (Protected &gt;= ${m.dbh_threshold_inches} in, Heritage &gt;= ${m.heritage_threshold_inches} in)</option>`
    ).join('');
    const orOptions = ROGUE_VALLEY_MUNICIPALITIES.map(
      (m) =>
        `<option value="${m.id}">${m.name}, ${m.state} (Protected &gt;= ${m.dbh_threshold_inches} in, Heritage &gt;= ${m.heritage_threshold_inches} in)</option>`
    ).join('');

    muniSelect.innerHTML = [
      `<optgroup label="Central Texas (TX)">${txOptions}</optgroup>`,
      `<optgroup label="Rogue Valley, Oregon (OR)">${orOptions}</optgroup>`,
    ].join('');
  }

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

  // Populate Preset quick buttons
  const presetBar = el('preset-buttons');
  if (presetBar) {
    presetBar.innerHTML = FIXED_PARITY_CASES.map(
      (c, idx) =>
        `<button type="button" class="btn-preset ${idx === 0 ? 'active' : ''}" data-case-id="${c.id}">${c.label}</button>`
    ).join('');

    presetBar.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-case-id]');
      if (!btn) return;
      const found = FIXED_PARITY_CASES.find((c) => c.id === btn.dataset.caseId);
      if (!found) return;
      document.querySelectorAll('.btn-preset').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      loadCaseIntoForm(found);
    });
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
    if (isMulti && Array.isArray(sb.stem_diameters_cm) && sb.stem_diameters_cm.length > 0) {
      el('input-stems-inches').value = sb.stem_diameters_cm
        .map((cm) => Math.round((cm / 2.54) * 10) / 10)
        .join(', ');
    } else {
      const inches = Math.round((sb.dbh_cm / 2.54) * 100) / 100;
      el('input-stems-inches').value = String(inches);
    }
    el('input-dbh-inches').value = Math.round((sb.dbh_cm / 2.54) * 100) / 100;
    el('input-dbh-cm').value = sb.dbh_cm;

    el('input-condition-class').value = activePreset.condition_class || 'Good';
    el('input-site-condition').value = activePreset.site_condition || 'Open Grown / Parkland';
    el('input-height-m').value = sb.height_m;
    el('input-spread-ns-m').value = sb.crown_spread_ns_m;
    el('input-spread-ew-m').value = sb.crown_spread_ew_m;
    el('input-lcr-pct').value = sb.live_crown_ratio_pct;

    el('input-disposition').value = disp.recommended_disposition || 'Preservation_With_Rhizosphere_Remediation';
    el('input-proposed-removal').checked =
      Boolean(activePreset.proposed_removal) ||
      disp.recommended_disposition === 'Removal_Last_Resort_Unmitigable_Hazard';
    el('input-pruning-date').value = activePreset.pruning_date || '';
    el('input-crz-disturbed-pct').value = activePreset.crz_disturbed_pct ?? 0;
    el('input-cutfill-in').value = activePreset.cutfill_depth_in ?? 0;
    el('input-impervious-pct').value = activePreset.impervious_pct ?? 0;
    el('input-crown-removal-pct').value = activePreset.crown_removal_pct ?? 0;

    el('input-t-over-r').value = sb.sound_shell_thickness_ratio_t_over_r ?? 0.38;
    el('input-codit').value = sb.codit_wall_response_rating || 'Wall_4_Active_Barrier_Zone';
    el('input-root-flare-cm').value = rh.root_flare_diameter_cm;
    el('input-burial-depth-cm').value = rh.root_flare_burial_depth_cm;
    el('input-sgr-count').value = rh.stem_girdling_root_count;
    el('input-sgr-severity').value = rh.stem_girdling_root_severity;

    el('input-trench-count').value = air.trench_count;
    el('input-trench-length-m').value = air.trench_length_m;
    el('input-trench-width-cm').value = air.trench_width_cm;
    el('input-trench-depth-cm').value = air.trench_depth_cm;
    el('input-rce-radius-m').value = air.root_collar_excavation_radius_m;
    el('input-airspade-psi').value = air.operating_pressure_psi;

    el('input-bulk-density').value = soil.bulk_density_g_cm3;
    el('input-infiltration').value = soil.infiltration_rate_mm_hr;
    el('input-som-pct').value = soil.organic_matter_pct;
    el('input-soil-ph').value = soil.soil_ph;
    el('input-fb-ratio').value = myco.fungal_to_bacterial_biomass_ratio ?? 0.5;
    el('input-myco-guild').value = myco.dominant_mycorrhizal_guild || 'Ectomycorrhizal_EM';

    el('input-traq-level').value = traq.assessment_level;
    el('input-traq-part').value = traq.primary_tree_part_of_concern || 'Root_Collar';
    el('input-traq-lof').value = traq.likelihood_of_failure;
    el('input-traq-loi').value = traq.likelihood_of_impact;
    el('input-traq-lofi').value = traq.likelihood_of_failure_and_impact;
    el('input-traq-cof').value = traq.consequences_of_failure;
    el('input-traq-overall').value = traq.overall_risk_rating;
    el('input-traq-residual').value = traq.residual_risk_rating || 'Low';

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
    if (mode === 'single_stem') {
      const dbhIn = Math.max(0.1, Number(el('input-dbh-inches').value) || 20);
      const dbhCm = Math.round(dbhIn * 2.54 * 100) / 100;
      el('input-dbh-cm').value = dbhCm;
    } else {
      const rawStems = String(el('input-stems-inches').value || '')
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => n > 0);
      const aggIn = rawStems.length > 0 ? calculateMultiStemDBH(rawStems, mode) : 20;
      const aggCm = Math.round(aggIn * 2.54 * 100) / 100;
      el('input-dbh-inches').value = aggIn;
      el('input-dbh-cm').value = aggCm;
    }
  }

  el('input-dbh-inches')?.addEventListener('input', () => {
    const dbhIn = Math.max(0.1, Number(el('input-dbh-inches').value) || 0.1);
    el('input-dbh-cm').value = Math.round(dbhIn * 2.54 * 100) / 100;
    recalculateAndRender();
  });

  el('input-stems-inches')?.addEventListener('input', () => {
    syncDbhFromInputs();
    recalculateAndRender();
  });

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

  // Build RCA_v2 assessment JSON from current form state
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
      sb.dbh_cm = Math.max(0.5, Number(el('input-dbh-cm').value) || 50.8);
    } else {
      const rawStemsIn = String(el('input-stems-inches').value || '')
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => n > 0);
      const validStemsIn = rawStemsIn.length > 0 ? rawStemsIn : [20, 14];
      const aggIn = calculateMultiStemDBH(validStemsIn, mode);
      sb.is_multistem = true;
      sb.multistem_aggregation_method = mode;
      sb.stem_diameters_cm = validStemsIn.map((d) => Math.round(d * 2.54 * 100) / 100);
      sb.dbh_cm = Math.round(aggIn * 2.54 * 100) / 100;
    }

    sb.height_m = Math.max(0.5, Number(el('input-height-m').value) || 15);
    sb.crown_spread_ns_m = Math.max(0.5, Number(el('input-spread-ns-m').value) || 15);
    sb.crown_spread_ew_m = Math.max(0.5, Number(el('input-spread-ew-m').value) || 15);
    sb.live_crown_ratio_pct = Math.min(100, Math.max(0, Number(el('input-lcr-pct').value) || 70));

    sb.sound_shell_thickness_ratio_t_over_r = Math.min(
      1.0,
      Math.max(0.0, Number(el('input-t-over-r').value) || 0.35)
    );
    sb.codit_wall_response_rating = el('input-codit').value.trim() || 'Wall_4_Active_Barrier_Zone';

    rh.root_flare_diameter_cm = Math.max(1, Number(el('input-root-flare-cm').value) || sb.dbh_cm * 1.25);
    rh.root_flare_burial_depth_cm = Math.max(0, Number(el('input-burial-depth-cm').value) || 0);
    rh.stem_girdling_root_count = Math.max(0, Math.round(Number(el('input-sgr-count').value) || 0));
    rh.stem_girdling_root_severity = el('input-sgr-severity').value || 'None';

    air.trench_count = Math.max(0, Math.round(Number(el('input-trench-count').value) || 6));
    air.trench_length_m = Math.max(0, Number(el('input-trench-length-m').value) || 6.5);
    air.trench_width_cm = Math.max(0, Number(el('input-trench-width-cm').value) || 30);
    air.trench_depth_cm = Math.max(0, Number(el('input-trench-depth-cm').value) || 35);
    air.root_collar_excavation_radius_m = Math.max(0, Number(el('input-rce-radius-m').value) || 0.9);
    air.operating_pressure_psi = Math.max(0, Number(el('input-airspade-psi').value) || 150);

    soil.bulk_density_g_cm3 = Math.min(2.65, Math.max(0.1, Number(el('input-bulk-density').value) || 1.45));
    soil.infiltration_rate_mm_hr = Math.max(0, Number(el('input-infiltration').value) || 20);
    soil.organic_matter_pct = Math.min(100, Math.max(0, Number(el('input-som-pct').value) || 2.8));
    soil.soil_ph = Math.min(11, Math.max(2, Number(el('input-soil-ph').value) || 7.2));
    myco.fungal_to_bacterial_biomass_ratio = Math.max(0, Number(el('input-fb-ratio').value) || 0.5);
    myco.dominant_mycorrhizal_guild = el('input-myco-guild').value || 'Ectomycorrhizal_EM';

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
        cutfill_depth_in: Number(el('input-cutfill-in').value) || 0,
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

    const muni = res.municipality;
    const row = res.evaluatedRow;
    const bio = res.biomechanics;
    const val = res.valuation;
    const econ = res.economics;
    const eco = res.ecosystemBenefits;
    const age = res.ageEstimate;
    const mitIfRemoved = res.mitigationIfRemoved;
    const mitActive = res.mitigationActive;

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
            <strong class="metric-value">${muni.dbh_threshold_inches} in DBH</strong>
          </div>
          <div class="metric-box">
            <span class="metric-label">Heritage Threshold</span>
            <strong class="metric-value">${muni.heritage_threshold_inches} in DBH</strong>
          </div>
          <div class="metric-box">
            <span class="metric-label">Multi-Stem Formula</span>
            <strong class="metric-value">${muni.plan_rules?.survey?.multi_trunk || 'quadratic'}</strong>
          </div>
          <div class="metric-box">
            <span class="metric-label">CRZ Disturbance Trigger</span>
            <strong class="metric-value">${muni.plan_rules?.root_zone?.removal_if_disturbed_pct ? `&gt;${muni.plan_rules.root_zone.removal_if_disturbed_pct}% = Removal` : '1.0 ft / in DBH'}</strong>
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
          <span><strong>ANSI A300 Part 5 / ISA BMP To-Scale Root Protection Map</strong> (Fence Radius: ${row.fence_ft} ft)</span>
          <span>Soil Invigoration Budget: <strong>$${res.soilRemediation.total_usd.toLocaleString()}</strong></span>
        </div>
        ${res.svgSiteMap || ''}
      </div>
    `;

    el('verdict-ordinance-body').innerHTML = `
      <div class="verdict-banner">
        <div>
          <span class="metric-label">Evaluated Municipal Status</span>
          <div class="verdict-title-row">
            <strong class="verdict-big">${statusText}</strong>
            <span class="badge ${statusClass}">${row.dbh} in DBH (${bio.dbh_cm} cm)</span>
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
          <strong class="metric-value">${res.rootZones.crz.radius_feet} ft (${res.rootZones.crz.radius_meters} m)</strong>
          <span class="metric-sub">${res.rootZones.crz.area_sqft.toLocaleString()} sq ft (${res.rootZones.crz.area_sqm} m2)</span>
        </div>
        <div class="metric-box">
          <span class="metric-label">Structural Root Zone (SRZ)</span>
          <strong class="metric-value">${res.rootZones.srz.radius_feet} ft (${res.rootZones.srz.radius_meters} m)</strong>
          <span class="metric-sub">AS 4970 Windthrow Plate</span>
        </div>
        <div class="metric-box">
          <span class="metric-label">Tree Influence Zone (TIZ)</span>
          <strong class="metric-value">${bio.root_zones.tiz_radius_meters} m radius</strong>
          <span class="metric-sub">${bio.root_zones.tiz_area_sqm} m2 Holobiont Footprint</span>
        </div>
      </div>

      <div class="table-scroll">
        <table class="data-table">
          <thead>
            <tr>
              <th>Mitigation Scenario (${muni?.mitigation_fee_schedule?.citation || 'Ordinance'})</th>
              <th>Exemption Cap</th>
              <th>Replacement Owed</th>
              <th>Cash-in-Lieu Fee</th>
              <th>Unpermitted Penalty</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Current Field Plan (${row.removal ? 'Removal Triggered' : 'Preserved'})</strong></td>
              <td>${mitActive ? `${mitActive.exemption_cap_inches} in (${mitActive.exemption_pct}%)` : 'N/A'}</td>
              <td>${mitActive ? `${mitActive.replacement_inches_owed} in (${mitActive.replacement_trees_owed} trees)` : '0 in'}</td>
              <td><strong>$${(mitActive?.cash_in_lieu_usd || 0).toLocaleString()}</strong></td>
              <td>$${(mitActive?.unpermitted_penalty?.total_penalty_usd || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td><strong>Liability If Tree Liquidated / Destroyed</strong></td>
              <td>${mitIfRemoved ? `${mitIfRemoved.exemption_cap_inches} in (${mitIfRemoved.exemption_pct}%)` : 'N/A'}</td>
              <td>${mitIfRemoved ? `${mitIfRemoved.replacement_inches_owed} in (${mitIfRemoved.replacement_trees_owed} trees)` : '0 in'}</td>
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
        <div class="metric-box highlight-box">
          <span class="metric-label">200-Yr Holobiont Biological Equity</span>
          <strong class="metric-value text-accent">$${val.holobiont_200yr_biological_equity_usd.toLocaleString()}</strong>
          <span class="metric-sub">${val.veteran_keystone_habitat_multiplier}x Keystone Multiplier (${val.inversion_ratio}x CTLA)</span>
        </div>
        <div class="metric-box">
          <span class="metric-label">Classical CTLA 10th Ed. Value</span>
          <strong class="metric-value">$${val.ctla_10th_ed_depreciated_usd.toLocaleString()}</strong>
          <span class="metric-sub">Allometric Structural: $${eco.structural_value_usd.toLocaleString()}</span>
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

      <h4 class="sub-heading">Annual &amp; 20-Year Allometric Ecosystem Services (Nowak / McPherson / Xiao)</h4>
      <div class="metric-grid metric-grid-4">
        <div class="metric-box">
          <span class="metric-label">Carbon Stored</span>
          <strong class="metric-value">${eco.carbon_storage_lbs.toLocaleString()} lbs</strong>
          <span class="metric-sub">$${eco.carbon_storage_value_usd.toLocaleString()} (${eco.co2_equivalent_lbs_yr} lbs CO2/yr)</span>
        </div>
        <div class="metric-box">
          <span class="metric-label">Stormwater Intercepted</span>
          <strong class="metric-value">${eco.avoided_runoff_gallons_yr.toLocaleString()} gal/yr</strong>
          <span class="metric-sub">Canopy Cover: ${eco.canopy_cover_sqft.toLocaleString()} sq ft</span>
        </div>
        <div class="metric-box">
          <span class="metric-label">Cooling &amp; Air Quality</span>
          <strong class="metric-value">${eco.cooling_savings_kwh_yr} kWh/yr</strong>
          <span class="metric-sub">${eco.pollution_removal_lbs_yr} lbs/yr pollutants removed</span>
        </div>
        <div class="metric-box">
          <span class="metric-label">Projected 20-Yr Service Value</span>
          <strong class="metric-value">$${eco.projected_20yr_benefits_usd.toLocaleString()}</strong>
          <span class="metric-sub">$${eco.total_annual_benefits_usd}/yr direct annual flow</span>
        </div>
      </div>

      <h4 class="sub-heading">5-Year Practice Economics: Regenerative Stewardship vs. One-Time Tree Removal</h4>
      <div class="table-scroll">
        <table class="data-table">
          <thead>
            <tr>
              <th>Practice Model</th>
              <th>5-Yr Gross Revenue</th>
              <th>Practitioner Net Margin</th>
              <th>Recurring Revenue Share</th>
              <th>Client Holobiont Equity Impact</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>RCA 5-Year Regenerative Stewardship</strong></td>
              <td>$${econ.regenerative_stewardship_model.five_year_gross_revenue_usd.toLocaleString()}</td>
              <td><strong class="text-accent">$${econ.regenerative_stewardship_model.net_practitioner_margin_usd.toLocaleString()} (${econ.comparison.margin_multiplier}x)</strong></td>
              <td>${econ.regenerative_stewardship_model.recurring_revenue_share_pct}%</td>
              <td>Preserves <strong>$${econ.regenerative_stewardship_model.client_biological_equity_preserved_usd.toLocaleString()}</strong></td>
            </tr>
            <tr>
              <td><strong>Legacy Contractor Removal Bid</strong></td>
              <td>$${econ.legacy_removal_model.one_time_gross_bid_usd.toLocaleString()}</td>
              <td>$${econ.legacy_removal_model.net_practitioner_margin_usd.toLocaleString()}</td>
              <td>0%</td>
              <td class="text-danger">Destroys $${econ.legacy_removal_model.client_biological_equity_destroyed_usd.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h4 class="sub-heading">Engine-Scaled Pneumatic Rhizosphere &amp; Bio-Amendment Bill of Materials</h4>
      <div class="metric-grid metric-grid-4">
        <div class="metric-box">
          <span class="metric-label">Decompacted Soil Volume</span>
          <strong class="metric-value">${bio.rhizosphere_prescription.total_decompacted_soil_m3} m3</strong>
          <span class="metric-sub">AirSpade @ ${bio.rhizosphere_prescription.operating_pressure_psi} psi</span>
        </div>
        <div class="metric-box">
          <span class="metric-label">Pre-Charged Biochar</span>
          <strong class="metric-value">${bio.rhizosphere_prescription.amendments.precharged_biochar_liters} L</strong>
          <span class="metric-sub">Humate: ${bio.rhizosphere_prescription.amendments.fungal_humate_kg} kg</span>
        </div>
        <div class="metric-box">
          <span class="metric-label">Fungal Compost</span>
          <strong class="metric-value">${bio.rhizosphere_prescription.amendments.fungal_compost_m3} m3</strong>
          <span class="metric-sub">SGR Relief Ratio: ${bio.rhizosphere_prescription.vascular_constriction_relief_ratio}</span>
        </div>
        <div class="metric-box">
          <span class="metric-label">Ramial Woodchip Mulch</span>
          <strong class="metric-value">${bio.rhizosphere_prescription.amendments.ramial_woodchip_mulch_m3} m3</strong>
          <span class="metric-sub">8 cm horizon across TIZ</span>
        </div>
      </div>
    `;

    // 4. Evidentiary Linter Status & SHA-256 Digest
    const lintStatusBadge = res.lint.valid
      ? `<span class="badge badge-protected">PASS (${res.lint.passed_checks.length} Evidentiary Checks Verified)</span>`
      : `<span class="badge badge-danger">BLOCKED (${res.lint.errors.length} Evidentiary Violation(s))</span>`;

    const schemaStatusBadge = res.schemaValidation.valid
      ? `<span class="badge badge-protected">RCA_v2 Schema Valid</span>`
      : `<span class="badge badge-danger">Schema Error (${res.schemaValidation.errors.length})</span>`;

    const lintErrorsHtml =
      res.lint.errors.length > 0
        ? `<ul class="flag-list">${res.lint.errors.map((e) => `<li>${e}</li>`).join('')}</ul>`
        : '';

    el('verdict-linter-header').innerHTML = `
      <div class="linter-row">
        <div>
          <strong>ASCA / RCA-Spec v2.0 Evidentiary Gate:</strong>
          ${lintStatusBadge}
          ${schemaStatusBadge}
        </div>
        <div class="sha-box">
          <span>SHA-256:</span>
          <code>${res.compiledReport.sha256}</code>
        </div>
      </div>
      ${lintErrorsHtml}
    `;

    renderActivePreview();
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
      document.querySelectorAll('[data-preview-tab]').forEach((b) => b.classList.remove('active'));
      tabBtn.classList.add('active');
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
      `${tag.toLowerCase()}-rca-report.md`,
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
      `${tag.toLowerCase()}-rca-v2.json`,
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

  // Import existing RCA_v2 JSON file
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
  form.addEventListener('input', () => recalculateAndRender());
  form.addEventListener('change', () => recalculateAndRender());
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    recalculateAndRender();
    el('results-section')?.scrollIntoView({ behavior: 'smooth' });
  });

  // Load initial preset (Case 1: Austin Live Oak)
  loadCaseIntoForm(FIXED_PARITY_CASES[0]);
}

function initAllOpenArborPages() {
  initSharedThemeToggle();
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
