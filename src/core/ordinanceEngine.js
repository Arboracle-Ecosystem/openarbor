/**
 * OpenArbor Core — Deterministic Municipal Ordinance & Mitigation Engine
 * Refactored from Arboracle Preservation Plan engine into pure, zero-dependency open standards.
 * All municipal rules come from open JSON ordinance records; zero hardcoded per-city branches.
 */

import { calculateCRZ, calculateTPZ, calculateMultiStemDBH, unionRootZoneArea } from './rootZone.js';

const round2 = (n) => Math.round(Number(n || 0) * 100) / 100;
const round1 = (n) => Math.round(Number(n || 0) * 10) / 10;

export const DEFAULT_SOIL_REMEDIATION_RATES_USD = {
  mobilization: 350,
  pneumatic_air_tilling_per_sqft: 0.60,
  thermal_compost_per_sqft: 0.35,
  hardwood_mulch_per_sqft: 0.15,
};

const parseObj = (raw) => {
  if (!raw) return null;
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw;
  try {
    const v = JSON.parse(raw);
    return v && typeof v === 'object' && !Array.isArray(v) ? v : null;
  } catch {
    return null;
  }
};

const parseList = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [v];
  } catch {
    return [String(raw)];
  }
};

const SOFTWOOD_PATTERN = /pinus|juniperus|taxodium|cupressus|\bpine\b|juniper|cypress|(?<!\w)cedar(?! elm)/i;
const OAK_PATTERN = /quercus|\boak\b/i;
const WHOLE_REMOVAL_PATTERN = /^(tree\s+|whole[-\s]tree\s+)?remov(al|e tree|e)\s*(:|$)/i;

export function isHardwoodSpecies(speciesCommon = '', speciesScientific = '', explicitClassification = null) {
  if (explicitClassification === 'hardwood') return true;
  if (explicitClassification === 'softwood') return false;
  return !SOFTWOOD_PATTERN.test(`${speciesCommon} ${speciesScientific}`);
}

export function isOakSpecies(speciesCommon = '', speciesScientific = '') {
  return OAK_PATTERN.test(`${speciesCommon} ${speciesScientific}`);
}

export function isSpeciesInList(tree, speciesList = []) {
  const names = [tree.species_scientific, tree.species_common, tree.species, tree.scientific]
    .filter(Boolean)
    .map((n) => n.toLowerCase());
  return parseList(speciesList).some((entry) => {
    const parts = String(entry)
      .toLowerCase()
      .split(/[()/]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 2);
    return parts.some((p) => names.some((n) => n.includes(p) || p.includes(n)));
  });
}

export function qualifiesAsHeritage(tree, dbhInches, ordinance) {
  if (!ordinance) return false;
  const names = [tree.species_scientific, tree.species_common, tree.species, tree.scientific]
    .filter(Boolean)
    .map((n) => n.toLowerCase());
  const speciesMap = parseObj(ordinance.heritage_species_thresholds) || {};

  for (const [speciesKey, minDbh] of Object.entries(speciesMap)) {
    const parts = speciesKey
      .toLowerCase()
      .split(/[()/]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 2);
    if (parts.some((p) => names.some((n) => n.includes(p) || p.includes(n)))) {
      return dbhInches >= Number(minDbh);
    }
  }

  const generalThreshold = Number(ordinance.heritage_threshold_inches);
  return generalThreshold > 0 && dbhInches >= generalThreshold;
}

/**
 * Evaluate a list of field tree assessments against an OpenArbor Municipal Ordinance record.
 */
