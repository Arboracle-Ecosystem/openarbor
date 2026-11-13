/**
 * Open Arbor MCP Server & LEO-RAP Verification Suite (tests/verify_mcp.mjs)
 * Spawns `node server/mcp/openarbor-mcp.mjs` as a real child process over stdio
 * and verifies newline-delimited JSON-RPC 2.0 protocol conformance, all 8 MCP tools,
 * known-answer calculations, LEO-RAP Profile 01 sabotage gates, phased triage math,
 * Arborist Handoff Briefs, and negative-path error handling without crashing.
 */

import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

import {
  computePhasedStewardshipTriage,
  compileLeoRapBrief,
  verifyLeoRapNarrative,
  runLeoRapSelfAudit,
  composeArboristHandoffBrief,
} from '../src/core/leoRapEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const SERVER_PATH = path.join(REPO_ROOT, 'server', 'mcp', 'openarbor-mcp.mjs');
const VALIDATOR_PATH = path.join(REPO_ROOT, 'scripts', 'validate-ordinance.mjs');
const EXAMPLE_RAP_PATH = path.join(REPO_ROOT, 'examples', 'ashland_oregon_white_oak_rap_v2.json');

console.log('=== Open Arbor MCP Server & LEO-RAP Verification Suite (Subprocess JSON-RPC 2.0) ===\n');

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
    clientInfo: { name: 'verify_mcp', version: '2.2.0' },
  });
  assert.equal(initRes.jsonrpc, '2.0');
  assert.equal(initRes.result.serverInfo.name, 'openarbor-mcp');
  assert.equal(initRes.result.serverInfo.version, '2.2.0');
  assert.ok(initRes.result.capabilities?.tools, 'Server must advertise tools capability');
  assert.ok(initRes.result.capabilities?.prompts, 'Server must advertise prompts capability');
  console.log('[PASS] 1. MCP initialize handshake completed (server: openarbor-mcp v2.2.0)');

  // 2. tools/list assertion (must return all 9 tools with openarbor_consult first)
  const listRes = await sendRpc('tools/list', {});
  const tools = listRes.result?.tools || [];
  assert.equal(tools.length, 9, `Expected 9 MCP tools, got ${tools.length}`);
  const toolNames = tools.map((t) => t.name);
  assert.deepEqual(toolNames, [
    'openarbor_consult',
    'calculate_root_zone',
    'evaluate_ordinance',
    'calculate_ecosystem_benefits',
    'rap_biomechanics',
    'rap_lint',
    'lookup_ordinance',
    'validate_soil_function',
    'leo_rap_verify',
  ]);
  console.log('[PASS] 2. tools/list verified across all 9 deterministic MCP tools');

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
  console.log('[PASS] 3. tools/call calculate_root_zone (24 in, US_1_1 -> 24 ft radius, 1809.56 sq ft) verified');

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
  console.log('[PASS] 4. tools/call lookup_ordinance positive (or-ashland) and negative-path (UNKNOWN_JURISDICTION) verified');

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

  const exampleRap = JSON.parse(fs.readFileSync(EXAMPLE_RAP_PATH, 'utf8'));
  const bioRes = await sendRpc('tools/call', {
    name: 'rap_biomechanics',
    arguments: { assessment: exampleRap },
  });
  assert.equal(bioRes.result.isError, false);
  const bioData = JSON.parse(bioRes.result.content[0].text);
  assert.equal(bioData.biomechanics.is_structurally_sound, true);
  assert.equal(bioData.biomechanics.sound_shell_thickness_ratio_t_over_r, 0.34);

  const legacyBioRes = await sendRpc('tools/call', {
    name: 'rca_biomechanics',
    arguments: { assessment: exampleRap },
  });
  assert.equal(legacyBioRes.result.isError, false);

  const lintRes = await sendRpc('tools/call', {
    name: 'rap_lint',
    arguments: { assessment: exampleRap },
  });
  assert.equal(lintRes.result.isError, false);
  const lintData = JSON.parse(lintRes.result.content[0].text);
  assert.equal(lintData.valid, true);
  assert.equal(lintData.errors.length, 0);
  console.log('[PASS] 5. tools/call evaluate_ordinance, calculate_ecosystem_benefits, rap_biomechanics, and rap_lint verified');

  // 6. Tool 7: validate_soil_function positive and negative-path verification
  const soilOkRes = await sendRpc('tools/call', {
    name: 'validate_soil_function',
    arguments: {
      tiz_area_m2: 200,
      soil_function: {
        infiltration_mm_hr: 55,
        organic_matter_percent: 4.0,
        water_holding_gal_acre_ft: 52000,
        measurement_dates: ['2026-04-01', '2026-10-01'],
        source: 'OSU Soil Health Lab Panel #2026-105',
        method: 'measured',
      },
    },
  });
  assert.equal(soilOkRes.result.isError, false);
  const soilOkData = JSON.parse(soilOkRes.result.content[0].text);
  assert.equal(soilOkData.valid, true);
  assert.equal(soilOkData.omitted_by_default, false);
  assert.equal(soilOkData.sponge_capacity.infiltration_class, 'Living Sponge (> 50 mm/hr)');
  assert.equal(soilOkData.sponge_capacity.storm_1in_capture_gallons, 1342);

  const soilEmptyRes = await sendRpc('tools/call', {
    name: 'validate_soil_function',
    arguments: { tiz_area_m2: 100 },
  });
  assert.equal(soilEmptyRes.result.isError, false);
  const soilEmptyData = JSON.parse(soilEmptyRes.result.content[0].text);
  assert.equal(soilEmptyData.valid, true);
  assert.equal(soilEmptyData.soil_function, null);
  assert.equal(soilEmptyData.omitted_by_default, true);

  const soilBadRes = await sendRpc('tools/call', {
    name: 'validate_soil_function',
    arguments: {
      soil_function: {
        infiltration_mm_hr: 30,
        measurement_dates: ['2026-04-01', '2026-10-01'],
        method: 'measured',
      },
    },
  });
  assert.equal(soilBadRes.result.isError, true, 'Missing soil_function.source must return isError=true');
  const soilBadData = JSON.parse(soilBadRes.result.content[0].text);
  assert.equal(soilBadData.valid, false);
  assert.equal(soilBadData.error, 'INVALID_SOIL_FUNCTION');
  assert.match(soilBadData.message, /source/i);
  console.log('[PASS] 6. tools/call validate_soil_function positive sponge capacity and negative sourceless rejection verified');

  // 7. Tool 8: leo_rap_verify positive, negative sabotage, phased triage conservation, and handoff brief checks
  const leoOkRes = await sendRpc('tools/call', {
    name: 'leo_rap_verify',
    arguments: {
      assessment: exampleRap,
      jurisdiction_id: 'or-ashland',
      run_self_audit: true,
    },
  });
  assert.equal(leoOkRes.result.isError, false);
  const leoOkData = JSON.parse(leoOkRes.result.content[0].text);
  assert.equal(leoOkData.valid, true);
  assert.equal(leoOkData.verification.valid, true);
  assert.equal(leoOkData.verification.checked_anchors, 8);
  assert.equal(leoOkData.self_audit.self_audit_passed, true);
  assert.equal(leoOkData.self_audit.fixtures_tested, 3);

  const legacyLeoOkRes = await sendRpc('tools/call', {
    name: 'leo_rca_verify',
    arguments: {
      assessment: exampleRap,
      jurisdiction_id: 'or-ashland',
      run_self_audit: false,
    },
  });
  assert.equal(legacyLeoOkRes.result.isError, false);

  const triage = computePhasedStewardshipTriage(exampleRap);
  assert.equal(triage.stages.length, 3);
  assert.equal(triage.day_one_undercuts_removal, true);
  assert.ok(triage.day_one_savings_vs_removal_usd > 0);
  const sumPrices = triage.stages.reduce((s, st) => s + st.client_price_usd, 0);
  const sumNets = triage.stages.reduce((s, st) => s + st.practitioner_net_usd, 0);
  assert.equal(sumPrices, triage.full_5yr_gross_usd);
  assert.equal(sumNets, triage.full_5yr_practitioner_net_usd);

  const sabotagedNarrative =
    `${leoOkData.compiled_brief.brief_markdown}\n\n` +
    'Conclusion: Because of heartwood decay and CRZ = 99.0 ft, we recommend immediate hazard tree removal. [TODO]';
  const leoSabotageRes = await sendRpc('tools/call', {
    name: 'leo_rap_verify',
    arguments: {
      assessment: exampleRap,
      jurisdiction_id: 'or-ashland',
      markdown_narrative: sabotagedNarrative,
      run_self_audit: false,
    },
  });
  assert.equal(leoSabotageRes.result.isError, false);
  const leoSabotageData = JSON.parse(leoSabotageRes.result.content[0].text);
  assert.equal(leoSabotageData.valid, false);
  assert.equal(leoSabotageData.verification.valid, false);
  assert.ok(
    leoSabotageData.verification.errors.some((e) => e.includes('RAP_MATTHECK_T_OVER_R')),
    'Expected RAP_MATTHECK_T_OVER_R violation on sabotaged removal narrative'
  );
  assert.ok(
    leoSabotageData.verification.errors.some((e) => e.includes('MAST_FM_2_6')),
    'Expected MAST_FM_2_6 violation on drifted plain-prose CRZ claim'
  );
  assert.ok(
    leoSabotageData.verification.errors.some((e) => e.includes('EPISTEMIC_STATUS_DRIFT')),
    'Expected EPISTEMIC_STATUS_DRIFT violation on [TODO] placeholder'
  );

  // Verify runLeoRapSelfAudit also handles thin-shell (t/R < 0.30) assessments by cloning t/R >= 0.34 for Fixture 1
  const thinShellClone = JSON.parse(JSON.stringify(exampleRap));
  thinShellClone.structural_baseline.sound_shell_thickness_ratio_t_over_r = 0.21;
  delete thinShellClone.structural_baseline.sonic_tomography_or_resistograph_uri;
  const thinBrief = compileLeoRapBrief(thinShellClone, {
    unverified_gaps: [{ field: 'plan_rules.pruning', description: 'Missing pruning rule' }],
  });
  assert.equal(thinBrief.unverified_tokens.length, 2);
  assert.equal(verifyLeoRapNarrative(thinBrief.brief_markdown, thinShellClone, {
    unverified_gaps: [{ field: 'plan_rules.pruning', description: 'Missing pruning rule' }],
  }).valid, true);
  const thinAudit = runLeoRapSelfAudit(thinShellClone);
  assert.equal(thinAudit.self_audit_passed, true);

  // Verify composeArboristHandoffBrief output, de-fanged homeowner message, and house-style cleanliness
  const handoffParams = {
    speciesCommon: 'Oregon White Oak',
    speciesScientific: 'Quercus garryana',
    dbhInches: 41.34,
    cityLabel: 'Ashland, OR',
    protectionStatus: 'Heritage',
    tOverR: 0.34,
    crzFeet: 41.34,
    holobiontUsd: 457919,
    ctlaUsd: 24414,
    cashInLieuUsd: 8268,
    stage1Usd: triage.stages[0].client_price_usd,
    removalBidUsd: triage.removal_bid_usd,
    marginMultiplier: triage.net_margin_multiplier,
    oakWiltWarning: '',
    shareUrl: 'https://openarbor.org/demo/#oa1=test',
  };
  const handoff = composeArboristHandoffBrief(handoffParams);
  assert.equal(handoff.steward_to_arborist_message.includes('t/R'), false);
  assert.equal(
    handoff.steward_to_arborist_message.includes(triage.stages[0].client_price_usd.toLocaleString('en-US')),
    false
  );
  assert.equal(
    handoff.steward_to_arborist_message.includes(triage.removal_bid_usd.toLocaleString('en-US')),
    false
  );
  assert.ok(handoff.steward_to_arborist_message.includes('circumference'));

  const verifiedHandoff = composeArboristHandoffBrief({
    ...handoffParams,
    sonicTomographyVerified: true,
  });
  assert.ok(verifiedHandoff.arborist_to_client_message.includes('t/R = 0.34'));
  assert.ok(verifiedHandoff.arborist_truck_summary.includes('(instrument-verified)'));

  for (const textField of Object.values(handoff)) {
    assert.equal(typeof textField, 'string');
    assert.ok(textField.length > 20);
    assert.equal(/[\u2014\u2013\u0021]/.test(textField), false, 'Handoff text must contain zero em/en dashes or exclamation points');
    assert.equal(/\s-\s/.test(textField), false, 'Handoff text must contain zero spaced hyphens');
  }
  console.log('[PASS] 7. tools/call leo_rap_verify, 3-stage phased triage, sabotage self-audit, and handoff brief verified');

  // 8. Bounded-input guards on evaluate_ordinance (> 500 trees), lookup_ordinance (> 128 chars), and leo_rap_verify (> 100,000 chars)
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

  const longNarrativeRes = await sendRpc('tools/call', {
    name: 'leo_rap_verify',
    arguments: {
      assessment: exampleRap,
      markdown_narrative: 'A'.repeat(100001),
    },
  });
  assert.equal(longNarrativeRes.result.isError, true);
  const longNarrativePayload = JSON.parse(longNarrativeRes.result.content[0].text);
  assert.equal(longNarrativePayload.error, 'MAX_NARRATIVE_LENGTH_EXCEEDED');
  assert.equal(longNarrativePayload.max_length, 100000);
  console.log('[PASS] 8. MCP bounded-input size guards verified across evaluate_ordinance, lookup_ordinance, and leo_rap_verify');

  // 9. Prototype-chain bypass negative tests on scripts/validate-ordinance.mjs (__proto__ and constructor)
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openarbor-ord-test-'));
  try {
    const protoFixturePath = path.join(tmpDir, 'bad_proto.json');
    const constructorFixturePath = path.join(tmpDir, 'bad_constructor.json');

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

    console.log('[PASS] 9. Ordinance validator prototype-chain negative gates verified (__proto__ and constructor rejected)');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // 10. Unified openarbor_consult, built-in prompts/list + prompts/get, and Steward Agent Pack checks
  const consultHomeRes = await sendRpc('tools/call', {
    name: 'openarbor_consult',
    arguments: {
      circumference_inches: 94.25,
      species: 'Live Oak',
      jurisdiction_id: 'tx-austin',
      audience: 'homeowner',
      cavity_pct: 62,
      crz_disturbed_pct: 10,
      decay_measurement_method: 'visual_only',
    },
  });
  assert.equal(consultHomeRes.result?.isError, false);
  const homeData = consultHomeRes.result?.structuredContent;
  assert.equal(homeData?.audience_guidance?.audience, 'homeowner');
  assert.equal(homeData?.determination?.dbh_inches, 30);
  assert.equal(homeData?.determination?.structural_shell?.t_over_r, 0.38);
  assert.equal(homeData?.determination?.structural_shell?.instrument_verified, false);
  assert.ok(homeData?.secondary_models?.assumptions?.length > 10);

  const consultPracRes = await sendRpc('tools/call', {
    name: 'openarbor_consult',
    arguments: {
      dbh_inches: 32,
      species: 'Oregon White Oak',
      jurisdiction_id: 'or-ashland',
      audience: 'practitioner',
      cavity_pct: 48,
      decay_measurement_method: 'sonic_tomography',
    },
  });
  assert.equal(consultPracRes.result?.isError, false);
  assert.equal(consultPracRes.result?.structuredContent?.audience_guidance?.audience, 'practitioner');
  assert.equal(
    consultPracRes.result?.structuredContent?.determination?.structural_shell?.instrument_verified,
    true
  );

  const consultGapRes = await sendRpc('tools/call', {
    name: 'openarbor_consult',
    arguments: {
      dbh_inches: 24,
      species: 'Live Oak',
      jurisdiction_id: 'tx-cedar-park',
      audience: 'municipal',
    },
  });
  assert.equal(consultGapRes.result?.isError, false);
  const gapProv = consultGapRes.result?.structuredContent?.determination?.provenance;
  assert.equal(gapProv?.record_tier, 'Threshold_And_Fee_Record');
  assert.ok(Array.isArray(gapProv?.unverified_gaps) && gapProv.unverified_gaps.length >= 4);

  const consultErrRes = await sendRpc('tools/call', {
    name: 'openarbor_consult',
    arguments: {
      dbh_inches: 24,
      jurisdiction_id: 'tx-unknown-city',
    },
  });
  assert.equal(consultErrRes.result?.isError, true);
  assert.equal(consultErrRes.result?.structuredContent?.error, 'UNKNOWN_JURISDICTION');

  const promptsListRes = await sendRpc('prompts/list', {});
  const promptNames = (promptsListRes.result?.prompts || []).map((p) => p.name);
  assert.deepEqual(promptNames, [
    'homeowner-tree-guide',
    'rap-practitioner-brief',
    'municipal-plan-review',
  ]);

  const promptGetRes = await sendRpc('prompts/get', {
    name: 'homeowner-tree-guide',
    arguments: { species: 'Live Oak', city: 'tx-austin' },
  });
  const promptText = promptGetRes.result?.messages?.[0]?.content?.text || '';
  assert.ok(promptText.includes('openarbor_consult'));

  const promptErrRes = await sendRpc('prompts/get', {
    name: 'nonexistent-prompt',
    arguments: {},
  });
  assert.equal(promptErrRes.error?.code, -32602);

  const agentPackDir = path.join(REPO_ROOT, 'agents', 'openarbor-steward');
  const agentFiles = ['SKILL.md', 'AGENTS.md', 'claude-agent.md', 'hermes-steward.yaml', 'README.md'];
  const fillerWordRegex = /\b(delve|leverage|robust|seamless|crucial|pivotal|furthermore|moreover|game-changing|tapestry|underscore)\b/i;
  for (const fileName of agentFiles) {
    const filePath = path.join(agentPackDir, fileName);
    assert.ok(fs.existsSync(filePath), `Missing Steward Agent Pack file: ${fileName}`);
    const body = fs.readFileSync(filePath, 'utf8');
    assert.ok(body.trim().length > 100, `Empty Steward Agent Pack file: ${fileName}`);
    assert.ok(!/[\u2013\u2014!]/.test(body), `House-style punctuation violation in ${fileName}`);
    assert.ok(!fillerWordRegex.test(body), `House-style filler violation in ${fileName}`);
    assert.ok(!/[A-Za-z0-9.,;:)"'`][ \t]+-[ \t]+[A-Za-z0-9("'`]/.test(body), `Spaced hyphen violation in ${fileName}`);
  }

  const symDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openarbor-mcp-sym-'));
  const symServerLink = path.join(symDir, 'openarbor-mcp-sym');
  const symBinLink = path.join(symDir, 'openarbor-mcp-bin');
  fs.symlinkSync(SERVER_PATH, symServerLink);
  fs.symlinkSync(path.join(REPO_ROOT, 'bin', 'openarbor-mcp.mjs'), symBinLink);
  const initLines =
    JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'sym', version: '1.0' } },
    }) +
    '\n' +
    JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'shutdown', params: {} }) +
    '\n';
  for (const targetLink of [symServerLink, symBinLink]) {
    const symRun = spawnSync(process.execPath, [targetLink], {
      cwd: os.tmpdir(),
      input: initLines,
      encoding: 'utf8',
    });
    assert.equal(symRun.status, 0, `Symlinked MCP invocation exited ${symRun.status}: ${symRun.stderr}`);
    assert.ok(symRun.stdout.includes('"name":"openarbor-mcp"'), `Symlinked MCP invocation produced no handshake: ${symRun.stdout}`);
    assert.ok(symRun.stdout.includes('"version":"2.2.0"'));
  }

  console.log('[PASS] 10. openarbor_consult, built-in prompts (3), and Steward Agent Pack (5 files) verified');

  // 11. Clean shutdown
  const shutRes = await sendRpc('shutdown', {});
  assert.equal(shutRes.result, null);
  console.log('[PASS] 11. MCP shutdown completed cleanly\n');
  console.log('ALL 11 OPEN ARBOR MCP, CONSULT & STEWARD AGENT CHECKS PASSED (0 proprietary dependencies).');
} finally {
  rl.close();
  if (!child.killed) {
    child.kill();
  }
}
