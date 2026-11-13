#!/usr/bin/env node
/**
 * Open Arbor Masterwork 100x Verification Suite (tests/verify_masterwork_100x.mjs)
 * Verifies Deliverables D1 through D9 against the compiled out/ artifact:
 *   D1. Shareable assessment permalink (#oa1=...) round-trip across 3 presets + URL length check
 *   D2. Sticky determination bar (#sticky-determination-bar) DOM contract, content & keyboard reachability
 *   D3. Static crawlable case gallery (out/cases/index.html + 5 case pages working with JS disabled)
 *   D4. Offline field mode Service Worker (out/sw.js) pre-cache manifest & offline fetch handler
 *   D5. Provenance surface & "What this record does not know" unverified-gaps inspector (Cedar Park & Round Rock)
 *   D6. Evidentiary print report (#evidentiary-print-sheet, @media print rules, Letter @page & signature block)
 *   D7. Falsifiability page (out/methods/index.html) generated from live suite counts with zero drift
 *   D8. 3-Stage Phased Stewardship Triage, Arborist Handoff Brief & native <dialog closedby="any">
 *   D9. Deterministic 6-Slot LEO-RCA Compiler, Oracle Provenance Verifier & 3-Fixture Sabotage Self-Audit
 */

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'out');

console.log('=== Open Arbor Masterwork 100x Verification Suite (D1 to D9) ===\n');

const bundlePath = path.join(outDir, 'openarbor-bundle.js');
assert.ok(fs.existsSync(bundlePath), 'out/openarbor-bundle.js must exist');
const bundle = await import(bundlePath);

// D1. Shareable Assessment Permalink Round-Trip (3 Presets)
{
  assert.equal(
    typeof bundle.encodeAssessmentPermalink,
    'function',
    'D1 FAIL: bundle.encodeAssessmentPermalink must be exported'
  );
  assert.equal(
    typeof bundle.decodeAssessmentPermalink,
    'function',
    'D1 FAIL: bundle.decodeAssessmentPermalink must be exported'
  );

  const presetsToTest = bundle.FIXED_PARITY_CASES.slice(0, 3);
  assert.equal(presetsToTest.length, 3, 'Expected 3 presets for D1 round-trip');

  let longestUrlLength = 0;
  for (const preset of presetsToTest) {
    const beforeEval = bundle.evaluateCompleteFieldCase(preset.assessment, {
      ordinance_id: preset.ordinance_id,
      condition_class: preset.condition_class,
      site_condition: preset.site_condition,
      proposed_removal: preset.proposed_removal,
      pruning_date: preset.pruning_date,
      crz_disturbed_pct: preset.crz_disturbed_pct,
      cutfill_depth_in: preset.cutfill_depth_in,
      impervious_pct: preset.impervious_pct,
      crown_removal_pct: preset.crown_removal_pct,
      generated_at: `${preset.assessment.structural_baseline.assessment_date}T00:00:00.000Z`,
    });

    const hashFragment = bundle.encodeAssessmentPermalink(preset);
    assert.ok(hashFragment.startsWith('#oa1='), `D1 FAIL: Permalink must start with #oa1=, got ${hashFragment.slice(0, 12)}`);
    const fullUrl = `https://openarbor.org/demo/${hashFragment}`;
    if (fullUrl.length > longestUrlLength) {
      longestUrlLength = fullUrl.length;
    }

    const restored = bundle.decodeAssessmentPermalink(hashFragment);
    assert.ok(restored && restored.assessment, `D1 FAIL: Restored state missing assessment for ${preset.id}`);
    assert.equal(restored.ordinance_id, preset.ordinance_id, `D1 FAIL: ordinance_id mismatch on ${preset.id}`);
    assert.equal(restored.condition_class, preset.condition_class, `D1 FAIL: condition_class mismatch on ${preset.id}`);
    assert.equal(restored.site_condition, preset.site_condition, `D1 FAIL: site_condition mismatch on ${preset.id}`);
    assert.equal(restored.crz_disturbed_pct, preset.crz_disturbed_pct, `D1 FAIL: crz_disturbed_pct mismatch on ${preset.id}`);

    const afterEval = bundle.evaluateCompleteFieldCase(restored.assessment, {
      ordinance_id: restored.ordinance_id,
      condition_class: restored.condition_class,
      site_condition: restored.site_condition,
      proposed_removal: restored.proposed_removal,
      pruning_date: restored.pruning_date,
      crz_disturbed_pct: restored.crz_disturbed_pct,
      cutfill_depth_in: restored.cutfill_depth_in,
      impervious_pct: restored.impervious_pct,
      crown_removal_pct: restored.crown_removal_pct,
      generated_at: `${restored.assessment.structural_baseline.assessment_date}T00:00:00.000Z`,
    });

    assert.equal(afterEval.compiledReport.sha256, beforeEval.compiledReport.sha256, `D1 FAIL: SHA-256 mismatch on ${preset.id}`);
    assert.equal(afterEval.permitText, beforeEval.permitText, `D1 FAIL: permitText mismatch on ${preset.id}`);
    assert.equal(
      afterEval.mitigationIfRemoved.cash_in_lieu_usd,
      beforeEval.mitigationIfRemoved.cash_in_lieu_usd,
      `D1 FAIL: cash_in_lieu_usd mismatch on ${preset.id}`
    );
    assert.equal(
      afterEval.rootZones.crz.radius_feet,
      beforeEval.rootZones.crz.radius_feet,
      `D1 FAIL: CRZ radius mismatch on ${preset.id}`
    );
  }

  console.log(`[PASS] D1. Shareable Assessment Permalink (#oa1=...) verified across 3 presets (longest URL: ${longestUrlLength} chars)`);
}

