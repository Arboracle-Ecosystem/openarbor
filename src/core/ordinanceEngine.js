/**
 * OpenArbor Core — Deterministic Municipal Ordinance, Site Context & Mitigation Engine
 * Synchronized with the latest Arboracle Preservation Plan engine (34e6907):
 *   - Per-measurement DBH provenance (field vs survey vs lidar vs drone, arborist_verified)
 *   - Permit determination from ordinance permit_triggers_by_work_type (no cross-city default borrowing)
 *   - Whole-tree vs partial-inch vs site-wide ascending diameter exemption comparisons
 *   - Texas HB 7 single-family residential mitigation fee warning
 *   - Commercial parking-lot tree preservation credits & replacement species checking
 *   - ANSI A300 Part 5 / ISA BMP structured site sections and vector SVG site map generator
 * Zero proprietary dependencies.
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

export const LOW_CONFIDENCE = 0.7;

export const EXEMPTION_READING =
  'Reading: the text says protected "trees whose total diameters" fit under the cap, applied "first ... to the smallest protected tree ... then ... in ascending order." It counts whole trees, so partial-tree inches are not exempted. The text does not exclude heritage trees. The exemption waives replacement only; written approval of the Director of Planning is still required for every removal.';

export const NO_MITIGATION_PATHS =
  'No mitigation owed (§6.07.01(c)(5)(G)-(H)): tree in a sight triangle or public street clear zone; applicant\'s arborist finds it dead, dying, or diseased and hazardous, unlikely to recover, or endangering other trees; tree in dedicated public right-of-way; or transplanted per ANSI A300 and surviving 2 years.';

const SOURCE_LABELS = {
  field: 'Field',
  survey: 'Survey',
  lidar: 'LiDAR',
  drone: 'Drone',
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

export function dbhProvenance(tree) {
  const p = parseObj(tree.measurement_provenance)?.dbh || {};
  return {
    source: p.source || tree.dbh_source || 'field',
    verified: p.arborist_verified ?? tree.dbh_arborist_verified ?? tree.dbh_verified ?? true,
  };
}

export function dbhIsVerified(tree) {
  const { source, verified } = dbhProvenance(tree);
  return source === 'field' || verified === true;
}

export function thresholdWithSource(provisions = [], ordinance = null) {
  if (Number(ordinance?.dbh_threshold_inches) > 0) {
    return { value: Number(ordinance.dbh_threshold_inches), source: 'ordinance' };
  }
  const mins = (provisions || [])
    .filter((p) => ['protectedTree', 'permitRequired'].includes(p.provision_type) && Number(p.min_dbh) > 0)
    .map((p) => Number(p.min_dbh));
  return mins.length ? { value: Math.min(...mins), source: 'text' } : { value: null, source: null };
}

export const statusLabel = (r) =>
  r.heritage
    ? 'Heritage'
    : r.protected
    ? 'Protected'
    : r.likely_protected
    ? 'Likely protected, verify'
    : r.excepted
    ? 'Excepted'
    : r.unknown
    ? 'Unknown: verify with the city'
    : 'Not protected';

/**
 * Evaluate a list of field tree assessments against an OpenArbor Municipal Ordinance record.
 */
