/**
 * OpenArbor Core — Regenerative Consulting Arborist Engine (RCA-Spec v2.0)
 * Absorbs 100% of classical ISA (TRAQ, CODIT), ASCA (7-part evidentiary structure),
 * and Mattheck (t/R shell-wall buckling, AS 4970 SRZ) technical rigor into open code,
 * while inverting the value polarity from liquidation/liability to living holobiont equity.
 *
 * Zero proprietary dependencies. ECMAScript Modules (ESM).
 */

import { calculateCRZ, calculateSRZ, unionRootZoneArea } from './rootZone.js';

const round2 = (n) => Math.round(Number(n || 0) * 100) / 100;
const round1 = (n) => Math.round(Number(n || 0) * 10) / 10;

const OLC_CHARS = '23456789CFGHJMPQRVWX';

/**
 * Pure JavaScript Open Location Code (Plus Code) decoder.
 * Extracts latitude and longitude without external dependencies.
 * @param {string} code - 10-character global Plus Code (e.g., '8624M38F+4X')
 * @returns {{lat: number, lng: number}|null}
 */
export function decodePlusCode(code) {
  if (!code || typeof code !== 'string') return null;
  const clean = code.replace('+', '').toUpperCase();
  if (clean.length < 2) return null;
  let lat = -90;
  let lng = -180;
  let latResolution = 20;
  let lngResolution = 20;

  for (let i = 0; i < Math.min(clean.length, 10); i += 2) {
    const latDigit = OLC_CHARS.indexOf(clean[i]);
    const lngDigit = OLC_CHARS.indexOf(clean[i + 1]);
    if (latDigit === -1 || lngDigit === -1) break;
    lat += latDigit * latResolution;
    lng += lngDigit * lngResolution;
    latResolution /= 20;
    lngResolution /= 20;
  }
  return {
    lat: round2(lat + (latResolution * 10)),
    lng: round2(lng + (lngResolution * 10)),
  };
}

/**
 * 1. Full Classical Biomechanics + Rhizosphere Physics
 * Absorbs Mattheck's t/R hollow-shell buckling ratio (t/R >= 0.30 retains full bending strength),
 * AS 4970 Structural Root Zone (SRZ), Shigo CODIT walls, and computes deterministic
 * pneumatic AirSpade decompaction and biological amendment prescriptions.
 *
 * @param {object} assessment - RCA assessment record conforming to schemas/rca_assessment.schema.json
 * @returns {object} Biomechanical stability factors and rhizosphere prescription quantities
 */