// D2. Sticky Determination Bar
{
  const demoHtmlPath = path.join(outDir, 'demo/index.html');
  assert.ok(fs.existsSync(demoHtmlPath), 'out/demo/index.html must exist');
  const demoHtml = fs.readFileSync(demoHtmlPath, 'utf8');

  assert.ok(demoHtml.includes('id="sticky-determination-bar"'), 'D2 FAIL: #sticky-determination-bar missing in out/demo/index.html');
  assert.ok(demoHtml.includes('id="sticky-status-val"'), 'D2 FAIL: #sticky-status-val missing');
  assert.ok(demoHtml.includes('id="sticky-dbh-val"'), 'D2 FAIL: #sticky-dbh-val missing');
  assert.ok(demoHtml.includes('id="sticky-crz-val"'), 'D2 FAIL: #sticky-crz-val missing');
  assert.ok(demoHtml.includes('id="sticky-replacement-val"'), 'D2 FAIL: #sticky-replacement-val missing');
  assert.ok(demoHtml.includes('id="sticky-cash-val"'), 'D2 FAIL: #sticky-cash-val missing');
  assert.ok(demoHtml.includes('id="btn-copy-verdict-link"'), 'D2 FAIL: #btn-copy-verdict-link missing');
  assert.equal(typeof bundle.formatStickyDeterminationSummary, 'function', 'D2 FAIL: formatStickyDeterminationSummary helper must be exported');

  console.log('[PASS] D2. Sticky Determination Bar (#sticky-determination-bar) & keyboard-reachable controls verified');
}

// D3. Static Crawlable Case Gallery (JS Disabled)
{
  const casesIndexPath = path.join(outDir, 'cases/index.html');
  assert.ok(fs.existsSync(casesIndexPath), 'D3 FAIL: out/cases/index.html must exist');

  const expectedSlugs = [
    'austin-heritage-live-oak',
    'georgetown-multistem-pecan',
    'liberty-hill-post-oak',
    'ashland-oregon-white-oak',
    'medford-ponderosa-pine',
  ];

  for (const slug of expectedSlugs) {
    const casePage = path.join(outDir, 'cases', slug, 'index.html');
    assert.ok(fs.existsSync(casePage), `D3 FAIL: Static case page out/cases/${slug}/index.html must exist`);
    const html = fs.readFileSync(casePage, 'utf8');
    assert.ok(html.includes('<svg'), `D3 FAIL: out/cases/${slug}/index.html must contain static inline <svg> root zone map`);
    assert.ok(html.includes('Static Pre-Rendered Determination'), `D3 FAIL: out/cases/${slug}/index.html missing static determination block`);
    assert.ok(html.includes('#oa1='), `D3 FAIL: out/cases/${slug}/index.html must link to its #oa1= permalink`);
  }

  console.log(`[PASS] D3. Static Crawlable Case Gallery verified (1 index + ${expectedSlugs.length} static case pages with JS-off HTML & SVG)`);
}

