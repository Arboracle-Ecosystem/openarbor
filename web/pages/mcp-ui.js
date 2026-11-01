/**
 * Open Arbor v2.0 Model Context Protocol (MCP) Playground UI (web/pages/mcp-ui.js)
 * Interactive browser simulator for the 6 deterministic tools in server/mcp/openarbor-mcp.mjs.
 */

import {
  calculateCRZ,
  calculateTPZ,
  calculateSRZ,
  calculateMultiStemDBH,
} from '../../src/core/rootZone.js';

import {
  evaluateTreeInventory,
  permitDetermination,
  permitSummary,
  computeMitigationPlan,
  estimateRootZoneRemediation,
} from '../../src/core/ordinanceEngine.js';

import {
  calculateTreeEcosystemBenefits,
  estimateTreeAge,
} from '../../src/core/ecosystemBenefits.js';

import {
  evaluateBiomechanicsAndRhizosphere,
  lintRcaEvidentiaryReport,
} from '../../src/core/rcaEngine.js';

import txOrdinances from '../../data/ordinances/central_texas_ordinances.json';
import orOrdinances from '../../data/ordinances/rogue_valley_oregon_ordinances.json';
import { FIXED_PARITY_CASES } from '../presets.js';

export const MAX_EVALUATE_TREES = 500;
export const MAX_JURISDICTION_ID_LENGTH = 128;

const ALL_ORDINANCE_ENTRIES = [
  ...(txOrdinances.municipalities || []).map((m) => ({
    record: m,
    file: 'data/ordinances/central_texas_ordinances.json',
    region: txOrdinances.region || 'Central Texas',
  })),
  ...(orOrdinances.municipalities || []).map((m) => ({
    record: m,
    file: 'data/ordinances/rogue_valley_oregon_ordinances.json',
    region: orOrdinances.region || 'Rogue Valley, Oregon',
  })),
];

const ORDINANCE_CATALOG = new Map(
  ALL_ORDINANCE_ENTRIES.map((entry) => [entry.record.id.toLowerCase(), entry])
);

