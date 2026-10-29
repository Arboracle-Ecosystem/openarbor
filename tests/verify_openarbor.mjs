/**
 * OpenArbor Deterministic Verification Suite (Node.js native test runner)
 * Verifies CRZ, TPZ, SRZ, Multi-Stem DBH, Union Root Zone Area,
 * Municipal Ordinance Mitigation & Ascending Exemption Engine,
 * Ecosystem Benefits, OGC GeoJSON Export, RCA-Spec v2.0 Biomechanics,
 * Dual Valuation, Sanctuary Rollup, Strict Schema Validation,
 * Rogue Valley Oregon Ordinances, and the 100x RCA Army CLI Compiler.
 */

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
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
  validateJsonSchema,
  evaluateBiomechanicsAndRhizosphere,
  computeHolobiontValuation,
  computeSanctuaryScorecardRollup,
  lintRcaEvidentiaryReport,
  computeRegenerativePracticeEconomics,
  compileRcaEvidentiaryMarkdown,
  compilePreservationCounterNotice,
  mintOpenBadgeAttestation,
} from '../src/core/rcaEngine.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const ordinancesRaw = JSON.parse(
  fs.readFileSync(path.join(rootDir, 'data/ordinances/central_texas_ordinances.json'), 'utf8')
);
const rogueValleyOrdinancesRaw = JSON.parse(
  fs.readFileSync(path.join(rootDir, 'data/ordinances/rogue_valley_oregon_ordinances.json'), 'utf8')
);
const rcaAssessmentSchema = JSON.parse(
  fs.readFileSync(path.join(rootDir, 'schemas/rca_assessment.schema.json'), 'utf8')
);
const rcaOpenBadgeSchema = JSON.parse(
  fs.readFileSync(path.join(rootDir, 'schemas/rca_openbadge_v3.schema.json'), 'utf8')
);
const municipalOrdinanceSchema = JSON.parse(
  fs.readFileSync(path.join(rootDir, 'schemas/municipal-ordinance.schema.json'), 'utf8')
);
const ashlandReferenceCase = JSON.parse(
  fs.readFileSync(path.join(rootDir, 'examples/ashland_oregon_white_oak_rca_v2.json'), 'utf8')
);

/**
 * Helper to clone and customize the 100% schema-valid Ashland reference case
 * so every test fixture strictly satisfies schemas/rca_assessment.schema.json.
 */
function cloneValidAssessment(overrides = {}) {
  const clone = JSON.parse(JSON.stringify(ashlandReferenceCase));
  for (const [k, v] of Object.entries(overrides)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && clone[k] && typeof clone[k] === 'object') {
      clone[k] = { ...clone[k], ...v };
    } else {
      clone[k] = v;
    }
  }
  return clone;
}

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
      pruning_date: '2026-04-15', // April is outside Oct-Jan window -> must flag Oak Wilt warning in Texas!
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

  assert.equal(rows[0].protected, true);
  assert.equal(rows[0].heritage, true);
  assert.ok(rows[0].flags.some((f) => f.includes('outside permitted seasonal window')));

  assert.equal(rows[3].excepted, true);
  assert.equal(rows[3].protected, false);

  const mit = computeMitigationPlan(rows, libertyHill);
  assert.equal(mit.protected_total_inches, 50);
  assert.equal(mit.exemption_cap_inches, 10);
  assert.equal(mit.lines[0].tag, 'T-102');
  assert.equal(mit.lines[0].exempt, true);
  assert.equal(mit.lines[1].tag, 'T-103');
  assert.equal(mit.lines[1].exempt, false);
  assert.equal(mit.cash_in_lieu_usd, 2250);

  const remediation = estimateRootZoneRemediation(rows);
  assert.equal(remediation.retained_tree_count, 1);
  assert.ok(remediation.union_crz_area_sqft > 2000);

  const permit = permitDetermination(rows, libertyHill);
  assert.equal(permit.required, true);
  assert.equal(permit.removalRequired, true);
  assert.ok(permitSummary(permit).includes('Permit required'));

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

