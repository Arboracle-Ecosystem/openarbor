/**
 * OpenArbor Deterministic Verification Suite (Node.js native test runner)
 * Verifies CRZ, TPZ, SRZ, Multi-Stem DBH, Union Root Zone Area,
 * Municipal Ordinance Mitigation & Ascending Exemption Engine,
 * Ecosystem Benefits, and OGC GeoJSON Export.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
} from '../src/core/ordinanceEngine.js';

import {
  estimateTreeAge,
  calculateTreeEcosystemBenefits,
  toGeoJSONFeatureCollection,
} from '../src/core/ecosystemBenefits.js';

import {
  evaluateBiomechanicsAndRhizosphere,
  computeHolobiontValuation,
  computeSanctuaryScorecardRollup,
  lintRcaEvidentiaryReport,
  decodePlusCode,
} from '../src/core/rcaEngine.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ordinancesRaw = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/ordinances/central_texas_ordinances.json'), 'utf8')
);
const rogueValleyOrdinancesRaw = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/ordinances/rogue_valley_oregon_ordinances.json'), 'utf8')
);
const rcaAssessmentSchema = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../schemas/rca_assessment.schema.json'), 'utf8')
);
const rcaOpenBadgeSchema = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../schemas/rca_openbadge_v3.schema.json'), 'utf8')
);

console.log('=== OpenArbor v2.0 Open-Standards Verification Suite ===\n');

// 1. Test CRZ / TPZ / SRZ & Multi-Stem Math
{
  const crz24 = calculateCRZ(24, 1.0, 10);
  assert.equal(crz24.radius_feet, 24);
  assert.equal(crz24.half_radius_feet, 12);
  assert.equal(Math.round(crz24.area_sqft), 1810);

  const tpzAus = calculateTPZ(30, 'inches', 'Australian_AS4970');
  assert.equal(tpzAus.radius_meters, 9.14);

  const srz = calculateSRZ(28);
  assert.ok(srz.radius_feet > 8 && srz.radius_feet < 12);

  // Multi-stem: [20, 12, 10] -> largest_plus_half = 20 + 6 + 5 = 31.0 in
  assert.equal(calculateMultiStemDBH([12, 20, 10], 'largest_plus_half'), 31.0);
  // Quadratic: sqrt(400 + 144 + 100) = sqrt(644) = 25.4 in
  assert.equal(calculateMultiStemDBH([12, 20, 10], 'quadratic'), 25.4);
  console.log('[PASS] 1. Root Zone (CRZ / TPZ / SRZ) & Multi-Stem DBH Equations');
}

// 2. Test Liberty Hill Ordinance Evaluation & Ascending Exemption Walk
{
  const libertyHill = ordinancesRaw.municipalities.find((m) => m.id === 'tx-liberty-hill');
  assert.ok(libertyHill, 'Liberty Hill ordinance must exist');

  const sampleStand = [
    {
      tag: 'T-101',
      species_common: 'Live Oak',
      species_scientific: 'Quercus virginiana',
      stems_inches: [26],
      lat: 30.6653,
      lng: -97.9250,
      condition_score: 8,
      removal: false,
      pruning_date: '2026-04-15', // April is outside Oct-Jan window -> must flag Oak Wilt warning!
    },
    {
      tag: 'T-102',
      species_common: 'Cedar Elm',
      species_scientific: 'Ulmus crassifolia',
      stems_inches: [9],
      lat: 30.6654,
      lng: -97.9251,
      condition_score: 7,
      removal: true, // 9 in removed protected tree -> fits under 20% cap (50 * 0.20 = 10.0 in)
    },
    {
      tag: 'T-103',
      species_common: 'Post Oak',
      species_scientific: 'Quercus stellata',
      stems_inches: [15],
      lat: 30.6655,
      lng: -97.9252,
      condition_score: 6,
      removal: true, // 15 in removed protected tree -> exceeds remaining 1.0 in cap, owed!
    },
    {
      tag: 'T-104',
      species_common: 'Hackberry',
      species_scientific: 'Celtis occidentalis',
      stems_inches: [18],
      lat: 30.6656,
      lng: -97.9253,
      condition_score: 5,
      removal: true, // Excepted species -> never protected, $0 mitigation
    },
  ];

  const rows = evaluateTreeInventory(sampleStand, libertyHill);
  assert.equal(rows.length, 4);

  // T-101 is Heritage Live Oak (26 in >= 24 in) and has Oak Wilt seasonal pruning flag
  assert.equal(rows[0].protected, true);
  assert.equal(rows[0].heritage, true);
  assert.ok(rows[0].flags.some((f) => f.includes('outside permitted seasonal window')));

  // T-104 Hackberry is excepted
  assert.equal(rows[3].excepted, true);
  assert.equal(rows[3].protected, false);

  // Mitigation plan: Total protected inches = 26 + 9 + 15 = 50 in.
  // 20% exemption cap = 10.0 in.
  // T-102 (9 in) fits under 10.0 in cap -> Exempt!
  // T-103 (15 in) exceeds remaining 1.0 in cap -> Owed (15 in * $150/in = $2,250).
  const mit = computeMitigationPlan(rows, libertyHill);
  assert.equal(mit.protected_total_inches, 50);
  assert.equal(mit.exemption_cap_inches, 10);
  assert.equal(mit.lines[0].tag, 'T-102');
  assert.equal(mit.lines[0].exempt, true);
  assert.equal(mit.lines[1].tag, 'T-103');
  assert.equal(mit.lines[1].exempt, false);
  assert.equal(mit.cash_in_lieu_usd, 2250);

  // Root-zone remediation estimate for retained trees (T-101)
  const remediation = estimateRootZoneRemediation(rows);
  assert.equal(remediation.retained_tree_count, 1);
  assert.ok(remediation.union_crz_area_sqft > 2000);

  // Permit determination & summary
  const permit = permitDetermination(rows, libertyHill);
  assert.equal(permit.required, true);
  assert.equal(permit.removalRequired, true);
  assert.ok(permitSummary(permit).includes('Permit required'));

  // Site context & SVG site map
  const siteCtx = evaluateSiteContext(rows, libertyHill, {
    survey_date: '2026-09-01',
    site_use: 'single_family',
    jurisdiction_context: 'city_limits',
  });
  assert.equal(siteCtx.surveyWarn, null);
  assert.equal(siteCtx.surveyTrees.length, 4);

  const svg = renderSiteMapSVG(rows);
  assert.ok(svg.includes('<svg') && svg.includes('20 ft') && svg.includes('T-101'));
  console.log('[PASS] 2. Municipal Ordinance Engine, Oak Wilt Flagging, Site Context, SVG Map & Ascending Exemption Math');
}

// 3. Test Allometric Ecosystem Benefits, Veteran Tree Age & GeoJSON Exporter
{
  const age = estimateTreeAge({
    dbh_inches: 32,
    base_growth_factor: 4.5,
    site_condition: 'Forest / Woodland',
  });
  assert.ok(age.estimated_age_years > 400);

  const benefits = calculateTreeEcosystemBenefits({
    species_name: 'Quercus virginiana',
    common_name: 'Southern Live Oak',
    dbh_inches: 28,
    condition_class: 'Good',
  });
  assert.ok(benefits.carbon_storage_lbs > 2500);
  assert.ok(benefits.avoided_runoff_gallons_yr > 400);
  assert.ok(benefits.structural_value_usd > 15000);

  const libertyHill = ordinancesRaw.municipalities.find((m) => m.id === 'tx-liberty-hill');
  const rows = evaluateTreeInventory(
    [{ tag: 'T-01', species_common: 'Live Oak', stems_inches: [24], lat: 30.6333, lng: -97.678 }],
    libertyHill
  );
  const geojson = toGeoJSONFeatureCollection(rows, { project: 'San Gabriel Test Stand' });
  assert.equal(geojson.type, 'FeatureCollection');
  assert.equal(geojson.features.length, 1);
  assert.equal(geojson.features[0].geometry.coordinates[0], -97.678);
  console.log('[PASS] 3. Allometric Ecosystem Benefits (Nowak/McPherson), John White Age & GeoJSON Exporter');
}

// 4. Test RCA Biomechanics, Mattheck t/R Stability & Rhizosphere Prescription
{
  const assessment = {
    schema_version: 'RCA_v2',
    assessment_mode: 'Regenerative Diagnostic',
    structural_baseline: {
      dbh_cm: 80,
      sound_shell_thickness_ratio_t_over_r: 0.35, // t/R >= 0.30 -> Mattheck criterion satisfied!
      codit_wall_response_rating: 'Wall_4_Active_Barrier_Zone',
      crown_spread_ns_m: 14,
      crown_spread_ew_m: 16,
      plus_code_global: '8624M38F+4X',
    },
    rhizosphere_and_root_collar: {
      root_flare_diameter_cm: 110,
      root_flare_burial_depth_cm: 18,
      stem_girdling_root_count: 2,
      stem_girdling_root_severity: 'Moderate',
      tiz_radius_m: 12.5,
      airspade_radial_trenching_geometry: {
        execution_status: 'Prescribed',
        operating_pressure_psi: 150,
        trench_count: 8,
        trench_length_m: 7.0,
        trench_width_cm: 30,
        trench_depth_cm: 35,
        root_collar_excavation_radius_m: 0.75,
      },
    },
  };

  const bio = evaluateBiomechanicsAndRhizosphere(assessment);
  assert.equal(bio.biomechanics.mattheck_criterion_satisfied, true);
  assert.equal(bio.biomechanics.is_structurally_sound, true);
  assert.ok(bio.biomechanics.stability_rating.includes('Mattheck Criterion Satisfied'));
  assert.equal(bio.biomechanics.sound_shell_cm, 14.0); // 0.35 * 40 cm radius = 14 cm
  assert.ok(bio.root_zones.srz_radius_meters > 2.5);
  assert.ok(bio.root_zones.crz_radius_meters > 8.0);
  assert.ok(bio.rhizosphere_prescription.total_decompacted_soil_m3 > 5.0);
  assert.ok(bio.rhizosphere_prescription.amendments.precharged_biochar_liters > 400);
  assert.equal(bio.rhizosphere_prescription.vascular_constriction_relief_ratio, 0.35);

  // Negative test: severely thinned shell (t/R = 0.18 < 0.30)
  const thinned = {
    ...assessment,
    structural_baseline: {
      ...assessment.structural_baseline,
      sound_shell_thickness_ratio_t_over_r: 0.18,
    },
  };
  const thinnedResult = evaluateBiomechanicsAndRhizosphere(thinned);
  assert.equal(thinnedResult.biomechanics.mattheck_criterion_satisfied, false);
  assert.equal(thinnedResult.biomechanics.is_structurally_sound, false);
  assert.ok(thinnedResult.biomechanics.stability_rating.includes('Elevated Buckling Risk'));

  console.log('[PASS] 4. RCA Biomechanics, Mattheck t/R Stability & Rhizosphere Prescription');
}

// 5. Test CTLA 10th Ed vs. Holobiont Biological Equity Inversion (Veteran Oak)
{
  // Ancient hollow Oregon White Oak (Quercus garryana), DBH 105 cm (41.3 in)
  const veteranOak = {
    structural_baseline: {
      dbh_cm: 105,
      sound_shell_thickness_ratio_t_over_r: 0.28, // Hollow heartwood, CTLA depreciates heavily
      crown_spread_ns_m: 18,
      crown_spread_ew_m: 20,
    },
    rhizosphere_and_root_collar: {
      tiz_radius_m: 16.0,
    },
  };

  const val = computeHolobiontValuation(veteranOak, {
    unit_cost_sq_in: 75.0,
    ctla_location_factor: 0.85,
  });

  // Classical CTLA heavily depreciates this ancient oak due to decayed heartwood
  assert.ok(val.ctla_10th_ed_depreciated_usd > 0);
  // Regenerative Holobiont recognizes 200-year carbon, hydrology, CMN, and 3.5x veteran keystone habitat multiplier
  assert.equal(val.veteran_keystone_habitat_multiplier, 3.5);
  assert.ok(val.holobiont_200yr_biological_equity_usd > val.ctla_10th_ed_depreciated_usd);
  assert.ok(val.valuation_delta_usd > 0);
  assert.ok(val.inversion_ratio >= 1.5, `Inversion ratio was ${val.inversion_ratio}`);

  console.log('[PASS] 5. CTLA 10th Ed vs. Holobiont Biological Equity Inversion (Veteran Oak)');
}

// 6. Test Sanctuary Scorecard Rollup & Spatial Union De-duplication
{
  const standAssessments = [
    {
      structural_baseline: {
        dbh_cm: 75,
        plus_code_global: '8624M38F+4X', // Decodes to lat 30.665, lng -97.925 (Liberty Hill)
        crown_spread_ns_m: 14,
        crown_spread_ew_m: 14,
        live_crown_ratio_pct: 75,
        inaturalist_taxon_id: 49005, // Quercus virginiana
      },
      rhizosphere_and_root_collar: {
        tiz_radius_m: 14,
      },
      soil_and_microbiome_baseline: {
        bulk_density_g_cm3: 1.25,
        organic_matter_pct: 4.8,
        infiltration_rate_mm_hr: 45,
        fungal_to_bacterial_biomass_ratio: 0.85,
        dominant_fungal_taxa_inaturalist_ids: [48701, 58682],
      },
      understory_and_guild_prescription: {
        native_companion_species_guild: [
          { inaturalist_taxon_id: 51712, common_name: 'Inland Sea Oats', quantity_planted: 24 },
          { inaturalist_taxon_id: 54784, common_name: 'Turk\'s Cap', quantity_planted: 12 },
        ],
      },
      outcome_monitoring_schedule: {
        sanctuary_scorecard_targets: {
          restoration_potential_realized_pct: 82,
        },
      },
    },
    {
      // Second tree nearby with overlapping root zone
      structural_baseline: {
        dbh_cm: 60,
        plus_code_global: '8624M38F+4X', // Same location/adjacent
        crown_spread_ns_m: 11,
        crown_spread_ew_m: 12,
        live_crown_ratio_pct: 70,
        inaturalist_taxon_id: 54781, // Quercus stellata
      },
      rhizosphere_and_root_collar: {
        tiz_radius_m: 12,
      },
      soil_and_microbiome_baseline: {
        bulk_density_g_cm3: 1.30,
        organic_matter_pct: 4.2,
        infiltration_rate_mm_hr: 38,
        fungal_to_bacterial_biomass_ratio: 0.70,
        dominant_fungal_taxa_inaturalist_ids: [48701],
      },
      understory_and_guild_prescription: {
        native_companion_species_guild: [
          { inaturalist_taxon_id: 51712, common_name: 'Inland Sea Oats', quantity_planted: 18 },
          { inaturalist_taxon_id: 82650, common_name: 'Texas Lantana', quantity_planted: 10 },
        ],
      },
      outcome_monitoring_schedule: {
        sanctuary_scorecard_targets: {
          restoration_potential_realized_pct: 78,
        },
      },
    },
  ];

  const rollup = computeSanctuaryScorecardRollup(standAssessments, 4047);
  assert.equal(rollup.total_assessed_trees, 2);
  assert.ok(rollup.spatial_coverage.union_tiz_area_sqm > 0);
  assert.ok(rollup.spatial_coverage.overlap_deduplicated_sqm > 0); // Proves spatial de-duplication occurred!

  const sc = rollup.sanctuary_scorecard;
  assert.ok(sc.soil_health_index >= 0 && sc.soil_health_index <= 100);
  assert.ok(sc.canopy_coverage_index >= 0 && sc.canopy_coverage_index <= 100);
  assert.ok(sc.water_dynamics_index >= 0 && sc.water_dynamics_index <= 100);
  assert.ok(sc.biodiversity_baseline_index >= 0 && sc.biodiversity_baseline_index <= 100);
  assert.ok(sc.restoration_potential_score >= 0 && sc.restoration_potential_score <= 100);
  assert.ok(sc.composite_sanctuary_score >= 0 && sc.composite_sanctuary_score <= 100);
  assert.ok(rollup.ecological_equity.total_valuation_delta_usd > 0);

  console.log('[PASS] 6. Sanctuary Scorecard Parcel Rollup & Spatial Union De-duplication');
}

// 7. Test ASCA Evidentiary Linter Blocking Lazy Removal & Schema Conformance
{
  // Test A: Bad assessment recommending removal of a tree with sound shell (t/R = 0.38 >= 0.30)
  // without advanced resistograph/tomography proof
  const badRemovalAssessment = {
    structural_baseline: {
      dbh_cm: 85,
      sound_shell_thickness_ratio_t_over_r: 0.38, // Sound shell under Mattheck!
      plus_code_global: '8624M38F+4X',
      municipal_permit_disposition: {
        recommended_disposition: 'Removal_Last_Resort_Unmitigable_Hazard',
        seasonal_oak_wilt_restriction_active: false,
      },
    },
    rhizosphere_and_root_collar: {
      airspade_radial_trenching_geometry: {
        execution_status: 'Prescribed',
      },
    },
    soil_and_microbiome_baseline: {
      bulk_density_g_cm3: 1.28,
      organic_matter_pct: 4.5,
      infiltration_rate_mm_hr: 40,
    },
    understory_and_guild_prescription: {},
    outcome_monitoring_schedule: {},
  };

  const lintResult = lintRcaEvidentiaryReport(badRemovalAssessment);
  assert.equal(lintResult.valid, false);
  assert.ok(lintResult.errors.some((e) => e.includes('UNJUSTIFIED_REMOVAL')));
  assert.ok(lintResult.errors.some((e) => e.includes('EVIDENTIARY_DEFECT')));

  // Test B: Compliant preservation assessment
  const goodAssessment = {
    structural_baseline: {
      dbh_cm: 85,
      sound_shell_thickness_ratio_t_over_r: 0.38,
      plus_code_global: '8624M38F+4X',
      municipal_permit_disposition: {
        recommended_disposition: 'Preservation_With_Rhizosphere_Remediation',
        seasonal_oak_wilt_restriction_active: false,
      },
    },
    rhizosphere_and_root_collar: {
      airspade_radial_trenching_geometry: {
        execution_status: 'Prescribed',
      },
    },
    soil_and_microbiome_baseline: {
      bulk_density_g_cm3: 1.28,
      organic_matter_pct: 4.5,
      infiltration_rate_mm_hr: 40,
    },
    understory_and_guild_prescription: {},
    outcome_monitoring_schedule: {},
  };
  const goodResult = lintRcaEvidentiaryReport(goodAssessment);
  assert.equal(goodResult.valid, true);

  // Test C: Schema checks (rca_assessment & rca_openbadge_v3)
  assert.ok(rcaAssessmentSchema.properties.schema_version.enum.includes('RCA_v2'));
  assert.ok(rcaAssessmentSchema.properties.structural_baseline.properties.sound_shell_thickness_ratio_t_over_r);
  assert.ok(rcaAssessmentSchema.properties.structural_baseline.properties.dual_valuation);
  assert.ok(rcaOpenBadgeSchema.properties.credentialSubject.required.includes('nature_first_competency_proof'));
  assert.ok(rcaOpenBadgeSchema.properties.credentialSubject.properties.legacy_statutory_equivalencies);

  console.log('[PASS] 7. ASCA Evidentiary Linter Blocking Lazy Removal & Schema Conformance');
}

// 8. Test Rogue Valley Oregon Bioregional Municipal Ordinances
{
  const ashland = rogueValleyOrdinancesRaw.municipalities.find((m) => m.id === 'or-ashland');
  const medford = rogueValleyOrdinancesRaw.municipalities.find((m) => m.id === 'or-medford');
  const grantsPass = rogueValleyOrdinancesRaw.municipalities.find((m) => m.id === 'or-grants-pass');

  assert.ok(ashland, 'Ashland municipality must exist');
  assert.ok(medford, 'Medford municipality must exist');
  assert.ok(grantsPass, 'Grants Pass municipality must exist');

  // Ashland: 19-in DBH Douglas-fir on vacant residential site (threshold 18 in) -> Protected & Heritage
  const ashlandTrees = [
    {
      tag: 'ASH-01',
      species_common: 'Douglas-fir',
      species_scientific: 'Pseudotsuga menziesii',
      stems_inches: [19],
      lat: 42.1946,
      lng: -122.7095,
      condition_score: 8,
      removal: true,
    },
    {
      tag: 'ASH-02',
      species_common: 'Vine Maple',
      species_scientific: 'Acer circinatum',
      stems_inches: [4],
      lat: 42.1947,
      lng: -122.7096,
      condition_score: 7,
      removal: false,
    },
  ];
  const ashlandEval = evaluateTreeInventory(ashlandTrees, ashland);
  assert.equal(ashlandEval[0].protected, true);
  assert.equal(ashlandEval[0].heritage, true);
  assert.equal(ashlandEval[1].protected, false); // < 6 in threshold

  const ashlandPermit = permitDetermination(ashlandEval, ashland);
  assert.equal(ashlandPermit.required, true);
  assert.equal(ashlandPermit.removalRequired, true);
  assert.ok(ashlandPermit.citation.includes('AMC'));

  // Medford: Commercial development regulated at 8 in DBH threshold (heritage at 24 in)
  const medfordCommercialTree = [
    {
      tag: 'MED-01',
      species_common: 'Oregon White Oak',
      species_scientific: 'Quercus garryana',
      stems_inches: [12],
      lat: 42.3265,
      lng: -122.8756,
      condition_score: 8,
      removal: true,
    },
    {
      tag: 'MED-02',
      species_common: 'Oregon White Oak',
      species_scientific: 'Quercus garryana',
      stems_inches: [28],
      lat: 42.3266,
      lng: -122.8757,
      condition_score: 8,
      removal: false,
    },
  ];
  const medfordEval = evaluateTreeInventory(medfordCommercialTree, medford);
  assert.equal(medfordEval[0].protected, true);
  assert.equal(medfordEval[0].heritage, false);
  assert.equal(medfordEval[1].protected, true);
  assert.equal(medfordEval[1].heritage, true);

  // Grants Pass: Regulated at 8 in DBH threshold (heritage at 20 in)
  const gpTrees = [
    {
      tag: 'GP-01',
      species_common: 'Ponderosa Pine',
      species_scientific: 'Pinus ponderosa',
      stems_inches: [14],
      lat: 42.4390,
      lng: -123.3284,
      condition_score: 8,
      removal: true,
    },
    {
      tag: 'GP-02',
      species_common: 'Ponderosa Pine',
      species_scientific: 'Pinus ponderosa',
      stems_inches: [22],
      lat: 42.4391,
      lng: -123.3285,
      condition_score: 8,
      removal: false,
    },
  ];
  const gpEval = evaluateTreeInventory(gpTrees, grantsPass);
  assert.equal(gpEval[0].protected, true);
  assert.equal(gpEval[0].heritage, false);
  assert.equal(gpEval[1].protected, true);
  assert.equal(gpEval[1].heritage, true);

  console.log('[PASS] 8. Rogue Valley Oregon Bioregional Municipal Ordinances (Ashland, Medford, Grants Pass)');
}

console.log('\nALL OPENARBOR CORE VERIFICATION CHECKS PASSED (0 proprietary dependencies).');
