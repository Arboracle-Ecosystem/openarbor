/**
 * OpenArbor Core: LEO-RAP Profile 01 Orchestration, Phased Triage & Handoff Engine
 * Implements deterministic 6-Slot Logical English Orchestration (LEO-RAP Profile 01),
 * 3-Stage Phased Stewardship Triage (Day-1 outlay undercutting one-time tree removal),
 * Mattheck t/R >= 0.30 anti-liquidation narrative verification, inline [[oracle:key=value]]
 * provenance auditing, 3-fixture negative sabotage self-audit, and Arborist Handoff Briefs.
 *
 * Zero external runtime dependencies; pure browser and Node.js ESM.
 */

import {
  decodePlusCode,
  evaluateBiomechanicsAndRhizosphere,
  computeHolobiontValuation,
  computeRegenerativePracticeEconomics,
  computeCanonicalSha256,
} from './rapEngine.js';
import { calculateCRZ, calculateSRZ } from './rootZone.js';
import {
  evaluateTreeInventory,
  permitDetermination,
  permitSummary,
  computeMitigationPlan,
  isOakSpecies,
  statusLabel,
} from './ordinanceEngine.js';

const round1 = (n) => Math.round(Number(n || 0) * 10) / 10;
const round2 = (n) => Math.round(Number(n || 0) * 100) / 100;
const round3 = (n) => Math.round(Number(n || 0) * 1000) / 1000;

function formatUsd(amount) {
  return `$${Math.round(Number(amount || 0)).toLocaleString('en-US')}`;
}

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

const REMOVAL_RECOMMENDATION_RE =
  /\b(?:recommend(?:s|ed|ing)?\s+(?:immediate\s+)?(?:hazard\s+)?(?:tree\s+)?removal|cut\s+this\s+tree\s+down|fell\s+the\s+tree|immediate\s+chainsaw\s+removal|condemn\s+for\s+removal)\b/i;

const ORACLE_ANCHOR_RE = /\[\[oracle:([a-z0-9_.]+)=([^\]]+)\]\]/g;
const PROSE_CRZ_RE = /\bCRZ\s*(?:=|of|is)\s*(\d+(?:\.\d+)?)\s*ft\b/gi;
const UNVERIFIED_TOKEN_RE = /\bUNVERIFIED(?:\[[A-Z0-9_]+\])?:/g;

function normalizeOracleKey(key) {
  if (typeof key !== 'string') return key;
  return key.startsWith('rca.') ? `rap.${key.slice(4)}` : key;
}

/**
 * 1. Split the 5-year regenerative stewardship investment into 3 practical field stages
 * so Day-1 outlay undercuts one-time chainsaw removal for mature trees while preserving
 * exact 5-year gross revenue and practitioner net margin totals.
 *
 * @param {object} assessment RAP_v2 assessment object
 * @param {object|null} economicsInput Optional pre-computed economics object
 * @returns {object} Phased stewardship triage breakdown
 */
export function computePhasedStewardshipTriage(assessment, economicsInput = null) {
  const economics = economicsInput || computeRegenerativePracticeEconomics(assessment);

  const removalBidUsd = Math.round(
    Number(economics?.legacy_removal_model?.one_time_gross_bid_usd) || 0
  );
  const removalNetUsd = Math.round(
    Number(economics?.legacy_removal_model?.net_practitioner_margin_usd) || 0
  );
  const full5YrGross = Math.round(
    Number(economics?.regenerative_stewardship_model?.five_year_gross_revenue_usd) || 0
  );
  const full5YrNet = Math.round(
    Number(economics?.regenerative_stewardship_model?.net_practitioner_margin_usd) || 0
  );
  const netMarginMultiplier = round2(
    Number(economics?.comparison?.margin_multiplier) ||
      full5YrNet / Math.max(1, removalNetUsd)
  );

  const stage1Price = Math.min(
    Math.round(full5YrGross * 0.24),
    Math.max(650, Math.round(removalBidUsd * 0.72))
  );
  const stage1Net = Math.min(full5YrNet, Math.round(stage1Price * 0.58));

  const stage2Price = Math.round((full5YrGross - stage1Price) * 0.55);
  const stage2Net = Math.round((full5YrNet - stage1Net) * 0.52);

  const stage3Price = full5YrGross - stage1Price - stage2Price;
  const stage3Net = full5YrNet - stage1Net - stage2Net;

  const stages = [
    {
      stage_number: 1,
      id: 'STAGE_1_COLLAR_AND_STABILITY_TRIAGE',
      stage_id: 'STAGE_1_COLLAR_AND_STABILITY_TRIAGE',
      window: 'Day 1 (Immediate Triage)',
      title: 'Root-Collar Excavation, SGR Relief & Structural Audit',
      scope:
        'Pneumatic root-flare unburying, stem-girdling root relief, Mattheck t/R shell verification, and municipal protection filing.',
      client_price_usd: stage1Price,
      practitioner_net_usd: stage1Net,
    },
    {
      stage_number: 2,
      id: 'STAGE_2_RADIAL_SOIL_SPONGE',
      stage_id: 'STAGE_2_RADIAL_SOIL_SPONGE',
      window: 'Months 6 to 18',
      title: '150 psi Radial AirSpade Decompaction & Biochar-Fungal Inoculation',
      scope:
        'Supersonic radial AirSpade trenching across the Critical Root Zone, pre-charged biochar, fungal compost, humate, and coarse woodchip horizon.',
      client_price_usd: stage2Price,
      practitioner_net_usd: stage2Net,
    },
    {
      stage_number: 3,
      id: 'STAGE_3_GUILD_AND_STIM_AUDIT',
      stage_id: 'STAGE_3_GUILD_AND_STIM_AUDIT',
      window: 'Years 2 to 5',
      title: 'Native Companion Guild & Year-1 / Year-5 STIM Verification',
      scope:
        'Native understory guild planting, 36-month mycorrhizal recharge, and longitudinal Year-1 and Year-5 STIM soil and canopy verification.',
      client_price_usd: stage3Price,
      practitioner_net_usd: stage3Net,
    },
  ];

  return {
    removal_bid_usd: removalBidUsd,
    removal_practitioner_net_usd: removalNetUsd,
    full_5yr_gross_usd: full5YrGross,
    full_5yr_practitioner_net_usd: full5YrNet,
    net_margin_multiplier: netMarginMultiplier,
    day_one_undercuts_removal: stage1Price < removalBidUsd,
    day_one_savings_vs_removal_usd: removalBidUsd - stage1Price,
    stages,
  };
}

