/**
 * Open Arbor Masterwork 100x Core Utilities (web/pages/masterwork-core.js)
 * Zero-dependency deterministic module providing:
 *   - D1: Versioned shareable assessment permalink encoder/decoder (#oa1=...)
 *   - D2: Sticky determination bar formatter
 *   - D3: 5-case static & interactive gallery dataset (Austin, Georgetown, Liberty Hill, Ashland, Medford)
 *   - D5: Municipality provenance & epistemic boundary ("What this record does not know") inspector
 */

import { FIXED_PARITY_CASES } from '../presets.js';
import { statusLabel } from '../../src/core/ordinanceEngine.js';
import { calculateCRZ, calculateSRZ } from '../../src/core/rootZone.js';

export const ENGINE_VERSION = '2.2.0';
export const DATASET_VERSION = '2.0.0';
export const DATASET_LAST_VERIFIED = '2026-10-23';

export const MEDFORD_PONDEROSA_CASE = {
  id: 'case-5-medford-ponderosa-pine',
  slug: 'medford-ponderosa-pine',
  label: 'Case 5: Medford Heritage Ponderosa Pine (26 in DBH)',
  ordinance_id: 'or-medford',
  condition_class: 'Good',
  site_condition: 'Open Grown / Parkland',
  proposed_removal: false,
  pruning_date: '2026-11-12',
  crz_disturbed_pct: 14,
  cutfill_depth_in: 2,
  impervious_pct: 10,
  crown_removal_pct: 10,
  assessment: {
    schema_version: 'RAP_v2',
    assessment_mode: 'Regenerative Diagnostic',
    structural_baseline: {
      tree_tag: 'MFD-PP-208',
      species_scientific: 'Pinus ponderosa',
      species_common: 'Ponderosa Pine',
      inaturalist_taxon_id: 48461,
      assessment_date: '2026-10-28',
      dbh_cm: 66.04,
      is_multistem: false,
      multistem_aggregation_method: 'single_stem',
      height_m: 24.0,
      crown_spread_ns_m: 14.5,
      crown_spread_ew_m: 15.0,
      live_crown_ratio_pct: 68,
      plus_code_global: '84JV84GG+JQ',
      codit_wall_response_rating: 'Wall_4_Active_Barrier_Zone',
      sound_shell_thickness_ratio_t_over_r: 0.41,
      sonic_tomography_or_resistograph_uri: 'https://soilgrower.com/diagnostics/picus/mfd-pp-208-tomogram.png',
      dual_valuation: {
        ctla_10th_ed_depreciated_usd: 15240,
        holobiont_200yr_biological_equity_usd: 284600,
        veteran_keystone_habitat_multiplier: 2.5,
        valuation_delta_usd: 269360,
      },
      isa_traq_risk: {
        assessment_level: 'Level_2_Basic',
        time_frame_years: 3,
        target_zone_description: 'Commercial parking lot perimeter and sidewalk frontage; moderate pedestrian and vehicle occupancy.',
        primary_tree_part_of_concern: 'Root_Collar',
        likelihood_of_failure: 'Improbable',
        likelihood_of_impact: 'Medium',
        likelihood_of_failure_and_impact: 'Unlikely',
        consequences_of_failure: 'Significant',
        overall_risk_rating: 'Low',
        residual_risk_rating: 'Low',
      },
      municipal_permit_disposition: {
        jurisdiction_id: 'or-medford',
        ordinance_citation: 'MMC § 6.725 (Street Trees) / MLDC § 10.780 (Commercial Development)',
        protection_tier: 'Heritage',
        permit_required: true,
        recommended_disposition: 'Preservation_With_Rhizosphere_Remediation',
        seasonal_oak_wilt_restriction_active: false,
      },
    },
    rhizosphere_and_root_collar: {
      root_flare_burial_depth_cm: 14,
      root_flare_diameter_cm: 86.0,
      stem_girdling_root_count: 1,
      stem_girdling_root_severity: 'Minor_Under_25_Pct_Circumference',
      airspade_radial_trenching_geometry: {
        execution_status: 'Prescribed_Radial_Remediation',
        operating_pressure_psi: 150,
        trench_count: 8,
        trench_length_m: 7.5,
        trench_width_cm: 30,
        trench_depth_cm: 35,
        root_collar_excavation_radius_m: 1.0,
      },
      crz_radius_m: 7.92,
      srz_radius_m: 2.91,
      tiz_radius_m: 11.89,
    },
    soil_and_microbiome_baseline: {
      bulk_density_g_cm3: 1.56,
      penetrometer_resistance_psi: 315,
      infiltration_rate_mm_hr: 18,
      organic_matter_pct: 2.8,
      soil_ph: 6.4,
      lab_panel_url: 'https://soilgrower.com/labs/osu-soil-health/sample-mfd-2026-208.pdf',
      lab_sample_id: 'OSU-RV-2026-208',
      mycorrhizal_and_fungal_observations: {
        dominant_mycorrhizal_guild: 'Ectomycorrhizal_EM',
        fungal_to_bacterial_biomass_ratio: 0.48,
        hyphal_colonization_status: 'Moderate_Fragmented_Network',
        observed_fruiting_bodies_or_rhizomorphs: [
          {
            species_or_morphotype: 'Rhizopogon vinicolor',
            inaturalist_taxon_id: 121540,
            ecological_role: 'Mycorrhizal_Symbiont',
          },
          {
            species_or_morphotype: 'Suillus brevipes',
            inaturalist_taxon_id: 63491,
            ecological_role: 'Mycorrhizal_Symbiont',
          },
        ],
      },
    },
    understory_and_guild_prescription: {
      reference_ecosystem_name: 'Rogue Valley Ponderosa Pine and Mixed Conifer Woodland',
      biochar_volume_liters: 520,
      humate_mass_kg: 10.5,
      compost_volume_cubic_m: 1.1,
      compost_extract_volume_liters: 300,
      mulch_depth_cm: 8,
      mulch_coverage_area_m2: 444.1,
      synthetic_npk_and_fungicide_exclusion_verified: true,
      native_companion_species_guild: [
        {
          scientific_name: 'Ceanothus prostratus',
          common_name: 'Mahala Mat',
          inaturalist_taxon_id: 53404,
          open_nursery_batch_id: 'ON-OR-2026-CPR-03',
          stratum_layer: 'Groundcover_Or_Vine',
          functional_role: 'Symbiotic_Nitrogen_Fixer',
          quantity_planted: 16,
        },
        {
          scientific_name: 'Arctostaphylos viscida',
          common_name: 'Whiteleaf Manzanita',
          inaturalist_taxon_id: 57188,
          open_nursery_batch_id: 'ON-OR-2026-AVI-05',
          stratum_layer: 'Shrub_Layer',
          functional_role: 'Pollinator_And_Predatory_Insect_Refuge',
          quantity_planted: 10,
        },
      ],
    },
    outcome_monitoring_schedule: {
      stim_hypothesis_statement:
        'Supersonic AirSpade radial decompaction (8 spokes at 150 psi), ectomycorrhizal spore inoculation, and native Rogue Valley pine-understory guild establishment will reduce top-15cm bulk density from 1.56 to <= 1.28 g/cm3 and raise F:B biomass ratio from 0.48 to >= 1.3 within 60 months.',
      stim_kill_criterion:
        'If Year-1 needle retention drops below 3 age classes or bark beetle pitch tubes exceed 2 per bole quadrant, initiate immediate hydration and pheromone defense protocol.',
      one_year_leading_indicators: {
        scheduled_reinspection_date: '2027-10-28',
        target_canopy_dieback_max_pct: 8,
        target_annual_twig_extension_min_cm: 12,
        target_woundwood_callus_closure_mm_yr: 10,
        root_flare_unburied_verified: true,
        mulch_horizon_and_litter_incorporation_intact: true,
        soil_surface_crusting_or_capping_absent: true,
        companion_guild_survival_min_pct: 85,
        fixed_photopoint_azimuth_deg: 180,
      },
      five_year_lagging_indicators: {
        scheduled_audit_date: '2031-10-28',
        target_bulk_density_max_g_cm3: 1.28,
        target_infiltration_rate_min_mm_hr: 60,
        target_organic_matter_min_pct: 5.0,
        target_fungal_to_bacterial_ratio_min: 1.3,
        target_ser_recovery_wheel_stars: 4.5,
        sanctuary_scorecard_targets: {
          tiz_footprint_area_m2: 444.1,
          canopy_projection_area_m2: 170.9,
          soil_health_index_baseline_score: 44,
          soil_health_index_target_score: 84,
          canopy_volume_expansion_target_pct: 10,
          stormwater_interception_baseline_liters_yr: 28400,
          stormwater_interception_target_liters_yr: 37500,
          documented_native_biodiversity_taxa_baseline: 3,
          documented_native_biodiversity_taxa_min: 14,
          restoration_potential_baseline_pct: 46,
          restoration_potential_realized_pct: 86,
        },
      },
    },
  },
};

