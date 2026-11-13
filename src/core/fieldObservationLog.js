/**
 * OpenArbor Core: Local-First, Zero-PII Longitudinal Field Observation Log Engine
 * Implements PII key blocking, email/phone/street-address scrubbing, 6-char Open Location Code
 * watershed cell coarsening (~1.1 km), visual-vs-instrument t/R provenance honesty, optional
 * soil_function validation, canonical SHA-256 sealing, and JSONL cohort export.
 *
 * Zero external dependencies; pure browser and Node.js ESM.
 */

import { computeCanonicalSha256, validateJsonSchema } from './rapEngine.js';
import { validateSoilFunction } from './soilFunction.js';

const round1 = (n) => Math.round(Number(n || 0) * 10) / 10;
const round2 = (n) => Math.round(Number(n || 0) * 100) / 100;
const round3 = (n) => Math.round(Number(n || 0) * 1000) / 1000;

const OLC_ALPHABET = '23456789CFGHJMPQRVWX';
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const POLLUTION_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

export const FORBIDDEN_PII_KEYS = new Set([
  'client_name',
  'owner_name',
  'homeowner_name',
  'customer_name',
  'full_name',
  'contact_name',
  'email',
  'client_email',
  'phone',
  'phone_number',
  'street_address',
  'address',
  'mailing_address',
  'parcel_id',
  'parcel_apn',
  'apn',
  'tax_lot',
]);

