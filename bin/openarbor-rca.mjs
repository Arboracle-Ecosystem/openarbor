#!/usr/bin/env node
/**
 * Open Arbor RCA-Spec v2.0 Zero-Dependency CLI Field Compiler
 * Usage:
 *   openarbor-rca compile <assessment.json> [--ordinance <id>] [--out <report.md>]
 *   openarbor-rca counter-notice <assessment.json> [--out <notice.md>]
 *   openarbor-rca economics <assessment.json> [--json]
 *   openarbor-rca attest <practitioner.json> <report1.json> <report2.json> <report3.json> [--out <badge.json>]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  validateJsonSchema,
  lintRcaEvidentiaryReport,
  compileRcaEvidentiaryMarkdown,
  compilePreservationCounterNotice,
  computeRegenerativePracticeEconomics,
  mintOpenBadgeAttestation,
} from '../src/core/rcaEngine.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const rcaAssessmentSchema = JSON.parse(
  fs.readFileSync(path.join(rootDir, 'schemas/rca_assessment.schema.json'), 'utf8')
);
const rcaOpenBadgeSchema = JSON.parse(
  fs.readFileSync(path.join(rootDir, 'schemas/rca_openbadge_v3.schema.json'), 'utf8')
);
const txOrdinances = JSON.parse(
  fs.readFileSync(path.join(rootDir, 'data/ordinances/central_texas_ordinances.json'), 'utf8')
);
const orOrdinances = JSON.parse(
  fs.readFileSync(path.join(rootDir, 'data/ordinances/rogue_valley_oregon_ordinances.json'), 'utf8')
);

const allMunicipalities = [
  ...(txOrdinances.municipalities || []),
  ...(orOrdinances.municipalities || []),
];

function findMunicipality(id) {
  if (!id) return null;
  return allMunicipalities.find((m) => m.id === id) || null;
}

function parseFlag(args, flag) {
  const idx = args.indexOf(flag);
  if (idx !== -1 && idx + 1 < args.length) {
    return args[idx + 1];
  }
  return null;
}

function loadAndValidateAssessment(filePath) {
  const absPath = path.resolve(process.cwd(), filePath);
  const raw = JSON.parse(fs.readFileSync(absPath, 'utf8'));
  const schemaRes = validateJsonSchema(raw, rcaAssessmentSchema);
  if (!schemaRes.valid) {
    console.error(`[SCHEMA_VALIDATION_ERROR] ${filePath} failed schemas/rca_assessment.schema.json:`);
    for (const err of schemaRes.errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }
  return raw;
}

const [, , subcommand, ...restArgs] = process.argv;

if (!subcommand || subcommand === '--help' || subcommand === '-h') {
  console.log(
    [
      'Open Arbor RCA-Spec v2.0 CLI Field Compiler',
      'Commands:',
      '  compile <assessment.json> [--ordinance <id>] [--out <report.md>]',
      '  counter-notice <assessment.json> [--out <notice.md>]',
      '  economics <assessment.json> [--json]',
      '  attest <practitioner.json> <r1.json> <r2.json> <r3.json> [--out <badge.json>]',
    ].join('\n')
  );
  process.exit(0);
}

if (subcommand === 'compile') {
  const fileArg = restArgs[0];
  if (!fileArg) {
    console.error('Error: missing <assessment.json> argument for compile.');
    process.exit(1);
  }
  const assessment = loadAndValidateAssessment(fileArg);
  const lint = lintRcaEvidentiaryReport(assessment);
  if (!lint.valid) {
    console.error(`[EVIDENTIARY_LINTER_ERROR] ${fileArg} failed evidentiary verification:`);
    for (const err of lint.errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  const ordId =
    parseFlag(restArgs, '--ordinance') ||
    assessment.structural_baseline?.municipal_permit_disposition?.jurisdiction_id;
  const municipality = findMunicipality(ordId);
  const compiled = compileRcaEvidentiaryMarkdown(assessment, { municipality });
  const outPath = parseFlag(restArgs, '--out');

  if (outPath) {
    fs.writeFileSync(path.resolve(process.cwd(), outPath), compiled.markdown, 'utf8');
    console.log(`Compiled RCA Evidentiary Report (${compiled.sha256}) -> ${outPath}`);
  } else {
    console.log(compiled.markdown);
  }
} else if (subcommand === 'counter-notice') {
  const fileArg = restArgs[0];
  if (!fileArg) {
    console.error('Error: missing <assessment.json> argument for counter-notice.');
    process.exit(1);
  }
  const assessment = loadAndValidateAssessment(fileArg);
  const res = compilePreservationCounterNotice(assessment);
  if (!res.can_preserve) {
    console.error(
      `[COUNTER_NOTICE_REFUSED] Tree t/R ratio (${res.t_over_r}) is below the 0.30 Mattheck stability threshold. Automatic preservation counter-notice cannot be issued without Level 3 crown load reduction engineering.`
    );
    process.exit(1);
  }
  const outPath = parseFlag(restArgs, '--out');
  if (outPath) {
    fs.writeFileSync(path.resolve(process.cwd(), outPath), res.notice_markdown, 'utf8');
    console.log(`Compiled Scientific Counter-Notice -> ${outPath}`);
  } else {
    console.log(res.notice_markdown);
  }
} else if (subcommand === 'economics') {
  const fileArg = restArgs[0];
  if (!fileArg) {
    console.error('Error: missing <assessment.json> argument for economics.');
    process.exit(1);
  }
  const assessment = loadAndValidateAssessment(fileArg);
  const econ = computeRegenerativePracticeEconomics(assessment);
  if (restArgs.includes('--json')) {
    console.log(JSON.stringify(econ, null, 2));
  } else {
    console.log(
      [
        '# Open Arbor 5-Year Practice Economics: Regenerative Stewardship vs. Tree Liquidation',
        '',
        `- **Legacy Removal Contractor Bid (One-Time):** $${econ.legacy_removal_model.one_time_gross_bid_usd.toLocaleString()} gross | **$${econ.legacy_removal_model.net_practitioner_margin_usd.toLocaleString()} net margin** | $0 recurring | Destroys $${econ.legacy_removal_model.client_biological_equity_destroyed_usd.toLocaleString()} in Holobiont Equity`,
        `- **RCA 5-Year Regenerative Stewardship Program:** $${econ.regenerative_stewardship_model.five_year_gross_revenue_usd.toLocaleString()} gross | **$${econ.regenerative_stewardship_model.net_practitioner_margin_usd.toLocaleString()} net margin** | ${econ.regenerative_stewardship_model.recurring_revenue_share_pct}% recurring | Preserves $${econ.regenerative_stewardship_model.client_biological_equity_preserved_usd.toLocaleString()} in Holobiont Equity`,
        `- **Practitioner Net Margin Advantage:** **+$${econ.comparison.practitioner_5yr_net_margin_advantage_usd.toLocaleString()} (${econ.comparison.margin_multiplier}x)**`,
      ].join('\n')
    );
  }
} else if (subcommand === 'attest') {
  const [practitionerFile, r1File, r2File, r3File] = restArgs;
  if (!practitionerFile || !r1File || !r2File || !r3File) {
    console.error('Error: attest requires <practitioner.json> <report1.json> <report2.json> <report3.json>');
    process.exit(1);
  }
  const practitioner = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), practitionerFile), 'utf8'));
  const r1 = loadAndValidateAssessment(r1File);
  const r2 = loadAndValidateAssessment(r2File);
  const r3 = loadAndValidateAssessment(r3File);

  const badge = mintOpenBadgeAttestation(practitioner, [r1, r2, r3], rcaAssessmentSchema);
  const badgeValidation = validateJsonSchema(badge, rcaOpenBadgeSchema);
  if (!badgeValidation.valid) {
    console.error('[BADGE_SCHEMA_ERROR] Minted badge failed schemas/rca_openbadge_v3.schema.json:', badgeValidation.errors);
    process.exit(1);
  }

  const outPath = parseFlag(restArgs, '--out');
  const jsonStr = JSON.stringify(badge, null, 2);
  if (outPath) {
    fs.writeFileSync(path.resolve(process.cwd(), outPath), jsonStr, 'utf8');
    console.log(`Minted RCA-Verified Open Badges 3.0 Credential -> ${outPath}`);
  } else {
    console.log(jsonStr);
  }
} else {
  console.error(`Unknown subcommand '${subcommand}'. Run with --help for usage.`);
  process.exit(1);
}