const SLUG_MAP = {
  'case-1-austin-live-oak': 'austin-heritage-live-oak',
  'case-2-georgetown-pecan': 'georgetown-multistem-pecan',
  'case-3-liberty-hill-post-oak': 'liberty-hill-post-oak',
  'case-4-ashland-oregon-white-oak': 'ashland-oregon-white-oak',
  'case-5-medford-ponderosa-pine': 'medford-ponderosa-pine',
};

export const GALLERY_CASES = [
  ...FIXED_PARITY_CASES.map((c) => ({ ...c, slug: SLUG_MAP[c.id] || c.id })),
  MEDFORD_PONDEROSA_CASE,
];

function toBase64Url(utf8Str) {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(utf8Str, 'utf8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  }
  const bytes = new TextEncoder().encode(utf8Str);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(b64url) {
  const padded = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (padded.length % 4)) % 4;
  const full = padded + '='.repeat(padLen);
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(full, 'base64').toString('utf8');
  }
  const binary = atob(full);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

const OA_DEL_SENTINEL = '__OA_DEL__';
const FORBIDDEN_PATCH_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

const READABLE_TREE_SLUGS = [
  'austin-live-oak',
  'georgetown-pecan',
  'yard-post-oak',
  'ashland-white-oak',
  'medford-ponderosa-pine',
];

function cloneJson(val) {
  return JSON.parse(JSON.stringify(val));
}

function formatCompactNum(num) {
  const n = Math.round(Number(num) * 10) / 10;
  return Number.isInteger(n) ? String(n) : String(n);
}

function diffJson(base, target) {
  if (Object.is(base, target)) return undefined;
  if (target === undefined) return OA_DEL_SENTINEL;
  if (Array.isArray(target)) {
    if (Array.isArray(base) && JSON.stringify(base) === JSON.stringify(target)) {
      return undefined;
    }
    return cloneJson(target);
  }
  if (
    target !== null &&
    typeof target === 'object' &&
    base !== null &&
    typeof base === 'object' &&
    !Array.isArray(base)
  ) {
    const patch = {};
    let hasChanges = false;
    for (const key of Object.keys(base)) {
      if (FORBIDDEN_PATCH_KEYS.has(key)) continue;
      if (!Object.prototype.hasOwnProperty.call(target, key)) {
        patch[key] = OA_DEL_SENTINEL;
        hasChanges = true;
      }
    }
    for (const key of Object.keys(target)) {
      if (FORBIDDEN_PATCH_KEYS.has(key)) continue;
      if (!Object.prototype.hasOwnProperty.call(base, key)) {
        patch[key] = target[key] === undefined ? OA_DEL_SENTINEL : cloneJson(target[key]);
        hasChanges = true;
      } else {
        const sub = diffJson(base[key], target[key]);
        if (sub !== undefined) {
          patch[key] = sub;
          hasChanges = true;
        }
      }
    }
    return hasChanges ? patch : undefined;
  }
  return cloneJson(target);
}

function applyJsonDiff(base, diff) {
  if (diff === undefined) return cloneJson(base);
  if (diff === OA_DEL_SENTINEL) return undefined;
  if (Array.isArray(diff) || diff === null || typeof diff !== 'object') {
    return cloneJson(diff);
  }
  const out =
    base !== null && typeof base === 'object' && !Array.isArray(base) ? cloneJson(base) : {};
  for (const [key, val] of Object.entries(diff)) {
    if (FORBIDDEN_PATCH_KEYS.has(key)) continue;
    if (val === OA_DEL_SENTINEL) {
      delete out[key];
    } else if (
      val !== null &&
      typeof val === 'object' &&
      !Array.isArray(val) &&
      out[key] !== null &&
      typeof out[key] === 'object' &&
      !Array.isArray(out[key])
    ) {
      out[key] = applyJsonDiff(out[key], val);
    } else {
      out[key] = cloneJson(val);
    }
  }
  return out;
}

function resolveGalleryCaseIndex(caseStateOrKey) {
  if (typeof caseStateOrKey === 'string') {
    const k = caseStateOrKey.trim().toLowerCase();
    const slugIdx = READABLE_TREE_SLUGS.indexOf(k);
    if (slugIdx >= 0) return slugIdx;
    const directIdx = GALLERY_CASES.findIndex(
      (g) => g.id?.toLowerCase() === k || g.slug?.toLowerCase() === k
    );
    return directIdx;
  }
  const cs = caseStateOrKey || {};
  const sb = cs.assessment?.structural_baseline || {};
  if (cs.archetypeKey) {
    const idx = READABLE_TREE_SLUGS.indexOf(cs.archetypeKey);
    if (idx >= 0) return idx;
  }
  if (cs.id) {
    const idx = GALLERY_CASES.findIndex((g) => g.id === cs.id || g.slug === cs.id);
    if (idx >= 0) return idx;
  }
  if (sb.tree_tag) {
    const idx = GALLERY_CASES.findIndex(
      (g) => g.assessment?.structural_baseline?.tree_tag === sb.tree_tag
    );
    if (idx >= 0) return idx;
  }
  if (sb.species_scientific) {
    const idx = GALLERY_CASES.findIndex(
      (g) => g.assessment?.structural_baseline?.species_scientific === sb.species_scientific
    );
    if (idx >= 0) return idx;
  }
  return 0;
}

/**
 * D1. Encode the complete assessment state into a versioned URL fragment (#oa1=...).
 * Always computes a prototype-safe delta against the closest GALLERY_CASES baseline so edited
 * assessments produce compact (#oa1= < 600 chars) links while preserving bit-for-bit SHA-256 parity.
 */
export function encodeAssessmentPermalink(caseState) {
  const a = cloneJson(caseState.assessment || {});
  const sb = a.structural_baseline || {};
  const disp = sb.municipal_permit_disposition || {};

  let bestIdx = 0;
  let bestDiff;
  let bestLen = Infinity;
  for (let i = 0; i < GALLERY_CASES.length; i += 1) {
    const d = diffJson(GALLERY_CASES[i].assessment, a);
    if (d === undefined) {
      bestIdx = i;
      bestDiff = undefined;
      bestLen = 0;
      break;
    }
    const len = JSON.stringify(d).length;
    if (len < bestLen) {
      bestLen = len;
      bestIdx = i;
      bestDiff = d;
    }
  }

  const baseCase = GALLERY_CASES[bestIdx] || GALLERY_CASES[0];
  const envelope = {
    v: ENGINE_VERSION,
    b: bestIdx,
    j: caseState.ordinance_id || disp.jurisdiction_id || baseCase.ordinance_id || 'tx-austin',
    c: caseState.condition_class || 'Good',
    s: caseState.site_condition || 'Open Grown / Parkland',
    dist: [
      Number(caseState.crz_disturbed_pct ?? 0),
      Number(caseState.cutfill_depth_in ?? 0),
      Number(caseState.impervious_pct ?? 0),
      Number(caseState.crown_removal_pct ?? 0),
    ],
  };
  if (caseState.proposed_removal) envelope.r = 1;
  if (caseState.pruning_date) envelope.p = caseState.pruning_date;
  if (caseState.id && caseState.id !== baseCase.id) envelope.id = caseState.id;
  if (caseState.label && caseState.label !== baseCase.label) envelope.lbl = caseState.label;
  if (bestDiff !== undefined) envelope.d = bestDiff;

  return `#oa1=${toBase64Url(JSON.stringify(envelope))}`;
}

/**
 * D1. Decode a versioned URL fragment (#oa1=...) back into a complete field case object.
 * Supports both compact delta envelopes (v, b, j, c, s, dist, d?) and legacy full envelopes.
 */
export function decodeAssessmentPermalink(fragment) {
  if (!fragment || typeof fragment !== 'string') return null;
  const clean = fragment.startsWith('#') ? fragment.slice(1) : fragment;
  if (!clean.startsWith('oa1=')) return null;
  const rawB64 = clean.slice(4).trim();
  if (!rawB64) return null;

  const envelope = JSON.parse(fromBase64Url(rawB64));
  if (!envelope || typeof envelope !== 'object') return null;

  // Compact delta envelope path
  if (typeof envelope.b === 'number' && GALLERY_CASES[envelope.b] && !envelope.sp) {
    const baseCase = GALLERY_CASES[envelope.b];
    const assessment = applyJsonDiff(baseCase.assessment, envelope.d);
    const sb = assessment.structural_baseline || {};
    const [crzDist, cutfillIn, impPct, crownRemPct] = envelope.dist || [];
    return {
      id: envelope.id || baseCase.id || 'permalink-restored-case',
      label:
        envelope.lbl || baseCase.label || `Permalink Assessment (${sb.tree_tag || 'Specimen'})`,
      engine_version: envelope.v || ENGINE_VERSION,
      ordinance_id:
        envelope.j ||
        sb.municipal_permit_disposition?.jurisdiction_id ||
        baseCase.ordinance_id ||
        'tx-austin',
      condition_class: envelope.c || baseCase.condition_class || 'Good',
      site_condition: envelope.s || baseCase.site_condition || 'Open Grown / Parkland',
      proposed_removal: Boolean(envelope.r),
      pruning_date: envelope.p ?? '',
      crz_disturbed_pct: Number(crzDist ?? 0),
      cutfill_depth_in: Number(cutfillIn ?? 0),
      impervious_pct: Number(impPct ?? 0),
      crown_removal_pct: Number(crownRemPct ?? 0),
      assessment,
    };
  }

  // Legacy full/partial envelope backward compatibility
  const [sci, common, taxonId, guild] = envelope.sp || [];
  const [dbhCm, isMulti, multiMethod, stemCmArr] = envelope.dbh || [];
  const [proposedRemoval, pruningDate, recDisp] = envelope.wt || [];
  const [crzDist, cutfillIn, impPct, crownRemPct] = envelope.dist || [];
  const [condClass, siteCond, heightM, spreadNs, spreadEw, lcrPct, plusCode, treeTag, assessDate] =
    envelope.ctx || [];

  let assessment;
  if (typeof envelope.b === 'number' && GALLERY_CASES[envelope.b]) {
    assessment = cloneJson(GALLERY_CASES[envelope.b].assessment);
  } else if (envelope.rca) {
    assessment = cloneJson(envelope.rca);
  } else {
    assessment = cloneJson(GALLERY_CASES[0].assessment);
  }

  const sb = assessment.structural_baseline;
  sb.tree_tag = treeTag || sb.tree_tag;
  sb.species_scientific = sci || sb.species_scientific;
  sb.species_common = common || sb.species_common;
  sb.inaturalist_taxon_id = Number(taxonId || sb.inaturalist_taxon_id);
  sb.assessment_date = assessDate || sb.assessment_date;
  sb.dbh_cm = Number(dbhCm ?? sb.dbh_cm);
  sb.is_multistem = Boolean(isMulti);
  sb.multistem_aggregation_method = multiMethod || sb.multistem_aggregation_method;
  if (Array.isArray(stemCmArr) && stemCmArr.length > 0) {
    sb.stem_diameters_cm = stemCmArr;
  }
  sb.height_m = Number(heightM ?? sb.height_m);
  sb.crown_spread_ns_m = Number(spreadNs ?? sb.crown_spread_ns_m);
  sb.crown_spread_ew_m = Number(spreadEw ?? sb.crown_spread_ew_m);
  sb.live_crown_ratio_pct = Number(lcrPct ?? sb.live_crown_ratio_pct);
  sb.plus_code_global = plusCode || sb.plus_code_global;
  if (sb.municipal_permit_disposition) {
    sb.municipal_permit_disposition.jurisdiction_id =
      envelope.j || sb.municipal_permit_disposition.jurisdiction_id;
    sb.municipal_permit_disposition.recommended_disposition =
      recDisp || sb.municipal_permit_disposition.recommended_disposition;
  }
  if (assessment.soil_and_microbiome_baseline?.mycorrhizal_and_fungal_observations && guild) {
    assessment.soil_and_microbiome_baseline.mycorrhizal_and_fungal_observations.dominant_mycorrhizal_guild =
      guild;
  }

  return {
    id: envelope.id || 'permalink-restored-case',
    label: envelope.lbl || `Permalink Assessment (${sb.tree_tag})`,
    engine_version: envelope.v || ENGINE_VERSION,
    ordinance_id: envelope.j || 'tx-austin',
    condition_class: condClass || 'Good',
    site_condition: siteCond || 'Open Grown / Parkland',
    proposed_removal: Boolean(proposedRemoval),
    pruning_date: pruningDate ?? '',
    crz_disturbed_pct: Number(crzDist ?? 0),
    cutfill_depth_in: Number(cutfillIn ?? 0),
    impervious_pct: Number(impPct ?? 0),
    crown_removal_pct: Number(crownRemPct ?? 0),
    assessment,
  };
}

/**
 * Encode a human-readable URL query string (?city=...&tree=...&dbh=...&cavity=...&cut=...)
 * for SMS, email, and printed field handoffs instead of exposing raw Base64 JSON.
 */
export function encodeReadableTreeQuery(caseState) {
  const cs = caseState || {};
  const a = cs.assessment || {};
  const sb = a.structural_baseline || {};
  const disp = sb.municipal_permit_disposition || {};

  const baseIdx = resolveGalleryCaseIndex(cs);
  const baseCase = GALLERY_CASES[baseIdx] || GALLERY_CASES[0];
  const baseSb = baseCase.assessment?.structural_baseline || {};
  const treeSlug = READABLE_TREE_SLUGS[baseIdx] || READABLE_TREE_SLUGS[0];
  const city = cs.ordinance_id || disp.jurisdiction_id || baseCase.ordinance_id || 'tx-austin';

  const dbhIn = Math.round(((Number(sb.dbh_cm) || 76.2) / 2.54) * 10) / 10;
  const tOverR = Number(sb.sound_shell_thickness_ratio_t_over_r ?? 0.38);
  const cavityPct = Math.round(Math.max(0, Math.min(85, (1 - tOverR) * 100)));
  const trMismatch = Math.abs(1 - cavityPct / 100 - tOverR) > 0.005;
  const cutPct = Math.round(Number(cs.crz_disturbed_pct ?? 0) * 10) / 10;

  const params = new URLSearchParams();
  params.set('city', city);
  params.set('tree', treeSlug);
  params.set('dbh', formatCompactNum(dbhIn));
  params.set('cavity', String(cavityPct));
  if (trMismatch) params.set('tr', String(Math.round(tOverR * 100) / 100));
  params.set('cut', formatCompactNum(cutPct));

  if (cs.proposed_removal) params.set('removal', '1');
  if (cs.pruning_date) params.set('prune', cs.pruning_date);
  if (
    Number(cs.cutfill_depth_in) > 0 &&
    Number(cs.cutfill_depth_in) !== Number(baseCase.cutfill_depth_in ?? 0)
  ) {
    params.set('fill', formatCompactNum(cs.cutfill_depth_in));
  }
  if (
    Number(cs.impervious_pct) > 0 &&
    Number(cs.impervious_pct) !== Number(baseCase.impervious_pct ?? 0)
  ) {
    params.set('imp', formatCompactNum(cs.impervious_pct));
  }
  if (
    Number(cs.crown_removal_pct) > 0 &&
    Number(cs.crown_removal_pct) !== Number(baseCase.crown_removal_pct ?? 0)
  ) {
    params.set('crown', formatCompactNum(cs.crown_removal_pct));
  }
  if (cs.condition_class && cs.condition_class !== baseCase.condition_class) {
    params.set('cond', cs.condition_class);
  }
  if (cs.site_condition && cs.site_condition !== baseCase.site_condition) {
    params.set('site', cs.site_condition);
  }
  if (sb.species_scientific && sb.species_scientific !== baseSb.species_scientific) {
    params.set('sp', sb.species_scientific);
  }
  if (sb.species_common && sb.species_common !== baseSb.species_common) {
    params.set('name', sb.species_common);
  }
  if (sb.tree_tag && sb.tree_tag !== baseSb.tree_tag) {
    params.set('tag', sb.tree_tag);
  }
  if (sb.is_multistem && Array.isArray(sb.stem_diameters_cm) && sb.stem_diameters_cm.length > 1) {
    const stemsStr = sb.stem_diameters_cm.map((cm) => formatCompactNum(cm / 2.54)).join(',');
    const baseStemsStr = Array.isArray(baseSb.stem_diameters_cm)
      ? baseSb.stem_diameters_cm.map((cm) => formatCompactNum(cm / 2.54)).join(',')
      : '';
    if (stemsStr !== baseStemsStr) {
      params.set('stems', stemsStr);
    }
  }

  return `?${params.toString()}`;
}

/**
 * Decode a human-readable tree query string (?city=...&tree=...&dbh=...&cavity=...&cut=...)
 * back into a complete field case object, applying proportional geometry scaling from the archetype.
 */
export function decodeReadableTreeQuery(searchStr, options = {}) {
  if (!searchStr || typeof searchStr !== 'string') return null;
  let queryPart = searchStr.trim();
  const qIdx = queryPart.indexOf('?');
  if (qIdx >= 0) queryPart = queryPart.slice(qIdx + 1);
  if (!queryPart) return null;

  const params = new URLSearchParams(queryPart);
  const hasTreeParam = ['city', 'tree', 'dbh', 'cavity', 'tr', 'cut', 'sp', 'name'].some((k) =>
    params.has(k)
  );
  if (!hasTreeParam) return null;

  let baseIdx = params.has('tree') ? resolveGalleryCaseIndex(params.get('tree')) : -1;
  if (baseIdx < 0 && params.has('city')) {
    const cityMatchIdx = GALLERY_CASES.findIndex((g) => g.ordinance_id === params.get('city'));
    if (cityMatchIdx >= 0) baseIdx = cityMatchIdx;
  }
  if (baseIdx < 0) baseIdx = 0;

  const cloned = cloneJson(GALLERY_CASES[baseIdx] || GALLERY_CASES[0]);
  const a = cloned.assessment;
  const sb = a.structural_baseline;
  const rh = a.rhizosphere_and_root_collar;

  if (params.has('city')) {
    cloned.ordinance_id = params.get('city') || cloned.ordinance_id;
  }

  const baseDbhCm = Number(sb.dbh_cm) || 76.2;
  const baseDbhIn = baseDbhCm / 2.54;
  let dbhIn = baseDbhIn;
  if (params.has('dbh')) {
    const parsedDbh = Number(params.get('dbh'));
    if (Number.isFinite(parsedDbh) && parsedDbh > 0) {
      dbhIn = Math.max(2, Math.min(144, parsedDbh));
    }
  }
  const dbhCm = Math.round(dbhIn * 2.54 * 100) / 100;
  const scaleRatio = dbhIn / (baseDbhIn || 30);

  if (params.has('stems')) {
    const stemsIn = String(params.get('stems'))
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && n > 0);
    if (stemsIn.length > 0) {
      const stemsCm = stemsIn.map((n) => Math.round(n * 2.54 * 10) / 10);
      sb.is_multistem = stemsCm.length > 1;
      sb.stem_diameters_cm = stemsCm;
      sb.multistem_aggregation_method = stemsCm.length > 1 ? 'quadratic_rss' : 'single_stem';
      const rssDbhIn = Math.sqrt(stemsIn.reduce((s, n) => s + n * n, 0));
      dbhIn = Math.round(rssDbhIn * 10) / 10;
      sb.dbh_cm = Math.round(dbhIn * 2.54 * 100) / 100;
    }
  } else {
    sb.dbh_cm = dbhCm;
    const isPecanMultiDefault =
      READABLE_TREE_SLUGS[baseIdx] === 'georgetown-pecan' && Math.abs(dbhIn - 27) < 0.5;
    if (READABLE_TREE_SLUGS[baseIdx] === 'georgetown-pecan' && !isPecanMultiDefault) {
      sb.is_multistem = false;
      sb.multistem_aggregation_method = 'single_stem';
      delete sb.stem_diameters_cm;
    }
  }

  if (params.has('dbh') && Math.abs(scaleRatio - 1) > 0.005) {
    sb.height_m = Math.round(Math.max(6.0, (Number(sb.height_m) || 16.5) * scaleRatio) * 10) / 10;
    sb.crown_spread_ns_m =
      Math.round(Math.max(5.0, (Number(sb.crown_spread_ns_m) || 22.0) * scaleRatio) * 10) / 10;
    sb.crown_spread_ew_m =
      Math.round(Math.max(5.0, (Number(sb.crown_spread_ew_m) || 24.0) * scaleRatio) * 10) / 10;
    rh.root_flare_diameter_cm =
      Math.round(
        Math.max(sb.dbh_cm * 1.15, (Number(rh.root_flare_diameter_cm) || sb.dbh_cm * 1.25) * scaleRatio) *
          10
      ) / 10;
  }

  const crzMult = Number(options.crzMult) || 1.0;
  const crzMin = Number(options.crzMin) || 0;
  const crz = calculateCRZ(dbhIn, crzMult, crzMin);
  const srz = calculateSRZ((Number(rh.root_flare_diameter_cm) || sb.dbh_cm * 1.25) / 2.54, dbhIn);
  const tizRadiusM = Math.round(crz.radius_meters * 1.5 * 100) / 100;
  rh.crz_radius_m = Math.round(crz.radius_meters * 100) / 100;
  rh.srz_radius_m = Math.round(srz.radius_meters * 100) / 100;
  rh.tiz_radius_m = tizRadiusM;
  if (a.understory_and_guild_prescription) {
    a.understory_and_guild_prescription.mulch_coverage_area_m2 =
      Math.round(Math.PI * tizRadiusM * tizRadiusM * 100) / 100;
  }

  if (params.has('tr')) {
    const tr = Number(params.get('tr'));
    if (Number.isFinite(tr)) {
      sb.sound_shell_thickness_ratio_t_over_r = Math.max(
        0.15,
        Math.min(1.0, Math.round(tr * 100) / 100)
      );
    }
  } else if (params.has('cavity')) {
    const cav = Math.max(0, Math.min(85, Number(params.get('cavity')) || 0));
    sb.sound_shell_thickness_ratio_t_over_r = Math.round((1 - cav / 100) * 100) / 100;
  }

  if (params.has('cut')) {
    cloned.crz_disturbed_pct = Math.max(0, Math.min(100, Number(params.get('cut')) || 0));
  }
  if (params.has('fill')) {
    cloned.cutfill_depth_in = Math.max(0, Number(params.get('fill')) || 0);
  }
  if (params.has('imp')) {
    cloned.impervious_pct = Math.max(0, Math.min(100, Number(params.get('imp')) || 0));
  }
  if (params.has('crown')) {
    cloned.crown_removal_pct = Math.max(0, Math.min(100, Number(params.get('crown')) || 0));
  }
  if (params.has('removal')) {
    const rv = String(params.get('removal')).toLowerCase();
    cloned.proposed_removal = rv === '1' || rv === 'true' || rv === 'yes';
  }
  if (params.has('prune')) cloned.pruning_date = params.get('prune') || '';
  if (params.has('cond')) cloned.condition_class = params.get('cond') || cloned.condition_class;
  if (params.has('site')) cloned.site_condition = params.get('site') || cloned.site_condition;
  if (params.has('sp')) sb.species_scientific = params.get('sp') || sb.species_scientific;
  if (params.has('name')) sb.species_common = params.get('name') || sb.species_common;
  if (params.has('tag')) sb.tree_tag = params.get('tag') || sb.tree_tag;

  const finalTR = Number(sb.sound_shell_thickness_ratio_t_over_r ?? 0.38);
  if (sb.municipal_permit_disposition) {
    sb.municipal_permit_disposition.jurisdiction_id = cloned.ordinance_id;
    sb.municipal_permit_disposition.recommended_disposition = cloned.proposed_removal
      ? 'Removal_Last_Resort_Unmitigable_Hazard'
      : finalTR >= 0.3
      ? 'Preservation_With_Rhizosphere_Remediation'
      : 'Structural_Risk_Reduction_Pruning';
  }

  cloned.engine_version = ENGINE_VERSION;
  return cloned;
}

