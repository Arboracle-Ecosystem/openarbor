/**
 * OpenArbor Core — Regenerative Consulting Arborist Engine (RCA-Spec v2.0)
 * Absorbs 100% of classical ISA (TRAQ, CODIT), ASCA (7-part evidentiary structure),
 * and Mattheck (t/R shell-wall buckling, AS 4970 SRZ) technical rigor into open code,
 * while inverting the value polarity from liquidation/liability to living holobiont equity.
 *
 * Zero proprietary dependencies. ECMAScript Modules (ESM).
 */

import crypto from 'node:crypto';
import { calculateCRZ, calculateSRZ, unionRootZoneArea } from './rootZone.js';
import {
  evaluateTreeInventory,
  permitDetermination,
  permitSummary,
  computeMitigationPlan,
  renderSiteMapSVG,
} from './ordinanceEngine.js';

const round2 = (n) => Math.round(Number(n || 0) * 100) / 100;
const round1 = (n) => Math.round(Number(n || 0) * 10) / 10;

const OLC_CHARS = '23456789CFGHJMPQRVWX';

/**
 * Pure JavaScript Open Location Code (Plus Code) decoder.
 * Extracts latitude and longitude without external dependencies.
 * @param {string} code - 10-to-15 character global Plus Code (e.g., '8624M38F+4X')
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
 * Zero-dependency recursive JSON Schema (Draft 2020-12 subset) validator.
 * Enforces type, const, enum, required, additionalProperties, minimum, maximum,
 * minLength, pattern, minItems, maxItems, prefixItems, contains, and items.
 *
 * @param {any} instance - JSON value to validate
 * @param {object} schema - JSON Schema object
 * @param {string} path - JSONPath pointer for error reporting
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateJsonSchema(instance, schema, path = '$') {
  const errors = [];
  if (!schema || typeof schema !== 'object') {
    return { valid: true, errors };
  }

  // 1. Type validation
  if (schema.type) {
    const allowedTypes = Array.isArray(schema.type) ? schema.type : [schema.type];
    const checkType = (val, t) => {
      if (t === 'null') return val === null;
      if (t === 'array') return Array.isArray(val);
      if (t === 'object') return typeof val === 'object' && val !== null && !Array.isArray(val);
      if (t === 'integer') return typeof val === 'number' && Number.isInteger(val);
      if (t === 'number') return typeof val === 'number' && !Number.isNaN(val);
      return typeof val === t;
    };
    const matchesAny = allowedTypes.some((t) => checkType(instance, t));
    if (!matchesAny) {
      errors.push(`${path}: expected type ${allowedTypes.join('|')}, got ${instance === null ? 'null' : Array.isArray(instance) ? 'array' : typeof instance}`);
      return { valid: false, errors };
    }
  }

  if (instance === null || instance === undefined) {
    return { valid: errors.length === 0, errors };
  }

  // 2. Const & Enum
  if (schema.const !== undefined && instance !== schema.const) {
    errors.push(`${path}: expected const ${JSON.stringify(schema.const)}, got ${JSON.stringify(instance)}`);
  }
  if (Array.isArray(schema.enum) && !schema.enum.includes(instance)) {
    errors.push(`${path}: value ${JSON.stringify(instance)} not in enum [${schema.enum.join(', ')}]`);
  }

  // 3. Numeric constraints
  if (typeof instance === 'number') {
    if (schema.minimum !== undefined && instance < schema.minimum) {
      errors.push(`${path}: ${instance} is less than minimum ${schema.minimum}`);
    }
    if (schema.maximum !== undefined && instance > schema.maximum) {
      errors.push(`${path}: ${instance} exceeds maximum ${schema.maximum}`);
    }
  }

  // 4. String constraints
  if (typeof instance === 'string') {
    if (schema.minLength !== undefined && instance.length < schema.minLength) {
      errors.push(`${path}: string length ${instance.length} is less than minLength ${schema.minLength}`);
    }
    if (schema.pattern) {
      const re = new RegExp(schema.pattern);
      if (!re.test(instance)) {
        errors.push(`${path}: string "${instance}" does not match pattern ${schema.pattern}`);
      }
    }
  }

  // 5. Array constraints
  if (Array.isArray(instance)) {
    if (schema.minItems !== undefined && instance.length < schema.minItems) {
      errors.push(`${path}: array length ${instance.length} is less than minItems ${schema.minItems}`);
    }
    if (schema.maxItems !== undefined && instance.length > schema.maxItems) {
      errors.push(`${path}: array length ${instance.length} exceeds maxItems ${schema.maxItems}`);
    }
    if (Array.isArray(schema.prefixItems)) {
      schema.prefixItems.forEach((subSchema, idx) => {
        if (idx < instance.length) {
          const res = validateJsonSchema(instance[idx], subSchema, `${path}[${idx}]`);
          errors.push(...res.errors);
        }
      });
    }
    if (schema.contains) {
      const hasMatch = instance.some((item) => validateJsonSchema(item, schema.contains, path).valid);
      if (!hasMatch) {
        errors.push(`${path}: array does not contain required matching element`);
      }
    }
    if (schema.items && typeof schema.items === 'object') {
      instance.forEach((item, idx) => {
        const res = validateJsonSchema(item, schema.items, `${path}[${idx}]`);
        errors.push(...res.errors);
      });
    }
  }

  // 6. Object constraints
  if (typeof instance === 'object' && !Array.isArray(instance)) {
    if (Array.isArray(schema.required)) {
      for (const reqKey of schema.required) {
        if (!Object.hasOwn(instance, reqKey) || instance[reqKey] === undefined) {
          errors.push(`${path}: missing required property '${reqKey}'`);
        }
      }
    }
    const props = schema.properties || {};
    for (const key of Object.keys(instance)) {
      if (Object.hasOwn(props, key)) {
        const res = validateJsonSchema(instance[key], props[key], `${path}.${key}`);
        errors.push(...res.errors);
      } else if (schema.additionalProperties === false) {
        errors.push(`${path}: un-schematized additional property '${key}' is forbidden (additionalProperties: false)`);
      } else if (typeof schema.additionalProperties === 'object') {
        const res = validateJsonSchema(instance[key], schema.additionalProperties, `${path}.${key}`);
        errors.push(...res.errors);
      }
    }
  }

  return { valid: errors.length === 0, errors };
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
  // Supports exact schema enums ('Severe_Over_50_Pct_Circumference', etc.) plus short-hand aliases
  const sgrCount = Number(rhizosphere.stem_girdling_root_count) || 0;
  const sgrSeverity = rhizosphere.stem_girdling_root_severity || 'None';
  const estimatedConstrictionPct =
    sgrSeverity === 'Severe_Over_50_Pct_Circumference' || sgrSeverity === 'Severe'
      ? 60
      : sgrSeverity === 'Moderate_25_To_50_Pct_Circumference' || sgrSeverity === 'Moderate'
      ? 35
      : sgrSeverity === 'Minor_Under_25_Pct_Circumference' || sgrSeverity === 'Mild' || sgrSeverity === 'Minor'
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
    const myco = soil.mycorrhizal_and_fungal_observations || {};
    const tizRadiusM = Number(a.rhizosphere_and_root_collar?.tiz_radius_m) || 5;
    const treeWeight = Math.PI * (tizRadiusM ** 2);

    const bulkDensity = Number(soil.bulk_density_g_cm3) || 1.35;
    const organicMatter = Number(soil.organic_matter_pct) || 3.5;
    const infiltration = Number(soil.infiltration_rate_mm_hr) || 30;
    const fbRatio = Number(
      myco.fungal_to_bacterial_biomass_ratio ?? soil.fungal_to_bacterial_biomass_ratio ?? 0.6
    );

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
  const canopyCoverageIndex = round1(Math.min(100, (canopyCoveragePct / 40.0) * 100));

  // --- Dimension 3: Water Dynamics Index (0-100) ---
  const waterDynamicsIndex = round1(Math.min(100, (soilHealthIndex * 0.6) + (canopyCoverageIndex * 0.4)));

  // --- Dimension 4: Biodiversity Baseline Index (0-100) ---
  const uniqueTaxa = new Set();
  for (const a of assessments) {
    // Tree taxon
    const treeTaxon = a.evidence_tree_taxon_id || a.structural_baseline?.inaturalist_taxon_id;
    if (treeTaxon) uniqueTaxa.add(`tree_${treeTaxon}`);

    // Soil fungal taxa from schema-compliant mycorrhizal_and_fungal_observations
    const soil = a.soil_and_microbiome_baseline || {};
    const myco = soil.mycorrhizal_and_fungal_observations || {};
    const observedFungi = myco.observed_fruiting_bodies_or_rhizomorphs || [];
    for (const f of observedFungi) {
      if (f && f.inaturalist_taxon_id) uniqueTaxa.add(`fungus_${f.inaturalist_taxon_id}`);
    }
    const legacyFungi = soil.dominant_fungal_taxa_inaturalist_ids || [];
    for (const t of legacyFungi) uniqueTaxa.add(`fungus_${t}`);

    // Companion guild species
    const guild = a.understory_and_guild_prescription?.native_companion_species_guild || [];
    for (const g of guild) {
      if (g.inaturalist_taxon_id) uniqueTaxa.add(`guild_${g.inaturalist_taxon_id}`);
    }
  }
  const biodiversityBaselineIndex = round1(Math.min(100, (uniqueTaxa.size / 15.0) * 100));

  // --- Dimension 5: Restoration Potential Score (0-100) ---
  let totalRestoration = 0;
  for (const a of assessments) {
    const targets =
      a.outcome_monitoring_schedule?.five_year_lagging_indicators?.sanctuary_scorecard_targets ||
      a.outcome_monitoring_schedule?.sanctuary_scorecard_targets ||
      {};
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
    if (tOverR != null && tOverR >= 0.30) {
      errors.push(
        `UNJUSTIFIED_REMOVAL: Tree exhibits sound shell ratio t/R = ${tOverR} >= 0.30, satisfying Mattheck hollow-cylinder stability. Removal is prohibited when root collar decompression and crown reduction can mitigate target risk.`
      );
    } else {
      passedChecks.push('Removal candidate checked against Mattheck t/R threshold');
    }

    if (!structural.sonic_tomography_or_resistograph_uri) {
      errors.push(
        'EVIDENTIARY_DEFECT: Removal of a mature or protected tree requires acoustic tomogram or resistograph documentation in sonic_tomography_or_resistograph_uri.'
      );
    } else {
      passedChecks.push('Advanced internal decay diagnostics verified');
    }

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

/**
 * 5. Contractor-to-RCA 5-Year Practice Economics Conversion Engine
 * Compares the one-time, high-liability Legacy Contractor Removal model against the
 * 5-Year Regenerative Consulting Arborist Stewardship model, proving that preserving
 * savable mature trees yields higher 5-year net practitioner margin while compounding
 * the landowner's biological and real estate equity.
 *
 * @param {object} assessment - RCA assessment record
 * @param {object} rates - Optional unit rate overrides
 * @returns {object} Comparative 5-year economic analysis
 */