export function evaluateTreeInventory(trees = [], ordinance = null, provisions = []) {
  const rules = parseObj(ordinance?.plan_rules);
  const multiStemRule = rules?.survey?.multi_trunk === 'largest_plus_half' ? 'largest_plus_half' : 'quadratic';
  const { value: threshold, source: thresholdSource } = thresholdWithSource(provisions, ordinance);
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

    const fieldDbh = t.dbh_inches ? Number(t.dbh_inches) : calculateMultiStemDBH(stems, multiStemRule);
    const importedDbh = Number(t.imported_dbh) || 0;
    const dbh = fieldDbh || importedDbh;
    const prov = dbhProvenance(t);
    const verified = fieldDbh > 0 && dbhIsVerified(t);
    const excepted = exceptedSpecies.length > 0 && isSpeciesInList(t, exceptedSpecies);
    const hardwood = isHardwoodSpecies(
      t.species_common || t.species,
      t.species_scientific || t.scientific,
      t.hardwood || t.wood_type
    );

    const overThreshold = threshold != null && !excepted;
    const isProtected =
      Boolean(t.council_heritage && !excepted) ||
      (overThreshold && thresholdSource === 'ordinance' && verified && fieldDbh >= threshold);
    const likelyProtected = !isProtected && overThreshold && dbh >= threshold;
    const isHeritage =
      Boolean(t.council_heritage && !excepted) || (isProtected && qualifiesAsHeritage(t, fieldDbh, ordinance));

    const crzMultiplier = Number(rzRules?.crz_ft_per_inch) || 1.0;
    const crzMinFt = Number(rzRules?.crz_min_ft) || 0;
    const crz = calculateCRZ(dbh, crzMultiplier, crzMinFt);
    const tpz = calculateTPZ(dbh, 'inches', 'US_1_1');

    const driplineFt = Number(t.dripline_ft) || null;
    const fenceFt = Math.max(crz.radius_feet, driplineFt || 0);

    const actionsList = parseList(t.recommended_actions || t.actions);
    let removal = Boolean(t.removal) || actionsList.some((a) => WHOLE_REMOVAL_PATTERN.test(String(a).trim()));
    let removedByDisturbance = false;
    const flags = [];

    if (t.council_heritage && !excepted) {
      flags.push(`Council-designated heritage (${rules?.status?.heritage_registry_citation || 'heritage registry'})`);
    }

    if (rzRules) {
      if (Number(t.crz_disturbed_pct) > Number(rzRules.removal_if_disturbed_pct)) {
        removal = true;
        removedByDisturbance = true;
        flags.push(
          `${t.crz_disturbed_pct}% of CRZ disturbed (> ${rzRules.removal_if_disturbed_pct}%): counted as removed (${rzRules.citation})`
        );
      }
      if (t.cutfill_within_half_crz && Number(t.cutfill_depth_in) > Number(rzRules.cutfill_max_in)) {
        flags.push(
          `Cut/fill ${t.cutfill_depth_in} in inside half the CRZ (> ${rzRules.cutfill_max_in} in) (${rzRules.citation})`
        );
      }
      if (Number(t.impervious_pct) > Number(rzRules.impervious_max_pct)) {
        flags.push(
          `Impervious cover ${t.impervious_pct}% of CRZ (> ${rzRules.impervious_max_pct}%): Director case-by-case (${rzRules.citation})`
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
        flags.push(
          `Oak pruning scheduled ${t.pruning_date}, outside permitted seasonal window (${prRules.citation})`
        );
      }
    }

    let noMitigationReason = null;
    if (rmRules && t.no_mitigation_path && t.no_mitigation_path !== 'none') {
      const label = rmRules.no_mitigation?.[t.no_mitigation_path] || t.no_mitigation_path;
      noMitigationReason = `${label} (${rmRules.no_mitigation_citation || 'ordinance exception'})`;
    } else if (rmRules && t.transplant) {
      noMitigationReason = `Transplanted per ANSI A300; 2-year survival required (${rmRules.transplant_citation || 'ordinance'})`;
    }

    let removalReason = null;
    if (rmRules && t.removal_reason && t.removal_reason !== 'none') {
      const label = rmRules.reasons?.[t.removal_reason] || t.removal_reason;
      removalReason = `${label} (${rmRules.reason_citation || 'ordinance'})`;
    }

    if (rmRules && t.storm_hazard) {
      flags.push(
        `Storm hazard: hazardous portion only; ${t.storm_photo_uris?.length || 0} photo(s) on file (${rmRules.storm_citation || 'ordinance'})`
      );
    }

    return {
      id: t.id || `tree-${idx + 1}`,
      tag: t.tag || t.imported_tag_number || `T-${idx + 1}`,
      species: t.species_common || t.species || t.species_scientific,
      scientific: t.species_scientific || t.scientific || '',
      lat: t.lat ?? t.tree_location_lat ?? null,
      lng: t.lng ?? t.tree_location_lng ?? null,
      dbh,
      field_dbh: fieldDbh || null,
      imported_dbh: importedDbh || null,
      dbh_source: fieldDbh
        ? SOURCE_LABELS[prov.source] || 'Field'
        : SOURCE_LABELS[t.imported_source] || 'Imported',
      dbh_verified: verified,
      hardwood,
      protected: isProtected,
      likely_protected: likelyProtected,
      heritage: isHeritage,
      excepted,
      unknown: threshold == null && !excepted,
      removal,
      removed_by_disturbance: removedByDisturbance,
      removal_reason: removalReason,
      no_mitigation: noMitigationReason,
      crz_ft: crz.radius_feet,
      crz_area: crz.area_sqft,
      tpz_ft: tpz.radius_feet,
      dripline_ft: driplineFt,
      fence_ft: fenceFt,
      distance_to_parking_ft: t.distance_to_parking_ft ?? null,
      health: t.condition_score ?? t.health ?? t.overall_health_score ?? null,
      actions: actionsList.join('; '),
      flags,
      input: t,
    };
  });
}

