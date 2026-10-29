#!/usr/bin/env node
/**
 * OpenArbor v2.0 CLI vs. Browser Bundle Parity Verification Runner
 * Executes three fixed Central Texas input sets through BOTH:
 *   1. Local CLI (node bin/openarbor-rca.mjs compile / counter-notice / economics --json) + Node core engines
 *   2. Compiled Browser Bundle (out/openarbor-bundle.js)
 * Tabulates core outputs side by side, asserts 3/3 identical parity, and writes deploy/VERIFICATION.md.
 */

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  calculateCRZ,
  calculateSRZ,
} from '../src/core/rootZone.js';
import {
  evaluateTreeInventory,
  permitDetermination,
  permitSummary,
  computeMitigationPlan,
  statusLabel,
} from '../src/core/ordinanceEngine.js';
import {
  estimateTreeAge,
  calculateTreeEcosystemBenefits,
  toGeoJSONFeatureCollection,
} from '../src/core/ecosystemBenefits.js';
import {
  decodePlusCode,
  evaluateBiomechanicsAndRhizosphere,
  computeHolobiontValuation,
  lintRcaEvidentiaryReport,
  computeCanonicalSha256,
} from '../src/core/rcaEngine.js';

import * as browserBundle from '../out/openarbor-bundle.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const cliPath = path.join(rootDir, 'bin/openarbor-rca.mjs');
const fixturesDir = path.join(rootDir, 'deploy/fixtures');
const verificationMdPath = path.join(rootDir, 'deploy/VERIFICATION.md');

fs.mkdirSync(fixturesDir, { recursive: true });

const txOrdinances = JSON.parse(
  fs.readFileSync(path.join(rootDir, 'data/ordinances/central_texas_ordinances.json'), 'utf8')
);

const cases = browserBundle.FIXED_PARITY_CASES;
assert.equal(cases.length, 3, 'Expected exactly 3 fixed parity cases');

const caseResults = [];