/**
 * 2. Deterministic 6-Slot Logical English Orchestration (LEO-RAP Profile 01) Compiler.
 *
 * @param {object} assessment RAP_v2 assessment object
 * @param {object} evalContext Optional pre-computed context and municipal ordinance data
 * @returns {object} Compiled 6-slot LEO-RAP brief, oracle anchors, and epistemic tokens
 */
export function compileLeoRapBrief(assessment, evalContext = {}) {
  if (!assessment || typeof assessment !== 'object') {
    throw new Error('assessment must be a valid object');
  }

  const ctx = evalContext && typeof evalContext === 'object' ? evalContext : {};
  const biomechanics = ctx.biomechanics || evaluateBiomechanicsAndRhizosphere(assessment);
  const valuation = ctx.valuation || computeHolobiontValuation(assessment);
  const economics = ctx.economics || computeRegenerativePracticeEconomics(assessment);
  const triage = ctx.triage || computePhasedStewardshipTriage(assessment, economics);

  const sb = assessment.structural_baseline || {};
  const rh = assessment.rhizosphere_and_root_collar || {};
  const monitoring = assessment.outcome_monitoring_schedule || {};
  const disp = sb.municipal_permit_disposition || {};

  const dbhCm = Number(biomechanics.dbh_cm);
  const dbhInches = round2(dbhCm / 2.54);
  const tOverR = Number(biomechanics.biomechanics.sound_shell_thickness_ratio_t_over_r);
  const isSound = tOverR >= 0.30;

  const municipality = ctx.municipality || null;
  const crzMultiplier =
    Number(ctx.crz_multiplier ?? municipality?.plan_rules?.root_zone?.crz_ft_per_inch) || 1.0;
  const crzMinFt =
    Number(ctx.crz_min_ft ?? municipality?.plan_rules?.root_zone?.crz_min_ft) || 0;
  const crz =
    ctx.rootZones?.crz || ctx.crz || calculateCRZ(dbhInches, crzMultiplier, crzMinFt);

  const drfInches = (Number(rh.root_flare_diameter_cm) || dbhCm * 1.2) / 2.54;
  const srz = ctx.rootZones?.srz || ctx.srz || calculateSRZ(drfInches, dbhInches);

  const plusCode = sb.plus_code_global || '8624M38F+4X';
  const decodedCoords =
    decodePlusCode(plusCode) || municipality?.coordinates || { lat: 30.27, lng: -97.74 };
  const assessment_sha256 =
    ctx.assessment_sha256 || ctx.sha256 || computeCanonicalSha256(assessment);

  const treeTag = sb.tree_tag || 'RAP-TREE-01';
  const speciesCommon = sb.species_common || 'Mature Keystone Tree';
  const speciesSci = sb.species_scientific || 'Quercus spp.';

  let protectionTier = disp.protection_tier || 'Protected';
  let permitText = disp.permit_required
    ? 'Municipal permit required prior to regulated pruning or removal.'
    : 'No municipal permit triggered for non-destructive soil care.';
  let cashInLieuUsd = 0;

  if (ctx.evaluatedRow) {
    protectionTier = statusLabel(ctx.evaluatedRow);
  }
  if (ctx.permitText) {
    permitText = ctx.permitText;
  }

  if (ctx.mitigationIfRemoved?.cash_in_lieu_usd != null) {
    cashInLieuUsd = Number(ctx.mitigationIfRemoved.cash_in_lieu_usd);
  } else if (ctx.cash_in_lieu_usd != null) {
    cashInLieuUsd = Number(ctx.cash_in_lieu_usd);
  } else if (municipality) {
    const stemsInches =
      sb.is_multistem && Array.isArray(sb.stem_diameters_cm) && sb.stem_diameters_cm.length > 0
        ? sb.stem_diameters_cm.map((cm) => Math.round((Number(cm) / 2.54) * 10) / 10)
        : [dbhInches];
    const evalRows = evaluateTreeInventory(
      [
        {
          tag: treeTag,
          species_common: speciesCommon,
          species_scientific: speciesSci,
          stems_inches: stemsInches,
          dbh_inches: dbhInches,
          lat: decodedCoords.lat,
          lng: decodedCoords.lng,
          condition_score: 8,
          removal: false,
        },
      ],
      municipality
    );
    if (!ctx.evaluatedRow && evalRows[0]) {
      protectionTier = statusLabel(evalRows[0]);
    }
    if (!ctx.permitText) {
      permitText = permitSummary(permitDetermination(evalRows, municipality));
    }
    const removedRows = evaluateTreeInventory(
      [
        {
          tag: treeTag,
          species_common: speciesCommon,
          species_scientific: speciesSci,
          stems_inches: stemsInches,
          dbh_inches: dbhInches,
          lat: decodedCoords.lat,
          lng: decodedCoords.lng,
          condition_score: 8,
          removal: true,
        },
      ],
      municipality
    );
    const mitPlan = computeMitigationPlan(removedRows, municipality);
    cashInLieuUsd = Number(mitPlan?.cash_in_lieu_usd) || 0;
  }

  const rawGaps = Array.isArray(ctx.unverified_gaps)
    ? ctx.unverified_gaps
    : Array.isArray(ctx.provenance?.unverified_gaps)
    ? ctx.provenance.unverified_gaps
    : [];

  const unverified_tokens = [];
  for (const gap of rawGaps) {
    if (gap && gap.field) {
      const reason = `${gap.field} is not encoded in this municipal Threshold_And_Fee_Record`;
      unverified_tokens.push({
        category: 'STATUTORY_RULE',
        reason,
        token: `UNVERIFIED[STATUTORY_RULE]: ${reason}`,
      });
    }
  }

  if (!sb.sonic_tomography_or_resistograph_uri) {
    const reason =
      'Internal shell ratio entered without attached sonic tomogram or resistograph URI';
    unverified_tokens.push({
      category: 'INSTRUMENT_TOMOGRAPHY',
      reason,
      token: `UNVERIFIED[INSTRUMENT_TOMOGRAPHY]: ${reason}`,
    });
  }

  const workstream_id = `OA-RAP-v2:${treeTag}`;
  const status_line = `STATUS: ${workstream_id} | drafts complete: 1/1 | unverified citations: ${unverified_tokens.length}`;

  const holobiontUsd = Number(valuation.holobiont_200yr_biological_equity_usd) || 0;
  const ctlaUsd = Number(valuation.ctla_10th_ed_depreciated_usd) || 0;
  const stage1Usd = Number(triage.stages[0].client_price_usd) || 0;
  const crzRadiusFt = round2(crz.radius_feet);
  const srzRadiusFt = round2(srz.radius_feet);

  const oracle_anchors = {
    'rap.structural.dbh_in': round2(dbhInches),
    'rap.biomechanics.t_over_r': round3(tOverR),
    'root_zone.crz_ft': crzRadiusFt,
    'root_zone.srz_ft': srzRadiusFt,
    'rap.valuation.holobiont_200yr_usd': Math.round(holobiontUsd),
    'rap.valuation.ctla_depreciated_usd': Math.round(ctlaUsd),
    'ordinance.cash_in_lieu_usd': Math.round(cashInLieuUsd),
    'rap.triage.stage1_usd': Math.round(stage1Usd),
  };

  const jurisdictionId = municipality?.id || disp.jurisdiction_id || 'local-jurisdiction';
  const jurisdictionLabel = municipality
    ? `${municipality.name}, ${municipality.state} (${municipality.id})`
    : disp.jurisdiction_id || 'Local Municipal Code';
  const ordinanceCitation =
    municipality?.ordinance_numbers || disp.ordinance_citation || 'ANSI A300 Part 5 Baseline';

  const oakWiltActive =
    Boolean(disp.seasonal_oak_wilt_restriction_active) ||
    (isOakSpecies(speciesCommon, speciesSci) && String(jurisdictionId).startsWith('tx-'));

  const oakWiltNote = oakWiltActive
    ? 'Seasonal Ceratocystis fagacearum (Oak Wilt) vector precautions apply: avoid non-emergency oak pruning February through June and seal all fresh wounds within 10 minutes.'
    : 'No active seasonal Oak Wilt pruning vector restriction is flagged for this specimen and jurisdiction.';

  const headline_verdict = isSound
    ? `Preserve ${speciesCommon} (${treeTag}): the outer living wood cylinder exceeds the 0.30 Claus Mattheck stability threshold and qualifies for phased rhizosphere stewardship rather than removal.`
    : `Hold for Level 3 structural mitigation on ${speciesCommon} (${treeTag}): the measured sound wood shell ratio (${round3(tOverR)}) falls below the 0.30 Claus Mattheck stability threshold and requires instrument tomography, crown load reduction review, or last-resort hazard intervention.`;

  const structural_truth = isSound
    ? `The living wood cylinder retains a ${biomechanics.biomechanics.sound_shell_cm} cm outer shell across a ${biomechanics.biomechanics.trunk_radius_cm} cm trunk radius (t/R = ${round3(tOverR)}, above the 0.30 Claus Mattheck hollow-shell buckling threshold), anchored by a ${srzRadiusFt} ft (${round2(srz.radius_meters)} m) Structural Root Zone windthrow root plate.`
    : `The outer wood shell measures ${biomechanics.biomechanics.sound_shell_cm} cm across a ${biomechanics.biomechanics.trunk_radius_cm} cm trunk radius (t/R = ${round3(tOverR)}, below the 0.30 Claus Mattheck hollow-shell buckling threshold), with a ${srzRadiusFt} ft (${round2(srz.radius_meters)} m) Structural Root Zone windthrow root plate requiring load reduction and target isolation.`;

  const statutory_and_seasonal_truth = `Under ${ordinanceCitation} (${jurisdictionLabel}), this ${round2(dbhInches)} in DBH specimen is classified as ${protectionTier} with a statutory CRZ = ${crzRadiusFt} ft (${round2(crz.radius_meters)} m). ${permitText} ${oakWiltNote}`;

  const stewardship_vs_liquidation = `Preserving this living canopy asset retains ${formatUsd(holobiontUsd)} in 200-year holobiont equity (${formatUsd(ctlaUsd)} classical CTLA depreciated timber model and ${formatUsd(cashInLieuUsd)} municipal cash-in-lieu mitigation exposure if destroyed). Day-1 Stage 1 preservation triage starts at ${formatUsd(stage1Usd)} compared against an illustrative one-time removal estimate of ${formatUsd(triage.removal_bid_usd)}, while the 5-year stewardship program delivers a ${triage.net_margin_multiplier}x net practitioner margin multiplier over liquidation.`;

  const falsifier =
    monitoring.stim_kill_criterion ||
    'If Year-1 terminal twig extension remains below 5 cm or upper canopy dieback exceeds 15%, pause amendment staging and re-evaluate for deep vadose restriction or secondary root pathogen activity.';

  const answer_first = {
    headline_verdict,
    structural_truth,
    statutory_and_seasonal_truth,
    stewardship_vs_liquidation,
    falsifier,
  };

  const point_of_use_resolution = {
    specimen: `${speciesCommon} (${speciesSci}), tag ${treeTag}`,
    coordinates: {
      plus_code_global: plusCode,
      lat: decodedCoords.lat,
      lng: decodedCoords.lng,
    },
    jurisdiction_label: jurisdictionLabel,
    ordinance_citation: ordinanceCitation,
    definitions: {
      DBH: 'Diameter at Breast Height measured at 4.5 ft (1.37 m) above grade',
      t_over_r:
        'Sound wood shell thickness (t) divided by trunk radius (R); Claus Mattheck stability threshold is 0.30',
      CRZ: 'Critical Root Zone radius under ANSI A300 Part 5 and municipal code',
      SRZ: 'Structural Root Zone radius for mechanical windthrow root-plate stability under AS 4970',
      CTLA: 'Council of Tree and Landscape Appraisers 10th Edition Trunk Formula Technique',
      STIM: 'Soil and Tree Integrated Monitoring longitudinal Year-1 and Year-5 verification protocol',
    },
  };

  const unverifiedBlockLines =
    unverified_tokens.length === 0
      ? ['- Zero unverified statutory or instrument gaps recorded in this brief.']
      : unverified_tokens.map((u) => `- ${u.token}`);

  const stageLines = triage.stages.map(
    (st) =>
      `- **Stage ${st.stage_number} (${st.window}): ${st.title}** | Client investment: **${formatUsd(st.client_price_usd)}** | Practitioner net: **${formatUsd(st.practitioner_net_usd)}**`
  );

  const brief_markdown = [
    status_line,
    '',
    `# LEO-RAP Profile 01 Evidentiary Stewardship Brief (${treeTag})`,
    '',
    `## Slot 1: Epistemic Status & Workstream Header`,
    `- **Workstream ID:** \`${workstream_id}\``,
    `- **Schema & Profile:** \`${assessment.schema_version || 'RAP_v2'}\` / \`LEO-RAP-Profile-01\``,
    `- **Declared Epistemic Gaps:** \`${unverified_tokens.length}\``,
    '',
    `## Slot 2: Sovereign Airlock & Fiduciary Boundary`,
    `- **Local Execution Airlock:** Computed deterministically in zero-dependency ECMAScript Modules with zero cloud runtime telemetry.`,
    `- **Fiduciary Separation:** Diagnostic biomechanics are decoupled from timber removal bidding. Municipal permit applications and site work require direct owner and credentialed arborist sign-off.`,
    '',
    `## Slot 3: Point-of-Use Resolution`,
    `- **Subject Specimen:** *${speciesSci}* (${speciesCommon}), tag \`${treeTag}\``,
    `- **Geospatial Anchor:** Plus Code \`${plusCode}\` (Lat \`${decodedCoords.lat}\`, Lng \`${decodedCoords.lng}\`)`,
    `- **Governing Municipal Code:** ${ordinanceCitation} (${jurisdictionLabel})`,
    `- **Point-of-Use Terms:** \`DBH\` = Diameter at Breast Height (4.5 ft); \`t/R\` = outer sound wood shell thickness divided by trunk radius (Mattheck 0.30 threshold); \`CRZ\` = Critical Root Zone; \`SRZ\` = Structural Root Zone windthrow plate; \`STIM\` = Soil and Tree Integrated Monitoring.`,
    '',
    `## Slot 4: Answer-First Verdict, Phased Triage & Physical Falsifier`,
    `- **Headline Verdict:** ${answer_first.headline_verdict}`,
    `- **Structural Truth:** ${answer_first.structural_truth}`,
    `- **Statutory & Seasonal Truth:** ${answer_first.statutory_and_seasonal_truth}`,
    `- **Stewardship vs. Liquidation:** ${answer_first.stewardship_vs_liquidation}`,
    `- **Physical Falsifier (STIM Kill Criterion):** ${answer_first.falsifier}`,
    '',
    `### 3-Stage Phased Stewardship Triage (Total 5-Year Gross: ${formatUsd(triage.full_5yr_gross_usd)} | Practitioner Net: ${formatUsd(triage.full_5yr_practitioner_net_usd)})`,
    ...stageLines,
    '',
    `## Slot 5: Three-Tier Evidence Boundary & Oracle Provenance Anchors`,
    `### Tier 1: Deterministic Engine & Measured Biometrics`,
    `- Measured DBH (in): [[oracle:rap.structural.dbh_in=${oracle_anchors['rap.structural.dbh_in']}]]`,
    `- Mattheck Sound Shell Ratio (t/R): [[oracle:rap.biomechanics.t_over_r=${oracle_anchors['rap.biomechanics.t_over_r']}]]`,
    `- Critical Root Zone Radius (ft): [[oracle:root_zone.crz_ft=${oracle_anchors['root_zone.crz_ft']}]]`,
    `- Structural Root Zone Radius (ft): [[oracle:root_zone.srz_ft=${oracle_anchors['root_zone.srz_ft']}]]`,
    `- 200-Year Holobiont Living Equity (USD): [[oracle:rap.valuation.holobiont_200yr_usd=${oracle_anchors['rap.valuation.holobiont_200yr_usd']}]]`,
    `- CTLA 10th Ed. Depreciated Value (USD): [[oracle:rap.valuation.ctla_depreciated_usd=${oracle_anchors['rap.valuation.ctla_depreciated_usd']}]]`,
    `- Municipal Cash-in-Lieu Exposure (USD): [[oracle:ordinance.cash_in_lieu_usd=${oracle_anchors['ordinance.cash_in_lieu_usd']}]]`,
    `- Day-1 Stage 1 Triage Price (USD): [[oracle:rap.triage.stage1_usd=${oracle_anchors['rap.triage.stage1_usd']}]]`,
    '',
    `### Tier 2: Literature & Statutory Calibration`,
    `- Claus Mattheck hollow-cylinder buckling criterion (t/R >= 0.30); Australian AS 4970-2009 SRZ; ANSI A300 Part 5 root-zone management; Nowak (1994, 2006) allometrics; ${ordinanceCitation}.`,
    '',
    `### Tier 3: Explicit Unverified Epistemic Boundaries`,
    ...unverifiedBlockLines,
    '',
    `## Slot 6: Cryptographic SHA-256 Receipt`,
    `- **Canonical Assessment SHA-256:** \`${assessment_sha256}\``,
  ].join('\n');

  return {
    workstream_id,
    status_line,
    answer_first,
    point_of_use_resolution,
    oracle_anchors,
    unverified_tokens,
    triage,
    assessment_sha256,
    brief_markdown,
  };
}