export function evaluateBiomechanicsAndRhizosphere(assessment) {
  if (!assessment || typeof assessment !== 'object') {
    throw new Error('assessment must be a valid object');
  }
  const structural = assessment.structural_baseline || {};
  const rhizosphere = assessment.rhizosphere_and_root_collar || {};

  const dbhCm = Number(structural.dbh_cm) || 0;
  if (dbhCm <= 0) {
    throw new Error('structural_baseline.dbh_cm must be > 0');
  }
  const dbhInches = dbhCm / 2.54;
  const radiusCm = dbhCm / 2;

  // Mattheck t/R ratio: outer sound wood shell thickness to trunk radius
  let tOverR = structural.sound_shell_thickness_ratio_t_over_r;
  if (tOverR == null) {
    tOverR = 1.0; // Default to fully solid wood if unmeasured
  }
  tOverR = Math.max(0, Math.min(1.0, Number(tOverR)));
  const soundShellCm = round1(tOverR * radiusCm);

  // Mattheck stability criterion: t/R >= 0.30 maintains full hollow-cylinder bending strength
  const isStructurallySound = tOverR >= 0.30;
  const stabilityRating = isStructurallySound
    ? 'Structurally Sound (t/R >= 0.30 Mattheck Criterion Satisfied)'
    : 'Critical Shell Thinning (t/R < 0.30 Elevated Buckling Risk)';

  // Root Zone Radii (AS 4970 / Mattheck SRZ + concentric CRZ & TIZ)
  const rootFlareDiaCm = Number(rhizosphere.root_flare_diameter_cm) || (dbhCm * 1.2);
  const rootFlareDiaInches = rootFlareDiaCm / 2.54;
  const srz = calculateSRZ(rootFlareDiaInches, dbhInches);
  const crz = calculateCRZ(dbhInches, 1.0);
  const tizRadiusM = Number(rhizosphere.tiz_radius_m) || round2(crz.radius_meters * 1.5);
  const tizAreaSqm = round2(Math.PI * (tizRadiusM ** 2));

  // Pneumatic Rhizosphere Decompaction (AirSpade at 150 psi)
  const airspade = rhizosphere.airspade_radial_trenching_geometry || {};
  const trenchCount = Number(airspade.trench_count) || 6;
  const trenchLengthM = Number(airspade.trench_length_m) || round2(crz.radius_meters * 0.75);
  const trenchWidthCm = Number(airspade.trench_width_cm) || 30;
  const trenchDepthCm = Number(airspade.trench_depth_cm) || 35;
  const rceRadiusM = Number(airspade.root_collar_excavation_radius_m) || 0.6;
  const burialDepthCm = Number(rhizosphere.root_flare_burial_depth_cm) || 15;

  const radialTrenchVolumeM3 = round2(trenchCount * trenchLengthM * (trenchWidthCm / 100) * (trenchDepthCm / 100));
  const rceVolumeM3 = round2(Math.PI * (rceRadiusM ** 2) * (burialDepthCm / 100));
  const totalDecompactedVolumeM3 = round2(radialTrenchVolumeM3 + rceVolumeM3);

  // Biological Inoculant & Amendment Scaling
  const prechargedBiocharLiters = Math.round(totalDecompactedVolumeM3 * 1000 * 0.08); // 8% by volume
  const fungalCompostM3 = round2(totalDecompactedVolumeM3 * 0.15); // 15% by volume
  const ramialWoodchipMulchM3 = round2(tizAreaSqm * 0.08); // 8 cm depth across TIZ
  const fungalHumateKg = round2(totalDecompactedVolumeM3 * 1.5); // 1.5 kg humate per m3

  // Stem Girdling Root (SGR) Constriction & Vascular Relief
  const sgrCount = Number(rhizosphere.stem_girdling_root_count) || 0;
  const sgrSeverity = rhizosphere.stem_girdling_root_severity || 'None';
  const estimatedConstrictionPct = sgrSeverity === 'Severe'
    ? 60
    : sgrSeverity === 'Moderate'
    ? 35
    : sgrSeverity === 'Mild'
    ? 15
    : 0;
  const vascularReliefRatio = sgrCount > 0 ? round2(estimatedConstrictionPct / 100) : 0;

  return {
    dbh_cm: dbhCm,
    dbh_inches: round2(dbhInches),
    biomechanics: {
      sound_shell_thickness_ratio_t_over_r: tOverR,
      sound_shell_cm: soundShellCm,
      trunk_radius_cm: round1(radiusCm),
      is_structurally_sound: isStructurallySound,
      mattheck_criterion_satisfied: isStructurallySound,
      stability_rating: stabilityRating,
      codit_wall_response_rating: structural.codit_wall_response_rating || 'Intact Compartmentalization',
    },
    root_zones: {
      srz_radius_meters: srz.radius_meters,
      crz_radius_meters: crz.radius_meters,
      tiz_radius_meters: tizRadiusM,
      tiz_area_sqm: tizAreaSqm,
    },
    rhizosphere_prescription: {
      operating_pressure_psi: airspade.operating_pressure_psi || 150,
      radial_trench_volume_m3: radialTrenchVolumeM3,
      root_collar_excavation_volume_m3: rceVolumeM3,
      total_decompacted_soil_m3: totalDecompactedVolumeM3,
      stem_girdling_root_count: sgrCount,
      stem_girdling_root_severity: sgrSeverity,
      vascular_constriction_relief_ratio: vascularReliefRatio,
      amendments: {
        precharged_biochar_liters: prechargedBiocharLiters,
        fungal_compost_m3: fungalCompostM3,
        ramial_woodchip_mulch_m3: ramialWoodchipMulchM3,
        fungal_humate_kg: fungalHumateKg,
      },
    },
  };
}

