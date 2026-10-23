#!/usr/bin/env node
/**
 * Open Arbor Municipal Ordinance Schema Validator (scripts/validate-ordinance.mjs)
 * Zero-dependency CLI that validates municipal tree ordinance JSON files against
 * schemas/municipal-ordinance.schema.json (JSON Schema Draft 2020-12 subset:
 * type, required, properties, additionalProperties, enum, const, minimum, maximum,
 * minLength, maxLength, pattern, format, items).
 *
 * Usage:
 *   node scripts/validate-ordinance.mjs data/ordinances/rogue_valley_oregon_ordinances.json
 *   node scripts/validate-ordinance.mjs data/ordinances/central_texas_ordinances.json data/ordinances/rogue_valley_oregon_ordinances.json
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const DEFAULT_SCHEMA_PATH = path.join(REPO_ROOT, 'schemas', 'municipal-ordinance.schema.json');
const DEFAULT_ORDINANCES_DIR = path.join(REPO_ROOT, 'data', 'ordinances');

/**
 * Validate a JSON value against a JSON Schema Draft 2020-12 subset.
 * @param {any} instance
 * @param {object} schema
 * @param {string} jsonPath
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateAgainstSchema(instance, schema, jsonPath = '$') {
  const errors = [];
  if (!schema || typeof schema !== 'object') {
    return { valid: true, errors };
  }

  // 1. Type check
  if (schema.type !== undefined) {
    const allowed = Array.isArray(schema.type) ? schema.type : [schema.type];
    const matchesType = (val, t) => {
      if (t === 'null') return val === null;
      if (t === 'array') return Array.isArray(val);
      if (t === 'object') return typeof val === 'object' && val !== null && !Array.isArray(val);
      if (t === 'integer') return typeof val === 'number' && Number.isInteger(val);
      if (t === 'number') return typeof val === 'number' && !Number.isNaN(val);
      return typeof val === t;
    };
    if (!allowed.some((t) => matchesType(instance, t))) {
      const actual =
        instance === null ? 'null' : Array.isArray(instance) ? 'array' : typeof instance;
      errors.push(`${jsonPath}: expected type ${allowed.join('|')}, got ${actual}`);
      return { valid: false, errors };
    }
  }

  if (instance === null || instance === undefined) {
    return { valid: errors.length === 0, errors };
  }

  // 2. const & enum
  if (schema.const !== undefined && instance !== schema.const) {
    errors.push(
      `${jsonPath}: expected const ${JSON.stringify(schema.const)}, got ${JSON.stringify(instance)}`
    );
  }
  if (Array.isArray(schema.enum) && !schema.enum.includes(instance)) {
    errors.push(
      `${jsonPath}: value ${JSON.stringify(instance)} not in enum [${schema.enum.join(', ')}]`
    );
  }

  // 3. Numeric constraints
  if (typeof instance === 'number') {
    if (schema.minimum !== undefined && instance < schema.minimum) {
      errors.push(`${jsonPath}: value ${instance} is below minimum ${schema.minimum}`);
    }
    if (schema.maximum !== undefined && instance > schema.maximum) {
      errors.push(`${jsonPath}: value ${instance} exceeds maximum ${schema.maximum}`);
    }
  }

  // 4. String constraints
  if (typeof instance === 'string') {
    if (schema.minLength !== undefined && instance.length < schema.minLength) {
      errors.push(
        `${jsonPath}: string length ${instance.length} is below minLength ${schema.minLength}`
      );
    }
    if (schema.maxLength !== undefined && instance.length > schema.maxLength) {
      errors.push(
        `${jsonPath}: string length ${instance.length} exceeds maxLength ${schema.maxLength}`
      );
    }
    if (schema.pattern !== undefined) {
      const re = new RegExp(schema.pattern);
      if (!re.test(instance)) {
        errors.push(`${jsonPath}: value "${instance}" does not match pattern ${schema.pattern}`);
      }
    }
    if (schema.format === 'uri') {
      if (!/^https?:\/\/\S+$/i.test(instance)) {
        errors.push(`${jsonPath}: value "${instance}" is not a valid HTTP/HTTPS URI`);
      }
    }
  }

  // 5. Array constraints
  if (Array.isArray(instance)) {
    if (schema.items && typeof schema.items === 'object') {
      instance.forEach((item, idx) => {
        const sub = validateAgainstSchema(item, schema.items, `${jsonPath}[${idx}]`);
        errors.push(...sub.errors);
      });
    }
  }

  // 6. Object constraints
  if (typeof instance === 'object' && !Array.isArray(instance)) {
    if (Array.isArray(schema.required)) {
      for (const reqKey of schema.required) {
        if (!(reqKey in instance) || instance[reqKey] === undefined || instance[reqKey] === '') {
          errors.push(`${jsonPath}: missing required field '${reqKey}'`);
        }
      }
    }

    const props = schema.properties || {};
    for (const key of Object.keys(instance)) {
      if (key in props) {
        const sub = validateAgainstSchema(instance[key], props[key], `${jsonPath}.${key}`);
        errors.push(...sub.errors);
      } else if (schema.additionalProperties === false) {
        errors.push(
          `${jsonPath}: additional property '${key}' is not allowed (additionalProperties: false)`
        );
      } else if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
        const sub = validateAgainstSchema(
          instance[key],
          schema.additionalProperties,
          `${jsonPath}.${key}`
        );
        errors.push(...sub.errors);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate a municipality file (either { municipalities: [...] }, an array, or a single record).
 * @param {string} filePath
 * @param {object} schema
 */
