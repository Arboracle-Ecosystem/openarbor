/**
 * Open Arbor Root-Level Measurement Unit System (web/pages/unit-system.js)
 * Provides field-first US Imperial (in, ft, sq ft, acres, cu yd, gal, lbs, in/hr)
 * and Metric SI (cm, m, m2, ha, m3, L, kg, mm/hr) formatting and root-level switching
 * across every Open Arbor surface while keeping canonical RCA_v2 assessment JSON
 * payloads 100% deterministic and unmodified.
 */

export const UNIT_STORAGE_KEY = 'openarbor-unit-system';

const r1 = (n) => Math.round(Number(n || 0) * 10) / 10;
const r2 = (n) => Math.round(Number(n || 0) * 100) / 100;

function escapeAttr(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Returns active unit system: 'imperial' (default for US field arborists) or 'metric'.
 */
export function getUnitSystem() {
  if (typeof document !== 'undefined' && document.documentElement?.dataset?.units) {
    const ds = document.documentElement.dataset.units;
    if (ds === 'imperial' || ds === 'metric') return ds;
  }
  if (typeof localStorage !== 'undefined') {
    try {
      const saved = localStorage.getItem(UNIT_STORAGE_KEY);
      if (saved === 'imperial' || saved === 'metric') return saved;
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }
  return 'imperial';
}

export function isImperialUnits(sys = getUnitSystem()) {
  return sys !== 'metric';
}

/**
 * Swap all pre-rendered [data-oa-imp][data-oa-met] elements in the DOM.
 */
export function applyStaticUnitSwaps(root = typeof document !== 'undefined' ? document : null, sys = getUnitSystem()) {
  if (!root || typeof root.querySelectorAll !== 'function') return;
  const imp = isImperialUnits(sys);
  root.querySelectorAll('[data-oa-imp][data-oa-met]').forEach((node) => {
    const nextText = imp ? node.getAttribute('data-oa-imp') : node.getAttribute('data-oa-met');
    if (nextText !== null && node.textContent !== nextText) {
      node.textContent = nextText;
    }
  });
}

/**
 * Updates active unit system, persists to localStorage, updates #oa-units-toggle,
 * swaps static [data-oa-imp] spans, and broadcasts 'oa:unitschange'.
 */
export function setUnitSystem(nextSys, persist = true) {
  const normalized = nextSys === 'metric' ? 'metric' : 'imperial';
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.dataset.units = normalized;
  }
  if (persist && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(UNIT_STORAGE_KEY, normalized);
    } catch {
      // Ignore storage errors
    }
  }

  if (typeof document !== 'undefined') {
    const btn = document.getElementById('oa-units-toggle');
    if (btn) {
      btn.textContent =
        normalized === 'imperial' ? 'Units: in / ft' : 'Units: cm / m';
    }
    applyStaticUnitSwaps(document, normalized);
  }

  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(
      new CustomEvent('oa:unitschange', { detail: { units: normalized } })
    );
  }
  return normalized;
}

/**
 * Build a progressive-enhancement HTML span whose default text is US Imperial + Metric
 * (readable with JS disabled) and whose primary/secondary order flips on oa:unitschange.
 */
export function dualUnitSpanHtml(impText, metText) {
  return `<span data-oa-imp="${escapeAttr(impText)}" data-oa-met="${escapeAttr(metText)}">${escapeAttr(impText)}</span>`;
}

// ============================================================================
// CONVERSION & DUAL-READOUT FORMATTERS
// ============================================================================

export function cmToIn(cm, decimals = 1) {
  const val = Number(cm || 0) / 2.54;
  return decimals === 2 ? r2(val) : r1(val);
}

export function inToCm(inches, decimals = 2) {
  const val = Number(inches || 0) * 2.54;
  return decimals === 1 ? r1(val) : r2(val);
}

export function mToFt(meters, decimals = 1) {
  const val = Number(meters || 0) / 0.3048;
  return decimals === 2 ? r2(val) : r1(val);
}

