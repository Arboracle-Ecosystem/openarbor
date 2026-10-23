/**
 * Open Arbor MCP Server Verification Suite (tests/verify_mcp.mjs)
 * Spawns `node server/mcp/openarbor-mcp.mjs` as a real child process over stdio
 * and verifies newline-delimited JSON-RPC 2.0 protocol conformance, all 6 MCP tools,
 * known-answer calculations, and negative-path error handling without crashing.
 */

import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const SERVER_PATH = path.join(REPO_ROOT, 'server', 'mcp', 'openarbor-mcp.mjs');
const VALIDATOR_PATH = path.join(REPO_ROOT, 'scripts', 'validate-ordinance.mjs');
const EXAMPLE_RCA_PATH = path.join(REPO_ROOT, 'examples', 'ashland_oregon_white_oak_rca_v2.json');

console.log('=== Open Arbor MCP Server Verification Suite (Subprocess JSON-RPC 2.0) ===\n');

const child = spawn(process.execPath, [SERVER_PATH], {
  cwd: REPO_ROOT,
  stdio: ['pipe', 'pipe', 'pipe'],
});

let stderrOutput = '';
child.stderr.on('data', (chunk) => {
  stderrOutput += chunk.toString('utf8');
});

const rl = readline.createInterface({
  input: child.stdout,
  terminal: false,
});

const pending = new Map();

rl.on('line', (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  const msg = JSON.parse(trimmed);
  if (msg.id !== undefined && pending.has(msg.id)) {
    const { resolve } = pending.get(msg.id);
    pending.delete(msg.id);
    resolve(msg);
  }
});

let nextId = 1;
function sendRpc(method, params = {}) {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`RPC timeout waiting for id=${id} (${method}). stderr: ${stderrOutput}`));
    }, 5000);

    pending.set(id, {
      resolve: (res) => {
        clearTimeout(timer);
        resolve(res);
      },
    });

    const payload = JSON.stringify({ jsonrpc: '2.0', id, method, params });
    child.stdin.write(`${payload}\n`);
  });
}