export const MCP_TOOLS = [
  {
    name: 'calculate_root_zone',
    module: 'src/core/rootZone.js',
    description:
      'Calculate Critical Root Zone (CRZ), international Tree Protection Zone (TPZ), and Mattheck/AS 4970 Structural Root Zone (SRZ) radii and areas in imperial (ft, sq ft) and metric (m, sq m) units.',
    inputSchema: {
      type: 'object',
      required: ['dbh'],
      properties: {
        dbh: { type: 'number', description: 'Diameter at Breast Height (4.5 ft / 1.37 m) in inches or cm.' },
        unit: { type: 'string', enum: ['inches', 'cm'], default: 'inches' },
        standard: {
          type: 'string',
          enum: ['US_1_1', 'US_1_1.5', 'US_1_18', 'Australian_AS4970', 'UK_BS5837', 'Custom'],
          default: 'US_1_1',
        },
        multiplier: { type: 'number', default: 1.0 },
        min_radius_feet: { type: 'number', default: 0 },
        drf_inches: { type: 'number', description: 'Optional Diameter at Root Flare in inches for AS 4970 SRZ.' },
        stems_inches: { type: 'array', items: { type: 'number' } },
        multistem_method: { type: 'string', enum: ['quadratic', 'largest_plus_half', 'sum'], default: 'quadratic' },
      },
    },
    defaultArgs: {
      dbh: 30,
      unit: 'inches',
      standard: 'US_1_1',
      multiplier: 1.0,
      drf_inches: 38.58,
    },
  },
  {
    name: 'evaluate_ordinance',
    module: 'src/core/ordinanceEngine.js',
    description:
      'Evaluate a tree inventory against a municipal tree protection ordinance, returning protected/heritage flags, CRZ encroachment triggers, seasonal Oak Wilt flags, permit determinations, and mitigation fee/replacement plans.',
    inputSchema: {
      type: 'object',
      required: ['trees'],
      properties: {
        trees: {
          type: 'array',
          maxItems: MAX_EVALUATE_TREES,
          description: 'Array of tree inventory rows (max 500 rows per call).',
          items: { type: 'object' },
        },
        jurisdiction_id: {
          type: 'string',
          maxLength: MAX_JURISDICTION_ID_LENGTH,
          description: 'Jurisdiction ID in data/ordinances/ (e.g., tx-austin, tx-georgetown, tx-liberty-hill, or-ashland).',
        },
        ordinance: { type: 'object' },
      },
    },
    defaultArgs: {
      jurisdiction_id: 'tx-austin',
      trees: [
        {
          tag: 'ATX-QV-101',
          species_common: 'Live Oak',
          species_scientific: 'Quercus virginiana',
          dbh_inches: 30,
          lat: 30.2672,
          lng: -97.7431,
          condition_score: 8,
          removal: false,
          pruning_date: '2026-11-15',
          crz_disturbed_pct: 15,
          cutfill_within_half_crz: true,
          cutfill_depth_in: 2,
          impervious_pct: 10,
          crown_removal_pct: 10,
          actions: ['pruning'],
        },
      ],
    },
  },
  {
    name: 'calculate_ecosystem_benefits',
    module: 'src/core/ecosystemBenefits.js',
    description:
      'Compute annual and 20-year allometric ecosystem services (Nowak carbon storage/sequestration, Xiao stormwater interception, dry deposition air pollution removal, McPherson shade cooling kWh, CTLA structural value) and John White (FCIN12) veteran tree age.',
    inputSchema: {
      type: 'object',
      required: ['dbh_inches'],
      properties: {
        dbh_inches: { type: 'number' },
        species: { type: 'string' },
        condition: { type: 'string', enum: ['Excellent', 'Good', 'Fair', 'Poor', 'Critical', 'Dead'], default: 'Good' },
        land_use: { type: 'string', enum: ['Residential', 'Commercial', 'Street', 'Park'], default: 'Residential' },
        height_feet: { type: 'number' },
        canopy_spread_feet: { type: 'number' },
        crown_light_exposure: { type: 'number', default: 4 },
        annual_rainfall_inches: { type: 'number', default: 35 },
        projection_years: { type: 'number', default: 20 },
        base_growth_factor: { type: 'number', default: 4.5 },
        site_condition: {
          type: 'string',
          enum: ['Open Grown / Parkland', 'Forest / Woodland', 'Urban / Street Tree'],
          default: 'Open Grown / Parkland',
        },
      },
    },
    defaultArgs: {
      dbh_inches: 30,
      species: 'Quercus virginiana',
      condition: 'Good',
      land_use: 'Residential',
      height_feet: 54.1,
      canopy_spread_feet: 75.5,
      base_growth_factor: 4.5,
      site_condition: 'Open Grown / Parkland',
    },
  },
  {
    name: 'rca_biomechanics',
    module: 'src/core/rcaEngine.js',
    description:
      'Run RCA-Spec v2.0 biomechanical and rhizosphere evaluation (Mattheck t/R hollow-shell buckling safety factor, AS 4970 SRZ, Shigo CODIT wall response, pneumatic AirSpade trench volume, and biochar/compost/humate/mulch amendment quantities).',
    inputSchema: {
      type: 'object',
      required: ['assessment'],
      properties: {
        assessment: {
          type: 'object',
          description: 'RCA assessment object conforming to schemas/rca_assessment.schema.json.',
        },
      },
    },
    defaultArgs: {
      assessment: FIXED_PARITY_CASES[0].assessment,
    },
  },
  {
    name: 'rca_lint',
    module: 'src/core/rcaEngine.js',
    description:
      'Validate an RCA assessment object with the ASCA-grade and Nature-First Evidentiary Linter, blocking un-evidenced removals when Mattheck t/R >= 0.30 and rhizosphere remediation is viable.',
    inputSchema: {
      type: 'object',
      required: ['assessment'],
      properties: {
        assessment: {
          type: 'object',
          description: 'RCA assessment object conforming to schemas/rca_assessment.schema.json.',
        },
      },
    },
    defaultArgs: {
      assessment: FIXED_PARITY_CASES[0].assessment,
    },
  },
  {
    name: 'lookup_ordinance',
    module: 'data/ordinances/*.json',
    description:
      'Retrieve the verified municipal tree protection ordinance record for a jurisdiction ID from data/ordinances/.',
    inputSchema: {
      type: 'object',
      required: ['jurisdiction_id'],
      properties: {
        jurisdiction_id: {
          type: 'string',
          maxLength: MAX_JURISDICTION_ID_LENGTH,
          description:
            'Municipality identifier (max 128 chars; tx-austin, tx-georgetown, tx-liberty-hill, tx-cedar-park, tx-round-rock, or-ashland, or-medford, or-grants-pass).',
        },
      },
    },
    defaultArgs: {
      jurisdiction_id: 'tx-austin',
    },
  },
];