const EMAIL_DETECT_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const EMAIL_REPLACE_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_DETECT_RE = /(?:\+?1[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]\d{3}[\s.-]\d{4}\b/;
const PHONE_REPLACE_RE = /(?:\+?1[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]\d{3}[\s.-]\d{4}\b/g;
const STREET_REPLACE_RE =
  /\b\d{1,6}\s+(?:[NSEW]\.?\s+)?[A-Za-z0-9.-]+(?:\s+[A-Za-z0-9.-]+){0,3}\s+(?:St|Street|Ave|Avenue|Rd|Road|Blvd|Boulevard|Dr|Drive|Ln|Lane|Ct|Court|Way|Pl|Place|Pkwy|Parkway|Cir|Circle|Ter|Terrace|Trl|Trail)\b\.?/gi;

const ALLOWED_DECAY_METHODS = new Set([
  'visual_only_unmeasured',
  'resistograph',
  'sonic_tomography',
]);

const ALLOWED_STAGES = new Set([
  'diagnostic_only',
  'stage_1_stabilize',
  'stage_2_soil_remediation',
  'stage_3_guild_and_monitoring',
]);

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

/**
 * Coarsen an Open Location Code (Plus Code) to a 6-character watershed/neighborhood grid cell
 * padded with '00+' (~1.1 km resolution), stripping exact property-level coordinates.
 *
 * @param {string} code 10-to-15 char Open Location Code (e.g., '8624PG84+2V')
 * @returns {string} Coarsened 6-char + '00+' Plus Code (e.g., '8624PG00+')
 */
export function coarsenPlusCode(code) {
  if (typeof code !== 'string') {
    throw new Error('INVALID_PLUS_CODE: plus_code_global must be a string');
  }
  const stripped = code.trim().toUpperCase().replace(/\+/g, '').replace(/0+$/g, '');
  if (stripped.length < 6) {
    throw new Error(`INVALID_PLUS_CODE: "${code}" has fewer than 6 Open Location Code characters`);
  }
  const prefix6 = stripped.slice(0, 6);
  for (const ch of prefix6) {
    if (!OLC_ALPHABET.includes(ch)) {
      throw new Error(`INVALID_PLUS_CODE: "${code}" contains invalid OLC character "${ch}"`);
    }
  }
  return `${prefix6}00+`;
}

/**
 * Scrub common email, phone number, and street address strings from free-text field notes.
 *
 * @param {string} text
 * @returns {string}
 */
export function redactPotentialPii(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(EMAIL_REPLACE_RE, '[REDACTED_EMAIL]')
    .replace(PHONE_REPLACE_RE, '[REDACTED_PHONE]')
    .replace(STREET_REPLACE_RE, '[REDACTED_ADDRESS]')
    .trim();
}

/**
 * Recursively reject forbidden PII keys, prototype pollution keys, and unredacted emails/phones.
 * Throws descriptive errors prefixed with PII_KEY_FORBIDDEN or PII_PATTERN_DETECTED.
 *
 * @param {any} value
 * @param {string} path
 */
export function assertZeroClientPii(value, path = '$') {
  if (value === null || value === undefined) return;
  if (typeof value === 'string') {
    if (EMAIL_DETECT_RE.test(value)) {
      throw new Error(`PII_PATTERN_DETECTED at ${path}: unredacted email address detected`);
    }
    if (PHONE_DETECT_RE.test(value)) {
      throw new Error(`PII_PATTERN_DETECTED at ${path}: unredacted phone number detected`);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, idx) => assertZeroClientPii(item, `${path}[${idx}]`));
    return;
  }
  if (typeof value === 'object') {
    for (const key of Object.getOwnPropertyNames(value)) {
      if (POLLUTION_KEYS.has(key)) {
        throw new Error(`PII_KEY_FORBIDDEN at ${path}.${key}: prototype pollution key is forbidden`);
      }
      if (FORBIDDEN_PII_KEYS.has(key.toLowerCase())) {
        throw new Error(`PII_KEY_FORBIDDEN at ${path}.${key}: client PII key "${key}" is forbidden`);
      }
      assertZeroClientPii(value[key], `${path}.${key}`);
    }
  }
}

function assertOnlyForbiddenKeysCheck(value, path = '$') {
  if (value === null || value === undefined || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach((item, idx) => assertOnlyForbiddenKeysCheck(item, `${path}[${idx}]`));
    return;
  }
  for (const key of Object.getOwnPropertyNames(value)) {
    if (POLLUTION_KEYS.has(key)) {
      throw new Error(`PII_KEY_FORBIDDEN at ${path}.${key}: prototype pollution key is forbidden`);
    }
    if (FORBIDDEN_PII_KEYS.has(key.toLowerCase())) {
      throw new Error(`PII_KEY_FORBIDDEN at ${path}.${key}: client PII key "${key}" is forbidden`);
    }
    if (key !== 'field_notes') {
      assertOnlyForbiddenKeysCheck(value[key], `${path}.${key}`);
    }
  }
}

/**
 * Create a signed (SHA-256), schema-valid, zero-PII RAP Field Observation Log record.
 *
 * @param {object} assessment RAP_v2 or RCA_v2 assessment payload
 * @param {object} options Optional metadata (internal_decay_method, measured_t_over_r, stage_executed, field_notes, longitudinal_outcomes, schema)
 * @returns {object} Verified RAP_Field_Observation_v1 record
 */
export function createFieldObservationRecord(assessment, options = {}) {
  if (!assessment || typeof assessment !== 'object' || Array.isArray(assessment)) {
    throw new Error('assessment must be a non-null object');
  }
  const opts = options && typeof options === 'object' ? options : {};

  // Reject any forbidden PII property names up front (including inside options or assessment)
  assertOnlyForbiddenKeysCheck(opts, 'options');
  assertOnlyForbiddenKeysCheck(assessment, 'assessment');

  const structural = assessment.structural_baseline || {};
  const rhizosphere = assessment.rhizosphere_and_root_collar || {};
  const soil = assessment.soil_and_microbiome_baseline || {};
  const guild = assessment.understory_and_guild_prescription || {};
  const disp = structural.municipal_permit_disposition || {};

  const dbhCm = Number(structural.dbh_cm);
  if (!Number.isFinite(dbhCm) || dbhCm <= 0) {
    throw new Error('structural_baseline.dbh_cm must be > 0');
  }
  const dbhInches = round2(dbhCm / 2.54);

  const recordedDate = String(
    opts.recorded_date || structural.assessment_date || new Date().toISOString().slice(0, 10)
  );
  if (!ISO_DATE_RE.test(recordedDate)) {
    throw new Error(`recorded_date must be YYYY-MM-DD, got "${recordedDate}"`);
  }

  let internalDecayMethod = opts.internal_decay_method;
  if (!internalDecayMethod) {
    internalDecayMethod =
      structural.sonic_tomography_or_resistograph_uri &&
      String(structural.sonic_tomography_or_resistograph_uri).trim().length > 0
        ? 'sonic_tomography'
        : 'visual_only_unmeasured';
  }
  if (!ALLOWED_DECAY_METHODS.has(internalDecayMethod)) {
    throw new Error(
      `internal_decay_method must be one of [${[...ALLOWED_DECAY_METHODS].join(', ')}]`
    );
  }

  let measuredTOverR = null;
  if (internalDecayMethod !== 'visual_only_unmeasured') {
    const rawRatio = opts.measured_t_over_r ?? structural.sound_shell_thickness_ratio_t_over_r;
    const numericRatio = Number(rawRatio);
    if (!Number.isFinite(numericRatio) || numericRatio < 0 || numericRatio > 1) {
      throw new Error(
        `measured_t_over_r must be a number between 0 and 1 when internal_decay_method is "${internalDecayMethod}"`
      );
    }
    measuredTOverR = round3(numericRatio);
  }

  const stageExecuted = opts.stage_executed || 'stage_1_stabilize';
  if (!ALLOWED_STAGES.has(stageExecuted)) {
    throw new Error(`stage_executed must be one of [${[...ALLOWED_STAGES].join(', ')}]`);
  }

  const rawSoilFunc = opts.soil_function !== undefined ? opts.soil_function : assessment.soil_function;
  const validatedSoilFunction = rawSoilFunc ? validateSoilFunction(rawSoilFunc) : null;

  const coarsenedCode = coarsenPlusCode(
    String(opts.plus_code_global || structural.plus_code_global || '8624M38F+4X')
  );

  const airspadePsi = Number(
    opts.airspade_psi ?? rhizosphere.airspade_radial_trenching_geometry?.operating_pressure_psi ?? 150
  );

  const defaultAmendments = [];
  if (Number(guild.biochar_volume_liters) > 0) defaultAmendments.push('biochar');
  if (Number(guild.compost_volume_cubic_m) > 0) defaultAmendments.push('fungal_compost');
  if (Number(guild.humate_mass_kg) > 0) defaultAmendments.push('humate');
  if (Number(guild.mulch_depth_cm) > 0) defaultAmendments.push('ramial_woodchip_mulch');
  if (Array.isArray(guild.native_companion_species_guild) && guild.native_companion_species_guild.length > 0) {
    defaultAmendments.push('native_understory_guild');
  }

  const amendmentsApplied = Array.isArray(opts.amendments_applied)
    ? opts.amendments_applied.map((s) => redactPotentialPii(String(s)))
    : defaultAmendments;

  const sanitizedNotes = redactPotentialPii(
    String(opts.field_notes || 'Baseline root-collar and soil observation recorded locally under zero-PII protocol.')
  );

  const outcomes = Array.isArray(opts.longitudinal_outcomes)
    ? opts.longitudinal_outcomes.map((o) => ({
        checkpoint_year: Number.isInteger(o.checkpoint_year) ? o.checkpoint_year : 0,
        date: String(o.date || recordedDate),
        twig_extension_cm: o.twig_extension_cm == null ? null : round1(o.twig_extension_cm),
        canopy_dieback_pct: o.canopy_dieback_pct == null ? null : round1(o.canopy_dieback_pct),
        infiltration_mm_hr: o.infiltration_mm_hr == null ? null : round1(o.infiltration_mm_hr),
        survival_status: String(o.survival_status || 'Stable'),
      }))
    : [
        {
          checkpoint_year: 0,
          date: recordedDate,
          twig_extension_cm: opts.twig_extension_cm == null ? null : round1(opts.twig_extension_cm),
          canopy_dieback_pct: opts.canopy_dieback_pct == null ? null : round1(opts.canopy_dieback_pct),
          infiltration_mm_hr: soil.infiltration_rate_mm_hr == null ? null : round1(soil.infiltration_rate_mm_hr),
          survival_status: String(opts.survival_status || 'Stable'),
        },
      ];

  const designation = opts.practitioner_designation === 'Open_Steward' ? 'Open_Steward' : 'RAPPER';
  const protocolVersion =
    assessment.schema_version === 'RAP_v1' || assessment.schema_version === 'RCA_v1'
      ? 'RAP_v1'
      : 'RAP_v2';

  const treeTag = String(structural.tree_tag || 'RAP-TREE-01');
  const municipalityId = String(opts.municipality_id || disp.jurisdiction_id || 'local-jurisdiction');

  const bodyWithoutHash = {
    schema_version: 'RAP_Field_Observation_v1',
    observation_id: String(
      opts.observation_id || `obs-${treeTag.toLowerCase().replace(/[^a-z0-9-]+/g, '-')}-${recordedDate}`
    ),
    recorded_date: recordedDate,
    protocol_version: protocolVersion,
    practitioner_designation: designation,
    municipality_id: municipalityId,
    coarsened_plus_code: coarsenedCode,
    baseline: {
      tree_tag: treeTag,
      species_scientific: String(structural.species_scientific || 'Quercus spp.'),
      species_common: String(structural.species_common || 'Oak'),
      dbh_cm: round1(dbhCm),
      dbh_inches: dbhInches,
      internal_decay_method: internalDecayMethod,
      measured_t_over_r: measuredTOverR,
      root_flare_burial_depth_cm: round1(rhizosphere.root_flare_burial_depth_cm ?? 0),
      stem_girdling_root_severity: String(rhizosphere.stem_girdling_root_severity || 'None'),
      soil_function: validatedSoilFunction,
    },
    intervention: {
      stage_executed: stageExecuted,
      airspade_psi: round1(Math.max(0, Math.min(250, airspadePsi))),
      amendments_applied: amendmentsApplied,
      field_notes: sanitizedNotes,
    },
    longitudinal_outcomes: outcomes,
    privacy_attestation: {
      zero_client_pii: true,
      plus_code_coarsened_to_watershed_cell: true,
    },
  };

  if (opts.practitioner_credential && String(opts.practitioner_credential).trim().length >= 2) {
    bodyWithoutHash.practitioner_credential = redactPotentialPii(String(opts.practitioner_credential).trim());
  }

  // Final strict zero-PII sweep across the entire serialized observation object
  assertZeroClientPii(bodyWithoutHash, 'observation');

  const canonical_sha256 = computeCanonicalSha256(bodyWithoutHash);
  const record = {
    ...bodyWithoutHash,
    canonical_sha256,
  };

  if (opts.schema) {
    const schemaCheck = validateJsonSchema(record, opts.schema);
    if (!schemaCheck.valid) {
      throw new Error(`Observation schema validation failed: ${schemaCheck.errors.join('; ')}`);
    }
  }

  return record;
}

/**
 * Verify a RAP Field Observation Log record for zero-PII compliance, measurement provenance
 * honesty, optional JSON Schema compliance, and canonical SHA-256 integrity.
 *
 * @param {object} record
 * @param {object|null} schema
 * @returns {{valid: boolean, errors: string[], expected_sha256: string|null}}
 */
export function verifyFieldObservationRecord(record, schema = null) {
  const errors = [];
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    return {
      valid: false,
      errors: ['Observation record must be a non-null plain object'],
      expected_sha256: null,
    };
  }

  try {
    assertZeroClientPii(record, 'observation');
  } catch (err) {
    errors.push(err.message);
  }

  if (schema) {
    const schemaRes = validateJsonSchema(record, schema);
    if (!schemaRes.valid) {
      errors.push(...schemaRes.errors);
    }
  }

  const base = record.baseline || {};
  if (base.internal_decay_method === 'visual_only_unmeasured' && base.measured_t_over_r !== null) {
    errors.push(
      'PROVENANCE_VIOLATION: visual_only_unmeasured observation must record measured_t_over_r as null'
    );
  }
  if (
    (base.internal_decay_method === 'resistograph' || base.internal_decay_method === 'sonic_tomography') &&
    (typeof base.measured_t_over_r !== 'number' || !Number.isFinite(base.measured_t_over_r))
  ) {
    errors.push(
      `PROVENANCE_VIOLATION: ${base.internal_decay_method} observation requires a numeric measured_t_over_r`
    );
  }

  if (typeof record.coarsened_plus_code !== 'string' || !/^[23456789CFGHJMPQRVWX]{6}00\+$/.test(record.coarsened_plus_code)) {
    errors.push('PRIVACY_VIOLATION: coarsened_plus_code must be coarsened to 6 grid chars + 00+');
  }

  const cloneWithoutHash = Object.create(null);
  for (const key of Object.keys(record)) {
    if (key !== 'canonical_sha256' && !POLLUTION_KEYS.has(key)) {
      cloneWithoutHash[key] = record[key];
    }
  }
  const expected_sha256 = computeCanonicalSha256(cloneWithoutHash);
  if (record.canonical_sha256 !== expected_sha256) {
    errors.push(
      `SHA256_MISMATCH: expected canonical_sha256 "${expected_sha256}", got "${record.canonical_sha256}"`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    expected_sha256,
  };
}

/**
 * Validate every record in a cohort and serialize deterministically as newline-delimited JSON (.jsonl).
 *
 * @param {Array<object>} records
 * @param {object|null} schema
 * @returns {string}
 */
export function serializeObservationCohortJsonl(records, schema = null) {
  if (!Array.isArray(records)) {
    throw new Error('records must be an array');
  }
  const lines = records.map((rec, idx) => {
    const check = verifyFieldObservationRecord(rec, schema);
    if (!check.valid) {
      throw new Error(`Invalid observation record at index ${idx}: ${check.errors.join('; ')}`);
    }
    return JSON.stringify(rec);
  });
  return lines.length > 0 ? `${lines.join('\n')}\n` : '';
}

/**
 * Compute summary progress metrics for the local practitioner observation cohort.
 *
 * @param {Array<object>} records
 * @param {number} targetCohortSize
 * @returns {object}
 */
export function summarizeObservationCohort(records, targetCohortSize = 10) {
  const safeRecords = Array.isArray(records) ? records : [];
  const target = Math.max(1, Number(targetCohortSize) || 10);
  const count = safeRecords.length;
  const instrumentVerifiedCount = safeRecords.filter(
    (r) =>
      r?.baseline?.internal_decay_method === 'resistograph' ||
      r?.baseline?.internal_decay_method === 'sonic_tomography'
  ).length;
  const visualOnlyCount = safeRecords.filter(
    (r) => r?.baseline?.internal_decay_method === 'visual_only_unmeasured'
  ).length;
  const municipalities = [...new Set(safeRecords.map((r) => r?.municipality_id).filter(Boolean))];
  const species = [...new Set(safeRecords.map((r) => r?.baseline?.species_scientific).filter(Boolean))];

  return {
    count,
    target_cohort_size: target,
    progress_pct: Math.min(100, round1((count / target) * 100)),
    instrument_verified_count: instrumentVerifiedCount,
    visual_only_count: visualOnlyCount,
    municipalities,
    species,
  };
}

export const ALLOWED_FIELD_OBSERVATION_DECAY_METHODS = [...ALLOWED_DECAY_METHODS];
export const ALLOWED_FIELD_OBSERVATION_STAGES = [...ALLOWED_STAGES];
export const hasOwnProp = hasOwn;