/**
 * 2. Living Asset Equity vs. CTLA Depreciation Dual Valuation
 * Computes both the classical CTLA 10th Edition Trunk Formula depreciated liquidation cost
 * and the Regenerative Holobiont Biological Equity value (inverting the penalty for veteran trees).
 *
 * @param {object} assessment - RCA assessment record
 * @param {object} options - Optional valuation parameters
 * @returns {object} Dual valuation report contrasting CTLA and Holobiont values
 */
export function computeHolobiontValuation(assessment, options = {}) {
  if (!assessment || typeof assessment !== 'object') {
    throw new Error('assessment must be a valid object');
  }
  const structural = assessment.structural_baseline || {};
  const rhizosphere = assessment.rhizosphere_and_root_collar || {};

  const dbhCm = Number(structural.dbh_cm) || 0;
  if (dbhCm <= 0) {
    throw new Error('structural_baseline.dbh_cm must be > 0');
  }
  const dbhInches = dbhCm / 2.54;
  const trunkAreaSqIn = (Math.PI / 4) * (dbhInches ** 2);

  // --- Part 1: Classical CTLA 10th Edition Trunk Formula Technique (TFT) ---
  const unitCostSqIn = Number(options.unit_cost_sq_in) || 75.0;
  const basicTreeCost = trunkAreaSqIn * unitCostSqIn;

  // Conventional CTLA penalizes internal decay and cavities as poor 'Condition'
  let ctlaConditionFactor = options.ctla_condition_factor;
  if (ctlaConditionFactor == null) {
    const tOverR = structural.sound_shell_thickness_ratio_t_over_r;
    if (tOverR != null) {
      // Legacy appraisers penalize condition heavily when hollow
      ctlaConditionFactor = Math.min(0.85, Math.max(0.20, tOverR * 0.85));
    } else {
      ctlaConditionFactor = 0.50;
    }
  }
  ctlaConditionFactor = Number(ctlaConditionFactor);
  const ctlaLocationFactor = Number(options.ctla_location_factor ?? 0.80);
  const ctlaDepreciatedValueUsd = Math.round(basicTreeCost * ctlaConditionFactor * ctlaLocationFactor);

  // --- Part 2: Regenerative Holobiont Living Asset Equity ---
  // Component A: Biomass Carbon (200-year storage asset)
  const aboveGroundBiomassKg = Math.exp(-2.0773 + 2.3323 * Math.log(dbhCm));
  const totalBiomassKg = aboveGroundBiomassKg * 1.28 * 0.8;
  const carbonStorageKg = totalBiomassKg * 0.5;
  const carbonPricePerTon = Number(options.social_cost_carbon_usd_per_ton ?? 190.0);
  const carbonStorageEquityUsd = (carbonStorageKg / 1000) * carbonPricePerTon * 8; // 200-yr capital asset

  // Component B: Vadose Zone Hydrology & Canopy Rainfall Interception (50-yr service)
  const crownSpreadM = ((Number(structural.crown_spread_ns_m) || 10) + (Number(structural.crown_spread_ew_m) || 10)) / 2;
  const canopyCoverSqm = Math.PI * ((crownSpreadM / 2) ** 2);
  const annualStormwaterLiters = canopyCoverSqm * 6.5 * 18.5;
  const vadoseHydrologyEquityUsd = (annualStormwaterLiters / 1000) * 4.50 * 50;

  // Component C: Common Mycorrhizal Network (CMN) & Soil Infrastructure
  const tizRadiusM = Number(rhizosphere.tiz_radius_m) || (dbhInches * 1.5 * 0.3048);
  const tizAreaSqm = Math.PI * (tizRadiusM ** 2);
  const cmnRhizosphereEquityUsd = tizAreaSqm * 125.0; // $125 per m2 fungal-humic living infrastructure

  const baseBiologicalEquityUsd = carbonStorageEquityUsd + vadoseHydrologyEquityUsd + cmnRhizosphereEquityUsd;

  // Veteran Keystone Habitat Multiplier:
  // Decayed heartwood, cavities, and veteran structure appreciate in value because they provide
  // irreplaceable habitats for saproxylic invertebrates, cavity-nesting birds, and bats.
  let habitatMultiplier = options.veteran_keystone_habitat_multiplier;
  if (habitatMultiplier == null) {
    if (dbhCm >= 100) {
      habitatMultiplier = 3.5;
    } else if (dbhCm >= 75) {
      habitatMultiplier = 2.5;
    } else if (dbhCm >= 50) {
      habitatMultiplier = 1.8;
    } else {
      habitatMultiplier = 1.2;
    }
  }
  habitatMultiplier = round2(Math.max(1.0, Math.min(5.0, Number(habitatMultiplier))));

  const holobiontEquityUsd = Math.round(baseBiologicalEquityUsd * habitatMultiplier);
  const valuationDeltaUsd = holobiontEquityUsd - ctlaDepreciatedValueUsd;
  const inversionRatio = round2(holobiontEquityUsd / Math.max(1, ctlaDepreciatedValueUsd));

  return {
    ctla_10th_ed_depreciated_usd: ctlaDepreciatedValueUsd,
    holobiont_200yr_biological_equity_usd: holobiontEquityUsd,
    veteran_keystone_habitat_multiplier: habitatMultiplier,
    valuation_delta_usd: valuationDeltaUsd,
    inversion_ratio: inversionRatio,
    breakdown: {
      basic_tree_cost_usd: Math.round(basicTreeCost),
      ctla_condition_factor: round2(ctlaConditionFactor),
      ctla_location_factor: round2(ctlaLocationFactor),
      carbon_storage_equity_usd: Math.round(carbonStorageEquityUsd),
      vadose_hydrology_equity_usd: Math.round(vadoseHydrologyEquityUsd),
      cmn_rhizosphere_equity_usd: Math.round(cmnRhizosphereEquityUsd),
      base_biological_equity_usd: Math.round(baseBiologicalEquityUsd),
    },
  };
}