function formatToolResult(payload, isError = false) {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(payload, null, 2),
      },
    ],
    structuredContent: payload,
    isError,
  };
}

/**
 * Browser-compatible deterministic execution matching server/mcp/openarbor-mcp.mjs.
 */
export function executeMcpToolInBrowser(name, args = {}) {
  switch (name) {
    case 'calculate_root_zone': {
      const unit = args.unit || 'inches';
      const standard = args.standard || 'US_1_1';
      const multiplier = args.multiplier != null ? Number(args.multiplier) : 1.0;
      const minRadiusFeet = args.min_radius_feet != null ? Number(args.min_radius_feet) : 0;

      let rawDbh = Number(args.dbh ?? args.dbh_inches ?? 0);
      if ((!rawDbh || rawDbh <= 0) && Array.isArray(args.stems_inches) && args.stems_inches.length > 0) {
        rawDbh = calculateMultiStemDBH(args.stems_inches, args.multistem_method || 'quadratic');
      }
      if (!rawDbh || rawDbh <= 0) {
        return formatToolResult(
          {
            error: 'INVALID_DBH',
            message: 'dbh must be a positive number (or supply non-empty stems_inches).',
          },
          true
        );
      }

      const dbhInches = unit === 'cm' ? rawDbh / 2.54 : rawDbh;
      const dbhCm = unit === 'inches' ? rawDbh * 2.54 : rawDbh;

      const tpz = calculateTPZ(rawDbh, unit, standard, multiplier);
      const crz = calculateCRZ(dbhInches, multiplier, minRadiusFeet);
      const srz = calculateSRZ(
        args.drf_inches != null ? Number(args.drf_inches) : null,
        dbhInches
      );

      return formatToolResult({
        dbh_input: rawDbh,
        unit,
        dbh_inches: Math.round(dbhInches * 100) / 100,
        dbh_cm: Math.round(dbhCm * 100) / 100,
        standard,
        radius_feet: tpz.radius_feet,
        radius_meters: tpz.radius_meters,
        area_sqft: tpz.area_sqft,
        area_sqm: tpz.area_sqm,
        formula_used: tpz.formula_used,
        crz,
        tpz,
        srz,
      });
    }

    case 'evaluate_ordinance': {
      const trees = Array.isArray(args.trees)
        ? args.trees
        : Array.isArray(args.tree_rows)
        ? args.tree_rows
        : null;
      if (!trees) {
        return formatToolResult(
          {
            error: 'INVALID_TREES_INPUT',
            message: 'evaluate_ordinance requires a trees array.',
          },
          true
        );
      }

      if (trees.length > MAX_EVALUATE_TREES) {
        return formatToolResult(
          {
            error: 'MAX_TREES_EXCEEDED',
            max_trees: MAX_EVALUATE_TREES,
            received_trees: trees.length,
            message: `evaluate_ordinance accepts at most ${MAX_EVALUATE_TREES} tree rows per call (received ${trees.length}) to bound 1-ft spatial grid union evaluation.`,
          },
          true
        );
      }

      if (
        args.jurisdiction_id &&
        String(args.jurisdiction_id).length > MAX_JURISDICTION_ID_LENGTH
      ) {
        return formatToolResult(
          {
            error: 'JURISDICTION_ID_TOO_LONG',
            max_length: MAX_JURISDICTION_ID_LENGTH,
            received_length: String(args.jurisdiction_id).length,
            message: `jurisdiction_id exceeds maximum length of ${MAX_JURISDICTION_ID_LENGTH} characters.`,
          },
          true
        );
      }

      let ordinanceRecord = args.ordinance || null;
      let sourceMeta = null;

      if (!ordinanceRecord && args.jurisdiction_id) {
        const found = ORDINANCE_CATALOG.get(String(args.jurisdiction_id).toLowerCase().trim());
        if (!found) {
          return formatToolResult(
            {
              error: 'UNKNOWN_JURISDICTION',
              message: `No ordinance record found for jurisdiction_id '${args.jurisdiction_id}'.`,
              available_jurisdictions: Array.from(ORDINANCE_CATALOG.keys()),
            },
            true
          );
        }
        ordinanceRecord = found.record;
        sourceMeta = { file: found.file, region: found.region };
      }

      if (!ordinanceRecord) {
        return formatToolResult(
          {
            error: 'MISSING_ORDINANCE',
            message: 'Provide either jurisdiction_id or an inline ordinance object.',
          },
          true
        );
      }

      const evaluatedRows = evaluateTreeInventory(trees, ordinanceRecord);
      const permit = permitDetermination(evaluatedRows, ordinanceRecord);
      const summaryText = permitSummary(permit);
      const mitigationPlan = computeMitigationPlan(evaluatedRows, ordinanceRecord);
      const remediationEstimate = estimateRootZoneRemediation(evaluatedRows);

      return formatToolResult({
        jurisdiction: {
          id: ordinanceRecord.id,
          name: ordinanceRecord.name,
          state: ordinanceRecord.state,
          ordinance_numbers: ordinanceRecord.ordinance_numbers,
          source_url: ordinanceRecord.source_url,
          ...(sourceMeta || {}),
        },
        evaluated_trees: evaluatedRows,
        permit_determination: permit,
        permit_summary: summaryText,
        mitigation_plan: mitigationPlan,
        remediation_estimate: remediationEstimate,
      });
    }

    case 'calculate_ecosystem_benefits': {
      const dbhInches = Number(args.dbh_inches ?? args.dbh ?? 0);
      if (!dbhInches || dbhInches <= 0) {
        return formatToolResult(
          {
            error: 'INVALID_DBH',
            message: 'dbh_inches must be a positive number.',
          },
          true
        );
      }

      const speciesName = args.species || args.species_name || 'Quercus virginiana';
      const commonName = args.common_name || args.species || '';
      const conditionClass = args.condition || args.condition_class || 'Good';
      const landUse = args.land_use || 'Residential';

      const benefits = calculateTreeEcosystemBenefits({
        species_name: speciesName,
        common_name: commonName,
        dbh_inches: dbhInches,
        height_feet: args.height_feet ?? null,
        canopy_spread_feet: args.canopy_spread_feet ?? null,
        condition_class: conditionClass,
        crown_light_exposure: args.crown_light_exposure ?? 4,
        land_use: landUse,
        annual_rainfall_inches: args.annual_rainfall_inches ?? 35,
        projection_years: args.projection_years ?? 20,
      });

      const ageEstimate = estimateTreeAge({
        dbh_inches: dbhInches,
        base_growth_factor: args.base_growth_factor ?? 4.5,
        site_condition: args.site_condition || 'Open Grown / Parkland',
      });

      return formatToolResult({
        ...benefits,
        age_estimate: ageEstimate,
      });
    }

    case 'rca_biomechanics': {
      const assessment = args.assessment || (args.structural_baseline ? args : null);
      if (!assessment || typeof assessment !== 'object') {
        return formatToolResult(
          {
            error: 'INVALID_ASSESSMENT',
            message: 'rca_biomechanics requires an assessment object with structural_baseline.',
          },
          true
        );
      }
      try {
        const result = evaluateBiomechanicsAndRhizosphere(assessment);
        return formatToolResult(result);
      } catch (err) {
        return formatToolResult(
          {
            error: 'RCA_BIOMECHANICS_ERROR',
            message: err.message,
          },
          true
        );
      }
    }

    case 'rca_lint': {
      const assessment = args.assessment || (args.structural_baseline ? args : null);
      if (!assessment || typeof assessment !== 'object') {
        return formatToolResult(
          {
            error: 'INVALID_ASSESSMENT',
            message: 'rca_lint requires an assessment object.',
          },
          true
        );
      }
      const lintResult = lintRcaEvidentiaryReport(assessment);
      return formatToolResult(lintResult);
    }

    case 'lookup_ordinance': {
      const rawInput = String(args.jurisdiction_id || '');
      if (rawInput.length > MAX_JURISDICTION_ID_LENGTH) {
        return formatToolResult(
          {
            error: 'JURISDICTION_ID_TOO_LONG',
            max_length: MAX_JURISDICTION_ID_LENGTH,
            received_length: rawInput.length,
            message: `jurisdiction_id exceeds maximum length of ${MAX_JURISDICTION_ID_LENGTH} characters.`,
          },
          true
        );
      }
      const rawId = rawInput.toLowerCase().trim();
      if (!rawId) {
        return formatToolResult(
          {
            error: 'MISSING_JURISDICTION_ID',
            message: 'jurisdiction_id is required.',
            available_jurisdictions: Array.from(ORDINANCE_CATALOG.keys()),
          },
          true
        );
      }

      const entry = ORDINANCE_CATALOG.get(rawId);
      if (!entry) {
        return formatToolResult(
          {
            error: 'UNKNOWN_JURISDICTION',
            message: `Unknown jurisdiction '${args.jurisdiction_id}'.`,
            available_jurisdictions: Array.from(ORDINANCE_CATALOG.keys()),
          },
          true
        );
      }

      return formatToolResult({
        dataset_file: entry.file,
        dataset_region: entry.region,
        ordinance: entry.record,
      });
    }

    default:
      return formatToolResult(
        {
          error: 'UNKNOWN_TOOL',
          message: `Unknown tool '${name}'.`,
          available_tools: MCP_TOOLS.map((t) => t.name),
        },
        true
      );
  }
}