// 4. Test RCA Biomechanics, Mattheck t/R Stability, SGR Enum Matching & Rhizosphere Prescription
{
  const assessment = cloneValidAssessment({
    structural_baseline: {
      ...ashlandReferenceCase.structural_baseline,
      dbh_cm: 80,
      sound_shell_thickness_ratio_t_over_r: 0.35, // t/R >= 0.30 -> Mattheck criterion satisfied
    },
    rhizosphere_and_root_collar: {
      ...ashlandReferenceCase.rhizosphere_and_root_collar,
      root_flare_diameter_cm: 110,
      root_flare_burial_depth_cm: 18,
      stem_girdling_root_count: 2,
      stem_girdling_root_severity: 'Moderate_25_To_50_Pct_Circumference',
      tiz_radius_m: 12.5,
      airspade_radial_trenching_geometry: {
        execution_status: 'Prescribed_Radial_Remediation',
        operating_pressure_psi: 150,
        trench_count: 8,
        trench_length_m: 7.0,
        trench_width_cm: 30,
        trench_depth_cm: 35,
        root_collar_excavation_radius_m: 0.75,
      },
    },
  });

  // Strict schema check on fixture
  const schemaCheck = validateJsonSchema(assessment, rcaAssessmentSchema);
  assert.equal(schemaCheck.valid, true, `Schema errors: ${schemaCheck.errors.join('; ')}`);

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

  // Verify Severe and Minor exact schema enums also compute non-zero constriction
  const severeSgr = cloneValidAssessment({
    rhizosphere_and_root_collar: {
      ...ashlandReferenceCase.rhizosphere_and_root_collar,
      stem_girdling_root_count: 3,
      stem_girdling_root_severity: 'Severe_Over_50_Pct_Circumference',
    },
  });
  assert.equal(evaluateBiomechanicsAndRhizosphere(severeSgr).rhizosphere_prescription.vascular_constriction_relief_ratio, 0.6);

  // Negative test: severely thinned shell (t/R = 0.18 < 0.30)
  const thinned = cloneValidAssessment({
    structural_baseline: {
      ...ashlandReferenceCase.structural_baseline,
      sound_shell_thickness_ratio_t_over_r: 0.18,
    },
  });
  assert.equal(validateJsonSchema(thinned, rcaAssessmentSchema).valid, true);
  const thinnedResult = evaluateBiomechanicsAndRhizosphere(thinned);
  assert.equal(thinnedResult.biomechanics.mattheck_criterion_satisfied, false);
  assert.equal(thinnedResult.biomechanics.is_structurally_sound, false);
  assert.ok(thinnedResult.biomechanics.stability_rating.includes('Elevated Buckling Risk'));

  console.log('[PASS] 4. RCA Biomechanics, Mattheck t/R Stability, SGR Enums & Rhizosphere Prescription');
}

// 5. Test CTLA 10th Ed vs. Holobiont Biological Equity Inversion (Veteran Oak)
{
  assert.equal(validateJsonSchema(ashlandReferenceCase, rcaAssessmentSchema).valid, true);

  const val = computeHolobiontValuation(ashlandReferenceCase, {
    unit_cost_sq_in: 75.0,
    ctla_location_factor: 0.85,
  });

  assert.ok(val.ctla_10th_ed_depreciated_usd > 0);
  assert.equal(val.veteran_keystone_habitat_multiplier, 3.5);
  assert.ok(val.holobiont_200yr_biological_equity_usd > val.ctla_10th_ed_depreciated_usd);
  assert.ok(val.valuation_delta_usd > 0);
  assert.ok(val.inversion_ratio >= 10.0, `Inversion ratio was ${val.inversion_ratio}`);

  console.log('[PASS] 5. CTLA 10th Ed vs. Holobiont Biological Equity Inversion (Veteran Oak)');
}

