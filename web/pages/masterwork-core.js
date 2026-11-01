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

export const ENGINE_VERSION = '2.0.0';
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
    schema_version: 'RCA_v2',
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

/**
 * D1. Encode the complete assessment state into a versioned URL fragment (#oa1=...).
 * Always embeds explicit version, jurisdiction, species, DBH, work type, disturbance, and site context,
 * plus either a compact base-case index (when matching a gallery baseline) or full RCA_v2 delta blocks.
 */
export function encodeAssessmentPermalink(caseState) {
  const a = caseState.assessment || {};
  const sb = a.structural_baseline || {};
  const rh = a.rhizosphere_and_root_collar || {};
  const air = rh.airspade_radial_trenching_geometry || {};
  const soil = a.soil_and_microbiome_baseline || {};
  const myco = soil.mycorrhizal_and_fungal_observations || {};
  const traq = sb.isa_traq_risk || {};
  const disp = sb.municipal_permit_disposition || {};

  const matchedGalleryIdx = GALLERY_CASES.findIndex(
    (g) => JSON.stringify(g.assessment) === JSON.stringify(a)
  );

  const envelope = {
    v: ENGINE_VERSION,
    j: caseState.ordinance_id || disp.jurisdiction_id || 'tx-austin',
    sp: [
      sb.species_scientific || 'Quercus virginiana',
      sb.species_common || 'Live Oak',
      sb.inaturalist_taxon_id || 49005,
      myco.dominant_mycorrhizal_guild || 'Ectomycorrhizal_EM',
    ],
    dbh: [
      sb.dbh_cm || 76.2,
      Boolean(sb.is_multistem),
      sb.multistem_aggregation_method || 'single_stem',
      sb.stem_diameters_cm || null,
    ],
    wt: [
      Boolean(caseState.proposed_removal),
      caseState.pruning_date || '',
      disp.recommended_disposition || 'Preservation_With_Rhizosphere_Remediation',
    ],
    dist: [
      Number(caseState.crz_disturbed_pct ?? 0),
      Number(caseState.cutfill_depth_in ?? 0),
      Number(caseState.impervious_pct ?? 0),
      Number(caseState.crown_removal_pct ?? 0),
    ],
    ctx: [
      caseState.condition_class || 'Good',
      caseState.site_condition || 'Open Grown / Parkland',
      sb.height_m || 16.5,
      sb.crown_spread_ns_m || 22.0,
      sb.crown_spread_ew_m || 24.0,
      sb.live_crown_ratio_pct || 78,
      sb.plus_code_global || '86247784+VP',
      sb.tree_tag || 'ATX-QV-101',
      sb.assessment_date || '2026-10-28',
    ],
  };

  if (matchedGalleryIdx >= 0) {
    envelope.b = matchedGalleryIdx;
    envelope.id = caseState.id || GALLERY_CASES[matchedGalleryIdx].id;
    envelope.lbl = caseState.label || GALLERY_CASES[matchedGalleryIdx].label;
  } else {
    envelope.bio = [
      sb.sound_shell_thickness_ratio_t_over_r ?? 0.38,
      sb.codit_wall_response_rating || 'Wall_4_Active_Barrier_Zone',
      rh.root_flare_diameter_cm ?? 98,
      rh.root_flare_burial_depth_cm ?? 16,
      rh.stem_girdling_root_count ?? 2,
      rh.stem_girdling_root_severity || 'Moderate_25_To_50_Pct_Circumference',
      air.trench_count ?? 8,
      air.trench_length_m ?? 8.5,
      air.trench_width_cm ?? 30,
      air.trench_depth_cm ?? 35,
      air.root_collar_excavation_radius_m ?? 1.0,
      air.operating_pressure_psi ?? 150,
      soil.bulk_density_g_cm3 ?? 1.54,
      soil.infiltration_rate_mm_hr ?? 16,
      soil.organic_matter_pct ?? 2.6,
      soil.soil_ph ?? 7.4,
      myco.fungal_to_bacterial_biomass_ratio ?? 0.45,
      traq.assessment_level || 'Level_2_Basic',
      traq.primary_tree_part_of_concern || 'Root_Collar',
      traq.likelihood_of_failure || 'Possible',
      traq.likelihood_of_impact || 'Medium',
      traq.likelihood_of_failure_and_impact || 'Somewhat Likely',
      traq.consequences_of_failure || 'Significant',
      traq.overall_risk_rating || 'Moderate',
      traq.residual_risk_rating || 'Low',
    ];
    envelope.rca = a;
  }

  return `#oa1=${toBase64Url(JSON.stringify(envelope))}`;
}

/**
 * D1. Decode a versioned URL fragment (#oa1=...) back into a complete field case object.
 */
export function decodeAssessmentPermalink(fragment) {
  if (!fragment || typeof fragment !== 'string') return null;
  const clean = fragment.startsWith('#') ? fragment.slice(1) : fragment;
  if (!clean.startsWith('oa1=')) return null;
  const rawB64 = clean.slice(4).trim();
  if (!rawB64) return null;

  const envelope = JSON.parse(fromBase64Url(rawB64));
  if (!envelope || typeof envelope !== 'object') return null;

  const [sci, common, taxonId, guild] = envelope.sp || [];
  const [dbhCm, isMulti, multiMethod, stemCmArr] = envelope.dbh || [];
  const [proposedRemoval, pruningDate, recDisp] = envelope.wt || [];
  const [crzDist, cutfillIn, impPct, crownRemPct] = envelope.dist || [];
  const [condClass, siteCond, heightM, spreadNs, spreadEw, lcrPct, plusCode, treeTag, assessDate] =
    envelope.ctx || [];

  let assessment;
  if (typeof envelope.b === 'number' && GALLERY_CASES[envelope.b]) {
    assessment = JSON.parse(JSON.stringify(GALLERY_CASES[envelope.b].assessment));
  } else if (envelope.rca) {
    assessment = JSON.parse(JSON.stringify(envelope.rca));
  } else {
    assessment = JSON.parse(JSON.stringify(GALLERY_CASES[0].assessment));
  }

  // Apply explicit envelope fields onto assessment to guarantee round-trip fidelity
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
    sb.municipal_permit_disposition.jurisdiction_id = envelope.j || sb.municipal_permit_disposition.jurisdiction_id;
    sb.municipal_permit_disposition.recommended_disposition =
      recDisp || sb.municipal_permit_disposition.recommended_disposition;
  }
  if (assessment.soil_and_microbiome_baseline?.mycorrhizal_and_fungal_observations && guild) {
    assessment.soil_and_microbiome_baseline.mycorrhizal_and_fungal_observations.dominant_mycorrhizal_guild = guild;
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
