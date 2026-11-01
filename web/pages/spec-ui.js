/**
 * Open Arbor v2.0 Specification Viewer, Landing Quick-Calculator & Theme Controller (web/pages/spec-ui.js)
 * Initializes:
 *   1. Shared Sunlight Field / Canopy Dark color-scheme toggle (#oa-theme-toggle)
 *   2. Root Landing Portal Instant Root-Zone & Holobiont Quick-Calculator (#landing-quick-calc)
 *   3. RCA-Spec v2.0 & Municipal Ordinance Interactive Schema Inspector (#spec-viewer-root)
 */

import {
  calculateCRZ,
  calculateTPZ,
  calculateSRZ,
} from '../../src/core/rootZone.js';

import {
  evaluateTreeInventory,
  permitDetermination,
  computeMitigationPlan,
  statusLabel,
} from '../../src/core/ordinanceEngine.js';

import {
  calculateTreeEcosystemBenefits,
} from '../../src/core/ecosystemBenefits.js';

import {
  computeHolobiontValuation,
} from '../../src/core/rcaEngine.js';

import txOrdinances from '../../data/ordinances/central_texas_ordinances.json';
import orOrdinances from '../../data/ordinances/rogue_valley_oregon_ordinances.json';
import rcaAssessmentSchema from '../../schemas/rca_assessment.schema.json';
import municipalOrdinanceSchema from '../../schemas/municipal-ordinance.schema.json';

const ALL_MUNICIPALITIES = [
  ...(txOrdinances.municipalities || []),
  ...(orOrdinances.municipalities || []),
];

function findMuni(id) {
  return ALL_MUNICIPALITIES.find((m) => m.id === id) || ALL_MUNICIPALITIES[0];
}

/**
 * Initialize copy buttons across the landing page or spec page.
 * (Theme toggle is handled globally by initSharedThemeToggle in demo-extras.js).
 */
function initSharedChromeAndCopy() {
  if (typeof document === 'undefined') return;

  // Bind any [data-copy-target] buttons on the landing page or spec page
  document.querySelectorAll('[data-copy-target]').forEach((btn) => {
    if (btn.dataset.copyBound === 'true') return;
    btn.dataset.copyBound = 'true';
    btn.addEventListener('click', async () => {
      const targetId = btn.getAttribute('data-copy-target');
      const targetEl = document.getElementById(targetId);
      const text = targetEl?.textContent || '';
      if (navigator.clipboard && text) {
        await navigator.clipboard.writeText(text);
        const orig = btn.textContent;
        btn.textContent = 'Copied';
        setTimeout(() => {
          btn.textContent = orig;
        }, 1600);
      }
    });
  });
}

/**
 * Initialize the Instant Root-Zone & Holobiont Quick-Calculator on the root landing page (/).
 */