// 6. Test Sanctuary Scorecard Rollup & Spatial Union De-duplication (100% Schema-Valid Fixtures)
{
  const tree1 = cloneValidAssessment({
    structural_baseline: {
      ...ashlandReferenceCase.structural_baseline,
      tree_tag: 'LH-QV-01',
      species_scientific: 'Quercus virginiana',
      species_common: 'Southern Live Oak',
      inaturalist_taxon_id: 49005,
      dbh_cm: 75,
      plus_code_global: '8624M38F+4X',
      crown_spread_ns_m: 14,
      crown_spread_ew_m: 14,
      live_crown_ratio_pct: 75,
    },
    rhizosphere_and_root_collar: {
      ...ashlandReferenceCase.rhizosphere_and_root_collar,
      tiz_radius_m: 14,
    },
    soil_and_microbiome_baseline: {
      ...ashlandReferenceCase.soil_and_microbiome_baseline,
      bulk_density_g_cm3: 1.25,
      organic_matter_pct: 4.8,
      infiltration_rate_mm_hr: 45,
      mycorrhizal_and_fungal_observations: {
        dominant_mycorrhizal_guild: 'Ectomycorrhizal_EM',
        fungal_to_bacterial_biomass_ratio: 1.35,
        hyphal_colonization_status: 'Abundant_Visible_Mycelial_Mats',
        observed_fruiting_bodies_or_rhizomorphs: [
          {
            species_or_morphotype: 'Pisolithus arhizus',
            inaturalist_taxon_id: 55259,
            ecological_role: 'Mycorrhizal_Symbiont',
          },
          {
            species_or_morphotype: 'Russula spp.',
            inaturalist_taxon_id: 48339,
            ecological_role: 'Mycorrhizal_Symbiont',
          },
        ],
      },
    },
  });

  const tree2 = cloneValidAssessment({
    structural_baseline: {
      ...ashlandReferenceCase.structural_baseline,
      tree_tag: 'LH-QS-02',
      species_scientific: 'Quercus stellata',
      species_common: 'Post Oak',
      inaturalist_taxon_id: 54781,
      dbh_cm: 60,
      plus_code_global: '8624M38F+4X', // Overlapping Plus Code
      crown_spread_ns_m: 11,
      crown_spread_ew_m: 12,
      live_crown_ratio_pct: 70,
    },
    rhizosphere_and_root_collar: {
      ...ashlandReferenceCase.rhizosphere_and_root_collar,
      tiz_radius_m: 12,
    },
  });

  assert.equal(validateJsonSchema(tree1, rcaAssessmentSchema).valid, true);
  assert.equal(validateJsonSchema(tree2, rcaAssessmentSchema).valid, true);

  const rollup = computeSanctuaryScorecardRollup([tree1, tree2], 4047);
  assert.equal(rollup.total_assessed_trees, 2);
  assert.ok(rollup.spatial_coverage.union_tiz_area_sqm > 0);
  assert.ok(rollup.spatial_coverage.overlap_deduplicated_sqm > 0);

  const sc = rollup.sanctuary_scorecard;
  assert.ok(sc.soil_health_index > 40 && sc.soil_health_index <= 100);
  assert.ok(sc.canopy_coverage_index > 0 && sc.canopy_coverage_index <= 100);
  assert.ok(sc.water_dynamics_index > 0 && sc.water_dynamics_index <= 100);
  assert.ok(sc.biodiversity_baseline_index >= 40 && sc.biodiversity_baseline_index <= 100);
  assert.ok(sc.restoration_potential_score >= 80 && sc.restoration_potential_score <= 100);
  assert.ok(sc.composite_sanctuary_score > 0 && sc.composite_sanctuary_score <= 100);
  assert.ok(rollup.ecological_equity.total_valuation_delta_usd > 0);

  console.log('[PASS] 6. Sanctuary Scorecard Parcel Rollup & Spatial Union De-duplication');
}