try {
  // 1. Initialize handshake
  const initRes = await sendRpc('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'verify_mcp', version: '2.0.0' },
  });
  assert.equal(initRes.jsonrpc, '2.0');
  assert.equal(initRes.result.serverInfo.name, 'openarbor-mcp');
  assert.equal(initRes.result.serverInfo.version, '2.0.0');
  console.log('[PASS] 1. MCP initialize handshake completed (server: openarbor-mcp v2.0.0)');

  // 2. tools/list assertion (must return exactly 6 tools)
  const listRes = await sendRpc('tools/list', {});
  const tools = listRes.result?.tools || [];
  assert.equal(tools.length, 6, `Expected 6 MCP tools, got ${tools.length}`);
  const toolNames = tools.map((t) => t.name);
  assert.deepEqual(toolNames, [
    'calculate_root_zone',
    'evaluate_ordinance',
    'calculate_ecosystem_benefits',
    'rca_biomechanics',
    'rca_lint',
    'lookup_ordinance',
  ]);
  console.log(`[PASS] 2. tools/list verified (${tools.length} tools: ${toolNames.join(', ')})`);

  // 3. Known-answer tools/call for calculate_root_zone (dbh: 24 inches, US_1_1 -> radius_feet: 24)
  const rzRes = await sendRpc('tools/call', {
    name: 'calculate_root_zone',
    arguments: {
      dbh: 24,
      unit: 'inches',
      standard: 'US_1_1',
    },
  });
  assert.equal(rzRes.result.isError, false);
  const rzData = JSON.parse(rzRes.result.content[0].text);
  assert.equal(rzData.radius_feet, 24);
  assert.equal(rzData.tpz.radius_feet, 24);
  assert.equal(rzData.crz.radius_feet, 24);
  assert.equal(rzData.area_sqft, 1809.56);
  console.log(
    `[PASS] 3. tools/call calculate_root_zone (24 in, US_1_1) -> radius_feet=${rzData.radius_feet}, area_sqft=${rzData.area_sqft}`
  );

  // 4. Positive & Negative-path calls for lookup_ordinance
  const lookupOk = await sendRpc('tools/call', {
    name: 'lookup_ordinance',
    arguments: { jurisdiction_id: 'or-ashland' },
  });
  assert.equal(lookupOk.result.isError, false);
  const ashlandData = JSON.parse(lookupOk.result.content[0].text);
  assert.equal(ashlandData.ordinance.id, 'or-ashland');
  assert.equal(ashlandData.ordinance.dbh_threshold_inches, 6);

  const lookupErr = await sendRpc('tools/call', {
    name: 'lookup_ordinance',
    arguments: { jurisdiction_id: 'xx-nonexistent-city' },
  });
  assert.equal(lookupErr.result.isError, true, 'Expected isError=true for unknown jurisdiction');
  const errPayload = JSON.parse(lookupErr.result.content[0].text);
  assert.equal(errPayload.error, 'UNKNOWN_JURISDICTION');
  assert.ok(Array.isArray(errPayload.available_jurisdictions));
  assert.ok(errPayload.available_jurisdictions.includes('tx-austin'));
  assert.ok(errPayload.available_jurisdictions.includes('or-ashland'));
  console.log(
    `[PASS] 4. tools/call lookup_ordinance positive (or-ashland) & negative-path (xx-nonexistent-city -> ${errPayload.error}, no crash)`
  );

  // 5. Known-answer tools/call for evaluate_ordinance, calculate_ecosystem_benefits, rca_biomechanics, and rca_lint
  const ordRes = await sendRpc('tools/call', {
    name: 'evaluate_ordinance',
    arguments: {
      jurisdiction_id: 'tx-liberty-hill',
      trees: [
        {
          tag: 'T-101',
          species_common: 'Live Oak',
          species_scientific: 'Quercus virginiana',
          stems_inches: [26],
          removal: false,
        },
        {
          tag: 'T-102',
          species_common: 'Post Oak',
          species_scientific: 'Quercus stellata',
          stems_inches: [15],
          removal: true,
        },
      ],
    },
  });
  assert.equal(ordRes.result.isError, false);
  const ordData = JSON.parse(ordRes.result.content[0].text);
  assert.equal(ordData.evaluated_trees.length, 2);
  assert.equal(ordData.evaluated_trees[0].heritage, true);
  assert.equal(ordData.permit_determination.required, true);

  const ecoRes = await sendRpc('tools/call', {
    name: 'calculate_ecosystem_benefits',
    arguments: {
      dbh_inches: 30,
      species: 'Quercus virginiana',
      condition: 'Good',
      land_use: 'Residential',
    },
  });
  assert.equal(ecoRes.result.isError, false);
  const ecoData = JSON.parse(ecoRes.result.content[0].text);
  assert.ok(ecoData.carbon_storage_lbs > 2500);
  assert.ok(ecoData.structural_value_usd > 15000);
  assert.ok(ecoData.age_estimate.estimated_age_years > 200);

  const exampleRca = JSON.parse(fs.readFileSync(EXAMPLE_RCA_PATH, 'utf8'));
  const bioRes = await sendRpc('tools/call', {
    name: 'rca_biomechanics',
    arguments: { assessment: exampleRca },
  });
  assert.equal(bioRes.result.isError, false);
  const bioData = JSON.parse(bioRes.result.content[0].text);
  assert.equal(bioData.biomechanics.is_structurally_sound, true);
  assert.equal(bioData.biomechanics.sound_shell_thickness_ratio_t_over_r, 0.34);

  const lintRes = await sendRpc('tools/call', {
    name: 'rca_lint',
    arguments: { assessment: exampleRca },
  });
  assert.equal(lintRes.result.isError, false);
  const lintData = JSON.parse(lintRes.result.content[0].text);
  assert.equal(lintData.valid, true);
  assert.equal(lintData.errors.length, 0);
  console.log(
    '[PASS] 5. tools/call evaluate_ordinance, calculate_ecosystem_benefits, rca_biomechanics, and rca_lint verified'
  );

  // 6. Bounded-input guard on evaluate_ordinance (> 500 trees) and lookup_ordinance (> 128 chars)
  const oversizedTrees = Array.from({ length: 501 }, (_, i) => ({
    tag: `T-${i + 1}`,
    species_common: 'Live Oak',
    stems_inches: [20],
  }));
  const capRes = await sendRpc('tools/call', {
    name: 'evaluate_ordinance',
    arguments: {
      jurisdiction_id: 'tx-austin',
      trees: oversizedTrees,
    },
  });
  assert.equal(capRes.result.isError, true, 'Expected isError=true when trees.length > 500');
  const capPayload = JSON.parse(capRes.result.content[0].text);
  assert.equal(capPayload.error, 'MAX_TREES_EXCEEDED');
  assert.equal(capPayload.max_trees, 500);
  assert.equal(capPayload.received_trees, 501);

  const longIdRes = await sendRpc('tools/call', {
    name: 'lookup_ordinance',
    arguments: {
      jurisdiction_id: `tx-${'a'.repeat(130)}`,
    },
  });
  assert.equal(longIdRes.result.isError, true);
  const longIdPayload = JSON.parse(longIdRes.result.content[0].text);
  assert.equal(longIdPayload.error, 'JURISDICTION_ID_TOO_LONG');
  console.log(
    `[PASS] 6. MCP input size guards verified (evaluate_ordinance 501 trees -> ${capPayload.error}; lookup_ordinance 133 chars -> ${longIdPayload.error})`
  );

  // 7. Prototype-chain bypass negative tests on scripts/validate-ordinance.mjs (__proto__ and constructor)
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openarbor-ord-test-'));
  try {
    const protoFixturePath = path.join(tmpDir, 'bad_proto.json');
    const constructorFixturePath = path.join(tmpDir, 'bad_constructor.json');

    // Write raw JSON with literal "__proto__" key and literal "constructor" key
    fs.writeFileSync(
      protoFixturePath,
      '{\n' +
        '  "id": "tx-proto-test",\n' +
        '  "name": "Proto Test City",\n' +
        '  "state": "TX",\n' +
        '  "ordinance_numbers": "Test Code Ch. 1",\n' +
        '  "source_url": "https://example.org/code",\n' +
        '  "dbh_threshold_inches": 8,\n' +
        '  "__proto__": { "polluted": true }\n' +
        '}\n',
      'utf8'
    );

    fs.writeFileSync(
      constructorFixturePath,
      '{\n' +
        '  "id": "tx-ctor-test",\n' +
        '  "name": "Constructor Test City",\n' +
        '  "state": "TX",\n' +
        '  "ordinance_numbers": "Test Code Ch. 1",\n' +
        '  "source_url": "https://example.org/code",\n' +
        '  "dbh_threshold_inches": 8,\n' +
        '  "constructor": { "prototype": { "polluted": true } }\n' +
        '}\n',
      'utf8'
    );

    const protoRun = spawnSync(process.execPath, [VALIDATOR_PATH, protoFixturePath], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    });
    assert.notEqual(protoRun.status, 0, 'Expected non-zero exit code for __proto__ record');
    assert.ok(
      protoRun.stderr.includes("additional property '__proto__' is not allowed"),
      `Expected __proto__ rejection in stderr, got: ${protoRun.stderr}`
    );

    const ctorRun = spawnSync(process.execPath, [VALIDATOR_PATH, constructorFixturePath], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    });
    assert.notEqual(ctorRun.status, 0, 'Expected non-zero exit code for constructor record');
    assert.ok(
      ctorRun.stderr.includes("additional property 'constructor' is not allowed"),
      `Expected constructor rejection in stderr, got: ${ctorRun.stderr}`
    );

    console.log(
      '[PASS] 7. Ordinance validator prototype-chain negative gates verified (__proto__ and constructor rejected with exit code 1)'
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // 8. Clean shutdown
  const shutRes = await sendRpc('shutdown', {});
  assert.equal(shutRes.result, null);
  console.log('[PASS] 8. MCP shutdown completed cleanly\n');
  console.log('ALL 8 OPEN ARBOR MCP & VALIDATOR SECURITY CHECKS PASSED (0 proprietary dependencies).');
} finally {
  rl.close();
  if (!child.killed) {
    child.kill();
  }
}
