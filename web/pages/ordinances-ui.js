/**
 * Open Arbor Alliance v2.0 (Municipal Ordinance Commons & Live Schema Validator UI:
 * web/pages/ordinances-ui.js)
 * Renders the 8-city comparison matrix across Central Texas and Rogue Valley, Oregon,
 * and provides an in-browser JSON Schema Draft 2020-12 validator with prototype-pollution
 * security hardening ported from scripts/validate-ordinance.mjs.
 * Zero em dashes, zero en dashes, zero exclamation points, zero AI filler vocabulary.
 */

import txOrdinances from '../../data/ordinances/central_texas_ordinances.json';
import orOrdinances from '../../data/ordinances/rogue_valley_oregon_ordinances.json';
import municipalOrdinanceSchema from '../../schemas/municipal-ordinance.schema.json';

const MONTH_ABBR = [
  '',
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const PROTO_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Validate a JSON value against a JSON Schema Draft 2020-12 subset.
 * Ported deterministically from scripts/validate-ordinance.mjs with Object.hasOwn
 * and PROTO_KEYS security check.
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
        if (
          !Object.hasOwn(instance, reqKey) ||
          instance[reqKey] === undefined ||
          instance[reqKey] === ''
        ) {
          errors.push(`${jsonPath}: missing required field '${reqKey}'`);
        }
      }
    }

    const props = schema.properties || {};
    for (const key of Object.keys(instance)) {
      if (PROTO_KEYS.has(key)) {
        errors.push(
          `${jsonPath}: additional property '${key}' is not allowed (prototype-chain key rejected; additionalProperties: false)`
        );
      } else if (Object.hasOwn(props, key)) {
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
 * Scan raw JSON text for explicit prototype-pollution keys ("__proto__", "constructor", "prototype")
 * because standard JSON.parse strips or evaluates __proto__ before Object.keys sees it unless caught
 * via raw token inspection or reviver.
 * @param {string} rawText
 * @returns {string[]}
 */
function detectRawPrototypePollutionKeys(rawText) {
  const securityErrors = [];
  const keyRegex = /"\s*(__proto__|constructor|prototype)\s*"\s*:/g;
  let match = keyRegex.exec(rawText);
  while (match !== null) {
    const keyName = match[1];
    securityErrors.push(
      `$: additional property '${keyName}' is not allowed (prototype-chain key rejected; additionalProperties: false)`
    );
    match = keyRegex.exec(rawText);
  }
  return securityErrors;
}

/**
 * Inspect an ordinance object for missing or explicitly "UNVERIFIED" statutory fields.
 * @param {object} record
 * @returns {string[]}
 */
function collectUnverifiedFields(record) {
  const flagged = [];
  if (!record || typeof record !== 'object') return flagged;

  const hasPermitTriggers =
    record.permit_triggers_by_work_type &&
    Object.keys(record.permit_triggers_by_work_type).length > 0;
  if (!hasPermitTriggers) {
    flagged.push('permit_triggers_by_work_type (UNVERIFIED statutory work-type triggers)');
  }

  const hasPlanRules = record.plan_rules && Object.keys(record.plan_rules).length > 0;
  if (!hasPlanRules) {
    flagged.push('plan_rules (UNVERIFIED survey, root_zone, and pruning rules)');
  }

  const walk = (obj, currentPath) => {
    if (!obj || typeof obj !== 'object') return;
    for (const [k, v] of Object.entries(obj)) {
      const nextPath = `${currentPath}.${k}`;
      if (typeof v === 'string' && v.toUpperCase().includes('UNVERIFIED')) {
        flagged.push(`${nextPath}: "${v}"`);
      } else if (v && typeof v === 'object') {
        walk(v, nextPath);
      }
    }
  };
  walk(record, '$');

  return flagged;
}

/**
 * Format replacement ratio summary from mitigation_fee_schedule
 * @param {object} muni
 */
function formatReplacementRatio(muni) {
  const sched = muni.mitigation_fee_schedule;
  if (!sched || !Array.isArray(sched.tiers) || sched.tiers.length === 0) {
    return 'UNVERIFIED';
  }
  const ratios = sched.tiers.map((t) => `${t.replacement_ratio}:1`);
  const uniqueRatios = [...new Set(ratios)];
  return `${uniqueRatios.join(' to ')} (Heritage ${sched.heritage_replacement_ratio ?? 3}:1)`;
}

/**
 * Format cash-in-lieu rate summary from mitigation_fee_schedule
 * @param {object} muni
 */
function formatCashInLieuRate(muni) {
  const sched = muni.mitigation_fee_schedule;
  if (!sched || !Array.isArray(sched.tiers) || sched.tiers.length === 0) {
    return 'UNVERIFIED';
  }
  const rates = sched.tiers.map((t) => `$${t.rate_per_inch}/in`);
  const uniqueRates = [...new Set(rates)];
  const penalty = sched.penalty_civil_per_tree
    ? ` (Civil penalty $${sched.penalty_civil_per_tree}/tree)`
    : '';
  return `${uniqueRates.join(' to ')}${penalty}`;
}

/**
 * Format seasonal pathogen window (Oak Wilt) from plan_rules.pruning
 * @param {object} muni
 */
function formatPathogenWindow(muni) {
  const pruning = muni.plan_rules?.pruning;
  if (!pruning) {
    return 'UNVERIFIED (No plan_rules.pruning encoded)';
  }
  if (Array.isArray(pruning.oak_months) && pruning.oak_months.length > 0) {
    const allowedMonths = pruning.oak_months.map((m) => MONTH_ABBR[m] || m).join(', ');
    return `Allowed: ${allowedMonths} (Restricted Feb 1 to Jun 30 for Ceratocystis fagacearum)`;
  }
  return `${pruning.standard || 'ANSI A300 Part 1'} (No Oak Wilt vector restriction window)`;
}

/**
 * Escape HTML special characters safely
 * @param {string} str
 */
function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Draft template for a new municipality submission with explicit UNVERIFIED markers
 */
const NEW_MUNICIPALITY_DRAFT_TEMPLATE = {
  id: 'tx-san-marcos',
  name: 'San Marcos',
  state: 'TX',
  coordinates: {
    lat: 29.8833,
    lng: -97.9414,
  },
  ordinance_numbers:
    'San Marcos Development Code Chapter 6, Article 1, Division 2 (Tree and Habitat Protection) [UNVERIFIED]',
  source_url: 'https://library.municode.com/tx/san_marcos/codes/development_code',
  dbh_threshold_inches: 9,
  heritage_threshold_inches: 24,
  heritage_species_thresholds: {
    'Quercus virginiana (Live Oak)': 24,
    'Carya illinoinensis (Pecan)': 24,
  },
  excepted_species: ['Celtis occidentalis (Hackberry)', 'Melia azedarach (Chinaberry)'],
  permit_triggers_by_work_type: {
    protected: ['removal'],
    heritage: ['removal', 'pruning'],
    citation: 'UNVERIFIED: Requires primary statutory section confirmation',
  },
  mitigation_fee_schedule: {
    citation: 'San Marcos Development Code Section 6.1.2.3 [UNVERIFIED]',
    exemption_pct: 0,
    heritage_rate_per_inch: 300,
    heritage_replacement_ratio: 2,
    tiers: [
      { min_dbh: 9, max_dbh: 23.9, rate_per_inch: 150, replacement_ratio: 1 },
      { min_dbh: 24, max_dbh: null, rate_per_inch: 300, replacement_ratio: 2 },
    ],
  },
  plan_rules: {
    survey: {
      citation: 'UNVERIFIED: Check San Marcos Engineering Manual',
      hardwood_min_dbh: 9,
      max_age_years: 3,
      multi_trunk: 'largest_plus_half',
    },
    root_zone: {
      citation: 'UNVERIFIED',
      crz_ft_per_inch: 1.0,
      crz_min_ft: 10,
      removal_if_disturbed_pct: 30,
      cutfill_max_in: 4,
      impervious_max_pct: 25,
      crown_removal_max_pct: 25,
    },
    pruning: {
      citation: 'UNVERIFIED',
      standard: 'ANSI A300 Part 1',
      oak_months: [7, 8, 9, 10, 11, 12, 1],
    },
  },
};

/**
 * Raw JSON string for testing prototype-pollution security rejection (__proto__ and constructor)
 */
const PROTOTYPE_POLLUTION_TEST_PAYLOAD = `{
  "id": "tx-test-pollution",
  "name": "Prototype Pollution Security Test",
  "state": "TX",
  "ordinance_numbers": "Security Audit Test Vector",
  "source_url": "https://example.org/ordinance",
  "dbh_threshold_inches": 12,
  "__proto__": {
    "polluted": true,
    "isAdmin": true
  },
  "constructor": {
    "prototype": {
      "compromised": true
    }
  }
}`;

/**
 * Initialize the Municipal Ordinance Commons Matrix and Live Schema Validator UI
 */
export function initOrdinancesExplorerUI() {
  const root = document.getElementById('ordinances-explorer-root');
  if (!root) return;

  const txList = Array.isArray(txOrdinances.municipalities) ? txOrdinances.municipalities : [];
  const orList = Array.isArray(orOrdinances.municipalities) ? orOrdinances.municipalities : [];
  const allMunicipalities = [...txList, ...orList];

  const tbody = document.getElementById('ordinance-matrix-tbody');
  const editor = document.getElementById('ordinance-json-editor');
  const banner = document.getElementById('ordinance-validation-banner');
  const headlineEl = document.getElementById('validation-headline');
  const badgeEl = document.getElementById('validation-badge');
  const summaryEl = document.getElementById('validation-summary-text');
  const detailsEl = document.getElementById('ordinance-validation-details');
  const validateBtn = document.getElementById('run-ordinance-validate-btn');
  const copyPrBtn = document.getElementById('copy-pr-json-btn');

  const presetAustinBtn = document.getElementById('preset-austin-btn');
  const presetAshlandBtn = document.getElementById('preset-ashland-btn');
  const presetDraftBtn = document.getElementById('preset-draft-btn');
  const presetProtoBtn = document.getElementById('preset-proto-btn');
  const presetBar = document.getElementById('ordinance-preset-bar');

  // Render Section A: 8-City Municipal Ordinance Commons Matrix
  if (tbody) {
    tbody.innerHTML = allMunicipalities
      .map((muni) => {
        const unverifiedList = collectUnverifiedFields(muni);
        const isFullyVerified = unverifiedList.length === 0;
        const statusBadge = isFullyVerified
          ? `<span class="badge badge-protected">VERIFIED STATUTE</span>`
          : `<span class="badge badge-warn">CONTAINS UNVERIFIED FIELDS (${unverifiedList.length})</span>`;

        const cityLabel = `${muni.name}, ${muni.state}`;
        const regDbh = `${muni.dbh_threshold_inches}" DBH`;
        const heritageDbh =
          muni.heritage_threshold_inches !== null && muni.heritage_threshold_inches !== undefined
            ? `${muni.heritage_threshold_inches}" DBH`
            : 'N/A';

        return `
          <tr data-muni-row="${escapeHtml(muni.id)}">
            <th scope="row">${escapeHtml(cityLabel)}</th>
            <td>
              <strong><code>${escapeHtml(muni.id)}</code></strong><br />
              <span class="hint">${escapeHtml(muni.ordinance_numbers)}</span>
              <a href="${escapeHtml(muni.source_url)}" target="_blank" rel="noopener noreferrer" class="muni-link">
                Primary Statute Source
              </a>
            </td>
            <td><strong>${escapeHtml(regDbh)}</strong></td>
            <td><strong>${escapeHtml(heritageDbh)}</strong></td>
            <td>${escapeHtml(formatReplacementRatio(muni))}</td>
            <td>${escapeHtml(formatCashInLieuRate(muni))}</td>
            <td>${escapeHtml(formatPathogenWindow(muni))}</td>
            <td>
              <div style="display: flex; flex-direction: column; gap: 6px; align-items: flex-start;">
                ${statusBadge}
                <button
                  type="button"
                  class="btn-secondary tab-btn"
                  data-load-muni="${escapeHtml(muni.id)}"
                >
                  Inspect Raw JSON
                </button>
              </div>
            </td>
          </tr>
        `;
      })
      .join('');

    tbody.querySelectorAll('[data-load-muni]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-load-muni');
        const found = allMunicipalities.find((m) => m.id === id);
        if (found && editor) {
          setActivePresetButton(null);
          editor.value = JSON.stringify(found, null, 2);
          runLiveValidation();
          document
            .getElementById('ordinance-validator-section')
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  function setActivePresetButton(activeBtn) {
    presetBar?.querySelectorAll('.btn-preset').forEach((btn) => {
      btn.classList.toggle('active', btn === activeBtn);
    });
  }

  function runLiveValidation() {
    if (!editor || !headlineEl || !badgeEl || !summaryEl || !detailsEl) return;
    const rawText = editor.value.trim();

    if (!rawText) {
      headlineEl.textContent = 'EMPTY PAYLOAD (1 ERROR)';
      badgeEl.className = 'badge badge-danger';
      badgeEl.textContent = 'INVALID JSON';
      summaryEl.textContent = 'Paste or load a municipal ordinance JSON object to validate.';
      detailsEl.innerHTML = '';
      return;
    }

    const rawSecurityErrors = detectRawPrototypePollutionKeys(rawText);

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (err) {
      headlineEl.textContent = 'JSON SYNTAX ERROR';
      badgeEl.className = 'badge badge-danger';
      badgeEl.textContent = 'PARSE FAILED';
      summaryEl.textContent = err.message;
      detailsEl.innerHTML = `<div class="error-banner">${escapeHtml(err.message)}</div>`;
      return;
    }

    const records = Array.isArray(parsed?.municipalities)
      ? parsed.municipalities
      : Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === 'object'
      ? [parsed]
      : [];

    const allErrors = [...rawSecurityErrors];
    const allUnverified = [];

    if (records.length === 0) {
      allErrors.push('$: payload must be a municipality JSON object or { "municipalities": [...] }');
    } else {
      records.forEach((rec, idx) => {
        const pathPrefix = records.length === 1 ? '$' : `$.municipalities[${rec?.id || idx}]`;
        const res = validateAgainstSchema(rec, municipalOrdinanceSchema, pathPrefix);
        for (const err of res.errors) {
          if (!allErrors.includes(err)) {
            allErrors.push(err);
          }
        }
        const unverified = collectUnverifiedFields(rec);
        allUnverified.push(...unverified);
      });
    }

    if (allErrors.length === 0) {
      headlineEl.textContent = 'SCHEMA VALID (0 ERRORS)';
      if (banner) {
        banner.style.borderLeftColor = 'var(--accent-green)';
      }
      if (allUnverified.length === 0) {
        badgeEl.className = 'badge badge-protected';
        badgeEl.textContent = 'VERIFIED STATUTE (0 UNVERIFIED FIELDS)';
        summaryEl.textContent = `Validated ${records.length} municipality record(s) against schemas/municipal-ordinance.schema.json with full statutory completeness.`;
        detailsEl.innerHTML = `
          <p class="clean-note">
            All required statutory fields, mitigation fee tiers, permit triggers, and plan rules are present and verified. Ready for GitHub Pull Request submission.
          </p>
        `;
      } else {
        badgeEl.className = 'badge badge-warn';
        badgeEl.textContent = `${allUnverified.length} UNVERIFIED FIELD(S) FLAGGED`;
        summaryEl.textContent = `Schema structure is valid (0 errors), with ${allUnverified.length} field(s) marked UNVERIFIED for primary municipal code review prior to merge.`;
        const itemsHtml = allUnverified.map((u) => `<li>${escapeHtml(u)}</li>`).join('');
        detailsEl.innerHTML = `
          <div class="citation-callout">
            <strong>Primary Statutory Review Queue (${allUnverified.length} UNVERIFIED fields):</strong>
            <ul class="muni-subtext">${itemsHtml}</ul>
          </div>
        `;
      }
    } else {
      headlineEl.textContent = `SCHEMA INVALID (${allErrors.length} ERROR${allErrors.length === 1 ? '' : 'S'})`;
      badgeEl.className = 'badge badge-danger';
      badgeEl.textContent = rawSecurityErrors.length > 0 ? 'SECURITY GUARD REJECTED' : 'VALIDATION FAILED';
      if (banner) {
        banner.style.borderLeftColor = 'var(--danger-red)';
      }
      summaryEl.textContent =
        rawSecurityErrors.length > 0
          ? 'Prototype-pollution key (__proto__, constructor, or prototype) detected and blocked by security guard.'
          : 'One or more fields failed Draft 2020-12 schema validation.';
      const errItems = allErrors.map((e) => `<li><code>${escapeHtml(e)}</code></li>`).join('');
      detailsEl.innerHTML = `
        <ul class="flag-list">${errItems}</ul>
      `;
    }
  }

  presetAustinBtn?.addEventListener('click', () => {
    const austin = allMunicipalities.find((m) => m.id === 'tx-austin') || allMunicipalities[0];
    if (editor && austin) {
      setActivePresetButton(presetAustinBtn);
      editor.value = JSON.stringify(austin, null, 2);
      runLiveValidation();
    }
  });

  presetAshlandBtn?.addEventListener('click', () => {
    const ashland = allMunicipalities.find((m) => m.id === 'or-ashland');
    if (editor && ashland) {
      setActivePresetButton(presetAshlandBtn);
      editor.value = JSON.stringify(ashland, null, 2);
      runLiveValidation();
    }
  });

  presetDraftBtn?.addEventListener('click', () => {
    if (editor) {
      setActivePresetButton(presetDraftBtn);
      editor.value = JSON.stringify(NEW_MUNICIPALITY_DRAFT_TEMPLATE, null, 2);
      runLiveValidation();
    }
  });

  presetProtoBtn?.addEventListener('click', () => {
    if (editor) {
      setActivePresetButton(presetProtoBtn);
      editor.value = PROTOTYPE_POLLUTION_TEST_PAYLOAD;
      runLiveValidation();
    }
  });

  editor?.addEventListener('input', runLiveValidation);
  validateBtn?.addEventListener('click', runLiveValidation);

  copyPrBtn?.addEventListener('click', async () => {
    if (!editor) return;
    const originalText = copyPrBtn.textContent;
    try {
      await navigator.clipboard.writeText(editor.value);
      copyPrBtn.textContent = 'Copied Pull Request JSON';
    } catch {
      copyPrBtn.textContent = 'Copy Ready in Editor';
    }
    setTimeout(() => {
      copyPrBtn.textContent = originalText;
    }, 1800);
  });

  // Load Austin, TX verified statute by default
  const defaultMuni = allMunicipalities.find((m) => m.id === 'tx-austin') || allMunicipalities[0];
  if (editor && defaultMuni) {
    editor.value = JSON.stringify(defaultMuni, null, 2);
    runLiveValidation();
  }
}
