#!/usr/bin/env node
/**
 * Open Arbor Unified MCP Server (server/mcp/openarbor-mcp.mjs)
 * Single zero-dependency stdio JSON-RPC 2.0 Model Context Protocol server exposing:
 *   - Unified Intake Tool: `openarbor_consult` (alias: `consult_tree`)
 *   - 8 Specialist Tools: `calculate_root_zone`, `evaluate_ordinance`,
 *     `calculate_ecosystem_benefits`, `rap_biomechanics`, `rap_lint`,
 *     `lookup_ordinance`, `validate_soil_function`, `leo_rap_verify`
 *   - 3 Built-In LEO-RAP Orchestration Prompts (`prompts/list`, `prompts/get`):
 *     `homeowner-tree-guide`, `rap-practitioner-brief`, `municipal-plan-review`
 *
 * License: AGPL-3.0-only
 */

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

import {
  MCP_TOOLS,
  MCP_PROMPTS,
  MAX_EVALUATE_TREES,
  MAX_JURISDICTION_ID_LENGTH,
  MAX_NARRATIVE_LENGTH,
  executeMcpTool,
  getMcpPrompt,
} from './mcpCore.mjs';

export {
  MCP_TOOLS,
  MCP_PROMPTS,
  MAX_EVALUATE_TREES,
  MAX_JURISDICTION_ID_LENGTH,
  MAX_NARRATIVE_LENGTH,
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const ORDINANCES_DIR = path.join(REPO_ROOT, 'data', 'ordinances');

const SERVER_INFO = {
  name: 'openarbor-mcp',
  version: '2.2.0',
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

/**
 * Execute a named MCP tool call deterministically over the local ordinance catalog.
 * @param {string} name
 * @param {object} args
 */
export function executeToolCall(name, args = {}) {
  return executeMcpTool(name, args, loadOrdinanceCatalog());
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
            prompts: { listChanged: false },
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
      return {
        jsonrpc: '2.0',
        id,
        result: executeToolCall(toolName, toolArgs),
      };
    }

    case 'prompts/list':
      return {
        jsonrpc: '2.0',
        id,
        result: {
          prompts: MCP_PROMPTS,
        },
      };

    case 'prompts/get': {
      const promptName = params?.name;
      if (!promptName || typeof promptName !== 'string') {
        return {
          jsonrpc: '2.0',
          id,
          error: {
            code: -32602,
            message: 'Invalid params: prompts/get requires params.name',
          },
        };
      }
      const promptResult = getMcpPrompt(promptName, params?.arguments || {});
      if (!promptResult) {
        return {
          jsonrpc: '2.0',
          id,
          error: {
            code: -32602,
            message: `Unknown prompt '${promptName}'. Available prompts: ${MCP_PROMPTS.map((p) => p.name).join(', ')}`,
          },
        };
      }
      return {
        jsonrpc: '2.0',
        id,
        result: promptResult,
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