// 7. Test ASCA Evidentiary Linter Blocking Lazy Removal & Strict Schema Conformance
{
  const badRemovalAssessment = cloneValidAssessment({
    structural_baseline: {
      ...ashlandReferenceCase.structural_baseline,
      sound_shell_thickness_ratio_t_over_r: 0.38,
      municipal_permit_disposition: {
        ...ashlandReferenceCase.structural_baseline.municipal_permit_disposition,
        recommended_disposition: 'Removal_Last_Resort_Unmitigable_Hazard',
      },
    },
  });
  delete badRemovalAssessment.structural_baseline.sonic_tomography_or_resistograph_uri;
  assert.equal(validateJsonSchema(badRemovalAssessment, rcaAssessmentSchema).valid, true);

  const lintResult = lintRcaEvidentiaryReport(badRemovalAssessment);
  assert.equal(lintResult.valid, false);
  assert.ok(lintResult.errors.some((e) => e.includes('UNJUSTIFIED_REMOVAL')));
  assert.ok(lintResult.errors.some((e) => e.includes('EVIDENTIARY_DEFECT')));

  const goodResult = lintRcaEvidentiaryReport(ashlandReferenceCase);
  assert.equal(goodResult.valid, true);

  // Sabotage check on validateJsonSchema: un-schematized property must fail!
  const unschematized = cloneValidAssessment();
  unschematized.soil_and_microbiome_baseline.dominant_fungal_taxa_inaturalist_ids = [12345];
  const badSchemaCheck = validateJsonSchema(unschematized, rcaAssessmentSchema);
  assert.equal(badSchemaCheck.valid, false);
  assert.ok(badSchemaCheck.errors.some((e) => e.includes('additionalProperties: false')));

  console.log('[PASS] 7. ASCA Evidentiary Linter Blocking Lazy Removal & Strict Schema Conformance');
}

// 8. Test Rogue Valley Oregon Bioregional Municipal Ordinances (Ashland, Medford, Grants Pass)
{
  for (const muni of rogueValleyOrdinancesRaw.municipalities) {
    const mRes = validateJsonSchema(muni, municipalOrdinanceSchema);
    assert.equal(mRes.valid, true, `Municipality ${muni.id} failed schema: ${mRes.errors.join('; ')}`);
    assert.equal(muni.plan_rules?.pruning?.oak_months, undefined, `${muni.id} must not have Texas oak_months`);
  }

  const ashland = rogueValleyOrdinancesRaw.municipalities.find((m) => m.id === 'or-ashland');
  const medford = rogueValleyOrdinancesRaw.municipalities.find((m) => m.id === 'or-medford');
  const grantsPass = rogueValleyOrdinancesRaw.municipalities.find((m) => m.id === 'or-grants-pass');

  // Ashland: 19-in DBH Douglas-fir -> Protected & Heritage, removal triggers permit
  const ashlandEval = evaluateTreeInventory(
    [
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
        species_common: 'Oregon White Oak',
        species_scientific: 'Quercus garryana',
        stems_inches: [22],
        lat: 42.1947,
        lng: -122.7096,
        condition_score: 8,
        removal: false,
        pruning_date: '2026-05-15', // May pruning in Oregon must NOT trigger Texas Oak Wilt flag!
      },
    ],
    ashland
  );
  assert.equal(ashlandEval[0].protected, true);
  assert.equal(ashlandEval[0].heritage, true);
  assert.equal(ashlandEval[1].flags.length, 0); // Defect 2 fix verified!

  const ashlandPermit = permitDetermination(ashlandEval, ashland);
  assert.equal(ashlandPermit.required, true);
  assert.equal(ashlandPermit.removalRequired, true);
  assert.ok(ashlandPermit.citation.includes('AMC'));

  // Medford: 12-in protected removal + 28-in heritage retention
  const medfordEval = evaluateTreeInventory(
    [
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
    ],
    medford
  );
  assert.equal(medfordEval[0].protected, true);
  assert.equal(medfordEval[0].heritage, false);
  assert.equal(medfordEval[1].protected, true);
  assert.equal(medfordEval[1].heritage, true);

  const medfordPermit = permitDetermination(medfordEval, medford);
  assert.equal(medfordPermit.required, true); // Defect 1 fix verified!
  assert.equal(medfordPermit.removalRequired, true);
  assert.ok(medfordPermit.citation.includes('MMC'));

  // Grants Pass: 14-in protected removal + 22-in heritage retention
  const gpEval = evaluateTreeInventory(
    [
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
    ],
    grantsPass
  );
  assert.equal(gpEval[0].protected, true);
  assert.equal(gpEval[0].heritage, false);
  assert.equal(gpEval[1].protected, true);
  assert.equal(gpEval[1].heritage, true);

  const gpPermit = permitDetermination(gpEval, grantsPass);
  assert.equal(gpPermit.required, true); // Defect 1 fix verified!
  assert.equal(gpPermit.removalRequired, true);
  assert.ok(gpPermit.citation.includes('Grants Pass'));

  console.log('[PASS] 8. Rogue Valley Oregon Bioregional Municipal Ordinances (Ashland, Medford, Grants Pass)');
}