export function ftToM(feet, decimals = 2) {
  const val = Number(feet || 0) * 0.3048;
  return decimals === 1 ? r1(val) : r2(val);
}

export function sqmToSqft(sqm) {
  return Math.round(Number(sqm || 0) * 10.7639104);
}

export function sqftToSqm(sqft) {
  return r1(Number(sqft || 0) * 0.09290304);
}

export function m3ToCuYd(m3) {
  return r2(Number(m3 || 0) * 1.30795062);
}

export function litersToGal(liters) {
  return r1(Number(liters || 0) * 0.26417205);
}

export function galToLiters(gal) {
  return Math.round(Number(gal || 0) * 3.78541178);
}

export function litersToCuFt(liters) {
  return r1(Number(liters || 0) * 0.03531467);
}

export function kgToLbs(kg) {
  return r1(Number(kg || 0) * 2.20462262);
}

export function lbsToKg(lbs) {
  return r1(Number(lbs || 0) * 0.45359237);
}

export function mmHrToInHr(mmHr) {
  return r2(Number(mmHr || 0) / 25.4);
}

export function inHrToMmHr(inHr) {
  return r1(Number(inHr || 0) * 25.4);
}

/**
 * Diameter / thickness / depth dual readout from inches & cm (or from cm alone).
 */
export function fmtDualInCm(inches, cm = inToCm(inches, 1), sys = getUnitSystem()) {
  const inStr = `${r1(inches)} in`;
  const cmStr = `${r1(cm)} cm`;
  return isImperialUnits(sys) ? `${inStr} (${cmStr})` : `${cmStr} (${inStr})`;
}

export function fmtDualFromCm(cm, sys = getUnitSystem()) {
  return fmtDualInCm(cmToIn(cm, 1), cm, sys);
}

/**
 * Length / height / radius dual readout from feet & meters (or from meters alone).
 */
export function fmtDualFtM(feet, meters = ftToM(feet, 2), sys = getUnitSystem()) {
  const ftStr = `${r1(feet)} ft`;
  const mStr = `${r2(meters)} m`;
  return isImperialUnits(sys) ? `${ftStr} (${mStr})` : `${mStr} (${ftStr})`;
}

export function fmtDualFromMeters(meters, sys = getUnitSystem()) {
  const mVal = Number(meters || 0);
  const ftStr = `${mToFt(mVal, 1)} ft`;
  const mStr = `${r2(mVal)} m`;
  return isImperialUnits(sys) ? `${ftStr} (${mStr})` : `${mStr} (${ftStr})`;
}

/**
 * Area dual readout (sq ft <-> m2).
 */
export function fmtDualAreaSqftSqm(sqft, sqm = sqftToSqm(sqft), sys = getUnitSystem()) {
  const sfStr = `${Math.round(Number(sqft || 0)).toLocaleString('en-US')} sq ft`;
  const smStr = `${r1(sqm).toLocaleString('en-US')} m2`;
  return isImperialUnits(sys) ? `${sfStr} (${smStr})` : `${smStr} (${sfStr})`;
}

export function fmtDualAreaFromSqm(sqm, sys = getUnitSystem()) {
  return fmtDualAreaSqftSqm(sqmToSqft(sqm), sqm, sys);
}

/**
 * Parcel area dual readout (acres / sq ft <-> m2 / ha).
 */
export function fmtDualParcelFromSqm(sqm, sys = getUnitSystem()) {
  const sm = Math.round(Number(sqm || 0));
  const sqft = sqmToSqft(sm);
  const acres = r2(sm / 4046.8564224);
  if (isImperialUnits(sys)) {
    return `${acres} ac / ${sqft.toLocaleString('en-US')} sq ft (${sm.toLocaleString('en-US')} m2)`;
  }
  return `${sm.toLocaleString('en-US')} m2 (${acres} ac / ${sqft.toLocaleString('en-US')} sq ft)`;
}

