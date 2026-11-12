/**
 * OpenArbor Soil Function & Vadose Sponge Verification Suite (tests/verify_soil_function.mjs)
 * Proves that soil_function is omitted by default (including prototype-chain safety),
 * present with source when supplied, refused when numeric values arrive without source,
 * leaves municipal compliance calculations unchanged, and computes deterministic vadose
 * storm capture and NRCS organic-matter sponge capacity.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  evaluateTreeInventory,
  computeMitigationPlan,
  estimateRootZoneRemediation,
} from '../src/core/ordinanceEngine.js';

import {
  toGeoJSONFeatureCollection,
  validateSoilFunction,
  estimateSoilSpongeCapacity,
} from '../src/core/ecosystemBenefits.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ordinancesRaw = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/ordinances/central_texas_ordinances.json'), 'utf8')
);
const libertyHill = ordinancesRaw.municipalities.find((m) => m.id === 'tx-liberty-hill');

console.log('=== OpenArbor Soil Function & Vadose Sponge Verification Suite ===\n');

const sampleStand = [
  {
    tag: 'T-101',
    species_common: 'Live Oak',
    species_scientific: 'Quercus virginiana',
    stems_inches: [26],
    lat: 30.6653,
    lng: -97.925,
    condition_score: 8,
    removal: false,
  },
  {
    tag: 'T-102',
    species_common: 'Cedar Elm',
    species_scientific: 'Ulmus crassifolia',
    stems_inches: [9],
    lat: 30.6654,
    lng: -97.9251,
    condition_score: 7,
    removal: true,
  },
  {
    tag: 'T-103',
    species_common: 'Post Oak',
    species_scientific: 'Quercus stellata',
    stems_inches: [15],
    lat: 30.6655,
    lng: -97.9252,
    condition_score: 6,
    removal: true,
  },
];

// 1. Absent by default, when empty/all-null, and when inherited via prototype chain
{
  const rows = evaluateTreeInventory(sampleStand, libertyHill);
  const defaultGeojson = toGeoJSONFeatureCollection(rows, { project: 'Default Export Check' });

  assert.equal('soil_function' in defaultGeojson, false);
  assert.equal('soil_function' in defaultGeojson.metadata, false);
  assert.equal('soil_function' in defaultGeojson.features[0].properties, false);
  assert.deepEqual(Object.keys(defaultGeojson), [
    'type',
    'name',
    'crs',
    'metadata',
    'features',
  ]);

  const emptyGeojson = toGeoJSONFeatureCollection(rows, {
    project: 'Empty Soil Check',
    soil_function: {
      infiltration_mm_hr: null,
      organic_matter_percent: null,
      water_holding_gal_acre_ft: null,
    },
  });
  assert.equal('soil_function' in emptyGeojson, false);
  assert.equal('soil_function' in emptyGeojson.metadata, false);

  const inheritedOptions = Object.create({
    soil_function: {
      infiltration_mm_hr: 40,
      organic_matter_percent: 3.0,
      water_holding_gal_acre_ft: 45000,
      measurement_dates: ['2026-04-01', '2026-10-01'],
      source: 'Inherited prototype payload that must be ignored',
      method: 'measured',
    },
  });
  const protoSafeGeojson = toGeoJSONFeatureCollection(
    rows,
    { project: 'Prototype Safety Check' },
    inheritedOptions
  );
  assert.equal('soil_function' in protoSafeGeojson, false);

  console.log('[PASS] 1. soil_function block is omitted when unsupplied, all-null, or prototype-inherited');
}

// 2. Present with source when supplied (both via metadata and via options)
{
  const rows = evaluateTreeInventory(sampleStand, libertyHill);
  const suppliedSoil = {
    infiltration_mm_hr: 45,
    organic_matter_percent: 3.5,
    water_holding_gal_acre_ft: 48000,
    measurement_dates: ['2026-04-01', '2026-10-01'],
    source: 'Synthetic ring infiltrometer and LOI lab record (demo)',
    method: 'measured',
  };

  const geojsonViaMetadata = toGeoJSONFeatureCollection(rows, {
    project: 'Synthetic Soil Function Check',
    soil_function: suppliedSoil,
  });

  assert.equal('soil_function' in geojsonViaMetadata, true);
  assert.equal('soil_function' in geojsonViaMetadata.metadata, false);
  assert.deepEqual(geojsonViaMetadata.soil_function, suppliedSoil);

  const partialEstimated = {
    infiltration_mm_hr: 32.5,
    organic_matter_percent: 2.8,
    water_holding_gal_acre_ft: null,
    measurement_dates: ['2026-03-15', '2026-09-15'],
    source: 'Synthetic field record (demo)',
    method: 'estimated',
  };
  const geojsonViaOptions = toGeoJSONFeatureCollection(
    rows,
    { project: 'Options Check' },
    { soil_function: partialEstimated }
  );
  assert.deepEqual(geojsonViaOptions.soil_function, partialEstimated);

  // Compliance numbers remain completely unchanged
  const mit = computeMitigationPlan(rows, libertyHill);
  const rem = estimateRootZoneRemediation(rows);
  assert.equal(mit.protected_total_inches, 50);
  assert.equal(mit.exemption_cap_inches, 10);
  assert.equal(mit.cash_in_lieu_usd, 2250);
  assert.equal(rem.retained_tree_count, 1);

  console.log('[PASS] 2. soil_function block is attached with source when supplied and compliance numbers are unchanged');
}

// 3. Refuses numeric fields without source and rejects invalid inputs
{
  const rows = evaluateTreeInventory(sampleStand, libertyHill);

  for (const field of [
    { infiltration_mm_hr: 20 },
    { organic_matter_percent: 2.5 },
    { water_holding_gal_acre_ft: 40000 },
  ]) {
    assert.throws(
      () =>
        toGeoJSONFeatureCollection(rows, {
          soil_function: {
            ...field,
            measurement_dates: ['2026-04-01', '2026-10-01'],
            method: 'measured',
          },
        }),
      /source/i
    );

    assert.throws(
      () =>
        validateSoilFunction({
          ...field,
          measurement_dates: ['2026-04-01', '2026-10-01'],
          source: '   ',
          method: 'measured',
        }),
      /source/i
    );
  }

  assert.throws(
    () =>
      validateSoilFunction({
        infiltration_mm_hr: -1,
        organic_matter_percent: 2.5,
        water_holding_gal_acre_ft: null,
        measurement_dates: ['2026-04-01', '2026-10-01'],
        source: 'Synthetic record',
        method: 'measured',
      }),
    /infiltration_mm_hr/
  );

  assert.throws(
    () =>
      validateSoilFunction({
        infiltration_mm_hr: 20,
        organic_matter_percent: 2.5,
        water_holding_gal_acre_ft: null,
        measurement_dates: ['2026-04-01', '2026-10-01'],
        source: 'Synthetic record',
        method: 'guessed',
      }),
    /method/
  );

  assert.throws(
    () =>
      validateSoilFunction({
        infiltration_mm_hr: 20,
        organic_matter_percent: 105,
        water_holding_gal_acre_ft: null,
        measurement_dates: ['2026-04-01', '2026-10-01'],
        source: 'Synthetic record',
        method: 'measured',
      }),
    /organic_matter_percent/
  );

  assert.throws(
    () =>
      validateSoilFunction({
        infiltration_mm_hr: 20,
        organic_matter_percent: 2.5,
        water_holding_gal_acre_ft: null,
        measurement_dates: ['2026-10-01', '2026-04-01'],
        source: 'Synthetic record',
        method: 'measured',
      }),
    /measurement_dates/
  );

  assert.throws(
    () =>
      validateSoilFunction({
        infiltration_mm_hr: 20,
        organic_matter_percent: 2.5,
        water_holding_gal_acre_ft: null,
        measurement_dates: ['2026-02-30', '2026-10-01'],
        source: 'Synthetic record',
        method: 'measured',
      }),
    /measurement_dates/
  );

  console.log('[PASS] 3. Validation refuses numeric fields without source and rejects invalid dates, methods, and bounds');
}

// 4. Deterministic vadose storm capture and NRCS SOM sponge capacity estimator
{
  const defaultSponge = estimateSoilSpongeCapacity();
  assert.equal(defaultSponge.tiz_area_m2, 100);
  assert.equal(defaultSponge.storm_1in_capture_gallons, 671);
  assert.equal(defaultSponge.som_sponge_capacity_gallons, 741.3);
  assert.equal(defaultSponge.infiltration_mm_hr, 18);
  assert.equal(defaultSponge.infiltration_class, 'Moderate (15 to 50 mm/hr)');

  const compactedSponge = estimateSoilSpongeCapacity({
    tiz_area_m2: 200,
    infiltration_mm_hr: 10,
    organic_matter_percent: 0.8,
  });
  assert.equal(compactedSponge.infiltration_class, 'Compacted (< 15 mm/hr)');
  assert.equal(compactedSponge.som_sponge_capacity_gallons, 0);
  assert.equal(compactedSponge.storm_1in_capture_gallons, 1342);

  const livingSponge = estimateSoilSpongeCapacity({
    tiz_area_m2: 404.69,
    infiltration_mm_hr: 65,
    organic_matter_percent: 5.0,
  });
  assert.equal(livingSponge.infiltration_class, 'Living Sponge (> 50 mm/hr)');
  assert.equal(livingSponge.som_sponge_capacity_gallons, 8000.1);

  assert.throws(
    () => estimateSoilSpongeCapacity({ tiz_area_m2: -10 }),
    /tiz_area_m2/
  );

  console.log('[PASS] 4. Vadose storm capture and NRCS SOM sponge capacity verified across all three infiltration classes');
}

console.log('\nALL 4 SOIL FUNCTION & VADOSE SPONGE VERIFICATION GROUPS PASSED.');