export function validateOrdinanceFile(filePath, schema) {
  const rawText = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(rawText);

  const records = Array.isArray(parsed?.municipalities)
    ? parsed.municipalities
    : Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === 'object'
    ? [parsed]
    : [];

  if (records.length === 0) {
    return {
      filePath,
      valid: false,
      records: [],
      errors: [`${filePath}: no municipality records found`],
    };
  }

  const recordReports = [];
  const allErrors = [];

  records.forEach((record, index) => {
    const label = record?.id || `record[${index}]`;
    const result = validateAgainstSchema(record, schema, `$.municipalities[${label}]`);
    const hasPlanRules = Boolean(record?.plan_rules && Object.keys(record.plan_rules).length > 0);
    const hasPermitTriggers = Boolean(
      record?.permit_triggers_by_work_type &&
        Object.keys(record.permit_triggers_by_work_type).length > 0
    );
    const hasFeeSchedule = Boolean(record?.mitigation_fee_schedule);

    recordReports.push({
      id: record?.id || null,
      name: record?.name || null,
      state: record?.state || null,
      valid: result.valid,
      errors: result.errors,
      completeness: {
        mitigation_fee_schedule: hasFeeSchedule,
        permit_triggers_by_work_type: hasPermitTriggers,
        plan_rules: hasPlanRules,
        tier: hasPlanRules && hasPermitTriggers ? 'Full_Rule_Record' : 'Threshold_And_Fee_Record',
      },
    });

    allErrors.push(...result.errors);
  });

  return {
    filePath,
    valid: allErrors.length === 0,
    records: recordReports,
    errors: allErrors,
  };
}

function main() {
  const args = process.argv.slice(2);
  const schema = JSON.parse(fs.readFileSync(DEFAULT_SCHEMA_PATH, 'utf8'));

  const targetFiles =
    args.length > 0
      ? args.map((p) => path.resolve(process.cwd(), p))
      : fs
          .readdirSync(DEFAULT_ORDINANCES_DIR)
          .filter((f) => f.endsWith('.json'))
          .sort()
          .map((f) => path.join(DEFAULT_ORDINANCES_DIR, f));

  let overallValid = true;
  let totalCities = 0;
  let fullRuleCities = 0;

  for (const target of targetFiles) {
    if (!fs.existsSync(target)) {
      console.error(`[FAIL] File not found: ${target}`);
      overallValid = false;
      continue;
    }

    let report;
    try {
      report = validateOrdinanceFile(target, schema);
    } catch (err) {
      console.error(`[FAIL] ${path.relative(REPO_ROOT, target)}: JSON parse error: ${err.message}`);
      overallValid = false;
      continue;
    }

    const relPath = path.relative(REPO_ROOT, target) || target;
    console.log(`=== Validating ${relPath} (${report.records.length} municipalities) ===`);

    for (const rec of report.records) {
      totalCities += 1;
      if (rec.completeness.tier === 'Full_Rule_Record') {
        fullRuleCities += 1;
      }
      if (rec.valid) {
        const unverifiedNotes = [];
        if (!rec.completeness.permit_triggers_by_work_type) {
          unverifiedNotes.push('permit_triggers_by_work_type: UNVERIFIED');
        }
        if (!rec.completeness.plan_rules) {
          unverifiedNotes.push('plan_rules: UNVERIFIED');
        }
        const suffix =
          unverifiedNotes.length > 0
            ? ` [${rec.completeness.tier}; ${unverifiedNotes.join(', ')}]`
            : ` [${rec.completeness.tier}]`;
        console.log(`  [PASS] ${rec.id} (${rec.name}, ${rec.state})${suffix}`);
      } else {
        overallValid = false;
        console.error(`  [FAIL] ${rec.id || 'unknown'} (${rec.name || 'unnamed'}):`);
        for (const err of rec.errors) {
          console.error(`    - ${err}`);
        }
      }
    }
  }

  console.log(
    `\nSummary: ${totalCities} municipality records validated (${fullRuleCities} Full_Rule_Record, ${
      totalCities - fullRuleCities
    } Threshold_And_Fee_Record). Status: ${overallValid ? 'VALID' : 'INVALID'}`
  );

  process.exit(overallValid ? 0 : 1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main();
}