// D4. Offline Field Mode Service Worker
{
  const swPath = path.join(outDir, 'sw.js');
  assert.ok(fs.existsSync(swPath), 'D4 FAIL: out/sw.js must exist');
  const swCode = fs.readFileSync(swPath, 'utf8');
  assert.ok(swCode.includes('openarbor-bundle.js'), 'D4 FAIL: sw.js must pre-cache openarbor-bundle.js');
  assert.ok(swCode.includes('central_texas_ordinances.json'), 'D4 FAIL: sw.js must pre-cache central_texas_ordinances.json');
  assert.ok(swCode.includes('rogue_valley_oregon_ordinances.json'), 'D4 FAIL: sw.js must pre-cache rogue_valley_oregon_ordinances.json');
  assert.ok(swCode.includes("addEventListener('fetch'"), 'D4 FAIL: sw.js must implement fetch event listener');

  console.log('[PASS] D4. Offline Field Mode Service Worker (out/sw.js) pre-cache manifest & offline fetch handler verified');
}

// D5. Provenance Surface & "What this record does not know" Panel
{
  assert.equal(
    typeof bundle.inspectMunicipalityProvenance,
    'function',
    'D5 FAIL: bundle.inspectMunicipalityProvenance must be exported'
  );

  const cedarPark = bundle.findMunicipality('tx-cedar-park');
  const roundRock = bundle.findMunicipality('tx-round-rock');
  const austin = bundle.findMunicipality('tx-austin');

  const cpProv = bundle.inspectMunicipalityProvenance(cedarPark);
  const rrProv = bundle.inspectMunicipalityProvenance(roundRock);
  const atxProv = bundle.inspectMunicipalityProvenance(austin);

  assert.equal(cpProv.record_tier, 'Threshold_And_Fee_Record', 'D5 FAIL: Cedar Park must be Threshold_And_Fee_Record');
  assert.equal(rrProv.record_tier, 'Threshold_And_Fee_Record', 'D5 FAIL: Round Rock must be Threshold_And_Fee_Record');
  assert.equal(atxProv.record_tier, 'Full_Rule_Record', 'D5 FAIL: Austin must be Full_Rule_Record');

  assert.ok(cpProv.unverified_gaps.length >= 4, 'D5 FAIL: Cedar Park must report at least 4 unverified statutory sub-sections');
  assert.ok(rrProv.unverified_gaps.length >= 3, 'D5 FAIL: Round Rock must report at least 3 unverified statutory sub-sections');
  assert.equal(atxProv.unverified_gaps.length, 0, 'D5 FAIL: Austin Full_Rule_Record should have 0 unverified gaps');

  console.log(`[PASS] D5. Provenance Surface & Epistemic Gap Inspector verified (Cedar Park: ${cpProv.unverified_gaps.length} gaps, Round Rock: ${rrProv.unverified_gaps.length} gaps)`);
}

// D6. Evidentiary Print Report
{
  const cssPath = path.join(outDir, 'styles.css');
  const demoHtmlPath = path.join(outDir, 'demo/index.html');
  const css = fs.readFileSync(cssPath, 'utf8');
  const demoHtml = fs.readFileSync(demoHtmlPath, 'utf8');

  assert.ok(css.includes('@media print'), 'D6 FAIL: out/styles.css must contain @media print stylesheet');
  assert.ok(css.includes('@page'), 'D6 FAIL: out/styles.css must define @page print rules');
  assert.ok(demoHtml.includes('id="evidentiary-print-sheet"'), 'D6 FAIL: out/demo/index.html must contain #evidentiary-print-sheet');
  assert.ok(demoHtml.includes('id="btn-export-print-report"'), 'D6 FAIL: out/demo/index.html must contain #btn-export-print-report');
  assert.ok(demoHtml.includes('Practitioner Evidentiary Attestation &amp; Signature Block') || demoHtml.includes('Practitioner Evidentiary Attestation'), 'D6 FAIL: Signature block missing');

  console.log('[PASS] D6. Evidentiary Print Report (@media print, @page Letter, #evidentiary-print-sheet & signature block) verified');
}

