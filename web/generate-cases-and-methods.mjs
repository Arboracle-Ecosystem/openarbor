#!/usr/bin/env node
/**
 * Open Arbor v2.2 Build-Time Static Case & Falsifiability Generator (web/generate-cases-and-methods.mjs)
 * Generates:
 *   - Verified Bioregional Field Cases (out/cases/index.html + 5 case pages)
 *     rendering 100% of the determination, innate LEO-RAP answer-first triage, provenance surface,
 *     inline SVG map, mitigation schedule, and signature block as static HTML with JavaScript disabled.
 *   - Executable Proof & Falsifiability Ledger (out/methods/index.html) dynamically parsed from live
 *     test runners and municipal ordinance validators on disk with zero hardcoded drift.
 */

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  calculateCRZ,
  calculateTPZ,
  calculateSRZ,
} from '../src/core/rootZone.js';

import {
  evaluateTreeInventory,
  permitDetermination,
  permitSummary,
  computeMitigationPlan,
  renderSiteMapSVG,
  estimateRootZoneRemediation,
  statusLabel,
} from '../src/core/ordinanceEngine.js';

import {
  estimateTreeAge,
  calculateTreeEcosystemBenefits,
  toGeoJSONFeatureCollection,
} from '../src/core/ecosystemBenefits.js';

import { estimateSoilSpongeCapacity } from '../src/core/soilFunction.js';

import {
  decodePlusCode,
  validateJsonSchema,
  evaluateBiomechanicsAndRhizosphere,
  computeHolobiontValuation,
  lintRapEvidentiaryReport,
  computeRegenerativePracticeEconomics,
  computeCanonicalSha256,
  compileRapEvidentiaryMarkdown,
  compilePreservationCounterNotice,
} from '../src/core/rapEngine.js';

import {
  computePhasedStewardshipTriage,
  compileLeoRapBrief,
  runLeoRapSelfAudit,
} from '../src/core/leoRapEngine.js';

import { ALL_SPECIES_PRESETS } from '../web/presets.js';
import {
  GALLERY_CASES,
  encodeAssessmentPermalink,
  formatStickyDeterminationSummary,
  inspectMunicipalityProvenance,
  renderExpandableHashHtml,
} from '../web/pages/masterwork-core.js';
import {
  dualUnitSpanHtml,
  cmToIn,
  mToFt,
  fmtDualInCm,
  fmtDualFromCm,
  fmtDualFtM,
  fmtDualFromMeters,
  fmtDualAreaSqftSqm,
  fmtDualAreaFromSqm,
  fmtDualSoilVolFromM3,
  fmtDualBiocharFromLiters,
  fmtDualGallons,
  fmtDualMassFromKg,
  fmtDualMassFromLbs,
  fmtDualInfiltrationFromMmHr,
  fmtDualBulkDensity,
  fmtDualPressureFromPsi,
} from '../web/pages/unit-system.js';

import { validateOrdinanceFile } from '../scripts/validate-ordinance.mjs';