export function initMcpPlaygroundUI() {
  if (typeof document === 'undefined') return;
  const root = document.getElementById('mcp-playground-root');
  if (!root) return;

  let activeToolName = MCP_TOOLS[0].name;
  let requestCounter = 1;

  const selectorEl = document.getElementById('mcp-tool-selector');
  const metaEl = document.getElementById('mcp-active-tool-meta');
  const argsEditor = document.getElementById('mcp-args-editor');
  const argsError = document.getElementById('mcp-args-error');
  const reqPreview = document.getElementById('mcp-request-preview');
  const resPreview = document.getElementById('mcp-response-preview');
  const latencyBadge = document.getElementById('mcp-latency-badge');

  function getActiveTool() {
    return MCP_TOOLS.find((t) => t.name === activeToolName) || MCP_TOOLS[0];
  }

  function renderToolSelector() {
    if (!selectorEl) return;
    selectorEl.innerHTML = MCP_TOOLS.map(
      (t) => `
      <button
        type="button"
        role="tab"
        aria-selected="${t.name === activeToolName}"
        class="oa-mcp-tool-btn ${t.name === activeToolName ? 'active' : ''}"
        data-mcp-tool="${t.name}"
      >
        <span class="oa-mcp-tool-name">${t.name}</span>
        <span class="oa-mcp-tool-mod">${t.module}</span>
      </button>
    `
    ).join('');

    selectorEl.querySelectorAll('[data-mcp-tool]').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeToolName = btn.dataset.mcpTool;
        renderToolSelector();
        loadToolDefaults();
        runCurrentToolCall();
      });
    });
  }

  function loadToolDefaults() {
    const tool = getActiveTool();
    if (metaEl) {
      const reqFields = (tool.inputSchema.required || []).join(', ') || 'None';
      const propNames = Object.keys(tool.inputSchema.properties || {}).join(', ');
      metaEl.innerHTML = `
        <div class="muni-header">
          <div>
            <strong><code>${tool.name}</code></strong>
            <span class="badge badge-protected">${tool.module}</span>
          </div>
          <span class="badge badge-neutral">Required: ${reqFields}</span>
        </div>
        <p class="muni-citation">${tool.description}</p>
        <p class="muni-subtext"><strong>Schema Properties:</strong> <code>${propNames}</code></p>
      `;
    }
    if (argsEditor) {
      argsEditor.value = JSON.stringify(tool.defaultArgs, null, 2);
    }
    if (argsError) {
      argsError.hidden = true;
    }
  }

  function runCurrentToolCall(overrideArgs = null) {
    const tool = getActiveTool();
    let parsedArgs = overrideArgs;

    if (!parsedArgs) {
      try {
        parsedArgs = JSON.parse(argsEditor?.value || '{}');
        if (argsError) argsError.hidden = true;
      } catch (err) {
        if (argsError) {
          argsError.hidden = false;
          argsError.textContent = `Invalid JSON in arguments editor: ${err.message}`;
        }
        return;
      }
    }

    const reqId = requestCounter++;
    const rpcRequest = {
      jsonrpc: '2.0',
      id: reqId,
      method: 'tools/call',
      params: {
        name: tool.name,
        arguments: parsedArgs,
      },
    };

    const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const result = executeMcpToolInBrowser(tool.name, parsedArgs);
    const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const elapsedMs = Math.max(0.01, t1 - t0).toFixed(2);

    const rpcResponse = {
      jsonrpc: '2.0',
      id: reqId,
      result,
    };

    if (reqPreview) {
      reqPreview.textContent = JSON.stringify(rpcRequest, null, 2);
    }
    if (resPreview) {
      resPreview.textContent = JSON.stringify(rpcResponse, null, 2);
    }
    if (latencyBadge) {
      latencyBadge.textContent = `${elapsedMs} ms (${result.isError ? 'Guard/Error Returned' : 'OK'})`;
    }
  }

  document.getElementById('btn-mcp-run')?.addEventListener('click', () => {
    runCurrentToolCall();
  });

  document.getElementById('btn-mcp-reset')?.addEventListener('click', () => {
    loadToolDefaults();
    runCurrentToolCall();
  });

  // Security guard test 1: >500 trees on evaluate_ordinance
  document.getElementById('btn-mcp-test-guard')?.addEventListener('click', () => {
    activeToolName = 'evaluate_ordinance';
    renderToolSelector();
    loadToolDefaults();
    const oversizedTrees = Array.from({ length: 501 }, (_, idx) => ({
      tag: `T-${idx + 1}`,
      species_common: 'Live Oak',
      species_scientific: 'Quercus virginiana',
      dbh_inches: 24,
    }));
    const guardArgs = {
      jurisdiction_id: 'tx-austin',
      trees: oversizedTrees,
    };
    if (argsEditor) {
      argsEditor.value = JSON.stringify(
        {
          jurisdiction_id: 'tx-austin',
          _note: 'Simulating 501 tree rows to test MAX_EVALUATE_TREES = 500 guard',
          trees_count: 501,
        },
        null,
        2
      );
    }
    runCurrentToolCall(guardArgs);
  });

  // Security guard test 2: >128 char jurisdiction_id
  document.getElementById('btn-mcp-test-id-guard')?.addEventListener('click', () => {
    activeToolName = 'lookup_ordinance';
    renderToolSelector();
    const overlongId = 'tx-austin-' + 'x'.repeat(130);
    const guardArgs = { jurisdiction_id: overlongId };
    if (argsEditor) {
      argsEditor.value = JSON.stringify(guardArgs, null, 2);
    }
    runCurrentToolCall(guardArgs);
  });

  argsEditor?.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      runCurrentToolCall();
    }
  });

  // Copy buttons for request/response and config snippets
  function bindCopyBtn(btnEl, getTextFn) {
    if (!btnEl) return;
    btnEl.addEventListener('click', async () => {
      const txt = getTextFn();
      if (navigator.clipboard && txt) {
        await navigator.clipboard.writeText(txt);
        const orig = btnEl.textContent;
        btnEl.textContent = 'Copied';
        setTimeout(() => {
          btnEl.textContent = orig;
        }, 1600);
      }
    });
  }

  bindCopyBtn(document.getElementById('btn-copy-mcp-req'), () => reqPreview?.textContent || '');
  bindCopyBtn(document.getElementById('btn-copy-mcp-res'), () => resPreview?.textContent || '');

  root.querySelectorAll('[data-copy-target]').forEach((btn) => {
    const targetId = btn.getAttribute('data-copy-target');
    bindCopyBtn(btn, () => document.getElementById(targetId)?.textContent || '');
  });

  renderToolSelector();
  loadToolDefaults();
  runCurrentToolCall();
}