/**
 * Permit determination from the ordinance record's work-type triggers.
 * Never borrows another city's defaults when no verified trigger rules exist.
 */
export function permitDetermination(rows, ordinance) {
  const trig = parseObj(ordinance?.permit_triggers_by_work_type);
  if (!trig) {
    const verify = rows
      .filter((r) => r.removal || /prun/i.test(r.actions))
      .map((r) => ({ tag: r.tag, species: r.species, work: [r.removal ? 'removal' : 'pruning'] }));
    return { unknown: true, required: false, removalRequired: false, items: [], verify, citation: null };
  }
  const prot = trig.protected || [];
  const her = trig.heritage || prot;
  const needs = (r) => {
    const work = [r.removal && 'removal', /prun/i.test(r.actions) && 'pruning'].filter(Boolean);
    const list = r.heritage ? her : r.protected ? prot : [];
    return work.filter((w) => list.includes(w));
  };
  const items = rows.map((r) => ({ tag: r.tag, species: r.species, work: needs(r) })).filter((x) => x.work.length);
  const verify = rows
    .filter((r) => (r.likely_protected || r.unknown) && (r.removal || /prun/i.test(r.actions)))
    .map((r) => ({ tag: r.tag, species: r.species, work: [r.removal ? 'removal' : 'pruning'] }));
  return {
    unknown: false,
    required: items.length > 0,
    removalRequired: items.some((x) => x.work.includes('removal')),
    items,
    verify,
    citation: trig.citation || null,
  };
}