export function evaluateTreeInventory(trees = [], ordinance = null) {
  const rules = parseObj(ordinance?.plan_rules);
  const multiStemRule = rules?.survey?.multi_trunk === 'largest_plus_half' ? 'largest_plus_half' : 'quadratic';
  const protectedMinDbh = Number(ordinance?.dbh_threshold_inches) > 0 ? Number(ordinance.dbh_threshold_inches) : null;
  const exceptedSpecies = parseList(ordinance?.excepted_species);
  const rzRules = rules?.root_zone;
  const rmRules = rules?.removal;
  const prRules = rules?.pruning;

  return trees.map((t, idx) => {
    const stems = Array.isArray(t.stems_inches)
      ? t.stems_inches
      : String(t.dbh_measurements || t.dbh_inches || '')
          .split(',')
          .map(Number)
          .filter((n) => n > 0);

    const dbh = t.dbh_inches ? Number(t.dbh_inches) : calculateMultiStemDBH(stems, multiStemRule);
    const verified = t.dbh_verified !== false;
    const excepted = exceptedSpecies.length > 0 && isSpeciesInList(t, exceptedSpecies);
    const hardwood = isHardwoodSpecies(t.species_common || t.species, t.species_scientific || t.scientific, t.wood_type);

    const isProtected = !excepted && protectedMinDbh != null && verified && dbh >= protectedMinDbh;
    const isHeritage = Boolean(t.council_heritage && !excepted) || (isProtected && qualifiesAsHeritage(t, dbh, ordinance));

    const crzMultiplier = Number(rzRules?.crz_ft_per_inch) || 1.0;
    const crzMinFt = Number(rzRules?.crz_min_ft) || 0;
    const crz = calculateCRZ(dbh, crzMultiplier, crzMinFt);
    const tpz = calculateTPZ(dbh, 'inches', 'US_1_1');

    const driplineFt = Number(t.dripline_ft) || null;
    const fenceFt = Math.max(crz.radius_feet, driplineFt || 0);

    const actionsList = parseList(t.recommended_actions || t.actions);
    let removal = Boolean(t.removal) || actionsList.some((a) => WHOLE_REMOVAL_PATTERN.test(String(a).trim()));
    const flags = [];

    if (t.council_heritage && !excepted) {
      flags.push(`Council-designated heritage (${rules?.status?.heritage_registry_citation || 'heritage registry'})`);
    }

    if (rzRules) {
      if (Number(t.crz_disturbed_pct) > Number(rzRules.removal_if_disturbed_pct)) {
        removal = true;
        flags.push(
          `${t.crz_disturbed_pct}% of CRZ disturbed (> ${rzRules.removal_if_disturbed_pct}%): counted as removed (${rzRules.citation})`
        );
      }
      if (t.cutfill_within_half_crz && Number(t.cutfill_depth_in) > Number(rzRules.cutfill_max_in)) {
        flags.push(
          `Cut/fill ${t.cutfill_depth_in} in inside half CRZ (> ${rzRules.cutfill_max_in} in) (${rzRules.citation})`
        );
      }
      if (Number(t.impervious_pct) > Number(rzRules.impervious_max_pct)) {
        flags.push(
          `Impervious cover ${t.impervious_pct}% of CRZ (> ${rzRules.impervious_max_pct}%): requires municipal variance (${rzRules.citation})`
        );
      }
      if (Number(t.crown_removal_pct) > Number(rzRules.crown_removal_max_pct)) {
        flags.push(
          `Crown removal ${t.crown_removal_pct}% (> ${rzRules.crown_removal_max_pct}%) (${rzRules.citation})`
        );
      }
    }

    if (prRules && t.pruning_date && isOakSpecies(t.species_common || t.species, t.species_scientific || t.scientific)) {
      const month = Number(String(t.pruning_date).slice(5, 7));
      if (Array.isArray(prRules.oak_months) && !prRules.oak_months.includes(month)) {
        flags.push(`Oak pruning scheduled ${t.pruning_date}, outside permitted seasonal window (${prRules.citation})`);
      }
    }

    let noMitigationReason = null;
    if (rmRules && t.no_mitigation_path && t.no_mitigation_path !== 'none') {
      const label = rmRules.no_mitigation?.[t.no_mitigation_path] || t.no_mitigation_path;
      noMitigationReason = `${label} (${rmRules.no_mitigation_citation || 'ordinance exception'})`;
    } else if (rmRules && t.transplant) {
      noMitigationReason = `Transplanted per ANSI A300; 2-year survival required (${rmRules.transplant_citation || 'ordinance'})`;
    }

    return {
      id: t.id || `tree-${idx + 1}`,
      tag: t.tag || `T-${idx + 1}`,
      species: t.species_common || t.species || t.species_scientific,
      scientific: t.species_scientific || t.scientific || '',
      lat: t.lat ?? null,
      lng: t.lng ?? null,
      dbh,
      dbh_verified: verified,
      hardwood,
      protected: isProtected,
      heritage: isHeritage,
      excepted,
      removal,
      no_mitigation: noMitigationReason,
      crz_ft: crz.radius_feet,
      crz_area: crz.area_sqft,
      tpz_ft: tpz.radius_feet,
      dripline_ft: driplineFt,
      fence_ft: fenceFt,
      health: t.condition_score ?? t.health ?? null,
      actions: actionsList.join('; '),
      flags,
    };
  });
}

export function feeRateForTree(schedule, dbh, isHeritage) {
  if (!schedule) return 0;
  if (isHeritage && schedule.heritage_rate_per_inch) return Number(schedule.heritage_rate_per_inch);
  const tier = (schedule.tiers || []).find(
    (t) => dbh >= Number(t.min_dbh) && (t.max_dbh == null || dbh <= Number(t.max_dbh))
  );
  return tier ? Number(tier.rate_per_inch) : 0;
}

export function replacementRatioForTree(schedule, dbh, isHeritage) {
  if (!schedule) return 1;
  if (isHeritage && schedule.heritage_replacement_ratio) return Number(schedule.heritage_replacement_ratio);
  const tier = (schedule.tiers || []).find(
    (t) => dbh >= Number(t.min_dbh) && (t.max_dbh == null || dbh <= Number(t.max_dbh))
  );
  return tier?.replacement_ratio ? Number(tier.replacement_ratio) : 1;
}

/**
 * Compute full municipal mitigation obligation, ascending diameter exemption cap,
 * retained tree credits, and unpermitted removal civil penalties.
 */
