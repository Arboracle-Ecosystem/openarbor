#!/usr/bin/env node
/**
 * Open Arbor MCP Server (server/mcp/openarbor-mcp.mjs)
 * Zero-dependency stdio JSON-RPC 2.0 Model Context Protocol server exposing
 * Open Arbor's deterministic engines:
 *   1. calculate_root_zone          -> src/core/rootZone.js
 *   2. evaluate_ordinance           -> src/core/ordinanceEngine.js
 *   3. calculate_ecosystem_benefits -> src/core/ecosystemBenefits.js
 *   4. rca_biomechanics             -> src/core/rcaEngine.js
 *   5. rca_lint                     -> src/core/rcaEngine.js
 *   6. lookup_ordinance             -> data/ordinances/*.json
 *
 * License: AGPL-3.0-only
 */

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const ORDINANCES_DIR = path.join(REPO_ROOT, 'data', 'ordinances');

const SERVER_INFO = {
  name: 'openarbor-mcp',
  version: '2.0.0',
};

const PROTOCOL_VERSION = '2024-11-05';

/**
 * Load all municipal ordinance records from data/ordinances/*.json.
 * @returns {Map<string, {record: object, file: string, region: string}>}
 */
export function loadOrdinanceCatalog() {
  const catalog = new Map();
  if (!fs.existsSync(ORDINANCES_DIR)) {
    return catalog;
  }
  const files = fs
    .readdirSync(ORDINANCES_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort();

  for (const file of files) {
    const fullPath = path.join(ORDINANCES_DIR, file);
    const raw = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    const municipalities = Array.isArray(raw.municipalities)
      ? raw.municipalities
      : raw && typeof raw === 'object' && raw.id
      ? [raw]
      : [];

    for (const muni of municipalities) {
      if (muni && typeof muni.id === 'string') {
        catalog.set(muni.id.toLowerCase(), {
          record: muni,
          file: `data/ordinances/${file}`,
          region: raw.region || muni.state || 'Unknown',
        });
      }
    }
  }
  return catalog;
}

export const MCP_TOOLS = [
  {
    name: 'calculate_root_zone',
    description:
      'Calculate Critical Root Zone (CRZ), international Tree Protection Zone (TPZ), and Mattheck/AS 4970 Structural Root Zone (SRZ) radii and areas in imperial (ft, sq ft) and metric (m, sq m) units.',
    inputSchema: {
      type: 'object',
      required: ['dbh'],
      properties: {
        dbh: {
          type: 'number',
          description: 'Diameter at Breast Height (4.5 ft / 1.37 m) in inches or cm.',
        },
        unit: {
          type: 'string',
          enum: ['inches', 'cm'],
          default: 'inches',
          description: 'Unit of the provided DBH measurement.',
        },
        standard: {
          type: 'string',
          enum: [
            'US_1_1',
            'US_1_1.5',
            'US_1_18',
            'Australian_AS4970',
            'UK_BS5837',
            'Custom',
          ],
          default: 'US_1_1',
          description: 'Tree Protection Zone standard to apply.',
        },
        multiplier: {
          type: 'number',
          default: 1.0,
          description: 'Feet of radius per inch of DBH for CRZ or Custom TPZ.',
        },
        min_radius_feet: {
          type: 'number',
          default: 0,
          description: 'Optional municipal minimum CRZ radius floor in feet.',
        },
        drf_inches: {
          type: 'number',
          description: 'Optional Diameter at Root Flare (DRF) in inches for AS 4970 SRZ calculation.',
        },
        stems_inches: {
          type: 'array',
          items: { type: 'number' },
          description: 'Optional multi-stem diameters in inches to aggregate prior to root zone calculation.',
        },
        multistem_method: {
          type: 'string',
          enum: ['quadratic', 'largest_plus_half', 'sum'],
          default: 'quadratic',
          description: 'Aggregation formula when stems_inches is supplied.',
        },
      },
    },
  },
  {
    name: 'evaluate_ordinance',
    description:
      'Evaluate a tree inventory against a municipal tree protection ordinance, returning protected/heritage flags, CRZ encroachment triggers, seasonal Oak Wilt flags, permit determinations, and mitigation fee/replacement plans.',
    inputSchema: {
      type: 'object',
      required: ['trees'],
      properties: {
        trees: {
          type: 'array',
          description: 'Array of tree inventory rows (tag, species_common, species_scientific, dbh or stems_inches, removal, crz_disturbed_pct, etc.).',
          items: { type: 'object' },
        },
        jurisdiction_id: {
          type: 'string',
          description: 'Jurisdiction ID in data/ordinances/ (e.g., tx-austin, tx-georgetown, tx-liberty-hill, tx-cedar-park, tx-round-rock, or-ashland, or-medford, or-grants-pass).',
        },
        ordinance: {
          type: 'object',
          description: 'Optional inline municipal ordinance object conforming to schemas/municipal-ordinance.schema.json (used when jurisdiction_id is not provided).',
        },
      },
    },
  },
  {
    name: 'calculate_ecosystem_benefits',
    description:
      'Compute annual and 20-year allometric ecosystem services (Nowak carbon storage/sequestration, Xiao stormwater interception, dry deposition air pollution removal, McPherson shade cooling kWh, CTLA structural value) and John White (FCIN12) veteran tree age.',
    inputSchema: {
      type: 'object',
      required: ['dbh_inches'],
      properties: {
        dbh_inches: {
          type: 'number',
          description: 'Diameter at Breast Height in inches (> 0).',
        },
        species: {
          type: 'string',
          description: 'Scientific or common species name.',
        },
        condition: {
          type: 'string',
          enum: ['Excellent', 'Good', 'Fair', 'Poor', 'Critical', 'Dead'],
          default: 'Good',
          description: 'Tree condition class.',
        },
        land_use: {
          type: 'string',
          enum: ['Residential', 'Commercial', 'Street', 'Park'],
          default: 'Residential',
          description: 'Surrounding site land use context.',
        },
        height_feet: {
          type: 'number',
          description: 'Optional measured tree height in feet.',
        },
        canopy_spread_feet: {
          type: 'number',
          description: 'Optional measured crown spread in feet.',
        },
        crown_light_exposure: {
          type: 'number',
          default: 4,
          description: 'Crown light exposure sides (0 to 5).',
        },
        annual_rainfall_inches: {
          type: 'number',
          default: 35,
          description: 'Local mean annual precipitation in inches.',
        },
        projection_years: {
          type: 'number',
          default: 20,
          description: 'Cumulative ecosystem benefit horizon in years.',
        },
        base_growth_factor: {
          type: 'number',
          default: 4.5,
          description: 'Species growth factor for John White FCIN12 age estimation.',
        },
        site_condition: {
          type: 'string',
          enum: ['Open Grown / Parkland', 'Forest / Woodland', 'Urban / Street Tree'],
          default: 'Open Grown / Parkland',
          description: 'Site exposure class for John White FCIN12 age estimation.',
        },
      },
    },
  },
  {
    name: 'rca_biomechanics',
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
  },
  {
    name: 'rca_lint',
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
  },
  {
    name: 'lookup_ordinance',
    description:
      'Retrieve the verified municipal tree protection ordinance record for a jurisdiction ID from data/ordinances/.',
    inputSchema: {
      type: 'object',
      required: ['jurisdiction_id'],
      properties: {
        jurisdiction_id: {
          type: 'string',
          description: 'Municipality identifier (e.g., tx-austin, tx-georgetown, tx-liberty-hill, tx-cedar-park, tx-round-rock, or-ashland, or-medford, or-grants-pass).',
        },
      },
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
 * Execute a named MCP tool call deterministically.
 * @param {string} name
 * @param {object} args
 */
export function executeToolCall(name, args = {}) {
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

      let ordinanceRecord = args.ordinance || null;
      let sourceMeta = null;

      if (!ordinanceRecord && args.jurisdiction_id) {
        const catalog = loadOrdinanceCatalog();
        const found = catalog.get(String(args.jurisdiction_id).toLowerCase().trim());
        if (!found) {
          return formatToolResult(
            {
              error: 'UNKNOWN_JURISDICTION',
              message: `No ordinance record found for jurisdiction_id '${args.jurisdiction_id}'.`,
              available_jurisdictions: Array.from(catalog.keys()),
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
      const catalog = loadOrdinanceCatalog();
      const rawId = String(args.jurisdiction_id || '').toLowerCase().trim();
      if (!rawId) {
        return formatToolResult(
          {
            error: 'MISSING_JURISDICTION_ID',
            message: 'jurisdiction_id is required.',
            available_jurisdictions: Array.from(catalog.keys()),
          },
          true
        );
      }

      const entry = catalog.get(rawId);
      if (!entry) {
        return formatToolResult(
          {
            error: 'UNKNOWN_JURISDICTION',
            message: `Unknown jurisdiction '${args.jurisdiction_id}'.`,
            available_jurisdictions: Array.from(catalog.keys()),
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

/**
 * Handle a single parsed JSON-RPC 2.0 request object.
 * Returns a JSON-RPC response object, or null for notifications.
 */
export function handleJsonRpcMessage(msg) {
  if (!msg || typeof msg !== 'object' || msg.jsonrpc !== '2.0') {
    return {
      jsonrpc: '2.0',
      id: msg?.id ?? null,
      error: {
        code: -32600,
        message: 'Invalid Request: expected jsonrpc 2.0 object',
      },
    };
  }

  const { id, method, params } = msg;

  // Notifications have no id and expect no response
  if (id === undefined) {
    return null;
  }

  switch (method) {
    case 'initialize':
      return {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: params?.protocolVersion || PROTOCOL_VERSION,
          capabilities: {
            tools: { listChanged: false },
          },
          serverInfo: SERVER_INFO,
        },
      };

    case 'ping':
      return {
        jsonrpc: '2.0',
        id,
        result: {},
      };

    case 'tools/list':
      return {
        jsonrpc: '2.0',
        id,
        result: {
          tools: MCP_TOOLS,
        },
      };

    case 'tools/call': {
      const toolName = params?.name;
      const toolArgs = params?.arguments || {};
      if (!toolName || typeof toolName !== 'string') {
        return {
          jsonrpc: '2.0',
          id,
          error: {
            code: -32602,
            message: 'Invalid params: tools/call requires params.name',
          },
        };
      }
      const result = executeToolCall(toolName, toolArgs);
      return {
        jsonrpc: '2.0',
        id,
        result,
      };
    }

    case 'shutdown':
      return {
        jsonrpc: '2.0',
        id,
        result: null,
      };

    default:
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32601,
          message: `Method not found: ${method}`,
        },
      };
  }
}

/**
 * Start the newline-delimited JSON-RPC 2.0 stdio loop when invoked as main entrypoint.
 */
export function startStdioServer() {
  const rl = readline.createInterface({
    input: process.stdin,
    terminal: false,
  });

  rl.on('line', (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    let parsed;
    try {
      parsed = JSON.parse(trimmed);
    } catch (err) {
      const parseErr = {
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32700,
          message: `Parse error: ${err.message}`,
        },
      };
      process.stdout.write(`${JSON.stringify(parseErr)}\n`);
      return;
    }

    const response = handleJsonRpcMessage(parsed);
    if (response !== null) {
      process.stdout.write(`${JSON.stringify(response)}\n`);
    }

    if (parsed.method === 'shutdown') {
      rl.close();
      process.exit(0);
    }
  });

  rl.on('close', () => {
    process.exit(0);
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  startStdioServer();
}