// 9. Test 100x RCA Army Engine & CLI (compile, counter-notice, economics, attest + sabotage checks)
{
  const cliPath = path.join(rootDir, 'bin/openarbor-rca.mjs');
  const examplePath = path.join(rootDir, 'examples/ashland_oregon_white_oak_rca_v2.json');

  // 9a. Test CLI compile
  const compileOut = execFileSync(process.execPath, [cliPath, 'compile', examplePath], {
    encoding: 'utf8',
  });
  assert.ok(compileOut.includes('# Open Arbor Regenerative Diagnostic & Evidentiary Report (RCA_v2)'));
  assert.ok(compileOut.includes('Structurally Sound (t/R >= 0.30 Mattheck Criterion Satisfied)'));
  assert.ok(compileOut.includes('<svg'));

  // 9b. Test CLI counter-notice
  const noticeOut = execFileSync(process.execPath, [cliPath, 'counter-notice', examplePath], {
    encoding: 'utf8',
  });
  assert.ok(noticeOut.includes('# SCIENTIFIC PRESERVATION & BIOMECHANICAL COUNTER-NOTICE'));
  assert.ok(noticeOut.includes('Conflict-of-Interest Disclosure'));

  // 9c. Test CLI economics (--json)
  const econJsonRaw = execFileSync(process.execPath, [cliPath, 'economics', examplePath, '--json'], {
    encoding: 'utf8',
  });
  const econData = JSON.parse(econJsonRaw);
  assert.equal(econData.comparison.is_regenerative_more_profitable, true);
  assert.ok(econData.comparison.margin_multiplier > 3.0);
  assert.ok(econData.regenerative_stewardship_model.five_year_gross_revenue_usd > econData.legacy_removal_model.one_time_gross_bid_usd);

  // 9d. Test CLI attest (end-to-end Open Badges 3.0 minting & schema validation)
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openarbor-rca-test-'));
  const pracPath = path.join(tmpDir, 'practitioner.json');
  const r2Path = path.join(tmpDir, 'report2.json');
  const r3Path = path.join(tmpDir, 'report3.json');
  const badgeOutPath = path.join(tmpDir, 'badge.json');

  fs.writeFileSync(
    pracPath,
    JSON.stringify({
      id: 'did:web:soilgrower.com:stewards:george-steward',
      practitioner_name: 'George Steward',
      year_1_recovery_milestone_target_date: '2027-10-23',
      legacy_statutory_equivalencies: {
        credential_category: 'ISA_Certified_Arborist',
        issuing_organization: 'International Society of Arboriculture',
        credential_identifier: 'TX-362025A',
        verification_url: 'https://certificates.directory.isa-arbor.com/',
      },
    }),
    'utf8'
  );
  fs.writeFileSync(r2Path, JSON.stringify(cloneValidAssessment({ structural_baseline: { ...ashlandReferenceCase.structural_baseline, tree_tag: 'MED-QG-202', dbh_cm: 92 } })), 'utf8');
  fs.writeFileSync(r3Path, JSON.stringify(cloneValidAssessment({ structural_baseline: { ...ashlandReferenceCase.structural_baseline, tree_tag: 'GP-PP-303', dbh_cm: 88 } })), 'utf8');

  execFileSync(process.execPath, [cliPath, 'attest', pracPath, examplePath, r2Path, r3Path, '--out', badgeOutPath], {
    encoding: 'utf8',
  });
  const mintedBadge = JSON.parse(fs.readFileSync(badgeOutPath, 'utf8'));
  const badgeSchemaRes = validateJsonSchema(mintedBadge, rcaOpenBadgeSchema);
  assert.equal(badgeSchemaRes.valid, true, `Badge schema errors: ${badgeSchemaRes.errors.join('; ')}`);
  assert.equal(mintedBadge.evidence.length, 3);
  assert.equal(mintedBadge.credentialSubject.nature_first_competency_proof.diagnostic_report_hashes_sha256.length, 3);
  assert.equal(mintedBadge.proof.cryptosuite, 'sha256-integrity');
  assert.ok(mintedBadge.proof.proofValue.startsWith('sha256:'));

  // 9e. Negative-path CLI Sabotage Check: lazy removal with t/R = 0.34 must fail CLI compile!
  const sabotagedPath = path.join(tmpDir, 'sabotaged_removal.json');
  const sabotagedRemoval = cloneValidAssessment({
    structural_baseline: {
      ...ashlandReferenceCase.structural_baseline,
      municipal_permit_disposition: {
        ...ashlandReferenceCase.structural_baseline.municipal_permit_disposition,
        recommended_disposition: 'Removal_Last_Resort_Unmitigable_Hazard',
      },
    },
  });
  fs.writeFileSync(sabotagedPath, JSON.stringify(sabotagedRemoval), 'utf8');

  let cliFailedAsExpected = false;
  try {
    execFileSync(process.execPath, [cliPath, 'compile', sabotagedPath], { stdio: 'pipe' });
  } catch (err) {
    cliFailedAsExpected = true;
    assert.ok(String(err.stderr).includes('UNJUSTIFIED_REMOVAL'));
  }
  assert.equal(cliFailedAsExpected, true, 'CLI compile must fail on unjustified removal when t/R >= 0.30');

  // 9f. Negative-path Prototype-Chain Bypass Checks (__proto__ and constructor at domain level)
  const protoInjected = JSON.parse(JSON.stringify(ashlandReferenceCase));
  Object.defineProperty(protoInjected.structural_baseline, '__proto__', {
    value: { injected: true },
    enumerable: true,
    configurable: true,
    writable: true,
  });
  const protoCheck = validateJsonSchema(protoInjected, rcaAssessmentSchema);
  assert.equal(protoCheck.valid, false, 'Assessment carrying __proto__ at domain level must be rejected');
  assert.ok(
    protoCheck.errors.some((e) => e.includes("un-schematized additional property '__proto__' is forbidden")),
    `Expected __proto__ additionalProperties error, got: ${protoCheck.errors.join('; ')}`
  );

  const constructorInjected = JSON.parse(JSON.stringify(ashlandReferenceCase));
  constructorInjected.structural_baseline.constructor = { polluted: true };
  const constructorCheck = validateJsonSchema(constructorInjected, rcaAssessmentSchema);
  assert.equal(constructorCheck.valid, false, 'Assessment carrying constructor at domain level must be rejected');
  assert.ok(
    constructorCheck.errors.some((e) => e.includes("un-schematized additional property 'constructor' is forbidden")),
    `Expected constructor additionalProperties error, got: ${constructorCheck.errors.join('; ')}`
  );

  fs.rmSync(tmpDir, { recursive: true, force: true });
  console.log('[PASS] 9. 100x RCA Army Engine & CLI (compile, counter-notice, economics, attest & sabotage gates)');
}