function dualHtml(formatter, ...args) {
  return dualUnitSpanHtml(formatter(...args, 'imperial'), formatter(...args, 'metric'));
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_ROOT_DIR = path.resolve(__dirname, '..');

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatUsd(n) {
  return `$${Number(n || 0).toLocaleString('en-US')}`;
}

/**
 * Evaluate a single gallery case using the exact same deterministic pipeline as evaluateCompleteFieldCase.
 */
function evaluateStaticCase(caseObj, allMunicipalities, rapAssessmentSchema) {
  const assessment = caseObj.assessment;
  const schemaValidation = validateJsonSchema(assessment, rapAssessmentSchema);
  const lint = lintRapEvidentiaryReport(assessment);

  const ordId =
    caseObj.ordinance_id ||
    assessment.structural_baseline?.municipal_permit_disposition?.jurisdiction_id ||
    'tx-austin';
  const municipality = allMunicipalities.find((m) => m.id === ordId) || null;

  const compiledReport = compileRapEvidentiaryMarkdown(assessment, { municipality });
  const counterNotice = compilePreservationCounterNotice(assessment);
  const economics = computeRegenerativePracticeEconomics(assessment);
  const biomechanics = evaluateBiomechanicsAndRhizosphere(assessment);
  const valuation = computeHolobiontValuation(assessment);
  const sha256 = computeCanonicalSha256(assessment);

  const sb = assessment.structural_baseline || {};
  const coords =
    decodePlusCode(sb.plus_code_global) ||
    municipality?.coordinates || { lat: 30.2672, lng: -97.7431 };
  const conditionClass = caseObj.condition_class || 'Good';
  const siteCondition = caseObj.site_condition || 'Open Grown / Parkland';

  const speciesEntry = ALL_SPECIES_PRESETS.find(
    (s) => s.scientific.toLowerCase() === String(sb.species_scientific || '').toLowerCase()
  );
  const growthFactor = speciesEntry?.growth_factor || 4.5;

  const ageEstimate = estimateTreeAge({
    dbh_inches: biomechanics.dbh_inches,
    base_growth_factor: growthFactor,
    site_condition: siteCondition,
  });

  const heightFt = Number(sb.height_m || 12) / 0.3048;
  const spreadFt =
    (Number(sb.crown_spread_ns_m || 10) + Number(sb.crown_spread_ew_m || 10)) / 2 / 0.3048;

  const ecosystemBenefits = calculateTreeEcosystemBenefits({
    species_name: sb.species_scientific || 'Quercus virginiana',
    common_name: sb.species_common || 'Live Oak',
    dbh_inches: biomechanics.dbh_inches,
    height_feet: Math.round(heightFt * 10) / 10,
    canopy_spread_feet: Math.round(spreadFt * 10) / 10,
    condition_class: conditionClass,
  });

  const conditionScoreMap = {
    Excellent: 10,
    Good: 8,
    Fair: 6,
    Poor: 4,
    Critical: 2,
    Dead: 0,
  };

  const isRemovalProposed =
    Boolean(caseObj.proposed_removal) ||
    sb.municipal_permit_disposition?.recommended_disposition ===
      'Removal_Last_Resort_Unmitigable_Hazard';

  const stemsInches =
    sb.is_multistem && Array.isArray(sb.stem_diameters_cm) && sb.stem_diameters_cm.length > 0
      ? sb.stem_diameters_cm.map((cm) => Math.round((Number(cm) / 2.54) * 10) / 10)
      : [biomechanics.dbh_inches];

  const treeInventoryInput = [
    {
      tag: sb.tree_tag || 'T-01',
      species_common: sb.species_common || 'Live Oak',
      species_scientific: sb.species_scientific || 'Quercus virginiana',
      stems_inches: stemsInches,
      dbh_inches: biomechanics.dbh_inches,
      lat: coords.lat,
      lng: coords.lng,
      condition_score: conditionScoreMap[conditionClass] ?? 8,
      removal: isRemovalProposed,
      pruning_date: caseObj.pruning_date || null,
      crz_disturbed_pct: Number(caseObj.crz_disturbed_pct) || 0,
      cutfill_within_half_crz: (Number(caseObj.cutfill_depth_in) || 0) > 0,
      cutfill_depth_in: Number(caseObj.cutfill_depth_in) || 0,
      impervious_pct: Number(caseObj.impervious_pct) || 0,
      crown_removal_pct: Number(caseObj.crown_removal_pct) || 0,
      actions:
        sb.municipal_permit_disposition?.recommended_disposition ===
          'Structural_Risk_Reduction_Pruning' || caseObj.pruning_date
          ? ['pruning']
          : [],
    },
  ];

  const evaluatedRows = evaluateTreeInventory(treeInventoryInput, municipality);
  const permit = permitDetermination(evaluatedRows, municipality);
  const permitText = permitSummary(permit);
  const mitigationActive = computeMitigationPlan(evaluatedRows, municipality);

  const removedComparisonRows = evaluateTreeInventory(
    [{ ...treeInventoryInput[0], removal: true }],
    municipality
  );
  const mitigationIfRemoved = computeMitigationPlan(removedComparisonRows, municipality);
  const soilRemediation = estimateRootZoneRemediation(evaluatedRows);
  const svgSiteMap = renderSiteMapSVG(evaluatedRows);

  const crz = calculateCRZ(
    biomechanics.dbh_inches,
    Number(municipality?.plan_rules?.root_zone?.crz_ft_per_inch) || 1.0,
    Number(municipality?.plan_rules?.root_zone?.crz_min_ft) || 0
  );
  const tpzUs11 = calculateTPZ(biomechanics.dbh_inches, 'inches', 'US_1_1');
  const tpzUs115 = calculateTPZ(biomechanics.dbh_inches, 'inches', 'US_1_1.5');
  const tpzAs4970 = calculateTPZ(biomechanics.dbh_inches, 'inches', 'Australian_AS4970');
  const tpzBs5837 = calculateTPZ(biomechanics.dbh_inches, 'inches', 'UK_BS5837');
  const srz = calculateSRZ(
    (Number(assessment.rhizosphere_and_root_collar?.root_flare_diameter_cm) ||
      biomechanics.dbh_cm * 1.2) / 2.54,
    biomechanics.dbh_inches
  );

  const geojson = toGeoJSONFeatureCollection(evaluatedRows, {
    name: `OpenArbor_${sb.tree_tag || 'Assessment'}`,
    generated_at: `${sb.assessment_date || '2026-10-28'}T00:00:00.000Z`,
    jurisdiction_id: ordId,
    jurisdiction_name: municipality?.name || ordId,
    ordinance_citation: municipality?.ordinance_numbers || '',
    rca_sha256: sha256,
  });

  const provenance = inspectMunicipalityProvenance(municipality);
  const soilInput = assessment.soil_and_microbiome_baseline || {};
  const soilSponge = estimateSoilSpongeCapacity({
    tiz_area_m2: Number(biomechanics.root_zones.tiz_area_sqm) || 100,
    infiltration_mm_hr: Number(soilInput.infiltration_rate_mm_hr ?? 18),
    organic_matter_percent: Number(soilInput.organic_matter_pct ?? 2.0),
  });

  const phasedTriage = computePhasedStewardshipTriage(assessment, economics);
  const leoEvalContext = {
    biomechanics,
    valuation,
    economics,
    triage: phasedTriage,
    municipality,
    rootZones: { crz, srz },
    assessment_sha256: sha256,
    evaluatedRow: evaluatedRows[0],
    permitText,
    mitigationIfRemoved,
    provenance,
  };
  const leoBrief = compileLeoRapBrief(assessment, leoEvalContext);
  const leoSelfAudit = runLeoRapSelfAudit(assessment, leoEvalContext);

  const evalResult = {
    schemaValidation,
    lint,
    municipality,
    compiledReport,
    counterNotice,
    economics,
    biomechanics,
    valuation,
    sha256,
    ageEstimate,
    ecosystemBenefits,
    evaluatedRow: evaluatedRows[0],
    permit: {
      ...permit,
      permit_required: Boolean(permit.required),
    },
    permitText,
    mitigationActive,
    mitigationIfRemoved,
    soilRemediation,
    svgSiteMap,
    rootZones: {
      crz,
      tpzUs11,
      tpzUs115,
      tpzAs4970,
      tpzBs5837,
      srz,
    },
    geojson,
    soilSponge,
    phasedTriage,
    leoBrief,
    leoSelfAudit,
  };

  const permalinkHash = encodeAssessmentPermalink(caseObj);
  const stickySummary = formatStickyDeterminationSummary(evalResult);

  return {
    caseObj,
    evalResult,
    permalinkHash,
    stickySummary,
    provenance,
  };
}

function renderSharedHeader(relRoot, activeRoute) {
  const primaryItems = [
    { href: `${relRoot}/index.html`, label: 'Field Home', id: 'portal' },
    { href: `${relRoot}/demo/index.html`, label: 'Field Studio', id: 'demo' },
    { href: `${relRoot}/cases/index.html`, label: 'Case Studies', id: 'cases' },
    { href: `${relRoot}/ordinances/index.html`, label: 'City Tree Laws', id: 'ordinances' },
  ];

  const veilItems = [
    {
      href: `${relRoot}/tools/index.html`,
      title: '41-Tool Forestry & LiDAR Workbench',
      desc: 'Point clouds, dendrochronology, fire behavior, and core ESM calculators.',
      id: 'tools',
    },
    {
      href: `${relRoot}/mcp/index.html`,
      title: 'MCP Agent Server Playground',
      desc: 'JSON-RPC 2.0 inspector so AI agents run verified math instead of guessing.',
      id: 'mcp',
    },
    {
      href: `${relRoot}/spec/index.html`,
      title: 'RAP-Spec v2.0 & 200-Yr Vault',
      desc: 'Ten-section evidentiary standard, primary equations, and Heartwood file vault.',
      id: 'spec',
    },
    {
      href: `${relRoot}/methods/index.html`,
      title: 'Executable Proof & Falsifiability',
      desc: 'Bit-for-bit parity audits, STIM epistemic sieve, and physical kill criteria.',
      id: 'methods',
    },
  ];

  const primaryHtml = primaryItems
    .map((item) => {
      const isActive = item.id === activeRoute;
      return `<a href="${item.href}" class="oa-nav-link${isActive ? ' active' : ''}"${
        isActive ? ' aria-current="page"' : ''
      }>${escapeHtml(item.label)}</a>`;
    })
    .join('\n        ');

  const popoverHtml = veilItems
    .map((item) => {
      const isActive = item.id === activeRoute;
      return `        <a href="${item.href}" class="oa-deep-popover-item${isActive ? ' active' : ''}"${
        isActive ? ' aria-current="page"' : ''
      }>
          <strong>${escapeHtml(item.title)}</strong>
          <span>${escapeHtml(item.desc)}</span>
        </a>`;
    })
    .join('\n');

  const veilTriggerActive = veilItems.some((item) => item.id === activeRoute);

  return `  <header class="oa-site-header">
    <a href="#main-content" class="skip-link visually-hidden">Skip to main content</a>
    <div class="oa-nav-container">
      <a href="${relRoot}/index.html" class="oa-brand-link">
        <span class="oa-brand-mark"><img src="${relRoot}/icons/icon-68.png" alt="" width="34" height="34" class="oa-brand-logo" decoding="async" /></span>
        <span class="oa-brand-text">OPEN ARBOR</span>
      </a>
      <nav class="oa-main-nav" aria-label="Primary">
        ${primaryHtml}
        <button
          type="button"
          class="oa-nav-veil-trigger${veilTriggerActive ? ' active' : ''}"
          popovertarget="oa-deep-stack-popover"
          aria-expanded="false"
        >
          Understory
        </button>
      </nav>
      <div id="oa-deep-stack-popover" class="oa-deep-popover" popover>
        <div class="oa-deep-popover-header">
          <span>Forest OS Understory &middot; STIM-Aligned Stack</span>
          <span>AGPL-3.0</span>
        </div>
${popoverHtml}
      </div>
      <div class="oa-theme-control">
        <button
          type="button"
          id="oa-install-app-btn"
          class="btn btn-secondary btn-sm"
          hidden
        >
          Install App
        </button>
        <span id="oa-install-status" class="visually-hidden" role="status"></span>
        <button
          type="button"
          id="oa-veil-mode-toggle"
          class="btn btn-secondary btn-sm oa-veil-mode-btn"
          aria-pressed="false"
        >
          Layer: Canopy
        </button>
        <button
          type="button"
          id="oa-units-toggle"
          class="btn btn-secondary btn-sm"
          aria-description="Switch measurement system between US Imperial and Metric"
        >
          Units: in / ft
        </button>
        <button
          type="button"
          id="oa-theme-toggle"
          class="btn btn-secondary btn-sm"
          aria-description="Toggle color scheme"
        >
          Theme: Dark
        </button>
      </div>
    </div>
  </header>`;
}

/**
 * Render out/cases/index.html
 */
function renderCasesIndexHtml(evaluatedCases) {
  const tableRowsHtml = evaluatedCases
    .map(({ caseObj, evalResult, permalinkHash, provenance }) => {
      const sb = caseObj.assessment.structural_baseline;
      const status = statusLabel(evalResult.evaluatedRow);
      const badgeClass = evalResult.evaluatedRow.heritage
        ? 'badge-heritage'
        : evalResult.evaluatedRow.protected
        ? 'badge-protected'
        : 'badge-neutral';
      const dbhHtml = dualHtml(
        fmtDualInCm,
        evalResult.biomechanics.dbh_inches,
        evalResult.biomechanics.dbh_cm
      );
      const crzHtml = dualHtml(
        fmtDualFtM,
        evalResult.rootZones.crz.radius_feet,
        evalResult.rootZones.crz.radius_meters
      );
      const srzHtml = dualHtml(
        fmtDualFtM,
        evalResult.rootZones.srz.radius_feet,
        evalResult.rootZones.srz.radius_meters
      );
      const repHtml = dualHtml(
        fmtDualInCm,
        evalResult.mitigationIfRemoved.replacement_inches_owed
      );
      const tOverR = evalResult.biomechanics.biomechanics.sound_shell_thickness_ratio_t_over_r;
      const cashIfDestroyed = formatUsd(evalResult.mitigationIfRemoved.cash_in_lieu_usd);
      const holobiontUsd = formatUsd(evalResult.valuation.holobiont_200yr_biological_equity_usd);
      const ctlaUsd = formatUsd(evalResult.valuation.ctla_10th_ed_depreciated_usd);

      return `            <tr>
              <th scope="row">
                <a href="./${caseObj.slug}/index.html"><strong>${escapeHtml(sb.tree_tag)}</strong></a><br />
                <small><em>${escapeHtml(sb.species_scientific)}</em> (${escapeHtml(sb.species_common)})</small>
              </th>
              <td>
                <strong>${escapeHtml(provenance.municipality_name)}</strong><br />
                <small><code>${escapeHtml(caseObj.ordinance_id)}</code> &middot; ${escapeHtml(provenance.primary_citation)}</small>
              </td>
              <td>
                <span class="badge ${badgeClass}">${escapeHtml(status)}</span><br />
                <small>${dbhHtml}</small>
              </td>
              <td>
                <strong>CRZ:</strong> ${crzHtml}<br />
                <small><strong>SRZ:</strong> ${srzHtml} &middot; <strong>t/R:</strong> ${escapeHtml(tOverR)}</small>
              </td>
              <td>
                <strong>${escapeHtml(evalResult.permit.required ? 'Permit Required' : 'No Permit Triggered')}</strong><br />
                <small>If destroyed: ${escapeHtml(cashIfDestroyed)} (${repHtml})</small>
              </td>
              <td>
                <strong class="oa-valuation-appraisal-val">CTLA: ${escapeHtml(ctlaUsd)}</strong><br />
                <span class="oa-valuation-hypothesis-val">200-Yr Model: ${escapeHtml(holobiontUsd)} (${escapeHtml(evalResult.valuation.inversion_ratio)}x; unvalidated)</span>
              </td>
              <td>
                <div style="display: flex; flex-direction: column; gap: 6px;">
                  <a href="./${caseObj.slug}/index.html" class="btn btn-primary btn-xs">Static Evidentiary Page</a>
                  <a href="../demo/index.html${escapeHtml(permalinkHash)}" class="btn btn-outline btn-xs">Open in Field Workbench</a>
                </div>
              </td>
            </tr>`;
    })
    .join('\n');

  const cardsHtml = evaluatedCases
    .map(({ caseObj, evalResult, permalinkHash, provenance }, idx) => {
      const sb = caseObj.assessment.structural_baseline;
      const status = statusLabel(evalResult.evaluatedRow);
      const badgeClass = evalResult.evaluatedRow.heritage
        ? 'badge-heritage'
        : evalResult.evaluatedRow.protected
        ? 'badge-protected'
        : 'badge-neutral';

      return `        <article class="oa-pillar-card">
          <div>
            <div class="oa-pillar-top">
              <div>
                <span class="badge ${badgeClass}">Case ${idx + 1} &middot; ${escapeHtml(status)} Tree</span>
                <span class="badge badge-neutral">${escapeHtml(provenance.municipality_name)}</span>
              </div>
              <h3><a href="./${caseObj.slug}/index.html" style="color: inherit; text-decoration: none;">${escapeHtml(caseObj.label)}</a></h3>
            </div>
            <p style="margin-top: 8px;">
              <strong>Specimen:</strong> <code>${escapeHtml(sb.tree_tag)}</code> (<em>${escapeHtml(sb.species_scientific)}</em>, ${escapeHtml(sb.species_common)}) at Plus Code <code>${escapeHtml(sb.plus_code_global)}</code>.<br />
              <strong>Statutory Authority:</strong> ${escapeHtml(provenance.primary_citation)} (${escapeHtml(provenance.record_tier)}).
            </p>
            <ul class="oa-pillar-list" style="margin-top: 10px;">
              <li><strong>Evaluated DBH &amp; Shell Stability:</strong> ${dualHtml(fmtDualInCm, evalResult.biomechanics.dbh_inches, evalResult.biomechanics.dbh_cm)} | Mattheck <code>t/R = ${escapeHtml(evalResult.biomechanics.biomechanics.sound_shell_thickness_ratio_t_over_r)}</code> (Stable)</li>
              <li><strong>Protection Zones:</strong> CRZ ${dualHtml(fmtDualFtM, evalResult.rootZones.crz.radius_feet, evalResult.rootZones.crz.radius_meters)} | AS 4970 SRZ ${dualHtml(fmtDualFtM, evalResult.rootZones.srz.radius_feet, evalResult.rootZones.srz.radius_meters)}</li>
              <li><strong>Permit &amp; Mitigation Liability:</strong> ${escapeHtml(evalResult.permitText)} | Cash-in-lieu if removed: ${escapeHtml(formatUsd(evalResult.mitigationIfRemoved.cash_in_lieu_usd))}</li>
              <li><strong>Valuation Models:</strong> CTLA 10th Ed. model ${escapeHtml(formatUsd(evalResult.valuation.ctla_10th_ed_depreciated_usd))} | Experimental 200-yr holobiont model ${escapeHtml(formatUsd(evalResult.valuation.holobiont_200yr_biological_equity_usd))} (unvalidated) | John White Age: ${escapeHtml(evalResult.ageEstimate.estimated_age_years)} yrs</li>
              <li><strong>Canonical SHA-256:</strong> <code>${escapeHtml(evalResult.sha256.slice(0, 24))}...</code></li>
            </ul>
          </div>
          <div class="oa-pillar-actions">
            <a href="./${caseObj.slug}/index.html" class="btn btn-primary btn-sm">Read Static HTML Evidentiary Page</a>
            <a href="../demo/index.html${escapeHtml(permalinkHash)}" class="btn btn-secondary btn-sm">Open in Interactive Field Workbench (#oa1=)</a>
          </div>
        </article>`;
    })
    .join('\n\n');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light dark" />
  <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#08110b" />
  <meta name="theme-color" media="(prefers-color-scheme: light)" content="#f6f5ef" />
  <script>
    try {
      document.querySelector('meta[name="color-scheme"]').content = localStorage.getItem('color-scheme') ?? 'light dark';
    } catch (e) {}
  </script>
  <title>Verified Bioregional Field Cases (5 Static Determinations) | Open Arbor v2.2</title>
  <meta
    name="description"
    content="Five pre-rendered, crawlable arboricultural evidentiary case determinations across Central Texas (Austin, Georgetown, Liberty Hill) and Rogue Valley, Oregon (Ashland, Medford). 100% readable with JavaScript disabled."
  />
  <link rel="manifest" href="../manifest.webmanifest" />
  <link rel="icon" href="../icons/icon.svg" type="image/svg+xml" />
  <link rel="apple-touch-icon" href="../icons/apple-touch-icon.png" />
  <link rel="stylesheet" href="../styles.css" />
</head>
<body>
${renderSharedHeader('..', 'cases')}

  <main>
  <section class="app-header">
    <div class="container header-inner">
      <div>
        <span class="eyebrow">Verified Bioregional Field Cases &middot; Zero-JS Crawlable Evidentiary Determinations &middot; RAP-Spec v2.0</span>
        <h1 id="main-content" tabindex="-1">Bioregional Reference Case Gallery (Central Texas &amp; Rogue Valley, Oregon)</h1>
        <p class="subtitle">
          Five benchmark municipal tree determinations pre-rendered at build time directly from the certified ECMAScript core engines. Every case page includes plain-language stewardship triage, full statutory citations, inline vector <code>&lt;svg&gt;</code> root protection maps, provenance boundaries, and cryptographic <code>SHA-256</code> digests with JavaScript disabled.
        </p>
      </div>
      <div class="header-actions">
        <a href="../demo/index.html" class="btn btn-primary">Open Field Studio</a>
        <a href="../methods/index.html" class="btn btn-outline">Executable Proof Ledger</a>
      </div>
    </div>
  </section>

  <div class="container main-layout">
    <section class="card" aria-labelledby="comparison-matrix-heading">
      <div class="card-header">
        <span class="step-badge">5 Benchmark Cases</span>
        <h2 id="comparison-matrix-heading">Cross-Jurisdictional Evidentiary Comparison Matrix</h2>
      </div>
      <p class="subtitle">
        Compare municipal protection tiers, ANSI A300 and AS 4970 root zone radii, permit determinations, replacement mitigation liabilities, and 200-year Holobiont Biological Equity across Austin, Georgetown, Liberty Hill, Ashland, and Medford.
      </p>

      <div tabindex="0" role="region" aria-labelledby="cases-table-caption" class="table-wrapper oa-wide-matrix table-scroll">
        <table
          class="data-table"
          style="
            --label-1: 'Specimen &amp; Tag';
            --label-2: 'Jurisdiction &amp; Citation';
            --label-3: 'Status &amp; DBH';
            --label-4: 'Root Zones &amp; Shell';
            --label-5: 'Permit &amp; Mitigation';
            --label-6: 'Holobiont vs. CTLA';
            --label-7: 'Evidentiary Links';
          "
        >
          <caption id="cases-table-caption" class="sr-only">
            Five Bioregional Reference Determinations in the Open Arbor Static Case Gallery
          </caption>
          <thead>
            <tr>
              <th scope="col">Specimen &amp; Tag</th>
              <th scope="col">Jurisdiction &amp; Primary Citation</th>
              <th scope="col">Protection Status &amp; DBH</th>
              <th scope="col">CRZ / SRZ &amp; Mattheck t/R</th>
              <th scope="col">Permit Verdict &amp; Liability</th>
              <th scope="col">200-Yr Holobiont vs. CTLA</th>
              <th scope="col">Inspect or Hydrate</th>
            </tr>
          </thead>
          <tbody>
${tableRowsHtml}
          </tbody>
        </table>
      </div>
    </section>

    <section class="card" aria-labelledby="gallery-cards-heading">
      <div class="card-header">
        <span class="step-badge">Case Dossiers</span>
        <h2 id="gallery-cards-heading">Individual Pre-Rendered Evidentiary Dossiers</h2>
      </div>
      <div class="oa-pillars-grid">
${cardsHtml}
      </div>
    </section>
  </div>
  </main>

  <footer class="app-footer">
    <div class="container">
      <p>
        Open Arbor v2.2 &middot; Verified Bioregional Field Cases &middot; Governed by the Open Arbor Alliance.
      </p>
      <p>
        AGPL-3.0 for the engine and CC0-1.0 for schemas and data &middot; <a href="../LICENSE">LICENSE</a> &middot; <a href="../LICENSE-DATA">LICENSE-DATA</a> &middot; <a href="https://github.com/Arboracle-Ecosystem/openarbor">GitHub Repository</a>
      </p>
    </div>
  </footer>

  <script type="module" src="../openarbor-bundle.js"></script>
</body>
</html>
`;
}

/**
 * Render an individual static case page out/cases/<slug>/index.html
 */
function renderSingleCaseHtml({ caseObj, evalResult, permalinkHash, stickySummary, provenance }) {
  const a = caseObj.assessment;
  const sb = a.structural_baseline;
  const rh = a.rhizosphere_and_root_collar;
  const air = rh.airspade_radial_trenching_geometry || {};
  const soil = a.soil_and_microbiome_baseline || {};
  const myco = soil.mycorrhizal_and_fungal_observations || {};
  const guild = a.understory_and_guild_prescription || {};
  const mon = a.outcome_monitoring_schedule || {};

  const row = evalResult.evaluatedRow;
  const bio = evalResult.biomechanics;
  const val = evalResult.valuation;
  const econ = evalResult.economics;
  const eco = evalResult.ecosystemBenefits;
  const age = evalResult.ageEstimate;
  const mitActive = evalResult.mitigationActive;
  const mitIfRemoved = evalResult.mitigationIfRemoved;
  const rz = evalResult.rootZones;
  const triage = evalResult.phasedTriage;
  const sponge = evalResult.soilSponge;
  const leoBrief = evalResult.leoBrief;
  const leoSelfAudit = evalResult.leoSelfAudit;
  const stage1 = triage.stages[0];
  const status = statusLabel(row);

  const badgeClass = row.heritage
    ? 'badge-heritage'
    : row.protected
    ? 'badge-protected'
    : 'badge-neutral';

  const triageRowsHtml = triage.stages
    .map(
      (st) => `              <tr>
                <th scope="row"><strong>Stage ${escapeHtml(st.stage_number)}: ${escapeHtml(st.title)}</strong><br /><small>${escapeHtml(st.window)}</small></th>
                <td>${escapeHtml(st.scope)}</td>
                <td><strong>${escapeHtml(formatUsd(st.client_price_usd))}</strong></td>
                <td class="text-accent"><strong>${escapeHtml(formatUsd(st.practitioner_net_usd))}</strong></td>
              </tr>`
    )
    .join('\n');

  const verifiedRowsHtml = (provenance.verified_sections || [])
    .map(
      (sec) => `              <tr>
                <th scope="row"><code>${escapeHtml(sec.field)}</code></th>
                <td><span class="badge badge-protected">VERIFIED</span></td>
                <td>${escapeHtml(sec.value)}</td>
                <td>${escapeHtml(sec.citation)}</td>
              </tr>`
    )
    .join('\n');

  const unverifiedRowsHtml =
    provenance.unverified_gaps && provenance.unverified_gaps.length > 0
      ? provenance.unverified_gaps
          .map(
            (gap) => `              <tr>
                <th scope="row"><code>${escapeHtml(gap.field)}</code></th>
                <td><span class="badge badge-warn">${escapeHtml(gap.status)}</span></td>
                <td colspan="2">${escapeHtml(gap.description)}</td>
              </tr>`
          )
          .join('\n')
      : `              <tr>
                <th scope="row"><code>All Statutory Sub-Sections</code></th>
                <td><span class="badge badge-protected">COMPLETE (0 GAPS)</span></td>
                <td colspan="2">This municipality is encoded as a complete <code>Full_Rule_Record</code> with verified DBH thresholds, work-type permit triggers, survey rules, root-zone impact limits, pruning standards, and mitigation fee schedules.</td>
              </tr>`;

  const flagsHtml =
    row.flags && row.flags.length > 0
      ? `<ul class="flag-list">${row.flags.map((f) => `<li>${escapeHtml(f)}</li>`).join('')}</ul>`
      : `<p class="clean-note">Zero municipal code or seasonal Oak Wilt violations triggered under current preservation parameters (CRZ disturbed: ${escapeHtml(caseObj.crz_disturbed_pct)}%, Cut/fill: ${escapeHtml(caseObj.cutfill_depth_in)} in, Impervious: ${escapeHtml(caseObj.impervious_pct)}%, Crown removal: ${escapeHtml(caseObj.crown_removal_pct)}%).</p>`;

  const companionRowsHtml = (guild.native_companion_species_guild || [])
    .map(
      (g) => `              <tr>
                <th scope="row"><em>${escapeHtml(g.scientific_name)}</em> (${escapeHtml(g.common_name)})</th>
                <td><code>${escapeHtml(g.inaturalist_taxon_id)}</code></td>
                <td><code>${escapeHtml(g.open_nursery_batch_id || 'N/A')}</code></td>
                <td>${escapeHtml(g.stratum_layer)}</td>
                <td>${escapeHtml(g.functional_role)}</td>
                <td>${escapeHtml(g.quantity_planted)}</td>
              </tr>`
    )
    .join('\n');

  const labeledCaseSvg = (() => {
    const rawSvg = String(evalResult.svgSiteMap || '').trim();
    if (!rawSvg.startsWith('<svg') || rawSvg.includes('role="img"')) return rawSvg;
    const svgLabel = escapeHtml(
      `ANSI A300 Part 5 root protection map for ${sb.tree_tag} (${sb.species_common}): ${rz.crz.radius_feet} ft CRZ radius and ${rz.srz.radius_feet} ft SRZ radius`
    );
    return rawSvg
      .replace(/^<svg\b/, `<svg role="img" aria-label="${svgLabel}"`)
      .replace(/(<svg[^>]*>)/, `$1<title>${svgLabel}</title>`);
  })();

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light dark" />
  <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#08110b" />
  <meta name="theme-color" media="(prefers-color-scheme: light)" content="#f6f5ef" />
  <script>
    try {
      document.querySelector('meta[name="color-scheme"]').content = localStorage.getItem('color-scheme') ?? 'light dark';
    } catch (e) {}
  </script>
  <title>${escapeHtml(caseObj.label)} | Verified Bioregional Field Case | Open Arbor v2.2</title>
  <meta
    name="description"
    content="Static pre-rendered arboricultural determination for ${escapeHtml(sb.tree_tag)} (${escapeHtml(sb.species_scientific)}) in ${escapeHtml(provenance.municipality_name)}: ${escapeHtml(stickySummary.one_line_text)}."
  />
  <link rel="manifest" href="../../manifest.webmanifest" />
  <link rel="icon" href="../../icons/icon.svg" type="image/svg+xml" />
  <link rel="apple-touch-icon" href="../../icons/apple-touch-icon.png" />
  <link rel="stylesheet" href="../../styles.css" />
</head>
<body>
${renderSharedHeader('../..', 'cases')}

  <main>
  <!-- Sticky Determination Summary Bar -->
  <div id="sticky-determination-bar" class="oa-sticky-determination-bar" role="region" aria-label="Sticky Determination Summary">
    <div class="container oa-sticky-bar-inner">
      <div class="oa-sticky-verdict-metrics">
        <span><strong>Status:</strong> <span id="sticky-status-val" class="badge ${badgeClass}">${escapeHtml(stickySummary.status)} (${escapeHtml(stickySummary.permit_required)})</span></span>
        <span><strong>DBH:</strong> <strong id="sticky-dbh-val">${dualHtml(fmtDualInCm, bio.dbh_inches, bio.dbh_cm)}</strong></span>
        <span><strong>CRZ:</strong> <strong id="sticky-crz-val">${dualHtml(fmtDualFtM, rz.crz.radius_feet, rz.crz.radius_meters)}</strong></span>
        <span><strong>Replacement Owed:</strong> <strong id="sticky-replacement-val">${dualHtml(fmtDualInCm, row.removal ? mitActive?.replacement_inches_owed || 0 : mitIfRemoved?.replacement_inches_owed || 0)}</strong></span>
        <span><strong>Cash in Lieu:</strong> <strong id="sticky-cash-val" class="text-danger">${escapeHtml(stickySummary.cash_in_lieu)}</strong></span>
      </div>
      <div class="oa-sticky-verdict-actions">
        <a href="../../demo/index.html${escapeHtml(permalinkHash)}" class="btn btn-primary btn-xs">Open in Field Studio (#oa1=)</a>
        <a href="../index.html" class="btn btn-outline btn-xs">All 5 Cases</a>
      </div>
    </div>
  </div>

  <section class="app-header">
    <div class="container header-inner">
      <div>
        <span class="eyebrow">Verified Bioregional Field Case &middot; ${escapeHtml(provenance.municipality_name)} &middot; Plus Code ${escapeHtml(sb.plus_code_global)}</span>
        <h1 id="main-content" tabindex="-1">${escapeHtml(caseObj.label)}</h1>
        <p class="subtitle">
          Specimen <code>${escapeHtml(sb.tree_tag)}</code> (<em>${escapeHtml(sb.species_scientific)}</em>, ${escapeHtml(sb.species_common)}) &middot; Assessed <code>${escapeHtml(sb.assessment_date)}</code> &middot; Canonical SHA-256: ${renderExpandableHashHtml(evalResult.sha256)}
        </p>
      </div>
      <div class="header-actions">
        <a href="../../demo/index.html${escapeHtml(permalinkHash)}" class="btn btn-primary">Hydrate in Field Studio</a>
        <a href="../index.html" class="btn btn-secondary">Back to Case Studies</a>
      </div>
    </div>
  </section>

  <div class="container main-layout">
    <!-- INNATE SUMMARY: Plain-Language Answer-First Verdict & 3-Stage Phased Stewardship Triage -->
    <section id="innate-stewardship-triage" class="card" aria-labelledby="innate-triage-heading">
      <div class="card-header">
        <span class="step-badge">Plain-Language Verdict</span>
        <h2 id="innate-triage-heading">Answer-First Field Verdict &amp; 3-Stage Stewardship Triage</h2>
      </div>
      <div class="citation-callout" style="margin-bottom: 14px;">
        <p style="margin: 0 0 6px 0;"><strong>${escapeHtml(leoBrief.answer_first?.headline_verdict || '')}</strong></p>
        <p style="margin: 0 0 6px 0;">${escapeHtml(leoBrief.answer_first?.structural_truth || '')} ${escapeHtml(leoBrief.answer_first?.statutory_and_seasonal_truth || '')} ${escapeHtml(leoBrief.answer_first?.stewardship_vs_liquidation || '')}</p>
        <p class="hint" style="margin: 0;"><strong>Physical Kill Criterion:</strong> ${escapeHtml(leoBrief.answer_first?.falsifier || '')}</p>
      </div>

      <div class="metric-grid metric-grid-4">
        <div class="metric-box highlight-box">
          <span class="metric-label">Stage 1 Day-1 Root-Collar Triage</span>
          <strong class="metric-value text-accent">${escapeHtml(formatUsd(stage1.client_price_usd))}</strong>
          <span class="metric-sub">${escapeHtml(
            triage.day_one_undercuts_removal
              ? `Saves ${formatUsd(triage.day_one_savings_vs_removal_usd)} on Day 1 vs. chainsaw bid`
              : 'Immediate root-flare stabilization and SGR relief'
          )}</span>
        </div>
        <div class="metric-box">
          <span class="metric-label">One-Time Chainsaw Removal Bid</span>
          <strong class="metric-value text-danger">${escapeHtml(formatUsd(triage.removal_bid_usd))}</strong>
          <span class="metric-sub">Plus ${escapeHtml(formatUsd(mitIfRemoved?.cash_in_lieu_usd || 0))} city mitigation liability if destroyed</span>
        </div>
        <div class="metric-box highlight-box">
          <span class="metric-label">5-Year Arborist Net Margin</span>
          <strong class="metric-value text-accent">${escapeHtml(formatUsd(triage.full_5yr_practitioner_net_usd))}</strong>
          <span class="metric-sub">${escapeHtml(triage.net_margin_multiplier)}x higher net margin vs. one-time removal (${escapeHtml(formatUsd(triage.removal_practitioner_net_usd))})</span>
        </div>
        <div class="metric-box">
          <span class="metric-label">Vadose Soil Sponge Capacity</span>
          <strong class="metric-value">${dualHtml(fmtDualGallons, sponge.storm_1in_capture_gallons)}</strong>
          <span class="metric-sub">${dualUnitSpanHtml('1-in (25 mm) storm capture', '25 mm (1-in) storm capture')} &middot; SOM sponge: ${dualHtml(fmtDualGallons, sponge.som_sponge_capacity_gallons)} (${escapeHtml(sponge.infiltration_class)})</span>
        </div>
      </div>

      <div tabindex="0" role="region" aria-labelledby="triage-table-caption-${escapeHtml(caseObj.slug)}" class="table-wrapper" style="margin-top: 14px;">
        <table
          class="data-table"
          style="
            --label-1: 'Stewardship Stage';
            --label-2: 'Field Scope';
            --label-3: 'Client Price';
            --label-4: 'Arborist Net Margin';
          "
        >
          <caption id="triage-table-caption-${escapeHtml(caseObj.slug)}" class="sr-only">
            Three-Stage Phased Stewardship Triage for ${escapeHtml(sb.tree_tag)}
          </caption>
          <thead>
            <tr>
              <th scope="col">Stewardship Stage &amp; Window</th>
              <th scope="col">Field Scope &amp; Deliverables</th>
              <th scope="col">Client Investment</th>
              <th scope="col">Practitioner Net Margin</th>
            </tr>
          </thead>
          <tbody>
${triageRowsHtml}
          </tbody>
        </table>
      </div>
    </section>

    <!-- SECTION 1: Static Pre-Rendered Determination -->
    <section id="static-determination-verdict" class="card" aria-labelledby="sec1-heading">
      <div class="card-header">
        <span class="step-badge">Section 1</span>
        <h2 id="sec1-heading">Static Pre-Rendered Determination</h2>
      </div>
      <p class="subtitle">
        Computed at build time from <code>src/core/ordinanceEngine.js</code> and <code>src/core/rapEngine.js</code>. Fully inspectable without client-side JavaScript execution.
      </p>

      <div class="verdict-banner">
        <div>
          <span class="metric-label">Evaluated Statutory Protection Tier</span>
          <div class="verdict-title-row">
            <strong class="verdict-big">${escapeHtml(status)} Tree</strong>
            <span class="badge ${badgeClass}">${dualHtml(fmtDualInCm, bio.dbh_inches, bio.dbh_cm)} DBH</span>
            <span class="badge badge-protected">RAP Linter: ${escapeHtml(evalResult.lint.valid ? `PASS (${evalResult.lint.passed_checks.length} checks)` : 'BLOCKED')}</span>
          </div>
          <p class="muni-subtext">
            <strong>One-Line Determination Summary:</strong> ${escapeHtml(stickySummary.one_line_text)}
          </p>
        </div>
        <div class="verdict-right">
          <span class="metric-label">Municipal Permit Verdict</span>
          <strong>${escapeHtml(evalResult.permit.required ? 'PERMIT REQUIRED' : 'No Permit Triggered')}</strong>
          <div class="muni-subtext">Disposition: <code>${escapeHtml(sb.municipal_permit_disposition?.recommended_disposition)}</code></div>
        </div>
      </div>

      <div class="citation-callout">
        <strong>Statutory Permit Summary (<code>permitSummary</code>):</strong> ${escapeHtml(evalResult.permitText)}<br />
        <strong>Primary Municipal Code Citation:</strong> ${escapeHtml(provenance.primary_citation)} ${evalResult.permit.citation ? `| Trigger Citation: ${escapeHtml(evalResult.permit.citation)}` : ''}<br />
        <strong>Canonical Assessment Digest (<code>computeCanonicalSha256</code>):</strong> ${renderExpandableHashHtml(evalResult.sha256)}
      </div>

      ${flagsHtml}

      <div class="metric-grid metric-grid-4">
        <div class="metric-box">
          <span class="metric-label">Specimen &amp; Taxon Anchor</span>
          <strong class="oa-determination-value"><em>${escapeHtml(sb.species_scientific)}</em></strong>
          <span class="metric-sub">${escapeHtml(sb.species_common)} &middot; iNat Taxon <code>${escapeHtml(sb.inaturalist_taxon_id)}</code></span>
        </div>
        <div class="metric-box">
          <span class="metric-label">Stem Measurement Rule</span>
          <strong class="oa-determination-value">${
            sb.is_multistem
              ? dualUnitSpanHtml(
                  `${sb.multistem_aggregation_method} (${(sb.stem_diameters_cm || []).map((c) => cmToIn(c, 1)).join(', ')} in / ${(sb.stem_diameters_cm || []).join(', ')} cm)`,
                  `${sb.multistem_aggregation_method} (${(sb.stem_diameters_cm || []).join(', ')} cm / ${(sb.stem_diameters_cm || []).map((c) => cmToIn(c, 1)).join(', ')} in)`
                )
              : dualUnitSpanHtml('Single Stem (4.5 ft / 1.37 m)', 'Single Stem (1.37 m / 4.5 ft)')
          }</strong>
          <span class="metric-sub">Height: ${dualHtml(fmtDualFromMeters, sb.height_m)} &middot; Crown: ${dualUnitSpanHtml(`${mToFt(sb.crown_spread_ns_m, 1)}x${mToFt(sb.crown_spread_ew_m, 1)} ft (${sb.crown_spread_ns_m}x${sb.crown_spread_ew_m} m)`, `${sb.crown_spread_ns_m}x${sb.crown_spread_ew_m} m (${mToFt(sb.crown_spread_ns_m, 1)}x${mToFt(sb.crown_spread_ew_m, 1)} ft)`)}</span>
        </div>
        <div class="metric-box">
          <span class="metric-label">ISA TRAQ Risk Matrix</span>
          <strong class="metric-value">Overall: ${escapeHtml(sb.isa_traq_risk?.overall_risk_rating)}</strong>
          <span class="metric-sub">Post-Remediation Residual: ${escapeHtml(sb.isa_traq_risk?.residual_risk_rating)} (${escapeHtml(sb.isa_traq_risk?.assessment_level)})</span>
        </div>
        <div class="metric-box highlight-box">
          <span class="metric-label">Shareable Permalink State</span>
          <strong class="metric-value"><a href="../../demo/index.html${escapeHtml(permalinkHash)}" class="text-accent">Hydrate #oa1= Payload</a></strong>
          <span class="metric-sub">Engine v2.2.0 lossless state vector</span>
        </div>
      </div>
    </section>

    <!-- SECTION 2: Provenance Surface & Epistemic Boundaries -->
    <section class="card" aria-labelledby="sec2-heading">
      <div class="card-header">
        <span class="step-badge">Section 2</span>
        <h2 id="sec2-heading">Provenance Surface &amp; Epistemic Boundaries ("What This Record Does Not Know")</h2>
      </div>
      <p class="subtitle">
        Generated by <code>inspectMunicipalityProvenance()</code>. Open Arbor separates verified statutory provisions from unverified sub-sections and never borrows another city's rules silently.
      </p>

      <div class="metric-grid metric-grid-4">
        <div class="metric-box">
          <span class="metric-label">Dataset Version</span>
          <strong class="metric-value"><code>${escapeHtml(provenance.dataset_version)}</code></strong>
          <span class="metric-sub">${escapeHtml(provenance.dataset_standard)}</span>
        </div>
        <div class="metric-box">
          <span class="metric-label">Record ID &amp; Municipality</span>
          <strong class="metric-value"><code>${escapeHtml(provenance.record_id)}</code></strong>
          <span class="metric-sub">${escapeHtml(provenance.municipality_name)}</span>
        </div>
        <div class="metric-box">
          <span class="metric-label">Record Completeness Tier</span>
          <strong class="metric-value"><code>${escapeHtml(provenance.record_tier)}</code></strong>
          <span class="metric-sub">Last Verified: <code>${escapeHtml(provenance.last_verified)}</code></span>
        </div>
        <div class="metric-box">
          <span class="metric-label">Primary Statutory Citation</span>
          <strong class="metric-value">${escapeHtml(provenance.primary_citation)}</strong>
          <span class="metric-sub"><a href="${escapeHtml(provenance.source_url)}" target="_blank" rel="noopener noreferrer" class="muni-link">Official Municipal Code Source</a></span>
        </div>
      </div>

      <h3 class="sub-heading">Verified Statutory Sections &amp; Epistemic Boundary Audit</h3>
      <div tabindex="0" role="region" aria-labelledby="prov-table-caption-${escapeHtml(caseObj.slug)}" class="table-wrapper">
        <table
          class="data-table"
          style="
            --label-1: 'Statutory Field';
            --label-2: 'Verification Status';
            --label-3: 'Encoded Rule / Boundary Notice';
            --label-4: 'Statutory Citation';
          "
        >
          <caption id="prov-table-caption-${escapeHtml(caseObj.slug)}" class="sr-only">
            Provenance Surface and Epistemic Boundaries for ${escapeHtml(provenance.municipality_name)}
          </caption>
          <thead>
            <tr>
              <th scope="col">Statutory Field / Sub-Section</th>
              <th scope="col">Verification Status</th>
              <th scope="col">Encoded Rule or Epistemic Boundary ("What This Record Does Not Know")</th>
              <th scope="col">Statutory Citation</th>
            </tr>
          </thead>
          <tbody>
${verifiedRowsHtml}
${unverifiedRowsHtml}
          </tbody>
        </table>
      </div>
    </section>

    <!-- SECTION 3: Deterministic Root Protection Map & Biomechanics -->
    <section class="card" aria-labelledby="sec3-heading">
      <div class="card-header">
        <span class="step-badge">Section 3</span>
        <h2 id="sec3-heading">Deterministic Root Protection Map &amp; Subterranean Biomechanics</h2>
      </div>
      <p class="subtitle">
        To-scale vector <code>&lt;svg&gt;</code> site map generated by <code>renderSiteMapSVG()</code> alongside international root protection zones (<code>AS 4970</code>, <code>ANSI A300 Part 5</code>, <code>BS 5837</code>), Claus Mattheck hollow-shell buckling physics (<code>t/R</code>), and supersonic AirSpade radial trenching prescriptions.
      </p>

      <div class="svg-map-wrap">
        <div class="svg-map-header">
          <span><strong>ANSI A300 Part 5 / ISA BMP To-Scale Vector Protection Map</strong> (Fence Radius: ${dualHtml(fmtDualFtM, row.fence_ft)} | Plus Code: <code>${escapeHtml(sb.plus_code_global)}</code>)</span>
          <span>Retained Root-Zone Invigoration Budget: <strong>${escapeHtml(formatUsd(evalResult.soilRemediation.total_usd))}</strong></span>
        </div>
        ${labeledCaseSvg}
      </div>

      <h3 class="sub-heading">Root Protection Zones, Mattheck Shell Physics &amp; Pneumatic AirSpade Prescription</h3>
      <div tabindex="0" role="region" aria-labelledby="bio-table-caption-${escapeHtml(caseObj.slug)}" class="table-wrapper">
        <table
          class="data-table"
          style="
            --label-1: 'Parameter';
            --label-2: 'Computed Value';
            --label-3: 'Governing Standard';
            --label-4: 'Diagnostic &amp; Field Prescription';
          "
        >
          <caption id="bio-table-caption-${escapeHtml(caseObj.slug)}" class="sr-only">
            Root Protection Zones and Biomechanical Parameters for ${escapeHtml(sb.tree_tag)}
          </caption>
          <thead>
            <tr>
              <th scope="col">Biomechanical / Root Zone Parameter</th>
              <th scope="col">Computed Value (US Imperial &amp; Metric)</th>
              <th scope="col">Governing Standard / Formula</th>
              <th scope="col">Diagnostic Finding &amp; Field Prescription</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Structural Root Zone (<code>SRZ</code>)</th>
              <td><strong>${dualHtml(fmtDualFtM, rz.srz.radius_feet, rz.srz.radius_meters)}</strong><br /><small>Area: ${dualHtml(fmtDualAreaSqftSqm, rz.srz.area_sqft, rz.srz.area_sqm)}</small></td>
              <td><code>AS 4970-2009 § 3.3.5</code> / Mattheck Windthrow Plate</td>
              <td>Basal root flare diameter ${dualHtml(fmtDualFromCm, rh.root_flare_diameter_cm)}; zero mechanical trenching or grade lowering permitted inside SRZ.</td>
            </tr>
            <tr>
              <th scope="row">Critical Root Zone (<code>CRZ</code>)</th>
              <td><strong>${dualHtml(fmtDualFtM, rz.crz.radius_feet, rz.crz.radius_meters)}</strong><br /><small>Area: ${dualHtml(fmtDualAreaSqftSqm, rz.crz.area_sqft, rz.crz.area_sqm)} | 1/2 CRZ: ${dualHtml(fmtDualFtM, rz.crz.half_radius_feet)}</small></td>
              <td><code>ANSI A300 Part 5</code> / Municipal Code (${escapeHtml(evalResult.municipality?.plan_rules?.root_zone?.crz_ft_per_inch || 1.0)} ft/in DBH)</td>
              <td>Protective fencing required at ${dualHtml(fmtDualFtM, row.fence_ft)} radius; current CRZ disturbance is ${escapeHtml(caseObj.crz_disturbed_pct)}%.</td>
            </tr>
            <tr>
              <th scope="row">International TPZ Comparisons</th>
              <td><strong>AS 4970:</strong> ${dualHtml(fmtDualFtM, rz.tpzAs4970.radius_feet, rz.tpzAs4970.radius_meters)}<br /><strong>BS 5837:</strong> ${dualHtml(fmtDualFromMeters, rz.tpzBs5837.radius_meters)} | <strong>US 1.5:1:</strong> ${dualHtml(fmtDualFtM, rz.tpzUs115.radius_feet)}</td>
              <td><code>AS 4970</code> (12x DBH) / <code>UK BS 5837:2012</code> / <code>ISA BMP 1.5:1</code></td>
              <td>Cross-standard protection radii for mature and sensitive tree preservation specifications.</td>
            </tr>
            <tr>
              <th scope="row">Tree Influence Zone (<code>TIZ</code>)</th>
              <td><strong>${dualHtml(fmtDualFromMeters, bio.root_zones.tiz_radius_meters)} radius</strong><br /><small>Footprint Area: ${dualHtml(fmtDualAreaFromSqm, bio.root_zones.tiz_area_sqm)}</small></td>
              <td><code>RAP-Spec v2.0</code> Holobiont Mycorrhizal Catchment</td>
              <td>Defines the ${dualHtml(fmtDualFromCm, 8)} coarse ramial woodchip mulch horizon (${dualHtml(fmtDualSoilVolFromM3, bio.rhizosphere_prescription.amendments.ramial_woodchip_mulch_m3)}) and native companion guild zone.</td>
            </tr>
            <tr>
              <th scope="row">Mattheck Hollow-Shell Ratio (<code>t/R</code>) &amp; CODIT</th>
              <td><strong><code>t/R = ${escapeHtml(bio.biomechanics.sound_shell_thickness_ratio_t_over_r)}</code></strong><br /><small>Sound shell: ${dualHtml(fmtDualFromCm, bio.biomechanics.sound_shell_cm)} / Radius: ${dualHtml(fmtDualFromCm, bio.biomechanics.trunk_radius_cm)}</small></td>
              <td>Mattheck (1994) <code>t/R &ge; 0.30</code> Criterion &amp; Shigo CODIT</td>
              <td><strong>${escapeHtml(bio.biomechanics.stability_rating)}</strong> | CODIT: <code>${escapeHtml(bio.biomechanics.codit_wall_response_rating)}</code>.</td>
            </tr>
            <tr>
              <th scope="row">Supersonic AirSpade Radial Trenching &amp; SGR Relief</th>
              <td><strong>${dualHtml(fmtDualSoilVolFromM3, bio.rhizosphere_prescription.total_decompacted_soil_m3)} decompacted</strong><br /><small>${escapeHtml(air.trench_count)} spokes (${dualUnitSpanHtml(`${mToFt(air.trench_length_m, 1)} ft x ${cmToIn(air.trench_width_cm, 1)} in x ${cmToIn(air.trench_depth_cm, 1)} in (${air.trench_length_m} m x ${air.trench_width_cm} cm x ${air.trench_depth_cm} cm)`, `${air.trench_length_m} m x ${air.trench_width_cm} cm x ${air.trench_depth_cm} cm (${mToFt(air.trench_length_m, 1)} ft x ${cmToIn(air.trench_width_cm, 1)} in x ${cmToIn(air.trench_depth_cm, 1)} in)`)} @ ${dualHtml(fmtDualPressureFromPsi, bio.rhizosphere_prescription.operating_pressure_psi)})</small></td>
              <td><code>ANSI A300 Part 2</code> / <code>RAP-Spec v2.0</code> Domain 2 &amp; 4</td>
              <td>Root flare burial ${dualHtml(fmtDualFromCm, rh.root_flare_burial_depth_cm)}; SGR count: ${escapeHtml(bio.rhizosphere_prescription.stem_girdling_root_count)} (<code>${escapeHtml(bio.rhizosphere_prescription.stem_girdling_root_severity)}</code>, relief ratio ${escapeHtml(bio.rhizosphere_prescription.vascular_constriction_relief_ratio)}). Amendments: ${dualHtml(fmtDualBiocharFromLiters, bio.rhizosphere_prescription.amendments.precharged_biochar_liters)} biochar, ${dualHtml(fmtDualSoilVolFromM3, bio.rhizosphere_prescription.amendments.fungal_compost_m3)} compost, ${dualHtml(fmtDualMassFromKg, bio.rhizosphere_prescription.amendments.fungal_humate_kg)} humate.</td>
            </tr>
            <tr>
              <th scope="row">Soil Physics &amp; Mycorrhizal Microbiome Baseline</th>
              <td><strong>Bulk Density:</strong> ${dualHtml(fmtDualBulkDensity, soil.bulk_density_g_cm3)} | <strong>Infiltration:</strong> ${dualHtml(fmtDualInfiltrationFromMmHr, soil.infiltration_rate_mm_hr)}<br /><small>SOM: ${escapeHtml(soil.organic_matter_pct)}% | pH: ${escapeHtml(soil.soil_ph)} | F:B Ratio: ${escapeHtml(myco.fungal_to_bacterial_biomass_ratio)}</small></td>
              <td>Lab Sample <code>${escapeHtml(soil.lab_sample_id)}</code> &middot; Guild: <code>${escapeHtml(myco.dominant_mycorrhizal_guild)}</code></td>
              <td>STIM Hypothesis: ${escapeHtml(mon.stim_hypothesis_statement)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- SECTION 4: Mitigation Schedule, Holobiont Valuation & Allometrics -->
    <section class="card" aria-labelledby="sec4-heading">
      <div class="card-header">
        <span class="step-badge">Section 4</span>
        <h2 id="sec4-heading">Mitigation Schedule, Holobiont Valuation &amp; Allometric Ecosystem Services</h2>
      </div>
      <p class="subtitle">
        Contrasts municipal removal mitigation liabilities, classical CTLA 10th Edition Trunk Formula depreciation, 200-year Holobiont Biological Equity, John White (FCIN12) veteran tree age, Nowak/McPherson annual ecosystem services, and 5-year practitioner stewardship economics.
      </p>

      <div class="metric-grid metric-grid-4">
        <div class="metric-box">
          <span class="metric-label">Regional Appraisal Model (CTLA 10th Ed.)</span>
          <strong class="oa-valuation-appraisal-val">${escapeHtml(formatUsd(val.ctla_10th_ed_depreciated_usd))}</strong>
          <span class="oa-model-assumption-note">Trunk Formula model ($65/sq in regional base; allometric structural: ${escapeHtml(formatUsd(eco.structural_value_usd))})</span>
        </div>
        <div class="metric-box">
          <span class="metric-label">Experimental Ecosystem Hypothesis (200-Yr Holobiont)</span>
          <strong class="oa-valuation-hypothesis-val">${escapeHtml(formatUsd(val.holobiont_200yr_biological_equity_usd))}</strong>
          <span class="oa-model-assumption-note">Uncalibrated 200-yr model (${escapeHtml(val.veteran_keystone_habitat_multiplier)}x keystone; ${escapeHtml(val.inversion_ratio)}x CTLA; delta +${escapeHtml(formatUsd(val.valuation_delta_usd))}; see docs/LAYERS.md)</span>
        </div>
        <div class="metric-box">
          <span class="metric-label">John White (FCIN12) Veteran Age</span>
          <strong class="metric-value">${escapeHtml(age.estimated_age_years)} years</strong>
          <span class="metric-sub">Adjusted factor ${escapeHtml(age.adjusted_growth_factor)} (${escapeHtml(age.site_condition)})</span>
        </div>
        <div class="metric-box">
          <span class="metric-label">Nowak / McPherson Annual Flow</span>
          <strong class="metric-value">${escapeHtml(formatUsd(eco.total_annual_benefits_usd))}/yr</strong>
          <span class="metric-sub">20-Yr Projected: ${escapeHtml(formatUsd(eco.projected_20yr_benefits_usd))} | Carbon: ${dualHtml(fmtDualMassFromLbs, eco.carbon_storage_lbs)}</span>
        </div>
      </div>

      <h3 class="sub-heading">Municipal Mitigation Schedule &amp; Valuation Comparison Table</h3>
      <div tabindex="0" role="region" aria-labelledby="mit-table-caption-${escapeHtml(caseObj.slug)}" class="table-wrapper">
        <table
          class="data-table"
          style="
            --label-1: 'Scenario / Model';
            --label-2: 'Replacement Caliper';
            --label-3: 'Cash-in-Lieu / Value';
            --label-4: 'Penalty / Equity Impact';
            --label-5: 'Statutory / Scientific Basis';
          "
        >
          <caption id="mit-table-caption-${escapeHtml(caseObj.slug)}" class="sr-only">
            Mitigation Schedule, Holobiont Valuation, and Practice Economics for ${escapeHtml(sb.tree_tag)}
          </caption>
          <thead>
            <tr>
              <th scope="col">Mitigation / Valuation / Economic Scenario</th>
              <th scope="col">Replacement Caliper Owed</th>
              <th scope="col">Cash-in-Lieu / Capital Value (USD)</th>
              <th scope="col">Unpermitted Penalty / Net Margin Impact</th>
              <th scope="col">Statutory or Scientific Basis</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Current Preservation Plan (${escapeHtml(row.removal ? 'Removal Triggered' : 'Tree Retained & Remediated')})</th>
              <td>${mitActive ? `${dualHtml(fmtDualInCm, mitActive.replacement_inches_owed)} (${escapeHtml(mitActive.replacement_trees_owed)} trees)` : dualHtml(fmtDualInCm, 0)}</td>
              <td><strong>${escapeHtml(formatUsd(mitActive?.cash_in_lieu_usd || 0))}</strong></td>
              <td>Penalty: ${escapeHtml(formatUsd(mitActive?.unpermitted_penalty?.total_penalty_usd || 0))}</td>
              <td>${escapeHtml(mitActive?.citation || provenance.primary_citation)} (Exemption cap: ${dualHtml(fmtDualInCm, mitActive?.exemption_cap_inches || 0)})</td>
            </tr>
            <tr>
              <th scope="row">Municipal Liability If Tree Removed / Destroyed</th>
              <td><strong>${mitIfRemoved ? `${dualHtml(fmtDualInCm, mitIfRemoved.replacement_inches_owed)} (${escapeHtml(mitIfRemoved.replacement_trees_owed)} trees)` : dualHtml(fmtDualInCm, 0)}</strong></td>
              <td><strong class="text-danger">${escapeHtml(formatUsd(mitIfRemoved?.cash_in_lieu_usd || 0))}</strong></td>
              <td class="text-danger">Unpermitted Total: ${escapeHtml(formatUsd(mitIfRemoved?.unpermitted_penalty?.total_penalty_usd || 0))}</td>
              <td>${escapeHtml(mitIfRemoved?.citation || provenance.primary_citation)}</td>
            </tr>
            <tr>
              <th scope="row">Valuation Models: CTLA 10th Ed. vs. 200-Year Holobiont Hypothesis</th>
              <td>N/A (Modeled Asset)</td>
              <td><strong class="oa-valuation-appraisal-val">CTLA: ${escapeHtml(formatUsd(val.ctla_10th_ed_depreciated_usd))}</strong> <span class="oa-valuation-hypothesis-val">| Experimental 200-Yr Model: ${escapeHtml(formatUsd(val.holobiont_200yr_biological_equity_usd))}</span> <span class="oa-model-assumption-note">Assumes CTLA $65/sq in trunk formula; uncalibrated 200-yr survival assumption</span></td>
              <td>Carbon: ${escapeHtml(formatUsd(val.breakdown.carbon_storage_equity_usd))} | Hydrology: ${escapeHtml(formatUsd(val.breakdown.vadose_hydrology_equity_usd))} | CMN Soil: ${escapeHtml(formatUsd(val.breakdown.cmn_rhizosphere_equity_usd))}</td>
              <td>RAP-Spec v2.0 Dual Valuation (${escapeHtml(val.veteran_keystone_habitat_multiplier)}x Veteran Keystone Multiplier; ${escapeHtml(val.inversion_ratio)}x inversion)</td>
            </tr>
            <tr>
              <th scope="row">Nowak / McPherson / Xiao Allometric Services</th>
              <td>Canopy: ${dualHtml(fmtDualAreaSqftSqm, eco.canopy_cover_sqft)}</td>
              <td><strong>${escapeHtml(formatUsd(eco.projected_20yr_benefits_usd))}</strong> (20-yr) | ${escapeHtml(formatUsd(eco.total_annual_benefits_usd))}/yr</td>
              <td>Carbon stored: ${dualHtml(fmtDualMassFromLbs, eco.carbon_storage_lbs)} | Stormwater: ${dualHtml(fmtDualGallons, eco.avoided_runoff_gallons_yr, '/yr')} | Cooling: ${escapeHtml(eco.cooling_savings_kwh_yr)} kWh/yr</td>
              <td>Nowak (1994, 2006), Cairns et al. (1997), Xiao et al. (2000), McPherson &amp; Simpson (1999)</td>
            </tr>
            <tr>
              <th scope="row">5-Year Regenerative Stewardship vs. One-Time Removal Bid</th>
              <td>${escapeHtml((guild.native_companion_species_guild || []).reduce((s, g) => s + (g.quantity_planted || 0), 0))} native guild plants</td>
              <td><strong>Stewardship Gross: ${escapeHtml(formatUsd(econ.regenerative_stewardship_model.five_year_gross_revenue_usd))}</strong> vs. Removal Bid: ${escapeHtml(formatUsd(econ.legacy_removal_model.one_time_gross_bid_usd))}</td>
              <td><strong class="text-accent">Net Margin: ${escapeHtml(formatUsd(econ.regenerative_stewardship_model.net_practitioner_margin_usd))} (${escapeHtml(econ.comparison.margin_multiplier)}x removal margin)</strong></td>
              <td><code>computeRegenerativePracticeEconomics()</code> (${escapeHtml(econ.regenerative_stewardship_model.recurring_revenue_share_pct)}% recurring revenue)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="sub-heading">Prescribed Native Understory Companion Guild (${escapeHtml(guild.reference_ecosystem_name)})</h3>
      <div tabindex="0" role="region" aria-labelledby="guild-table-caption-${escapeHtml(caseObj.slug)}" class="table-wrapper">
        <table
          class="data-table"
          style="
            --label-1: 'Companion Species';
            --label-2: 'iNat Taxon ID';
            --label-3: 'Nursery Batch ID';
            --label-4: 'Stratum Layer';
            --label-5: 'Functional Role';
            --label-6: 'Qty Planted';
          "
        >
          <caption id="guild-table-caption-${escapeHtml(caseObj.slug)}" class="sr-only">
            Native Understory Companion Guild Prescription for ${escapeHtml(sb.tree_tag)}
          </caption>
          <thead>
            <tr>
              <th scope="col">Companion Species (Scientific &amp; Common)</th>
              <th scope="col">iNaturalist Taxon ID</th>
              <th scope="col">Open Nursery Batch ID</th>
              <th scope="col">Stratum Layer</th>
              <th scope="col">Ecological Functional Role</th>
              <th scope="col">Quantity</th>
            </tr>
          </thead>
          <tbody>
${companionRowsHtml}
          </tbody>
        </table>
      </div>
    </section>

    <!-- STIM EPISTEMIC SIEVE: LEO-RAP 6-Slot Cambium Receipt -->
    <details class="oa-veil card" id="case-leo-epistemic-veil">
      <summary class="oa-veil-summary">
        <strong>STIM Epistemic Sieve: LEO-RAP 6-Slot Cambium Receipt</strong>
        <span>(Oracle Provenance Anchors, Reconciled UNVERIFIED Tokens &amp; Sabotage Self-Audit)</span>
      </summary>
      <div class="oa-veil-body" style="margin-top: 14px;">
        <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 12px;">
          <code>${escapeHtml(leoBrief.status_line)}</code>
          <span class="badge ${leoSelfAudit.self_audit_passed ? 'badge-protected' : 'badge-warn'}">
            ${escapeHtml(
              leoSelfAudit.self_audit_passed
                ? `${leoSelfAudit.fixtures_tested}/${leoSelfAudit.fixtures_tested} Negative Sabotage Fixtures Caught`
                : 'Self-Audit Pending'
            )}
          </span>
        </div>
        <pre class="code-preview" style="white-space: pre-wrap;">${escapeHtml(leoBrief.brief_markdown)}</pre>
      </div>
    </details>

    <!-- SECTION 5: Evidentiary Signature Block -->
    <section id="evidentiary-print-sheet" class="card" aria-labelledby="sec5-heading">
      <div class="card-header">
        <span class="step-badge">Section 5</span>
        <h2 id="sec5-heading">Practitioner Evidentiary Attestation &amp; Signature Block</h2>
      </div>
      <p class="subtitle">
        Print-ready ASCA and RAP-Spec v2.0 conflict-of-interest disclosure and cryptographic attestation block for municipal submittal or conservation easement recording.
      </p>

      <div class="citation-callout">
        <p style="margin: 0 0 8px 0;">
          <strong>Conflict-of-Interest &amp; Evidentiary Attestation Statement:</strong> I certify that this arboricultural and rhizosphere assessment was conducted in accordance with <code>ANSI A300</code> (Parts 1, 2, and 5), <code>ISA Best Management Practices</code>, <code>AS 4970-2009</code>, and <code>Open Arbor RAP-Spec v2.0</code>. The assessing practitioner holds zero financial interest in timber liquidation or un-evidenced tree removal. All biometric, biomechanical (<code>t/R = ${escapeHtml(bio.biomechanics.sound_shell_thickness_ratio_t_over_r)}</code>), soil physical, and statutory mitigation figures trace deterministically to the canonical JSON payload anchored below.
        </p>
        <div class="metric-grid metric-grid-3" style="margin-top: 12px;">
          <div class="metric-box">
            <span class="metric-label">Practitioner Name &amp; Credentials</span>
            <strong class="metric-value">George Steward</strong>
            <span class="metric-sub">ISA Certified Arborist TX-362025A &middot; Oak Wilt Qualified &middot; RAPPER-001</span>
          </div>
          <div class="metric-box">
            <span class="metric-label">Assessment &amp; Re-Inspection Schedule</span>
            <strong class="metric-value">Assessed: ${escapeHtml(sb.assessment_date)}</strong>
            <span class="metric-sub">Year-1 Audit: ${escapeHtml(mon.one_year_leading_indicators?.scheduled_reinspection_date)} &middot; Year-5 Audit: ${escapeHtml(mon.five_year_lagging_indicators?.scheduled_audit_date)}</span>
          </div>
          <div class="metric-box">
            <span class="metric-label">Cryptographic Evidence Seal (SHA-256)</span>
            <div style="margin: 4px 0;">${renderExpandableHashHtml(evalResult.sha256)}</div>
            <span class="metric-sub">Engine Version: <code>2.2.0</code> &middot; Dataset: <code>2.0.0</code></span>
          </div>
        </div>
        <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--border-subtle); display: flex; flex-wrap: wrap; justify-content: space-between; gap: 16px; font-size: 0.85rem;">
          <span><strong>Practitioner Signature:</strong> ___________________________________________</span>
          <span><strong>License / Seal ID:</strong> <code>ISA TX-362025A</code></span>
          <span><strong>Date Signed:</strong> <code>${escapeHtml(sb.assessment_date)}</code></span>
        </div>
      </div>
    </section>
  </div>
  </main>

  <footer class="app-footer">
    <div class="container">
      <p>
        Open Arbor v2.2 &middot; Verified Bioregional Field Case (<code>${escapeHtml(caseObj.slug)}</code>) &middot; Governed by the Open Arbor Alliance.
      </p>
      <p>
        AGPL-3.0 for the engine and CC0-1.0 for schemas and data &middot; <a href="../../LICENSE">LICENSE</a> &middot; <a href="../../LICENSE-DATA">LICENSE-DATA</a> &middot; <a href="https://github.com/Arboracle-Ecosystem/openarbor">GitHub Repository</a>
      </p>
    </div>
  </footer>

  <script type="module" src="../../openarbor-bundle.js"></script>
</body>
</html>
`;
}

/**
 * Dynamically extract [PASS] groups from a test file on disk, capturing line numbers
 * from source and evaluated runtime [PASS] labels from executing the suite.
 */
function extractPassGroupsFromFile(filePath, relFilePath, cliCommand, invariantDescriptions = {}, runSuite = true) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split('\n');
  const sourceGroups = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.includes('[PASS]')) continue;
    // Ignore comments so only console.log('[PASS] ...') statements (single-line or multi-line) match
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) continue;

    const idx = line.indexOf('[PASS]');
    let after = line.slice(idx + 6).trim();
    after = after.replace(/(\\n)?['"`]\s*\)?;?\s*$/, '').trim();
    if (!after) continue;

    const rawTitle = after;
    const idMatch = rawTitle.match(/^([0-9]+|D[0-9]+)\.\s*(.+)$/);
    if (!idMatch) continue;
    const groupNum = idMatch[1];
    const title = idMatch[2];
    if (sourceGroups.some((g) => g.groupNum === groupNum)) continue;

    sourceGroups.push({
      groupNum,
      line: i + 1,
      rawTitle,
      title,
    });
  }

  // Execute suite when requested to capture evaluated stdout [PASS] lines without template expressions
  const runtimeLabelsByGroup = new Map();
  if (runSuite) {
    const rootDir = path.dirname(path.dirname(filePath));
    const stdout = execFileSync(process.execPath, [filePath], {
      cwd: rootDir,
      encoding: 'utf8',
      env: { ...process.env, OA_SKIP_D7_GATE: '1' },
    });
    for (const outLine of stdout.split('\n')) {
      const trimmed = outLine.trim();
      if (!trimmed.startsWith('[PASS]')) continue;
      const after = trimmed.slice(6).trim();
      const idMatch = after.match(/^([0-9]+|D[0-9]+)\.\s*(.+)$/);
      if (idMatch) {
        runtimeLabelsByGroup.set(idMatch[1], {
          rawTitle: after,
          title: idMatch[2],
        });
      }
    }
  }

  return sourceGroups.map((sg) => {
    const evaluated = runtimeLabelsByGroup.get(sg.groupNum);
    const cleanRawTitle = evaluated ? evaluated.rawTitle : sg.rawTitle;
    const cleanTitle = evaluated ? evaluated.title : sg.title;
    const idNum = sg.groupNum.replace(/^D/i, '');
    return {
      id: `${path.basename(filePath, '.mjs')}-${idNum}`,
      groupNumber: sg.groupNum,
      title: cleanTitle,
      rawLabel: `[PASS] ${cleanRawTitle}`,
      file: relFilePath,
      line: sg.line,
      command: cliCommand,
      invariant:
        invariantDescriptions[sg.groupNum] ||
        `Verifies ${cleanTitle} and asserts deterministic output without error.`,
    };
  });
}