export function permitSummary(permit) {
  if (!permit) return '';
  const list = (xs) => xs.map((x) => `${x.tag} ${x.species} (${x.work.join(', ')})`).join('; ');
  const verify = permit.verify?.length ? ` Verify with the city: ${list(permit.verify)}.` : '';
  if (permit.unknown) {
    return `Permit requirement: Unknown: verify with the city. No verified permit rules on file for this jurisdiction.${verify}`;
  }
  if (permit.required) return `Permit required: ${list(permit.items)}.${verify}`;
  return `No permit-triggering work on protected trees.${verify}`;
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
 * partial-inch vs whole-tree vs site-wide exemption comparison, retained tree credits,
 * HB 7 warnings, and unpermitted removal civil penalties.
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

  // Partial-inch reading (for statutory comparison only)
  let pl = exemptionCapInches;
  const partialFeeUsd = round2(
    removedProtected.reduce((s, t) => {
      const ex = Math.min(pl, t.dbh);
      pl = round2(pl - ex);
      return s + (t.dbh - ex) * t.rate;
    }, 0)
  );

  // "Smallest protected tree on the site" reading: retained protected trees also consume the cap
  const siteReadingDiffers = (() => {
    let left2 = exemptionCapInches;
    let stop2 = false;
    const ex = new Set();
    evaluatedRows
      .filter((r) => r.protected)
      .sort((a, b) => a.dbh - b.dbh)
      .forEach((r) => {
        if (!exemptionPct || stop2) return;
        if (r.dbh <= left2) {
          left2 = round2(left2 - r.dbh);
          if (r.removal) ex.add(r.tag);
        } else {
          stop2 = true;
        }
      });
    return lines.some((l) => l.exempt !== ex.has(l.tag));
  })();

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

  const dblMult = schedule.penalty_doubles_replacement ? 2 : 1;

  return {
    citation: schedule.citation,
    exemption_citation: schedule.exemption_citation || null,
    exemption_text: schedule.exemption_text || null,
    exemption_interpretation: schedule.exemption_interpretation || null,
    hb7_warning: schedule.hb7_warning || null,
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
    partial_inch_comparison_fee_usd: partialFeeUsd,
    readings_differ:
      round2(removedProtected.reduce((s, t) => s + t.dbh * t.rate, 0)) !== 0 &&
      partialFeeUsd !== sumField(owedLines, 'fee_usd'),
    site_reading_differs: siteReadingDiffers,
    retained_credit: retainedCredit,
    no_mitigation_trees: evaluatedRows
      .filter((r) => r.protected && r.removal && r.no_mitigation)
      .map((r) => ({ tag: r.tag, reason: r.no_mitigation })),
    unpermitted_penalty: {
      citation: schedule.penalty_citation || null,
      double_fee_usd: round2(sumField(lines, 'fee_usd') * 2),
      civil_penalty_usd: (Number(schedule.penalty_civil_per_tree) || 0) * lines.length,
      total_penalty_usd: round2(
        sumField(lines, 'fee_usd') * 2 + (Number(schedule.penalty_civil_per_tree) || 0) * lines.length
      ),
      replacement_inches: round2(sumField(lines, 'replace_inches') * dblMult),
      replacement_trees: lines.reduce((s, l) => s + l.replace_trees, 0) * dblMult,
    },
  };
}

/**
 * Evaluate parcel-level site context (survey age, preferred replacement species, commercial parking credits, deadlines).
 */
export function evaluateSiteContext(rows, ordinance, site = {}) {
  const rules = parseObj(ordinance?.plan_rules);
  if (!rules) return null;
  const sv = rules.survey || {};
  const mit = rules.mitigation || {};
  const pk = rules.parking_credits;

  const ageYears = site.survey_date ? (Date.now() - new Date(site.survey_date)) / 3.156e10 : null;
  const surveyWarn = !site.survey_date
    ? 'Survey date not recorded.'
    : sv.max_age_years && ageYears > sv.max_age_years
    ? `Survey is ${ageYears.toFixed(1)} years old (max ${sv.max_age_years}).`
    : null;

  const surveyTrees = rows.filter((r) => r.hardwood && r.dbh >= (sv.hardwood_min_dbh || 8));
  const rc = mit?.retained_credit;
  const creditTrees = rc
    ? rows.filter((r) => r.hardwood && !r.removal && r.dbh >= rc.min_dbh && r.dbh <= rc.max_dbh)
    : [];
  const creditInches = rc ? round1(creditTrees.reduce((s, r) => s + r.dbh * rc.ratio, 0)) : 0;

  const list = (mit?.preferred_species || []).map((s) => s.toLowerCase());
  const speciesCheck = (site.replacement_species || []).map((s) => ({
    name: s,
    ok: list.length ? list.some((p) => p.includes(s.toLowerCase()) || s.toLowerCase().includes(p)) : null,
  }));

  const parking =
    site.site_use === 'commercial' && pk
      ? rows
          .filter(
            (r) =>
              r.protected &&
              !r.removal &&
              (r.health ?? 10) >= 6 &&
              r.distance_to_parking_ft != null
          )
          .map((r) => {
            const t = (pk.tiers || []).find(
              (x) =>
                r.dbh >= x.min_dbh &&
                (x.max_dbh == null || r.dbh <= x.max_dbh) &&
                r.distance_to_parking_ft <= x.within_ft
            );
            return { tag: r.tag, dbh: r.dbh, credits: t?.credits || 0 };
          })
      : [];

  const addDays = (d, n) => {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x.toISOString().slice(0, 10);
  };

  const deadlines = (mit?.deadlines || []).map((d) => {
    const base = d.from === 'approval' ? site.approval_date : site.co_date;
    return { ...d, due: base ? addDays(base, d.days) : null };
  });

  return {
    surveyWarn,
    surveyTrees,
    creditTrees,
    creditInches,
    speciesCheck,
    parking,
    parkingTotal: parking.reduce((s, p) => s + p.credits, 0),
    deadlines,
    etj: site.jurisdiction_context === 'etj',
  };
}

