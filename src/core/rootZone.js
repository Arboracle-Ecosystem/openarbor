/**
 * OpenArbor Core — Root Zone, TPZ, SRZ, and Multi-Stem DBH Engine
 * Standards: ISA BMP (Managing Trees During Construction), ANSI A300 (Part 5),
 * AS 4970-2009 (Protection of trees on development sites), BS 5837:2012.
 * Zero proprietary dependencies.
 */

const round2 = (n) => Math.round(Number(n || 0) * 100) / 100;
const round1 = (n) => Math.round(Number(n || 0) * 10) / 10;

/**
 * Calculate Critical Root Zone (CRZ) radius and area in imperial and metric units.
 * @param {number} dbhInches - Diameter at Breast Height (4.5 ft / 1.37 m) in inches
 * @param {number} multiplier - Feet of radius per inch of DBH (default: 1.0 ft/in)
 * @param {number} minRadiusFeet - Optional municipal minimum CRZ radius in feet (default: 0)
 */
export function calculateCRZ(dbhInches, multiplier = 1.0, minRadiusFeet = 0) {
  if (!dbhInches || dbhInches <= 0) {
    return {
      radius_feet: 0,
      radius_meters: 0,
      area_sqft: 0,
      area_sqm: 0,
      half_radius_feet: 0,
      half_area_sqft: 0,
      quarter_radius_feet: 0,
      quarter_area_sqft: 0,
    };
  }

  const radiusFeet = Math.max(Number(minRadiusFeet) || 0, dbhInches * multiplier);
  const radiusMeters = radiusFeet * 0.3048;
  const areaSqft = Math.PI * radiusFeet ** 2;
  const areaSqm = Math.PI * radiusMeters ** 2;

  const halfRadiusFeet = radiusFeet / 2;
  const halfAreaSqft = Math.PI * halfRadiusFeet ** 2;

  const quarterRadiusFeet = radiusFeet / 4;
  const quarterAreaSqft = Math.PI * quarterRadiusFeet ** 2;

  return {
    radius_feet: round2(radiusFeet),
    radius_meters: round2(radiusMeters),
    area_sqft: round2(areaSqft),
    area_sqm: round2(areaSqm),
    half_radius_feet: round2(halfRadiusFeet),
    half_area_sqft: round2(halfAreaSqft),
    quarter_radius_feet: round2(quarterRadiusFeet),
    quarter_area_sqft: round2(quarterAreaSqft),
  };
}

/**
 * Calculate Tree Protection Zone (TPZ) radius and area across international standards.
 * @param {number} dbh - Diameter at Breast Height
 * @param {'inches'|'cm'} unit
 * @param {'US_1_1'|'US_1_1.5'|'US_1_18'|'Australian_AS4970'|'UK_BS5837'|'Custom'} standard
 * @param {number|null} customMultiplier
 */
export function calculateTPZ(dbh, unit = 'inches', standard = 'US_1_1', customMultiplier = null) {
  if (!dbh || dbh <= 0) {
    return { radius_feet: 0, radius_meters: 0, area_sqft: 0, area_sqm: 0, formula_used: 'N/A' };
  }

  const dbhInches = unit === 'cm' ? dbh / 2.54 : dbh;
  const dbhCm = unit === 'inches' ? dbh * 2.54 : dbh;
  let radiusMeters = 0;
  let formulaUsed = '';

  switch (standard) {
    case 'US_1_1':
      radiusMeters = dbhInches * 1.0 * 0.3048;
      formulaUsed = 'US Standard (1:1): 1.0 ft radius per inch DBH';
      break;
    case 'US_1_1.5':
      radiusMeters = dbhInches * 1.5 * 0.3048;
      formulaUsed = 'US Mature/Sensitive Standard (1:1.5): 1.5 ft radius per inch DBH';
      break;
    case 'US_1_18':
      radiusMeters = ((dbhInches * 18) / 12) * 0.3048;
      formulaUsed = 'US Standard (1:18): 18 in radius per inch DBH';
      break;
    case 'Australian_AS4970':
      radiusMeters = Math.max(2, Math.min((dbhCm * 12) / 100, 15));
      formulaUsed = 'Australian AS 4970 (12x DBH in cm, clamped 2m to 15m)';
      break;
    case 'UK_BS5837':
      radiusMeters = Math.min(dbhCm * 0.12, 15);
      formulaUsed = 'UK BS 5837:2012 (12x DBH, capped at 15m)';
      break;
    case 'Custom': {
      const mult = customMultiplier && customMultiplier > 0 ? customMultiplier : 1.0;
      radiusMeters = dbhInches * mult * 0.3048;
      formulaUsed = `Custom (${mult}:1 ft per inch DBH)`;
      break;
    }
    default:
      radiusMeters = dbhInches * 0.3048;
      formulaUsed = 'Default US (1:1)';
  }

  const radiusFeet = radiusMeters / 0.3048;
  return {
    radius_feet: round2(radiusFeet),
    radius_meters: round2(radiusMeters),
    area_sqft: round2(Math.PI * radiusFeet ** 2),
    area_sqm: round2(Math.PI * radiusMeters ** 2),
    formula_used: formulaUsed,
  };
}