/**
 * D2. Format the sticky determination bar summary fields from a completed evaluation.
 */
export function formatStickyDeterminationSummary(evalResult) {
  if (!evalResult) return null;
  const status = statusLabel(evalResult.evaluatedRow);
  const isPermitReq = Boolean(evalResult.permit?.required ?? evalResult.permit?.permit_required);
  const permitReq = isPermitReq ? 'Permit Required' : 'No Permit Triggered';
  const dbh = `${evalResult.biomechanics.dbh_inches} in (${evalResult.biomechanics.dbh_cm} cm)`;
  const crz = `${evalResult.rootZones.crz.radius_feet} ft (${evalResult.rootZones.crz.radius_meters} m)`;
  const replacementOwed = `${evalResult.mitigationIfRemoved.replacement_inches_owed} in`;
  const cashInLieu = `$${Number(evalResult.mitigationIfRemoved.cash_in_lieu_usd || 0).toLocaleString('en-US')}`;
  const oneLine = `${status} (${permitReq}) | DBH: ${dbh} | CRZ: ${crz} | Replacement Owed: ${replacementOwed} | Cash in Lieu: ${cashInLieu}`;
  return {
    status,
    permit_required: permitReq,
    dbh,
    crz,
    replacement_owed: replacementOwed,
    cash_in_lieu: cashInLieu,
    one_line_text: oneLine,
  };
}