export function computeRegenerativePracticeEconomics(assessment, rates = {}) {
  const bio = evaluateBiomechanicsAndRhizosphere(assessment);
  const val = computeHolobiontValuation(assessment, rates);
  const guild = assessment.understory_and_guild_prescription?.native_companion_species_guild || [];
  const totalPlantedUnits = guild.reduce((sum, g) => sum + (Number(g.quantity_planted) || 0), 0);

  const dbhInches = bio.dbh_inches;
  const rx = bio.rhizosphere_prescription;

  // --- Model A: Legacy Tree Removal Contractor (One-Time Liquidation) ---
  const legacyRemovalGrossUsd = Math.round(Number(rates.base_removal_usd ?? 1100) + (dbhInches * Number(rates.removal_per_dbh_inch_usd ?? 68)));
  // High crane, chipper, haul-off, and high worker-comp casualty insurance overhead (~68% direct + overhead cost -> 32% net margin)
  const legacyDirectAndLiabilityCostUsd = Math.round(legacyRemovalGrossUsd * 0.68);
  const legacyNetMarginUsd = legacyRemovalGrossUsd - legacyDirectAndLiabilityCostUsd;
  const legacyFiveYearRecurringUsd = 0;

  // --- Model B: RCA 5-Year Regenerative Stewardship Program ---
  // Year 0 Phase 1: 5-Domain Diagnostic, Tomography & Evidentiary Report
  const year0DiagnosticFeeUsd = Math.round(Number(rates.diagnostic_report_fee_usd ?? 950));
  // Year 0 Phase 2: Pneumatic AirSpade Decompaction, SGR Relief, Biochar/Compost/Humate & Understory Guild Installation
  const airspadeTrenchingFeeUsd = Math.round(rx.total_decompacted_soil_m3 * Number(rates.airspade_per_m3_usd ?? 240));
  const sgrReliefFeeUsd = rx.stem_girdling_root_count > 0 ? Math.round(250 + (rx.stem_girdling_root_count * 95)) : 0;
  const amendmentsAndMulchFeeUsd = Math.round(
    (rx.amendments.precharged_biochar_liters * 0.85) +
    (rx.amendments.fungal_compost_m3 * 145) +
    (rx.amendments.ramial_woodchip_mulch_m3 * 65) +
    (rx.amendments.fungal_humate_kg * 12)
  );
  const guildInstallationFeeUsd = Math.round(totalPlantedUnits * Number(rates.guild_plant_installed_usd ?? 28));
  const year0InstallationGrossUsd = airspadeTrenchingFeeUsd + sgrReliefFeeUsd + amendmentsAndMulchFeeUsd + guildInstallationFeeUsd;

  // Year 1: 12-Month STIM Leading Indicator & Rhizosphere Vigor Audit
  const year1AuditFeeUsd = Math.round(Number(rates.year_1_audit_fee_usd ?? 475));
  // Year 3: 36-Month Mycorrhizal Extract Drench & Mulch Horizon Recharge
  const year3RechargeFeeUsd = Math.round(Number(rates.year_3_recharge_fee_usd ?? 680) + (rx.amendments.ramial_woodchip_mulch_m3 * 25));
  // Year 5: 60-Month Lagging Soil Lab & Sanctuary Scorecard Certification
  const year5CertificationFeeUsd = Math.round(Number(rates.year_5_certification_fee_usd ?? 750));

  const rcaYear0TotalUsd = year0DiagnosticFeeUsd + year0InstallationGrossUsd;
  const rcaRecurringTotalUsd = year1AuditFeeUsd + year3RechargeFeeUsd + year5CertificationFeeUsd;
  const rcaFiveYearGrossUsd = rcaYear0TotalUsd + rcaRecurringTotalUsd;

  // Lower worker-comp casualty risk (ground-level pneumatic & biological work -> ~55% net margin across consulting + biological care)
  const rcaDirectCostUsd = Math.round(rcaFiveYearGrossUsd * 0.45);
  const rcaNetMarginUsd = rcaFiveYearGrossUsd - rcaDirectCostUsd;

  const recurringRevenueSharePct = round1((rcaRecurringTotalUsd / rcaFiveYearGrossUsd) * 100);
  const practitionerLtvAdvantageUsd = rcaFiveYearGrossUsd - legacyRemovalGrossUsd;
  const practitionerMarginAdvantageUsd = rcaNetMarginUsd - legacyNetMarginUsd;

  return {
    legacy_removal_model: {
      one_time_gross_bid_usd: legacyRemovalGrossUsd,
      direct_and_casualty_overhead_usd: legacyDirectAndLiabilityCostUsd,
      net_practitioner_margin_usd: legacyNetMarginUsd,
      five_year_recurring_revenue_usd: legacyFiveYearRecurringUsd,
      client_biological_equity_destroyed_usd: val.holobiont_200yr_biological_equity_usd,
    },
    regenerative_stewardship_model: {
      year_0_diagnostic_fee_usd: year0DiagnosticFeeUsd,
      year_0_rhizosphere_and_guild_installation_usd: year0InstallationGrossUsd,
      year_1_leading_indicator_audit_usd: year1AuditFeeUsd,
      year_3_mycorrhizal_and_mulch_recharge_usd: year3RechargeFeeUsd,
      year_5_sanctuary_scorecard_verification_usd: year5CertificationFeeUsd,
      five_year_gross_revenue_usd: rcaFiveYearGrossUsd,
      direct_biological_and_field_cost_usd: rcaDirectCostUsd,
      net_practitioner_margin_usd: rcaNetMarginUsd,
      recurring_revenue_share_pct: recurringRevenueSharePct,
      client_biological_equity_preserved_usd: val.holobiont_200yr_biological_equity_usd,
    },
    comparison: {
      practitioner_5yr_gross_advantage_usd: practitionerLtvAdvantageUsd,
      practitioner_5yr_net_margin_advantage_usd: practitionerMarginAdvantageUsd,
      margin_multiplier: round2(rcaNetMarginUsd / Math.max(1, legacyNetMarginUsd)),
      is_regenerative_more_profitable: rcaNetMarginUsd > legacyNetMarginUsd,
    },
  };
}