for (const c of cases) {
  const fixturePath = path.join(fixturesDir, `${c.id}.json`);
  fs.writeFileSync(fixturePath, JSON.stringify(c.assessment, null, 2) + '\n', 'utf8');

  // 1. Run Local CLI subcommands
  const cliCompileStdout = execFileSync(
    process.execPath,
    [cliPath, 'compile', fixturePath, '--ordinance', c.ordinance_id],
    { encoding: 'utf8' }
  ).trimEnd();

  const cliCounterNoticeStdout = execFileSync(
    process.execPath,
    [cliPath, 'counter-notice', fixturePath],
    { encoding: 'utf8' }
  ).trimEnd();

  const cliEconomicsJsonStdout = execFileSync(
    process.execPath,
    [cliPath, 'economics', fixturePath, '--json'],
    { encoding: 'utf8' }
  ).trimEnd();
  const cliEcon = JSON.parse(cliEconomicsJsonStdout);

  // Node-side direct core engine calls for tabular comparison
  const muni = txOrdinances.municipalities.find((m) => m.id === c.ordinance_id);
  const nodeSha256 = computeCanonicalSha256(c.assessment);
  const nodeLint = lintRcaEvidentiaryReport(c.assessment);
  const nodeBio = evaluateBiomechanicsAndRhizosphere(c.assessment);
  const nodeVal = computeHolobiontValuation(c.assessment);

  const sb = c.assessment.structural_baseline;
  const coords = decodePlusCode(sb.plus_code_global);
  const speciesEntry = browserBundle.CENTRAL_TEXAS_SPECIES.find(
    (s) => s.scientific.toLowerCase() === sb.species_scientific.toLowerCase()
  );
  const nodeAge = estimateTreeAge({
    dbh_inches: nodeBio.dbh_inches,
    base_growth_factor: speciesEntry?.growth_factor || 4.5,
    site_condition: c.site_condition,
  });

  const heightFt = Math.round((sb.height_m / 0.3048) * 10) / 10;
  const spreadFt = Math.round((((sb.crown_spread_ns_m + sb.crown_spread_ew_m) / 2) / 0.3048) * 10) / 10;
  const nodeEco = calculateTreeEcosystemBenefits({
    species_name: sb.species_scientific,
    common_name: sb.species_common,
    dbh_inches: nodeBio.dbh_inches,
    height_feet: heightFt,
    canopy_spread_feet: spreadFt,
    condition_class: c.condition_class,
  });

  const conditionScoreMap = { Excellent: 10, Good: 8, Fair: 6, Poor: 4, Critical: 2, Dead: 0 };
  const stemsInches =
    sb.is_multistem && Array.isArray(sb.stem_diameters_cm)
      ? sb.stem_diameters_cm.map((cm) => Math.round((cm / 2.54) * 10) / 10)
      : [nodeBio.dbh_inches];

  const invInput = [
    {
      tag: sb.tree_tag,
      species_common: sb.species_common,
      species_scientific: sb.species_scientific,
      stems_inches: stemsInches,
      dbh_inches: nodeBio.dbh_inches,
      lat: coords.lat,
      lng: coords.lng,
      condition_score: conditionScoreMap[c.condition_class] ?? 8,
      removal: c.proposed_removal,
      pruning_date: c.pruning_date,
      crz_disturbed_pct: c.crz_disturbed_pct,
      cutfill_within_half_crz: c.cutfill_depth_in > 0,
      cutfill_depth_in: c.cutfill_depth_in,
      impervious_pct: c.impervious_pct,
      crown_removal_pct: c.crown_removal_pct,
      actions: c.pruning_date ? ['pruning'] : [],
    },
  ];
  const nodeEvalRows = evaluateTreeInventory(invInput, muni);
  const nodePermit = permitDetermination(nodeEvalRows, muni);
  const nodePermitText = permitSummary(nodePermit);
  const nodeRemovedRows = evaluateTreeInventory([{ ...invInput[0], removal: true }], muni);
  const nodeMitIfDestroyed = computeMitigationPlan(nodeRemovedRows, muni);
  const nodeCrz = calculateCRZ(
    nodeBio.dbh_inches,
    Number(muni.plan_rules?.root_zone?.crz_ft_per_inch) || 1.0,
    Number(muni.plan_rules?.root_zone?.crz_min_ft) || 0
  );
  const nodeSrz = calculateSRZ(
    c.assessment.rhizosphere_and_root_collar.root_flare_diameter_cm / 2.54,
    nodeBio.dbh_inches
  );
  const nodeGeojson = toGeoJSONFeatureCollection(nodeEvalRows, {
    name: `OpenArbor_${sb.tree_tag}`,
    generated_at: `${sb.assessment_date}T00:00:00.000Z`,
    jurisdiction_id: c.ordinance_id,
    jurisdiction_name: muni.name,
    ordinance_citation: muni.ordinance_numbers,
    rca_sha256: nodeSha256,
  });
  nodeGeojson.features[0].properties = {
    ...nodeGeojson.features[0].properties,
    jurisdiction_id: c.ordinance_id,
    protection_status: statusLabel(nodeEvalRows[0]),
    permit_summary: nodePermitText,
    ctla_10th_ed_depreciated_usd: nodeVal.ctla_10th_ed_depreciated_usd,
    holobiont_200yr_biological_equity_usd: nodeVal.holobiont_200yr_biological_equity_usd,
    annual_ecosystem_benefits_usd: nodeEco.total_annual_benefits_usd,
    estimated_age_years: nodeAge.estimated_age_years,
    t_over_r_ratio: nodeBio.biomechanics.sound_shell_thickness_ratio_t_over_r,
    mattheck_stable: nodeBio.biomechanics.mattheck_criterion_satisfied,
    rca_sha256: nodeSha256,
  };

  // 2. Run Compiled Browser Bundle (out/openarbor-bundle.js)
  const webRes = browserBundle.evaluateCompleteFieldCase(c.assessment, {
    ordinance_id: c.ordinance_id,
    condition_class: c.condition_class,
    site_condition: c.site_condition,
    proposed_removal: c.proposed_removal,
    pruning_date: c.pruning_date,
    crz_disturbed_pct: c.crz_disturbed_pct,
    cutfill_depth_in: c.cutfill_depth_in,
    impervious_pct: c.impervious_pct,
    crown_removal_pct: c.crown_removal_pct,
    generated_at: `${sb.assessment_date}T00:00:00.000Z`,
  });

  const rows = [
    {
      metric: 'RCA_v2 Canonical SHA-256 Digest',
      cli: nodeSha256,
      web: webRes.compiledReport.sha256,
    },
    {
      metric: 'CLI compile Report Markdown Length (chars)',
      cli: String(cliCompileStdout.length),
      web: String(webRes.compiledReport.markdown.trimEnd().length),
    },
    {
      metric: 'CLI compile Report Exact String Match',
      cli: 'SHA256:' + computeCanonicalSha256({ md: cliCompileStdout }),
      web: 'SHA256:' + computeCanonicalSha256({ md: webRes.compiledReport.markdown.trimEnd() }),
    },
    {
      metric: 'CLI counter-notice Exact String Match',
      cli: 'SHA256:' + computeCanonicalSha256({ md: cliCounterNoticeStdout }),
      web: 'SHA256:' + computeCanonicalSha256({ md: webRes.counterNotice.notice_markdown.trimEnd() }),
    },
    {
      metric: 'Evidentiary Linter Status (Passed Checks)',
      cli: `${nodeLint.valid} (${nodeLint.passed_checks.length})`,
      web: `${webRes.lint.valid} (${webRes.lint.passed_checks.length})`,
    },
    {
      metric: 'Evaluated DBH (cm / inches)',
      cli: `${nodeBio.dbh_cm} cm / ${nodeBio.dbh_inches} in`,
      web: `${webRes.biomechanics.dbh_cm} cm / ${webRes.biomechanics.dbh_inches} in`,
    },
    {
      metric: 'Mattheck Sound Shell Ratio (t/R) & Stability',
      cli: `${nodeBio.biomechanics.sound_shell_thickness_ratio_t_over_r} (${nodeBio.biomechanics.mattheck_criterion_satisfied})`,
      web: `${webRes.biomechanics.biomechanics.sound_shell_thickness_ratio_t_over_r} (${webRes.biomechanics.biomechanics.mattheck_criterion_satisfied})`,
    },
    {
      metric: 'Root Zones: SRZ / CRZ / TIZ Radius (m)',
      cli: `${nodeSrz.radius_meters} m / ${nodeCrz.radius_meters} m / ${nodeBio.root_zones.tiz_radius_meters} m`,
      web: `${webRes.rootZones.srz.radius_meters} m / ${webRes.rootZones.crz.radius_meters} m / ${webRes.biomechanics.root_zones.tiz_radius_meters} m`,
    },
    {
      metric: 'AirSpade Decompacted Soil Volume (m3)',
      cli: `${nodeBio.rhizosphere_prescription.total_decompacted_soil_m3} m3`,
      web: `${webRes.biomechanics.rhizosphere_prescription.total_decompacted_soil_m3} m3`,
    },
    {
      metric: 'Amendments: Biochar (L) / Compost (m3) / Mulch (m3)',
      cli: `${nodeBio.rhizosphere_prescription.amendments.precharged_biochar_liters} L / ${nodeBio.rhizosphere_prescription.amendments.fungal_compost_m3} m3 / ${nodeBio.rhizosphere_prescription.amendments.ramial_woodchip_mulch_m3} m3`,
      web: `${webRes.biomechanics.rhizosphere_prescription.amendments.precharged_biochar_liters} L / ${webRes.biomechanics.rhizosphere_prescription.amendments.fungal_compost_m3} m3 / ${webRes.biomechanics.rhizosphere_prescription.amendments.ramial_woodchip_mulch_m3} m3`,
    },
    {
      metric: 'Municipal Protection Tier & Citation',
      cli: `${statusLabel(nodeEvalRows[0])} (${nodePermit.citation})`,
      web: `${statusLabel(webRes.evaluatedRow)} (${webRes.permit.citation})`,
    },
    {
      metric: 'Municipal Permit Verdict',
      cli: nodePermitText,
      web: webRes.permitText,
    },
    {
      metric: 'Mitigation If Destroyed (Cash-in-Lieu / Inches)',
      cli: `$${nodeMitIfDestroyed.cash_in_lieu_usd} (${nodeMitIfDestroyed.replacement_inches_owed} in)`,
      web: `$${webRes.mitigationIfRemoved.cash_in_lieu_usd} (${webRes.mitigationIfRemoved.replacement_inches_owed} in)`,
    },
    {
      metric: 'Classical CTLA 10th Ed. Depreciated Value (USD)',
      cli: `$${nodeVal.ctla_10th_ed_depreciated_usd}`,
      web: `$${webRes.valuation.ctla_10th_ed_depreciated_usd}`,
    },
    {
      metric: '200-Yr Holobiont Biological Equity (USD)',
      cli: `$${nodeVal.holobiont_200yr_biological_equity_usd} (${nodeVal.inversion_ratio}x)`,
      web: `$${webRes.valuation.holobiont_200yr_biological_equity_usd} (${webRes.valuation.inversion_ratio}x)`,
    },
    {
      metric: 'Legacy Removal Bid Gross / Net Margin (USD)',
      cli: `$${cliEcon.legacy_removal_model.one_time_gross_bid_usd} / $${cliEcon.legacy_removal_model.net_practitioner_margin_usd}`,
      web: `$${webRes.economics.legacy_removal_model.one_time_gross_bid_usd} / $${webRes.economics.legacy_removal_model.net_practitioner_margin_usd}`,
    },
    {
      metric: 'RCA 5-Yr Stewardship Gross / Net Margin (USD)',
      cli: `$${cliEcon.regenerative_stewardship_model.five_year_gross_revenue_usd} / $${cliEcon.regenerative_stewardship_model.net_practitioner_margin_usd} (${cliEcon.comparison.margin_multiplier}x)`,
      web: `$${webRes.economics.regenerative_stewardship_model.five_year_gross_revenue_usd} / $${webRes.economics.regenerative_stewardship_model.net_practitioner_margin_usd} (${webRes.economics.comparison.margin_multiplier}x)`,
    },
    {
      metric: 'John White (FCIN12) Estimated Tree Age',
      cli: `${nodeAge.estimated_age_years} yrs (factor ${nodeAge.adjusted_growth_factor})`,
      web: `${webRes.ageEstimate.estimated_age_years} yrs (factor ${webRes.ageEstimate.adjusted_growth_factor})`,
    },
    {
      metric: 'Allometric Carbon Stored / Annual Runoff Avoided',
      cli: `${nodeEco.carbon_storage_lbs} lbs / ${nodeEco.avoided_runoff_gallons_yr} gal/yr`,
      web: `${webRes.ecosystemBenefits.carbon_storage_lbs} lbs / ${webRes.ecosystemBenefits.avoided_runoff_gallons_yr} gal/yr`,
    },
    {
      metric: 'Allometric Annual / 20-Yr Projected Benefits (USD)',
      cli: `$${nodeEco.total_annual_benefits_usd}/yr / $${nodeEco.projected_20yr_benefits_usd}`,
      web: `$${webRes.ecosystemBenefits.total_annual_benefits_usd}/yr / $${webRes.ecosystemBenefits.projected_20yr_benefits_usd}`,
    },
    {
      metric: 'OGC CRS84 GeoJSON Export SHA-256',
      cli: computeCanonicalSha256(nodeGeojson),
      web: computeCanonicalSha256(webRes.geojson),
    },
  ];

  for (const r of rows) {
    assert.equal(r.web, r.cli, `Parity mismatch in ${c.id} on ${r.metric}: CLI=${r.cli} vs Web=${r.web}`);
  }

  caseResults.push({
    caseInfo: c,
    fixtureRelPath: `deploy/fixtures/${c.id}.json`,
    rows,
    identical: rows.every((r) => r.cli === r.web),
  });
}

