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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ordinancesRaw = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/ordinances/central_texas_ordinances.json'), 'utf8')
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

console.log('\nALL OPENARBOR CORE VERIFICATION CHECKS PASSED (0 proprietary dependencies).');
