// src/core/rootZone.js
var round2 = (n) => Math.round(Number(n || 0) * 100) / 100;
var round1 = (n) => Math.round(Number(n || 0) * 10) / 10;
function calculateCRZ(dbhInches, multiplier = 1, minRadiusFeet = 0) {
  if (!dbhInches || dbhInches <= 0) {
    return {
      radius_feet: 0,
      radius_meters: 0,
      area_sqft: 0,
      area_sqm: 0,
      half_radius_feet: 0,
      half_area_sqft: 0,
      quarter_radius_feet: 0,
      quarter_area_sqft: 0
    };
  }
  const radiusFeet = Math.max(Number(minRadiusFeet) || 0, dbhInches * multiplier);
  const radiusMeters = radiusFeet * 0.3048;
  const areaSqft = Math.PI * radiusFeet ** 2;
  const areaSqm = Math.PI * radiusMeters ** 2;
  const halfRadiusFeet = radiusFeet / 2;
  const halfAreaSqft = Math.PI * halfRadiusFeet ** 2;
  const quarterRadiusFeet = radiusFeet / 4;
  const quarterAreaSqft = Math.PI * quarterRadiusFeet ** 2;
  return {
    radius_feet: round2(radiusFeet),
    radius_meters: round2(radiusMeters),
    area_sqft: round2(areaSqft),
    area_sqm: round2(areaSqm),
    half_radius_feet: round2(halfRadiusFeet),
    half_area_sqft: round2(halfAreaSqft),
    quarter_radius_feet: round2(quarterRadiusFeet),
    quarter_area_sqft: round2(quarterAreaSqft)
  };
}
function calculateTPZ(dbh, unit = "inches", standard = "US_1_1", customMultiplier = null) {
  if (!dbh || dbh <= 0) {
    return { radius_feet: 0, radius_meters: 0, area_sqft: 0, area_sqm: 0, formula_used: "N/A" };
  }
  const dbhInches = unit === "cm" ? dbh / 2.54 : dbh;
  const dbhCm = unit === "inches" ? dbh * 2.54 : dbh;
  let radiusMeters = 0;
  let formulaUsed = "";
  switch (standard) {
    case "US_1_1":
      radiusMeters = dbhInches * 1 * 0.3048;
      formulaUsed = "US Standard (1:1): 1.0 ft radius per inch DBH";
      break;
    case "US_1_1.5":
      radiusMeters = dbhInches * 1.5 * 0.3048;
      formulaUsed = "US Mature/Sensitive Standard (1:1.5): 1.5 ft radius per inch DBH";
      break;
    case "US_1_18":
      radiusMeters = dbhInches * 18 / 12 * 0.3048;
      formulaUsed = "US Standard (1:18): 18 in radius per inch DBH";
      break;
    case "Australian_AS4970":
      radiusMeters = Math.max(2, Math.min(dbhCm * 12 / 100, 15));
      formulaUsed = "Australian AS 4970 (12x DBH in cm, clamped 2m to 15m)";
      break;
    case "UK_BS5837":
      radiusMeters = Math.min(dbhCm * 0.12, 15);
      formulaUsed = "UK BS 5837:2012 (12x DBH, capped at 15m)";
      break;
    case "Custom": {
      const mult = customMultiplier && customMultiplier > 0 ? customMultiplier : 1;
      radiusMeters = dbhInches * mult * 0.3048;
      formulaUsed = `Custom (${mult}:1 ft per inch DBH)`;
      break;
    }
    default:
      radiusMeters = dbhInches * 0.3048;
      formulaUsed = "Default US (1:1)";
  }
  const radiusFeet = radiusMeters / 0.3048;
  return {
    radius_feet: round2(radiusFeet),
    radius_meters: round2(radiusMeters),
    area_sqft: round2(Math.PI * radiusFeet ** 2),
    area_sqm: round2(Math.PI * radiusMeters ** 2),
    formula_used: formulaUsed
  };
}
function calculateSRZ(drfInches = null, dbhInches = null) {
  const diameterInches = drfInches || (dbhInches ? dbhInches * 1.1 : 0);
  if (!diameterInches || diameterInches <= 0) {
    return { radius_feet: 0, radius_meters: 0, area_sqft: 0, area_sqm: 0, formula_used: "N/A" };
  }
  const diameterMeters = diameterInches * 0.0254;
  const rawSrzMeters = Math.pow(diameterMeters * 50, 0.42) * 0.64;
  const srzMeters = diameterMeters < 0.15 ? 1.5 : rawSrzMeters;
  const radiusFeet = srzMeters / 0.3048;
  return {
    radius_feet: round2(radiusFeet),
    radius_meters: round2(srzMeters),
    area_sqft: round2(Math.PI * radiusFeet ** 2),
    area_sqm: round2(Math.PI * srzMeters ** 2),
    formula_used: "AS 4970 Structural Root Zone: (D_m * 50)^0.42 * 0.64"
  };
}
function calculateMultiStemDBH(stemsInches, method = "quadratic") {
  const valid = (stemsInches || []).map(Number).filter((d) => d > 0);
  if (valid.length === 0) return 0;
  if (valid.length === 1) return round1(valid[0]);
  if (method === "largest_plus_half") {
    const sorted = [...valid].sort((a, b) => b - a);
    return round1(sorted[0] + sorted.slice(1).reduce((sum, d) => sum + d / 2, 0));
  }
  if (method === "sum") {
    return round1(valid.reduce((sum, d) => sum + d, 0));
  }
  const sumSquares = valid.reduce((sum, d) => sum + d * d, 0);
  return round1(Math.sqrt(sumSquares));
}
function unionRootZoneArea(trees) {
  const FT_PER_DEG_LAT = 364e3;
  const located = (trees || []).filter((r) => r.lat != null && r.lng != null && (r.tpz_ft || r.crz_ft) > 0);
  const unlocated = (trees || []).filter((r) => !located.includes(r)).reduce((s, r) => s + (r.crz_area || Math.PI * (r.crz_ft || r.tpz_ft || 0) ** 2), 0);
  if (!located.length) return { area_sqft: Math.round(unlocated), overlap_saved_sqft: 0 };
  const lat0 = located[0].lat;
  const ftLng = FT_PER_DEG_LAT * Math.cos(lat0 * Math.PI / 180);
  const pts = located.map((r) => ({
    x: (r.lng - located[0].lng) * ftLng,
    y: (r.lat - lat0) * FT_PER_DEG_LAT,
    rad: r.crz_ft || r.tpz_ft
  }));
  const minX = Math.min(...pts.map((p) => p.x - p.rad));
  const maxX = Math.max(...pts.map((p) => p.x + p.rad));
  const minY = Math.min(...pts.map((p) => p.y - p.rad));
  const maxY = Math.max(...pts.map((p) => p.y + p.rad));
  let cells = 0;
  for (let x = minX; x < maxX; x += 1) {
    for (let y = minY; y < maxY; y += 1) {
      if (pts.some((p) => (x + 0.5 - p.x) ** 2 + (y + 0.5 - p.y) ** 2 <= p.rad ** 2)) {
        cells += 1;
      }
    }
  }
  const summed = located.reduce((s, r) => s + Math.PI * pRad(r) ** 2, 0);
  return {
    area_sqft: Math.round(cells + unlocated),
    overlap_saved_sqft: Math.max(0, Math.round(summed - cells))
  };
}
function pRad(r) {
  return r.crz_ft || r.tpz_ft || 0;
}

