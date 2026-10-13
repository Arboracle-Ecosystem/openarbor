/**
 * OpenArbor Core — Allometric Ecosystem Benefits, Veteran Tree Age, and GeoJSON Adapter
 * Grounded in published urban forestry literature:
 *   - Biomass & Carbon: Nowak (1994), Cairns et al. (1997)
 *   - Canopy Hydrology: Xiao et al. (2000)
 *   - Dry Deposition Air Quality: Nowak et al. (2006)
 *   - Building Shade Cooling: McPherson & Simpson (1999) / ISA (~80 kWh/tree average)
 *   - Veteran Tree Age Estimation: John White (Forestry Commission Information Note FCIN12)
 */

const round2 = (n) => Math.round(Number(n || 0) * 100) / 100;
const round1 = (n) => Math.round(Number(n || 0) * 10) / 10;

export const CONDITION_FACTORS = {
  Excellent: 1.0,
  Good: 0.85,
  Fair: 0.62,
  Poor: 0.37,
  Critical: 0.15,
  Dead: 0.0,
};

/**
 * Estimate tree age using the John White (FCIN12) site-adjusted growth factor method.
 */
export function estimateTreeAge({
  dbh_inches,
  girth_inches = null,
  base_growth_factor = 4.5,
  site_condition = 'Open Grown / Parkland',
}) {
  const effectiveDbhInches = dbh_inches || (girth_inches ? girth_inches / Math.PI : 0);
  if (!effectiveDbhInches || effectiveDbhInches <= 0) return { estimated_age_years: 0 };

  const dbhCm = effectiveDbhInches * 2.54;
  const siteModifiers = {
    'Open Grown / Parkland': 0.85,
    'Forest / Woodland': 1.15,
    'Urban / Street Tree': 1.10,
  };
  const modifier = siteModifiers[site_condition] || 1.0;
  const adjustedFactor = base_growth_factor * modifier;

  return {
    dbh_inches: round2(effectiveDbhInches),
    dbh_cm: round2(dbhCm),
    base_growth_factor,
    site_condition,
    site_modifier: modifier,
    adjusted_growth_factor: round2(adjustedFactor),
    estimated_age_years: Math.round(dbhCm * adjustedFactor),
    method: 'ISA Growth Factor / John White (FCIN12) Site-Modified Model',
  };
}

/**
 * Calculate annual and cumulative ecosystem services for an individual tree.
 */