/**
 * 3. Open Sanctuary Scorecard Parcel Rollup
 * Rolls tree-level RCA records into the five Open Sanctuary Scorecard dimensions (0-100)
 * using spatial root-zone union de-duplication (unionRootZoneArea).
 *
 * @param {Array<object>} assessments - Array of RCA assessment records for the parcel
 * @param {number|null} parcelAreaSqm - Total parcel area in square meters (default: 4047 sqm = 1 acre)
 * @returns {object} Rollup scorecard record
 */
export function computeSanctuaryScorecardRollup(assessments, parcelAreaSqm = null) {
  if (!Array.isArray(assessments) || assessments.length === 0) {
    throw new Error('assessments must be a non-empty array of assessment objects');
  }

  const effectiveParcelAreaSqm = Number(parcelAreaSqm) > 0 ? Number(parcelAreaSqm) : 4047; // 1 acre fallback

  // Prepare trees for spatial union de-duplication
  const treesForUnion = assessments.map((a, idx) => {
    const structural = a.structural_baseline || {};
    const rhizosphere = a.rhizosphere_and_root_collar || {};

    let lat = structural.lat;
    let lng = structural.lng;
    if (lat == null || lng == null) {
      const decoded = decodePlusCode(structural.plus_code_global);
      if (decoded) {
        lat = decoded.lat;
        lng = decoded.lng;
      } else {
        // Fallback synthetic coordinates spaced along x-axis to allow calculation
        lat = 30.0 + (idx * 0.0001);
        lng = -98.0;
      }
    }

    const tizRadiusM = Number(rhizosphere.tiz_radius_m) || (Number(structural.dbh_cm || 30) / 2.54 * 1.5 * 0.3048);
    const tizRadiusFt = tizRadiusM / 0.3048;

    return {
      lat,
      lng,
      crz_ft: tizRadiusFt,
      crz_area: Math.PI * (tizRadiusFt ** 2),
    };
  });

  const unionResult = unionRootZoneArea(treesForUnion);
  const unionTizAreaSqm = round2(unionResult.area_sqft * 0.092903);
  const overlapSavedSqm = round2(unionResult.overlap_saved_sqft * 0.092903);

  // --- Dimension 1: Soil Health Index (0-100) ---
  let totalWeightedSoilScore = 0;
  let totalWeight = 0;

  for (const a of assessments) {
    const soil = a.soil_and_microbiome_baseline || {};
    const tizRadiusM = Number(a.rhizosphere_and_root_collar?.tiz_radius_m) || 5;
    const treeWeight = Math.PI * (tizRadiusM ** 2);

    const bulkDensity = Number(soil.bulk_density_g_cm3) || 1.35;
    const organicMatter = Number(soil.organic_matter_pct) || 3.5;
    const infiltration = Number(soil.infiltration_rate_mm_hr) || 30;
    const fbRatio = Number(soil.fungal_to_bacterial_biomass_ratio) || 0.6;

    const bdScore = Math.max(0, Math.min(100, Math.round(((1.70 - bulkDensity) / 0.65) * 100)));
    const omScore = Math.min(100, Math.round((organicMatter / 6.0) * 100));
    const infScore = Math.min(100, Math.round((infiltration / 60.0) * 100));
    const fbScore = Math.min(100, Math.round((Math.min(fbRatio, 2.0) / 1.5) * 100));

    const treeSoilScore = (bdScore + omScore + infScore + fbScore) / 4;
    totalWeightedSoilScore += treeSoilScore * treeWeight;
    totalWeight += treeWeight;
  }
  const soilHealthIndex = round1(totalWeight > 0 ? totalWeightedSoilScore / totalWeight : 50);

  // --- Dimension 2: Canopy Coverage Index (0-100) ---
  let totalCanopyProjectionSqm = 0;
  for (const a of assessments) {
    const structural = a.structural_baseline || {};
    const ns = Number(structural.crown_spread_ns_m) || 8;
    const ew = Number(structural.crown_spread_ew_m) || 8;
    const liveCrownRatio = (Number(structural.live_crown_ratio_pct) || 70) / 100;
    const treeCanopySqm = (Math.PI / 4) * ns * ew * liveCrownRatio;
    totalCanopyProjectionSqm += treeCanopySqm;
  }
  const canopyCoveragePct = (totalCanopyProjectionSqm / effectiveParcelAreaSqm) * 100;
  // Scaled against urban forestry 40% optimal canopy cover target
  const canopyCoverageIndex = round1(Math.min(100, (canopyCoveragePct / 40.0) * 100));

  // --- Dimension 3: Water Dynamics Index (0-100) ---
  // Combines soil infiltration capacity with canopy stormwater interception
  const waterDynamicsIndex = round1(Math.min(100, (soilHealthIndex * 0.6) + (canopyCoverageIndex * 0.4)));

  // --- Dimension 4: Biodiversity Baseline Index (0-100) ---
  const uniqueTaxa = new Set();
  for (const a of assessments) {
    // Tree taxon
    const treeTaxon = a.evidence_tree_taxon_id || a.structural_baseline?.inaturalist_taxon_id;
    if (treeTaxon) uniqueTaxa.add(`tree_${treeTaxon}`);

    // Soil fungal taxa
    const soilTaxa = a.soil_and_microbiome_baseline?.dominant_fungal_taxa_inaturalist_ids || [];
    for (const t of soilTaxa) uniqueTaxa.add(`fungus_${t}`);

    // Companion guild species
    const guild = a.understory_and_guild_prescription?.native_companion_species_guild || [];
    for (const g of guild) {
      if (g.inaturalist_taxon_id) uniqueTaxa.add(`guild_${g.inaturalist_taxon_id}`);
    }
  }
  // 15 unique taxa represents a thriving keystone habitat benchmark (100 pts)
  const biodiversityBaselineIndex = round1(Math.min(100, (uniqueTaxa.size / 15.0) * 100));

  // --- Dimension 5: Restoration Potential Score (0-100) ---
  let totalRestoration = 0;
  for (const a of assessments) {
    const targets = a.outcome_monitoring_schedule?.sanctuary_scorecard_targets || {};
    const realized = Number(targets.restoration_potential_realized_pct) || 75;
    totalRestoration += realized;
  }
  const restorationPotentialScore = round1(totalRestoration / assessments.length);

  // --- Composite Sanctuary Score (0-100) ---
  const compositeSanctuaryScore = round1(
    (soilHealthIndex + canopyCoverageIndex + waterDynamicsIndex + biodiversityBaselineIndex + restorationPotentialScore) / 5
  );

  // --- Total Ecological Equity Delta (USD) ---
  let totalHolobiontEquityUsd = 0;
  let totalCtlaEquityUsd = 0;
  for (const a of assessments) {
    const val = computeHolobiontValuation(a);
    totalHolobiontEquityUsd += val.holobiont_200yr_biological_equity_usd;
    totalCtlaEquityUsd += val.ctla_10th_ed_depreciated_usd;
  }
  const totalValuationDeltaUsd = totalHolobiontEquityUsd - totalCtlaEquityUsd;

  return {
    total_assessed_trees: assessments.length,
    parcel_area_sqm: effectiveParcelAreaSqm,
    spatial_coverage: {
      union_tiz_area_sqm: unionTizAreaSqm,
      overlap_deduplicated_sqm: overlapSavedSqm,
      total_canopy_projection_sqm: round2(totalCanopyProjectionSqm),
      canopy_coverage_parcel_pct: round2(canopyCoveragePct),
    },
    sanctuary_scorecard: {
      soil_health_index: soilHealthIndex,
      canopy_coverage_index: canopyCoverageIndex,
      water_dynamics_index: waterDynamicsIndex,
      biodiversity_baseline_index: biodiversityBaselineIndex,
      restoration_potential_score: restorationPotentialScore,
      composite_sanctuary_score: compositeSanctuaryScore,
    },
    ecological_equity: {
      total_holobiont_200yr_equity_usd: totalHolobiontEquityUsd,
      total_ctla_depreciated_usd: totalCtlaEquityUsd,
      total_valuation_delta_usd: totalValuationDeltaUsd,
      inversion_ratio: round2(totalHolobiontEquityUsd / Math.max(1, totalCtlaEquityUsd)),
    },
  };
}