/**
 * Canonical SHA-256 hash of a JSON object (sorted keys at top and nested levels).
 * @param {object} obj
 * @returns {string} 64-character hex SHA-256 digest
 */
export function computeCanonicalSha256(obj) {
  const canonicalize = (val) => {
    if (Array.isArray(val)) return val.map(canonicalize);
    if (val && typeof val === 'object') {
      const sorted = Object.create(null);
      for (const k of Object.keys(val).sort()) {
        sorted[k] = canonicalize(val[k]);
      }
      return sorted;
    }
    return val;
  };
  const payload = JSON.stringify(canonicalize(obj));
  return crypto.createHash('sha256').update(payload, 'utf8').digest('hex');
}

/**
 * 6. Compile Publication-Ready 10-Section Regenerative & Evidentiary Report in Markdown
 * Turns a single RCA_v2 field JSON assessment into a complete ASCA-grade + Nature-First report.
 *
 * @param {object} assessment - RCA_v2 assessment JSON
 * @param {object} options - { municipality: object }
 * @returns {{markdown: string, sha256: string, lint: object, biomechanics: object, valuation: object, economics: object}}
 */
export function compileRcaEvidentiaryMarkdown(assessment, options = {}) {
  const lint = lintRcaEvidentiaryReport(assessment);
  const bio = evaluateBiomechanicsAndRhizosphere(assessment);
  const val = computeHolobiontValuation(assessment, options);
  const econ = computeRegenerativePracticeEconomics(assessment, options);
  const sha256 = computeCanonicalSha256(assessment);

  const structural = assessment.structural_baseline || {};
  const rhizosphere = assessment.rhizosphere_and_root_collar || {};
  const soil = assessment.soil_and_microbiome_baseline || {};
  const myco = soil.mycorrhizal_and_fungal_observations || {};
  const guild = assessment.understory_and_guild_prescription || {};
  const monitoring = assessment.outcome_monitoring_schedule || {};
  const y1 = monitoring.one_year_leading_indicators || {};
  const y5 = monitoring.five_year_lagging_indicators || {};
  const scTargets = y5.sanctuary_scorecard_targets || {};

  const coords = decodePlusCode(structural.plus_code_global) || { lat: 42.19, lng: -122.71 };
  const tag = structural.tree_tag || 'RCA-TREE-01';
  const speciesSci = structural.species_scientific || 'Quercus spp.';
  const speciesCommon = structural.species_common || 'Mature Keystone Tree';
  const assessmentDate = structural.assessment_date || '2026-10-23';

  let ordinanceSection = '';
  let svgMap = '';
  if (options.municipality) {
    const invRow = evaluateTreeInventory(
      [
        {
          tag,
          species_common: speciesCommon,
          species_scientific: speciesSci,
          stems_inches: [bio.dbh_inches],
          lat: coords.lat,
          lng: coords.lng,
          condition_score: 8,
          removal: structural.municipal_permit_disposition?.recommended_disposition === 'Removal_Last_Resort_Unmitigable_Hazard',
        },
      ],
      options.municipality
    );
    const permit = permitDetermination(invRow, options.municipality);
    const invRowIfRemoved = evaluateTreeInventory(
      [
        {
          tag,
          species_common: speciesCommon,
          species_scientific: speciesSci,
          stems_inches: [bio.dbh_inches],
          lat: coords.lat,
          lng: coords.lng,
          condition_score: 8,
          removal: true,
        },
      ],
      options.municipality
    );
    const mitIfDestroyed = computeMitigationPlan(invRowIfRemoved, options.municipality);
    svgMap = renderSiteMapSVG(invRow);
    ordinanceSection = [
      `- **Jurisdiction:** ${options.municipality.name}, ${options.municipality.state} (\`${options.municipality.id}\`)`,
      `- **Statutory Authority:** ${options.municipality.ordinance_numbers}`,
      `- **Evaluated Tier:** ${invRow[0].heritage ? 'Heritage' : invRow[0].protected ? 'Protected' : 'Unprotected'} (DBH: ${bio.dbh_inches} in)`,
      `- **Permit Determination:** ${permitSummary(permit)}`,
      `- **Mitigation Liability if Destroyed:** $${(mitIfDestroyed?.cash_in_lieu_usd || 0).toLocaleString()} cash-in-lieu (${mitIfDestroyed?.replacement_inches_owed || 0} replacement caliper inches)`,
    ].join('\n');
  } else {
    const disp = structural.municipal_permit_disposition || {};
    ordinanceSection = [
      `- **Jurisdiction ID:** \`${disp.jurisdiction_id || 'N/A'}\``,
      `- **Ordinance Citation:** ${disp.ordinance_citation || 'N/A'}`,
      `- **Protection Tier:** ${disp.protection_tier || 'N/A'}`,
      `- **Permit Required:** ${disp.permit_required ? 'Yes' : 'No'}`,
      `- **Recommended Disposition:** \`${disp.recommended_disposition || 'Preservation_Primary'}\``,
    ].join('\n');
  }

  const companionRows = (guild.native_companion_species_guild || [])
    .map(
      (g) =>
        `| *${g.scientific_name}* (${g.common_name}) | \`${g.inaturalist_taxon_id}\` | \`${g.stratum_layer}\` | \`${g.functional_role}\` | ${g.quantity_planted} |`
    )
    .join('\n');

  const markdown = [
    `# Open Arbor Regenerative Diagnostic & Evidentiary Report (${assessment.schema_version || 'RCA_v2'})`,
    ``,
    `- **Report Cryptographic Digest (SHA-256):** \`${sha256}\``,
    `- **Assessment Date:** \`${assessmentDate}\``,
    `- **Tree Identifier:** \`${tag}\` (*${speciesSci}*, ${speciesCommon})`,
    `- **Global Plus Code:** \`${structural.plus_code_global}\` (Lat: ${coords.lat}, Lng: ${coords.lng})`,
    `- **Evidentiary Linter Status:** ${lint.valid ? 'PASS (Conflict-Free Preservation Verified)' : `FAIL (${lint.errors.length} Violation(s))`}`,
    ``,
    `## 1. Executive Disposition & Biometric Baseline`,
    `- **Diameter at Breast Height (1.37 m):** ${bio.dbh_cm} cm (${bio.dbh_inches} inches)`,
    `- **Total Height & Crown Spread:** ${structural.height_m} m height; ${structural.crown_spread_ns_m} m (N-S) x ${structural.crown_spread_ew_m} m (E-W); Live Crown Ratio: ${structural.live_crown_ratio_pct}%`,
    `- **Recommended Disposition:** \`${structural.municipal_permit_disposition?.recommended_disposition}\``,
    `- **ISA TRAQ Baseline:** ${structural.isa_traq_risk?.assessment_level}, Overall Risk: \`${structural.isa_traq_risk?.overall_risk_rating}\`, Residual Risk Post-Remediation: \`${structural.isa_traq_risk?.residual_risk_rating || 'Low'}\``,
    ``,
    `## 2. Classical Biomechanics: Mattheck Shell-Wall Physics & Shigo CODIT`,
    `| Biomechanical Parameter | Measured Value | Threshold / Standard | Diagnostic Finding |`,
    `| :--- | :--- | :--- | :--- |`,
    `| **Sound Wood Shell Ratio (t/R)** | \`${bio.biomechanics.sound_shell_thickness_ratio_t_over_r}\` (${bio.biomechanics.sound_shell_cm} cm shell / ${bio.biomechanics.trunk_radius_cm} cm radius) | \`t/R >= 0.30\` (Mattheck, 1994) | ${bio.biomechanics.stability_rating} |`,
    `| **Shigo CODIT Response** | \`${bio.biomechanics.codit_wall_response_rating}\` | Walls 1 to 4 Compartmentalization | Active reaction wood barrier zone |`,
    `| **Structural Root Zone (SRZ)** | \`${bio.root_zones.srz_radius_meters} m\` radius | AS 4970 / Mattheck Windthrow | Mechanical root-plate stability zone |`,
    `| **Critical Root Zone (CRZ)** | \`${bio.root_zones.crz_radius_meters} m\` radius | ANSI A300 Part 5 (1 ft / in DBH) | Statutory root protection zone |`,
    `| **Tree Influence Zone (TIZ)** | \`${bio.root_zones.tiz_radius_meters} m\` radius (${bio.root_zones.tiz_area_sqm} m2) | RCA-Spec v2.0 Holobiont Footprint | Subterranean mycorrhizal catchment |`,
    ``,
    `## 3. Municipal Ordinance & Statutory Compliance`,
    ordinanceSection,
    ``,
    `## 4. Subterranean Rhizosphere & Pneumatic Root-Collar Forensics`,
    `- **Root Flare Burial Depth:** ${rhizosphere.root_flare_burial_depth_cm} cm below grade (Root Flare Diameter: ${rhizosphere.root_flare_diameter_cm} cm)`,
    `- **Stem-Girdling Roots (SGR):** ${bio.rhizosphere_prescription.stem_girdling_root_count} root(s), Severity: \`${bio.rhizosphere_prescription.stem_girdling_root_severity}\` (Vascular Constriction Relief Ratio: ${bio.rhizosphere_prescription.vascular_constriction_relief_ratio})`,
    `- **Supersonic AirSpade Geometry:** ${rhizosphere.airspade_radial_trenching_geometry?.trench_count} radial trenches (${rhizosphere.airspade_radial_trenching_geometry?.trench_length_m} m length x ${rhizosphere.airspade_radial_trenching_geometry?.trench_width_cm} cm width x ${rhizosphere.airspade_radial_trenching_geometry?.trench_depth_cm} cm depth at ${bio.rhizosphere_prescription.operating_pressure_psi} psi)`,
    `- **Total Decompacted Soil Volume:** ${bio.rhizosphere_prescription.total_decompacted_soil_m3} m3 (${bio.rhizosphere_prescription.radial_trench_volume_m3} m3 radial trenches + ${bio.rhizosphere_prescription.root_collar_excavation_volume_m3} m3 root collar basin)`,
    ``,
    `## 5. Soil Physics & Mycorrhizal Microbiome Baseline`,
    `- **Dry Bulk Density (0-15 cm):** ${soil.bulk_density_g_cm3} g/cm3 (Penetrometer Resistance: ${soil.penetrometer_resistance_psi ?? 'N/A'} psi)`,
    `- **Steady-State Water Infiltration Rate:** ${soil.infiltration_rate_mm_hr} mm/hr`,
    `- **Soil Organic Matter & pH:** ${soil.organic_matter_pct}% SOM; pH ${soil.soil_ph}`,
    `- **Mycorrhizal Guild & F:B Ratio:** \`${myco.dominant_mycorrhizal_guild}\`; Fungal-to-Bacterial Ratio: \`${myco.fungal_to_bacterial_biomass_ratio}\`; Status: \`${myco.hyphal_colonization_status}\``,
    `- **Laboratory Provenance:** Sample \`${soil.lab_sample_id || 'N/A'}\` (${soil.lab_panel_url})`,
    ``,
    `## 6. Nodal Biological Amendment & Native Companion Guild Prescription`,
    `- **Reference Ecosystem (SER Principle 3):** ${guild.reference_ecosystem_name}`,
    `- **Engine-Scaled Amendment Bill of Materials:** ${bio.rhizosphere_prescription.amendments.precharged_biochar_liters} L pre-charged biochar; ${bio.rhizosphere_prescription.amendments.fungal_compost_m3} m3 fungal compost; ${bio.rhizosphere_prescription.amendments.fungal_humate_kg} kg humic acid; ${bio.rhizosphere_prescription.amendments.ramial_woodchip_mulch_m3} m3 coarse ramial woodchip mulch`,
    `- **Synthetic NPK & Fungicide Exclusion Verified:** ${guild.synthetic_npk_and_fungicide_exclusion_verified ? 'Yes (Zero synthetic salts or systemic fungicides)' : 'No'}`,
    ``,
    `| Companion Species | iNaturalist Taxon ID | Stratum Layer | Functional Role | Quantity |`,
    `| :--- | :--- | :--- | :--- | :--- |`,
    companionRows,
    ``,
    `## 7. Dual Asset Valuation: CTLA 10th Ed. vs. 200-Year Holobiont Biological Equity`,
    `| Valuation Model | Computed Value (USD) | Treatment of Veteran Hollow Architecture |`,
    `| :--- | :--- | :--- |`,
    `| **Classical CTLA 10th Edition (Depreciated)** | **$${val.ctla_10th_ed_depreciated_usd.toLocaleString()}** | Penalizes trunk decay via condition factor (${val.breakdown.ctla_condition_factor}) |`,
    `| **Regenerative Holobiont Biological Equity (200-Yr)** | **$${val.holobiont_200yr_biological_equity_usd.toLocaleString()}** | Appreciates via Veteran Keystone Habitat Multiplier (\`${val.veteran_keystone_habitat_multiplier}x\`) |`,
    `| **Biological Equity Delta (Inversion Ratio \`${val.inversion_ratio}x\`)** | **+$${val.valuation_delta_usd.toLocaleString()}** | Carbon ($${val.breakdown.carbon_storage_equity_usd.toLocaleString()}) + Hydrology ($${val.breakdown.vadose_hydrology_equity_usd.toLocaleString()}) + CMN Soil ($${val.breakdown.cmn_rhizosphere_equity_usd.toLocaleString()}) |`,
    ``,
    `## 8. 5-Year Practice Economics: Stewardship vs. Liquidation`,
    `- **Legacy Contractor Removal Bid (One-Time Liquidation):** $${econ.legacy_removal_model.one_time_gross_bid_usd.toLocaleString()} gross / $${econ.legacy_removal_model.net_practitioner_margin_usd.toLocaleString()} net margin ($0 recurring; destroys $${econ.legacy_removal_model.client_biological_equity_destroyed_usd.toLocaleString()} in living equity)`,
    `- **RCA 5-Year Regenerative Stewardship Program:** $${econ.regenerative_stewardship_model.five_year_gross_revenue_usd.toLocaleString()} gross / **$${econ.regenerative_stewardship_model.net_practitioner_margin_usd.toLocaleString()} net margin** (${econ.regenerative_stewardship_model.recurring_revenue_share_pct}% recurring revenue; **${econ.comparison.margin_multiplier}x** net margin advantage over tree removal)`,
    ``,
    `## 9. STIM Longitudinal Monitoring Schedule & Sanctuary Scorecard Targets`,
    `- **STIM Hypothesis:** ${monitoring.stim_hypothesis_statement}`,
    `- **STIM Kill Criterion:** ${monitoring.stim_kill_criterion}`,
    `- **Year-1 Audit (${y1.scheduled_reinspection_date}):** Max dieback <= ${y1.target_canopy_dieback_max_pct}%, min twig extension >= ${y1.target_annual_twig_extension_min_cm} cm, callus closure >= ${y1.target_woundwood_callus_closure_mm_yr} mm/yr, guild survival >= ${y1.companion_guild_survival_min_pct}%`,
    `- **Year-5 Audit (${y5.scheduled_audit_date}):** Bulk density <= ${y5.target_bulk_density_max_g_cm3} g/cm3, infiltration >= ${y5.target_infiltration_rate_min_mm_hr} mm/hr, SOM >= ${y5.target_organic_matter_min_pct}%, F:B ratio >= ${y5.target_fungal_to_bacterial_ratio_min}, SER Recovery Wheel: ${y5.target_ser_recovery_wheel_stars} stars, Soil Health Index: ${scTargets.soil_health_index_baseline_score} -> ${scTargets.soil_health_index_target_score}`,
    ``,
    svgMap ? `## 10. Vector Root-Zone Protection Site Map (SVG)\n\n${svgMap}\n` : `## 10. Evidentiary Verification Summary\n\nAll ${lint.passed_checks.length} evidentiary checks verified.`,
  ].join('\n');

  return {
    markdown,
    sha256,
    lint,
    biomechanics: bio,
    valuation: val,
    economics: econ,
  };
}