export function initLandingQuickCalculator() {
  if (typeof document === 'undefined') return;
  const qcRoot = document.getElementById('landing-quick-calc');
  if (!qcRoot) return;

  const slider = document.getElementById('qc-dbh-slider');
  const select = document.getElementById('qc-jurisdiction-select');
  const dbhDisplay = document.getElementById('qc-dbh-display');
  const dbhCmDisplay = document.getElementById('qc-dbh-cm-display');
  const crzVal = document.getElementById('qc-crz-val');
  const tpzVal = document.getElementById('qc-tpz-val');
  const srzVal = document.getElementById('qc-srz-val');
  const statusVal = document.getElementById('qc-status-val');
  const holobiontVal = document.getElementById('qc-holobiont-val');
  const ctlaVal = document.getElementById('qc-ctla-val');
  const citationLine = document.getElementById('qc-citation-line');
  const openDemoLink = document.getElementById('qc-open-demo-link');

  function updateQuickCalc() {
    const dbhIn = Math.max(6, Math.min(60, Number(slider?.value) || 30));
    const dbhCm = Math.round(dbhIn * 2.54 * 10) / 10;
    const muniId = select?.value || 'tx-austin';
    const muni = findMuni(muniId);

    if (dbhDisplay) dbhDisplay.textContent = `${dbhIn} in`;
    if (dbhCmDisplay) dbhCmDisplay.textContent = `${dbhCm} cm`;

    const crzMultiplier = Number(muni?.plan_rules?.root_zone?.crz_ft_per_inch) || 1.0;
    const crzMinFt = Number(muni?.plan_rules?.root_zone?.crz_min_ft) || 0;
    const crz = calculateCRZ(dbhIn, crzMultiplier, crzMinFt);
    const tpz = calculateTPZ(dbhIn, 'inches', 'US_1_1', crzMultiplier);
    const srz = calculateSRZ(dbhIn * 1.25, dbhIn);

    const speciesSci = muni?.state === 'OR' ? 'Quercus garryana' : 'Quercus virginiana';
    const speciesCommon = muni?.state === 'OR' ? 'Oregon White Oak' : 'Live Oak';

    const evalRows = evaluateTreeInventory(
      [
        {
          tag: 'QC-01',
          species_common: speciesCommon,
          species_scientific: speciesSci,
          dbh_inches: dbhIn,
          removal: false,
        },
      ],
      muni
    );
    const permit = permitDetermination(evalRows, muni);
    const mitIfRemoved = computeMitigationPlan(
      evaluateTreeInventory(
        [
          {
            tag: 'QC-01',
            species_common: speciesCommon,
            species_scientific: speciesSci,
            dbh_inches: dbhIn,
            removal: true,
          },
        ],
        muni
      ),
      muni
    );

    const spreadM = Math.max(6, Math.round(dbhIn * 0.75 * 10) / 10);
    const holobiont = computeHolobiontValuation({
      structural_baseline: {
        dbh_cm: dbhCm,
        crown_spread_ns_m: spreadM,
        crown_spread_ew_m: spreadM,
        sound_shell_thickness_ratio_t_over_r: 0.38,
      },
      rhizosphere_and_root_collar: {
        tiz_radius_m: Math.round(crz.radius_meters * 1.5 * 100) / 100,
      },
    });

    const benefits = calculateTreeEcosystemBenefits({
      species_name: speciesSci,
      common_name: speciesCommon,
      dbh_inches: dbhIn,
      condition_class: 'Good',
    });

    if (crzVal) {
      crzVal.textContent = `${crz.radius_feet} ft (${crz.radius_meters} m)`;
    }
    if (tpzVal) {
      tpzVal.textContent = `${tpz.area_sqft.toLocaleString()} sq ft (${tpz.area_sqm} m2) CRZ`;
    }
    if (srzVal) {
      srzVal.textContent = `${srz.radius_feet} ft (${srz.radius_meters} m)`;
    }
    if (statusVal) {
      const label = statusLabel(evalRows[0]);
      const fee = mitIfRemoved?.cash_in_lieu_usd || 0;
      statusVal.textContent = `${label} (${permit.required ? 'Permit Req.' : 'No Permit'} | Removal Fee: $${fee.toLocaleString()})`;
    }
    if (holobiontVal) {
      holobiontVal.textContent = `$${holobiont.holobiont_200yr_biological_equity_usd.toLocaleString()}`;
    }
    if (ctlaVal) {
      ctlaVal.textContent = `CTLA: $${holobiont.ctla_10th_ed_depreciated_usd.toLocaleString()} | Nowak: $${benefits.total_annual_benefits_usd}/yr`;
    }
    if (citationLine) {
      citationLine.textContent = `Authority: ${muni.name}, ${muni.state} (${muni.ordinance_numbers}) | Species: ${speciesCommon}`;
    }
    if (openDemoLink) {
      openDemoLink.href = `./demo/index.html?jurisdiction=${encodeURIComponent(muniId)}&dbh=${encodeURIComponent(dbhIn)}`;
    }
  }

  slider?.addEventListener('input', updateQuickCalc);
  select?.addEventListener('change', updateQuickCalc);
  updateQuickCalc();
}

/**
 * Flatten a JSON Schema into navigable property rows for the interactive schema table.
 */
function flattenSchemaProperties(schema, prefix = '$', parentRequired = []) {
  const rows = [];
  if (!schema || typeof schema !== 'object') return rows;

  const reqSet = new Set(Array.isArray(schema.required) ? schema.required : parentRequired);
  const props = schema.properties || {};

  for (const [key, propSchema] of Object.entries(props)) {
    const path = `${prefix}.${key}`;
    const isReq = reqSet.has(key);
    const typeStr = Array.isArray(propSchema.type)
      ? propSchema.type.join(' | ')
      : propSchema.type || 'object';

    const constraints = [];
    if (propSchema.const !== undefined) constraints.push(`const: "${propSchema.const}"`);
    if (Array.isArray(propSchema.enum)) constraints.push(`enum: [${propSchema.enum.join(', ')}]`);
    if (propSchema.minimum !== undefined) constraints.push(`min: ${propSchema.minimum}`);
    if (propSchema.maximum !== undefined) constraints.push(`max: ${propSchema.maximum}`);
    if (propSchema.minLength !== undefined) constraints.push(`minLength: ${propSchema.minLength}`);
    if (propSchema.maxLength !== undefined) constraints.push(`maxLength: ${propSchema.maxLength}`);
    if (propSchema.pattern) constraints.push(`pattern: ${propSchema.pattern}`);

    rows.push({
      path,
      type: typeStr,
      constraints: constraints.join('; ') || 'Standard type validation',
      required: isReq ? 'Required' : 'Optional',
      description: propSchema.description || 'Structured schema property.',
    });

    if (propSchema.properties) {
      rows.push(...flattenSchemaProperties(propSchema, path, propSchema.required || []));
    } else if (propSchema.items && propSchema.items.properties) {
      rows.push(
        ...flattenSchemaProperties(
          propSchema.items,
          `${path}[]`,
          propSchema.items.required || []
        )
      );
    }
  }

  return rows;
}