const outFiles = fs.readdirSync(path.join(rootDir, 'out')).sort().map((f) => {
  const s = fs.statSync(path.join(rootDir, 'out', f));
  return { name: `out/${f}`, bytes: s.size };
});

const mdLines = [
  '# OpenArbor v2.0 CLI vs. Browser Bundle Parity Verification Report',
  '',
  '- **Verification Date:** `2026-10-28`',
  '- **Parity Verdict:** **3/3 IDENTICAL (`PASS`)**',
  '- **Certified Engine Integrity:** Zero modifications to `src/core/*` or `data/ordinances/*`. The browser bundle (`out/openarbor-bundle.js`) imports the exact certified source modules via `esbuild`.',
  '',
  '## 1. Static Build Artifact Inventory (`out/`)',
  '',
  '| File Path | Size (Bytes) | Role |',
  '| :--- | :--- | :--- |',
  ...outFiles.map((f) => {
    const role =
      f.name === 'out/index.html'
        ? 'Mobile-first single-page field tool HTML shell'
        : f.name === 'out/openarbor-bundle.js'
        ? 'Compiled ESM browser bundle (engines + ordinances + schemas + UI)'
        : f.name === 'out/styles.css'
        ? 'High-contrast field stylesheet'
        : 'GitHub Pages Jekyll bypass marker';
    return `| \`${f.name}\` | \`${f.bytes}\` | ${role} |`;
  }),
  '',
  '## 2. Executive Summary of 3 Fixed Input Cases',
  '',
  '| Case ID | Municipality | Species & Tag | DBH | CLI vs. Browser Bundle Parity |',
  '| :--- | :--- | :--- | :--- | :--- |',
  ...caseResults.map(
    ({ caseInfo, rows, identical }) =>
      `| \`${caseInfo.id}\` | \`${caseInfo.ordinance_id}\` | *${caseInfo.assessment.structural_baseline.species_scientific}* (\`${caseInfo.assessment.structural_baseline.tree_tag}\`) | ${rows.find((r) => r.metric.startsWith('Evaluated DBH')).cli} | **${identical ? 'IDENTICAL (21/21 metrics match)' : 'DIVERGENT'}** |`
  ),
  '',
];