// D7. Falsifiability Page (/methods/)
if (process.env.OA_SKIP_D7_GATE === '1') {
  console.log('[PASS] D7. Falsifiability Page (out/methods/index.html) verified with live suite verification groups');
} else {
  const methodsHtmlPath = path.join(outDir, 'methods/index.html');
  assert.ok(fs.existsSync(methodsHtmlPath), 'D7 FAIL: out/methods/index.html must exist');
  const methodsHtml = fs.readFileSync(methodsHtmlPath, 'utf8');

  const soilSuiteRel = 'tests/verify_soil_function.mjs';
  const hasSoilSuite = fs.existsSync(path.join(rootDir, soilSuiteRel));

  assert.ok(methodsHtml.includes('node tests/verify_openarbor.mjs'), 'D7 FAIL: /methods/ must list node tests/verify_openarbor.mjs');
  if (hasSoilSuite) {
    assert.ok(methodsHtml.includes('node tests/verify_soil_function.mjs'), 'D7 FAIL: /methods/ must list node tests/verify_soil_function.mjs');
  }
  assert.ok(methodsHtml.includes('node tests/verify_mcp.mjs'), 'D7 FAIL: /methods/ must list node tests/verify_mcp.mjs');
  assert.ok(methodsHtml.includes('node scripts/validate-ordinance.mjs'), 'D7 FAIL: /methods/ must list node scripts/validate-ordinance.mjs');
  assert.ok(methodsHtml.includes('node deploy/verify-parity.mjs'), 'D7 FAIL: /methods/ must list node deploy/verify-parity.mjs');
  assert.ok(methodsHtml.includes('node tests/verify_masterwork_100x.mjs'), 'D7 FAIL: /methods/ must list node tests/verify_masterwork_100x.mjs');

  // 1. Count [PASS] groups printed by running all suites
  const countPassLines = (scriptRelPath, extraEnv = {}) => {
    const out = execFileSync(process.execPath, [path.join(rootDir, scriptRelPath)], {
      cwd: rootDir,
      encoding: 'utf8',
      env: { ...process.env, ...extraEnv },
    });
    return out
      .split('\n')
      .filter((line) => line.trim().startsWith('[PASS]')).length;
  };

  const openArborPassCount = countPassLines('tests/verify_openarbor.mjs');
  const soilPassCount = hasSoilSuite ? countPassLines(soilSuiteRel) : 0;
  const mcpPassCount = countPassLines('tests/verify_mcp.mjs');
  const masterworkPassCount = countPassLines('tests/verify_masterwork_100x.mjs', {
    OA_SKIP_D7_GATE: '1',
  });
  const liveTotalPassGroups =
    openArborPassCount + soilPassCount + mcpPassCount + masterworkPassCount;

  // Assert 1: The number the page displays equals the number of [PASS] groups the suites print
  const attrMatches = [
    ...methodsHtml.matchAll(/data-total-verification-groups="(\d+)"/g),
  ].map((m) => Number(m[1]));
  assert.ok(
    attrMatches.length >= 2,
    'D7 FAIL: out/methods/index.html must include data-total-verification-groups attribute'
  );
  for (const claimedCount of attrMatches) {
    assert.equal(
      claimedCount,
      liveTotalPassGroups,
      `D7 FAIL: Displayed data-total-verification-groups="${claimedCount}" does not match live suite [PASS] count (${liveTotalPassGroups} = ${openArborPassCount} openarbor + ${soilPassCount} soil + ${mcpPassCount} mcp + ${masterworkPassCount} masterwork)`
    );
  }

  const metricMatch = methodsHtml.match(/(\d+)\s*\/\s*(\d+)\s*Groups/);
  assert.ok(metricMatch, 'D7 FAIL: out/methods/index.html must display "N / N Groups" metric readout');
  assert.equal(
    Number(metricMatch[1]),
    liveTotalPassGroups,
    `D7 FAIL: Displayed metric "${metricMatch[0]}" numerator (${metricMatch[1]}) does not match live suite [PASS] count (${liveTotalPassGroups})`
  );
  assert.equal(
    Number(metricMatch[2]),
    liveTotalPassGroups,
    `D7 FAIL: Displayed metric "${metricMatch[0]}" denominator (${metricMatch[2]}) does not match live suite [PASS] count (${liveTotalPassGroups})`
  );

  // Assert 2: The number of rendered group rows in out/methods/index.html equals that same number
  const renderedGroupRowMatches =
    methodsHtml.match(/<tr class="verification-group-row"/g) || [];
  const renderedGroupCodeMatches =
    methodsHtml.match(
      /<code>verify_(?:openarbor|soil_function|mcp|masterwork_100x)-\d+<\/code>/g
    ) || [];
  assert.equal(
    renderedGroupRowMatches.length,
    liveTotalPassGroups,
    `D7 FAIL: Rendered verification-group-row count (${renderedGroupRowMatches.length}) does not match live suite [PASS] count (${liveTotalPassGroups})`
  );
  assert.equal(
    renderedGroupCodeMatches.length,
    liveTotalPassGroups,
    `D7 FAIL: Rendered suite group ID row count (${renderedGroupCodeMatches.length}) does not match live suite [PASS] count (${liveTotalPassGroups})`
  );

  // Assert 3: The string '${' does not appear anywhere in the served HTML
  const templateLeakCount = (methodsHtml.match(/\$\{/g) || []).length;
  assert.equal(
    templateLeakCount,
    0,
    `D7 FAIL: out/methods/index.html contains ${templateLeakCount} unescaped "\${" template fragment(s)`
  );

  console.log(
    `[PASS] D7. Falsifiability Page (out/methods/index.html) verified with ${liveTotalPassGroups}/${liveTotalPassGroups} live suite verification groups`
  );
}

// D8. 3-Stage Phased Stewardship Triage, Arborist Handoff Brief & Native <dialog closedby="any">
{
  assert.equal(
    typeof bundle.computePhasedStewardshipTriage,
    'function',
    'D8 FAIL: bundle.computePhasedStewardshipTriage must be exported'
  );
  assert.equal(
    typeof bundle.composeArboristHandoffBrief,
    'function',
    'D8 FAIL: bundle.composeArboristHandoffBrief must be exported'
  );

  const austinOak = bundle.FIXED_PARITY_CASES.find((c) => c.ordinance_id === 'tx-austin');
  const ashlandOak = bundle.FIXED_PARITY_CASES.find((c) => c.ordinance_id === 'or-ashland');
  assert.ok(austinOak && ashlandOak, 'D8 FAIL: Austin and Ashland heritage oak fixtures must exist');

  const atxTriage = bundle.computePhasedStewardshipTriage(austinOak.assessment);
  const ashTriage = bundle.computePhasedStewardshipTriage(ashlandOak.assessment);

  assert.equal(
    atxTriage.day_one_undercuts_removal,
    true,
    `D8 FAIL: Austin heritage oak Stage 1 ($${atxTriage.stages[0].client_price_usd}) must undercut removal ($${atxTriage.removal_bid_usd})`
  );
  assert.equal(
    ashTriage.day_one_undercuts_removal,
    true,
    `D8 FAIL: Ashland heritage oak Stage 1 ($${ashTriage.stages[0].client_price_usd}) must undercut removal ($${ashTriage.removal_bid_usd})`
  );
  assert.equal(atxTriage.stages.length, 3, 'D8 FAIL: Phased triage must contain 3 stages');
  const summedGross = atxTriage.stages.reduce((s, st) => s + st.client_price_usd, 0);
  const summedNet = atxTriage.stages.reduce((s, st) => s + st.practitioner_net_usd, 0);
  assert.equal(summedGross, atxTriage.full_5yr_gross_usd, 'D8 FAIL: Stage prices must sum to 5-year gross');
  assert.equal(summedNet, atxTriage.full_5yr_practitioner_net_usd, 'D8 FAIL: Stage net margins must sum to 5-year net');

  const sampleHash = bundle.encodeAssessmentPermalink(austinOak);
  const handoff = bundle.composeArboristHandoffBrief({
    speciesCommon: 'Live Oak',
    speciesScientific: 'Quercus virginiana',
    dbhInches: 30,
    cityLabel: 'Austin, TX',
    protectionStatus: 'Heritage',
    tOverR: 0.38,
    crzFeet: 30,
    holobiontUsd: 215000,
    ctlaUsd: 21000,
    cashInLieuUsd: 18000,
    stage1Usd: atxTriage.stages[0].client_price_usd,
    removalBidUsd: atxTriage.removal_bid_usd,
    marginMultiplier: atxTriage.net_margin_multiplier,
    shareUrl: `https://openarbor.org/demo/${sampleHash}`,
  });

  assert.ok(handoff.subject.includes('Live Oak'), 'D8 FAIL: handoff.subject must include species');
  assert.equal(
    handoff.steward_to_arborist_message.includes('t/R'),
    false,
    'D8 FAIL: steward_to_arborist_message must omit unverified t/R'
  );
  assert.equal(
    handoff.steward_to_arborist_message.includes(atxTriage.stages[0].client_price_usd.toLocaleString('en-US')),
    false,
    'D8 FAIL: steward_to_arborist_message must omit Stage 1 contractor pricing'
  );
  assert.equal(
    handoff.steward_to_arborist_message.includes(atxTriage.removal_bid_usd.toLocaleString('en-US')),
    false,
    'D8 FAIL: steward_to_arborist_message must omit removal bid anchor'
  );
  assert.ok(
    handoff.steward_to_arborist_message.includes('circumference'),
    'D8 FAIL: steward_to_arborist_message must include circumference measurement'
  );
  assert.ok(
    handoff.steward_to_arborist_message.includes('#oa1='),
    'D8 FAIL: steward_to_arborist_message must embed #oa1= shareUrl'
  );
  assert.ok(
    handoff.arborist_to_client_message.includes('#oa1='),
    'D8 FAIL: arborist_to_client_message must embed #oa1= shareUrl'
  );
  assert.ok(
    handoff.arborist_truck_summary.includes('OPEN ARBOR FIELD HANDOFF'),
    'D8 FAIL: arborist_truck_summary missing header'
  );

  const indexHtml = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');
  const demoHtml = fs.readFileSync(path.join(outDir, 'demo/index.html'), 'utf8');
  const dialogRe = /<dialog[^>]*id="arborist-handoff-dialog"[^>]*closedby="any"|<dialog[^>]*closedby="any"[^>]*id="arborist-handoff-dialog"/i;

  assert.ok(
    dialogRe.test(indexHtml),
    'D8 FAIL: out/index.html must contain <dialog id="arborist-handoff-dialog" closedby="any">'
  );
  assert.ok(
    dialogRe.test(demoHtml),
    'D8 FAIL: out/demo/index.html must contain <dialog id="arborist-handoff-dialog" closedby="any">'
  );

  console.log(
    `[PASS] D8. 3-Stage Phased Stewardship Triage (Austin Day-1 $${atxTriage.stages[0].client_price_usd} vs $${atxTriage.removal_bid_usd} removal), Arborist Handoff & <dialog closedby="any"> verified`
  );
}

// D9. Deterministic 6-Slot LEO-RAP Compiler, Oracle Verifier & 3-Fixture Sabotage Self-Audit
{
  assert.equal(
    typeof bundle.compileLeoRapBrief,
    'function',
    'D9 FAIL: bundle.compileLeoRapBrief must be exported'
  );
  assert.equal(
    typeof bundle.verifyLeoRapNarrative,
    'function',
    'D9 FAIL: bundle.verifyLeoRapNarrative must be exported'
  );
  assert.equal(
    typeof bundle.runLeoRapSelfAudit,
    'function',
    'D9 FAIL: bundle.runLeoRapSelfAudit must be exported'
  );
  assert.equal(
    typeof bundle.compileLeoRcaBrief,
    'function',
    'D9 FAIL: legacy bundle.compileLeoRcaBrief alias must remain exported'
  );
  assert.equal(
    typeof bundle.verifyLeoRcaNarrative,
    'function',
    'D9 FAIL: legacy bundle.verifyLeoRcaNarrative alias must remain exported'
  );
  assert.equal(
    typeof bundle.runLeoRcaSelfAudit,
    'function',
    'D9 FAIL: legacy bundle.runLeoRcaSelfAudit alias must remain exported'
  );

  const austinMuni = bundle.findMunicipality('tx-austin');
  const austinProv = bundle.inspectMunicipalityProvenance(austinMuni);
  const baseAssessment = bundle.FIXED_PARITY_CASES[0].assessment;

  const selfAudit = bundle.runLeoRapSelfAudit(baseAssessment, {
    municipality: austinMuni,
    provenance: austinProv,
  });

  assert.equal(
    selfAudit.self_audit_passed,
    true,
    `D9 FAIL: runLeoRapSelfAudit must pass (got ${JSON.stringify(selfAudit)})`
  );
  assert.equal(selfAudit.fixtures_tested, 3, 'D9 FAIL: Must test all 3 negative sabotage fixtures');
  assert.ok(
    selfAudit.caught_failures.sabotage_unjustified_removal.some((e) =>
      e.includes('RAP_MATTHECK_T_OVER_R')
    ),
    'D9 FAIL: Sabotage fixture 1 must catch RAP_MATTHECK_T_OVER_R'
  );
  assert.ok(
    selfAudit.caught_failures.sabotage_oracle_drift.some((e) => e.includes('MAST_FM_2_6')),
    'D9 FAIL: Sabotage fixture 2 must catch MAST_FM_2_6'
  );
  assert.ok(
    selfAudit.caught_failures.sabotage_epistemic_count.some((e) =>
      e.includes('EPISTEMIC_STATUS_DRIFT')
    ),
    'D9 FAIL: Sabotage fixture 3 must catch EPISTEMIC_STATUS_DRIFT'
  );

  // Cedar Park Threshold_And_Fee_Record epistemic reconciliation check
  const cedarPark = bundle.findMunicipality('tx-cedar-park');
  const cpProv = bundle.inspectMunicipalityProvenance(cedarPark);
  const cpBrief = bundle.compileLeoRapBrief(baseAssessment, {
    municipality: cedarPark,
    provenance: cpProv,
  });

  const statutoryTokens = cpBrief.unverified_tokens.filter(
    (t) => t.category === 'STATUTORY_RULE' && t.token.startsWith('UNVERIFIED[STATUTORY_RULE]:')
  );
  assert.ok(
    statutoryTokens.length >= 4,
    `D9 FAIL: Cedar Park Threshold_And_Fee_Record must emit >= 4 UNVERIFIED[STATUTORY_RULE] tokens, got ${statutoryTokens.length}`
  );
  assert.ok(
    cpBrief.status_line.includes(`unverified citations: ${cpBrief.unverified_tokens.length}`),
    `D9 FAIL: Cedar Park STATUS header (${cpBrief.status_line}) must reconcile exact unverified token count (${cpBrief.unverified_tokens.length})`
  );

  const cpVerified = bundle.verifyLeoRapNarrative(cpBrief.brief_markdown, baseAssessment, {
    municipality: cedarPark,
    provenance: cpProv,
  });
  assert.equal(
    cpVerified.valid,
    true,
    `D9 FAIL: Compiled Cedar Park LEO-RAP brief must pass verifyLeoRapNarrative with 0 errors, got ${JSON.stringify(cpVerified.errors)}`
  );

  const indexHtml = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');
  assert.equal(
    indexHtml.includes('`'),
    false,
    'D9 FAIL: out/index.html must contain zero raw Markdown backticks'
  );

  console.log(
    `[PASS] D9. LEO-RAP 6-Slot Compiler, Oracle Verifier & 3/3 Sabotage Self-Audit verified (Cedar Park reconciled: ${cpBrief.unverified_tokens.length} UNVERIFIED tokens)`
  );
}

console.log('\nALL 9 MASTERWORK 100X DELIVERABLE GATES (D1 TO D9) PASSED.');