/**
 * Calculate Structural Root Zone (SRZ) radius for mechanical windthrow stability (AS 4970 / Mattheck).
 * @param {number|null} drfInches - Diameter at Root Flare in inches
 * @param {number|null} dbhInches - Fallback DBH in inches (scaled by 1.1x)
 */
export function calculateSRZ(drfInches = null, dbhInches = null) {
  const diameterInches = drfInches || (dbhInches ? dbhInches * 1.1 : 0);
  if (!diameterInches || diameterInches <= 0) {
    return { radius_feet: 0, radius_meters: 0, area_sqft: 0, area_sqm: 0, formula_used: 'N/A' };
  }

  const diameterMeters = diameterInches * 0.0254;
  const rawSrzMeters = Math.pow(diameterMeters * 50, 0.42) * 0.64;
  const srzMeters = diameterMeters < 0.15 ? 1.5 : rawSrzMeters;
  const radiusFeet = srzMeters / 0.3048;

  return {
    radius_feet: round2(radiusFeet),
    radius_meters: round2(srzMeters),
    area_sqft: round2(Math.PI * radiusFeet ** 2),
    area_sqm: round2(Math.PI * srzMeters ** 2),
    formula_used: 'AS 4970 Structural Root Zone: (D_m * 50)^0.42 * 0.64',
  };
}

/**
 * Multi-stem DBH aggregation supporting both Quadratic Mean (ISA / CTLA root-sum-of-squares)
 * and Municipal "Largest Stem + 50% of Additional Stems" (e.g., Liberty Hill UDC / Austin LDC).
 * @param {number[]} stemsInches
 * @param {'quadratic'|'largest_plus_half'|'sum'} method
 */
export function calculateMultiStemDBH(stemsInches, method = 'quadratic') {
  const valid = (stemsInches || []).map(Number).filter((d) => d > 0);
  if (valid.length === 0) return 0;
  if (valid.length === 1) return round1(valid[0]);

  if (method === 'largest_plus_half') {
    const sorted = [...valid].sort((a, b) => b - a);
    return round1(sorted[0] + sorted.slice(1).reduce((sum, d) => sum + d / 2, 0));
  }

  if (method === 'sum') {
    return round1(valid.reduce((sum, d) => sum + d, 0));
  }

  // Default: Quadratic root-sum-of-squares (sqrt(d1^2 + d2^2 + ...))
  const sumSquares = valid.reduce((sum, d) => sum + d * d, 0);
  return round1(Math.sqrt(sumSquares));
}

/**
 * Union area (sq ft) of overlapping circular root zones on a site using 1-ft spatial grid sampling.
 * Prevents double-counting overlapping root zones when estimating compost, mulch, or pneumatic air-tilling.
 */
export function unionRootZoneArea(trees) {
  const FT_PER_DEG_LAT = 364000;
  const located = (trees || []).filter((r) => r.lat != null && r.lng != null && (r.tpz_ft || r.crz_ft) > 0);
  const unlocated = (trees || [])
    .filter((r) => !located.includes(r))
    .reduce((s, r) => s + (r.crz_area || Math.PI * (r.crz_ft || r.tpz_ft || 0) ** 2), 0);

  if (!located.length) return { area_sqft: Math.round(unlocated), overlap_saved_sqft: 0 };

  const lat0 = located[0].lat;
  const ftLng = FT_PER_DEG_LAT * Math.cos((lat0 * Math.PI) / 180);
  const pts = located.map((r) => ({
    x: (r.lng - located[0].lng) * ftLng,
    y: (r.lat - lat0) * FT_PER_DEG_LAT,
    rad: r.crz_ft || r.tpz_ft,
  }));

  const minX = Math.min(...pts.map((p) => p.x - p.rad));
  const maxX = Math.max(...pts.map((p) => p.x + p.rad));
  const minY = Math.min(...pts.map((p) => p.y - p.rad));
  const maxY = Math.max(...pts.map((p) => p.y + p.rad));

  let cells = 0;
  for (let x = minX; x < maxX; x += 1) {
    for (let y = minY; y < maxY; y += 1) {
      if (pts.some((p) => (x + 0.5 - p.x) ** 2 + (y + 0.5 - p.y) ** 2 <= p.rad ** 2)) {
        cells += 1;
      }
    }
  }

  const summed = located.reduce((s, r) => s + Math.PI * pRad(r) ** 2, 0);
  return {
    area_sqft: Math.round(cells + unlocated),
    overlap_saved_sqft: Math.max(0, Math.round(summed - cells)),
  };
}

function pRad(r) {
  return r.crz_ft || r.tpz_ft || 0;
}