// src/core/ordinanceEngine.js
var round22 = (n) => Math.round(Number(n || 0) * 100) / 100;
var round12 = (n) => Math.round(Number(n || 0) * 10) / 10;
var DEFAULT_SOIL_REMEDIATION_RATES_USD = {
  mobilization: 350,
  pneumatic_air_tilling_per_sqft: 0.6,
  thermal_compost_per_sqft: 0.35,
  hardwood_mulch_per_sqft: 0.15
};
var SOURCE_LABELS = {
  field: "Field",
  survey: "Survey",
  lidar: "LiDAR",
  drone: "Drone"
};
var parseObj = (raw) => {
  if (!raw) return null;
  if (typeof raw === "object" && !Array.isArray(raw)) return raw;
  try {
    const v = JSON.parse(raw);
    return v && typeof v === "object" && !Array.isArray(v) ? v : null;
  } catch {
    return null;
  }
};
var parseList = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [v];
  } catch {
    return [String(raw)];
  }
};
var SOFTWOOD_PATTERN = /pinus|juniperus|taxodium|cupressus|\bpine\b|juniper|cypress|(?<!\w)cedar(?! elm)/i;
var OAK_PATTERN = /quercus|\boak\b/i;
var WHOLE_REMOVAL_PATTERN = /^(tree\s+|whole[-\s]tree\s+)?remov(al|e tree|e)\s*(:|$)/i;
function isHardwoodSpecies(speciesCommon = "", speciesScientific = "", explicitClassification = null) {
  if (explicitClassification === "hardwood") return true;
  if (explicitClassification === "softwood") return false;
  return !SOFTWOOD_PATTERN.test(`${speciesCommon} ${speciesScientific}`);
}
function isOakSpecies(speciesCommon = "", speciesScientific = "") {
  return OAK_PATTERN.test(`${speciesCommon} ${speciesScientific}`);
}
function isSpeciesInList(tree, speciesList = []) {
  const names = [tree.species_scientific, tree.species_common, tree.species, tree.scientific].filter(Boolean).map((n) => n.toLowerCase());
  return parseList(speciesList).some((entry) => {
    const parts = String(entry).toLowerCase().split(/[()/]/).map((s) => s.trim()).filter((s) => s.length > 2);
    return parts.some((p) => names.some((n) => n.includes(p) || p.includes(n)));
  });
}
function qualifiesAsHeritage(tree, dbhInches, ordinance) {
  if (!ordinance) return false;
  const names = [tree.species_scientific, tree.species_common, tree.species, tree.scientific].filter(Boolean).map((n) => n.toLowerCase());
  const speciesMap = parseObj(ordinance.heritage_species_thresholds) || {};
  for (const [speciesKey, minDbh] of Object.entries(speciesMap)) {
    const parts = speciesKey.toLowerCase().split(/[()/]/).map((s) => s.trim()).filter((s) => s.length > 2);
    if (parts.some((p) => names.some((n) => n.includes(p) || p.includes(n)))) {
      return dbhInches >= Number(minDbh);
    }
  }
  const generalThreshold = Number(ordinance.heritage_threshold_inches);
  return generalThreshold > 0 && dbhInches >= generalThreshold;
}
function dbhProvenance(tree) {
  const p = parseObj(tree.measurement_provenance)?.dbh || {};
  return {
    source: p.source || tree.dbh_source || "field",
    verified: p.arborist_verified ?? tree.dbh_arborist_verified ?? tree.dbh_verified ?? true
  };
}
function dbhIsVerified(tree) {
  const { source, verified } = dbhProvenance(tree);
  return source === "field" || verified === true;
}
function thresholdWithSource(provisions = [], ordinance = null) {
  if (Number(ordinance?.dbh_threshold_inches) > 0) {
    return { value: Number(ordinance.dbh_threshold_inches), source: "ordinance" };
  }
  const mins = (provisions || []).filter((p) => ["protectedTree", "permitRequired"].includes(p.provision_type) && Number(p.min_dbh) > 0).map((p) => Number(p.min_dbh));
  return mins.length ? { value: Math.min(...mins), source: "text" } : { value: null, source: null };
}
var statusLabel = (r) => r.heritage ? "Heritage" : r.protected ? "Protected" : r.likely_protected ? "Likely protected, verify" : r.excepted ? "Excepted" : r.unknown ? "Unknown: verify with the city" : "Not protected";
function evaluateTreeInventory(trees = [], ordinance = null, provisions = []) {
  const rules = parseObj(ordinance?.plan_rules);
  const multiStemRule = rules?.survey?.multi_trunk === "largest_plus_half" ? "largest_plus_half" : "quadratic";
  const { value: threshold, source: thresholdSource } = thresholdWithSource(provisions, ordinance);
  const exceptedSpecies = parseList(ordinance?.excepted_species);
  const rzRules = rules?.root_zone;
  const rmRules = rules?.removal;
  const prRules = rules?.pruning;
  return trees.map((t, idx) => {
    const stems = Array.isArray(t.stems_inches) ? t.stems_inches : String(t.dbh_measurements || t.dbh_inches || "").split(",").map(Number).filter((n) => n > 0);
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
    const isProtected = Boolean(t.council_heritage && !excepted) || overThreshold && thresholdSource === "ordinance" && verified && fieldDbh >= threshold;
    const likelyProtected = !isProtected && overThreshold && dbh >= threshold;
    const isHeritage = Boolean(t.council_heritage && !excepted) || isProtected && qualifiesAsHeritage(t, fieldDbh, ordinance);
    const crzMultiplier = Number(rzRules?.crz_ft_per_inch) || 1;
    const crzMinFt = Number(rzRules?.crz_min_ft) || 0;
    const crz = calculateCRZ(dbh, crzMultiplier, crzMinFt);
    const tpz = calculateTPZ(dbh, "inches", "US_1_1");
    const driplineFt = Number(t.dripline_ft) || null;
    const fenceFt = Math.max(crz.radius_feet, driplineFt || 0);
    const actionsList = parseList(t.recommended_actions || t.actions);
    let removal = Boolean(t.removal) || actionsList.some((a) => WHOLE_REMOVAL_PATTERN.test(String(a).trim()));
    let removedByDisturbance = false;
    const flags = [];
    if (t.council_heritage && !excepted) {
      flags.push(`Council-designated heritage (${rules?.status?.heritage_registry_citation || "heritage registry"})`);
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
    if (rmRules && t.no_mitigation_path && t.no_mitigation_path !== "none") {
      const label = rmRules.no_mitigation?.[t.no_mitigation_path] || t.no_mitigation_path;
      noMitigationReason = `${label} (${rmRules.no_mitigation_citation || "ordinance exception"})`;
    } else if (rmRules && t.transplant) {
      noMitigationReason = `Transplanted per ANSI A300; 2-year survival required (${rmRules.transplant_citation || "ordinance"})`;
    }
    let removalReason = null;
    if (rmRules && t.removal_reason && t.removal_reason !== "none") {
      const label = rmRules.reasons?.[t.removal_reason] || t.removal_reason;
      removalReason = `${label} (${rmRules.reason_citation || "ordinance"})`;
    }
    if (rmRules && t.storm_hazard) {
      flags.push(
        `Storm hazard: hazardous portion only; ${t.storm_photo_uris?.length || 0} photo(s) on file (${rmRules.storm_citation || "ordinance"})`
      );
    }
    return {
      id: t.id || `tree-${idx + 1}`,
      tag: t.tag || t.imported_tag_number || `T-${idx + 1}`,
      species: t.species_common || t.species || t.species_scientific,
      scientific: t.species_scientific || t.scientific || "",
      lat: t.lat ?? t.tree_location_lat ?? null,
      lng: t.lng ?? t.tree_location_lng ?? null,
      dbh,
      field_dbh: fieldDbh || null,
      imported_dbh: importedDbh || null,
      dbh_source: fieldDbh ? SOURCE_LABELS[prov.source] || "Field" : SOURCE_LABELS[t.imported_source] || "Imported",
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
      actions: actionsList.join("; "),
      flags,
      input: t
    };
  });
}
function permitDetermination(rows, ordinance) {
  const trig = parseObj(ordinance?.permit_triggers_by_work_type);
  if (!trig) {
    const verify2 = rows.filter((r) => r.removal || /prun/i.test(r.actions)).map((r) => ({ tag: r.tag, species: r.species, work: [r.removal ? "removal" : "pruning"] }));
    return { unknown: true, required: false, removalRequired: false, items: [], verify: verify2, citation: null };
  }
  const prot = trig.protected || [];
  const her = trig.heritage || prot;
  const needs = (r) => {
    const work = [r.removal && "removal", /prun/i.test(r.actions) && "pruning"].filter(Boolean);
    const list = r.heritage ? her : r.protected ? prot : [];
    return work.filter(
      (w) => list.some((trigger) => trigger === w || String(trigger).toLowerCase().includes(w))
    );
  };
  const items = rows.map((r) => ({ tag: r.tag, species: r.species, work: needs(r) })).filter((x) => x.work.length);
  const verify = rows.filter((r) => (r.likely_protected || r.unknown) && (r.removal || /prun/i.test(r.actions))).map((r) => ({ tag: r.tag, species: r.species, work: [r.removal ? "removal" : "pruning"] }));
  return {
    unknown: false,
    required: items.length > 0,
    removalRequired: items.some((x) => x.work.includes("removal")),
    items,
    verify,
    citation: trig.citation || null
  };
}
function permitSummary(permit) {
  if (!permit) return "";
  const list = (xs) => xs.map((x) => `${x.tag} ${x.species} (${x.work.join(", ")})`).join("; ");
  const verify = permit.verify?.length ? ` Verify with the city: ${list(permit.verify)}.` : "";
  if (permit.unknown) {
    return `Permit requirement: Unknown: verify with the city. No verified permit rules on file for this jurisdiction.${verify}`;
  }
  if (permit.required) return `Permit required: ${list(permit.items)}.${verify}`;
  return `No permit-triggering work on protected trees.${verify}`;
}
function feeRateForTree(schedule, dbh, isHeritage) {
  if (!schedule) return 0;
  if (isHeritage && schedule.heritage_rate_per_inch) return Number(schedule.heritage_rate_per_inch);
  const tier = (schedule.tiers || []).find(
    (t) => dbh >= Number(t.min_dbh) && (t.max_dbh == null || dbh <= Number(t.max_dbh))
  );
  return tier ? Number(tier.rate_per_inch) : 0;
}
function replacementRatioForTree(schedule, dbh, isHeritage) {
  if (!schedule) return 1;
  if (isHeritage && schedule.heritage_replacement_ratio) return Number(schedule.heritage_replacement_ratio);
  const tier = (schedule.tiers || []).find(
    (t) => dbh >= Number(t.min_dbh) && (t.max_dbh == null || dbh <= Number(t.max_dbh))
  );
  return tier?.replacement_ratio ? Number(tier.replacement_ratio) : 1;
}
function computeMitigationPlan(evaluatedRows, ordinance) {
  const schedule = parseObj(ordinance?.mitigation_fee_schedule);
  if (!schedule) return null;
  const protectedTotalInches = round22(
    evaluatedRows.filter((r) => r.protected).reduce((s, r) => s + r.dbh, 0)
  );
  const exemptionPct = Number(schedule.exemption_pct) || 0;
  const exemptionCapInches = round22(protectedTotalInches * exemptionPct / 100);
  const removedProtected = evaluatedRows.filter((r) => r.protected && r.removal && !r.no_mitigation).sort((a, b) => a.dbh - b.dbh).map((r) => ({
    tag: r.tag,
    species: r.species,
    dbh: r.dbh,
    heritage: r.heritage,
    ratio: replacementRatioForTree(schedule, r.dbh, r.heritage),
    rate: feeRateForTree(schedule, r.dbh, r.heritage)
  }));
  const steps = [];
  let remainingCap = exemptionCapInches;
  let stopped = false;
  const lines = removedProtected.map((t) => {
    let exempt = false;
    if (exemptionPct > 0 && !stopped && t.dbh <= remainingCap) {
      exempt = true;
      remainingCap = round22(remainingCap - t.dbh);
      steps.push(`${t.tag} (${t.dbh} in): fits under cap, exempt. Remaining cap: ${remainingCap} in.`);
    } else if (exemptionPct > 0 && !stopped) {
      stopped = true;
      steps.push(`${t.tag} (${t.dbh} in): exceeds remaining cap (${remainingCap} in), not exempt. Ascending walk stops.`);
    }
    return {
      ...t,
      exempt,
      replace_inches: round22(t.dbh * t.ratio),
      replace_trees: t.ratio,
      fee_usd: round22(t.dbh * t.rate)
    };
  });
  const owedLines = lines.filter((l) => !l.exempt);
  const sumField = (arr, k) => round22(arr.reduce((s, x) => s + x[k], 0));
  let pl = exemptionCapInches;
  const partialFeeUsd = round22(
    removedProtected.reduce((s, t) => {
      const ex = Math.min(pl, t.dbh);
      pl = round22(pl - ex);
      return s + (t.dbh - ex) * t.rate;
    }, 0)
  );
  const siteReadingDiffers = (() => {
    let left2 = exemptionCapInches;
    let stop2 = false;
    const ex = /* @__PURE__ */ new Set();
    evaluatedRows.filter((r) => r.protected).sort((a, b) => a.dbh - b.dbh).forEach((r) => {
      if (!exemptionPct || stop2) return;
      if (r.dbh <= left2) {
        left2 = round22(left2 - r.dbh);
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
    const creditInches = round22(
      evaluatedRows.filter((r) => r.hardwood !== false && !r.removal && r.dbh >= rc.min_dbh && r.dbh <= rc.max_dbh).reduce((s, r) => s + r.dbh * rc.ratio, 0)
    );
    retainedCredit = {
      citation: rc.citation,
      credit_inches: creditInches,
      net_replacement_inches: Math.max(0, round22(sumField(owedLines, "replace_inches") - creditInches))
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
    replacement_inches_before_exemption: sumField(lines, "replace_inches"),
    replacement_inches_owed: sumField(owedLines, "replace_inches"),
    replacement_trees_owed: owedLines.reduce((s, l) => s + l.replace_trees, 0),
    cash_in_lieu_usd: sumField(owedLines, "fee_usd"),
    cash_no_exemption_usd: sumField(lines, "fee_usd"),
    partial_inch_comparison_fee_usd: partialFeeUsd,
    readings_differ: round22(removedProtected.reduce((s, t) => s + t.dbh * t.rate, 0)) !== 0 && partialFeeUsd !== sumField(owedLines, "fee_usd"),
    site_reading_differs: siteReadingDiffers,
    retained_credit: retainedCredit,
    no_mitigation_trees: evaluatedRows.filter((r) => r.protected && r.removal && r.no_mitigation).map((r) => ({ tag: r.tag, reason: r.no_mitigation })),
    unpermitted_penalty: {
      citation: schedule.penalty_citation || null,
      double_fee_usd: round22(sumField(lines, "fee_usd") * 2),
      civil_penalty_usd: (Number(schedule.penalty_civil_per_tree) || 0) * lines.length,
      total_penalty_usd: round22(
        sumField(lines, "fee_usd") * 2 + (Number(schedule.penalty_civil_per_tree) || 0) * lines.length
      ),
      replacement_inches: round22(sumField(lines, "replace_inches") * dblMult),
      replacement_trees: lines.reduce((s, l) => s + l.replace_trees, 0) * dblMult
    }
  };
}
function evaluateSiteContext(rows, ordinance, site = {}) {
  const rules = parseObj(ordinance?.plan_rules);
  if (!rules) return null;
  const sv = rules.survey || {};
  const mit = rules.mitigation || {};
  const pk = rules.parking_credits;
  const ageYears = site.survey_date ? (Date.now() - new Date(site.survey_date)) / 3156e7 : null;
  const surveyWarn = !site.survey_date ? "Survey date not recorded." : sv.max_age_years && ageYears > sv.max_age_years ? `Survey is ${ageYears.toFixed(1)} years old (max ${sv.max_age_years}).` : null;
  const surveyTrees = rows.filter((r) => r.hardwood && r.dbh >= (sv.hardwood_min_dbh || 8));
  const rc = mit?.retained_credit;
  const creditTrees = rc ? rows.filter((r) => r.hardwood && !r.removal && r.dbh >= rc.min_dbh && r.dbh <= rc.max_dbh) : [];
  const creditInches = rc ? round12(creditTrees.reduce((s, r) => s + r.dbh * rc.ratio, 0)) : 0;
  const list = (mit?.preferred_species || []).map((s) => s.toLowerCase());
  const speciesCheck = (site.replacement_species || []).map((s) => ({
    name: s,
    ok: list.length ? list.some((p) => p.includes(s.toLowerCase()) || s.toLowerCase().includes(p)) : null
  }));
  const parking = site.site_use === "commercial" && pk ? rows.filter(
    (r) => r.protected && !r.removal && (r.health ?? 10) >= 6 && r.distance_to_parking_ft != null
  ).map((r) => {
    const t = (pk.tiers || []).find(
      (x) => r.dbh >= x.min_dbh && (x.max_dbh == null || r.dbh <= x.max_dbh) && r.distance_to_parking_ft <= x.within_ft
    );
    return { tag: r.tag, dbh: r.dbh, credits: t?.credits || 0 };
  }) : [];
  const addDays = (d, n) => {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x.toISOString().slice(0, 10);
  };
  const deadlines = (mit?.deadlines || []).map((d) => {
    const base = d.from === "approval" ? site.approval_date : site.co_date;
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
    etj: site.jurisdiction_context === "etj"
  };
}
function renderSiteMapSVG(rows, { width = 600, height = 320 } = {}) {
  const FT_PER_DEG_LAT = 364e3;
  const pts = (rows || []).filter((r) => r.lat != null && r.lng != null);
  if (!pts.length) return null;
  const ftLng = FT_PER_DEG_LAT * Math.cos(pts[0].lat * Math.PI / 180);
  const p = pts.map((r) => ({
    r,
    fx: (r.lng - pts[0].lng) * ftLng,
    fy: (r.lat - pts[0].lat) * FT_PER_DEG_LAT,
    rad: r.fence_ft || r.tpz_ft || r.crz_ft || 10
  }));
  const minX = Math.min(...p.map((q) => q.fx - q.rad)) - 15;
  const maxX = Math.max(...p.map((q) => q.fx + q.rad)) + 15;
  const minY = Math.min(...p.map((q) => q.fy - q.rad)) - 15;
  const maxY = Math.max(...p.map((q) => q.fy + q.rad)) + 15;
  const scale = Math.min(width / (maxX - minX), height / (maxY - minY));
  const X = (fx) => round12((fx - minX) * scale);
  const Y = (fy) => round12(height - (fy - minY) * scale);
  const circles = p.map(({ r, fx, fy, rad }) => {
    const cx = X(fx);
    const cy = Y(fy);
    const radiusPx = Math.max(round12(rad * scale), 4);
    const stroke = r.removal ? "#C82828" : "#2D6A4F";
    const dash = r.removal ? ' stroke-dasharray="5,4"' : "";
    return [
      `  <circle cx="${cx}" cy="${cy}" r="${radiusPx}" fill="none" stroke="${stroke}" stroke-width="1.5"${dash} />`,
      `  <circle cx="${cx}" cy="${cy}" r="3" fill="#0C1A0E" stroke="${stroke}" stroke-width="1.5" />`,
      `  <text x="${cx + 5}" y="${cy - 5}" font-family="monospace" font-size="10" fill="#F5F0E8">${r.tag}</text>`
    ].join("\n");
  }).join("\n");
  const bar20Px = round12(20 * scale);
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background:#0C1A0E;border:1px solid #2D6A4F;">`,
    circles,
    `  <line x1="16" y1="${height - 16}" x2="${round12(16 + bar20Px)}" y2="${height - 16}" stroke="#F5F0E8" stroke-width="2" />`,
    `  <text x="16" y="${height - 22}" font-family="monospace" font-size="10" fill="#F5F0E8">20 ft</text>`,
    `  <text x="${width - 36}" y="22" font-family="monospace" font-size="11" fill="#F5F0E8">N ^</text>`,
    `</svg>`
  ].join("\n");
}
function estimateRootZoneRemediation(evaluatedRows, rates = DEFAULT_SOIL_REMEDIATION_RATES_USD) {
  const retained = evaluatedRows.filter((r) => !r.removal && !r.excepted);
  const { area_sqft, overlap_saved_sqft } = unionRootZoneArea(retained);
  const lines = [
    { item: "Pneumatic Equipment Mobilization", qty: retained.length ? 1 : 0, unit: "ea", rate: rates.mobilization },
    { item: "Supersonic Pneumatic Air-Tilling (CRZ)", qty: area_sqft, unit: "sq ft", rate: rates.pneumatic_air_tilling_per_sqft },
    { item: "Screened Thermal Compost Incorporation", qty: area_sqft, unit: "sq ft", rate: rates.thermal_compost_per_sqft },
    { item: "Coarse Hardwood Mulch Cap (3 in)", qty: area_sqft, unit: "sq ft", rate: rates.hardwood_mulch_per_sqft }
  ].map((l) => ({ ...l, total_usd: round22(l.qty * l.rate) }));
  return {
    retained_tree_count: retained.length,
    union_crz_area_sqft: area_sqft,
    overlap_saved_sqft,
    lines,
    total_usd: round22(lines.reduce((s, l) => s + l.total_usd, 0))
  };
}

// src/core/ecosystemBenefits.js
var round23 = (n) => Math.round(Number(n || 0) * 100) / 100;
var round13 = (n) => Math.round(Number(n || 0) * 10) / 10;
var CONDITION_FACTORS = {
  Excellent: 1,
  Good: 0.85,
  Fair: 0.62,
  Poor: 0.37,
  Critical: 0.15,
  Dead: 0
};
function estimateTreeAge({
  dbh_inches,
  girth_inches = null,
  base_growth_factor = 4.5,
  site_condition = "Open Grown / Parkland"
}) {
  const effectiveDbhInches = dbh_inches || (girth_inches ? girth_inches / Math.PI : 0);
  if (!effectiveDbhInches || effectiveDbhInches <= 0) return { estimated_age_years: 0 };
  const dbhCm = effectiveDbhInches * 2.54;
  const siteModifiers = {
    "Open Grown / Parkland": 0.85,
    "Forest / Woodland": 1.15,
    "Urban / Street Tree": 1.1
  };
  const modifier = siteModifiers[site_condition] || 1;
  const adjustedFactor = base_growth_factor * modifier;
  return {
    dbh_inches: round23(effectiveDbhInches),
    dbh_cm: round23(dbhCm),
    base_growth_factor,
    site_condition,
    site_modifier: modifier,
    adjusted_growth_factor: round23(adjustedFactor),
    estimated_age_years: Math.round(dbhCm * adjustedFactor),
    method: "ISA Growth Factor / John White (FCIN12) Site-Modified Model"
  };
}
function calculateTreeEcosystemBenefits({
  species_name,
  common_name = "",
  dbh_inches,
  height_feet = null,
  canopy_spread_feet = null,
  condition_class = "Good",
  crown_light_exposure = 4,
  land_use = "Residential",
  annual_rainfall_inches = 35,
  projection_years = 20
}) {
  if (!dbh_inches || dbh_inches <= 0) {
    throw new Error("dbh_inches must be > 0");
  }
  const conditionFactor = CONDITION_FACTORS[condition_class] ?? 0.85;
  const dbhCm = dbh_inches * 2.54;
  const aboveGroundBiomassKg = Math.exp(-2.0773 + 2.3323 * Math.log(dbhCm));
  const belowGroundBiomassKg = aboveGroundBiomassKg * 0.28;
  const adjustedBiomassKg = (aboveGroundBiomassKg + belowGroundBiomassKg) * 0.8;
  const carbonStorageKg = adjustedBiomassKg * 0.5;
  const carbonStorageLbs = carbonStorageKg * 2.20462;
  const carbonStorageValueUsd = carbonStorageKg / 1e3 * 187;
  const annualGrowthInches = condition_class === "Excellent" ? 0.5 : condition_class === "Good" ? 0.4 : condition_class === "Fair" ? 0.3 : 0.15;
  const futureDbhCm = (dbh_inches + annualGrowthInches) * 2.54;
  const futureBiomassKg = Math.exp(-2.0773 + 2.3323 * Math.log(futureDbhCm)) * 1.28 * 0.8;
  const annualSeqKg = Math.max(0, futureBiomassKg * 0.5 - carbonStorageKg);
  const annualSeqLbs = annualSeqKg * 2.20462 * conditionFactor;
  const annualSeqValueUsd = annualSeqKg / 1e3 * 187 * conditionFactor;
  const estimatedHeightFt = height_feet || dbh_inches * 1.5 + 15;
  const estimatedSpreadFt = canopy_spread_feet || dbh_inches * 0.8 + 10;
  const canopyCoverSqft = Math.PI * (estimatedSpreadFt / 2) ** 2;
  const leafAreaSqft = canopyCoverSqft * 6.5;
  const leafAreaM2 = leafAreaSqft * 0.0929;
  const interceptionRate = 0.15 * conditionFactor;
  const rainfallInterceptedGal = canopyCoverSqft * (annual_rainfall_inches / 12) * 7.48 * interceptionRate;
  const avoidedRunoffGal = rainfallInterceptedGal * 1.3;
  const avoidedRunoffValueUsd = avoidedRunoffGal * 9e-3;
  const o3G = leafAreaM2 * 3.4 * conditionFactor;
  const no2G = leafAreaM2 * 1.1 * conditionFactor;
  const so2G = leafAreaM2 * 0.8 * conditionFactor;
  const pm25G = leafAreaM2 * 0.7 * conditionFactor;
  const coG = leafAreaM2 * 0.2 * conditionFactor;
  const totalPollutionLbs = (o3G + no2G + so2G + pm25G + coG) / 453.592;
  const pollutionValueUsd = pm25G / 1e6 * 15e4 + o3G / 1e6 * 4e3 + no2G / 1e6 * 2e3 + so2G / 1e6 * 3e3 + coG / 1e6 * 1e3;
  const proximityFactor = land_use === "Residential" ? 1 : land_use === "Commercial" ? 0.7 : 0.3;
  const coolingSavingsKwh = canopyCoverSqft * 0.15 * proximityFactor * conditionFactor * (crown_light_exposure / 5);
  const heatingSavingsTherms = canopyCoverSqft * 1e-3 * proximityFactor * conditionFactor;
  const energySavingsValueUsd = coolingSavingsKwh * 0.12 + heatingSavingsTherms * 1.2;
  const trunkAreaSqIn = Math.PI * (dbh_inches / 2) ** 2;
  const locationFactor = land_use === "Street" ? 0.9 : land_use === "Park" ? 0.8 : 0.75;
  const structuralValueUsd = trunkAreaSqIn * 75 * 0.7 * conditionFactor * locationFactor;
  const totalAnnualValueUsd = annualSeqValueUsd + avoidedRunoffValueUsd + pollutionValueUsd + energySavingsValueUsd;
  return {
    species_name,
    common_name,
    dbh_inches,
    canopy_cover_sqft: Math.round(canopyCoverSqft),
    carbon_storage_lbs: round13(carbonStorageLbs),
    carbon_storage_value_usd: round23(carbonStorageValueUsd),
    carbon_sequestration_lbs_yr: round13(annualSeqLbs),
    co2_equivalent_lbs_yr: round13(annualSeqLbs * 3.67),
    avoided_runoff_gallons_yr: Math.round(avoidedRunoffGal),
    pollution_removal_lbs_yr: round23(totalPollutionLbs),
    cooling_savings_kwh_yr: round13(coolingSavingsKwh),
    structural_value_usd: Math.round(structuralValueUsd),
    total_annual_benefits_usd: round23(totalAnnualValueUsd),
    projected_20yr_benefits_usd: Math.round(totalAnnualValueUsd * projection_years * 1.08)
  };
}
function toGeoJSONFeatureCollection(evaluatedRows = [], metadata = {}) {
  return {
    type: "FeatureCollection",
    name: metadata.name || "OpenArbor_Tree_Inventory",
    crs: {
      type: "name",
      properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" }
    },
    metadata: {
      generated_at: (/* @__PURE__ */ new Date()).toISOString(),
      standard: "OpenArbor v2.0 (ANSI A300 Part 5 / ISA BMP)",
      ...metadata
    },
    features: evaluatedRows.filter((r) => r.lat != null && r.lng != null).map((r) => ({
      type: "Feature",
      id: r.tag,
      geometry: {
        type: "Point",
        coordinates: [Number(r.lng), Number(r.lat)]
      },
      properties: {
        tag: r.tag,
        species: r.species,
        scientific: r.scientific,
        dbh_inches: r.dbh,
        protected: r.protected,
        heritage: r.heritage,
        excepted: r.excepted,
        removal: r.removal,
        crz_radius_ft: r.crz_ft,
        crz_area_sqft: r.crz_area,
        tpz_fence_radius_ft: r.fence_ft,
        condition_score: r.health,
        flags: r.flags
      }
    }))
  };
}

// web/crypto-shim.js
var K = new Uint32Array([
  1116352408,
  1899447441,
  3049323471,
  3921009573,
  961987163,
  1508970993,
  2453635748,
  2870763221,
  3624381080,
  310598401,
  607225278,
  1426881987,
  1925078388,
  2162078206,
  2614888103,
  3248222580,
  3835390401,
  4022224774,
  264347078,
  604807628,
  770255983,
  1249150122,
  1555081692,
  1996064986,
  2554220882,
  2821834349,
  2952996808,
  3210313671,
  3336571891,
  3584528711,
  113926993,
  338241895,
  666307205,
  773529912,
  1294757372,
  1396182291,
  1695183700,
  1986661051,
  2177026350,
  2456956037,
  2730485921,
  2820302411,
  3259730800,
  3345764771,
  3516065817,
  3600352804,
  4094571909,
  275423344,
  430227734,
  506948616,
  659060556,
  883997877,
  958139571,
  1322822218,
  1537002063,
  1747873779,
  1955562222,
  2024104815,
  2227730452,
  2361852424,
  2428436474,
  2756734187,
  3204031479,
  3329325298
]);
function rotr(n, x) {
  return x >>> n | x << 32 - n;
}
function sha256Hex(str) {
  const bytes = new TextEncoder().encode(String(str));
  const bitLen = bytes.length * 8;
  const totalBytes = Math.ceil((bytes.length + 9) / 64) * 64;
  const padded = new Uint8Array(totalBytes);
  padded.set(bytes);
  padded[bytes.length] = 128;
  const view = new DataView(padded.buffer);
  const highBits = Math.floor(bitLen / 4294967296);
  const lowBits = bitLen >>> 0;
  view.setUint32(totalBytes - 8, highBits, false);
  view.setUint32(totalBytes - 4, lowBits, false);
  let h0 = 1779033703;
  let h1 = 3144134277;
  let h2 = 1013904242;
  let h3 = 2773480762;
  let h4 = 1359893119;
  let h5 = 2600822924;
  let h6 = 528734635;
  let h7 = 1541459225;
  const w = new Uint32Array(64);
  for (let offset = 0; offset < totalBytes; offset += 64) {
    for (let i = 0; i < 16; i += 1) {
      w[i] = view.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 64; i += 1) {
      const s0 = rotr(7, w[i - 15]) ^ rotr(18, w[i - 15]) ^ w[i - 15] >>> 3;
      const s1 = rotr(17, w[i - 2]) ^ rotr(19, w[i - 2]) ^ w[i - 2] >>> 10;
      w[i] = w[i - 16] + s0 + w[i - 7] + s1 >>> 0;
    }
    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;
    for (let i = 0; i < 64; i += 1) {
      const S1 = rotr(6, e) ^ rotr(11, e) ^ rotr(25, e);
      const ch = e & f ^ ~e & g;
      const temp1 = h + S1 + ch + K[i] + w[i] >>> 0;
      const S0 = rotr(2, a) ^ rotr(13, a) ^ rotr(22, a);
      const maj = a & b ^ a & c ^ b & c;
      const temp2 = S0 + maj >>> 0;
      h = g;
      g = f;
      f = e;
      e = d + temp1 >>> 0;
      d = c;
      c = b;
      b = a;
      a = temp1 + temp2 >>> 0;
    }
    h0 = h0 + a >>> 0;
    h1 = h1 + b >>> 0;
    h2 = h2 + c >>> 0;
    h3 = h3 + d >>> 0;
    h4 = h4 + e >>> 0;
    h5 = h5 + f >>> 0;
    h6 = h6 + g >>> 0;
    h7 = h7 + h >>> 0;
  }
  return [h0, h1, h2, h3, h4, h5, h6, h7].map((v) => v.toString(16).padStart(8, "0")).join("");
}
function createHash(algorithm) {
  if (String(algorithm).toLowerCase() !== "sha256") {
    throw new Error(`Unsupported hash algorithm in browser shim: ${algorithm}`);
  }
  let buffer = "";
  return {
    update(data) {
      buffer += String(data);
      return this;
    },
    digest(encoding) {
      const hex = sha256Hex(buffer);
      if (!encoding || encoding === "hex") return hex;
      throw new Error(`Unsupported digest encoding in browser shim: ${encoding}`);
    }
  };
}
var crypto_shim_default = { createHash };

// src/core/rcaEngine.js
var round24 = (n) => Math.round(Number(n || 0) * 100) / 100;
var round14 = (n) => Math.round(Number(n || 0) * 10) / 10;
var OLC_CHARS = "23456789CFGHJMPQRVWX";
function decodePlusCode(code) {
  if (!code || typeof code !== "string") return null;
  const clean = code.replace("+", "").toUpperCase();
  if (clean.length < 2) return null;
  let lat = -90;
  let lng = -180;
  let latResolution = 20;
  let lngResolution = 20;
  for (let i = 0; i < Math.min(clean.length, 10); i += 2) {
    const latDigit = OLC_CHARS.indexOf(clean[i]);
    const lngDigit = OLC_CHARS.indexOf(clean[i + 1]);
    if (latDigit === -1 || lngDigit === -1) break;
    lat += latDigit * latResolution;
    lng += lngDigit * lngResolution;
    latResolution /= 20;
    lngResolution /= 20;
  }
  return {
    lat: round24(lat + latResolution * 10),
    lng: round24(lng + lngResolution * 10)
  };
}
function validateJsonSchema(instance, schema, path = "$") {
  const errors = [];
  if (!schema || typeof schema !== "object") {
    return { valid: true, errors };
  }
  if (schema.type) {
    const allowedTypes = Array.isArray(schema.type) ? schema.type : [schema.type];
    const checkType = (val, t) => {
      if (t === "null") return val === null;
      if (t === "array") return Array.isArray(val);
      if (t === "object") return typeof val === "object" && val !== null && !Array.isArray(val);
      if (t === "integer") return typeof val === "number" && Number.isInteger(val);
      if (t === "number") return typeof val === "number" && !Number.isNaN(val);
      return typeof val === t;
    };
    const matchesAny = allowedTypes.some((t) => checkType(instance, t));
    if (!matchesAny) {
      errors.push(`${path}: expected type ${allowedTypes.join("|")}, got ${instance === null ? "null" : Array.isArray(instance) ? "array" : typeof instance}`);
      return { valid: false, errors };
    }
  }
  if (instance === null || instance === void 0) {
    return { valid: errors.length === 0, errors };
  }
  if (schema.const !== void 0 && instance !== schema.const) {
    errors.push(`${path}: expected const ${JSON.stringify(schema.const)}, got ${JSON.stringify(instance)}`);
  }
  if (Array.isArray(schema.enum) && !schema.enum.includes(instance)) {
    errors.push(`${path}: value ${JSON.stringify(instance)} not in enum [${schema.enum.join(", ")}]`);
  }
  if (typeof instance === "number") {
    if (schema.minimum !== void 0 && instance < schema.minimum) {
      errors.push(`${path}: ${instance} is less than minimum ${schema.minimum}`);
    }
    if (schema.maximum !== void 0 && instance > schema.maximum) {
      errors.push(`${path}: ${instance} exceeds maximum ${schema.maximum}`);
    }
  }
  if (typeof instance === "string") {
    if (schema.minLength !== void 0 && instance.length < schema.minLength) {
      errors.push(`${path}: string length ${instance.length} is less than minLength ${schema.minLength}`);
    }
    if (schema.pattern) {
      const re = new RegExp(schema.pattern);
      if (!re.test(instance)) {
        errors.push(`${path}: string "${instance}" does not match pattern ${schema.pattern}`);
      }
    }
  }
  if (Array.isArray(instance)) {
    if (schema.minItems !== void 0 && instance.length < schema.minItems) {
      errors.push(`${path}: array length ${instance.length} is less than minItems ${schema.minItems}`);
    }
    if (schema.maxItems !== void 0 && instance.length > schema.maxItems) {
      errors.push(`${path}: array length ${instance.length} exceeds maxItems ${schema.maxItems}`);
    }
    if (Array.isArray(schema.prefixItems)) {
      schema.prefixItems.forEach((subSchema, idx) => {
        if (idx < instance.length) {
          const res = validateJsonSchema(instance[idx], subSchema, `${path}[${idx}]`);
          errors.push(...res.errors);
        }
      });
    }
    if (schema.contains) {
      const hasMatch = instance.some((item) => validateJsonSchema(item, schema.contains, path).valid);
      if (!hasMatch) {
        errors.push(`${path}: array does not contain required matching element`);
      }
    }
    if (schema.items && typeof schema.items === "object") {
      instance.forEach((item, idx) => {
        const res = validateJsonSchema(item, schema.items, `${path}[${idx}]`);
        errors.push(...res.errors);
      });
    }
  }
  if (typeof instance === "object" && !Array.isArray(instance)) {
    if (Array.isArray(schema.required)) {
      for (const reqKey of schema.required) {
        if (!Object.hasOwn(instance, reqKey) || instance[reqKey] === void 0) {
          errors.push(`${path}: missing required property '${reqKey}'`);
        }
      }
    }
    const props = schema.properties || {};
    for (const key of Object.keys(instance)) {
      if (Object.hasOwn(props, key)) {
        const res = validateJsonSchema(instance[key], props[key], `${path}.${key}`);
        errors.push(...res.errors);
      } else if (schema.additionalProperties === false) {
        errors.push(`${path}: un-schematized additional property '${key}' is forbidden (additionalProperties: false)`);
      } else if (typeof schema.additionalProperties === "object") {
        const res = validateJsonSchema(instance[key], schema.additionalProperties, `${path}.${key}`);
        errors.push(...res.errors);
      }
    }
  }
  return { valid: errors.length === 0, errors };
}
function evaluateBiomechanicsAndRhizosphere(assessment) {
  if (!assessment || typeof assessment !== "object") {
    throw new Error("assessment must be a valid object");
  }
  const structural = assessment.structural_baseline || {};
  const rhizosphere = assessment.rhizosphere_and_root_collar || {};
  const dbhCm = Number(structural.dbh_cm) || 0;
  if (dbhCm <= 0) {
    throw new Error("structural_baseline.dbh_cm must be > 0");
  }
  const dbhInches = dbhCm / 2.54;
  const radiusCm = dbhCm / 2;
  let tOverR = structural.sound_shell_thickness_ratio_t_over_r;
  if (tOverR == null) {
    tOverR = 1;
  }
  tOverR = Math.max(0, Math.min(1, Number(tOverR)));
  const soundShellCm = round14(tOverR * radiusCm);
  const isStructurallySound = tOverR >= 0.3;
  const stabilityRating = isStructurallySound ? "Structurally Sound (t/R >= 0.30 Mattheck Criterion Satisfied)" : "Critical Shell Thinning (t/R < 0.30 Elevated Buckling Risk)";
  const rootFlareDiaCm = Number(rhizosphere.root_flare_diameter_cm) || dbhCm * 1.2;
  const rootFlareDiaInches = rootFlareDiaCm / 2.54;
  const srz = calculateSRZ(rootFlareDiaInches, dbhInches);
  const crz = calculateCRZ(dbhInches, 1);
  const tizRadiusM = Number(rhizosphere.tiz_radius_m) || round24(crz.radius_meters * 1.5);
  const tizAreaSqm = round24(Math.PI * tizRadiusM ** 2);
  const airspade = rhizosphere.airspade_radial_trenching_geometry || {};
  const trenchCount = Number(airspade.trench_count) || 6;
  const trenchLengthM = Number(airspade.trench_length_m) || round24(crz.radius_meters * 0.75);
  const trenchWidthCm = Number(airspade.trench_width_cm) || 30;
  const trenchDepthCm = Number(airspade.trench_depth_cm) || 35;
  const rceRadiusM = Number(airspade.root_collar_excavation_radius_m) || 0.6;
  const burialDepthCm = Number(rhizosphere.root_flare_burial_depth_cm) || 15;
  const radialTrenchVolumeM3 = round24(trenchCount * trenchLengthM * (trenchWidthCm / 100) * (trenchDepthCm / 100));
  const rceVolumeM3 = round24(Math.PI * rceRadiusM ** 2 * (burialDepthCm / 100));
  const totalDecompactedVolumeM3 = round24(radialTrenchVolumeM3 + rceVolumeM3);
  const prechargedBiocharLiters = Math.round(totalDecompactedVolumeM3 * 1e3 * 0.08);
  const fungalCompostM3 = round24(totalDecompactedVolumeM3 * 0.15);
  const ramialWoodchipMulchM3 = round24(tizAreaSqm * 0.08);
  const fungalHumateKg = round24(totalDecompactedVolumeM3 * 1.5);
  const sgrCount = Number(rhizosphere.stem_girdling_root_count) || 0;
  const sgrSeverity = rhizosphere.stem_girdling_root_severity || "None";
  const estimatedConstrictionPct = sgrSeverity === "Severe_Over_50_Pct_Circumference" || sgrSeverity === "Severe" ? 60 : sgrSeverity === "Moderate_25_To_50_Pct_Circumference" || sgrSeverity === "Moderate" ? 35 : sgrSeverity === "Minor_Under_25_Pct_Circumference" || sgrSeverity === "Mild" || sgrSeverity === "Minor" ? 15 : 0;
  const vascularReliefRatio = sgrCount > 0 ? round24(estimatedConstrictionPct / 100) : 0;
  return {
    dbh_cm: dbhCm,
    dbh_inches: round24(dbhInches),
    biomechanics: {
      sound_shell_thickness_ratio_t_over_r: tOverR,
      sound_shell_cm: soundShellCm,
      trunk_radius_cm: round14(radiusCm),
      is_structurally_sound: isStructurallySound,
      mattheck_criterion_satisfied: isStructurallySound,
      stability_rating: stabilityRating,
      codit_wall_response_rating: structural.codit_wall_response_rating || "Intact Compartmentalization"
    },
    root_zones: {
      srz_radius_meters: srz.radius_meters,
      crz_radius_meters: crz.radius_meters,
      tiz_radius_meters: tizRadiusM,
      tiz_area_sqm: tizAreaSqm
    },
    rhizosphere_prescription: {
      operating_pressure_psi: airspade.operating_pressure_psi || 150,
      radial_trench_volume_m3: radialTrenchVolumeM3,
      root_collar_excavation_volume_m3: rceVolumeM3,
      total_decompacted_soil_m3: totalDecompactedVolumeM3,
      stem_girdling_root_count: sgrCount,
      stem_girdling_root_severity: sgrSeverity,
      vascular_constriction_relief_ratio: vascularReliefRatio,
      amendments: {
        precharged_biochar_liters: prechargedBiocharLiters,
        fungal_compost_m3: fungalCompostM3,
        ramial_woodchip_mulch_m3: ramialWoodchipMulchM3,
        fungal_humate_kg: fungalHumateKg
      }
    }
  };
}
function computeHolobiontValuation(assessment, options = {}) {
  if (!assessment || typeof assessment !== "object") {
    throw new Error("assessment must be a valid object");
  }
  const structural = assessment.structural_baseline || {};
  const rhizosphere = assessment.rhizosphere_and_root_collar || {};
  const dbhCm = Number(structural.dbh_cm) || 0;
  if (dbhCm <= 0) {
    throw new Error("structural_baseline.dbh_cm must be > 0");
  }
  const dbhInches = dbhCm / 2.54;
  const trunkAreaSqIn = Math.PI / 4 * dbhInches ** 2;
  const unitCostSqIn = Number(options.unit_cost_sq_in) || 75;
  const basicTreeCost = trunkAreaSqIn * unitCostSqIn;
  let ctlaConditionFactor = options.ctla_condition_factor;
  if (ctlaConditionFactor == null) {
    const tOverR = structural.sound_shell_thickness_ratio_t_over_r;
    if (tOverR != null) {
      ctlaConditionFactor = Math.min(0.85, Math.max(0.2, tOverR * 0.85));
    } else {
      ctlaConditionFactor = 0.5;
    }
  }
  ctlaConditionFactor = Number(ctlaConditionFactor);
  const ctlaLocationFactor = Number(options.ctla_location_factor ?? 0.8);
  const ctlaDepreciatedValueUsd = Math.round(basicTreeCost * ctlaConditionFactor * ctlaLocationFactor);
  const aboveGroundBiomassKg = Math.exp(-2.0773 + 2.3323 * Math.log(dbhCm));
  const totalBiomassKg = aboveGroundBiomassKg * 1.28 * 0.8;
  const carbonStorageKg = totalBiomassKg * 0.5;
  const carbonPricePerTon = Number(options.social_cost_carbon_usd_per_ton ?? 190);
  const carbonStorageEquityUsd = carbonStorageKg / 1e3 * carbonPricePerTon * 8;
  const crownSpreadM = ((Number(structural.crown_spread_ns_m) || 10) + (Number(structural.crown_spread_ew_m) || 10)) / 2;
  const canopyCoverSqm = Math.PI * (crownSpreadM / 2) ** 2;
  const annualStormwaterLiters = canopyCoverSqm * 6.5 * 18.5;
  const vadoseHydrologyEquityUsd = annualStormwaterLiters / 1e3 * 4.5 * 50;
  const tizRadiusM = Number(rhizosphere.tiz_radius_m) || dbhInches * 1.5 * 0.3048;
  const tizAreaSqm = Math.PI * tizRadiusM ** 2;
  const cmnRhizosphereEquityUsd = tizAreaSqm * 125;
  const baseBiologicalEquityUsd = carbonStorageEquityUsd + vadoseHydrologyEquityUsd + cmnRhizosphereEquityUsd;
  let habitatMultiplier = options.veteran_keystone_habitat_multiplier;
  if (habitatMultiplier == null) {
    if (dbhCm >= 100) {
      habitatMultiplier = 3.5;
    } else if (dbhCm >= 75) {
      habitatMultiplier = 2.5;
    } else if (dbhCm >= 50) {
      habitatMultiplier = 1.8;
    } else {
      habitatMultiplier = 1.2;
    }
  }
  habitatMultiplier = round24(Math.max(1, Math.min(5, Number(habitatMultiplier))));
  const holobiontEquityUsd = Math.round(baseBiologicalEquityUsd * habitatMultiplier);
  const valuationDeltaUsd = holobiontEquityUsd - ctlaDepreciatedValueUsd;
  const inversionRatio = round24(holobiontEquityUsd / Math.max(1, ctlaDepreciatedValueUsd));
  return {
    ctla_10th_ed_depreciated_usd: ctlaDepreciatedValueUsd,
    holobiont_200yr_biological_equity_usd: holobiontEquityUsd,
    veteran_keystone_habitat_multiplier: habitatMultiplier,
    valuation_delta_usd: valuationDeltaUsd,
    inversion_ratio: inversionRatio,
    breakdown: {
      basic_tree_cost_usd: Math.round(basicTreeCost),
      ctla_condition_factor: round24(ctlaConditionFactor),
      ctla_location_factor: round24(ctlaLocationFactor),
      carbon_storage_equity_usd: Math.round(carbonStorageEquityUsd),
      vadose_hydrology_equity_usd: Math.round(vadoseHydrologyEquityUsd),
      cmn_rhizosphere_equity_usd: Math.round(cmnRhizosphereEquityUsd),
      base_biological_equity_usd: Math.round(baseBiologicalEquityUsd)
    }
  };
}
function computeSanctuaryScorecardRollup(assessments, parcelAreaSqm = null) {
  if (!Array.isArray(assessments) || assessments.length === 0) {
    throw new Error("assessments must be a non-empty array of assessment objects");
  }
  const effectiveParcelAreaSqm = Number(parcelAreaSqm) > 0 ? Number(parcelAreaSqm) : 4047;
  const treesForUnion = assessments.map((a, idx) => {
    const structural = a.structural_baseline || {};
    const rhizosphere = a.rhizosphere_and_root_collar || {};
    let lat = structural.lat;
    let lng = structural.lng;
    if (lat == null || lng == null) {
      const decoded = decodePlusCode(structural.plus_code_global);
      if (decoded) {
        lat = decoded.lat;
        lng = decoded.lng;
      } else {
        lat = 30 + idx * 1e-4;
        lng = -98;
      }
    }
    const tizRadiusM = Number(rhizosphere.tiz_radius_m) || Number(structural.dbh_cm || 30) / 2.54 * 1.5 * 0.3048;
    const tizRadiusFt = tizRadiusM / 0.3048;
    return {
      lat,
      lng,
      crz_ft: tizRadiusFt,
      crz_area: Math.PI * tizRadiusFt ** 2
    };
  });
  const unionResult = unionRootZoneArea(treesForUnion);
  const unionTizAreaSqm = round24(unionResult.area_sqft * 0.092903);
  const overlapSavedSqm = round24(unionResult.overlap_saved_sqft * 0.092903);
  let totalWeightedSoilScore = 0;
  let totalWeight = 0;
  for (const a of assessments) {
    const soil = a.soil_and_microbiome_baseline || {};
    const myco = soil.mycorrhizal_and_fungal_observations || {};
    const tizRadiusM = Number(a.rhizosphere_and_root_collar?.tiz_radius_m) || 5;
    const treeWeight = Math.PI * tizRadiusM ** 2;
    const bulkDensity = Number(soil.bulk_density_g_cm3) || 1.35;
    const organicMatter = Number(soil.organic_matter_pct) || 3.5;
    const infiltration = Number(soil.infiltration_rate_mm_hr) || 30;
    const fbRatio = Number(
      myco.fungal_to_bacterial_biomass_ratio ?? soil.fungal_to_bacterial_biomass_ratio ?? 0.6
    );
    const bdScore = Math.max(0, Math.min(100, Math.round((1.7 - bulkDensity) / 0.65 * 100)));
    const omScore = Math.min(100, Math.round(organicMatter / 6 * 100));
    const infScore = Math.min(100, Math.round(infiltration / 60 * 100));
    const fbScore = Math.min(100, Math.round(Math.min(fbRatio, 2) / 1.5 * 100));
    const treeSoilScore = (bdScore + omScore + infScore + fbScore) / 4;
    totalWeightedSoilScore += treeSoilScore * treeWeight;
    totalWeight += treeWeight;
  }
  const soilHealthIndex = round14(totalWeight > 0 ? totalWeightedSoilScore / totalWeight : 50);
  let totalCanopyProjectionSqm = 0;
  for (const a of assessments) {
    const structural = a.structural_baseline || {};
    const ns = Number(structural.crown_spread_ns_m) || 8;
    const ew = Number(structural.crown_spread_ew_m) || 8;
    const liveCrownRatio = (Number(structural.live_crown_ratio_pct) || 70) / 100;
    const treeCanopySqm = Math.PI / 4 * ns * ew * liveCrownRatio;
    totalCanopyProjectionSqm += treeCanopySqm;
  }
  const canopyCoveragePct = totalCanopyProjectionSqm / effectiveParcelAreaSqm * 100;
  const canopyCoverageIndex = round14(Math.min(100, canopyCoveragePct / 40 * 100));
  const waterDynamicsIndex = round14(Math.min(100, soilHealthIndex * 0.6 + canopyCoverageIndex * 0.4));
  const uniqueTaxa = /* @__PURE__ */ new Set();
  for (const a of assessments) {
    const treeTaxon = a.evidence_tree_taxon_id || a.structural_baseline?.inaturalist_taxon_id;
    if (treeTaxon) uniqueTaxa.add(`tree_${treeTaxon}`);
    const soil = a.soil_and_microbiome_baseline || {};
    const myco = soil.mycorrhizal_and_fungal_observations || {};
    const observedFungi = myco.observed_fruiting_bodies_or_rhizomorphs || [];
    for (const f of observedFungi) {
      if (f && f.inaturalist_taxon_id) uniqueTaxa.add(`fungus_${f.inaturalist_taxon_id}`);
    }
    const legacyFungi = soil.dominant_fungal_taxa_inaturalist_ids || [];
    for (const t of legacyFungi) uniqueTaxa.add(`fungus_${t}`);
    const guild = a.understory_and_guild_prescription?.native_companion_species_guild || [];
    for (const g of guild) {
      if (g.inaturalist_taxon_id) uniqueTaxa.add(`guild_${g.inaturalist_taxon_id}`);
    }
  }
  const biodiversityBaselineIndex = round14(Math.min(100, uniqueTaxa.size / 15 * 100));
  let totalRestoration = 0;
  for (const a of assessments) {
    const targets = a.outcome_monitoring_schedule?.five_year_lagging_indicators?.sanctuary_scorecard_targets || a.outcome_monitoring_schedule?.sanctuary_scorecard_targets || {};
    const realized = Number(targets.restoration_potential_realized_pct) || 75;
    totalRestoration += realized;
  }
  const restorationPotentialScore = round14(totalRestoration / assessments.length);
  const compositeSanctuaryScore = round14(
    (soilHealthIndex + canopyCoverageIndex + waterDynamicsIndex + biodiversityBaselineIndex + restorationPotentialScore) / 5
  );
  let totalHolobiontEquityUsd = 0;
  let totalCtlaEquityUsd = 0;
  for (const a of assessments) {
    const val = computeHolobiontValuation(a);
    totalHolobiontEquityUsd += val.holobiont_200yr_biological_equity_usd;
    totalCtlaEquityUsd += val.ctla_10th_ed_depreciated_usd;
  }
  const totalValuationDeltaUsd = totalHolobiontEquityUsd - totalCtlaEquityUsd;
  return {
    total_assessed_trees: assessments.length,
    parcel_area_sqm: effectiveParcelAreaSqm,
    spatial_coverage: {
      union_tiz_area_sqm: unionTizAreaSqm,
      overlap_deduplicated_sqm: overlapSavedSqm,
      total_canopy_projection_sqm: round24(totalCanopyProjectionSqm),
      canopy_coverage_parcel_pct: round24(canopyCoveragePct)
    },
    sanctuary_scorecard: {
      soil_health_index: soilHealthIndex,
      canopy_coverage_index: canopyCoverageIndex,
      water_dynamics_index: waterDynamicsIndex,
      biodiversity_baseline_index: biodiversityBaselineIndex,
      restoration_potential_score: restorationPotentialScore,
      composite_sanctuary_score: compositeSanctuaryScore
    },
    ecological_equity: {
      total_holobiont_200yr_equity_usd: totalHolobiontEquityUsd,
      total_ctla_depreciated_usd: totalCtlaEquityUsd,
      total_valuation_delta_usd: totalValuationDeltaUsd,
      inversion_ratio: round24(totalHolobiontEquityUsd / Math.max(1, totalCtlaEquityUsd))
    }
  };
}
function lintRcaEvidentiaryReport(assessment) {
  if (!assessment || typeof assessment !== "object") {
    return {
      valid: false,
      errors: ["Assessment must be a non-null object"],
      warnings: [],
      passed_checks: []
    };
  }
  const errors = [];
  const warnings = [];
  const passedChecks = [];
  const requiredDomains = [
    "structural_baseline",
    "rhizosphere_and_root_collar",
    "soil_and_microbiome_baseline",
    "understory_and_guild_prescription",
    "outcome_monitoring_schedule"
  ];
  for (const domain of requiredDomains) {
    if (!assessment[domain] || typeof assessment[domain] !== "object") {
      errors.push(`MISSING_DOMAIN: Mandatory RCA diagnostic domain '${domain}' is missing or invalid`);
    } else {
      passedChecks.push(`Domain present: ${domain}`);
    }
  }
  const structural = assessment.structural_baseline || {};
  const rhizosphere = assessment.rhizosphere_and_root_collar || {};
  const permit = structural.municipal_permit_disposition || {};
  if (structural.dbh_cm == null || structural.dbh_cm <= 0) {
    errors.push("INVALID_BIOMETRICS: structural_baseline.dbh_cm must be a positive number");
  } else {
    passedChecks.push(`DBH verified: ${structural.dbh_cm} cm`);
  }
  if (!structural.plus_code_global || typeof structural.plus_code_global !== "string") {
    errors.push("INVALID_GEO_LOCATION: structural_baseline.plus_code_global must be a valid Plus Code");
  } else {
    passedChecks.push(`Location verified: ${structural.plus_code_global}`);
  }
  const disposition = permit.recommended_disposition;
  const tOverR = structural.sound_shell_thickness_ratio_t_over_r;
  if (disposition === "Removal_Last_Resort_Unmitigable_Hazard") {
    if (tOverR != null && tOverR >= 0.3) {
      errors.push(
        `UNJUSTIFIED_REMOVAL: Tree exhibits sound shell ratio t/R = ${tOverR} >= 0.30, satisfying Mattheck hollow-cylinder stability. Removal is prohibited when root collar decompression and crown reduction can mitigate target risk.`
      );
    } else {
      passedChecks.push("Removal candidate checked against Mattheck t/R threshold");
    }
    if (!structural.sonic_tomography_or_resistograph_uri) {
      errors.push(
        "EVIDENTIARY_DEFECT: Removal of a mature or protected tree requires acoustic tomogram or resistograph documentation in sonic_tomography_or_resistograph_uri."
      );
    } else {
      passedChecks.push("Advanced internal decay diagnostics verified");
    }
    const airspade = rhizosphere.airspade_radial_trenching_geometry || {};
    if (airspade.execution_status === "Not_Viable" && !airspade.notes) {
      warnings.push("Removal recommended but rhizosphere decompression non-viability lacks detailed technical justification notes.");
    }
  } else {
    passedChecks.push(`Preservation disposition confirmed: ${disposition || "Preservation_Primary"}`);
  }
  if (permit.seasonal_oak_wilt_restriction_active === true) {
    if (disposition === "Structural_Risk_Reduction_Pruning") {
      errors.push(
        "OAK_WILT_VIOLATION: Structural pruning is prohibited during active seasonal oak wilt vector restrictions (Ceratocystis fagacearum)."
      );
    } else {
      passedChecks.push("Seasonal oak wilt vector restrictions respected");
    }
  }
  const soil = assessment.soil_and_microbiome_baseline || {};
  if (soil.bulk_density_g_cm3 == null || soil.organic_matter_pct == null || soil.infiltration_rate_mm_hr == null) {
    errors.push("INCOMPLETE_SOIL_DATA: Soil baseline must include bulk_density_g_cm3, organic_matter_pct, and infiltration_rate_mm_hr.");
  } else {
    passedChecks.push("Rhizosphere soil baseline fully quantified");
  }
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    passed_checks: passedChecks
  };
}
function computeRegenerativePracticeEconomics(assessment, rates = {}) {
  const bio = evaluateBiomechanicsAndRhizosphere(assessment);
  const val = computeHolobiontValuation(assessment, rates);
  const guild = assessment.understory_and_guild_prescription?.native_companion_species_guild || [];
  const totalPlantedUnits = guild.reduce((sum, g) => sum + (Number(g.quantity_planted) || 0), 0);
  const dbhInches = bio.dbh_inches;
  const rx = bio.rhizosphere_prescription;
  const legacyRemovalGrossUsd = Math.round(Number(rates.base_removal_usd ?? 1100) + dbhInches * Number(rates.removal_per_dbh_inch_usd ?? 68));
  const legacyDirectAndLiabilityCostUsd = Math.round(legacyRemovalGrossUsd * 0.68);
  const legacyNetMarginUsd = legacyRemovalGrossUsd - legacyDirectAndLiabilityCostUsd;
  const legacyFiveYearRecurringUsd = 0;
  const year0DiagnosticFeeUsd = Math.round(Number(rates.diagnostic_report_fee_usd ?? 950));
  const airspadeTrenchingFeeUsd = Math.round(rx.total_decompacted_soil_m3 * Number(rates.airspade_per_m3_usd ?? 240));
  const sgrReliefFeeUsd = rx.stem_girdling_root_count > 0 ? Math.round(250 + rx.stem_girdling_root_count * 95) : 0;
  const amendmentsAndMulchFeeUsd = Math.round(
    rx.amendments.precharged_biochar_liters * 0.85 + rx.amendments.fungal_compost_m3 * 145 + rx.amendments.ramial_woodchip_mulch_m3 * 65 + rx.amendments.fungal_humate_kg * 12
  );
  const guildInstallationFeeUsd = Math.round(totalPlantedUnits * Number(rates.guild_plant_installed_usd ?? 28));
  const year0InstallationGrossUsd = airspadeTrenchingFeeUsd + sgrReliefFeeUsd + amendmentsAndMulchFeeUsd + guildInstallationFeeUsd;
  const year1AuditFeeUsd = Math.round(Number(rates.year_1_audit_fee_usd ?? 475));
  const year3RechargeFeeUsd = Math.round(Number(rates.year_3_recharge_fee_usd ?? 680) + rx.amendments.ramial_woodchip_mulch_m3 * 25);
  const year5CertificationFeeUsd = Math.round(Number(rates.year_5_certification_fee_usd ?? 750));
  const rcaYear0TotalUsd = year0DiagnosticFeeUsd + year0InstallationGrossUsd;
  const rcaRecurringTotalUsd = year1AuditFeeUsd + year3RechargeFeeUsd + year5CertificationFeeUsd;
  const rcaFiveYearGrossUsd = rcaYear0TotalUsd + rcaRecurringTotalUsd;
  const rcaDirectCostUsd = Math.round(rcaFiveYearGrossUsd * 0.45);
  const rcaNetMarginUsd = rcaFiveYearGrossUsd - rcaDirectCostUsd;
  const recurringRevenueSharePct = round14(rcaRecurringTotalUsd / rcaFiveYearGrossUsd * 100);
  const practitionerLtvAdvantageUsd = rcaFiveYearGrossUsd - legacyRemovalGrossUsd;
  const practitionerMarginAdvantageUsd = rcaNetMarginUsd - legacyNetMarginUsd;
  return {
    legacy_removal_model: {
      one_time_gross_bid_usd: legacyRemovalGrossUsd,
      direct_and_casualty_overhead_usd: legacyDirectAndLiabilityCostUsd,
      net_practitioner_margin_usd: legacyNetMarginUsd,
      five_year_recurring_revenue_usd: legacyFiveYearRecurringUsd,
      client_biological_equity_destroyed_usd: val.holobiont_200yr_biological_equity_usd
    },
    regenerative_stewardship_model: {
      year_0_diagnostic_fee_usd: year0DiagnosticFeeUsd,
      year_0_rhizosphere_and_guild_installation_usd: year0InstallationGrossUsd,
      year_1_leading_indicator_audit_usd: year1AuditFeeUsd,
      year_3_mycorrhizal_and_mulch_recharge_usd: year3RechargeFeeUsd,
      year_5_sanctuary_scorecard_verification_usd: year5CertificationFeeUsd,
      five_year_gross_revenue_usd: rcaFiveYearGrossUsd,
      direct_biological_and_field_cost_usd: rcaDirectCostUsd,
      net_practitioner_margin_usd: rcaNetMarginUsd,
      recurring_revenue_share_pct: recurringRevenueSharePct,
      client_biological_equity_preserved_usd: val.holobiont_200yr_biological_equity_usd
    },
    comparison: {
      practitioner_5yr_gross_advantage_usd: practitionerLtvAdvantageUsd,
      practitioner_5yr_net_margin_advantage_usd: practitionerMarginAdvantageUsd,
      margin_multiplier: round24(rcaNetMarginUsd / Math.max(1, legacyNetMarginUsd)),
      is_regenerative_more_profitable: rcaNetMarginUsd > legacyNetMarginUsd
    }
  };
}
function computeCanonicalSha256(obj) {
  const canonicalize = (val) => {
    if (Array.isArray(val)) return val.map(canonicalize);
    if (val && typeof val === "object") {
      const sorted = /* @__PURE__ */ Object.create(null);
      for (const k of Object.keys(val).sort()) {
        sorted[k] = canonicalize(val[k]);
      }
      return sorted;
    }
    return val;
  };
  const payload = JSON.stringify(canonicalize(obj));
  return crypto_shim_default.createHash("sha256").update(payload, "utf8").digest("hex");
}
function compileRcaEvidentiaryMarkdown(assessment, options = {}) {
  const lint = lintRcaEvidentiaryReport(assessment);
  const bio = evaluateBiomechanicsAndRhizosphere(assessment);
  const val = computeHolobiontValuation(assessment, options);
  const econ = computeRegenerativePracticeEconomics(assessment, options);
  const sha256 = computeCanonicalSha256(assessment);
  const structural = assessment.structural_baseline || {};
  const rhizosphere = assessment.rhizosphere_and_root_collar || {};
  const soil = assessment.soil_and_microbiome_baseline || {};
  const myco = soil.mycorrhizal_and_fungal_observations || {};
  const guild = assessment.understory_and_guild_prescription || {};
  const monitoring = assessment.outcome_monitoring_schedule || {};
  const y1 = monitoring.one_year_leading_indicators || {};
  const y5 = monitoring.five_year_lagging_indicators || {};
  const scTargets = y5.sanctuary_scorecard_targets || {};
  const coords = decodePlusCode(structural.plus_code_global) || { lat: 42.19, lng: -122.71 };
  const tag = structural.tree_tag || "RCA-TREE-01";
  const speciesSci = structural.species_scientific || "Quercus spp.";
  const speciesCommon = structural.species_common || "Mature Keystone Tree";
  const assessmentDate = structural.assessment_date || "2026-10-23";
  let ordinanceSection = "";
  let svgMap = "";
  if (options.municipality) {
    const invRow = evaluateTreeInventory(
      [
        {
          tag,
          species_common: speciesCommon,
          species_scientific: speciesSci,
          stems_inches: [bio.dbh_inches],
          lat: coords.lat,
          lng: coords.lng,
          condition_score: 8,
          removal: structural.municipal_permit_disposition?.recommended_disposition === "Removal_Last_Resort_Unmitigable_Hazard"
        }
      ],
      options.municipality
    );
    const permit = permitDetermination(invRow, options.municipality);
    const invRowIfRemoved = evaluateTreeInventory(
      [
        {
          tag,
          species_common: speciesCommon,
          species_scientific: speciesSci,
          stems_inches: [bio.dbh_inches],
          lat: coords.lat,
          lng: coords.lng,
          condition_score: 8,
          removal: true
        }
      ],
      options.municipality
    );
    const mitIfDestroyed = computeMitigationPlan(invRowIfRemoved, options.municipality);
    svgMap = renderSiteMapSVG(invRow);
    ordinanceSection = [
      `- **Jurisdiction:** ${options.municipality.name}, ${options.municipality.state} (\`${options.municipality.id}\`)`,
      `- **Statutory Authority:** ${options.municipality.ordinance_numbers}`,
      `- **Evaluated Tier:** ${invRow[0].heritage ? "Heritage" : invRow[0].protected ? "Protected" : "Unprotected"} (DBH: ${bio.dbh_inches} in)`,
      `- **Permit Determination:** ${permitSummary(permit)}`,
      `- **Mitigation Liability if Destroyed:** $${(mitIfDestroyed?.cash_in_lieu_usd || 0).toLocaleString()} cash-in-lieu (${mitIfDestroyed?.replacement_inches_owed || 0} replacement caliper inches)`
    ].join("\n");
  } else {
    const disp = structural.municipal_permit_disposition || {};
    ordinanceSection = [
      `- **Jurisdiction ID:** \`${disp.jurisdiction_id || "N/A"}\``,
      `- **Ordinance Citation:** ${disp.ordinance_citation || "N/A"}`,
      `- **Protection Tier:** ${disp.protection_tier || "N/A"}`,
      `- **Permit Required:** ${disp.permit_required ? "Yes" : "No"}`,
      `- **Recommended Disposition:** \`${disp.recommended_disposition || "Preservation_Primary"}\``
    ].join("\n");
  }
  const companionRows = (guild.native_companion_species_guild || []).map(
    (g) => `| *${g.scientific_name}* (${g.common_name}) | \`${g.inaturalist_taxon_id}\` | \`${g.stratum_layer}\` | \`${g.functional_role}\` | ${g.quantity_planted} |`
  ).join("\n");
  const markdown = [
    `# Open Arbor Regenerative Diagnostic & Evidentiary Report (${assessment.schema_version || "RCA_v2"})`,
    ``,
    `- **Report Cryptographic Digest (SHA-256):** \`${sha256}\``,
    `- **Assessment Date:** \`${assessmentDate}\``,
    `- **Tree Identifier:** \`${tag}\` (*${speciesSci}*, ${speciesCommon})`,
    `- **Global Plus Code:** \`${structural.plus_code_global}\` (Lat: ${coords.lat}, Lng: ${coords.lng})`,
    `- **Evidentiary Linter Status:** ${lint.valid ? "PASS (Conflict-Free Preservation Verified)" : `FAIL (${lint.errors.length} Violation(s))`}`,
    ``,
    `## 1. Executive Disposition & Biometric Baseline`,
    `- **Diameter at Breast Height (1.37 m):** ${bio.dbh_cm} cm (${bio.dbh_inches} inches)`,
    `- **Total Height & Crown Spread:** ${structural.height_m} m height; ${structural.crown_spread_ns_m} m (N-S) x ${structural.crown_spread_ew_m} m (E-W); Live Crown Ratio: ${structural.live_crown_ratio_pct}%`,
    `- **Recommended Disposition:** \`${structural.municipal_permit_disposition?.recommended_disposition}\``,
    `- **ISA TRAQ Baseline:** ${structural.isa_traq_risk?.assessment_level}, Overall Risk: \`${structural.isa_traq_risk?.overall_risk_rating}\`, Residual Risk Post-Remediation: \`${structural.isa_traq_risk?.residual_risk_rating || "Low"}\``,
    ``,
    `## 2. Classical Biomechanics: Mattheck Shell-Wall Physics & Shigo CODIT`,
    `| Biomechanical Parameter | Measured Value | Threshold / Standard | Diagnostic Finding |`,
    `| :--- | :--- | :--- | :--- |`,
    `| **Sound Wood Shell Ratio (t/R)** | \`${bio.biomechanics.sound_shell_thickness_ratio_t_over_r}\` (${bio.biomechanics.sound_shell_cm} cm shell / ${bio.biomechanics.trunk_radius_cm} cm radius) | \`t/R >= 0.30\` (Mattheck, 1994) | ${bio.biomechanics.stability_rating} |`,
    `| **Shigo CODIT Response** | \`${bio.biomechanics.codit_wall_response_rating}\` | Walls 1 to 4 Compartmentalization | Active reaction wood barrier zone |`,
    `| **Structural Root Zone (SRZ)** | \`${bio.root_zones.srz_radius_meters} m\` radius | AS 4970 / Mattheck Windthrow | Mechanical root-plate stability zone |`,
    `| **Critical Root Zone (CRZ)** | \`${bio.root_zones.crz_radius_meters} m\` radius | ANSI A300 Part 5 (1 ft / in DBH) | Statutory root protection zone |`,
    `| **Tree Influence Zone (TIZ)** | \`${bio.root_zones.tiz_radius_meters} m\` radius (${bio.root_zones.tiz_area_sqm} m2) | RCA-Spec v2.0 Holobiont Footprint | Subterranean mycorrhizal catchment |`,
    ``,
    `## 3. Municipal Ordinance & Statutory Compliance`,
    ordinanceSection,
    ``,
    `## 4. Subterranean Rhizosphere & Pneumatic Root-Collar Forensics`,
    `- **Root Flare Burial Depth:** ${rhizosphere.root_flare_burial_depth_cm} cm below grade (Root Flare Diameter: ${rhizosphere.root_flare_diameter_cm} cm)`,
    `- **Stem-Girdling Roots (SGR):** ${bio.rhizosphere_prescription.stem_girdling_root_count} root(s), Severity: \`${bio.rhizosphere_prescription.stem_girdling_root_severity}\` (Vascular Constriction Relief Ratio: ${bio.rhizosphere_prescription.vascular_constriction_relief_ratio})`,
    `- **Supersonic AirSpade Geometry:** ${rhizosphere.airspade_radial_trenching_geometry?.trench_count} radial trenches (${rhizosphere.airspade_radial_trenching_geometry?.trench_length_m} m length x ${rhizosphere.airspade_radial_trenching_geometry?.trench_width_cm} cm width x ${rhizosphere.airspade_radial_trenching_geometry?.trench_depth_cm} cm depth at ${bio.rhizosphere_prescription.operating_pressure_psi} psi)`,
    `- **Total Decompacted Soil Volume:** ${bio.rhizosphere_prescription.total_decompacted_soil_m3} m3 (${bio.rhizosphere_prescription.radial_trench_volume_m3} m3 radial trenches + ${bio.rhizosphere_prescription.root_collar_excavation_volume_m3} m3 root collar basin)`,
    ``,
    `## 5. Soil Physics & Mycorrhizal Microbiome Baseline`,
    `- **Dry Bulk Density (0-15 cm):** ${soil.bulk_density_g_cm3} g/cm3 (Penetrometer Resistance: ${soil.penetrometer_resistance_psi ?? "N/A"} psi)`,
    `- **Steady-State Water Infiltration Rate:** ${soil.infiltration_rate_mm_hr} mm/hr`,
    `- **Soil Organic Matter & pH:** ${soil.organic_matter_pct}% SOM; pH ${soil.soil_ph}`,
    `- **Mycorrhizal Guild & F:B Ratio:** \`${myco.dominant_mycorrhizal_guild}\`; Fungal-to-Bacterial Ratio: \`${myco.fungal_to_bacterial_biomass_ratio}\`; Status: \`${myco.hyphal_colonization_status}\``,
    `- **Laboratory Provenance:** Sample \`${soil.lab_sample_id || "N/A"}\` (${soil.lab_panel_url})`,
    ``,
    `## 6. Nodal Biological Amendment & Native Companion Guild Prescription`,
    `- **Reference Ecosystem (SER Principle 3):** ${guild.reference_ecosystem_name}`,
    `- **Engine-Scaled Amendment Bill of Materials:** ${bio.rhizosphere_prescription.amendments.precharged_biochar_liters} L pre-charged biochar; ${bio.rhizosphere_prescription.amendments.fungal_compost_m3} m3 fungal compost; ${bio.rhizosphere_prescription.amendments.fungal_humate_kg} kg humic acid; ${bio.rhizosphere_prescription.amendments.ramial_woodchip_mulch_m3} m3 coarse ramial woodchip mulch`,
    `- **Synthetic NPK & Fungicide Exclusion Verified:** ${guild.synthetic_npk_and_fungicide_exclusion_verified ? "Yes (Zero synthetic salts or systemic fungicides)" : "No"}`,
    ``,
    `| Companion Species | iNaturalist Taxon ID | Stratum Layer | Functional Role | Quantity |`,
    `| :--- | :--- | :--- | :--- | :--- |`,
    companionRows,
    ``,
    `## 7. Dual Asset Valuation: CTLA 10th Ed. vs. 200-Year Holobiont Biological Equity`,
    `| Valuation Model | Computed Value (USD) | Treatment of Veteran Hollow Architecture |`,
    `| :--- | :--- | :--- |`,
    `| **Classical CTLA 10th Edition (Depreciated)** | **$${val.ctla_10th_ed_depreciated_usd.toLocaleString()}** | Penalizes trunk decay via condition factor (${val.breakdown.ctla_condition_factor}) |`,
    `| **Regenerative Holobiont Biological Equity (200-Yr)** | **$${val.holobiont_200yr_biological_equity_usd.toLocaleString()}** | Appreciates via Veteran Keystone Habitat Multiplier (\`${val.veteran_keystone_habitat_multiplier}x\`) |`,
    `| **Biological Equity Delta (Inversion Ratio \`${val.inversion_ratio}x\`)** | **+$${val.valuation_delta_usd.toLocaleString()}** | Carbon ($${val.breakdown.carbon_storage_equity_usd.toLocaleString()}) + Hydrology ($${val.breakdown.vadose_hydrology_equity_usd.toLocaleString()}) + CMN Soil ($${val.breakdown.cmn_rhizosphere_equity_usd.toLocaleString()}) |`,
    ``,
    `## 8. 5-Year Practice Economics: Stewardship vs. Liquidation`,
    `- **Legacy Contractor Removal Bid (One-Time Liquidation):** $${econ.legacy_removal_model.one_time_gross_bid_usd.toLocaleString()} gross / $${econ.legacy_removal_model.net_practitioner_margin_usd.toLocaleString()} net margin ($0 recurring; destroys $${econ.legacy_removal_model.client_biological_equity_destroyed_usd.toLocaleString()} in living equity)`,
    `- **RCA 5-Year Regenerative Stewardship Program:** $${econ.regenerative_stewardship_model.five_year_gross_revenue_usd.toLocaleString()} gross / **$${econ.regenerative_stewardship_model.net_practitioner_margin_usd.toLocaleString()} net margin** (${econ.regenerative_stewardship_model.recurring_revenue_share_pct}% recurring revenue; **${econ.comparison.margin_multiplier}x** net margin advantage over tree removal)`,
    ``,
    `## 9. STIM Longitudinal Monitoring Schedule & Sanctuary Scorecard Targets`,
    `- **STIM Hypothesis:** ${monitoring.stim_hypothesis_statement}`,
    `- **STIM Kill Criterion:** ${monitoring.stim_kill_criterion}`,
    `- **Year-1 Audit (${y1.scheduled_reinspection_date}):** Max dieback <= ${y1.target_canopy_dieback_max_pct}%, min twig extension >= ${y1.target_annual_twig_extension_min_cm} cm, callus closure >= ${y1.target_woundwood_callus_closure_mm_yr} mm/yr, guild survival >= ${y1.companion_guild_survival_min_pct}%`,
    `- **Year-5 Audit (${y5.scheduled_audit_date}):** Bulk density <= ${y5.target_bulk_density_max_g_cm3} g/cm3, infiltration >= ${y5.target_infiltration_rate_min_mm_hr} mm/hr, SOM >= ${y5.target_organic_matter_min_pct}%, F:B ratio >= ${y5.target_fungal_to_bacterial_ratio_min}, SER Recovery Wheel: ${y5.target_ser_recovery_wheel_stars} stars, Soil Health Index: ${scTargets.soil_health_index_baseline_score} -> ${scTargets.soil_health_index_target_score}`,
    ``,
    svgMap ? `## 10. Vector Root-Zone Protection Site Map (SVG)

${svgMap}
` : `## 10. Evidentiary Verification Summary

All ${lint.passed_checks.length} evidentiary checks verified.`
  ].join("\n");
  return {
    markdown,
    sha256,
    lint,
    biomechanics: bio,
    valuation: val,
    economics: econ
  };
}
function compilePreservationCounterNotice(assessment, options = {}) {
  const bio = evaluateBiomechanicsAndRhizosphere(assessment);
  const val = computeHolobiontValuation(assessment, options);
  const sha256 = computeCanonicalSha256(assessment);
  const structural = assessment.structural_baseline || {};
  const disp = structural.municipal_permit_disposition || {};
  const tOverR = bio.biomechanics.sound_shell_thickness_ratio_t_over_r;
  const canPreserve = tOverR >= 0.3;
  const tag = structural.tree_tag || "RCA-TREE-01";
  const speciesSci = structural.species_scientific || "Quercus spp.";
  const speciesCommon = structural.species_common || "Mature Keystone Tree";
  const noticeMarkdown = [
    `# SCIENTIFIC PRESERVATION & BIOMECHANICAL COUNTER-NOTICE`,
    ``,
    `- **Subject Tree:** \`${tag}\` (*${speciesSci}*, ${speciesCommon}) at Plus Code \`${structural.plus_code_global}\``,
    `- **Diameter at Breast Height:** ${bio.dbh_cm} cm (${bio.dbh_inches} in) | **Root Flare Diameter:** ${assessment.rhizosphere_and_root_collar?.root_flare_diameter_cm} cm`,
    `- **Statutory Protection Authority:** ${disp.ordinance_citation} (Tier: \`${disp.protection_tier}\`, Permit Required: \`${disp.permit_required}\`)`,
    `- **Cryptographic Evidence Hash (SHA-256):** \`${sha256}\``,
    ``,
    `## 1. Biomechanical Refutation of Unjustified Removal`,
    canPreserve ? `Conventional removal bids frequently cite internal heartwood cavities to justify liquidating mature trees. Under Claus Mattheck's hollow-cylinder buckling criterion (*The Body Language of Trees*, 1994; 2007), a hollow trunk retains full mechanical bending strength against windthrow provided the ratio of sound outer shell thickness ($t$) to trunk radius ($R$) satisfies $t/R \\ge 0.30$.` : `Warning: Measured sound shell ratio $t/R = ${tOverR} < 0.30$ indicates advanced shell thinning requiring Level 3 sonic tomography and crown load reduction evaluation.`,
    ``,
    `- **Measured Sound Shell Thickness ($t$):** ${bio.biomechanics.sound_shell_cm} cm`,
    `- **Measured Trunk Radius ($R$):** ${bio.biomechanics.trunk_radius_cm} cm`,
    `- **Computed $t/R$ Ratio:** **\`${tOverR}\`** (${canPreserve ? "Exceeds 0.30 Mattheck safety threshold; hollow shell is structurally stable" : "Below 0.30 threshold"})`,
    `- **Shigo CODIT Status:** \`${bio.biomechanics.codit_wall_response_rating}\``,
    ``,
    `## 2. Conflict-of-Interest Disclosure & Fiduciary Asset Warning`,
    `Tree service contractors who bid on tree removal and timber liquidation hold a direct financial conflict of interest when diagnosing tree risk. Liquidating this specimen destroys **$${val.holobiont_200yr_biological_equity_usd.toLocaleString()}** in 200-year Holobiont Biological Equity ($${val.ctla_10th_ed_depreciated_usd.toLocaleString()} classical CTLA 10th Edition depreciated value; **${val.inversion_ratio}x** ecological valuation inversion).`,
    ``,
    `## 3. Prescribed Non-Destructive Alternative (ANSI A300 & RCA-Spec v2.0)`,
    `Rather than irreversible removal, risk and vascular stress are mitigated through:`,
    `1. **Supersonic Pneumatic Decompaction:** ${bio.rhizosphere_prescription.total_decompacted_soil_m3} m3 of radial AirSpade trenching and root-collar excavation at ${bio.rhizosphere_prescription.operating_pressure_psi} psi without severing fine feeder roots.`,
    `2. **Biogeochemical Inoculation:** Backfilling with ${bio.rhizosphere_prescription.amendments.precharged_biochar_liters} L pre-charged biochar, ${bio.rhizosphere_prescription.amendments.fungal_compost_m3} m3 fungal compost, ${bio.rhizosphere_prescription.amendments.fungal_humate_kg} kg humic acid, and ${bio.rhizosphere_prescription.amendments.ramial_woodchip_mulch_m3} m3 coarse ramial woodchip mulch across the ${bio.root_zones.tiz_area_sqm} m2 Tree Influence Zone.`,
    `3. **Longitudinal Verification:** 12-month and 60-month STIM outcome monitoring.`
  ].join("\n");
  return {
    can_preserve: canPreserve,
    notice_markdown: noticeMarkdown,
    t_over_r: tOverR,
    equity_saved_usd: val.holobiont_200yr_biological_equity_usd
  };
}
function mintOpenBadgeAttestation(practitioner, assessments, rcaAssessmentSchema = null) {
  if (!Array.isArray(assessments) || assessments.length !== 3) {
    throw new Error("mintOpenBadgeAttestation requires exactly 3 RCA diagnostic assessment records");
  }
  const reportHashes = [];
  const evidenceItems = [];
  assessments.forEach((assessment, idx) => {
    if (rcaAssessmentSchema) {
      const schemaCheck = validateJsonSchema(assessment, rcaAssessmentSchema);
      if (!schemaCheck.valid) {
        throw new Error(`Assessment #${idx + 1} failed schema validation: ${schemaCheck.errors.join("; ")}`);
      }
    }
    const lint = lintRcaEvidentiaryReport(assessment);
    if (!lint.valid) {
      throw new Error(`Assessment #${idx + 1} failed evidentiary linter: ${lint.errors.join("; ")}`);
    }
    const hash = computeCanonicalSha256(assessment);
    reportHashes.push(hash);
    const sb = assessment.structural_baseline || {};
    const guild = assessment.understory_and_guild_prescription?.native_companion_species_guild || [];
    const taxonId = sb.inaturalist_taxon_id || guild[0]?.inaturalist_taxon_id || 49005;
    evidenceItems.push({
      id: `https://soilgrower.com/reports/rca-v2/report-00${idx + 1}-${hash.slice(0, 8)}.json`,
      type: ["Evidence", "RCADiagnosticReportEvidence"],
      name: `${sb.species_scientific || "Quercus"} Rhizosphere & Holobiont Diagnostic #${idx + 1} (${sb.plus_code_global})`,
      conforms_to_schema: "https://soilgrower.com/schemas/openarbor-rca-assessment.schema.json",
      schema_version: assessment.schema_version || "RCA_v2",
      report_sha256_hash: hash,
      assessment_date: sb.assessment_date || "2026-10-23",
      plus_code_global: sb.plus_code_global,
      inaturalist_taxon_id: taxonId,
      conflict_free_preservation_verified: true
    });
  });
  const issuedAt = practitioner.validFrom || "2026-10-23T00:00:00Z";
  const validUntil = practitioner.validUntil || "2027-10-23T00:00:00Z";
  const milestoneDate = practitioner.year_1_recovery_milestone_target_date || assessments[0]?.outcome_monitoring_schedule?.one_year_leading_indicators?.scheduled_reinspection_date || "2027-10-23";
  const credentialSubject = {
    id: practitioner.id || "did:web:soilgrower.com:stewards:practitioner",
    type: ["AchievementSubject"],
    practitioner_name: practitioner.practitioner_name || "Verified RCA Practitioner",
    nature_first_competency_proof: {
      diagnostic_report_hashes_sha256: reportHashes,
      field_rhizosphere_verification: {
        root_collar_airspade_verified: true,
        biological_amendment_verified: true,
        soil_biology_assessment_present: true
      },
      longitudinal_monitoring_commitment: {
        stim_monitoring_protocol_active: true,
        year_1_recovery_milestone_target_date: milestoneDate
      }
    },
    achievement: {
      id: "https://soilgrower.com/specs/rca-spec-v2.0",
      type: ["Achievement"],
      name: "Regenerative Consulting Arborist (RCA-Spec v2.0)",
      description: "Attests that the practitioner diagnoses and manages woody perennials as nested holobionts across the five mandatory domains of RCA-Spec v2.0.",
      achievementType: "Competency",
      criteria: {
        id: "https://soilgrower.com/specs/rca-spec-v2.0#tier-2-attestation-criteria",
        narrative: "Requires nature-first proof of stewardship (3 machine-validated RCA diagnostic reports, field rhizosphere verification, longitudinal monitoring commitment) with optional legacy guild equivalencies."
      },
      governance_and_fee_benchmark: {
        specification_license: "CC-BY-SA-4.0",
        schema_license: "AGPL-3.0-or-later",
        optional_annual_registry_fee_band_min_usd: 75,
        optional_annual_registry_fee_band_max_usd: 110,
        benchmark_citations: [
          "Society for Ecological Restoration CERP ($75/year member maintenance fee)",
          "NOFA Accredited Organic Land Care Professional AOLCP ($110/year reaccreditation fee)"
        ],
        payment_flow_encoded: false
      }
    }
  };
  if (practitioner.legacy_statutory_equivalencies) {
    credentialSubject.legacy_statutory_equivalencies = practitioner.legacy_statutory_equivalencies;
  }
  const badgePayload = {
    "@context": [
      "https://www.w3.org/ns/credentials/v2",
      "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json"
    ],
    id: practitioner.credential_id || `https://soilgrower.com/credentials/rca-verified/${reportHashes[0].slice(0, 12)}`,
    type: ["VerifiableCredential", "OpenBadgeCredential"],
    name: "Verified Regenerative Consulting Arborist (RCA-Verified)",
    issuer: {
      id: "https://soilgrower.com/issuers/open-arbor-alliance",
      type: ["Profile"],
      name: "Open Arbor Alliance",
      url: "https://soilgrower.com"
    },
    validFrom: issuedAt,
    validUntil,
    credentialSubject,
    evidence: evidenceItems
  };
  const proofDigest = computeCanonicalSha256(badgePayload);
  badgePayload.proof = {
    type: "DataIntegrityProof",
    cryptosuite: "sha256-integrity",
    created: issuedAt,
    verificationMethod: "https://soilgrower.com/specs/rca-spec-v2.0#sha256-content-digest",
    proofPurpose: "assertionMethod",
    proofValue: `sha256:${proofDigest}`
  };
  return badgePayload;
}

// data/ordinances/central_texas_ordinances.json
var central_texas_ordinances_default = {
  dataset_version: "2.0.0",
  region: "Central Texas (Edwards Plateau & Blackland Prairie Corridors)",
  standard: "OpenArbor Municipal Tree Protection Ordinance Schema v2.0",
  municipalities: [
    {
      id: "tx-austin",
      name: "Austin",
      state: "TX",
      coordinates: { lat: 30.2672, lng: -97.7431 },
      ordinance_numbers: "City of Austin Land Development Code (LDC) Title 25, Chapter 25-8, Subchapter B (Tree and Natural Area Protection); Environmental Criteria Manual (ECM) Section 3",
      source_url: "https://library.municode.com/tx/austin/codes/code_of_ordinances?nodeId=TIT25LADE_CH25-8EN",
      dbh_threshold_inches: 19,
      heritage_threshold_inches: 24,
      heritage_species_thresholds: {
        "Quercus virginiana (Live Oak)": 24,
        "Quercus buckleyi (Texas Red Oak)": 24,
        "Carya illinoinensis (Pecan)": 24,
        "Ulmus americana (American Elm)": 24,
        "Ulmus crassifolia (Cedar Elm)": 24,
        "Taxodium distichum (Bald Cypress)": 24,
        "Acer grandidentatum (Bigtooth Maple)": 24
      },
      excepted_species: [
        "Celtis occidentalis (Hackberry)",
        "Melia azedarach (Chinaberry)",
        "Triadica sebifera (Chinese Tallow)",
        "Ligustrum lucidum (Glossy Privet)",
        "Ailanthus altissima (Tree of Heaven)"
      ],
      permit_triggers_by_work_type: {
        protected: ["removal", "pruning"],
        heritage: ["removal", "pruning"],
        citation: "Austin LDC \xA7 25-8-604 / ECM Section 3.5"
      },
      mitigation_fee_schedule: {
        citation: "Austin LDC \xA7 25-8-643 / ECM Appendix P-6",
        exemption_pct: 0,
        heritage_rate_per_inch: 600,
        heritage_replacement_ratio: 3,
        penalty_civil_per_tree: 500,
        penalty_citation: "Austin LDC \xA7 25-8-644",
        tiers: [
          { min_dbh: 8, max_dbh: 18.9, rate_per_inch: 100, replacement_ratio: 0.5 },
          { min_dbh: 19, max_dbh: 23.9, rate_per_inch: 200, replacement_ratio: 1 },
          { min_dbh: 24, max_dbh: null, rate_per_inch: 600, replacement_ratio: 3 }
        ]
      },
      plan_rules: {
        survey: {
          citation: "Austin ECM \xA7 3.3.2",
          hardwood_min_dbh: 8,
          max_age_years: 5,
          multi_trunk: "largest_plus_half",
          multi_trunk_text: "Multi-trunk DBH is calculated as the diameter of the largest stem plus 50% of each additional stem."
        },
        root_zone: {
          citation: "Austin ECM \xA7 3.5.2",
          crz_ft_per_inch: 1,
          crz_min_ft: 10,
          removal_if_disturbed_pct: 50,
          cutfill_max_in: 4,
          impervious_max_pct: 25,
          crown_removal_max_pct: 25
        },
        pruning: {
          citation: "Austin ECM \xA7 3.5.4 (Oak Wilt Prevention)",
          standard: "ANSI A300 Part 1",
          oak_months: [7, 8, 9, 10, 11, 12, 1],
          oak_text: "To prevent spread of Ceratocystis fagacearum (Oak Wilt), non-emergency pruning of Live Oaks and Red Oaks is restricted from February 1 through June 30; all wounds must be painted immediately."
        }
      }
    },
    {
      id: "tx-georgetown",
      name: "Georgetown",
      state: "TX",
      coordinates: { lat: 30.6333, lng: -97.678 },
      ordinance_numbers: "Georgetown Unified Development Code (UDC) Chapter 8 (Tree Preservation, Landscaping, and Fencing)",
      source_url: "https://library.municode.com/tx/georgetown/codes/unified_development_code?nodeId=UNDECO_CH8TRPRLAFE",
      dbh_threshold_inches: 12,
      heritage_threshold_inches: 26,
      heritage_species_thresholds: {
        "Quercus virginiana (Live Oak)": 26,
        "Quercus macrocarpa (Bur Oak)": 26,
        "Quercus muehlenbergii (Chinquapin Oak)": 26,
        "Quercus stellata (Post Oak)": 26,
        "Carya illinoinensis (Pecan)": 26,
        "Ulmus crassifolia (Cedar Elm)": 26,
        "Taxodium distichum (Bald Cypress)": 26
      },
      excepted_species: [
        "Celtis laevigata (Sugarberry / Hackberry)",
        "Juniperus ashei (Ashe Juniper)",
        "Melia azedarach (Chinaberry)",
        "Prosopis glandulosa (Honey Mesquite)"
      ],
      permit_triggers_by_work_type: {
        protected: ["removal"],
        heritage: ["removal", "pruning"],
        citation: "Georgetown UDC \xA7 8.02"
      },
      mitigation_fee_schedule: {
        citation: "Georgetown UDC \xA7 8.02.050",
        exemption_pct: 0,
        heritage_rate_per_inch: 300,
        heritage_replacement_ratio: 3,
        penalty_civil_per_tree: 500,
        penalty_citation: "Georgetown UDC \xA7 8.02.070",
        tiers: [
          { min_dbh: 12, max_dbh: 25.9, rate_per_inch: 150, replacement_ratio: 1 },
          { min_dbh: 26, max_dbh: null, rate_per_inch: 300, replacement_ratio: 3 }
        ]
      },
      plan_rules: {
        survey: {
          citation: "Georgetown UDC \xA7 8.02.020",
          hardwood_min_dbh: 12,
          max_age_years: 3,
          multi_trunk: "largest_plus_half"
        },
        root_zone: {
          citation: "Georgetown UDC \xA7 8.02.040",
          crz_ft_per_inch: 1,
          crz_min_ft: 12,
          removal_if_disturbed_pct: 50,
          cutfill_max_in: 4,
          impervious_max_pct: 25,
          crown_removal_max_pct: 25
        },
        pruning: {
          citation: "Georgetown UDC \xA7 8.02.040 (Oak Wilt Prevention)",
          standard: "ANSI A300 Part 1",
          oak_months: [7, 8, 9, 10, 11, 12, 1]
        }
      }
    },
    {
      id: "tx-liberty-hill",
      name: "Liberty Hill",
      state: "TX",
      coordinates: { lat: 30.6653, lng: -97.925 },
      ordinance_numbers: "Liberty Hill Unified Development Code (UDC) \xA7 6.07.01 (Tree Preservation and Mitigation), Ord. 09-O-02 / 22-O-04.06-01",
      source_url: "https://ecode360.com/42969054",
      dbh_threshold_inches: 8,
      heritage_threshold_inches: 24,
      heritage_species_thresholds: {
        "Quercus virginiana (Live Oak)": 24,
        "Quercus buckleyi (Red Oak)": 24,
        "Quercus macrocarpa (Bur Oak)": 24,
        "Carya illinoinensis (Pecan)": 24,
        "Ulmus crassifolia (Cedar Elm)": 24
      },
      excepted_species: [
        "Celtis occidentalis (Hackberry)",
        "Juniperus ashei (Ashe Juniper / Mountain Cedar)",
        "Melia azedarach (Chinaberry)",
        "Prosopis glandulosa (Mesquite)",
        "Ailanthus altissima (Tree of Heaven)"
      ],
      permit_triggers_by_work_type: {
        protected: ["removal"],
        heritage: ["removal", "pruning"],
        citation: "Liberty Hill UDC \xA7 6.07.01(c)"
      },
      mitigation_fee_schedule: {
        citation: "Liberty Hill UDC \xA7 6.07.01(c)(5)",
        exemption_pct: 20,
        exemption_citation: "Liberty Hill UDC \xA7 6.07.01(c)(5)(B)",
        heritage_rate_per_inch: 300,
        heritage_replacement_ratio: 3,
        penalty_civil_per_tree: 1e3,
        penalty_citation: "Liberty Hill UDC \xA7 6.07.01(d)",
        tiers: [
          { min_dbh: 8, max_dbh: 18.9, rate_per_inch: 150, replacement_ratio: 1 },
          { min_dbh: 19, max_dbh: 23.9, rate_per_inch: 225, replacement_ratio: 2 },
          { min_dbh: 24, max_dbh: null, rate_per_inch: 300, replacement_ratio: 3 }
        ]
      },
      plan_rules: {
        survey: {
          citation: "Liberty Hill UDC \xA7 6.07.01(b)",
          hardwood_min_dbh: 8,
          max_age_years: 2,
          multi_trunk: "largest_plus_half"
        },
        root_zone: {
          citation: "Liberty Hill UDC \xA7 6.07.01(c)(3)",
          crz_ft_per_inch: 1,
          crz_min_ft: 10,
          removal_if_disturbed_pct: 30,
          cutfill_max_in: 4,
          impervious_max_pct: 20,
          crown_removal_max_pct: 25
        },
        mitigation: {
          retained_credit: {
            citation: "Liberty Hill UDC \xA7 6.07.01(c)(5)(D)",
            min_dbh: 6,
            max_dbh: 7.9,
            ratio: 0.5
          }
        },
        pruning: {
          citation: "Liberty Hill UDC \xA7 6.07.01(c)(4)",
          standard: "ANSI A300 Part 1",
          oak_months: [10, 11, 12, 1]
        }
      }
    },
    {
      id: "tx-cedar-park",
      name: "Cedar Park",
      state: "TX",
      coordinates: { lat: 30.5052, lng: -97.8203 },
      ordinance_numbers: "Cedar Park Code of Ordinances Chapter 14, Article 14.07 (Tree and Landscape Regulations)",
      source_url: "https://ecode360.com/38618389",
      dbh_threshold_inches: 8,
      heritage_threshold_inches: 26,
      excepted_species: [
        "Celtis occidentalis (Hackberry)",
        "Juniperus ashei (Ashe Juniper)",
        "Melia azedarach (Chinaberry)"
      ],
      mitigation_fee_schedule: {
        citation: "Cedar Park Code \xA7 14.07.006",
        exemption_pct: 0,
        heritage_rate_per_inch: 450,
        heritage_replacement_ratio: 3,
        tiers: [
          { min_dbh: 8, max_dbh: 18.9, rate_per_inch: 150, replacement_ratio: 1 },
          { min_dbh: 19, max_dbh: 25.9, rate_per_inch: 300, replacement_ratio: 2 },
          { min_dbh: 26, max_dbh: null, rate_per_inch: 450, replacement_ratio: 3 }
        ]
      }
    },
    {
      id: "tx-round-rock",
      name: "Round Rock",
      state: "TX",
      coordinates: { lat: 30.5083, lng: -97.6789 },
      ordinance_numbers: "Round Rock Code of Ordinances Part III, Chapter 8, Article I (Tree Protection and Preservation)",
      source_url: "https://library.municode.com/tx/round_rock/codes/code_of_ordinances",
      dbh_threshold_inches: 8,
      heritage_threshold_inches: 36,
      heritage_species_thresholds: {
        "Quercus virginiana (Live Oak)": 36,
        "Carya illinoinensis (Pecan)": 36,
        "Ulmus crassifolia (Cedar Elm)": 30
      },
      excepted_species: [
        "Celtis laevigata (Hackberry)",
        "Juniperus ashei (Ashe Juniper)",
        "Melia azedarach (Chinaberry)",
        "Prosopis glandulosa (Mesquite)"
      ],
      mitigation_fee_schedule: {
        citation: "Round Rock Code \xA7 8-19",
        exemption_pct: 0,
        heritage_rate_per_inch: 300,
        heritage_replacement_ratio: 3,
        tiers: [
          { min_dbh: 8, max_dbh: 19.9, rate_per_inch: 150, replacement_ratio: 1 },
          { min_dbh: 20, max_dbh: null, rate_per_inch: 300, replacement_ratio: 3 }
        ]
      }
    }
  ]
};

// data/ordinances/rogue_valley_oregon_ordinances.json
var rogue_valley_oregon_ordinances_default = {
  dataset_version: "2.0.0",
  region: "Rogue Valley, Southern Oregon (Jackson & Josephine Counties)",
  standard: "OpenArbor Municipal Tree Protection Ordinance Schema v2.0",
  municipalities: [
    {
      id: "or-ashland",
      name: "Ashland",
      state: "OR",
      coordinates: { lat: 42.1946, lng: -122.7095 },
      ordinance_numbers: "Ashland Municipal Code (AMC) Chapter 18.4.5 (Tree Preservation and Protection), Chapter 18.5.7 (Tree Removal Permits), and AMC 18.3.10.090.D (Hillside Development)",
      source_url: "https://ashland.municipal.codes/AMC/18.4.5",
      dbh_threshold_inches: 6,
      heritage_threshold_inches: 18,
      heritage_species_thresholds: {
        "Quercus garryana (Oregon White Oak)": 18,
        "Quercus kelloggii (California Black Oak)": 18,
        "Pinus ponderosa (Ponderosa Pine)": 18,
        "Arbutus menziesii (Pacific Madrone)": 12
      },
      excepted_species: [
        "Ailanthus altissima (Tree of Heaven)",
        "Robinia pseudoacacia (Black Locust)",
        "Populus nigra (Lombardy Poplar)"
      ],
      permit_triggers_by_work_type: {
        protected: ["removal"],
        heritage: ["removal", "pruning"],
        citation: "AMC \xA7 18.5.7.020 / AMC \xA7 18.4.5.030"
      },
      mitigation_fee_schedule: {
        citation: "AMC \xA7 18.5.7.060 Mitigation and Replacement",
        exemption_pct: 0,
        heritage_rate_per_inch: 150,
        heritage_replacement_ratio: 2,
        penalty_civil_per_tree: 1e3,
        penalty_citation: "AMC \xA7 18.5.7.090 Enforcement",
        tiers: [
          { min_dbh: 6, max_dbh: 17.9, rate_per_inch: 75, replacement_ratio: 1 },
          { min_dbh: 18, max_dbh: null, rate_per_inch: 150, replacement_ratio: 2 }
        ]
      },
      plan_rules: {
        survey: {
          citation: "AMC \xA7 18.4.5.030.B Tree Inventory Requirements",
          hardwood_min_dbh: 6,
          max_age_years: 2,
          multi_trunk: "quadratic",
          multi_trunk_text: "Multi-trunk trees calculate equivalent DBH via quadratic mean root sum of squares."
        },
        root_zone: {
          citation: "AMC \xA7 18.4.5.030.C Tree Protection Zone Specifications",
          crz_ft_per_inch: 1,
          crz_min_ft: 5,
          removal_if_disturbed_pct: 25,
          cutfill_max_in: 3,
          impervious_max_pct: 20,
          crown_removal_max_pct: 25
        },
        pruning: {
          citation: "AMC \xA7 18.4.5.040 Performance Standards",
          standard: "ANSI A300 Part 1 / ISA Best Management Practices"
        }
      }
    },
    {
      id: "or-medford",
      name: "Medford",
      state: "OR",
      coordinates: { lat: 42.3265, lng: -122.8756 },
      ordinance_numbers: "Medford Municipal Code (MMC) Sections 6.700 to 6.750 (Public and Street Trees); Medford Land Development Code (MLDC) \xA7 10.780 (Landscaping); City of Medford Tree Protection Guidelines (April 2026)",
      source_url: "https://medford.municipal.codes/MMC/6.700",
      dbh_threshold_inches: 8,
      heritage_threshold_inches: 24,
      heritage_species_thresholds: {
        "Quercus garryana (Oregon White Oak)": 20,
        "Quercus kelloggii (California Black Oak)": 20,
        "Pinus ponderosa (Ponderosa Pine)": 24
      },
      excepted_species: [
        "Ulmus pumila (Siberian Elm)",
        "Ailanthus altissima (Tree of Heaven)"
      ],
      permit_triggers_by_work_type: {
        protected: ["removal"],
        heritage: ["removal", "pruning"],
        citation: "MMC \xA7 6.725 (Street Trees) / MLDC \xA7 10.780 (Commercial Development)"
      },
      mitigation_fee_schedule: {
        citation: "MMC \xA7 6.740 Street Tree Replacement / April 2026 Guidelines",
        exemption_pct: 0,
        heritage_rate_per_inch: 100,
        heritage_replacement_ratio: 2,
        penalty_civil_per_tree: 500,
        penalty_citation: "MMC \xA7 6.750 Violations",
        tiers: [
          { min_dbh: 8, max_dbh: 23.9, rate_per_inch: 50, replacement_ratio: 1 },
          { min_dbh: 24, max_dbh: null, rate_per_inch: 100, replacement_ratio: 2 }
        ]
      },
      plan_rules: {
        survey: {
          citation: "Medford April 2026 Guidelines Section 3.a",
          hardwood_min_dbh: 8,
          max_age_years: 2,
          multi_trunk: "quadratic",
          multi_trunk_text: "Multi-trunk DBH calculated via quadratic mean."
        },
        root_zone: {
          citation: "Medford April 2026 Guidelines Section 4",
          crz_ft_per_inch: 1,
          crz_min_ft: 6,
          removal_if_disturbed_pct: 30,
          cutfill_max_in: 4,
          impervious_max_pct: 25,
          crown_removal_max_pct: 25
        },
        pruning: {
          citation: "MMC \xA7 6.730 Public Tree Maintenance",
          standard: "ANSI A300 Part 1 Pruning"
        }
      }
    },
    {
      id: "or-grants-pass",
      name: "Grants Pass",
      state: "OR",
      coordinates: { lat: 42.439, lng: -123.3284 },
      ordinance_numbers: "City of Grants Pass Development Code (Title 10) Article 13 (Tree Retention and Canopy Re-establishment, revised May 3, 2023); Article 23 (Street Trees \xA7 23.071 and \xA7 23.074)",
      source_url: "https://www.grantspassoregon.gov/181/Development-Code",
      dbh_threshold_inches: 8,
      heritage_threshold_inches: 20,
      heritage_species_thresholds: {
        "Quercus garryana (Oregon White Oak)": 18,
        "Pinus ponderosa (Ponderosa Pine)": 20,
        "Pseudotsuga menziesii (Douglas Fir)": 24
      },
      excepted_species: [
        "Ailanthus altissima (Tree of Heaven)",
        "Robinia pseudoacacia (Black Locust)"
      ],
      permit_triggers_by_work_type: {
        protected: ["removal"],
        heritage: ["removal", "pruning"],
        citation: "Grants Pass Development Code Art. 13 \xA7 13.030 (Subdivisions) / Art. 23 \xA7 23.074 (Street Trees)"
      },
      mitigation_fee_schedule: {
        citation: "Grants Pass Development Code Art. 13 \xA7 13.040 Canopy Re-establishment Schedule",
        exemption_pct: 0,
        heritage_rate_per_inch: 120,
        heritage_replacement_ratio: 2,
        penalty_civil_per_tree: 750,
        penalty_citation: "Grants Pass Municipal Code \xA7 1.36.010 General Penalty",
        tiers: [
          { min_dbh: 8, max_dbh: 19.9, rate_per_inch: 60, replacement_ratio: 1 },
          { min_dbh: 20, max_dbh: null, rate_per_inch: 120, replacement_ratio: 2 }
        ]
      },
      plan_rules: {
        survey: {
          citation: "Grants Pass Development Code Art. 13 \xA7 13.032 Tree Inventory Submittal",
          hardwood_min_dbh: 8,
          max_age_years: 2,
          multi_trunk: "quadratic",
          multi_trunk_text: "Multi-trunk DBH calculated via quadratic mean."
        },
        root_zone: {
          citation: "Grants Pass Development Code Art. 13 \xA7 13.034 Protection Specifications",
          crz_ft_per_inch: 1,
          crz_min_ft: 6,
          removal_if_disturbed_pct: 25,
          cutfill_max_in: 3,
          impervious_max_pct: 20,
          crown_removal_max_pct: 25
        },
        pruning: {
          citation: "Grants Pass Development Code \xA7 23.071 Street Tree Pruning",
          standard: "ANSI A300 / ISA BMP"
        }
      }
    }
  ]
};

// schemas/rca_assessment.schema.json
var rca_assessment_schema_default = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://soilgrower.com/schemas/openarbor-rca-assessment.schema.json",
  title: "Open Arbor Regenerative Consulting Arborist (RCA-Spec v2.0) Assessment Schema",
  description: "AGPL v3 JSON Schema for the Assessments.data_json column when assessment_type is 'Regenerative Diagnostic' (supporting RCA_v1 and RCA_v2). Enforces typed, unit-explicit field capture across the five mandatory diagnostic domains of Regenerative Consulting Arboriculture, absorbing Shigo CODIT, Mattheck t/R shell mechanics, and Holobiont Living Asset Equity.",
  type: "object",
  additionalProperties: false,
  required: [
    "schema_version",
    "assessment_mode",
    "structural_baseline",
    "rhizosphere_and_root_collar",
    "soil_and_microbiome_baseline",
    "understory_and_guild_prescription",
    "outcome_monitoring_schedule"
  ],
  properties: {
    schema_version: {
      type: "string",
      enum: ["RCA_v1", "RCA_v2"],
      description: "Identifier for the Regenerative Consulting Arborist Practice Specification version (unit: version string)."
    },
    assessment_mode: {
      type: "string",
      const: "Regenerative Diagnostic",
      description: "Required discriminator matching Assessments.assessment_type in 09_FEATURE_BRIEF_ASSESSMENT_FORMS.md (unit: enum string)."
    },
    structural_baseline: {
      type: "object",
      description: "Domain 1: Above-ground biometric inventory, ISA TRAQ risk matrix fields, and municipal tree protection ordinance disposition.",
      additionalProperties: false,
      required: [
        "dbh_cm",
        "is_multistem",
        "height_m",
        "crown_spread_ns_m",
        "crown_spread_ew_m",
        "live_crown_ratio_pct",
        "plus_code_global",
        "isa_traq_risk",
        "municipal_permit_disposition"
      ],
      properties: {
        dbh_cm: {
          type: "number",
          minimum: 0.1,
          maximum: 1500,
          description: "Final calculated Diameter at Breast Height measured at 1.37 m above grade (unit: centimeters)."
        },
        is_multistem: {
          type: "boolean",
          description: "True if the tree forks below 1.37 m into multiple measurable stems (unit: boolean)."
        },
        stem_diameters_cm: {
          type: "array",
          items: {
            type: "number",
            minimum: 0.1,
            maximum: 1500
          },
          description: "Individual stem diameters measured at 1.37 m when is_multistem is true (unit: centimeters)."
        },
        multistem_aggregation_method: {
          type: "string",
          enum: ["quadratic", "largest_plus_half", "sum", "single_stem"],
          description: "Formula used to aggregate stem_diameters_cm into dbh_cm per src/core/rootZone.js (unit: enum string)."
        },
        height_m: {
          type: "number",
          minimum: 0.1,
          maximum: 150,
          description: "Total vertical tree height from root flare grade to highest live crown tip (unit: meters)."
        },
        crown_spread_ns_m: {
          type: "number",
          minimum: 0.1,
          maximum: 150,
          description: "Canopy dripline diameter along the North-South axis (unit: meters)."
        },
        crown_spread_ew_m: {
          type: "number",
          minimum: 0.1,
          maximum: 150,
          description: "Canopy dripline diameter along the East-West axis (unit: meters)."
        },
        live_crown_ratio_pct: {
          type: "number",
          minimum: 0,
          maximum: 100,
          description: "Ratio of live photosynthetic crown height to total tree height (unit: percent)."
        },
        plus_code_global: {
          type: "string",
          pattern: "^[23456789CFGHJMPQRVWX]{8}\\+[23456789CFGHJMPQRVWX]{2,7}$",
          description: "Open Location Code (Plus Code) pinpointing stem coordinates (unit: 10-to-15 character Plus Code string)."
        },
        tree_tag: {
          type: "string",
          minLength: 1,
          description: "Optional field tag or inventory identifier for the assessed tree (unit: tag string)."
        },
        species_scientific: {
          type: "string",
          minLength: 1,
          description: "Optional botanical binomial of the assessed host tree (unit: Latin binomial string)."
        },
        species_common: {
          type: "string",
          minLength: 1,
          description: "Optional regional common name of the assessed host tree (unit: string)."
        },
        inaturalist_taxon_id: {
          type: "integer",
          minimum: 1,
          description: "Optional iNaturalist taxon ID of the assessed host tree (unit: integer ID)."
        },
        assessment_date: {
          type: "string",
          format: "date",
          description: "Optional ISO 8601 date of the field diagnostic assessment (unit: YYYY-MM-DD date)."
        },
        isa_traq_risk: {
          type: "object",
          description: "International Society of Arboriculture Tree Risk Assessment Qualification (TRAQ) Level 2/3 risk matrix fields.",
          additionalProperties: false,
          required: [
            "assessment_level",
            "time_frame_years",
            "target_zone_description",
            "likelihood_of_failure",
            "likelihood_of_impact",
            "likelihood_of_failure_and_impact",
            "consequences_of_failure",
            "overall_risk_rating"
          ],
          properties: {
            assessment_level: {
              type: "string",
              enum: ["Level_1_Limited_Visual", "Level_2_Basic", "Level_3_Advanced"],
              description: "ANSI A300 Part 9 / ISA TRAQ inspection level (unit: enum string)."
            },
            time_frame_years: {
              type: "number",
              minimum: 0.5,
              maximum: 10,
              description: "Specified period over which likelihood of failure is evaluated (unit: years)."
            },
            target_zone_description: {
              type: "string",
              minLength: 1,
              description: "People, property, or infrastructure within striking distance and occupancy rate (unit: narrative string)."
            },
            primary_tree_part_of_concern: {
              type: "string",
              enum: ["Whole_Tree", "Root_Plate", "Root_Collar", "Trunk_Stem", "Codominant_Union", "Scaffold_Branch", "Perimeter_Branch"],
              description: "Structural component governing the highest risk rating (unit: enum string)."
            },
            likelihood_of_failure: {
              type: "string",
              enum: ["Improbable", "Possible", "Probable", "Imminent"],
              description: "ISA TRAQ Matrix 1 row: probability of structural failure within time_frame_years (unit: TRAQ enum)."
            },
            likelihood_of_impact: {
              type: "string",
              enum: ["Very Low", "Low", "Medium", "High"],
              description: "ISA TRAQ Matrix 1 column: probability of impacting the target zone if failure occurs (unit: TRAQ enum)."
            },
            likelihood_of_failure_and_impact: {
              type: "string",
              enum: ["Unlikely", "Somewhat Likely", "Likely", "Very Likely"],
              description: "ISA TRAQ Matrix 1 combined output cell (unit: TRAQ enum)."
            },
            consequences_of_failure: {
              type: "string",
              enum: ["Negligible", "Minor", "Significant", "Severe"],
              description: "ISA TRAQ Matrix 2 column: severity of harm or damage upon impact (unit: TRAQ enum)."
            },
            overall_risk_rating: {
              type: "string",
              enum: ["Low", "Moderate", "High", "Extreme"],
              description: "ISA TRAQ Matrix 2 final risk rating (unit: TRAQ enum)."
            },
            residual_risk_rating: {
              type: "string",
              enum: ["None", "Low", "Moderate", "High", "Extreme"],
              description: "Projected risk rating following prescribed regenerative or structural intervention (unit: TRAQ enum)."
            }
          }
        },
        municipal_permit_disposition: {
          type: "object",
          description: "Statutory compliance mapping aligned with schemas/municipal-ordinance.schema.json.",
          additionalProperties: false,
          required: [
            "jurisdiction_id",
            "ordinance_citation",
            "protection_tier",
            "permit_required",
            "recommended_disposition",
            "seasonal_oak_wilt_restriction_active"
          ],
          properties: {
            jurisdiction_id: {
              type: "string",
              pattern: "^([a-z]{2}-[a-z0-9-]+|unincorporated)$",
              description: "Municipality identifier matching data/ordinances/ records or 'unincorporated' (unit: slug string)."
            },
            ordinance_citation: {
              type: "string",
              minLength: 1,
              description: "Statutory chapter and section governing the tree (e.g., 'Austin LDC 25-8', 'Ashland AMC 18.4.5', 'Medford Tree Protection Guidelines 2026') (unit: legal citation string)."
            },
            protection_tier: {
              type: "string",
              enum: ["Unprotected", "Excepted_Species", "Protected", "Legacy", "Heritage"],
              description: "Ordinance classification evaluated from DBH and species (unit: enum string)."
            },
            permit_required: {
              type: "boolean",
              description: "True if a municipal tree preservation, encroachment, or removal permit is required (unit: boolean)."
            },
            recommended_disposition: {
              type: "string",
              enum: [
                "Preservation_Primary",
                "Preservation_With_Rhizosphere_Remediation",
                "Monitored_Retained_Habitat_Snag",
                "Structural_Risk_Reduction_Pruning",
                "Removal_Last_Resort_Unmitigable_Hazard"
              ],
              description: "Conflict-free RCA disposition prioritizing biological asset preservation over removal (unit: enum string)."
            },
            seasonal_oak_wilt_restriction_active: {
              type: "boolean",
              description: "True if the tree is in genus Quercus and falls within prohibited Ceratocystis fagacearum vector months (unit: boolean)."
            }
          }
        },
        codit_wall_response_rating: {
          type: "string",
          description: "Shigo CODIT (Compartmentalization of Decay in Trees) diagnostic response evaluation across Walls 1 to 4 (unit: rating string)."
        },
        sound_shell_thickness_ratio_t_over_r: {
          type: "number",
          minimum: 0,
          maximum: 1,
          description: "Mattheck sound wood shell thickness to trunk radius ratio (t/R). Values >= 0.30 indicate full hollow-cylinder bending strength against windthrow (unit: dimensionless ratio 0.0 to 1.0)."
        },
        sonic_tomography_or_resistograph_uri: {
          type: "string",
          format: "uri-reference",
          description: "URI or relative path to PiCUS sonic tomogram, IML resistograph trace, or acoustic scan image documenting internal decay (unit: URI string)."
        },
        dual_valuation: {
          type: "object",
          description: "Post-ISA/ASCA dual appraisal contrasting classical CTLA 10th Edition depreciated cost against Regenerative Holobiont Biological Equity.",
          additionalProperties: false,
          required: [
            "ctla_10th_ed_depreciated_usd",
            "holobiont_200yr_biological_equity_usd",
            "veteran_keystone_habitat_multiplier"
          ],
          properties: {
            ctla_10th_ed_depreciated_usd: {
              type: "number",
              minimum: 0,
              description: "Classical CTLA 10th Edition Trunk Formula depreciated valuation (unit: US dollars)."
            },
            holobiont_200yr_biological_equity_usd: {
              type: "number",
              minimum: 0,
              description: "Regenerative Holobiont Living Asset Equity valuing biomass carbon, vadose zone hydrology, and mycorrhizal network value with habitat multiplier (unit: US dollars)."
            },
            veteran_keystone_habitat_multiplier: {
              type: "number",
              minimum: 1,
              maximum: 5,
              description: "Ecological keystone and saproxylic habitat value multiplier (1.0 = standard, 1.5-3.5 = veteran hollow keystone tree) (unit: scalar multiplier)."
            },
            valuation_delta_usd: {
              type: "number",
              description: "Difference between holobiont living asset equity and CTLA depreciated value (unit: US dollars)."
            }
          }
        }
      }
    },
    rhizosphere_and_root_collar: {
      type: "object",
      description: "Domain 2: Subterranean root-collar architecture, stem-girdling root forensics, pneumatic AirSpade geometry, and root zone radii.",
      additionalProperties: false,
      required: [
        "root_flare_burial_depth_cm",
        "root_flare_diameter_cm",
        "stem_girdling_root_count",
        "stem_girdling_root_severity",
        "airspade_radial_trenching_geometry",
        "crz_radius_m",
        "srz_radius_m",
        "tiz_radius_m"
      ],
      properties: {
        root_flare_burial_depth_cm: {
          type: "number",
          minimum: 0,
          maximum: 200,
          description: "Depth of soil, fill, or excess mulch burying the primary structural root flare below grade; 0 indicates flare visible at grade (unit: centimeters)."
        },
        root_flare_diameter_cm: {
          type: "number",
          minimum: 0.1,
          maximum: 2500,
          description: "Basal trunk diameter at the root flare (DRF) used in the AS 4970 / Mattheck SRZ equation (unit: centimeters)."
        },
        stem_girdling_root_count: {
          type: "integer",
          minimum: 0,
          maximum: 100,
          description: "Number of distinct stem-girdling or primary buttress-compressing roots identified during root collar inspection (unit: integer count)."
        },
        stem_girdling_root_severity: {
          type: "string",
          enum: [
            "None",
            "Minor_Under_25_Pct_Circumference",
            "Moderate_25_To_50_Pct_Circumference",
            "Severe_Over_50_Pct_Circumference"
          ],
          description: "Proportion of trunk circumference compressed by stem-girdling roots (unit: severity enum)."
        },
        airspade_radial_trenching_geometry: {
          type: "object",
          description: "Supersonic pneumatic excavation (AirSpade) diagnostic and decompaction geometry.",
          additionalProperties: false,
          required: [
            "execution_status",
            "operating_pressure_psi",
            "trench_count",
            "trench_length_m",
            "trench_width_cm",
            "trench_depth_cm",
            "root_collar_excavation_radius_m"
          ],
          properties: {
            execution_status: {
              type: "string",
              enum: [
                "Diagnostic_Excavation_Completed",
                "Prescribed_Radial_Remediation",
                "Completed_Diagnostic_And_Radial_Remediation",
                "Not_Required_Uncompacted_Forest_Floor"
              ],
              description: "Whether pneumatic excavation was executed during diagnosis, prescribed, or both (unit: enum string)."
            },
            operating_pressure_psi: {
              type: "number",
              minimum: 0,
              maximum: 250,
              description: "Supersonic nozzle air pressure calibrated to avoid periderm stripping on fine roots (unit: pounds per square inch)."
            },
            trench_count: {
              type: "integer",
              minimum: 0,
              maximum: 64,
              description: "Number of radial decompaction spokes extending from the outer root collar toward the dripline (unit: integer count)."
            },
            trench_length_m: {
              type: "number",
              minimum: 0,
              maximum: 50,
              description: "Mean radial length of each pneumatic trench (unit: meters)."
            },
            trench_width_cm: {
              type: "number",
              minimum: 0,
              maximum: 100,
              description: "Mean width of each pneumatic trench (unit: centimeters)."
            },
            trench_depth_cm: {
              type: "number",
              minimum: 0,
              maximum: 100,
              description: "Mean excavation depth breaking through the anaerobic compaction pan (unit: centimeters)."
            },
            root_collar_excavation_radius_m: {
              type: "number",
              minimum: 0,
              maximum: 10,
              description: "Radius of the circular root-collar decompaction basin around the trunk base (unit: meters)."
            }
          }
        },
        crz_radius_m: {
          type: "number",
          minimum: 0.5,
          maximum: 100,
          description: "Critical Root Zone radius computed per municipal or ANSI A300 standard (unit: meters)."
        },
        srz_radius_m: {
          type: "number",
          minimum: 0.5,
          maximum: 50,
          description: "Structural Root Zone radius computed via AS 4970 / Mattheck windthrow equation (unit: meters)."
        },
        tiz_radius_m: {
          type: "number",
          minimum: 0.5,
          maximum: 200,
          description: "Tree Influence Zone radius encompassing the canopy dripline, lateral feeder roots, mycorrhizal network, and micro-hydrologic catchment (unit: meters)."
        }
      }
    },
    soil_and_microbiome_baseline: {
      type: "object",
      description: "Domain 3: Quantitative physical, chemical, and biological rhizosphere metrics.",
      additionalProperties: false,
      required: [
        "bulk_density_g_cm3",
        "infiltration_rate_mm_hr",
        "organic_matter_pct",
        "soil_ph",
        "lab_panel_url",
        "mycorrhizal_and_fungal_observations"
      ],
      properties: {
        bulk_density_g_cm3: {
          type: "number",
          minimum: 0.1,
          maximum: 2.65,
          description: "Dry soil bulk density in the top 0 to 15 cm feeder-root horizon (unit: grams per cubic centimeter)."
        },
        penetrometer_resistance_psi: {
          type: ["number", "null"],
          minimum: 0,
          maximum: 1e3,
          description: "Soil compaction resistance to root penetration at 15 cm depth; root-limiting threshold typically near 300 psi (unit: pounds per square inch)."
        },
        infiltration_rate_mm_hr: {
          type: "number",
          minimum: 0,
          maximum: 2e3,
          description: "Steady-state water infiltration rate measured via ring infiltrometer inside the TIZ (unit: millimeters per hour)."
        },
        organic_matter_pct: {
          type: "number",
          minimum: 0,
          maximum: 100,
          description: "Soil organic matter concentration by dry weight (unit: percent)."
        },
        soil_ph: {
          type: "number",
          minimum: 2,
          maximum: 11,
          description: "Rhizosphere soil pH in 1:1 or 1:2 water suspension (unit: pH units)."
        },
        lab_panel_url: {
          type: "string",
          format: "uri",
          description: "URI pointing to the primary laboratory analysis report (e.g., TAMU / A&L Labs) (unit: URI)."
        },
        lab_sample_id: {
          type: "string",
          description: "Unique chain-of-custody sample identifier assigned by the testing laboratory (unit: string identifier)."
        },
        mycorrhizal_and_fungal_observations: {
          type: "object",
          description: "Field and laboratory indicators of rhizosphere fungal and mycorrhizal symbiosis.",
          additionalProperties: false,
          required: [
            "dominant_mycorrhizal_guild",
            "fungal_to_bacterial_biomass_ratio",
            "hyphal_colonization_status",
            "observed_fruiting_bodies_or_rhizomorphs"
          ],
          properties: {
            dominant_mycorrhizal_guild: {
              type: "string",
              enum: [
                "Ectomycorrhizal_EM",
                "Arbuscular_Mycorrhizal_AM",
                "Dual_EM_AM",
                "Unknown"
              ],
              description: "Primary mycorrhizal association guild of the host tree species (unit: enum string)."
            },
            fungal_to_bacterial_biomass_ratio: {
              type: ["number", "null"],
              minimum: 0,
              maximum: 50,
              description: "Ratio of total fungal biomass to bacterial biomass (F:B); null if biological assay is not yet returned (unit: dimensionless mass ratio)."
            },
            hyphal_colonization_status: {
              type: "string",
              enum: [
                "Abundant_Visible_Mycelial_Mats",
                "Moderate_Rhizosphere_Colonization",
                "Depleted_Bacterial_Dominated",
                "Anaerobic_Compacted_Absent"
              ],
              description: "Visual and root-tip inspection rating of saprotrophic and mycorrhizal hyphae during AirSpade exposure (unit: enum string)."
            },
            observed_fruiting_bodies_or_rhizomorphs: {
              type: "array",
              description: "Macrofungi sporocarps, ectomycorrhizal root tips, or rhizomorphs observed within the TIZ.",
              items: {
                type: "object",
                additionalProperties: false,
                required: [
                  "species_or_morphotype",
                  "inaturalist_taxon_id",
                  "ecological_role"
                ],
                properties: {
                  species_or_morphotype: {
                    type: "string",
                    minLength: 1,
                    description: "Scientific name or field morphotype of the observed fungus (unit: taxon string)."
                  },
                  inaturalist_taxon_id: {
                    type: ["integer", "null"],
                    minimum: 1,
                    description: "iNaturalist taxon ID for the fungal observation, or null if identified only to morphotype (unit: integer ID)."
                  },
                  ecological_role: {
                    type: "string",
                    enum: [
                      "Mycorrhizal_Symbiont",
                      "Saprotrophic_Wood_Or_Litter_Decomposer",
                      "Opportunistic_Stress_Colonizer",
                      "Primary_Root_Or_Butt_Rot_Pathogen",
                      "Endophyte_Or_Unknown"
                    ],
                    description: "Functional guild distinguishing beneficial mycorrhizal/saprotrophic fungi from structural decay pathogens (unit: enum string)."
                  }
                }
              }
            }
          }
        }
      }
    },
    understory_and_guild_prescription: {
      type: "object",
      description: "Domain 4: Bioregional organic soil amendments, arborist woodchip mulch horizon, and native companion plant guild keyed to iNaturalist and open-nursery.",
      additionalProperties: false,
      required: [
        "reference_ecosystem_name",
        "biochar_volume_liters",
        "humate_mass_kg",
        "compost_volume_cubic_m",
        "compost_extract_volume_liters",
        "mulch_depth_cm",
        "mulch_coverage_area_m2",
        "synthetic_npk_and_fungicide_exclusion_verified",
        "native_companion_species_guild"
      ],
      properties: {
        reference_ecosystem_name: {
          type: "string",
          minLength: 1,
          description: "Target local native forest/savanna reference ecosystem per SER Principle 3 (e.g., 'Rogue Valley Oregon White Oak Savanna', 'Edwards Plateau Live Oak-Ashe Juniper Woodland') (unit: ecosystem name string)."
        },
        biochar_volume_liters: {
          type: "number",
          minimum: 0,
          maximum: 5e4,
          description: "Volume of biologically pre-charged high-carbon biochar incorporated into radial trenches (unit: liters)."
        },
        humate_mass_kg: {
          type: "number",
          minimum: 0,
          maximum: 5e3,
          description: "Dry mass of humic and fulvic acid amendment prescribed for cation exchange restoration (unit: kilograms)."
        },
        compost_volume_cubic_m: {
          type: "number",
          minimum: 0,
          maximum: 500,
          description: "Volume of fungal-dominant thermophilic or vermicompost topdressed or backfilled into radial trenches (unit: cubic meters)."
        },
        compost_extract_volume_liters: {
          type: "number",
          minimum: 0,
          maximum: 5e4,
          description: "Volume of aerated or biologically extracted liquid soil drench applied to the TIZ (unit: liters)."
        },
        mulch_depth_cm: {
          type: "number",
          minimum: 0,
          maximum: 30,
          description: "Prescribed depth of coarse, un-dyed arborist ramial woodchip mulch across the TIZ, pulled back 15 cm from the root flare (unit: centimeters)."
        },
        mulch_coverage_area_m2: {
          type: "number",
          minimum: 0,
          maximum: 1e4,
          description: "Total surface area converted from compacted turfgrass or bare pan to woodchip forest floor (unit: square meters)."
        },
        synthetic_npk_and_fungicide_exclusion_verified: {
          type: "boolean",
          description: "Confirms that the prescription excludes high-salt synthetic NPK fertilizers and persistent systemic soil fungicides that suppress mycorrhizal networks (unit: boolean)."
        },
        native_companion_species_guild: {
          type: "array",
          description: "Multi-layer native understory and companion guild species prescribed within the TIZ.",
          items: {
            type: "object",
            additionalProperties: false,
            required: [
              "scientific_name",
              "common_name",
              "inaturalist_taxon_id",
              "open_nursery_batch_id",
              "stratum_layer",
              "functional_role",
              "quantity_planted"
            ],
            properties: {
              scientific_name: {
                type: "string",
                minLength: 1,
                description: "Binomial scientific name of the native companion plant (unit: Latin binomial string)."
              },
              common_name: {
                type: "string",
                minLength: 1,
                description: "Regional common name of the companion plant (unit: string)."
              },
              inaturalist_taxon_id: {
                type: "integer",
                minimum: 1,
                description: "Verified iNaturalist taxon identifier linking the planted guild member to biodiversity monitoring (unit: integer ID)."
              },
              open_nursery_batch_id: {
                type: "string",
                minLength: 1,
                description: "Seed-source and propagation batch identifier linking to Open Nursery provenance records (unit: batch ID string)."
              },
              stratum_layer: {
                type: "string",
                enum: [
                  "Canopy",
                  "Sub_Canopy_Understory",
                  "Shrub_Layer",
                  "Herbaceous_Perennial",
                  "Groundcover_Matrix",
                  "Mycorrhizal_Inoculant_Host"
                ],
                description: "Vertical forest architecture stratum occupied by the guild species (unit: enum string)."
              },
              functional_role: {
                type: "string",
                enum: [
                  "Ectomycorrhizal_Or_Endomycorrhizal_Bridge",
                  "Symbiotic_Nitrogen_Fixer",
                  "Deep_Root_Compaction_Breaker",
                  "Pollinator_And_Predatory_Insect_Refuge",
                  "Hydrologic_Swale_Or_Infiltration_Anchor",
                  "Recalcitrant_Or_Labile_Litter_Builder"
                ],
                description: "Primary ecological function contributed to the host tree holobiont (unit: enum string)."
              },
              quantity_planted: {
                type: "integer",
                minimum: 1,
                maximum: 1e4,
                description: "Number of individual plants or plugs prescribed for this guild taxon (unit: integer count)."
              }
            }
          }
        }
      }
    },
    outcome_monitoring_schedule: {
      type: "object",
      description: "Domain 5: Longitudinal verification schedule combining 1-year leading process/vigor indicators and 5-year lagging ecological outcome targets per Newton et al. (2020), Gann et al. (2019), and the STIM Protocol.",
      additionalProperties: false,
      required: [
        "stim_hypothesis_statement",
        "stim_kill_criterion",
        "one_year_leading_indicators",
        "five_year_lagging_indicators"
      ],
      properties: {
        stim_hypothesis_statement: {
          type: "string",
          minLength: 10,
          description: "Explicit causal hypothesis linking the diagnosed rhizosphere stressor and prescribed nodal intervention to measurable physiological recovery (unit: narrative string)."
        },
        stim_kill_criterion: {
          type: "string",
          minLength: 10,
          description: "Empirical threshold at which the prescribed hypothesis is falsified and requires diagnostic revision (unit: narrative string)."
        },
        one_year_leading_indicators: {
          type: "object",
          description: "12-month leading indicator checklist verifying immediate physiological response and habitat establishment.",
          additionalProperties: false,
          required: [
            "scheduled_reinspection_date",
            "target_canopy_dieback_max_pct",
            "target_annual_twig_extension_min_cm",
            "target_woundwood_callus_closure_mm_yr",
            "root_flare_unburied_verified",
            "mulch_horizon_and_litter_incorporation_intact",
            "soil_surface_crusting_or_capping_absent",
            "companion_guild_survival_min_pct",
            "fixed_photopoint_azimuth_deg"
          ],
          properties: {
            scheduled_reinspection_date: {
              type: "string",
              format: "date",
              description: "Committed ISO 8601 date for the 1-year leading indicator audit (unit: YYYY-MM-DD date)."
            },
            target_canopy_dieback_max_pct: {
              type: "number",
              minimum: 0,
              maximum: 100,
              description: "Maximum acceptable upper-crown branch dieback at 12 months post-intervention (unit: percent)."
            },
            target_annual_twig_extension_min_cm: {
              type: "number",
              minimum: 0,
              maximum: 300,
              description: "Minimum terminal shoot extension indicating restored hydraulic conductivity and vigor (unit: centimeters)."
            },
            target_woundwood_callus_closure_mm_yr: {
              type: "number",
              minimum: 0,
              maximum: 100,
              description: "Minimum annual radial woundwood development on pruning or SGR excision cuts (unit: millimeters per year)."
            },
            root_flare_unburied_verified: {
              type: "boolean",
              description: "Checklist requirement confirming primary root flare remains exposed above mulch and soil grade (unit: boolean)."
            },
            mulch_horizon_and_litter_incorporation_intact: {
              type: "boolean",
              description: "Checklist requirement confirming active saprotrophic breakdown at the soil-mulch interface without anaerobic souring (unit: boolean)."
            },
            soil_surface_crusting_or_capping_absent: {
              type: "boolean",
              description: "Checklist requirement confirming absence of hydrophobic surface sealing or bare soil crusting (unit: boolean)."
            },
            companion_guild_survival_min_pct: {
              type: "number",
              minimum: 0,
              maximum: 100,
              description: "Minimum required survival percentage across planted native_companion_species_guild individuals at Year 1 (unit: percent)."
            },
            fixed_photopoint_azimuth_deg: {
              type: "number",
              minimum: 0,
              maximum: 360,
              description: "Compass bearing from fixed reference point to tree stem for repeatable longitudinal canopy photography (unit: degrees)."
            }
          }
        },
        five_year_lagging_indicators: {
          type: "object",
          description: "60-month lagging outcome targets verifying soil architecture, carbon sequestration, hydrologic infiltration, and Sanctuary Scorecard rollup.",
          additionalProperties: false,
          required: [
            "scheduled_audit_date",
            "target_bulk_density_max_g_cm3",
            "target_infiltration_rate_min_mm_hr",
            "target_organic_matter_min_pct",
            "target_fungal_to_bacterial_ratio_min",
            "target_ser_recovery_wheel_stars",
            "sanctuary_scorecard_targets"
          ],
          properties: {
            scheduled_audit_date: {
              type: "string",
              format: "date",
              description: "Committed ISO 8601 date for the 5-year lagging outcome verification audit (unit: YYYY-MM-DD date)."
            },
            target_bulk_density_max_g_cm3: {
              type: "number",
              minimum: 0.1,
              maximum: 2.65,
              description: "Target 5-year ceiling for rhizosphere dry bulk density demonstrating sustained decompaction (unit: grams per cubic centimeter)."
            },
            target_infiltration_rate_min_mm_hr: {
              type: "number",
              minimum: 0,
              maximum: 2e3,
              description: "Target 5-year floor for steady-state water infiltration rate inside the TIZ (unit: millimeters per hour)."
            },
            target_organic_matter_min_pct: {
              type: "number",
              minimum: 0,
              maximum: 100,
              description: "Target 5-year minimum soil organic matter percentage in the top 15 cm horizon (unit: percent)."
            },
            target_fungal_to_bacterial_ratio_min: {
              type: "number",
              minimum: 0,
              maximum: 50,
              description: "Target 5-year minimum fungal-to-bacterial biomass ratio appropriate for woodland/forest succession (unit: dimensionless mass ratio)."
            },
            target_ser_recovery_wheel_stars: {
              type: "number",
              minimum: 1,
              maximum: 5,
              description: "Target 5-year composite rating on the SER Five-Star Ecological Recovery Wheel across physical conditions, species composition, structural diversity, and ecosystem function (unit: 1.0 to 5.0 star scale)."
            },
            sanctuary_scorecard_targets: {
              type: "object",
              description: "First-class rollup contract bridging tree-level Regenerative Diagnostic assessments (planned modules/arbor/) into the property-level Sanctuary Scorecard (planned modules/sanctuary/) across all five Scorecard dimensions.",
              additionalProperties: false,
              required: [
                "tiz_footprint_area_m2",
                "canopy_projection_area_m2",
                "soil_health_index_baseline_score",
                "soil_health_index_target_score",
                "canopy_volume_expansion_target_pct",
                "stormwater_interception_baseline_liters_yr",
                "stormwater_interception_target_liters_yr",
                "documented_native_biodiversity_taxa_baseline",
                "documented_native_biodiversity_taxa_min",
                "restoration_potential_baseline_pct",
                "restoration_potential_realized_pct"
              ],
              properties: {
                tiz_footprint_area_m2: {
                  type: "number",
                  minimum: 0.78,
                  maximum: 125664,
                  description: "Tree Influence Zone surface area (pi * tiz_radius_m^2) used as the spatial weighting denominator when aggregating Soil Health Index and Water Dynamics across a property stand (unit: square meters)."
                },
                canopy_projection_area_m2: {
                  type: "number",
                  minimum: 0.01,
                  maximum: 17672,
                  description: "Elliptical vertical crown projection area (pi * (crown_spread_ns_m / 2) * (crown_spread_ew_m / 2)) used to aggregate Canopy Coverage across the property parcel (unit: square meters)."
                },
                soil_health_index_baseline_score: {
                  type: "number",
                  minimum: 0,
                  maximum: 100,
                  description: "Baseline composite Soil Health Index score (0 to 100) derived from Domain 2 root-collar burial and Domain 3 bulk_density_g_cm3, infiltration_rate_mm_hr, organic_matter_pct, and fungal_to_bacterial_biomass_ratio (unit: index points)."
                },
                soil_health_index_target_score: {
                  type: "number",
                  minimum: 0,
                  maximum: 100,
                  description: "Target 5-year composite Soil Health Index score on a 0 to 100 scale (unit: index points)."
                },
                canopy_volume_expansion_target_pct: {
                  type: "number",
                  minimum: -100,
                  maximum: 500,
                  description: "Projected net change in three-dimensional photosynthetic crown volume over 5 years derived from Domain 1 height_m, crown_spread_ns_m, crown_spread_ew_m, and live_crown_ratio_pct (unit: percent)."
                },
                stormwater_interception_baseline_liters_yr: {
                  type: "number",
                  minimum: 0,
                  maximum: 1e6,
                  description: "Baseline annual canopy rainfall interception (Xiao et al. 2000) plus TIZ infiltration storage prior to decompaction (unit: liters per year)."
                },
                stormwater_interception_target_liters_yr: {
                  type: "number",
                  minimum: 0,
                  maximum: 1e6,
                  description: "Target 5-year combined canopy rainfall interception and TIZ soil pore storage per year after Domain 2 AirSpade trenching and Domain 4 mulch/biochar installation (unit: liters per year)."
                },
                documented_native_biodiversity_taxa_baseline: {
                  type: "integer",
                  minimum: 0,
                  maximum: 1e3,
                  description: "Baseline count of verified native plant and fungal taxa (keyed to inaturalist_taxon_id in Domains 3 and 4) within the TIZ at assessment date (unit: integer taxon count)."
                },
                documented_native_biodiversity_taxa_min: {
                  type: "integer",
                  minimum: 1,
                  maximum: 1e3,
                  description: "Minimum target count of verified native species (plants, fungi, insects, birds) logged via iNaturalist within the TIZ by Year 5 (unit: integer taxon count)."
                },
                restoration_potential_baseline_pct: {
                  type: "number",
                  minimum: 0,
                  maximum: 100,
                  description: "Baseline percentage of SER reference ecosystem potential currently expressed by this tree holobiont (unit: percent)."
                },
                restoration_potential_realized_pct: {
                  type: "number",
                  minimum: 0,
                  maximum: 100,
                  description: "Target percentage of site-specific ecological potential achieved at the 5-year audit (unit: percent)."
                }
              }
            }
          }
        }
      }
    }
  }
};

// web/presets.js
var CENTRAL_TEXAS_SPECIES = [
  {
    common: "Live Oak",
    scientific: "Quercus virginiana",
    taxon_id: 49005,
    guild: "Ectomycorrhizal_EM",
    growth_factor: 4.5
  },
  {
    common: "Texas Red Oak",
    scientific: "Quercus buckleyi",
    taxon_id: 58333,
    guild: "Ectomycorrhizal_EM",
    growth_factor: 4
  },
  {
    common: "Post Oak",
    scientific: "Quercus stellata",
    taxon_id: 54781,
    guild: "Ectomycorrhizal_EM",
    growth_factor: 5
  },
  {
    common: "Bur Oak",
    scientific: "Quercus macrocarpa",
    taxon_id: 47852,
    guild: "Ectomycorrhizal_EM",
    growth_factor: 4
  },
  {
    common: "Chinquapin Oak",
    scientific: "Quercus muehlenbergii",
    taxon_id: 54779,
    guild: "Ectomycorrhizal_EM",
    growth_factor: 4.5
  },
  {
    common: "Pecan",
    scientific: "Carya illinoinensis",
    taxon_id: 48797,
    guild: "Ectomycorrhizal_EM",
    growth_factor: 4
  },
  {
    common: "Cedar Elm",
    scientific: "Ulmus crassifolia",
    taxon_id: 54801,
    guild: "Arbuscular_Mycorrhizal_AM",
    growth_factor: 4
  },
  {
    common: "American Elm",
    scientific: "Ulmus americana",
    taxon_id: 53543,
    guild: "Arbuscular_Mycorrhizal_AM",
    growth_factor: 3.5
  },
  {
    common: "Bald Cypress",
    scientific: "Taxodium distichum",
    taxon_id: 49665,
    guild: "Arbuscular_Mycorrhizal_AM",
    growth_factor: 3.5
  },
  {
    common: "Bigtooth Maple",
    scientific: "Acer grandidentatum",
    taxon_id: 58719,
    guild: "Arbuscular_Mycorrhizal_AM",
    growth_factor: 4.5
  },
  {
    common: "Hackberry",
    scientific: "Celtis occidentalis",
    taxon_id: 54791,
    guild: "Arbuscular_Mycorrhizal_AM",
    growth_factor: 3
  },
  {
    common: "Ashe Juniper",
    scientific: "Juniperus ashei",
    taxon_id: 49203,
    guild: "Arbuscular_Mycorrhizal_AM",
    growth_factor: 5
  }
];
var FIXED_PARITY_CASES = [
  {
    id: "case-1-austin-live-oak",
    label: "Case 1: Austin Heritage Live Oak (30 in DBH)",
    ordinance_id: "tx-austin",
    condition_class: "Good",
    site_condition: "Open Grown / Parkland",
    proposed_removal: false,
    pruning_date: "2026-11-15",
    crz_disturbed_pct: 15,
    cutfill_depth_in: 2,
    impervious_pct: 10,
    crown_removal_pct: 10,
    assessment: {
      schema_version: "RCA_v2",
      assessment_mode: "Regenerative Diagnostic",
      structural_baseline: {
        tree_tag: "ATX-QV-101",
        species_scientific: "Quercus virginiana",
        species_common: "Live Oak",
        inaturalist_taxon_id: 49005,
        assessment_date: "2026-10-28",
        dbh_cm: 76.2,
        is_multistem: false,
        multistem_aggregation_method: "single_stem",
        height_m: 16.5,
        crown_spread_ns_m: 22,
        crown_spread_ew_m: 24,
        live_crown_ratio_pct: 78,
        plus_code_global: "86247784+VP",
        codit_wall_response_rating: "Wall_4_Active_Barrier_Zone",
        sound_shell_thickness_ratio_t_over_r: 0.38,
        sonic_tomography_or_resistograph_uri: "https://soilgrower.com/diagnostics/picus/atx-qv-101-tomogram.png",
        dual_valuation: {
          ctla_10th_ed_depreciated_usd: 13685,
          holobiont_200yr_biological_equity_usd: 263956,
          veteran_keystone_habitat_multiplier: 2.5,
          valuation_delta_usd: 250271
        },
        isa_traq_risk: {
          assessment_level: "Level_2_Basic",
          time_frame_years: 3,
          target_zone_description: "Residential driveway and primary pedestrian walkway; frequent occupancy.",
          primary_tree_part_of_concern: "Root_Collar",
          likelihood_of_failure: "Possible",
          likelihood_of_impact: "Medium",
          likelihood_of_failure_and_impact: "Somewhat Likely",
          consequences_of_failure: "Significant",
          overall_risk_rating: "Moderate",
          residual_risk_rating: "Low"
        },
        municipal_permit_disposition: {
          jurisdiction_id: "tx-austin",
          ordinance_citation: "Austin LDC \xA7 25-8-604 / ECM Section 3.5",
          protection_tier: "Heritage",
          permit_required: true,
          recommended_disposition: "Preservation_With_Rhizosphere_Remediation",
          seasonal_oak_wilt_restriction_active: false
        }
      },
      rhizosphere_and_root_collar: {
        root_flare_burial_depth_cm: 16,
        root_flare_diameter_cm: 98,
        stem_girdling_root_count: 2,
        stem_girdling_root_severity: "Moderate_25_To_50_Pct_Circumference",
        airspade_radial_trenching_geometry: {
          execution_status: "Prescribed_Radial_Remediation",
          operating_pressure_psi: 150,
          trench_count: 8,
          trench_length_m: 8.5,
          trench_width_cm: 30,
          trench_depth_cm: 35,
          root_collar_excavation_radius_m: 1
        },
        crz_radius_m: 9.14,
        srz_radius_m: 3.21,
        tiz_radius_m: 13.71
      },
      soil_and_microbiome_baseline: {
        bulk_density_g_cm3: 1.54,
        penetrometer_resistance_psi: 325,
        infiltration_rate_mm_hr: 16,
        organic_matter_pct: 2.6,
        soil_ph: 7.4,
        lab_panel_url: "https://soilgrower.com/labs/tamu-soil/sample-atx-2026-101.pdf",
        lab_sample_id: "TAMU-CTX-2026-101",
        mycorrhizal_and_fungal_observations: {
          dominant_mycorrhizal_guild: "Ectomycorrhizal_EM",
          fungal_to_bacterial_biomass_ratio: 0.48,
          hyphal_colonization_status: "Depleted_Bacterial_Dominated",
          observed_fruiting_bodies_or_rhizomorphs: [
            {
              species_or_morphotype: "Pisolithus arhizus",
              inaturalist_taxon_id: 55259,
              ecological_role: "Mycorrhizal_Symbiont"
            },
            {
              species_or_morphotype: "Scleroderma citrinum",
              inaturalist_taxon_id: 55930,
              ecological_role: "Mycorrhizal_Symbiont"
            }
          ]
        }
      },
      understory_and_guild_prescription: {
        reference_ecosystem_name: "Edwards Plateau Live Oak Savanna and Woodland",
        biochar_volume_liters: 611,
        humate_mass_kg: 11.46,
        compost_volume_cubic_m: 1.15,
        compost_extract_volume_liters: 300,
        mulch_depth_cm: 8,
        mulch_coverage_area_m2: 590.5,
        synthetic_npk_and_fungicide_exclusion_verified: true,
        native_companion_species_guild: [
          {
            scientific_name: "Malvaviscus arboreus var. drummondii",
            common_name: "Turk Cap",
            inaturalist_taxon_id: 52149,
            open_nursery_batch_id: "ON-TX-2026-MAD-01",
            stratum_layer: "Shrub_Layer",
            functional_role: "Pollinator_And_Predatory_Insect_Refuge",
            quantity_planted: 14
          },
          {
            scientific_name: "Carex perdentata",
            common_name: "Cedar Sedge",
            inaturalist_taxon_id: 160187,
            open_nursery_batch_id: "ON-TX-2026-CPD-02",
            stratum_layer: "Groundcover_Matrix",
            functional_role: "Hydrologic_Swale_Or_Infiltration_Anchor",
            quantity_planted: 28
          },
          {
            scientific_name: "Callicarpa americana",
            common_name: "American Beautyberry",
            inaturalist_taxon_id: 49138,
            open_nursery_batch_id: "ON-TX-2026-CAM-03",
            stratum_layer: "Shrub_Layer",
            functional_role: "Recalcitrant_Or_Labile_Litter_Builder",
            quantity_planted: 8
          }
        ]
      },
      outcome_monitoring_schedule: {
        stim_hypothesis_statement: "Supersonic AirSpade radial trenching (8 spokes at 150 psi), stem-girdling root relief, pre-charged biochar/humate incorporation, and Edwards Plateau native understory guild installation will reduce top-15cm bulk density from 1.54 to <= 1.28 g/cm3 and elevate F:B biomass ratio from 0.48 to >= 1.25 within 60 months.",
        stim_kill_criterion: "If Year-1 terminal shoot extension remains below 6 cm or upper crown dieback exceeds 12%, re-inspect for subsurface utility trench root severance or oak wilt vascular streaking.",
        one_year_leading_indicators: {
          scheduled_reinspection_date: "2027-10-28",
          target_canopy_dieback_max_pct: 10,
          target_annual_twig_extension_min_cm: 8,
          target_woundwood_callus_closure_mm_yr: 10,
          root_flare_unburied_verified: true,
          mulch_horizon_and_litter_incorporation_intact: true,
          soil_surface_crusting_or_capping_absent: true,
          companion_guild_survival_min_pct: 85,
          fixed_photopoint_azimuth_deg: 180
        },
        five_year_lagging_indicators: {
          scheduled_audit_date: "2031-10-28",
          target_bulk_density_max_g_cm3: 1.28,
          target_infiltration_rate_min_mm_hr: 60,
          target_organic_matter_min_pct: 5,
          target_fungal_to_bacterial_ratio_min: 1.25,
          target_ser_recovery_wheel_stars: 4.5,
          sanctuary_scorecard_targets: {
            tiz_footprint_area_m2: 590.5,
            canopy_projection_area_m2: 414.7,
            soil_health_index_baseline_score: 41,
            soil_health_index_target_score: 84,
            canopy_volume_expansion_target_pct: 12,
            stormwater_interception_baseline_liters_yr: 49800,
            stormwater_interception_target_liters_yr: 64e3,
            documented_native_biodiversity_taxa_baseline: 3,
            documented_native_biodiversity_taxa_min: 14,
            restoration_potential_baseline_pct: 45,
            restoration_potential_realized_pct: 86
          }
        }
      }
    }
  },
  {
    id: "case-2-georgetown-pecan",
    label: "Case 2: Georgetown Multi-Stem Heritage Pecan (27 in DBH)",
    ordinance_id: "tx-georgetown",
    condition_class: "Excellent",
    site_condition: "Forest / Woodland",
    proposed_removal: false,
    pruning_date: "2026-12-01",
    crz_disturbed_pct: 10,
    cutfill_depth_in: 1,
    impervious_pct: 8,
    crown_removal_pct: 5,
    assessment: {
      schema_version: "RCA_v2",
      assessment_mode: "Regenerative Diagnostic",
      structural_baseline: {
        tree_tag: "GTN-CI-204",
        species_scientific: "Carya illinoinensis",
        species_common: "Pecan",
        inaturalist_taxon_id: 48797,
        assessment_date: "2026-10-28",
        dbh_cm: 68.58,
        is_multistem: true,
        stem_diameters_cm: [50.8, 35.56],
        multistem_aggregation_method: "largest_plus_half",
        height_m: 19,
        crown_spread_ns_m: 18,
        crown_spread_ew_m: 19.5,
        live_crown_ratio_pct: 80,
        plus_code_global: "8624J8MC+8Q",
        codit_wall_response_rating: "Wall_4_Strong_Reaction_Zone",
        sound_shell_thickness_ratio_t_over_r: 0.46,
        sonic_tomography_or_resistograph_uri: "https://soilgrower.com/diagnostics/picus/gtn-ci-204-tomogram.png",
        dual_valuation: {
          ctla_10th_ed_depreciated_usd: 13448,
          holobiont_200yr_biological_equity_usd: 146353,
          veteran_keystone_habitat_multiplier: 1.8,
          valuation_delta_usd: 132905
        },
        isa_traq_risk: {
          assessment_level: "Level_2_Basic",
          time_frame_years: 5,
          target_zone_description: "Riparian parkland trail corridor and picnic area; intermittent occupancy.",
          primary_tree_part_of_concern: "Codominant_Union",
          likelihood_of_failure: "Improbable",
          likelihood_of_impact: "Low",
          likelihood_of_failure_and_impact: "Unlikely",
          consequences_of_failure: "Significant",
          overall_risk_rating: "Low",
          residual_risk_rating: "Low"
        },
        municipal_permit_disposition: {
          jurisdiction_id: "tx-georgetown",
          ordinance_citation: "Georgetown UDC \xA7 8.02",
          protection_tier: "Heritage",
          permit_required: true,
          recommended_disposition: "Preservation_Primary",
          seasonal_oak_wilt_restriction_active: false
        }
      },
      rhizosphere_and_root_collar: {
        root_flare_burial_depth_cm: 12,
        root_flare_diameter_cm: 86,
        stem_girdling_root_count: 1,
        stem_girdling_root_severity: "Minor_Under_25_Pct_Circumference",
        airspade_radial_trenching_geometry: {
          execution_status: "Prescribed_Radial_Remediation",
          operating_pressure_psi: 150,
          trench_count: 6,
          trench_length_m: 7.5,
          trench_width_cm: 30,
          trench_depth_cm: 35,
          root_collar_excavation_radius_m: 0.8
        },
        crz_radius_m: 8.23,
        srz_radius_m: 3.04,
        tiz_radius_m: 12.34
      },
      soil_and_microbiome_baseline: {
        bulk_density_g_cm3: 1.42,
        penetrometer_resistance_psi: 270,
        infiltration_rate_mm_hr: 24,
        organic_matter_pct: 3.2,
        soil_ph: 7.1,
        lab_panel_url: "https://soilgrower.com/labs/tamu-soil/sample-gtn-2026-204.pdf",
        lab_sample_id: "TAMU-CTX-2026-204",
        mycorrhizal_and_fungal_observations: {
          dominant_mycorrhizal_guild: "Ectomycorrhizal_EM",
          fungal_to_bacterial_biomass_ratio: 0.68,
          hyphal_colonization_status: "Moderate_Rhizosphere_Colonization",
          observed_fruiting_bodies_or_rhizomorphs: [
            {
              species_or_morphotype: "Tuber lyonii",
              inaturalist_taxon_id: 352625,
              ecological_role: "Mycorrhizal_Symbiont"
            }
          ]
        }
      },
      understory_and_guild_prescription: {
        reference_ecosystem_name: "San Gabriel River Alluvial Pecan-Elm Bottomland Forest",
        biochar_volume_liters: 398,
        humate_mass_kg: 7.46,
        compost_volume_cubic_m: 0.75,
        compost_extract_volume_liters: 250,
        mulch_depth_cm: 8,
        mulch_coverage_area_m2: 478.4,
        synthetic_npk_and_fungicide_exclusion_verified: true,
        native_companion_species_guild: [
          {
            scientific_name: "Chasmanthium latifolium",
            common_name: "Inland Sea Oats",
            inaturalist_taxon_id: 64101,
            open_nursery_batch_id: "ON-TX-2026-CLA-04",
            stratum_layer: "Herbaceous_Perennial",
            functional_role: "Hydrologic_Swale_Or_Infiltration_Anchor",
            quantity_planted: 32
          },
          {
            scientific_name: "Symphoricarpos orbiculatus",
            common_name: "Coralberry",
            inaturalist_taxon_id: 54785,
            open_nursery_batch_id: "ON-TX-2026-SOR-05",
            stratum_layer: "Shrub_Layer",
            functional_role: "Recalcitrant_Or_Labile_Litter_Builder",
            quantity_planted: 16
          }
        ]
      },
      outcome_monitoring_schedule: {
        stim_hypothesis_statement: "Root collar decompression (6 radial trenches at 150 psi), minor SGR excision, and alluvial bottomland guild planting will reduce bulk density from 1.42 to <= 1.22 g/cm3 and elevate F:B biomass ratio from 0.68 to >= 1.40 within 60 months.",
        stim_kill_criterion: "If Year-1 terminal shoot extension drops below 10 cm or codominant union exhibits active seam separation, install non-invasive dynamic crown support per ANSI A300 Part 3.",
        one_year_leading_indicators: {
          scheduled_reinspection_date: "2027-10-28",
          target_canopy_dieback_max_pct: 5,
          target_annual_twig_extension_min_cm: 12,
          target_woundwood_callus_closure_mm_yr: 14,
          root_flare_unburied_verified: true,
          mulch_horizon_and_litter_incorporation_intact: true,
          soil_surface_crusting_or_capping_absent: true,
          companion_guild_survival_min_pct: 90,
          fixed_photopoint_azimuth_deg: 90
        },
        five_year_lagging_indicators: {
          scheduled_audit_date: "2031-10-28",
          target_bulk_density_max_g_cm3: 1.22,
          target_infiltration_rate_min_mm_hr: 75,
          target_organic_matter_min_pct: 5.5,
          target_fungal_to_bacterial_ratio_min: 1.4,
          target_ser_recovery_wheel_stars: 4.5,
          sanctuary_scorecard_targets: {
            tiz_footprint_area_m2: 478.4,
            canopy_projection_area_m2: 275.7,
            soil_health_index_baseline_score: 52,
            soil_health_index_target_score: 88,
            canopy_volume_expansion_target_pct: 15,
            stormwater_interception_baseline_liters_yr: 33100,
            stormwater_interception_target_liters_yr: 45e3,
            documented_native_biodiversity_taxa_baseline: 4,
            documented_native_biodiversity_taxa_min: 15,
            restoration_potential_baseline_pct: 55,
            restoration_potential_realized_pct: 90
          }
        }
      }
    }
  },
  {
    id: "case-3-liberty-hill-post-oak",
    label: "Case 3: Liberty Hill Protected Post Oak (20 in DBH)",
    ordinance_id: "tx-liberty-hill",
    condition_class: "Fair",
    site_condition: "Urban / Street Tree",
    proposed_removal: false,
    pruning_date: "2026-11-20",
    crz_disturbed_pct: 22,
    cutfill_depth_in: 3,
    impervious_pct: 18,
    crown_removal_pct: 15,
    assessment: {
      schema_version: "RCA_v2",
      assessment_mode: "Regenerative Diagnostic",
      structural_baseline: {
        tree_tag: "LBH-QS-309",
        species_scientific: "Quercus stellata",
        species_common: "Post Oak",
        inaturalist_taxon_id: 54781,
        assessment_date: "2026-10-28",
        dbh_cm: 50.8,
        is_multistem: false,
        multistem_aggregation_method: "single_stem",
        height_m: 13.5,
        crown_spread_ns_m: 14.5,
        crown_spread_ew_m: 15,
        live_crown_ratio_pct: 65,
        plus_code_global: "8624M38F+4X",
        codit_wall_response_rating: "Wall_3_Ray_Compartmentalization",
        sound_shell_thickness_ratio_t_over_r: 0.32,
        sonic_tomography_or_resistograph_uri: "https://soilgrower.com/diagnostics/picus/lbh-qs-309-tomogram.png",
        dual_valuation: {
          ctla_10th_ed_depreciated_usd: 5111,
          holobiont_200yr_biological_equity_usd: 108446,
          veteran_keystone_habitat_multiplier: 1.8,
          valuation_delta_usd: 103335
        },
        isa_traq_risk: {
          assessment_level: "Level_3_Advanced",
          time_frame_years: 3,
          target_zone_description: "Commercial office parking lot edge and sidewalk; moderate daytime occupancy.",
          primary_tree_part_of_concern: "Root_Plate",
          likelihood_of_failure: "Possible",
          likelihood_of_impact: "Medium",
          likelihood_of_failure_and_impact: "Somewhat Likely",
          consequences_of_failure: "Significant",
          overall_risk_rating: "Moderate",
          residual_risk_rating: "Low"
        },
        municipal_permit_disposition: {
          jurisdiction_id: "tx-liberty-hill",
          ordinance_citation: "Liberty Hill UDC \xA7 6.07.01(c)",
          protection_tier: "Protected",
          permit_required: false,
          recommended_disposition: "Preservation_With_Rhizosphere_Remediation",
          seasonal_oak_wilt_restriction_active: false
        }
      },
      rhizosphere_and_root_collar: {
        root_flare_burial_depth_cm: 22,
        root_flare_diameter_cm: 64,
        stem_girdling_root_count: 3,
        stem_girdling_root_severity: "Severe_Over_50_Pct_Circumference",
        airspade_radial_trenching_geometry: {
          execution_status: "Prescribed_Radial_Remediation",
          operating_pressure_psi: 150,
          trench_count: 8,
          trench_length_m: 6.5,
          trench_width_cm: 30,
          trench_depth_cm: 35,
          root_collar_excavation_radius_m: 0.9
        },
        crz_radius_m: 6.1,
        srz_radius_m: 2.68,
        tiz_radius_m: 9.15
      },
      soil_and_microbiome_baseline: {
        bulk_density_g_cm3: 1.64,
        penetrometer_resistance_psi: 380,
        infiltration_rate_mm_hr: 10,
        organic_matter_pct: 1.9,
        soil_ph: 7.6,
        lab_panel_url: "https://soilgrower.com/labs/tamu-soil/sample-lbh-2026-309.pdf",
        lab_sample_id: "TAMU-CTX-2026-309",
        mycorrhizal_and_fungal_observations: {
          dominant_mycorrhizal_guild: "Ectomycorrhizal_EM",
          fungal_to_bacterial_biomass_ratio: 0.31,
          hyphal_colonization_status: "Depleted_Bacterial_Dominated",
          observed_fruiting_bodies_or_rhizomorphs: [
            {
              species_or_morphotype: "Pisolithus arhizus",
              inaturalist_taxon_id: 55259,
              ecological_role: "Mycorrhizal_Symbiont"
            }
          ]
        }
      },
      understory_and_guild_prescription: {
        reference_ecosystem_name: "Cross Timbers and Edwards Plateau Post Oak Savanna",
        biochar_volume_liters: 482,
        humate_mass_kg: 9.03,
        compost_volume_cubic_m: 0.9,
        compost_extract_volume_liters: 350,
        mulch_depth_cm: 8,
        mulch_coverage_area_m2: 263,
        synthetic_npk_and_fungicide_exclusion_verified: true,
        native_companion_species_guild: [
          {
            scientific_name: "Schizachyrium scoparium",
            common_name: "Little Bluestem",
            inaturalist_taxon_id: 52725,
            open_nursery_batch_id: "ON-TX-2026-SSC-07",
            stratum_layer: "Herbaceous_Perennial",
            functional_role: "Deep_Root_Compaction_Breaker",
            quantity_planted: 24
          },
          {
            scientific_name: "Salvia farinacea",
            common_name: "Mealy Blue Sage",
            inaturalist_taxon_id: 50643,
            open_nursery_batch_id: "ON-TX-2026-SFA-08",
            stratum_layer: "Herbaceous_Perennial",
            functional_role: "Pollinator_And_Predatory_Insect_Refuge",
            quantity_planted: 18
          }
        ]
      },
      outcome_monitoring_schedule: {
        stim_hypothesis_statement: "Post Oak construction intolerance requires zero mechanical root cutting; supersonic AirSpade radial trenching (8 spokes at 150 psi), staged SGR relief, and native Cross Timbers grass/forb guild establishment will lower bulk density from 1.64 to <= 1.30 g/cm3 and raise F:B ratio from 0.31 to >= 1.15 within 60 months.",
        stim_kill_criterion: "If Year-1 upper canopy dieback exceeds 15% or epicormic sprouting exceeds 25% of main scaffold length, halt further root-collar disturbance and apply supplemental mycorrhizal extract drench.",
        one_year_leading_indicators: {
          scheduled_reinspection_date: "2027-10-28",
          target_canopy_dieback_max_pct: 12,
          target_annual_twig_extension_min_cm: 6,
          target_woundwood_callus_closure_mm_yr: 8,
          root_flare_unburied_verified: true,
          mulch_horizon_and_litter_incorporation_intact: true,
          soil_surface_crusting_or_capping_absent: true,
          companion_guild_survival_min_pct: 85,
          fixed_photopoint_azimuth_deg: 270
        },
        five_year_lagging_indicators: {
          scheduled_audit_date: "2031-10-28",
          target_bulk_density_max_g_cm3: 1.3,
          target_infiltration_rate_min_mm_hr: 50,
          target_organic_matter_min_pct: 4.5,
          target_fungal_to_bacterial_ratio_min: 1.15,
          target_ser_recovery_wheel_stars: 4,
          sanctuary_scorecard_targets: {
            tiz_footprint_area_m2: 263,
            canopy_projection_area_m2: 170.8,
            soil_health_index_baseline_score: 31,
            soil_health_index_target_score: 79,
            canopy_volume_expansion_target_pct: 8,
            stormwater_interception_baseline_liters_yr: 20500,
            stormwater_interception_target_liters_yr: 29e3,
            documented_native_biodiversity_taxa_baseline: 2,
            documented_native_biodiversity_taxa_min: 12,
            restoration_potential_baseline_pct: 35,
            restoration_potential_realized_pct: 82
          }
        }
      }
    }
  }
];

// web/app.js
var OLC_CHARS2 = "23456789CFGHJMPQRVWX";
var ALL_MUNICIPALITIES = [
  ...central_texas_ordinances_default.municipalities || [],
  ...rogue_valley_oregon_ordinances_default.municipalities || []
];
var CENTRAL_TEXAS_MUNICIPALITIES = central_texas_ordinances_default.municipalities || [];
function findMunicipality(id) {
  if (!id) return null;
  return ALL_MUNICIPALITIES.find((m) => m.id === id) || null;
}
function encodePlusCode(lat, lng) {
  let cleanLat = Math.max(-90, Math.min(89.9999, Number(lat) + 90));
  let cleanLng = Math.max(-180, Math.min(179.9999, Number(lng) + 180));
  let resolution = 20;
  let chars = "";
  for (let i = 0; i < 5; i += 1) {
    const latDigit = Math.min(19, Math.max(0, Math.floor(cleanLat / resolution)));
    const lngDigit = Math.min(19, Math.max(0, Math.floor(cleanLng / resolution)));
    chars += OLC_CHARS2[latDigit] + OLC_CHARS2[lngDigit];
    cleanLat -= latDigit * resolution;
    cleanLng -= lngDigit * resolution;
    resolution /= 20;
  }
  return `${chars.slice(0, 8)}+${chars.slice(8, 10)}`;
}
function evaluateCompleteFieldCase(assessment, options = {}) {
  const schemaValidation = validateJsonSchema(assessment, rca_assessment_schema_default);
  const lint = lintRcaEvidentiaryReport(assessment);
  const ordId = options.ordinance_id || assessment.structural_baseline?.municipal_permit_disposition?.jurisdiction_id || "tx-austin";
  const municipality = findMunicipality(ordId);
  const compiledReport = compileRcaEvidentiaryMarkdown(assessment, { municipality });
  const counterNotice = compilePreservationCounterNotice(assessment);
  const economics = computeRegenerativePracticeEconomics(assessment);
  const biomechanics = compiledReport.biomechanics;
  const valuation = compiledReport.valuation;
  const sb = assessment.structural_baseline || {};
  const coords = decodePlusCode(sb.plus_code_global) || municipality?.coordinates || { lat: 30.2672, lng: -97.7431 };
  const conditionClass = options.condition_class || "Good";
  const siteCondition = options.site_condition || "Open Grown / Parkland";
  const speciesEntry = CENTRAL_TEXAS_SPECIES.find(
    (s) => s.scientific.toLowerCase() === String(sb.species_scientific || "").toLowerCase()
  );
  const growthFactor = speciesEntry?.growth_factor || 4.5;
  const ageEstimate = estimateTreeAge({
    dbh_inches: biomechanics.dbh_inches,
    base_growth_factor: growthFactor,
    site_condition: siteCondition
  });
  const heightFt = Number(sb.height_m || 12) / 0.3048;
  const spreadFt = (Number(sb.crown_spread_ns_m || 10) + Number(sb.crown_spread_ew_m || 10)) / 2 / 0.3048;
  const ecosystemBenefits = calculateTreeEcosystemBenefits({
    species_name: sb.species_scientific || "Quercus virginiana",
    common_name: sb.species_common || "Live Oak",
    dbh_inches: biomechanics.dbh_inches,
    height_feet: Math.round(heightFt * 10) / 10,
    canopy_spread_feet: Math.round(spreadFt * 10) / 10,
    condition_class: conditionClass
  });
  const conditionScoreMap = {
    Excellent: 10,
    Good: 8,
    Fair: 6,
    Poor: 4,
    Critical: 2,
    Dead: 0
  };
  const isRemovalProposed = Boolean(options.proposed_removal) || sb.municipal_permit_disposition?.recommended_disposition === "Removal_Last_Resort_Unmitigable_Hazard";
  const stemsInches = sb.is_multistem && Array.isArray(sb.stem_diameters_cm) && sb.stem_diameters_cm.length > 0 ? sb.stem_diameters_cm.map((cm) => Math.round(Number(cm) / 2.54 * 10) / 10) : [biomechanics.dbh_inches];
  const treeInventoryInput = [
    {
      tag: sb.tree_tag || "T-01",
      species_common: sb.species_common || "Live Oak",
      species_scientific: sb.species_scientific || "Quercus virginiana",
      stems_inches: stemsInches,
      dbh_inches: biomechanics.dbh_inches,
      lat: coords.lat,
      lng: coords.lng,
      condition_score: conditionScoreMap[conditionClass] ?? 8,
      removal: isRemovalProposed,
      pruning_date: options.pruning_date || null,
      crz_disturbed_pct: Number(options.crz_disturbed_pct) || 0,
      cutfill_within_half_crz: (Number(options.cutfill_depth_in) || 0) > 0,
      cutfill_depth_in: Number(options.cutfill_depth_in) || 0,
      impervious_pct: Number(options.impervious_pct) || 0,
      crown_removal_pct: Number(options.crown_removal_pct) || 0,
      actions: sb.municipal_permit_disposition?.recommended_disposition === "Structural_Risk_Reduction_Pruning" || options.pruning_date ? ["pruning"] : []
    }
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
    Number(municipality?.plan_rules?.root_zone?.crz_ft_per_inch) || 1,
    Number(municipality?.plan_rules?.root_zone?.crz_min_ft) || 0
  );
  const tpzUs11 = calculateTPZ(biomechanics.dbh_inches, "inches", "US_1_1");
  const tpzUs115 = calculateTPZ(biomechanics.dbh_inches, "inches", "US_1_1.5");
  const tpzAs4970 = calculateTPZ(biomechanics.dbh_inches, "inches", "Australian_AS4970");
  const tpzBs5837 = calculateTPZ(biomechanics.dbh_inches, "inches", "UK_BS5837");
  const srz = calculateSRZ(
    (Number(assessment.rhizosphere_and_root_collar?.root_flare_diameter_cm) || biomechanics.dbh_cm * 1.2) / 2.54,
    biomechanics.dbh_inches
  );
  const geojson = toGeoJSONFeatureCollection(evaluatedRows, {
    name: `OpenArbor_${sb.tree_tag || "Assessment"}`,
    generated_at: options.generated_at || `${sb.assessment_date || "2026-10-28"}T00:00:00.000Z`,
    jurisdiction_id: ordId,
    jurisdiction_name: municipality?.name || ordId,
    ordinance_citation: municipality?.ordinance_numbers || "",
    rca_sha256: compiledReport.sha256
  });
  if (geojson.features.length > 0) {
    geojson.features[0].properties = {
      ...geojson.features[0].properties,
      jurisdiction_id: ordId,
      protection_status: statusLabel(evaluatedRows[0]),
      permit_summary: permitText,
      ctla_10th_ed_depreciated_usd: valuation.ctla_10th_ed_depreciated_usd,
      holobiont_200yr_biological_equity_usd: valuation.holobiont_200yr_biological_equity_usd,
      annual_ecosystem_benefits_usd: ecosystemBenefits.total_annual_benefits_usd,
      estimated_age_years: ageEstimate.estimated_age_years,
      t_over_r_ratio: biomechanics.biomechanics.sound_shell_thickness_ratio_t_over_r,
      mattheck_stable: biomechanics.biomechanics.mattheck_criterion_satisfied,
      rca_sha256: compiledReport.sha256
    };
  }
  return {
    schemaValidation,
    lint,
    municipality,
    compiledReport,
    counterNotice,
    economics,
    biomechanics,
    valuation,
    ageEstimate,
    ecosystemBenefits,
    evaluatedRow: evaluatedRows[0],
    permit,
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
      srz
    },
    geojson
  };
}
var UserInvalidFallback = /* @__PURE__ */ (() => {
  const dirtyState = /* @__PURE__ */ new WeakMap();
  const updateState = (input) => {
    if (!input || typeof input.checkValidity !== "function") return;
    const isValid = input.checkValidity();
    input.classList.toggle("user-invalid-fallback", !isValid);
    input.classList.toggle("user-valid-fallback", isValid);
    input.setAttribute("aria-invalid", isValid ? "false" : "true");
  };
  const syncAriaNative = (el) => {
    if (!el || typeof el.matches !== "function" || typeof el.checkValidity !== "function") return;
    try {
      const invalid = el.matches(":user-invalid");
      el.setAttribute("aria-invalid", invalid ? "true" : "false");
    } catch {
      updateState(el);
    }
  };
  const init = (root = document) => {
    const supportsNative = typeof CSS !== "undefined" && typeof CSS.supports === "function" && CSS.supports("selector(:user-invalid)");
    if (supportsNative) {
      root.addEventListener("blur", (e) => syncAriaNative(e.target), true);
      root.addEventListener("input", (e) => {
        if (e.target && typeof e.target.hasAttribute === "function" && e.target.hasAttribute("aria-invalid")) {
          syncAriaNative(e.target);
        }
      });
      return;
    }
    const handleEvent = (event) => {
      const input = event.target;
      if (event.type === "reset") {
        const controls = input.elements || [];
        for (const control of controls) {
          dirtyState.delete(control);
          control.classList.remove("user-invalid-fallback", "user-valid-fallback");
          control.removeAttribute("aria-invalid");
        }
        return;
      }
      if (!input || typeof input.checkValidity !== "function") return;
      if (event.type === "input" || event.type === "change") {
        const state = dirtyState.get(input) || { hasInteracted: false, hasBlurred: false };
        state.hasInteracted = true;
        dirtyState.set(input, state);
        if (state.hasBlurred) updateState(input);
      } else if (event.type === "blur") {
        const state = dirtyState.get(input) || { hasInteracted: false, hasBlurred: false };
        state.hasBlurred = true;
        dirtyState.set(input, state);
        if (state.hasInteracted) updateState(input);
      }
    };
    root.addEventListener("blur", handleEvent, true);
    root.addEventListener("input", handleEvent);
    root.addEventListener("change", handleEvent);
    root.addEventListener("reset", handleEvent, true);
  };
  return { init };
})();
function initFieldToolUI() {
  if (typeof document === "undefined") return;
  const form = document.getElementById("field-assessment-form");
  if (!form) return;
  UserInvalidFallback.init(form);
  let activePreset = JSON.parse(JSON.stringify(FIXED_PARITY_CASES[0]));
  let activePreviewTab = "geojson";
  let latestResult = null;
  let latestAssessment = null;
  const el = (id) => document.getElementById(id);
  const muniSelect = el("input-ordinance-id");
  if (muniSelect) {
    muniSelect.innerHTML = CENTRAL_TEXAS_MUNICIPALITIES.map(
      (m) => `<option value="${m.id}">${m.name}, ${m.state} (Protected >= ${m.dbh_threshold_inches} in, Heritage >= ${m.heritage_threshold_inches} in)</option>`
    ).join("");
  }
  const speciesSelect = el("input-species-preset");
  if (speciesSelect) {
    speciesSelect.innerHTML = [
      ...CENTRAL_TEXAS_SPECIES.map(
        (s) => `<option value="${s.scientific}">${s.common} (${s.scientific})</option>`
      ),
      `<option value="custom">Custom Species (Enter below)</option>`
    ].join("");
  }
  const presetBar = el("preset-buttons");
  if (presetBar) {
    presetBar.innerHTML = FIXED_PARITY_CASES.map(
      (c, idx) => `<button type="button" class="btn-preset ${idx === 0 ? "active" : ""}" data-case-id="${c.id}">${c.label}</button>`
    ).join("");
    presetBar.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-case-id]");
      if (!btn) return;
      const found = FIXED_PARITY_CASES.find((c) => c.id === btn.dataset.caseId);
      if (!found) return;
      document.querySelectorAll(".btn-preset").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      loadCaseIntoForm(found);
    });
  }
  function loadCaseIntoForm(caseObj) {
    activePreset = JSON.parse(JSON.stringify(caseObj));
    const a = activePreset.assessment;
    const sb = a.structural_baseline;
    const rh = a.rhizosphere_and_root_collar;
    const air = rh.airspade_radial_trenching_geometry;
    const soil = a.soil_and_microbiome_baseline;
    const myco = soil.mycorrhizal_and_fungal_observations;
    const traq = sb.isa_traq_risk;
    const disp = sb.municipal_permit_disposition;
    el("input-ordinance-id").value = activePreset.ordinance_id || disp.jurisdiction_id || "tx-austin";
    el("input-tree-tag").value = sb.tree_tag || "ATX-QV-101";
    el("input-assessment-date").value = sb.assessment_date || "2026-10-28";
    el("input-plus-code").value = sb.plus_code_global || "86247784+VP";
    const matchedSpecies = CENTRAL_TEXAS_SPECIES.find(
      (s) => s.scientific.toLowerCase() === String(sb.species_scientific || "").toLowerCase()
    );
    el("input-species-preset").value = matchedSpecies ? matchedSpecies.scientific : "custom";
    el("input-species-common").value = sb.species_common || "Live Oak";
    el("input-species-scientific").value = sb.species_scientific || "Quercus virginiana";
    el("input-taxon-id").value = sb.inaturalist_taxon_id || 49005;
    const isMulti = Boolean(sb.is_multistem);
    el("input-multistem-mode").value = isMulti ? sb.multistem_aggregation_method || "largest_plus_half" : "single_stem";
    if (isMulti && Array.isArray(sb.stem_diameters_cm) && sb.stem_diameters_cm.length > 0) {
      el("input-stems-inches").value = sb.stem_diameters_cm.map((cm) => Math.round(cm / 2.54 * 10) / 10).join(", ");
    } else {
      const inches = Math.round(sb.dbh_cm / 2.54 * 100) / 100;
      el("input-stems-inches").value = String(inches);
    }
    el("input-dbh-inches").value = Math.round(sb.dbh_cm / 2.54 * 100) / 100;
    el("input-dbh-cm").value = sb.dbh_cm;
    el("input-condition-class").value = activePreset.condition_class || "Good";
    el("input-site-condition").value = activePreset.site_condition || "Open Grown / Parkland";
    el("input-height-m").value = sb.height_m;
    el("input-spread-ns-m").value = sb.crown_spread_ns_m;
    el("input-spread-ew-m").value = sb.crown_spread_ew_m;
    el("input-lcr-pct").value = sb.live_crown_ratio_pct;
    el("input-disposition").value = disp.recommended_disposition || "Preservation_With_Rhizosphere_Remediation";
    el("input-proposed-removal").checked = Boolean(activePreset.proposed_removal) || disp.recommended_disposition === "Removal_Last_Resort_Unmitigable_Hazard";
    el("input-pruning-date").value = activePreset.pruning_date || "";
    el("input-crz-disturbed-pct").value = activePreset.crz_disturbed_pct ?? 0;
    el("input-cutfill-in").value = activePreset.cutfill_depth_in ?? 0;
    el("input-impervious-pct").value = activePreset.impervious_pct ?? 0;
    el("input-crown-removal-pct").value = activePreset.crown_removal_pct ?? 0;
    el("input-t-over-r").value = sb.sound_shell_thickness_ratio_t_over_r ?? 0.38;
    el("input-codit").value = sb.codit_wall_response_rating || "Wall_4_Active_Barrier_Zone";
    el("input-root-flare-cm").value = rh.root_flare_diameter_cm;
    el("input-burial-depth-cm").value = rh.root_flare_burial_depth_cm;
    el("input-sgr-count").value = rh.stem_girdling_root_count;
    el("input-sgr-severity").value = rh.stem_girdling_root_severity;
    el("input-trench-count").value = air.trench_count;
    el("input-trench-length-m").value = air.trench_length_m;
    el("input-trench-width-cm").value = air.trench_width_cm;
    el("input-trench-depth-cm").value = air.trench_depth_cm;
    el("input-rce-radius-m").value = air.root_collar_excavation_radius_m;
    el("input-airspade-psi").value = air.operating_pressure_psi;
    el("input-bulk-density").value = soil.bulk_density_g_cm3;
    el("input-infiltration").value = soil.infiltration_rate_mm_hr;
    el("input-som-pct").value = soil.organic_matter_pct;
    el("input-soil-ph").value = soil.soil_ph;
    el("input-fb-ratio").value = myco.fungal_to_bacterial_biomass_ratio ?? 0.5;
    el("input-myco-guild").value = myco.dominant_mycorrhizal_guild || "Ectomycorrhizal_EM";
    el("input-traq-level").value = traq.assessment_level;
    el("input-traq-part").value = traq.primary_tree_part_of_concern || "Root_Collar";
    el("input-traq-lof").value = traq.likelihood_of_failure;
    el("input-traq-loi").value = traq.likelihood_of_impact;
    el("input-traq-lofi").value = traq.likelihood_of_failure_and_impact;
    el("input-traq-cof").value = traq.consequences_of_failure;
    el("input-traq-overall").value = traq.overall_risk_rating;
    el("input-traq-residual").value = traq.residual_risk_rating || "Low";
    toggleMultiStemInputs();
    recalculateAndRender();
  }
  function toggleMultiStemInputs() {
    const mode = el("input-multistem-mode").value;
    const multiWrap = el("multistem-input-wrap");
    const singleWrap = el("singlestem-input-wrap");
    if (mode === "single_stem") {
      multiWrap.hidden = true;
      singleWrap.hidden = false;
    } else {
      multiWrap.hidden = false;
      singleWrap.hidden = true;
    }
  }
  el("input-species-preset")?.addEventListener("change", () => {
    const val = el("input-species-preset").value;
    const found = CENTRAL_TEXAS_SPECIES.find((s) => s.scientific === val);
    if (found) {
      el("input-species-common").value = found.common;
      el("input-species-scientific").value = found.scientific;
      el("input-taxon-id").value = found.taxon_id;
      el("input-myco-guild").value = found.guild;
      recalculateAndRender();
    }
  });
  el("input-multistem-mode")?.addEventListener("change", () => {
    toggleMultiStemInputs();
    syncDbhFromInputs();
    recalculateAndRender();
  });
  function syncDbhFromInputs() {
    const mode = el("input-multistem-mode").value;
    if (mode === "single_stem") {
      const dbhIn = Math.max(0.1, Number(el("input-dbh-inches").value) || 20);
      const dbhCm = Math.round(dbhIn * 2.54 * 100) / 100;
      el("input-dbh-cm").value = dbhCm;
    } else {
      const rawStems = String(el("input-stems-inches").value || "").split(",").map((s) => Number(s.trim())).filter((n) => n > 0);
      const aggIn = rawStems.length > 0 ? calculateMultiStemDBH(rawStems, mode) : 20;
      const aggCm = Math.round(aggIn * 2.54 * 100) / 100;
      el("input-dbh-inches").value = aggIn;
      el("input-dbh-cm").value = aggCm;
    }
  }
  el("input-dbh-inches")?.addEventListener("input", () => {
    const dbhIn = Math.max(0.1, Number(el("input-dbh-inches").value) || 0.1);
    el("input-dbh-cm").value = Math.round(dbhIn * 2.54 * 100) / 100;
    recalculateAndRender();
  });
  el("input-stems-inches")?.addEventListener("input", () => {
    syncDbhFromInputs();
    recalculateAndRender();
  });
  el("btn-gps-locate")?.addEventListener("click", () => {
    const statusSpan = el("gps-status");
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      if (statusSpan) statusSpan.textContent = "Geolocation API not available on this device.";
      return;
    }
    if (statusSpan) statusSpan.textContent = "Acquiring GPS fix...";
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const plus = encodePlusCode(pos.coords.latitude, pos.coords.longitude);
        el("input-plus-code").value = plus;
        if (statusSpan) {
          statusSpan.textContent = `GPS locked: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)} (${plus})`;
        }
        recalculateAndRender();
      },
      (err) => {
        if (statusSpan) statusSpan.textContent = `GPS unavailable (${err.message}). Using entered Plus Code.`;
      },
      { enableHighAccuracy: true, timeout: 8e3 }
    );
  });
  function buildAssessmentFromForm() {
    const base = JSON.parse(JSON.stringify(activePreset.assessment));
    const sb = base.structural_baseline;
    const rh = base.rhizosphere_and_root_collar;
    const air = rh.airspade_radial_trenching_geometry;
    const soil = base.soil_and_microbiome_baseline;
    const myco = soil.mycorrhizal_and_fungal_observations;
    const traq = sb.isa_traq_risk;
    const disp = sb.municipal_permit_disposition;
    const ordId = el("input-ordinance-id").value || "tx-austin";
    const muni = findMunicipality(ordId);
    sb.tree_tag = el("input-tree-tag").value.trim() || "ATX-TREE-01";
    sb.assessment_date = el("input-assessment-date").value || "2026-10-28";
    sb.plus_code_global = (el("input-plus-code").value.trim() || "86247784+VP").toUpperCase();
    sb.species_common = el("input-species-common").value.trim() || "Live Oak";
    sb.species_scientific = el("input-species-scientific").value.trim() || "Quercus virginiana";
    sb.inaturalist_taxon_id = Math.max(1, Math.round(Number(el("input-taxon-id").value) || 49005));
    const mode = el("input-multistem-mode").value;
    if (mode === "single_stem") {
      sb.is_multistem = false;
      sb.multistem_aggregation_method = "single_stem";
      delete sb.stem_diameters_cm;
      sb.dbh_cm = Math.max(0.5, Number(el("input-dbh-cm").value) || 50.8);
    } else {
      const rawStemsIn = String(el("input-stems-inches").value || "").split(",").map((s) => Number(s.trim())).filter((n) => n > 0);
      const validStemsIn = rawStemsIn.length > 0 ? rawStemsIn : [20, 14];
      const aggIn = calculateMultiStemDBH(validStemsIn, mode);
      sb.is_multistem = true;
      sb.multistem_aggregation_method = mode;
      sb.stem_diameters_cm = validStemsIn.map((d) => Math.round(d * 2.54 * 100) / 100);
      sb.dbh_cm = Math.round(aggIn * 2.54 * 100) / 100;
    }
    sb.height_m = Math.max(0.5, Number(el("input-height-m").value) || 15);
    sb.crown_spread_ns_m = Math.max(0.5, Number(el("input-spread-ns-m").value) || 15);
    sb.crown_spread_ew_m = Math.max(0.5, Number(el("input-spread-ew-m").value) || 15);
    sb.live_crown_ratio_pct = Math.min(100, Math.max(0, Number(el("input-lcr-pct").value) || 70));
    sb.sound_shell_thickness_ratio_t_over_r = Math.min(
      1,
      Math.max(0, Number(el("input-t-over-r").value) || 0.35)
    );
    sb.codit_wall_response_rating = el("input-codit").value.trim() || "Wall_4_Active_Barrier_Zone";
    rh.root_flare_diameter_cm = Math.max(1, Number(el("input-root-flare-cm").value) || sb.dbh_cm * 1.25);
    rh.root_flare_burial_depth_cm = Math.max(0, Number(el("input-burial-depth-cm").value) || 0);
    rh.stem_girdling_root_count = Math.max(0, Math.round(Number(el("input-sgr-count").value) || 0));
    rh.stem_girdling_root_severity = el("input-sgr-severity").value || "None";
    air.trench_count = Math.max(0, Math.round(Number(el("input-trench-count").value) || 6));
    air.trench_length_m = Math.max(0, Number(el("input-trench-length-m").value) || 6.5);
    air.trench_width_cm = Math.max(0, Number(el("input-trench-width-cm").value) || 30);
    air.trench_depth_cm = Math.max(0, Number(el("input-trench-depth-cm").value) || 35);
    air.root_collar_excavation_radius_m = Math.max(0, Number(el("input-rce-radius-m").value) || 0.9);
    air.operating_pressure_psi = Math.max(0, Number(el("input-airspade-psi").value) || 150);
    soil.bulk_density_g_cm3 = Math.min(2.65, Math.max(0.1, Number(el("input-bulk-density").value) || 1.45));
    soil.infiltration_rate_mm_hr = Math.max(0, Number(el("input-infiltration").value) || 20);
    soil.organic_matter_pct = Math.min(100, Math.max(0, Number(el("input-som-pct").value) || 2.8));
    soil.soil_ph = Math.min(11, Math.max(2, Number(el("input-soil-ph").value) || 7.2));
    myco.fungal_to_bacterial_biomass_ratio = Math.max(0, Number(el("input-fb-ratio").value) || 0.5);
    myco.dominant_mycorrhizal_guild = el("input-myco-guild").value || "Ectomycorrhizal_EM";
    traq.assessment_level = el("input-traq-level").value;
    traq.primary_tree_part_of_concern = el("input-traq-part").value;
    traq.likelihood_of_failure = el("input-traq-lof").value;
    traq.likelihood_of_impact = el("input-traq-loi").value;
    traq.likelihood_of_failure_and_impact = el("input-traq-lofi").value;
    traq.consequences_of_failure = el("input-traq-cof").value;
    traq.overall_risk_rating = el("input-traq-overall").value;
    traq.residual_risk_rating = el("input-traq-residual").value;
    disp.jurisdiction_id = ordId;
    disp.ordinance_citation = muni?.permit_triggers_by_work_type?.citation || muni?.mitigation_fee_schedule?.citation || muni?.ordinance_numbers || "Municipal Tree Code";
    disp.recommended_disposition = el("input-disposition").value;
    const isUnmodifiedPreset = JSON.stringify({
      ordId,
      tag: sb.tree_tag,
      dbh_cm: sb.dbh_cm,
      t_over_r: sb.sound_shell_thickness_ratio_t_over_r,
      disp: disp.recommended_disposition,
      rfd: rh.root_flare_diameter_cm,
      burial: rh.root_flare_burial_depth_cm,
      sgr: rh.stem_girdling_root_count,
      trenchCount: air.trench_count,
      trenchLen: air.trench_length_m,
      bd: soil.bulk_density_g_cm3,
      inf: soil.infiltration_rate_mm_hr,
      som: soil.organic_matter_pct,
      fb: myco.fungal_to_bacterial_biomass_ratio,
      traqOverall: traq.overall_risk_rating
    }) === JSON.stringify({
      ordId: activePreset.ordinance_id,
      tag: activePreset.assessment.structural_baseline.tree_tag,
      dbh_cm: activePreset.assessment.structural_baseline.dbh_cm,
      t_over_r: activePreset.assessment.structural_baseline.sound_shell_thickness_ratio_t_over_r,
      disp: activePreset.assessment.structural_baseline.municipal_permit_disposition.recommended_disposition,
      rfd: activePreset.assessment.rhizosphere_and_root_collar.root_flare_diameter_cm,
      burial: activePreset.assessment.rhizosphere_and_root_collar.root_flare_burial_depth_cm,
      sgr: activePreset.assessment.rhizosphere_and_root_collar.stem_girdling_root_count,
      trenchCount: activePreset.assessment.rhizosphere_and_root_collar.airspade_radial_trenching_geometry.trench_count,
      trenchLen: activePreset.assessment.rhizosphere_and_root_collar.airspade_radial_trenching_geometry.trench_length_m,
      bd: activePreset.assessment.soil_and_microbiome_baseline.bulk_density_g_cm3,
      inf: activePreset.assessment.soil_and_microbiome_baseline.infiltration_rate_mm_hr,
      som: activePreset.assessment.soil_and_microbiome_baseline.organic_matter_pct,
      fb: activePreset.assessment.soil_and_microbiome_baseline.mycorrhizal_and_fungal_observations.fungal_to_bacterial_biomass_ratio,
      traqOverall: activePreset.assessment.structural_baseline.isa_traq_risk.overall_risk_rating
    });
    if (isUnmodifiedPreset) {
      return JSON.parse(JSON.stringify(activePreset.assessment));
    }
    const dbhIn = sb.dbh_cm / 2.54;
    const crz = calculateCRZ(dbhIn, 1);
    const srz = calculateSRZ(rh.root_flare_diameter_cm / 2.54, dbhIn);
    rh.crz_radius_m = Math.max(0.5, crz.radius_meters);
    rh.srz_radius_m = Math.max(0.5, srz.radius_meters);
    rh.tiz_radius_m = Math.max(0.5, Math.round(crz.radius_meters * 1.5 * 100) / 100);
    const val = computeHolobiontValuation(base);
    sb.dual_valuation = {
      ctla_10th_ed_depreciated_usd: val.ctla_10th_ed_depreciated_usd,
      holobiont_200yr_biological_equity_usd: val.holobiont_200yr_biological_equity_usd,
      veteran_keystone_habitat_multiplier: val.veteran_keystone_habitat_multiplier,
      valuation_delta_usd: val.valuation_delta_usd
    };
    const tempEval = evaluateTreeInventory(
      [
        {
          tag: sb.tree_tag,
          species_common: sb.species_common,
          species_scientific: sb.species_scientific,
          dbh_inches: dbhIn,
          removal: disp.recommended_disposition === "Removal_Last_Resort_Unmitigable_Hazard"
        }
      ],
      muni
    );
    const tempPermit = permitDetermination(tempEval, muni);
    disp.protection_tier = tempEval[0].heritage ? "Heritage" : tempEval[0].protected ? "Protected" : tempEval[0].excepted ? "Excepted_Species" : "Unprotected";
    disp.permit_required = Boolean(tempPermit.required);
    return base;
  }
  function recalculateAndRender() {
    try {
      const assessment = buildAssessmentFromForm();
      const options = {
        ordinance_id: el("input-ordinance-id").value || "tx-austin",
        condition_class: el("input-condition-class").value || "Good",
        site_condition: el("input-site-condition").value || "Open Grown / Parkland",
        proposed_removal: el("input-proposed-removal").checked,
        pruning_date: el("input-pruning-date").value || null,
        crz_disturbed_pct: Number(el("input-crz-disturbed-pct").value) || 0,
        cutfill_depth_in: Number(el("input-cutfill-in").value) || 0,
        impervious_pct: Number(el("input-impervious-pct").value) || 0,
        crown_removal_pct: Number(el("input-crown-removal-pct").value) || 0
      };
      const res = evaluateCompleteFieldCase(assessment, options);
      latestAssessment = assessment;
      latestResult = res;
      renderAllOutputs(assessment, res);
    } catch (err) {
      const errBanner = el("error-banner");
      if (errBanner) {
        errBanner.hidden = false;
        errBanner.textContent = `Calculation Notice: ${err.message}`;
      }
    }
  }
  function renderAllOutputs(assessment, res) {
    const errBanner = el("error-banner");
    if (errBanner) errBanner.hidden = true;
    const muni = res.municipality;
    const row = res.evaluatedRow;
    const bio = res.biomechanics;
    const val = res.valuation;
    const econ = res.economics;
    const eco = res.ecosystemBenefits;
    const age = res.ageEstimate;
    const mitIfRemoved = res.mitigationIfRemoved;
    const mitActive = res.mitigationActive;
    if (muni) {
      const oakMonths = muni.plan_rules?.pruning?.oak_months;
      const oakWindowText = Array.isArray(oakMonths) ? `Permitted Oak pruning months: ${oakMonths.join(", ")} (${muni.plan_rules?.pruning?.citation || "Oak Wilt Rule"})` : "Verify seasonal Oak Wilt window with local forester";
      el("muni-lookup-card").innerHTML = `
        <div class="muni-header">
          <div>
            <strong>${muni.name}, ${muni.state}</strong>
            <span class="badge badge-neutral">${muni.id}</span>
          </div>
          <a href="${muni.source_url}" target="_blank" rel="noopener noreferrer" class="muni-link">Statutory Code Reference</a>
        </div>
        <p class="muni-citation">${muni.ordinance_numbers}</p>
        <div class="metric-grid metric-grid-4">
          <div class="metric-box">
            <span class="metric-label">Protected Threshold</span>
            <strong class="metric-value">${muni.dbh_threshold_inches} in DBH</strong>
          </div>
          <div class="metric-box">
            <span class="metric-label">Heritage Threshold</span>
            <strong class="metric-value">${muni.heritage_threshold_inches} in DBH</strong>
          </div>
          <div class="metric-box">
            <span class="metric-label">Multi-Stem Formula</span>
            <strong class="metric-value">${muni.plan_rules?.survey?.multi_trunk || "quadratic"}</strong>
          </div>
          <div class="metric-box">
            <span class="metric-label">CRZ Disturbance Trigger</span>
            <strong class="metric-value">${muni.plan_rules?.root_zone?.removal_if_disturbed_pct ? `>${muni.plan_rules.root_zone.removal_if_disturbed_pct}% = Removal` : "1.0 ft / in DBH"}</strong>
          </div>
        </div>
        <p class="muni-subtext"><strong>Oak Wilt &amp; Pruning:</strong> ${oakWindowText}</p>
        <p class="muni-subtext"><strong>Excepted Species:</strong> ${(muni.excepted_species || []).join("; ") || "None listed"}</p>
      `;
    }
    const statusText = statusLabel(row);
    const statusClass = row.heritage ? "badge-heritage" : row.protected ? "badge-protected" : row.excepted ? "badge-neutral" : "badge-warn";
    const flagsHtml = row.flags && row.flags.length > 0 ? `<ul class="flag-list">${row.flags.map((f) => `<li>${f}</li>`).join("")}</ul>` : `<p class="clean-note">Zero ordinance or seasonal Oak Wilt violations triggered for current work parameters.</p>`;
    el("verdict-ordinance-body").innerHTML = `
      <div class="verdict-banner">
        <div>
          <span class="metric-label">Evaluated Municipal Status</span>
          <div class="verdict-title-row">
            <strong class="verdict-big">${statusText}</strong>
            <span class="badge ${statusClass}">${row.dbh} in DBH (${bio.dbh_cm} cm)</span>
          </div>
        </div>
        <div class="verdict-right">
          <span class="metric-label">Permit Verdict</span>
          <strong>${res.permit.unknown ? "Verify with City" : res.permit.required ? "PERMIT REQUIRED" : "No Permit Triggered"}</strong>
        </div>
      </div>
      <p class="citation-callout"><strong>Statutory Permit Determination:</strong> ${res.permitText} ${res.permit.citation ? `(${res.permit.citation})` : ""}</p>
      ${flagsHtml}

      <div class="metric-grid metric-grid-3">
        <div class="metric-box">
          <span class="metric-label">Critical Root Zone (CRZ)</span>
          <strong class="metric-value">${res.rootZones.crz.radius_feet} ft (${res.rootZones.crz.radius_meters} m)</strong>
          <span class="metric-sub">${res.rootZones.crz.area_sqft.toLocaleString()} sq ft (${res.rootZones.crz.area_sqm} m2)</span>
        </div>
        <div class="metric-box">
          <span class="metric-label">Structural Root Zone (SRZ)</span>
          <strong class="metric-value">${res.rootZones.srz.radius_feet} ft (${res.rootZones.srz.radius_meters} m)</strong>
          <span class="metric-sub">AS 4970 Windthrow Plate</span>
        </div>
        <div class="metric-box">
          <span class="metric-label">Tree Influence Zone (TIZ)</span>
          <strong class="metric-value">${bio.root_zones.tiz_radius_meters} m radius</strong>
          <span class="metric-sub">${bio.root_zones.tiz_area_sqm} m2 Holobiont Footprint</span>
        </div>
      </div>

      <div class="table-scroll">
        <table class="data-table">
          <thead>
            <tr>
              <th>Mitigation Scenario (${muni?.mitigation_fee_schedule?.citation || "Ordinance"})</th>
              <th>Exemption Cap</th>
              <th>Replacement Owed</th>
              <th>Cash-in-Lieu Fee</th>
              <th>Unpermitted Penalty</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Current Field Plan (${row.removal ? "Removal Triggered" : "Preserved"})</strong></td>
              <td>${mitActive ? `${mitActive.exemption_cap_inches} in (${mitActive.exemption_pct}%)` : "N/A"}</td>
              <td>${mitActive ? `${mitActive.replacement_inches_owed} in (${mitActive.replacement_trees_owed} trees)` : "0 in"}</td>
              <td><strong>$${(mitActive?.cash_in_lieu_usd || 0).toLocaleString()}</strong></td>
              <td>$${(mitActive?.unpermitted_penalty?.total_penalty_usd || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td><strong>Liability If Tree Liquidated / Destroyed</strong></td>
              <td>${mitIfRemoved ? `${mitIfRemoved.exemption_cap_inches} in (${mitIfRemoved.exemption_pct}%)` : "N/A"}</td>
              <td>${mitIfRemoved ? `${mitIfRemoved.replacement_inches_owed} in (${mitIfRemoved.replacement_trees_owed} trees)` : "0 in"}</td>
              <td><strong class="text-danger">$${(mitIfRemoved?.cash_in_lieu_usd || 0).toLocaleString()}</strong></td>
              <td class="text-danger">$${(mitIfRemoved?.unpermitted_penalty?.total_penalty_usd || 0).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="svg-map-wrap">
        <div class="svg-map-header">
          <span><strong>ANSI A300 Part 5 / ISA BMP To-Scale Root Protection Map</strong> (Fence Radius: ${row.fence_ft} ft)</span>
          <span>Soil Invigoration Budget: <strong>$${res.soilRemediation.total_usd.toLocaleString()}</strong></span>
        </div>
        ${res.svgSiteMap || ""}
      </div>
    `;
    const mattheckClass = bio.biomechanics.mattheck_criterion_satisfied ? "badge-protected" : "badge-danger";
    el("verdict-valuation-body").innerHTML = `
      <div class="metric-grid metric-grid-4">
        <div class="metric-box highlight-box">
          <span class="metric-label">200-Yr Holobiont Biological Equity</span>
          <strong class="metric-value text-accent">$${val.holobiont_200yr_biological_equity_usd.toLocaleString()}</strong>
          <span class="metric-sub">${val.veteran_keystone_habitat_multiplier}x Keystone Multiplier (${val.inversion_ratio}x CTLA)</span>
        </div>
        <div class="metric-box">
          <span class="metric-label">Classical CTLA 10th Ed. Value</span>
          <strong class="metric-value">$${val.ctla_10th_ed_depreciated_usd.toLocaleString()}</strong>
          <span class="metric-sub">Allometric Structural: $${eco.structural_value_usd.toLocaleString()}</span>
        </div>
        <div class="metric-box">
          <span class="metric-label">John White (FCIN12) Est. Age</span>
          <strong class="metric-value">${age.estimated_age_years} yrs</strong>
          <span class="metric-sub">Adjusted Factor: ${age.adjusted_growth_factor} (${age.site_condition})</span>
        </div>
        <div class="metric-box">
          <span class="metric-label">Mattheck Shell Stability (t/R)</span>
          <strong class="metric-value">${bio.biomechanics.sound_shell_thickness_ratio_t_over_r}</strong>
          <span class="badge ${mattheckClass}">${bio.biomechanics.mattheck_criterion_satisfied ? "t/R >= 0.30 Sound" : "t/R < 0.30 Thinning"}</span>
        </div>
      </div>

      <h4 class="sub-heading">Annual &amp; 20-Year Allometric Ecosystem Services (Nowak / McPherson / Xiao)</h4>
      <div class="metric-grid metric-grid-4">
        <div class="metric-box">
          <span class="metric-label">Carbon Stored</span>
          <strong class="metric-value">${eco.carbon_storage_lbs.toLocaleString()} lbs</strong>
          <span class="metric-sub">$${eco.carbon_storage_value_usd.toLocaleString()} (${eco.co2_equivalent_lbs_yr} lbs CO2/yr)</span>
        </div>
        <div class="metric-box">
          <span class="metric-label">Stormwater Intercepted</span>
          <strong class="metric-value">${eco.avoided_runoff_gallons_yr.toLocaleString()} gal/yr</strong>
          <span class="metric-sub">Canopy Cover: ${eco.canopy_cover_sqft.toLocaleString()} sq ft</span>
        </div>
        <div class="metric-box">
          <span class="metric-label">Cooling &amp; Air Quality</span>
          <strong class="metric-value">${eco.cooling_savings_kwh_yr} kWh/yr</strong>
          <span class="metric-sub">${eco.pollution_removal_lbs_yr} lbs/yr pollutants removed</span>
        </div>
        <div class="metric-box">
          <span class="metric-label">Projected 20-Yr Service Value</span>
          <strong class="metric-value">$${eco.projected_20yr_benefits_usd.toLocaleString()}</strong>
          <span class="metric-sub">$${eco.total_annual_benefits_usd}/yr direct annual flow</span>
        </div>
      </div>

      <h4 class="sub-heading">5-Year Practice Economics: Regenerative Stewardship vs. One-Time Tree Removal</h4>
      <div class="table-scroll">
        <table class="data-table">
          <thead>
            <tr>
              <th>Practice Model</th>
              <th>5-Yr Gross Revenue</th>
              <th>Practitioner Net Margin</th>
              <th>Recurring Revenue Share</th>
              <th>Client Holobiont Equity Impact</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>RCA 5-Year Regenerative Stewardship</strong></td>
              <td>$${econ.regenerative_stewardship_model.five_year_gross_revenue_usd.toLocaleString()}</td>
              <td><strong class="text-accent">$${econ.regenerative_stewardship_model.net_practitioner_margin_usd.toLocaleString()} (${econ.comparison.margin_multiplier}x)</strong></td>
              <td>${econ.regenerative_stewardship_model.recurring_revenue_share_pct}%</td>
              <td>Preserves <strong>$${econ.regenerative_stewardship_model.client_biological_equity_preserved_usd.toLocaleString()}</strong></td>
            </tr>
            <tr>
              <td><strong>Legacy Contractor Removal Bid</strong></td>
              <td>$${econ.legacy_removal_model.one_time_gross_bid_usd.toLocaleString()}</td>
              <td>$${econ.legacy_removal_model.net_practitioner_margin_usd.toLocaleString()}</td>
              <td>0%</td>
              <td class="text-danger">Destroys $${econ.legacy_removal_model.client_biological_equity_destroyed_usd.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h4 class="sub-heading">Engine-Scaled Pneumatic Rhizosphere &amp; Bio-Amendment Bill of Materials</h4>
      <div class="metric-grid metric-grid-4">
        <div class="metric-box">
          <span class="metric-label">Decompacted Soil Volume</span>
          <strong class="metric-value">${bio.rhizosphere_prescription.total_decompacted_soil_m3} m3</strong>
          <span class="metric-sub">AirSpade @ ${bio.rhizosphere_prescription.operating_pressure_psi} psi</span>
        </div>
        <div class="metric-box">
          <span class="metric-label">Pre-Charged Biochar</span>
          <strong class="metric-value">${bio.rhizosphere_prescription.amendments.precharged_biochar_liters} L</strong>
          <span class="metric-sub">Humate: ${bio.rhizosphere_prescription.amendments.fungal_humate_kg} kg</span>
        </div>
        <div class="metric-box">
          <span class="metric-label">Fungal Compost</span>
          <strong class="metric-value">${bio.rhizosphere_prescription.amendments.fungal_compost_m3} m3</strong>
          <span class="metric-sub">SGR Relief Ratio: ${bio.rhizosphere_prescription.vascular_constriction_relief_ratio}</span>
        </div>
        <div class="metric-box">
          <span class="metric-label">Ramial Woodchip Mulch</span>
          <strong class="metric-value">${bio.rhizosphere_prescription.amendments.ramial_woodchip_mulch_m3} m3</strong>
          <span class="metric-sub">8 cm horizon across TIZ</span>
        </div>
      </div>
    `;
    const lintStatusBadge = res.lint.valid ? `<span class="badge badge-protected">PASS (${res.lint.passed_checks.length} Evidentiary Checks Verified)</span>` : `<span class="badge badge-danger">BLOCKED (${res.lint.errors.length} Evidentiary Violation(s))</span>`;
    const schemaStatusBadge = res.schemaValidation.valid ? `<span class="badge badge-protected">RCA_v2 Schema Valid</span>` : `<span class="badge badge-danger">Schema Error (${res.schemaValidation.errors.length})</span>`;
    const lintErrorsHtml = res.lint.errors.length > 0 ? `<ul class="flag-list">${res.lint.errors.map((e) => `<li>${e}</li>`).join("")}</ul>` : "";
    el("verdict-linter-header").innerHTML = `
      <div class="linter-row">
        <div>
          <strong>ASCA / RCA-Spec v2.0 Evidentiary Gate:</strong>
          ${lintStatusBadge}
          ${schemaStatusBadge}
        </div>
        <div class="sha-box">
          <span>SHA-256:</span>
          <code>${res.compiledReport.sha256}</code>
        </div>
      </div>
      ${lintErrorsHtml}
    `;
    renderActivePreview();
  }
  function getActivePreviewContent() {
    if (!latestResult || !latestAssessment) return "";
    if (activePreviewTab === "geojson") {
      return JSON.stringify(latestResult.geojson, null, 2);
    }
    if (activePreviewTab === "report") {
      return latestResult.compiledReport.markdown;
    }
    if (activePreviewTab === "counternotice") {
      return latestResult.counterNotice.notice_markdown;
    }
    if (activePreviewTab === "json") {
      return JSON.stringify(latestAssessment, null, 2);
    }
    return "";
  }
  function renderActivePreview() {
    const pre = el("export-preview-code");
    if (pre) {
      pre.textContent = getActivePreviewContent();
    }
  }
  document.querySelectorAll("[data-preview-tab]").forEach((tabBtn) => {
    tabBtn.addEventListener("click", () => {
      document.querySelectorAll("[data-preview-tab]").forEach((b) => b.classList.remove("active"));
      tabBtn.classList.add("active");
      activePreviewTab = tabBtn.dataset.previewTab;
      renderActivePreview();
    });
  });
  function triggerDownload(filename, content, mimeType = "text/plain;charset=utf-8") {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  el("btn-download-geojson")?.addEventListener("click", () => {
    if (!latestResult) return;
    const tag = latestAssessment?.structural_baseline?.tree_tag || "tree";
    triggerDownload(
      `${tag.toLowerCase()}-openarbor.geojson`,
      JSON.stringify(latestResult.geojson, null, 2),
      "application/geo+json;charset=utf-8"
    );
  });
  el("btn-download-report")?.addEventListener("click", () => {
    if (!latestResult) return;
    const tag = latestAssessment?.structural_baseline?.tree_tag || "tree";
    triggerDownload(
      `${tag.toLowerCase()}-rca-report.md`,
      latestResult.compiledReport.markdown,
      "text/markdown;charset=utf-8"
    );
  });
  el("btn-download-notice")?.addEventListener("click", () => {
    if (!latestResult) return;
    const tag = latestAssessment?.structural_baseline?.tree_tag || "tree";
    triggerDownload(
      `${tag.toLowerCase()}-counter-notice.md`,
      latestResult.counterNotice.notice_markdown,
      "text/markdown;charset=utf-8"
    );
  });
  el("btn-download-json")?.addEventListener("click", () => {
    if (!latestAssessment) return;
    const tag = latestAssessment?.structural_baseline?.tree_tag || "tree";
    triggerDownload(
      `${tag.toLowerCase()}-rca-v2.json`,
      JSON.stringify(latestAssessment, null, 2),
      "application/json;charset=utf-8"
    );
  });
  el("btn-copy-preview")?.addEventListener("click", async () => {
    const content = getActivePreviewContent();
    const copyBtn = el("btn-copy-preview");
    if (navigator.clipboard && content) {
      await navigator.clipboard.writeText(content);
      const prev = copyBtn.textContent;
      copyBtn.textContent = "Copied to Clipboard";
      setTimeout(() => {
        copyBtn.textContent = prev;
      }, 1800);
    }
  });
  el("input-import-json")?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        loadCaseIntoForm({
          id: "imported-case",
          label: "Imported JSON",
          ordinance_id: parsed.structural_baseline?.municipal_permit_disposition?.jurisdiction_id || "tx-austin",
          condition_class: "Good",
          site_condition: "Open Grown / Parkland",
          proposed_removal: parsed.structural_baseline?.municipal_permit_disposition?.recommended_disposition === "Removal_Last_Resort_Unmitigable_Hazard",
          assessment: parsed
        });
      } catch (err) {
        const errBanner = el("error-banner");
        if (errBanner) {
          errBanner.hidden = false;
          errBanner.textContent = `JSON Import Error: ${err.message}`;
        }
      }
    };
    reader.readAsText(file);
  });
  form.addEventListener("input", () => recalculateAndRender());
  form.addEventListener("change", () => recalculateAndRender());
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    recalculateAndRender();
    el("results-section")?.scrollIntoView({ behavior: "smooth" });
  });
  loadCaseIntoForm(FIXED_PARITY_CASES[0]);
}
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initFieldToolUI);
  } else {
    initFieldToolUI();
  }
}
export {
  ALL_MUNICIPALITIES,
  CENTRAL_TEXAS_MUNICIPALITIES,
  CENTRAL_TEXAS_SPECIES,
  CONDITION_FACTORS,
  FIXED_PARITY_CASES,
  calculateCRZ,
  calculateMultiStemDBH,
  calculateSRZ,
  calculateTPZ,
  calculateTreeEcosystemBenefits,
  compilePreservationCounterNotice,
  compileRcaEvidentiaryMarkdown,
  computeCanonicalSha256,
  computeHolobiontValuation,
  computeMitigationPlan,
  computeRegenerativePracticeEconomics,
  computeSanctuaryScorecardRollup,
  decodePlusCode,
  encodePlusCode,
  estimateRootZoneRemediation,
  estimateTreeAge,
  evaluateBiomechanicsAndRhizosphere,
  evaluateCompleteFieldCase,
  evaluateSiteContext,
  evaluateTreeInventory,
  findMunicipality,
  initFieldToolUI,
  lintRcaEvidentiaryReport,
  mintOpenBadgeAttestation,
  rogue_valley_oregon_ordinances_default as orOrdinances,
  permitDetermination,
  permitSummary,
  rca_assessment_schema_default as rcaAssessmentSchema,
  renderSiteMapSVG,
  statusLabel,
  toGeoJSONFeatureCollection,
  central_texas_ordinances_default as txOrdinances,
  unionRootZoneArea,
  validateJsonSchema
};