/**
 * Generate a standalone, to-scale SVG site map of located trees and their TPZ/CRZ protection circles
 * (solid green for retained trees, dashed red for proposed removals, with 20-ft scale bar and North arrow).
 */
export function renderSiteMapSVG(rows, { width = 600, height = 320 } = {}) {
  const FT_PER_DEG_LAT = 364000;
  const pts = (rows || []).filter((r) => r.lat != null && r.lng != null);
  if (!pts.length) return null;

  const ftLng = FT_PER_DEG_LAT * Math.cos((pts[0].lat * Math.PI) / 180);
  const p = pts.map((r) => ({
    r,
    fx: (r.lng - pts[0].lng) * ftLng,
    fy: (r.lat - pts[0].lat) * FT_PER_DEG_LAT,
    rad: r.fence_ft || r.tpz_ft || r.crz_ft || 10,
  }));

  const minX = Math.min(...p.map((q) => q.fx - q.rad)) - 15;
  const maxX = Math.max(...p.map((q) => q.fx + q.rad)) + 15;
  const minY = Math.min(...p.map((q) => q.fy - q.rad)) - 15;
  const maxY = Math.max(...p.map((q) => q.fy + q.rad)) + 15;

  const scale = Math.min(width / (maxX - minX), height / (maxY - minY));
  const X = (fx) => round1((fx - minX) * scale);
  const Y = (fy) => round1(height - (fy - minY) * scale);

  const circles = p
    .map(({ r, fx, fy, rad }) => {
      const cx = X(fx);
      const cy = Y(fy);
      const radiusPx = Math.max(round1(rad * scale), 4);
      const stroke = r.removal ? '#C82828' : '#2D6A4F';
      const dash = r.removal ? ' stroke-dasharray="5,4"' : '';
      return [
        `  <circle cx="${cx}" cy="${cy}" r="${radiusPx}" fill="none" stroke="${stroke}" stroke-width="1.5"${dash} />`,
        `  <circle cx="${cx}" cy="${cy}" r="3" fill="#0C1A0E" stroke="${stroke}" stroke-width="1.5" />`,
        `  <text x="${cx + 5}" y="${cy - 5}" font-family="monospace" font-size="10" fill="#F5F0E8">${r.tag}</text>`,
      ].join('\n');
    })
    .join('\n');

  const bar20Px = round1(20 * scale);
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background:#0C1A0E;border:1px solid #2D6A4F;">`,
    circles,
    `  <line x1="16" y1="${height - 16}" x2="${round1(16 + bar20Px)}" y2="${height - 16}" stroke="#F5F0E8" stroke-width="2" />`,
    `  <text x="16" y="${height - 22}" font-family="monospace" font-size="10" fill="#F5F0E8">20 ft</text>`,
    `  <text x="${width - 36}" y="22" font-family="monospace" font-size="11" fill="#F5F0E8">N ^</text>`,
    `</svg>`,
  ].join('\n');
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