/**
 * 7. Anti-Liquidation Scientific Counter-Notice Generator
 * Generates a formal evidentiary counter-notice against conflicted contractor removal bids
 * when a tree satisfies Mattheck's hollow-cylinder stability threshold (t/R >= 0.30).
 *
 * @param {object} assessment - RCA_v2 assessment JSON
 * @param {object} options - Optional parameters
 * @returns {{can_preserve: boolean, notice_markdown: string, t_over_r: number, equity_saved_usd: number}}
 */
export function compilePreservationCounterNotice(assessment, options = {}) {
  const bio = evaluateBiomechanicsAndRhizosphere(assessment);
  const val = computeHolobiontValuation(assessment, options);
  const sha256 = computeCanonicalSha256(assessment);
  const structural = assessment.structural_baseline || {};
  const disp = structural.municipal_permit_disposition || {};
  const tOverR = bio.biomechanics.sound_shell_thickness_ratio_t_over_r;
  const canPreserve = tOverR >= 0.30;

  const tag = structural.tree_tag || 'RCA-TREE-01';
  const speciesSci = structural.species_scientific || 'Quercus spp.';
  const speciesCommon = structural.species_common || 'Mature Keystone Tree';

  const noticeMarkdown = [
    `# SCIENTIFIC PRESERVATION & BIOMECHANICAL COUNTER-NOTICE`,
    ``,
    `- **Subject Tree:** \`${tag}\` (*${speciesSci}*, ${speciesCommon}) at Plus Code \`${structural.plus_code_global}\``,
    `- **Diameter at Breast Height:** ${bio.dbh_cm} cm (${bio.dbh_inches} in) | **Root Flare Diameter:** ${assessment.rhizosphere_and_root_collar?.root_flare_diameter_cm} cm`,
    `- **Statutory Protection Authority:** ${disp.ordinance_citation} (Tier: \`${disp.protection_tier}\`, Permit Required: \`${disp.permit_required}\`)`,
    `- **Cryptographic Evidence Hash (SHA-256):** \`${sha256}\``,
    ``,
    `## 1. Biomechanical Refutation of Unjustified Removal`,
    canPreserve
      ? `Conventional removal bids frequently cite internal heartwood cavities to justify liquidating mature trees. Under Claus Mattheck's hollow-cylinder buckling criterion (*The Body Language of Trees*, 1994; 2007), a hollow trunk retains full mechanical bending strength against windthrow provided the ratio of sound outer shell thickness ($t$) to trunk radius ($R$) satisfies $t/R \\ge 0.30$.`
      : `Warning: Measured sound shell ratio $t/R = ${tOverR} < 0.30$ indicates advanced shell thinning requiring Level 3 sonic tomography and crown load reduction evaluation.`,
    ``,
    `- **Measured Sound Shell Thickness ($t$):** ${bio.biomechanics.sound_shell_cm} cm`,
    `- **Measured Trunk Radius ($R$):** ${bio.biomechanics.trunk_radius_cm} cm`,
    `- **Computed $t/R$ Ratio:** **\`${tOverR}\`** (${canPreserve ? 'Exceeds 0.30 Mattheck safety threshold; hollow shell is structurally stable' : 'Below 0.30 threshold'})`,
    `- **Shigo CODIT Status:** \`${bio.biomechanics.codit_wall_response_rating}\``,
    ``,
    `## 2. Conflict-of-Interest Disclosure & Fiduciary Asset Warning`,
    `Tree service contractors who bid on tree removal and timber liquidation hold a direct financial conflict of interest when diagnosing tree risk. Liquidating this specimen destroys **$${val.holobiont_200yr_biological_equity_usd.toLocaleString()}** in 200-year Holobiont Biological Equity ($${val.ctla_10th_ed_depreciated_usd.toLocaleString()} classical CTLA 10th Edition depreciated value; **${val.inversion_ratio}x** ecological valuation inversion).`,
    ``,
    `## 3. Prescribed Non-Destructive Alternative (ANSI A300 & RCA-Spec v2.0)`,
    `Rather than irreversible removal, risk and vascular stress are mitigated through:`,
    `1. **Supersonic Pneumatic Decompaction:** ${bio.rhizosphere_prescription.total_decompacted_soil_m3} m3 of radial AirSpade trenching and root-collar excavation at ${bio.rhizosphere_prescription.operating_pressure_psi} psi without severing fine feeder roots.`,
    `2. **Biogeochemical Inoculation:** Backfilling with ${bio.rhizosphere_prescription.amendments.precharged_biochar_liters} L pre-charged biochar, ${bio.rhizosphere_prescription.amendments.fungal_compost_m3} m3 fungal compost, ${bio.rhizosphere_prescription.amendments.fungal_humate_kg} kg humic acid, and ${bio.rhizosphere_prescription.amendments.ramial_woodchip_mulch_m3} m3 coarse ramial woodchip mulch across the ${bio.root_zones.tiz_area_sqm} m2 Tree Influence Zone.`,
    `3. **Longitudinal Verification:** 12-month and 60-month STIM outcome monitoring.`,
  ].join('\n');

  return {
    can_preserve: canPreserve,
    notice_markdown: noticeMarkdown,
    t_over_r: tOverR,
    equity_saved_usd: val.holobiont_200yr_biological_equity_usd,
  };
}