export function calculateTreeEcosystemBenefits({
  species_name,
  common_name = '',
  dbh_inches,
  height_feet = null,
  canopy_spread_feet = null,
  condition_class = 'Good',
  crown_light_exposure = 4,
  land_use = 'Residential',
  annual_rainfall_inches = 35,
  projection_years = 20,
}) {
  if (!dbh_inches || dbh_inches <= 0) {
    throw new Error('dbh_inches must be > 0');
  }

  const conditionFactor = CONDITION_FACTORS[condition_class] ?? 0.85;
  const dbhCm = dbh_inches * 2.54;

  // 1. Biomass & Carbon Storage (Nowak 1994 / Cairns et al. 1997)
  const aboveGroundBiomassKg = Math.exp(-2.0773 + 2.3323 * Math.log(dbhCm));
  const belowGroundBiomassKg = aboveGroundBiomassKg * 0.28;
  const adjustedBiomassKg = (aboveGroundBiomassKg + belowGroundBiomassKg) * 0.8;
  const carbonStorageKg = adjustedBiomassKg * 0.5;
  const carbonStorageLbs = carbonStorageKg * 2.20462;
  const carbonStorageValueUsd = (carbonStorageKg / 1000) * 187;

  // 2. Annual Carbon Sequestration
  const annualGrowthInches =
    condition_class === 'Excellent' ? 0.5 : condition_class === 'Good' ? 0.4 : condition_class === 'Fair' ? 0.3 : 0.15;
  const futureDbhCm = (dbh_inches + annualGrowthInches) * 2.54;
  const futureBiomassKg = Math.exp(-2.0773 + 2.3323 * Math.log(futureDbhCm)) * 1.28 * 0.8;
  const annualSeqKg = Math.max(0, futureBiomassKg * 0.5 - carbonStorageKg);
  const annualSeqLbs = annualSeqKg * 2.20462 * conditionFactor;
  const annualSeqValueUsd = (annualSeqKg / 1000) * 187 * conditionFactor;

  // 3. Canopy Hydrology & Stormwater Interception (Xiao et al. 2000)
  const estimatedHeightFt = height_feet || dbh_inches * 1.5 + 15;
  const estimatedSpreadFt = canopy_spread_feet || dbh_inches * 0.8 + 10;
  const canopyCoverSqft = Math.PI * (estimatedSpreadFt / 2) ** 2;
  const leafAreaSqft = canopyCoverSqft * 6.5;
  const leafAreaM2 = leafAreaSqft * 0.0929;

  const interceptionRate = 0.15 * conditionFactor;
  const rainfallInterceptedGal = canopyCoverSqft * (annual_rainfall_inches / 12) * 7.48 * interceptionRate;
  const avoidedRunoffGal = rainfallInterceptedGal * 1.3;
  const avoidedRunoffValueUsd = avoidedRunoffGal * 0.009;

  // 4. Air Pollution Dry Deposition (Nowak et al. 2006)
  const o3G = leafAreaM2 * 3.4 * conditionFactor;
  const no2G = leafAreaM2 * 1.1 * conditionFactor;
  const so2G = leafAreaM2 * 0.8 * conditionFactor;
  const pm25G = leafAreaM2 * 0.7 * conditionFactor;
  const coG = leafAreaM2 * 0.2 * conditionFactor;
  const totalPollutionLbs = (o3G + no2G + so2G + pm25G + coG) / 453.592;
  const pollutionValueUsd =
    (pm25G / 1e6) * 150000 +
    (o3G / 1e6) * 4000 +
    (no2G / 1e6) * 2000 +
    (so2G / 1e6) * 3000 +
    (coG / 1e6) * 1000;

  // 5. Building Shade Cooling Energy (McPherson & Simpson 1999)
  const proximityFactor = land_use === 'Residential' ? 1.0 : land_use === 'Commercial' ? 0.7 : 0.3;
  const coolingSavingsKwh = canopyCoverSqft * 0.15 * proximityFactor * conditionFactor * (crown_light_exposure / 5);
  const heatingSavingsTherms = canopyCoverSqft * 0.001 * proximityFactor * conditionFactor;
  const energySavingsValueUsd = coolingSavingsKwh * 0.12 + heatingSavingsTherms * 1.2;

  // 6. CTLA Compensatory Structural Value
  const trunkAreaSqIn = Math.PI * (dbh_inches / 2) ** 2;
  const locationFactor = land_use === 'Street' ? 0.9 : land_use === 'Park' ? 0.8 : 0.75;
  const structuralValueUsd = trunkAreaSqIn * 75 * 0.7 * conditionFactor * locationFactor;

  const totalAnnualValueUsd = annualSeqValueUsd + avoidedRunoffValueUsd + pollutionValueUsd + energySavingsValueUsd;

  return {
    species_name,
    common_name,
    dbh_inches,
    canopy_cover_sqft: Math.round(canopyCoverSqft),
    carbon_storage_lbs: round1(carbonStorageLbs),
    carbon_storage_value_usd: round2(carbonStorageValueUsd),
    carbon_sequestration_lbs_yr: round1(annualSeqLbs),
    co2_equivalent_lbs_yr: round1(annualSeqLbs * 3.67),
    avoided_runoff_gallons_yr: Math.round(avoidedRunoffGal),
    pollution_removal_lbs_yr: round2(totalPollutionLbs),
    cooling_savings_kwh_yr: round1(coolingSavingsKwh),
    structural_value_usd: Math.round(structuralValueUsd),
    total_annual_benefits_usd: round2(totalAnnualValueUsd),
    projected_20yr_benefits_usd: Math.round(totalAnnualValueUsd * projection_years * 1.08),
  };
}

/**
 * Export evaluated OpenArbor tree inventory rows as an OGC-compliant GeoJSON FeatureCollection
 * for direct import into QGIS, ArcGIS Field Maps, or Leaflet.
 */
export function toGeoJSONFeatureCollection(evaluatedRows = [], metadata = {}) {
  return {
    type: 'FeatureCollection',
    name: metadata.name || 'OpenArbor_Tree_Inventory',
    crs: {
      type: 'name',
      properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' },
    },
    metadata: {
      generated_at: new Date().toISOString(),
      standard: 'OpenArbor v2.0 (ANSI A300 Part 5 / ISA BMP)',
      ...metadata,
    },
    features: evaluatedRows
      .filter((r) => r.lat != null && r.lng != null)
      .map((r) => ({
        type: 'Feature',
        id: r.tag,
        geometry: {
          type: 'Point',
          coordinates: [Number(r.lng), Number(r.lat)],
        },
        properties: {
          tag: r.tag,
          species: r.species,
          scientific: r.scientific,
          dbh_inches: r.dbh,
          protected: r.protected,
          heritage: r.heritage,
          excepted: r.excepted,
          removal: r.removal,
          crz_radius_ft: r.crz_ft,
          crz_area_sqft: r.crz_area,
          tpz_fence_radius_ft: r.fence_ft,
          condition_score: r.health,
          flags: r.flags,
        },
      })),
  };
}