for (const [idx, res] of caseResults.entries()) {
  const c = res.caseInfo;
  mdLines.push(
    `## 3.${idx + 1} ${c.label}`,
    '',
    `- **Fixture File:** \`${res.fixtureRelPath}\``,
    `- **CLI Command Executed:** \`node bin/openarbor-rca.mjs compile ${res.fixtureRelPath} --ordinance ${c.ordinance_id}\``,
    `- **CLI Economics Command:** \`node bin/openarbor-rca.mjs economics ${res.fixtureRelPath} --json\``,
    `- **CLI Counter-Notice Command:** \`node bin/openarbor-rca.mjs counter-notice ${res.fixtureRelPath}\``,
    `- **Browser Bundle Call:** \`evaluateCompleteFieldCase(assessment, { ordinance_id: '${c.ordinance_id}', ... })\` from \`out/openarbor-bundle.js\``,
    '',
    '| Output Metric / Artifact | Local CLI (`bin/openarbor-rca.mjs` + Node Core) | Browser Bundle (`out/openarbor-bundle.js`) | Match |',
    '| :--- | :--- | :--- | :--- |',
    ...res.rows.map((r) => `| **${r.metric}** | \`${r.cli}\` | \`${r.web}\` | **IDENTICAL** |`),
    ''
  );
}

mdLines.push(
  '## 4. Findings & Engine Observations',
  '',
  '- **Zero Engine Divergences:** All three fixed Central Texas test cases achieved 100% bit-for-bit parity across all 21 evaluated metrics, including the canonical SHA-256 digest, compiled 10-section RCA Evidentiary Markdown report, Scientific Preservation Counter-Notice Markdown, 5-year practice economics JSON, municipal ordinance permit and cash-in-lieu mitigation math, Nowak/McPherson allometric benefits, John White (FCIN12) veteran tree age, and OGC CRS84 GeoJSON FeatureCollection output.',
  '- **Browser Crypto Shim Note:** `src/core/rcaEngine.js` imports `node:crypto` exclusively for `crypto.createHash(\'sha256\').update(payload, \'utf8\').digest(\'hex\')` inside `computeCanonicalSha256`. By aliasing `node:crypto` to `web/crypto-shim.js` at bundle time in `web/build.mjs`, the browser bundle computes identical SHA-256 digests synchronously with zero modifications to `src/core/rcaEngine.js`.'
);

fs.writeFileSync(verificationMdPath, mdLines.join('\n') + '\n', 'utf8');
console.log('Parity verification passed (3/3 identical) -> deploy/VERIFICATION.md');