/**
 * Bulk soil / compost / woodchip mulch volume (US field standard: cubic yards <-> m3).
 */
export function fmtDualSoilVolFromM3(m3, sys = getUnitSystem()) {
  const mVal = r2(m3);
  const ydVal = m3ToCuYd(mVal);
  const impStr = `${r1(ydVal)} cu yd`;
  const metStr = `${mVal} m3`;
  return isImperialUnits(sys) ? `${impStr} (${metStr})` : `${metStr} (${impStr})`;
}

/**
 * Dry biochar volume (US crews order in cubic-foot totes or gallons <-> liters).
 */
export function fmtDualBiocharFromLiters(liters, sys = getUnitSystem()) {
  const lVal = r1(liters);
  const cuFt = litersToCuFt(lVal);
  const gal = Math.round(litersToGal(lVal));
  const impStr = `${cuFt} cu ft / ${gal.toLocaleString('en-US')} gal`;
  const metStr = `${lVal.toLocaleString('en-US')} L`;
  return isImperialUnits(sys) ? `${impStr} (${metStr})` : `${metStr} (${impStr})`;
}

/**
 * Liquid stormwater / soil sponge volume (US gallons <-> liters).
 */
export function fmtDualGallons(gallons, suffix = '', sys = getUnitSystem()) {
  const gal = Math.round(Number(gallons || 0));
  const lit = galToLiters(gal);
  const impStr = `${gal.toLocaleString('en-US')} gal${suffix}`;
  const metStr = `${lit.toLocaleString('en-US')} L${suffix}`;
  return isImperialUnits(sys) ? `${impStr} (${metStr})` : `${metStr} (${impStr})`;
}

/**
 * Mass dual readout (lbs <-> kg).
 */
export function fmtDualMassFromKg(kg, sys = getUnitSystem()) {
  const kgVal = r1(kg);
  const lbVal = kgToLbs(kgVal);
  const impStr = `${lbVal.toLocaleString('en-US')} lbs`;
  const metStr = `${kgVal.toLocaleString('en-US')} kg`;
  return isImperialUnits(sys) ? `${impStr} (${metStr})` : `${metStr} (${impStr})`;
}

export function fmtDualMassFromLbs(lbs, suffix = '', sys = getUnitSystem()) {
  const lbVal = r1(lbs);
  const kgVal = lbsToKg(lbVal);
  const impStr = `${lbVal.toLocaleString('en-US')} lbs${suffix}`;
  const metStr = `${kgVal.toLocaleString('en-US')} kg${suffix}`;
  return isImperialUnits(sys) ? `${impStr} (${metStr})` : `${metStr} (${impStr})`;
}

/**
 * Soil infiltration rate (in/hr <-> mm/hr).
 */
export function fmtDualInfiltrationFromMmHr(mmHr, sys = getUnitSystem()) {
  const mmVal = r1(mmHr);
  const inVal = mmHrToInHr(mmVal);
  const impStr = `${inVal} in/hr`;
  const metStr = `${mmVal} mm/hr`;
  return isImperialUnits(sys) ? `${impStr} (${metStr})` : `${metStr} (${impStr})`;
}

/**
 * Bulk density (g/cm3 with lb/cu ft).
 */
export function fmtDualBulkDensity(gCm3, sys = getUnitSystem()) {
  const gVal = r2(gCm3);
  const lbCuFt = r1(gVal * 62.42796);
  return isImperialUnits(sys)
    ? `${lbCuFt} lb/cu ft (${gVal} g/cm3)`
    : `${gVal} g/cm3 (${lbCuFt} lb/cu ft)`;
}

/**
 * Pressure (psi <-> bar).
 */
export function fmtDualPressureFromPsi(psi, sys = getUnitSystem()) {
  const pVal = Math.round(Number(psi || 0));
  const barVal = r1(pVal * 0.0689476);
  return isImperialUnits(sys) ? `${pVal} psi (${barVal} bar)` : `${barVal} bar (${pVal} psi)`;
}