/**
 * Initialize the Specification Reference Viewer on /spec/ (and shared landing widget if on /).
 */
export function initSpecViewerUI() {
  initSharedChromeAndCopy();
  initLandingQuickCalculator();

  if (typeof document === 'undefined') return;
  const specRoot = document.getElementById('spec-viewer-root');
  if (!specRoot) return;

  let activeSchemaKey = 'rca';
  const searchInput = document.getElementById('schema-prop-search');
  const tbody = document.getElementById('schema-props-tbody');
  const metaBanner = document.getElementById('schema-meta-banner');
  const rawFilename = document.getElementById('schema-raw-filename');
  const rawPreview = document.getElementById('schema-raw-preview');

  const rcaRows = flattenSchemaProperties(rcaAssessmentSchema);
  const ordRows = flattenSchemaProperties(municipalOrdinanceSchema);

  function renderSchemaInspector() {
    const isRca = activeSchemaKey === 'rca';
    const activeSchema = isRca ? rcaAssessmentSchema : municipalOrdinanceSchema;
    const allRows = isRca ? rcaRows : ordRows;
    const filePath = isRca ? 'schemas/rca_assessment.schema.json' : 'schemas/municipal-ordinance.schema.json';
    const downloadHref = isRca ? '../schemas/rca_assessment.schema.json' : '../schemas/municipal-ordinance.schema.json';
    const query = (searchInput?.value || '').trim().toLowerCase();

    const filteredRows = query
      ? allRows.filter(
          (r) =>
            r.path.toLowerCase().includes(query) ||
            r.type.toLowerCase().includes(query) ||
            r.constraints.toLowerCase().includes(query) ||
            r.description.toLowerCase().includes(query)
        )
      : allRows;

    if (metaBanner) {
      metaBanner.innerHTML = `
        <div class="muni-header">
          <div>
            <strong>${activeSchema.title}</strong>
            <span class="badge badge-protected">Draft 2020-12</span>
            <span class="badge badge-neutral">${filteredRows.length} of ${allRows.length} properties</span>
          </div>
          <a href="${downloadHref}" download class="muni-link">Download ${filePath}</a>
        </div>
        <p class="muni-citation">${activeSchema.description}</p>
        <p class="muni-subtext"><strong>Schema ID:</strong> <code>${activeSchema.$id}</code></p>
      `;
    }

    if (tbody) {
      tbody.innerHTML = filteredRows
        .map(
          (r) => `
          <tr>
            <th scope="row"><code>${r.path}</code></th>
            <td><strong>${r.type}</strong><br /><span class="hint">${r.constraints}</span></td>
            <td><span class="badge ${r.required === 'Required' ? 'badge-protected' : 'badge-neutral'}">${r.required}</span></td>
            <td>${r.description}</td>
          </tr>
        `
        )
        .join('');
    }

    if (rawFilename) {
      rawFilename.textContent = filePath;
    }
    if (rawPreview) {
      rawPreview.textContent = JSON.stringify(activeSchema, null, 2);
    }
  }

  specRoot.querySelectorAll('[data-schema-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      specRoot.querySelectorAll('[data-schema-tab]').forEach((b) => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      activeSchemaKey = btn.dataset.schemaTab;
      renderSchemaInspector();
    });
  });

  searchInput?.addEventListener('input', renderSchemaInspector);

  const copyRawBtn = document.getElementById('btn-copy-raw-schema');
  copyRawBtn?.addEventListener('click', async () => {
    const text = rawPreview?.textContent || '';
    if (navigator.clipboard && text) {
      await navigator.clipboard.writeText(text);
      const orig = copyRawBtn.textContent;
      copyRawBtn.textContent = 'Copied Schema JSON';
      setTimeout(() => {
        copyRawBtn.textContent = orig;
      }, 1600);
    }
  });

  renderSchemaInspector();
}
