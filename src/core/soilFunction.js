/**
 * OpenArbor Core: Optional Soil Function Validator and Vadose Sponge Estimator
 * Enforces non-negative numeric checks, chronological ISO date pair validation,
 * method provenance, and mandatory source attribution whenever any numeric metric
 * is supplied. Also computes deterministic vadose storm capture and NRCS soil
 * organic matter water-holding capacity estimates.
 * Zero external dependencies; pure browser and Node.js ESM.
 */

const ALLOWED_KEYS = new Set([
  'infiltration_mm_hr',
  'organic_matter_percent',
  'water_holding_gal_acre_ft',
  'measurement_dates',
  'source',
  'method',
]);

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const VALID_METHODS = new Set(['measured', 'estimated']);

const SQFT_PER_M2 = 10.7639;
const M2_PER_ACRE = 4046.86;
const GALLONS_PER_LITER = 0.264172;
const MM_PER_INCH = 25.4;
const NRCS_GALLONS_PER_ACRE_PER_1PCT_SOM = 20000;

const round1 = (n) => Math.round(Number(n || 0) * 10) / 10;
const round2 = (n) => Math.round(Number(n || 0) * 100) / 100;

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function isValidIsoDate(value) {
  if (typeof value !== 'string') return false;
  const match = ISO_DATE_RE.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const dt = new Date(Date.UTC(year, month - 1, day));
  return (
    dt.getUTCFullYear() === year &&
    dt.getUTCMonth() === month - 1 &&
    dt.getUTCDate() === day
  );
}

function validateNullableMetric(value, name, maxValue = null) {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`soil_function.${name} must be a finite number or null`);
  }
  if (value < 0) {
    throw new Error(`soil_function.${name} must be >= 0`);
  }
  if (maxValue !== null && value > maxValue) {
    throw new Error(`soil_function.${name} must be <= ${maxValue}`);
  }
  return value;
}

/**
 * Validate and normalize an optional soil_function object.
 * Returns null when omitted or when no values are supplied so callers can omit the key.
 */
export function validateSoilFunction(input) {
  if (input === undefined || input === null) {
    return null;
  }
  if (
    typeof input !== 'object' ||
    Array.isArray(input) ||
    (Object.getPrototypeOf(input) !== Object.prototype && Object.getPrototypeOf(input) !== null)
  ) {
    throw new Error('soil_function must be a plain object');
  }

  for (const key of Object.keys(input)) {
    if (!ALLOWED_KEYS.has(key)) {
      throw new Error(`Unsupported field in soil_function: ${key}`);
    }
  }

  const rawSource = hasOwn(input, 'source') ? input.source : undefined;
  const rawInf = hasOwn(input, 'infiltration_mm_hr') ? input.infiltration_mm_hr : undefined;
  const rawOm = hasOwn(input, 'organic_matter_percent') ? input.organic_matter_percent : undefined;
  const rawWh = hasOwn(input, 'water_holding_gal_acre_ft')
    ? input.water_holding_gal_acre_ft
    : undefined;
  const rawDates = hasOwn(input, 'measurement_dates') ? input.measurement_dates : undefined;
  const rawMethod = hasOwn(input, 'method') ? input.method : undefined;

  if (rawSource !== undefined && rawSource !== null && typeof rawSource !== 'string') {
    throw new Error('soil_function.source must be a string');
  }

  const hasAnyValue =
    rawInf != null ||
    rawOm != null ||
    rawWh != null ||
    rawDates != null ||
    (typeof rawSource === 'string' && rawSource.trim() !== '') ||
    rawMethod != null;

  if (!hasAnyValue) {
    return null;
  }

  const infiltration = validateNullableMetric(rawInf, 'infiltration_mm_hr');
  const organicMatter = validateNullableMetric(rawOm, 'organic_matter_percent', 100);
  const waterHolding = validateNullableMetric(rawWh, 'water_holding_gal_acre_ft');

  const hasNumeric = infiltration !== null || organicMatter !== null || waterHolding !== null;

  if (hasNumeric) {
    if (typeof rawSource !== 'string' || rawSource.trim().length === 0) {
      throw new Error('soil_function.source is required whenever any numeric field is non-null');
    }
  } else if (rawSource !== undefined && rawSource !== null && typeof rawSource !== 'string') {
    throw new Error('soil_function.source must be a string');
  }

  if (
    !Array.isArray(rawDates) ||
    rawDates.length !== 2 ||
    !isValidIsoDate(rawDates[0]) ||
    !isValidIsoDate(rawDates[1]) ||
    rawDates[1] < rawDates[0]
  ) {
    throw new Error(
      'soil_function.measurement_dates must be a chronological [ISO date, ISO date] pair'
    );
  }

  if (!VALID_METHODS.has(rawMethod)) {
    throw new Error('soil_function.method must be one of: measured, estimated');
  }

  return {
    infiltration_mm_hr: infiltration,
    organic_matter_percent: organicMatter,
    water_holding_gal_acre_ft: waterHolding,
    measurement_dates: [rawDates[0], rawDates[1]],
    source: typeof rawSource === 'string' ? rawSource.trim() : '',
    method: rawMethod,
  };
}