/**
 * D5. Inspect a municipality record and return its provenance metadata and explicit
 * "What this record does not know" list of UNVERIFIED statutory sub-sections.
 */
export function inspectMunicipalityProvenance(muni) {
  if (!muni) return null;

  const hasPermitTriggers = Boolean(
    muni.permit_triggers_by_work_type && Object.keys(muni.permit_triggers_by_work_type).length > 0
  );
  const hasPlanRules = Boolean(muni.plan_rules && Object.keys(muni.plan_rules).length > 0);
  const hasSurveyRules = Boolean(muni.plan_rules?.survey);
  const hasRootZoneRules = Boolean(muni.plan_rules?.root_zone);
  const hasPruningRules = Boolean(muni.plan_rules?.pruning);
  const hasSpeciesThresholds = Boolean(
    muni.heritage_species_thresholds && Object.keys(muni.heritage_species_thresholds).length > 0
  );
  const hasCivilPenalty = muni.mitigation_fee_schedule?.penalty_civil_per_tree !== undefined;

  const recordTier = hasPermitTriggers && hasPlanRules ? 'Full_Rule_Record' : 'Threshold_And_Fee_Record';

  const verifiedSections = [
    {
      field: 'dbh_threshold_inches & heritage_threshold_inches',
      value: `Protected >= ${muni.dbh_threshold_inches} in; Heritage >= ${muni.heritage_threshold_inches ?? 'N/A'} in`,
      citation: muni.ordinance_numbers,
    },
    {
      field: 'mitigation_fee_schedule.tiers',
      value: `${(muni.mitigation_fee_schedule?.tiers || []).length} caliper replacement & cash-in-lieu tiers encoded`,
      citation: muni.mitigation_fee_schedule?.citation || muni.ordinance_numbers,
    },
  ];

  if (hasSpeciesThresholds) {
    verifiedSections.push({
      field: 'heritage_species_thresholds',
      value: `${Object.keys(muni.heritage_species_thresholds).length} species-specific Heritage DBH thresholds encoded`,
      citation: muni.ordinance_numbers,
    });
  }
  if (hasPermitTriggers) {
    verifiedSections.push({
      field: 'permit_triggers_by_work_type',
      value: `Protected: [${(muni.permit_triggers_by_work_type.protected || []).join(', ')}]; Heritage: [${(muni.permit_triggers_by_work_type.heritage || []).join(', ')}]`,
      citation: muni.permit_triggers_by_work_type.citation || muni.ordinance_numbers,
    });
  }
  if (hasSurveyRules) {
    verifiedSections.push({
      field: 'plan_rules.survey',
      value: `Multi-trunk method: ${muni.plan_rules.survey.multi_trunk}; min survey DBH: ${muni.plan_rules.survey.hardwood_min_dbh} in`,
      citation: muni.plan_rules.survey.citation || muni.ordinance_numbers,
    });
  }
  if (hasRootZoneRules) {
    verifiedSections.push({
      field: 'plan_rules.root_zone',
      value: `CRZ ${muni.plan_rules.root_zone.crz_ft_per_inch} ft/in (min ${muni.plan_rules.root_zone.crz_min_ft} ft); removal trigger >${muni.plan_rules.root_zone.removal_if_disturbed_pct}% CRZ disturbance`,
      citation: muni.plan_rules.root_zone.citation || muni.ordinance_numbers,
    });
  }
  if (hasPruningRules) {
    verifiedSections.push({
      field: 'plan_rules.pruning',
      value: `Standard: ${muni.plan_rules.pruning.standard}${muni.plan_rules.pruning.oak_months ? `; permitted oak pruning months: [${muni.plan_rules.pruning.oak_months.join(', ')}]` : ''}`,
      citation: muni.plan_rules.pruning.citation || muni.ordinance_numbers,
    });
  }

  const unverifiedGaps = [];

  if (!hasPermitTriggers) {
    unverifiedGaps.push({
      field: 'permit_triggers_by_work_type',
      status: 'UNVERIFIED',
      description:
        'Work-type permit triggers (removal vs. pruning by protection tier) are not encoded in this Threshold_And_Fee_Record. Engine evaluates DBH protection status and fee tiers only without asserting work-type pruning triggers.',
    });
  }
  if (!hasSurveyRules) {
    unverifiedGaps.push({
      field: 'plan_rules.survey (multi_trunk, hardwood_min_dbh, max_age_years)',
      status: 'UNVERIFIED',
      description:
        'Municipal tree survey submittal age limit and municipal multi-trunk aggregation formula are not encoded in this record. Engine uses caller-specified multi-stem aggregation method.',
    });
  }
  if (!hasRootZoneRules) {
    unverifiedGaps.push({
      field: 'plan_rules.root_zone (crz_ft_per_inch, removal_if_disturbed_pct, cutfill_max_in, impervious_max_pct, crown_removal_max_pct)',
      status: 'UNVERIFIED',
      description:
        'Municipal Critical Root Zone disturbance thresholds (max % CRZ impact before mandatory removal classification, max cut/fill inches, and max impervious cover %) are not encoded. Engine applies ANSI A300 / ISA BMP 1.0 ft/in baseline without asserting municipal site-plan violation triggers.',
    });
  }
  if (!hasPruningRules) {
    unverifiedGaps.push({
      field: 'plan_rules.pruning (standard, oak_months)',
      status: 'UNVERIFIED',
      description:
        'Municipal seasonal Oak Wilt pruning window and municipal pruning performance sub-section citation are not encoded in this record.',
    });
  }
  if (!hasSpeciesThresholds) {
    unverifiedGaps.push({
      field: 'heritage_species_thresholds',
      status: 'UNVERIFIED',
      description:
        `Species-specific Heritage DBH overrides are not encoded in this record. Engine evaluates Heritage qualification using the general ${muni.heritage_threshold_inches}-inch threshold only.`,
    });
  }
  if (!hasCivilPenalty) {
    unverifiedGaps.push({
      field: 'mitigation_fee_schedule.penalty_civil_per_tree & penalty_citation',
      status: 'UNVERIFIED',
      description:
        'Civil fine per tree and enforcement subsection citation for unpermitted removal are not encoded in this record.',
    });
  }

  return {
    dataset_version: DATASET_VERSION,
    dataset_standard: 'OpenArbor Municipal Tree Protection Ordinance Schema v2.0',
    record_id: muni.id,
    municipality_name: `${muni.name}, ${muni.state}`,
    record_tier: recordTier,
    primary_citation: muni.ordinance_numbers,
    source_url: muni.source_url,
    last_verified: DATASET_LAST_VERIFIED,
    verified_sections: verifiedSections,
    unverified_gaps: unverifiedGaps,
  };
}