/**
 * 3. Verify a Markdown narrative against deterministic LEO-RAP oracle anchors,
 * epistemic STATUS header counts, and the Mattheck t/R >= 0.30 anti-liquidation invariant.
 *
 * @param {string} markdownText Narrative Markdown text to audit
 * @param {object} assessment Ground-truth RAP_v2 assessment object
 * @param {object} evalContext Optional municipal and evaluation context
 * @returns {object} Verification report
 */
export function verifyLeoRapNarrative(markdownText, assessment, evalContext = {}) {
  const compiled = compileLeoRapBrief(assessment, evalContext);
  const t_over_r = compiled.oracle_anchors['rap.biomechanics.t_over_r'];
  const errors = [];

  if (typeof markdownText !== 'string' || markdownText.trim().length === 0) {
    errors.push(
      'EPISTEMIC_STATUS_DRIFT [MAST_FM_2_2]: Narrative markdownText must be a non-empty string.'
    );
    return {
      valid: false,
      errors,
      checked_anchors: 0,
      unverified_count: 0,
      t_over_r,
      expected_anchors: compiled.oracle_anchors,
    };
  }

  // 1. STATUS header check within first 15 lines + UNVERIFIED token reconciliation + placeholder check
  const first15Lines = markdownText.split(/\r?\n/).slice(0, 15);
  const statusLine = first15Lines.find((line) => line.trim().startsWith('STATUS:'));
  const unverifiedMatches = markdownText.match(UNVERIFIED_TOKEN_RE) || [];
  const unverified_count = unverifiedMatches.length;

  if (!statusLine) {
    errors.push(
      'EPISTEMIC_STATUS_DRIFT [MAST_FM_2_2]: Missing required STATUS: header within the first 15 lines.'
    );
  } else {
    const countMatch = statusLine.match(/unverified citations:\s*(\d+)/i);
    if (!countMatch) {
      errors.push(
        'EPISTEMIC_STATUS_DRIFT [MAST_FM_2_2]: STATUS: header is missing "unverified citations: <N>" declaration.'
      );
    } else {
      const declaredCount = Number(countMatch[1]);
      if (declaredCount !== unverified_count) {
        errors.push(
          `EPISTEMIC_STATUS_DRIFT [MAST_FM_2_2]: STATUS header declares ${declaredCount} unverified citations, but body contains ${unverified_count} UNVERIFIED token(s).`
        );
      }
    }
  }

  if (/\[TODO\]|\bTBD\b/.test(markdownText)) {
    errors.push(
      'EPISTEMIC_STATUS_DRIFT [MAST_FM_2_2]: Narrative contains unresolved [TODO] or TBD placeholder.'
    );
  }

  // 2. Mattheck Anti-Liquidation Invariant (RAP_MATTHECK_T_OVER_R)
  if (t_over_r >= 0.30 && REMOVAL_RECOMMENDATION_RE.test(markdownText)) {
    errors.push(
      'DOMAIN_INVARIANT_VIOLATION [RAP_MATTHECK_T_OVER_R]: Prose disposition recommends removal while deterministic oracle reports t/R >= 0.30 (structurally sound hollow shell).'
    );
  }

  // 3. Inline Oracle Provenance Anchors (MAST_FM_2_6)
  let checked_anchors = 0;
  ORACLE_ANCHOR_RE.lastIndex = 0;
  let anchorMatch;
  while ((anchorMatch = ORACLE_ANCHOR_RE.exec(markdownText)) !== null) {
    checked_anchors += 1;
    const rawKey = anchorMatch[1];
    const key = normalizeOracleKey(rawKey);
    const rawVal = anchorMatch[2];

    if (!hasOwn(compiled.oracle_anchors, key)) {
      errors.push(
        `ORACLE_PROVENANCE_MISMATCH [MAST_FM_2_6]: Prose anchor [[oracle:${rawKey}=${rawVal}]] references an unknown oracle key.`
      );
      continue;
    }

    const expectedVal = compiled.oracle_anchors[key];
    if (typeof expectedVal === 'number') {
      const cleanedNum = Number(String(rawVal).trim().replace(/[$,]/g, ''));
      if (!Number.isFinite(cleanedNum) || Math.abs(cleanedNum - expectedVal) > 0.02) {
        errors.push(
          `ORACLE_PROVENANCE_MISMATCH [MAST_FM_2_6]: Prose anchor [[oracle:${rawKey}=${rawVal}]] drifts from deterministic oracle value (${expectedVal}).`
        );
      }
    } else if (String(rawVal).trim() !== String(expectedVal)) {
      errors.push(
        `ORACLE_PROVENANCE_MISMATCH [MAST_FM_2_6]: Prose anchor [[oracle:${rawKey}=${rawVal}]] drifts from deterministic oracle value (${expectedVal}).`
      );
    }
  }

  // Plain-prose CRZ radius check (tolerance 0.5 ft)
  const expectedCrzFt = compiled.oracle_anchors['root_zone.crz_ft'];
  PROSE_CRZ_RE.lastIndex = 0;
  let crzMatch;
  while ((crzMatch = PROSE_CRZ_RE.exec(markdownText)) !== null) {
    const claimedCrzFt = Number(crzMatch[1]);
    if (!Number.isFinite(claimedCrzFt) || Math.abs(claimedCrzFt - expectedCrzFt) > 0.5) {
      errors.push(
        `ORACLE_PROVENANCE_MISMATCH [MAST_FM_2_6]: Plain-prose CRZ claim (${crzMatch[0]}) drifts by more than 0.5 ft from deterministic oracle value (${expectedCrzFt} ft).`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    checked_anchors,
    unverified_count,
    t_over_r,
    expected_anchors: compiled.oracle_anchors,
  };
}

/**
 * 4. Execute a 3-fixture negative sabotage self-audit on LEO-RAP narrative verification.
 * Verifies baseline compilation passes and that all 3 sabotage vectors are caught cleanly.
 *
 * @param {object} assessment RAP_v2 assessment object
 * @param {object} evalContext Optional municipal and evaluation context
 * @returns {object} Self-audit gate report
 */
export function runLeoRapSelfAudit(assessment, evalContext = {}) {
  const baseline = compileLeoRapBrief(assessment, evalContext);
  const baselineCheck = verifyLeoRapNarrative(baseline.brief_markdown, assessment, evalContext);

  if (!baselineCheck.valid) {
    return {
      self_audit_passed: false,
      error_code: 'GATE_DEFECT_FM_3_3',
      fixtures_tested: 0,
      baseline_valid: false,
      baseline_errors: baselineCheck.errors,
      caught_failures: {},
    };
  }

  // Fixture 1: sabotage_unjustified_removal (ensure t/R >= 0.34 clone when input has t/R < 0.30)
  const inputTOverR = Number(
    assessment?.structural_baseline?.sound_shell_thickness_ratio_t_over_r ?? 1.0
  );
  const soundAssessment =
    inputTOverR >= 0.30
      ? assessment
      : {
          ...assessment,
          structural_baseline: {
            ...(assessment.structural_baseline || {}),
            sound_shell_thickness_ratio_t_over_r: 0.34,
          },
        };
  const soundEvalContext =
    inputTOverR >= 0.30
      ? evalContext
      : {
          ...evalContext,
          biomechanics: null,
          valuation: null,
          economics: null,
          triage: null,
        };
  const soundBaseline =
    inputTOverR >= 0.30 ? baseline : compileLeoRapBrief(soundAssessment, soundEvalContext);

  const sabotage1Text = `${soundBaseline.brief_markdown}\n\nExecutive Conclusion: Due to internal cavity, we recommend immediate hazard tree removal.`;
  const sabotage1Res = verifyLeoRapNarrative(sabotage1Text, soundAssessment, soundEvalContext);

  // Fixture 2: sabotage_oracle_drift
  const sabotage2Text = baseline.brief_markdown.replace(
    /\[\[oracle:root_zone\.crz_ft=[^\]]+\]\]/,
    '[[oracle:root_zone.crz_ft=999.9]]'
  );
  const sabotage2Res = verifyLeoRapNarrative(sabotage2Text, assessment, evalContext);

  // Fixture 3: sabotage_epistemic_count
  const sabotage3Text = `${baseline.brief_markdown}\nUNVERIFIED[STATUTORY_RULE]: Uncounted statutory claim\n`;
  const sabotage3Res = verifyLeoRapNarrative(sabotage3Text, assessment, evalContext);

  const f1Caught =
    !sabotage1Res.valid &&
    sabotage1Res.errors.some((e) => e.includes('RAP_MATTHECK_T_OVER_R'));
  const f2Caught =
    !sabotage2Res.valid &&
    sabotage2Res.errors.some((e) => e.includes('MAST_FM_2_6'));
  const f3Caught =
    !sabotage3Res.valid &&
    sabotage3Res.errors.some((e) => e.includes('EPISTEMIC_STATUS_DRIFT'));

  const caught_failures = {
    sabotage_unjustified_removal: sabotage1Res.errors,
    sabotage_oracle_drift: sabotage2Res.errors,
    sabotage_epistemic_count: sabotage3Res.errors,
  };

  if (!f1Caught || !f2Caught || !f3Caught) {
    return {
      self_audit_passed: false,
      error_code: 'GATE_DEFECT_FM_3_3',
      fixtures_tested: 3,
      baseline_valid: true,
      caught_failures,
    };
  }

  return {
    self_audit_passed: true,
    fixtures_tested: 3,
    baseline_valid: true,
    caught_failures,
  };
}

/**
 * 5. Compose plain-language, deferential human handoff messages connecting a land steward
 * and a consulting or field arborist with pre-computed municipal and root-zone facts.
 * Homeowner outbound messages deliberately omit unmeasured t/R ratios and contractor
 * bid price anchors, requesting on-site structural and root-collar inspection instead.
 *
 * @param {object} params Handoff parameters
 * @returns {{subject: string, steward_to_arborist_message: string, arborist_to_client_message: string, arborist_truck_summary: string}}
 */
export function composeArboristHandoffBrief(params = {}) {
  const {
    speciesCommon = 'Mature Heritage Tree',
    speciesScientific = 'Quercus virginiana',
    dbhInches = 24,
    cityLabel = 'Local Municipality',
    protectionStatus = 'Protected',
    tOverR = 0.34,
    crzFeet = 24,
    holobiontUsd = 185000,
    ctlaUsd = 18500,
    cashInLieuUsd = 4800,
    stage1Usd = 1850,
    removalBidUsd = 2732,
    marginMultiplier = 2.4,
    oakWiltWarning = '',
    shareUrl = 'https://openarbor.org/demo/',
    sonicTomographyVerified = false,
  } = params || {};

  const dbhStr = round2(dbhInches);
  const circumferenceStr = round1(Number(dbhInches) * Math.PI);
  const crzStr = round2(crzFeet);
  const tOverRStr = round3(tOverR);
  const isSound = Number(tOverR) >= 0.30;
  const shellSummary = isSound
    ? `t/R = ${tOverRStr} (above the 0.30 Mattheck stability threshold)`
    : `t/R = ${tOverRStr} (below 0.30; needs Level 3 tomography review)`;
  const provenanceNote = sonicTomographyVerified
    ? '(instrument-verified)'
    : '(hypothesis; verify on site with resistograph or sonic tomography)';
  const oakSentence =
    oakWiltWarning && String(oakWiltWarning).trim().length > 0
      ? ` Seasonal note: ${String(oakWiltWarning).trim()}`
      : '';
  const mitigationClause =
    Number(cashInLieuUsd) > 0
      ? `${formatUsd(cashInLieuUsd)} in city cash-in-lieu mitigation exposure if removed`
      : 'municipal caliper replacement review if removed';

  const subject = `Tree Preservation & Root-Zone Triage Brief: ${dbhStr} in ${speciesCommon} (${cityLabel})`;

  const steward_to_arborist_message = [
    `Hi, I would appreciate your professional assessment of our ${dbhStr}-inch DBH (${circumferenceStr}-inch circumference at 4.5 ft) ${speciesCommon} (${speciesScientific}) in ${cityLabel}.`,
    `I pulled the municipal tree ordinance screen and ANSI A300 root-zone numbers so you have the site baseline before coming out: this specimen classifies as ${protectionStatus} with a ${crzStr} ft Critical Root Zone radius and ${mitigationClause}.${oakSentence}`,
    `Before considering removal, could we schedule an on-site inspection to evaluate root-collar burial, stem-girdling roots, and internal structural soundness (with resistograph or sonic tomography if decay is suspected), and quote a phased preservation plan?`,
    `Open Arbor municipal determination and root-zone worksheet: ${shareUrl}`,
  ].join('\n\n');

  const arborist_to_client_message = [
    `Thank you for sharing the site baseline for your ${dbhStr}-inch ${speciesCommon} (${speciesScientific}).`,
    sonicTomographyVerified
      ? isSound
        ? `Because the instrument-measured sound wood shell (${shellSummary}) satisfies Claus Mattheck's hollow-cylinder stability threshold, this tree is a strong candidate for preservation rather than removal.`
        : `Because the instrument-measured sound wood shell (${shellSummary}) sits below the 0.30 stability benchmark, our first step is crown load review and target mitigation before committing to major soil work.`
      : `Our first priority on site is verifying internal structural soundness (resistograph or sonic tomography around any suspected hollow) alongside pneumatic root-collar inspection before confirming Stage 2 soil work.`,
    `According to Open Arbor's 200-year ecosystem model (${formatUsd(holobiontUsd)}) and CTLA trunk-formula model (${formatUsd(ctlaUsd)}), retaining a healthy canopy specimen avoids ${Number(cashInLieuUsd) > 0 ? `${formatUsd(cashInLieuUsd)} in ${cityLabel} removal mitigation fees` : `municipal replacement obligations`}. After field verification, we can phase Stage 1 root-collar relief (${formatUsd(stage1Usd)} illustrative estimate) ahead of radial AirSpade soil care and Year-1 / Year-5 monitoring.${oakSentence}`,
    `Interactive specification and protection map: ${shareUrl}`,
  ].join('\n\n');

  const truckLines = [
    `OPEN ARBOR FIELD HANDOFF (${cityLabel} | RAP-Spec v2.0)`,
    `Specimen: ${speciesCommon} (${speciesScientific}) | DBH: ${dbhStr} in (${circumferenceStr} in circ) | Status: ${protectionStatus}`,
    `Biomechanics: ${shellSummary} ${provenanceNote} | Statutory CRZ: ${crzStr} ft radius`,
    `City Mitigation if Removed: ${formatUsd(cashInLieuUsd)} | Models: 200-Yr Equity ${formatUsd(holobiontUsd)} vs CTLA ${formatUsd(ctlaUsd)}`,
    `Illustrative Triage Model: Stage 1 ${formatUsd(stage1Usd)} vs ${formatUsd(removalBidUsd)} removal benchmark | 5-Yr Net Margin Multiplier: ${round2(marginMultiplier)}x`,
  ];
  if (oakWiltWarning && String(oakWiltWarning).trim().length > 0) {
    truckLines.push(`Oak Wilt Protocol: ${String(oakWiltWarning).trim()}`);
  }
  truckLines.push(`Field Permalink: ${shareUrl}`);

  const arborist_truck_summary = truckLines.join('\n');

  return {
    subject,
    steward_to_arborist_message,
    arborist_to_client_message,
    arborist_truck_summary,
  };
}

export const compileLeoRcaBrief = compileLeoRapBrief;
export const verifyLeoRcaNarrative = verifyLeoRapNarrative;
export const runLeoRcaSelfAudit = runLeoRapSelfAudit;