/**
 * Compute deterministic vadose sponge metrics from Tree Influence Zone area,
 * steady-state infiltration rate, and soil organic matter percentage.
 *
 * Conversions and literature basis:
 *   1. Area conversion: 1 m2 = 10.7639 sq ft; 1 acre = 4046.86 m2
 *   2. 1-inch (25.4 mm) storm event over TIZ: 25.4 L/m2 * 0.264172 US gal/L
 *   3. NRCS soil-water capacity estimate: each 1% SOM above 1% baseline holds
 *      approximately 20,000 US gallons/acre across the top 6 inches, scaled to TIZ acres.
 */
export function estimateSoilSpongeCapacity({
  tiz_area_m2 = 100,
  infiltration_mm_hr = 18,
  organic_matter_percent = 2.5,
} = {}) {
  const areaM2 = Number(tiz_area_m2);
  const infRate = Number(infiltration_mm_hr);
  const somPct = Number(organic_matter_percent);

  if (!Number.isFinite(areaM2) || areaM2 < 0) {
    throw new Error('tiz_area_m2 must be a finite number >= 0');
  }
  if (!Number.isFinite(infRate) || infRate < 0) {
    throw new Error('infiltration_mm_hr must be a finite number >= 0');
  }
  if (!Number.isFinite(somPct) || somPct < 0 || somPct > 100) {
    throw new Error('organic_matter_percent must be a finite number between 0 and 100');
  }

  const areaSqft = round2(areaM2 * SQFT_PER_M2);
  const stormCaptureLiters = areaM2 * MM_PER_INCH;
  const storm1InCaptureGallons = round1(stormCaptureLiters * GALLONS_PER_LITER);

  const somAboveBaseline = Math.max(0, somPct - 1.0);
  const tizAcres = areaM2 / M2_PER_ACRE;
  const somSpongeGallons = round1(
    somAboveBaseline * NRCS_GALLONS_PER_ACRE_PER_1PCT_SOM * tizAcres
  );

  const infiltrationClass =
    infRate < 15
      ? 'Compacted (< 15 mm/hr)'
      : infRate <= 50
      ? 'Moderate (15 to 50 mm/hr)'
      : 'Living Sponge (> 50 mm/hr)';

  return {
    tiz_area_m2: round2(areaM2),
    tiz_area_sqft: areaSqft,
    storm_1in_capture_gallons: storm1InCaptureGallons,
    som_sponge_capacity_gallons: somSpongeGallons,
    infiltration_mm_hr: round2(infRate),
    organic_matter_percent: round2(somPct),
    infiltration_class: infiltrationClass,
    estimate_basis:
      'NRCS soil-water capacity estimate (~20,000 gal/acre per 1% SOM above 1% across top 6 in; 25.4 mm storm capture over TIZ)',
  };
}