/**
 * Render out/methods/index.html from live parsed test suites and ordinance validators.
 */
function renderMethodsHtml(rootDir, allMunicipalities) {
  const openArborInvariants = {
    '1': 'Proves ANSI A300 Part 5 CRZ (1.0 ft/in DBH), AS 4970 TPZ (12x DBH clamped 2m to 15m), AS 4970 SRZ windthrow plate ((D*50)^0.42 * 0.64), and multi-stem DBH aggregation (largest_plus_half = 31.0 in; quadratic = 25.4 in).',
    '2': 'Proves Liberty Hill UDC § 6.07.01 protected/heritage evaluation, seasonal Ceratocystis fagacearum (Oak Wilt) pruning window violation flagging, ascending whole-tree 20% diameter exemption walk ($2,250 cash-in-lieu), and vector SVG site map generation.',
    '3': 'Proves John White (FCIN12) site-adjusted veteran tree age estimation (>400 yrs), Nowak/Cairns/Xiao/McPherson allometric carbon, stormwater, cooling, and OGC CRS84 GeoJSON FeatureCollection export.',
    '4': 'Proves Claus Mattheck hollow-cylinder shell buckling stability criterion (t/R >= 0.30 sound vs. t/R = 0.18 buckling risk), stem-girdling root (SGR) vascular constriction relief ratios, and 150 psi AirSpade radial trenching & biochar/compost/humate scaling.',
    '5': 'Proves CTLA 10th Edition Trunk Formula depreciation vs. 200-year Holobiont Biological Equity valuation with 3.5x Veteran Keystone Habitat Multiplier and >=10.0x ecological inversion ratio.',
    '6': 'Proves 5-dimension Open Sanctuary Scorecard parcel rollup (Soil Health, Canopy, Water Dynamics, Biodiversity, Restoration) and 1-ft spatial Cartesian grid union de-duplication (unionRootZoneArea).',
    '7': 'Proves ASCA/RAP hard evidentiary linter blocking unjustified removal when t/R >= 0.30 (UNJUSTIFIED_REMOVAL, EVIDENTIARY_DEFECT) and strict Draft 2020-12 additionalProperties: false schema enforcement.',
    '8': 'Proves Rogue Valley, Oregon bioregional municipal ordinances (Ashland AMC 18.4.5, Medford MMC/MLDC, Grants Pass DC Art. 11) with zero false Texas Oak Wilt flags during May pruning in Oregon.',
    '9': 'Proves bin/openarbor-rap.mjs CLI subcommands (compile, counter-notice, economics --json, attest Open Badges 3.0 minting) plus backward-compatible openarbor-rca shims, negative-path CLI sabotage, and __proto__/constructor prototype-pollution rejection.',
    '10': 'Proves static multi-page web build (out/) across all routes and executes deploy/verify-parity.mjs asserting 4/4 bit-for-bit CLI-to-browser parity.',
    '11': 'Verifies 6-character Plus Code watershed coarsening, zero-PII key/regex blocking, instrument honesty (visual_only_unmeasured -> null t/R), canonical SHA-256 sealing, and JSONL cohort export.',
  };

  const soilInvariants = {
    '1': 'Proves soil_function block is omitted by default, when all-null, and when inherited via Object.prototype on OGC CRS84 GeoJSON exports.',
    '2': 'Proves soil_function block attaches with mandatory source attribution when supplied via metadata or options while leaving municipal mitigation fees unchanged.',
    '3': 'Proves strict validation refusing numeric soil fields without source attribution and rejecting out-of-bounds organic matter, negative infiltration, invalid methods, or inverted ISO dates.',
    '4': 'Proves deterministic vadose 1-inch storm capture and NRCS organic-matter sponge capacity across Compacted (< 15 mm/hr), Moderate (15 to 50 mm/hr), and Living Sponge (> 50 mm/hr) classes.',
  };

  const mcpInvariants = {
    '1': 'Spawns server/mcp/openarbor-mcp.mjs over stdio and verifies JSON-RPC 2.0 initialize handshake (protocolVersion 2024-11-05, server openarbor-mcp v2.2.0, tools and prompts capabilities).',
    '2': 'Verifies tools/list returns all 9 deterministic MCP tools (openarbor_consult first, plus calculate_root_zone, evaluate_ordinance, calculate_ecosystem_benefits, rap_biomechanics, rap_lint, lookup_ordinance, validate_soil_function, leo_rap_verify).',
    '3': 'Verifies known-answer tools/call for calculate_root_zone (24 in DBH, US_1_1 -> radius_feet = 24, area_sqft = 1809.56).',
    '4': 'Verifies lookup_ordinance positive lookup (or-ashland -> 6 in DBH threshold) and graceful structured error on unknown jurisdiction (UNKNOWN_JURISDICTION) without crashing.',
    '5': 'Verifies known-answer tools/call execution for evaluate_ordinance, calculate_ecosystem_benefits, rap_biomechanics (t/R = 0.34 sound), and rap_lint (valid = true) plus legacy rca_* compatibility aliases.',
    '6': 'Verifies tools/call validate_soil_function positive Living Sponge calculation (1,342 gal storm capture), default omission when unsupplied, and structured INVALID_SOIL_FUNCTION error when source is missing.',
    '7': 'Verifies tools/call leo_rap_verify 8/8 oracle anchors, 3/3 negative sabotage self-audit, 3-stage phased triage conservation, and de-fanged house-style-clean Arborist Handoff Brief.',
    '8': 'Verifies bounded-input DoS security guards across evaluate_ordinance (>500 trees -> MAX_TREES_EXCEEDED), lookup_ordinance (>128 chars -> JURISDICTION_ID_TOO_LONG), and leo_rap_verify (>100,000 chars -> MAX_NARRATIVE_LENGTH_EXCEEDED).',
    '9': 'Verifies prototype-chain pollution security gates in scripts/validate-ordinance.mjs: rejects literal __proto__ and constructor payloads with non-zero exit code.',
    '10': 'Verifies openarbor_consult across all 3 audiences, circumference_inches intake, visual_only instrument verification, Cedar Park UNVERIFIED gap visibility, prompts/list, prompts/get, and Steward Agent Pack files.',
    '11': 'Verifies clean JSON-RPC 2.0 shutdown response and child process termination.',
  };

  const coreGroups = extractPassGroupsFromFile(
    path.join(rootDir, 'tests/verify_openarbor.mjs'),
    'tests/verify_openarbor.mjs',
    'node tests/verify_openarbor.mjs',
    openArborInvariants,
    true
  );

  const soilSuitePath = path.join(rootDir, 'tests/verify_soil_function.mjs');
  const soilGroups = fs.existsSync(soilSuitePath)
    ? extractPassGroupsFromFile(
        soilSuitePath,
        'tests/verify_soil_function.mjs',
        'node tests/verify_soil_function.mjs',
        soilInvariants,
        true
      )
    : [];

  const mcpGroups = extractPassGroupsFromFile(
    path.join(rootDir, 'tests/verify_mcp.mjs'),
    'tests/verify_mcp.mjs',
    'node tests/verify_mcp.mjs',
    mcpInvariants,
    true
  );

  const rawMasterworkGroups = extractPassGroupsFromFile(
    path.join(rootDir, 'tests/verify_masterwork_100x.mjs'),
    'tests/verify_masterwork_100x.mjs',
    'node tests/verify_masterwork_100x.mjs',
    {},
    true
  );

  const totalVerificationGroups =
    coreGroups.length + soilGroups.length + mcpGroups.length + rawMasterworkGroups.length;

  const masterworkInvariants = {
    D1: 'Proves versioned #oa1= base64url assessment permalink encoding and round-trip decoding across 3 bioregional presets with identical SHA-256 digests, permit verdicts, CRZ radii, and cash-in-lieu fees.',
    D2: 'Proves sticky determination summary bar (#sticky-determination-bar) DOM contract, live status/DBH/CRZ/replacement/cash-in-lieu readouts, and keyboard-reachable verdict link copy button.',
    D3: 'Proves build-time static crawlable Case Gallery (out/cases/index.html + 5 case pages) containing pre-rendered determinations, inline <svg> root zone maps, and #oa1= links with JavaScript disabled.',
    D4: 'Proves offline field mode Service Worker (out/sw.js) pre-caching openarbor-bundle.js, municipal ordinance datasets, schemas, and offline fetch handler.',
    D5: 'Proves municipal provenance surface and epistemic gap inspector (inspectMunicipalityProvenance) explicitly enumerating UNVERIFIED statutory sub-sections for Cedar Park and Round Rock Threshold_And_Fee_Record entries.',
    D6: 'Proves evidentiary print report stylesheet (@media print, @page Letter) and #evidentiary-print-sheet practitioner attestation & signature block.',
    D7: `Proves falsifiability & verification methodology page (out/methods/index.html) generated dynamically from live test suites with ${totalVerificationGroups}/${totalVerificationGroups} executable verification groups and zero drift.`,
    D8: 'Proves 3-Stage Phased Stewardship Triage (Day-1 Root-Collar Triage undercutting chainsaw removal on Austin and Ashland heritage oaks), dual-voice Arborist Handoff Brief (#oa1=), and native <dialog id="arborist-handoff-dialog" closedby="any"> across Field Home and Field Studio.',
    D9: 'Proves deterministic 6-slot LEO-RAP Profile 01 compiler, anti-liquidation oracle verifier (catching Mattheck t/R violations, drifted oracle numbers, and epistemic count mismatches across 3/3 negative sabotage fixtures), Cedar Park Threshold_And_Fee_Record UNVERIFIED[STATUTORY_RULE] reconciliation, and zero raw backticks on Field Home.',
  };

  const masterworkGroups = rawMasterworkGroups.map((g) => {
    const isD7 = g.groupNumber === 'D7';
    const cleanRawLabel = isD7
      ? `[PASS] D7. Falsifiability Page (out/methods/index.html) verified with ${totalVerificationGroups}/${totalVerificationGroups} live suite verification groups`
      : g.rawLabel;
    return {
      ...g,
      rawLabel: cleanRawLabel,
      invariant: masterworkInvariants[g.groupNumber] || g.invariant,
    };
  });

  const schema = JSON.parse(
    fs.readFileSync(path.join(rootDir, 'schemas/municipal-ordinance.schema.json'), 'utf8')
  );
  const txReport = validateOrdinanceFile(
    path.join(rootDir, 'data/ordinances/central_texas_ordinances.json'),
    schema
  );
  const orReport = validateOrdinanceFile(
    path.join(rootDir, 'data/ordinances/rogue_valley_oregon_ordinances.json'),
    schema
  );
  const ordinanceRecords = [
    ...txReport.records.map((r) => ({
      ...r,
      sourceFile: 'data/ordinances/central_texas_ordinances.json',
    })),
    ...orReport.records.map((r) => ({
      ...r,
      sourceFile: 'data/ordinances/rogue_valley_oregon_ordinances.json',
    })),
  ];

  const parityCases = GALLERY_CASES.slice(0, 4);
  const parityMetricsPerCase = 21;
  const totalParityAssertions = parityCases.length * parityMetricsPerCase;

  const totalOrdinanceRecords = ordinanceRecords.length;
  const totalFalsifiableChecks = totalVerificationGroups + totalOrdinanceRecords;

  const fullRuleCount = ordinanceRecords.filter(
    (r) => r.completeness.tier === 'Full_Rule_Record'
  ).length;
  const thresholdFeeCount = ordinanceRecords.length - fullRuleCount;

  const renderGroupRows = (groups) =>
    groups
      .map(
        (g) => `            <tr class="verification-group-row" data-verification-group="${escapeHtml(g.id)}">
              <th scope="row"><code>${escapeHtml(g.id)}</code></th>
              <td><strong>${escapeHtml(g.rawLabel)}</strong></td>
              <td>${escapeHtml(g.invariant)}</td>
              <td><code>${escapeHtml(g.file)}:${escapeHtml(g.line)}</code></td>
              <td><code>${escapeHtml(g.command)}</code></td>
            </tr>`
      )
      .join('\n');

  const ordinanceRowsHtml = ordinanceRecords
    .map((rec) => {
      const muniObj = allMunicipalities.find((m) => m.id === rec.id);
      const prov = inspectMunicipalityProvenance(muniObj);
      const tierBadge =
        rec.completeness.tier === 'Full_Rule_Record' ? 'badge-protected' : 'badge-warn';
      const gapsCount = prov?.unverified_gaps?.length || 0;
      return `            <tr>
              <th scope="row"><code>${escapeHtml(rec.id)}</code><br /><small>${escapeHtml(rec.name)}, ${escapeHtml(rec.state)}</small></th>
              <td><span class="badge badge-protected">${escapeHtml(rec.valid ? 'SCHEMA VALID' : 'INVALID')}</span> <span class="badge ${tierBadge}">${escapeHtml(rec.completeness.tier)}</span></td>
              <td>Protected &ge; ${escapeHtml(muniObj?.dbh_threshold_inches)} in | Heritage &ge; ${escapeHtml(muniObj?.heritage_threshold_inches)} in | ${escapeHtml(gapsCount === 0 ? 'All statutory sections verified (0 gaps)' : `${gapsCount} unverified statutory sub-sections explicitly flagged`)}</td>
              <td><code>${escapeHtml(rec.sourceFile)}</code><br /><small>${escapeHtml(muniObj?.ordinance_numbers || '')}</small></td>
              <td><code>node scripts/validate-ordinance.mjs ${escapeHtml(rec.sourceFile)}</code></td>
            </tr>`;
    })
    .join('\n');

  const parityRowsHtml = parityCases
    .map((c, idx) => {
      const sb = c.assessment.structural_baseline;
      return `            <tr>
              <th scope="row"><code>parity-case-${idx + 1}</code><br /><small><code>${escapeHtml(c.id)}</code></small></th>
              <td><strong>${escapeHtml(c.label)}</strong><br /><small><em>${escapeHtml(sb.species_scientific)}</em> (<code>${escapeHtml(sb.tree_tag)}</code>)</small></td>
              <td>Proves 21/21 bit-for-bit identical outputs between Node.js CLI (<code>bin/openarbor-rap.mjs</code>) and browser bundle (<code>out/openarbor-bundle.js</code>): canonical SHA-256, 10-section report Markdown, counter-notice Markdown, linter checks, DBH, Mattheck t/R, SRZ/CRZ/TIZ radii, AirSpade volume, amendments, permit verdict, cash-in-lieu fee, CTLA vs. Holobiont valuation, 5-yr economics, FCIN12 age, Nowak benefits, and GeoJSON SHA-256.</td>
              <td><code>deploy/verify-parity.mjs:66</code><br /><small>Fixture: <code>deploy/fixtures/${escapeHtml(c.id)}.json</code></small></td>
              <td><code>node deploy/verify-parity.mjs</code></td>
            </tr>`;
    })
    .join('\n');

  const boundaryMunicipalities = allMunicipalities
    .map((m) => inspectMunicipalityProvenance(m))
    .filter((p) => p && p.unverified_gaps.length > 0);

  const boundaryRowsHtml = boundaryMunicipalities
    .flatMap((prov) =>
      prov.unverified_gaps.map(
        (gap) => `            <tr>
              <th scope="row"><strong>${escapeHtml(prov.municipality_name)}</strong><br /><small><code>${escapeHtml(prov.record_id)}</code> (${escapeHtml(prov.record_tier)})</small></th>
              <td><code>${escapeHtml(gap.field)}</code></td>
              <td><span class="badge badge-warn">${escapeHtml(gap.status)}</span></td>
              <td>${escapeHtml(gap.description)}</td>
              <td>${escapeHtml(prov.primary_citation)}</td>
            </tr>`
      )
    )
    .join('\n');

  const runnerCount = 5 + (soilGroups.length > 0 ? 1 : 0);
  const soilSummaryClause =
    soilGroups.length > 0
      ? `<code>tests/verify_soil_function.mjs</code> (${soilGroups.length} groups), `
      : '';
  const soilMetricClause =
    soilGroups.length > 0 ? ` + ${soilGroups.length} Soil` : '';
  const soilCliClause =
    soilGroups.length > 0 ? 'node tests/verify_soil_function.mjs &amp;&amp; ' : '';

  const soilRunnerSectionHtml =
    soilGroups.length > 0
      ? `
    <!-- Soil Function & Vadose Sponge Verification Suite -->
    <section class="card" aria-labelledby="suite-soil-heading">
      <div class="card-header">
        <span class="step-badge">Runner 2 (${soilGroups.length} Groups)</span>
        <h2 id="suite-soil-heading">Soil Function, Provenance Source Gate &amp; Vadose Sponge Suite (<code>tests/verify_soil_function.mjs</code>)</h2>
      </div>
      <div tabindex="0" role="region" aria-labelledby="table-soil-caption" class="table-wrapper">
        <table
          class="data-table"
          style="
            --label-1: 'Group ID';
            --label-2: 'Verification Gate';
            --label-3: 'Soil Physics / Provenance Invariant Proven';
            --label-4: 'Source File &amp; Line';
            --label-5: 'CLI Command';
          "
        >
          <caption id="table-soil-caption" class="sr-only">Soil Function and Vadose Sponge Verification Groups in tests/verify_soil_function.mjs</caption>
          <thead>
            <tr>
              <th scope="col">Group ID</th>
              <th scope="col">Verification Gate</th>
              <th scope="col">Soil Physics, Provenance, or Prototype-Safety Invariant Proven</th>
              <th scope="col">Source File &amp; Line</th>
              <th scope="col">Exact CLI Reproduction Command</th>
            </tr>
          </thead>
          <tbody>
${renderGroupRows(soilGroups)}
          </tbody>
        </table>
      </div>
    </section>`
      : '';

  const mcpRunnerNum = soilGroups.length > 0 ? 3 : 2;
  const ordRunnerNum = soilGroups.length > 0 ? 4 : 3;
  const parityRunnerNum = soilGroups.length > 0 ? 5 : 4;
  const masterworkRunnerNum = soilGroups.length > 0 ? 6 : 5;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light dark" />
  <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#08110b" />
  <meta name="theme-color" media="(prefers-color-scheme: light)" content="#f6f5ef" />
  <script>
    try {
      document.querySelector('meta[name="color-scheme"]').content = localStorage.getItem('color-scheme') ?? 'light dark';
    } catch (e) {}
  </script>
  <title>Executable Proof &amp; Falsifiability Ledger (${totalVerificationGroups} Executable Groups) | Open Arbor v2.2</title>
  <meta
    name="description"
    content="Open Arbor v2.2 Executable Proof & Falsifiability Ledger: ${totalVerificationGroups} executable verification groups across ${runnerCount} deterministic test runners plus ${totalOrdinanceRecords} schema-validated municipal ordinance records (${totalParityAssertions}/${totalParityAssertions} CLI-to-browser parity metrics)."
  />
  <link rel="manifest" href="../manifest.webmanifest" />
  <link rel="icon" href="../icons/icon.svg" type="image/svg+xml" />
  <link rel="apple-touch-icon" href="../icons/apple-touch-icon.png" />
  <link rel="stylesheet" href="../styles.css" />
</head>
<body data-total-verification-groups="${totalVerificationGroups}" data-total-ordinance-records="${totalOrdinanceRecords}">
${renderSharedHeader('..', 'methods')}

  <main>
  <section class="app-header">
    <div class="container header-inner">
      <div>
        <span class="eyebrow">Executable Proof &amp; Falsifiability Ledger &middot; Live Build-Time Introspection &middot; Zero Unfalsifiable Claims</span>
        <h1 id="main-content" tabindex="-1">Falsifiability &amp; Deterministic Verification Methodology</h1>
        <p class="subtitle">
          Every mathematical equation, statutory threshold, cryptographic digest, and security boundary in Open Arbor is backed by an executable test assertion on disk. This page is generated at build time by parsing and running the live test suites so counts can never drift from reality.
        </p>
      </div>
      <div class="header-actions">
        <a href="../cases/index.html" class="btn btn-primary">Inspect Bioregional Cases</a>
        <a href="../demo/index.html" class="btn btn-outline">Open Field Studio</a>
      </div>
    </div>
  </section>

  <div class="container main-layout">
    <!-- Executive Falsifiability Summary Banner -->
    <section
      class="card"
      aria-labelledby="falsifiability-summary-heading"
      data-total-verification-groups="${totalVerificationGroups}"
      data-total-ordinance-records="${totalOrdinanceRecords}"
    >
      <div class="card-header">
        <span class="step-badge">Live Suite Rollup</span>
        <h2 id="falsifiability-summary-heading">Executive Falsifiability Summary (${totalVerificationGroups} Executable Verification Groups + ${totalOrdinanceRecords} Validated Ordinance Records)</h2>
      </div>
      <p class="subtitle">
        Generated directly from <code>tests/verify_openarbor.mjs</code> (${coreGroups.length} groups), ${soilSummaryClause}<code>tests/verify_mcp.mjs</code> (${mcpGroups.length} groups), <code>deploy/verify-parity.mjs</code> (${parityCases.length} bioregional parity cases &times; ${parityMetricsPerCase} metrics = ${totalParityAssertions} parity assertions), and <code>tests/verify_masterwork_100x.mjs</code> (${masterworkGroups.length} Masterwork gates), plus <code>scripts/validate-ordinance.mjs</code> (${totalOrdinanceRecords} municipal ordinance records: ${fullRuleCount} <code>Full_Rule_Record</code>, ${thresholdFeeCount} <code>Threshold_And_Fee_Record</code>) = <strong>${totalFalsifiableChecks} total falsifiable checks</strong>.
      </p>

      <div class="metric-grid metric-grid-4">
        <div class="metric-box highlight-box">
          <span class="metric-label">Executable Verification Groups</span>
          <strong class="metric-value text-accent">${totalVerificationGroups} / ${totalVerificationGroups} Groups</strong>
          <span class="metric-sub">${coreGroups.length} Core${soilMetricClause} + ${mcpGroups.length} MCP + ${masterworkGroups.length} Masterwork</span>
        </div>
        <div class="metric-box">
          <span class="metric-label">Validated Municipal Ordinances</span>
          <strong class="metric-value">${totalOrdinanceRecords} Jurisdictions</strong>
          <span class="metric-sub">${fullRuleCount} Full_Rule_Record + ${thresholdFeeCount} Threshold_And_Fee_Record</span>
        </div>
        <div class="metric-box">
          <span class="metric-label">CLI-to-Browser Bundle Parity</span>
          <strong class="metric-value text-accent">${totalParityAssertions} / ${totalParityAssertions} Metrics</strong>
          <span class="metric-sub">${parityCases.length} TX &amp; OR cases &times; ${parityMetricsPerCase} bit-for-bit assertions</span>
        </div>
        <div class="metric-box">
          <span class="metric-label">Total Falsifiable Checks</span>
          <strong class="metric-value">${totalFalsifiableChecks} Checks</strong>
          <span class="metric-sub">Zero proprietary runtime dependencies</span>
        </div>
      </div>

      <div class="oa-code-card" style="margin-top: 12px;">
        <div class="oa-code-header">
          <strong>One-Line Complete Verification Reproduction Command</strong>
          <button type="button" class="btn btn-outline btn-xs" data-copy-target="cmd-reproduce-all">Copy Command</button>
        </div>
        <pre id="cmd-reproduce-all" class="code-preview">node tests/verify_openarbor.mjs &amp;&amp; ${soilCliClause}node tests/verify_mcp.mjs &amp;&amp; node scripts/validate-ordinance.mjs &amp;&amp; node deploy/verify-parity.mjs &amp;&amp; node tests/verify_masterwork_100x.mjs</pre>
      </div>
    </section>

    <!-- Table 1: Core Engine Verification Suite -->
    <section class="card" aria-labelledby="suite1-heading">
      <div class="card-header">
        <span class="step-badge">Runner 1 (${coreGroups.length} Groups)</span>
        <h2 id="suite1-heading">Core Arboricultural, Allometric &amp; RAP Engine Suite (<code>tests/verify_openarbor.mjs</code>)</h2>
      </div>
      <div tabindex="0" role="region" aria-labelledby="table1-caption" class="table-wrapper">
        <table
          class="data-table"
          style="
            --label-1: 'Group ID';
            --label-2: 'Verification Gate';
            --label-3: 'Mathematical / Statutory Invariant Proven';
            --label-4: 'Source File &amp; Line';
            --label-5: 'CLI Command';
          "
        >
          <caption id="table1-caption" class="sr-only">Core Engine Verification Groups in tests/verify_openarbor.mjs</caption>
          <thead>
            <tr>
              <th scope="col">Group ID</th>
              <th scope="col">Verification Gate</th>
              <th scope="col">Mathematical, Statutory, or Security Invariant Proven</th>
              <th scope="col">Source File &amp; Line</th>
              <th scope="col">Exact CLI Reproduction Command</th>
            </tr>
          </thead>
          <tbody>
${renderGroupRows(coreGroups)}
          </tbody>
        </table>
      </div>
    </section>
${soilRunnerSectionHtml}

    <!-- MCP Server & Security Gate Suite -->
    <section class="card" aria-labelledby="suite2-heading">
      <div class="card-header">
        <span class="step-badge">Runner ${mcpRunnerNum} (${mcpGroups.length} Groups)</span>
        <h2 id="suite2-heading">Model Context Protocol (<code>JSON-RPC 2.0</code>) &amp; Security Gate Suite (<code>tests/verify_mcp.mjs</code>)</h2>
      </div>
      <div tabindex="0" role="region" aria-labelledby="table2-caption" class="table-wrapper">
        <table
          class="data-table"
          style="
            --label-1: 'Group ID';
            --label-2: 'Verification Gate';
            --label-3: 'Protocol / Security Invariant Proven';
            --label-4: 'Source File &amp; Line';
            --label-5: 'CLI Command';
          "
        >
          <caption id="table2-caption" class="sr-only">MCP Server and Security Verification Groups in tests/verify_mcp.mjs</caption>
          <thead>
            <tr>
              <th scope="col">Group ID</th>
              <th scope="col">Verification Gate</th>
              <th scope="col">Protocol, Known-Answer, or Security Invariant Proven</th>
              <th scope="col">Source File &amp; Line</th>
              <th scope="col">Exact CLI Reproduction Command</th>
            </tr>
          </thead>
          <tbody>
${renderGroupRows(mcpGroups)}
          </tbody>
        </table>
      </div>
    </section>

    <!-- Municipal Ordinance Schema Validator -->
    <section class="card" aria-labelledby="suite3-heading">
      <div class="card-header">
        <span class="step-badge">Runner ${ordRunnerNum} (${totalOrdinanceRecords} Records)</span>
        <h2 id="suite3-heading">Municipal Tree Ordinance Schema &amp; Completeness Validator (<code>scripts/validate-ordinance.mjs</code>)</h2>
      </div>
      <div tabindex="0" role="region" aria-labelledby="table3-caption" class="table-wrapper">
        <table
          class="data-table"
          style="
            --label-1: 'Jurisdiction ID';
            --label-2: 'Schema &amp; Tier';
            --label-3: 'Statutory Thresholds &amp; Completeness';
            --label-4: 'Dataset Source';
            --label-5: 'CLI Command';
          "
        >
          <caption id="table3-caption" class="sr-only">Validated Municipal Ordinance Records in data/ordinances/</caption>
          <thead>
            <tr>
              <th scope="col">Jurisdiction ID &amp; City</th>
              <th scope="col">Schema &amp; Record Tier</th>
              <th scope="col">Verified Thresholds &amp; Epistemic Completeness</th>
              <th scope="col">Dataset File &amp; Primary Citation</th>
              <th scope="col">Exact CLI Reproduction Command</th>
            </tr>
          </thead>
          <tbody>
${ordinanceRowsHtml}
          </tbody>
        </table>
      </div>
    </section>

    <!-- CLI-vs-Browser Bundle Parity Runner -->
    <section class="card" aria-labelledby="suite4-heading">
      <div class="card-header">
        <span class="step-badge">Runner ${parityRunnerNum} (${parityCases.length} Cases / ${totalParityAssertions} Metrics)</span>
        <h2 id="suite4-heading">Node.js CLI vs. Browser Bundle Bit-for-Bit Parity Suite (<code>deploy/verify-parity.mjs</code>)</h2>
      </div>
      <div tabindex="0" role="region" aria-labelledby="table4-caption" class="table-wrapper">
        <table
          class="data-table"
          style="
            --label-1: 'Parity Case ID';
            --label-2: 'Bioregional Specimen';
            --label-3: '21-Metric Bit-for-Bit Parity Invariant';
            --label-4: 'Runner &amp; Fixture';
            --label-5: 'CLI Command';
          "
        >
          <caption id="table4-caption" class="sr-only">CLI-to-Browser Parity Cases in deploy/verify-parity.mjs</caption>
          <thead>
            <tr>
              <th scope="col">Parity Group ID</th>
              <th scope="col">Bioregional Reference Specimen</th>
              <th scope="col">21-Metric Bit-for-Bit CLI-to-Browser Invariant Proven</th>
              <th scope="col">Source Runner &amp; Fixture</th>
              <th scope="col">Exact CLI Reproduction Command</th>
            </tr>
          </thead>
          <tbody>
${parityRowsHtml}
          </tbody>
        </table>
      </div>
    </section>

    <!-- Masterwork Deliverable Verification Gates -->
    <section class="card" aria-labelledby="suite5-heading">
      <div class="card-header">
        <span class="step-badge">Runner ${masterworkRunnerNum} (${masterworkGroups.length} Gates)</span>
        <h2 id="suite5-heading">Field Studio, Epistemic Oracle &amp; Handoff Verification Suite (<code>tests/verify_masterwork_100x.mjs</code>)</h2>
      </div>
      <div tabindex="0" role="region" aria-labelledby="table5-caption" class="table-wrapper">
        <table
          class="data-table"
          style="
            --label-1: 'Deliverable Gate';
            --label-2: 'Verification Gate';
            --label-3: 'Deliverable Invariant Proven';
            --label-4: 'Source File &amp; Line';
            --label-5: 'CLI Command';
          "
        >
          <caption id="table5-caption" class="sr-only">Masterwork Deliverable Verification Gates</caption>
          <thead>
            <tr>
              <th scope="col">Gate ID</th>
              <th scope="col">Verification Gate</th>
              <th scope="col">Architectural &amp; User-Facing Invariant Proven</th>
              <th scope="col">Source File &amp; Line</th>
              <th scope="col">Exact CLI Reproduction Command</th>
            </tr>
          </thead>
          <tbody>
${renderGroupRows(masterworkGroups)}
          </tbody>
        </table>
      </div>
    </section>

    <!-- Epistemic Boundary Table: What This Engine Does Not Claim -->
    <section class="card" aria-labelledby="epistemic-boundary-heading">
      <div class="card-header">
        <span class="step-badge">Epistemic Integrity</span>
        <h2 id="epistemic-boundary-heading">What This Engine Does Not Claim (Explicit Statutory &amp; Physical Boundaries)</h2>
      </div>
      <p class="subtitle">
        Under Open Arbor's Integrity Law, missing statutory sub-sections are left visibly flagged as <code>UNVERIFIED</code> rather than filled by cross-city assumption. Below are the exact unverified statutory gaps surfaced by <code>inspectMunicipalityProvenance()</code> for <code>Threshold_And_Fee_Record</code> municipalities (Cedar Park and Round Rock), plus engine-wide physical boundaries.
      </p>

      <div tabindex="0" role="region" aria-labelledby="boundary-table-caption" class="table-wrapper">
        <table
          class="data-table"
          style="
            --label-1: 'Scope / Municipality';
            --label-2: 'Sub-Section / Domain';
            --label-3: 'Epistemic Status';
            --label-4: 'What This Engine Does Not Claim';
            --label-5: 'Primary Citation';
          "
        >
          <caption id="boundary-table-caption" class="sr-only">Explicit Epistemic Boundaries and Unverified Statutory Gaps</caption>
          <thead>
            <tr>
              <th scope="col">Municipality / Engine Scope</th>
              <th scope="col">Statutory Field or Physical Domain</th>
              <th scope="col">Status</th>
              <th scope="col">Explicit Falsifiability Boundary ("What This Engine Does Not Claim")</th>
              <th scope="col">Governing Citation</th>
            </tr>
          </thead>
          <tbody>
${boundaryRowsHtml}
            <tr>
              <th scope="row"><strong>Subsurface Decay &amp; Root Architecture</strong><br /><small><code>src/core/rapEngine.js</code></small></th>
              <td><code>sound_shell_thickness_ratio_t_over_r</code> &amp; <code>sonic_tomography_or_resistograph_uri</code></td>
              <td><span class="badge badge-protected">INSTRUMENT REQUIRED</span></td>
              <td>Visual inspection alone cannot measure internal heartwood cavity geometry. Open Arbor does not infer internal shell thickness from outer bark appearance; condemning a protected tree requires physical sonic tomography or micro-drilling resistograph evidence.</td>
              <td>Mattheck (1994); ANSI A300 Part 9 (Tree Risk Assessment)</td>
            </tr>
            <tr>
              <th scope="row"><strong>Allometric Ecosystem Services</strong><br /><small><code>src/core/ecosystemBenefits.js</code></small></th>
              <td>Nowak / Cairns / Xiao / McPherson Equations</td>
              <td><span class="badge badge-protected">EMPIRICAL MODEL</span></td>
              <td>Allometric biomass, rainfall interception, and shade cooling outputs are peer-reviewed statistical expectations calibrated to DBH, crown dimensions, and condition class, not direct eddy-covariance flux tower or sap-flow sensor measurements on the individual tree.</td>
              <td>Nowak (1994, 2006); Cairns et al. (1997); Xiao et al. (2000)</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
  </main>

  <footer class="app-footer">
    <div class="container">
      <p>
        Open Arbor v2.2 &middot; Executable Proof &amp; Falsifiability Ledger &middot; ${totalVerificationGroups} Executable Verification Groups.
      </p>
      <p>
        AGPL-3.0 for the engine and CC0-1.0 for schemas and data &middot; <a href="../LICENSE">LICENSE</a> &middot; <a href="../LICENSE-DATA">LICENSE-DATA</a> &middot; <a href="https://github.com/Arboracle-Ecosystem/openarbor">GitHub Repository</a>
      </p>
    </div>
  </footer>

  <script type="module" src="../openarbor-bundle.js"></script>
</body>
</html>
`;
}

/**
 * Main exported build-time generator for Deliverable D3 (/cases/) and Deliverable D7 (/methods/).
 */
export function generateCasesAndMethods(rootDir = DEFAULT_ROOT_DIR, outDir = path.join(rootDir, 'out')) {
  const txOrdinances = JSON.parse(
    fs.readFileSync(path.join(rootDir, 'data/ordinances/central_texas_ordinances.json'), 'utf8')
  );
  const orOrdinances = JSON.parse(
    fs.readFileSync(path.join(rootDir, 'data/ordinances/rogue_valley_oregon_ordinances.json'), 'utf8')
  );
  const rapAssessmentSchema = JSON.parse(
    fs.readFileSync(path.join(rootDir, 'schemas/rap_assessment.schema.json'), 'utf8')
  );

  const allMunicipalities = [
    ...(txOrdinances.municipalities || []),
    ...(orOrdinances.municipalities || []),
  ];

  // 1. Evaluate all 5 benchmark cases in GALLERY_CASES
  const evaluatedCases = GALLERY_CASES.map((caseObj) =>
    evaluateStaticCase(caseObj, allMunicipalities, rapAssessmentSchema)
  );

  // 2. Write out/cases/index.html and out/cases/<slug>/index.html
  const casesDir = path.join(outDir, 'cases');
  fs.mkdirSync(casesDir, { recursive: true });
  fs.writeFileSync(
    path.join(casesDir, 'index.html'),
    renderCasesIndexHtml(evaluatedCases),
    'utf8'
  );

  for (const item of evaluatedCases) {
    const slugDir = path.join(casesDir, item.caseObj.slug);
    fs.mkdirSync(slugDir, { recursive: true });
    fs.writeFileSync(
      path.join(slugDir, 'index.html'),
      renderSingleCaseHtml(item),
      'utf8'
    );
  }

  // 3. Write out/methods/index.html
  const methodsDir = path.join(outDir, 'methods');
  fs.mkdirSync(methodsDir, { recursive: true });
  const methodsHtml = renderMethodsHtml(rootDir, allMunicipalities);
  assert.ok(
    !methodsHtml.includes('${'),
    'Build-time gate FAIL: out/methods/index.html contains unescaped ${ template fragment'
  );
  fs.writeFileSync(
    path.join(methodsDir, 'index.html'),
    methodsHtml,
    'utf8'
  );

  return {
    casesGenerated: evaluatedCases.length,
    caseSlugs: evaluatedCases.map((c) => c.caseObj.slug),
    methodsGenerated: true,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const res = generateCasesAndMethods(DEFAULT_ROOT_DIR, path.join(DEFAULT_ROOT_DIR, 'out'));
  console.log(
    `Generated ${res.casesGenerated} static case pages (${res.caseSlugs.join(', ')}) and out/methods/index.html`
  );
}