/**
 * 4. RCA Evidentiary Report Linter
 * Enforces ASCA-grade evidentiary rigor alongside Nature-First preservation priority.
 * Blocks lazy or un-justified tree removals where Mattheck t/R >= 0.30 indicates structural stability
 * and rhizosphere remediation is viable.
 *
 * @param {object} assessment - RCA assessment record
 * @returns {object} Validation result { valid: boolean, errors: string[], warnings: string[], passed_checks: string[] }
 */
export function lintRcaEvidentiaryReport(assessment) {
  if (!assessment || typeof assessment !== 'object') {
    return {
      valid: false,
      errors: ['Assessment must be a non-null object'],
      warnings: [],
      passed_checks: [],
    };
  }

  const errors = [];
  const warnings = [];
  const passedChecks = [];

  // Check 1: Mandatory five-domain schema integrity
  const requiredDomains = [
    'structural_baseline',
    'rhizosphere_and_root_collar',
    'soil_and_microbiome_baseline',
    'understory_and_guild_prescription',
    'outcome_monitoring_schedule',
  ];

  for (const domain of requiredDomains) {
    if (!assessment[domain] || typeof assessment[domain] !== 'object') {
      errors.push(`MISSING_DOMAIN: Mandatory RCA diagnostic domain '${domain}' is missing or invalid`);
    } else {
      passedChecks.push(`Domain present: ${domain}`);
    }
  }

  const structural = assessment.structural_baseline || {};
  const rhizosphere = assessment.rhizosphere_and_root_collar || {};
  const permit = structural.municipal_permit_disposition || {};

  // Check 2: Biometric bounds & unit sanity
  if (structural.dbh_cm == null || structural.dbh_cm <= 0) {
    errors.push('INVALID_BIOMETRICS: structural_baseline.dbh_cm must be a positive number');
  } else {
    passedChecks.push(`DBH verified: ${structural.dbh_cm} cm`);
  }

  if (!structural.plus_code_global || typeof structural.plus_code_global !== 'string') {
    errors.push('INVALID_GEO_LOCATION: structural_baseline.plus_code_global must be a valid Plus Code');
  } else {
    passedChecks.push(`Location verified: ${structural.plus_code_global}`);
  }

  // Check 3: Mattheck t/R Preservation Gate (Blocking Un-justified Removals)
  const disposition = permit.recommended_disposition;
  const tOverR = structural.sound_shell_thickness_ratio_t_over_r;

  if (disposition === 'Removal_Last_Resort_Unmitigable_Hazard') {
    // If sound shell ratio t/R >= 0.30, tree possesses full hollow-cylinder bending strength
    if (tOverR != null && tOverR >= 0.30) {
      errors.push(
        `UNJUSTIFIED_REMOVAL: Tree exhibits sound shell ratio t/R = ${tOverR} >= 0.30, satisfying Mattheck hollow-cylinder stability. Removal is prohibited when root collar decompression and crown reduction can mitigate target risk.`
      );
    } else {
      passedChecks.push('Removal candidate checked against Mattheck t/R threshold');
    }

    // Advanced diagnostic requirement for mature tree removal
    if (!structural.sonic_tomography_or_resistograph_uri) {
      errors.push(
        'EVIDENTIARY_DEFECT: Removal of a mature or protected tree requires acoustic tomogram or resistograph documentation in sonic_tomography_or_resistograph_uri.'
      );
    } else {
      passedChecks.push('Advanced internal decay diagnostics verified');
    }

    // Rhizosphere remediation evaluation requirement
    const airspade = rhizosphere.airspade_radial_trenching_geometry || {};
    if (airspade.execution_status === 'Not_Viable' && !airspade.notes) {
      warnings.push('Removal recommended but rhizosphere decompression non-viability lacks detailed technical justification notes.');
    }
  } else {
    passedChecks.push(`Preservation disposition confirmed: ${disposition || 'Preservation_Primary'}`);
  }

  // Check 4: Bioregional Oak Wilt Vector Restriction Gate
  if (permit.seasonal_oak_wilt_restriction_active === true) {
    if (disposition === 'Structural_Risk_Reduction_Pruning') {
      errors.push(
        'OAK_WILT_VIOLATION: Structural pruning is prohibited during active seasonal oak wilt vector restrictions (Ceratocystis fagacearum).'
      );
    } else {
      passedChecks.push('Seasonal oak wilt vector restrictions respected');
    }
  }

  // Check 5: Subterranean Soil & Microbiome Rigor
  const soil = assessment.soil_and_microbiome_baseline || {};
  if (soil.bulk_density_g_cm3 == null || soil.organic_matter_pct == null || soil.infiltration_rate_mm_hr == null) {
    errors.push('INCOMPLETE_SOIL_DATA: Soil baseline must include bulk_density_g_cm3, organic_matter_pct, and infiltration_rate_mm_hr.');
  } else {
    passedChecks.push('Rhizosphere soil baseline fully quantified');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    passed_checks: passedChecks,
  };
}