// 10. Test Static Web Field Bundle (out/) & 3/3 CLI-to-Browser Parity
{
  const outIndex = path.join(rootDir, 'out/index.html');
  const outBundle = path.join(rootDir, 'out/openarbor-bundle.js');
  const outCss = path.join(rootDir, 'out/styles.css');
  assert.ok(fs.existsSync(outIndex), 'out/index.html must exist');
  assert.ok(fs.existsSync(outBundle), 'out/openarbor-bundle.js must exist');
  assert.ok(fs.existsSync(outCss), 'out/styles.css must exist');

  const parityOut = execFileSync(process.execPath, [path.join(rootDir, 'deploy/verify-parity.mjs')], {
    encoding: 'utf8',
  });
  assert.ok(parityOut.includes('3/3 identical'));
  assert.ok(fs.existsSync(path.join(rootDir, 'deploy/VERIFICATION.md')), 'deploy/VERIFICATION.md must exist');
  assert.ok(fs.existsSync(path.join(rootDir, 'deploy/DEPLOY.md')), 'deploy/DEPLOY.md must exist');
  console.log('[PASS] 10. Static Web Field Tool Build (out/) & 3/3 CLI-to-Browser Bundle Parity');
}

console.log('\nALL OPENARBOR CORE VERIFICATION CHECKS PASSED (0 proprietary dependencies).');