export function computeMitigationPlan(evaluatedRows, ordinance) {
  const schedule = parseObj(ordinance?.mitigation_fee_schedule);
  if (!schedule) return null;

  const protectedTotalInches = round2(
    evaluatedRows.filter((r) => r.protected).reduce((s, r) => s + r.dbh, 0)
  );
  const exemptionPct = Number(schedule.exemption_pct) || 0;
  const exemptionCapInches = round2((protectedTotalInches * exemptionPct) / 100);

  const removedProtected = evaluatedRows
    .filter((r) => r.protected && r.removal && !r.no_mitigation)
    .sort((a, b) => a.dbh - b.dbh)
    .map((r) => ({
      tag: r.tag,
      species: r.species,
      dbh: r.dbh,
      heritage: r.heritage,
      ratio: replacementRatioForTree(schedule, r.dbh, r.heritage),
      rate: feeRateForTree(schedule, r.dbh, r.heritage),
    }));

  const steps = [];
  let remainingCap = exemptionCapInches;
  let stopped = false;

  const lines = removedProtected.map((t) => {
    let exempt = false;
    if (exemptionPct > 0 && !stopped && t.dbh <= remainingCap) {
      exempt = true;
      remainingCap = round2(remainingCap - t.dbh);
      steps.push(`${t.tag} (${t.dbh} in): fits under cap, exempt. Remaining cap: ${remainingCap} in.`);
    } else if (exemptionPct > 0 && !stopped) {
      stopped = true;
      steps.push(`${t.tag} (${t.dbh} in): exceeds remaining cap (${remainingCap} in), not exempt. Ascending walk stops.`);
    }
    return {
      ...t,
      exempt,
      replace_inches: round2(t.dbh * t.ratio),
      replace_trees: t.ratio,
      fee_usd: round2(t.dbh * t.rate),
    };
  });

  const owedLines = lines.filter((l) => !l.exempt);
  const sumField = (arr, k) => round2(arr.reduce((s, x) => s + x[k], 0));

  const rules = parseObj(ordinance?.plan_rules);
  const rc = rules?.mitigation?.retained_credit;
  let retainedCredit = null;
  if (rc) {
    const creditInches = round2(
      evaluatedRows
        .filter((r) => r.hardwood !== false && !r.removal && r.dbh >= rc.min_dbh && r.dbh <= rc.max_dbh)
        .reduce((s, r) => s + r.dbh * rc.ratio, 0)
    );
    retainedCredit = {
      citation: rc.citation,
      credit_inches: creditInches,
      net_replacement_inches: Math.max(0, round2(sumField(owedLines, 'replace_inches') - creditInches)),
    };
  }

  return {
    citation: schedule.citation,
    protected_total_inches: protectedTotalInches,
    exemption_pct: exemptionPct,
    exemption_cap_inches: exemptionCapInches,
    exemption_steps: steps,
    lines,
    replacement_inches_before_exemption: sumField(lines, 'replace_inches'),
    replacement_inches_owed: sumField(owedLines, 'replace_inches'),
    replacement_trees_owed: owedLines.reduce((s, l) => s + l.replace_trees, 0),
    cash_in_lieu_usd: sumField(owedLines, 'fee_usd'),
    cash_no_exemption_usd: sumField(lines, 'fee_usd'),
    retained_credit: retainedCredit,
    unpermitted_penalty: {
      citation: schedule.penalty_citation || null,
      double_fee_usd: round2(sumField(lines, 'fee_usd') * 2),
      civil_penalty_usd: (Number(schedule.penalty_civil_per_tree) || 0) * lines.length,
      total_penalty_usd: round2(
        sumField(lines, 'fee_usd') * 2 + (Number(schedule.penalty_civil_per_tree) || 0) * lines.length
      ),
    },
  };
}

/**
 * Compute deterministic root-zone soil invigoration budget for retained trees.
 */
export function estimateRootZoneRemediation(evaluatedRows, rates = DEFAULT_SOIL_REMEDIATION_RATES_USD) {
  const retained = evaluatedRows.filter((r) => !r.removal && !r.excepted);
  const { area_sqft, overlap_saved_sqft } = unionRootZoneArea(retained);

  const lines = [
    { item: 'Pneumatic Equipment Mobilization', qty: retained.length ? 1 : 0, unit: 'ea', rate: rates.mobilization },
    { item: 'Supersonic Pneumatic Air-Tilling (CRZ)', qty: area_sqft, unit: 'sq ft', rate: rates.pneumatic_air_tilling_per_sqft },
    { item: 'Screened Thermal Compost Incorporation', qty: area_sqft, unit: 'sq ft', rate: rates.thermal_compost_per_sqft },
    { item: 'Coarse Hardwood Mulch Cap (3 in)', qty: area_sqft, unit: 'sq ft', rate: rates.hardwood_mulch_per_sqft },
  ].map((l) => ({ ...l, total_usd: round2(l.qty * l.rate) }));

  return {
    retained_tree_count: retained.length,
    union_crz_area_sqft: area_sqft,
    overlap_saved_sqft,
    lines,
    total_usd: round2(lines.reduce((s, l) => s + l.total_usd, 0)),
  };
}