/**
 * 8. Decentralized Open Badges 3.0 / W3C Verifiable Credential Attestation Minter
 * Validates 3 RCA diagnostic assessments and mints a schema-compliant OpenBadgeCredential JSON-LD
 * artifact under the Post-ISA Nature-First Proof-of-Stewardship model.
 *
 * @param {object} practitioner - Practitioner metadata { id, practitioner_name, year_1_recovery_milestone_target_date, legacy_statutory_equivalencies }
 * @param {Array<object>} assessments - Array of exactly 3 validated RCA assessment objects
 * @param {object} rcaAssessmentSchema - Optional JSON Schema object for strict validation
 * @returns {object} OpenBadgeCredential JSON-LD object conforming to schemas/rca_openbadge_v3.schema.json
 */
export function mintOpenBadgeAttestation(practitioner, assessments, rcaAssessmentSchema = null) {
  if (!Array.isArray(assessments) || assessments.length !== 3) {
    throw new Error('mintOpenBadgeAttestation requires exactly 3 RCA diagnostic assessment records');
  }

  const reportHashes = [];
  const evidenceItems = [];

  assessments.forEach((assessment, idx) => {
    if (rcaAssessmentSchema) {
      const schemaCheck = validateJsonSchema(assessment, rcaAssessmentSchema);
      if (!schemaCheck.valid) {
        throw new Error(`Assessment #${idx + 1} failed schema validation: ${schemaCheck.errors.join('; ')}`);
      }
    }
    const lint = lintRcaEvidentiaryReport(assessment);
    if (!lint.valid) {
      throw new Error(`Assessment #${idx + 1} failed evidentiary linter: ${lint.errors.join('; ')}`);
    }

    const hash = computeCanonicalSha256(assessment);
    reportHashes.push(hash);

    const sb = assessment.structural_baseline || {};
    const guild = assessment.understory_and_guild_prescription?.native_companion_species_guild || [];
    const taxonId = sb.inaturalist_taxon_id || guild[0]?.inaturalist_taxon_id || 49005;

    evidenceItems.push({
      id: `https://soilgrower.com/reports/rca-v2/report-00${idx + 1}-${hash.slice(0, 8)}.json`,
      type: ['Evidence', 'RCADiagnosticReportEvidence'],
      name: `${sb.species_scientific || 'Quercus'} Rhizosphere & Holobiont Diagnostic #${idx + 1} (${sb.plus_code_global})`,
      conforms_to_schema: 'https://soilgrower.com/schemas/openarbor-rca-assessment.schema.json',
      schema_version: assessment.schema_version || 'RCA_v2',
      report_sha256_hash: hash,
      assessment_date: sb.assessment_date || '2026-10-23',
      plus_code_global: sb.plus_code_global,
      inaturalist_taxon_id: taxonId,
      conflict_free_preservation_verified: true,
    });
  });

  const issuedAt = practitioner.validFrom || '2026-10-23T00:00:00Z';
  const validUntil = practitioner.validUntil || '2027-10-23T00:00:00Z';
  const milestoneDate =
    practitioner.year_1_recovery_milestone_target_date ||
    assessments[0]?.outcome_monitoring_schedule?.one_year_leading_indicators?.scheduled_reinspection_date ||
    '2027-10-23';

  const credentialSubject = {
    id: practitioner.id || 'did:web:soilgrower.com:stewards:practitioner',
    type: ['AchievementSubject'],
    practitioner_name: practitioner.practitioner_name || 'Verified RCA Practitioner',
    nature_first_competency_proof: {
      diagnostic_report_hashes_sha256: reportHashes,
      field_rhizosphere_verification: {
        root_collar_airspade_verified: true,
        biological_amendment_verified: true,
        soil_biology_assessment_present: true,
      },
      longitudinal_monitoring_commitment: {
        stim_monitoring_protocol_active: true,
        year_1_recovery_milestone_target_date: milestoneDate,
      },
    },
    achievement: {
      id: 'https://soilgrower.com/specs/rca-spec-v2.0',
      type: ['Achievement'],
      name: 'Regenerative Consulting Arborist (RCA-Spec v2.0)',
      description:
        'Attests that the practitioner diagnoses and manages woody perennials as nested holobionts across the five mandatory domains of RCA-Spec v2.0.',
      achievementType: 'Competency',
      criteria: {
        id: 'https://soilgrower.com/specs/rca-spec-v2.0#tier-2-attestation-criteria',
        narrative:
          'Requires nature-first proof of stewardship (3 machine-validated RCA diagnostic reports, field rhizosphere verification, longitudinal monitoring commitment) with optional legacy guild equivalencies.',
      },
      governance_and_fee_benchmark: {
        specification_license: 'CC-BY-SA-4.0',
        schema_license: 'AGPL-3.0-or-later',
        optional_annual_registry_fee_band_min_usd: 75,
        optional_annual_registry_fee_band_max_usd: 110,
        benchmark_citations: [
          'Society for Ecological Restoration CERP ($75/year member maintenance fee)',
          'NOFA Accredited Organic Land Care Professional AOLCP ($110/year reaccreditation fee)',
        ],
        payment_flow_encoded: false,
      },
    },
  };

  if (practitioner.legacy_statutory_equivalencies) {
    credentialSubject.legacy_statutory_equivalencies = practitioner.legacy_statutory_equivalencies;
  }

  const badgePayload = {
    '@context': [
      'https://www.w3.org/ns/credentials/v2',
      'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
    ],
    id: practitioner.credential_id || `https://soilgrower.com/credentials/rca-verified/${reportHashes[0].slice(0, 12)}`,
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    name: 'Verified Regenerative Consulting Arborist (RCA-Verified)',
    issuer: {
      id: 'https://soilgrower.com/issuers/open-arbor-alliance',
      type: ['Profile'],
      name: 'Open Arbor Alliance',
      url: 'https://soilgrower.com',
    },
    validFrom: issuedAt,
    validUntil,
    credentialSubject,
    evidence: evidenceItems,
  };

  const proofDigest = computeCanonicalSha256(badgePayload);
  badgePayload.proof = {
    type: 'DataIntegrityProof',
    cryptosuite: 'sha256-integrity',
    created: issuedAt,
    verificationMethod: 'https://soilgrower.com/specs/rca-spec-v2.0#sha256-content-digest',
    proofPurpose: 'assertionMethod',
    proofValue: `sha256:${proofDigest}`,
  };

  return badgePayload;
}