function escapeChipHtml(val) {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Render an accessible, print-safe expandable chip (<details class="oa-hash-chip">)
 * for long SHA-256 hex digests, cryptographic proof strings, or #oa1= permalinks.
 * Shows a compact preview on mobile/screen while keeping full text searchable via <details>
 * and rendering the full unwrapped string cleanly in @media print.
 */
export function renderExpandableHashHtml(rawValue, options = {}) {
  const str = String(rawValue ?? '').trim();
  if (!str) return '';
  const headChars = Number(options.headChars ?? 10);
  const tailChars = Number(options.tailChars ?? 8);
  const codeId = options.codeId ? ` id="${escapeChipHtml(options.codeId)}"` : '';
  const dangerClass = options.danger ? ' is-danger' : '';
  const escapedFull = escapeChipHtml(str);
  if (str.length <= headChars + tailChars + 5) {
    return `<code${codeId}>${escapedFull}</code>`;
  }
  const shortPreview = escapeChipHtml(`${str.slice(0, headChars)}...${str.slice(-tailChars)}`);
  return `<details class="oa-hash-chip${dangerClass}"><summary class="oa-hash-chip-summary"><code class="oa-hash-chip-short">${shortPreview}</code><span class="oa-hash-chip-action-closed">Expand</span><span class="oa-hash-chip-action-open">Collapse</span></summary><div class="oa-hash-chip-panel"><code${codeId} class="oa-hash-chip-full">${escapedFull}</code><button type="button" class="btn btn-outline btn-xs oa-hash-copy-btn" data-copy-hash="${escapedFull}">Copy</button></div></details>`;
}
