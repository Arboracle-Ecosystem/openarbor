/**
 * Open Arbor Unified MCP Core (server/mcp/mcpCore.mjs)
 * Pure ESM (Node + Browser compatible, zero node:fs or external dependencies)
 * exposing the single unified `openarbor_consult` intake tool, all 8 specialist
 * tools, and 3 LEO-RAP Logical English Orchestration MCP prompts.
 *
 * License: AGPL-3.0-only
 */

import {
  calculateCRZ,
  calculateTPZ,
  calculateSRZ,
  calculateMultiStemDBH,
} from '../../src/core/rootZone.js';
import {
  evaluateTreeInventory,
  permitDetermination,
  permitSummary,
  computeMitigationPlan,
  estimateRootZoneRemediation,
  isOakSpecies,
  statusLabel,
} from '../../src/core/ordinanceEngine.js';
import {
  calculateTreeEcosystemBenefits,
  estimateTreeAge,
} from '../../src/core/ecosystemBenefits.js';
import {
  validateSoilFunction,
  estimateSoilSpongeCapacity,
} from '../../src/core/soilFunction.js';
import {
  evaluateBiomechanicsAndRhizosphere,
  lintRapEvidentiaryReport,
  computeHolobiontValuation,
  computeRegenerativePracticeEconomics,
} from '../../src/core/rapEngine.js';
import {
  computePhasedStewardshipTriage,
  compileLeoRapBrief,
  verifyLeoRapNarrative,
  runLeoRapSelfAudit,
  composeArboristHandoffBrief,
} from '../../src/core/leoRapEngine.js';

export const MAX_EVALUATE_TREES = 500;
export const MAX_JURISDICTION_ID_LENGTH = 128;
export const MAX_NARRATIVE_LENGTH = 100000;

const round1 = (n) => Math.round(Number(n || 0) * 10) / 10;
const round2 = (n) => Math.round(Number(n || 0) * 100) / 100;
const usd = (n) => `$${Math.round(Number(n || 0)).toLocaleString('en-US')}`;

const SPECIES_PRESETS = [
  { common: 'Live Oak', scientific: 'Quercus virginiana', taxon_id: 49005, guild: 'Ectomycorrhizal_EM', growth_factor: 4.5 },
  { common: 'Oregon White Oak', scientific: 'Quercus garryana', taxon_id: 47851, guild: 'Ectomycorrhizal_EM', growth_factor: 5.0 },
  { common: 'Post Oak', scientific: 'Quercus stellata', taxon_id: 54781, guild: 'Ectomycorrhizal_EM', growth_factor: 5.0 },
  { common: 'Texas Red Oak', scientific: 'Quercus buckleyi', taxon_id: 58333, guild: 'Ectomycorrhizal_EM', growth_factor: 4.0 },
  { common: 'Shumard Oak', scientific: 'Quercus shumardii', taxon_id: 54778, guild: 'Ectomycorrhizal_EM', growth_factor: 4.0 },
  { common: 'Bur Oak', scientific: 'Quercus macrocarpa', taxon_id: 47852, guild: 'Ectomycorrhizal_EM', growth_factor: 4.0 },
  { common: 'Chinquapin Oak', scientific: 'Quercus muehlenbergii', taxon_id: 54779, guild: 'Ectomycorrhizal_EM', growth_factor: 4.5 },
  { common: 'Pecan', scientific: 'Carya illinoinensis', taxon_id: 48797, guild: 'Ectomycorrhizal_EM', growth_factor: 4.0 },
  { common: 'Ponderosa Pine', scientific: 'Pinus ponderosa', taxon_id: 48461, guild: 'Ectomycorrhizal_EM', growth_factor: 4.0 },
  { common: 'Cedar Elm', scientific: 'Ulmus crassifolia', taxon_id: 54801, guild: 'Arbuscular_Mycorrhizal_AM', growth_factor: 4.0 },
  { common: 'American Elm', scientific: 'Ulmus americana', taxon_id: 53543, guild: 'Arbuscular_Mycorrhizal_AM', growth_factor: 3.5 },
  { common: 'Bald Cypress', scientific: 'Taxodium distichum', taxon_id: 49665, guild: 'Arbuscular_Mycorrhizal_AM', growth_factor: 3.5 },
  { common: 'Bigtooth Maple', scientific: 'Acer grandidentatum', taxon_id: 58719, guild: 'Arbuscular_Mycorrhizal_AM', growth_factor: 4.5 },
  { common: 'Hackberry', scientific: 'Celtis occidentalis', taxon_id: 54791, guild: 'Arbuscular_Mycorrhizal_AM', growth_factor: 3.0 },
  { common: 'Ashe Juniper', scientific: 'Juniperus ashei', taxon_id: 49203, guild: 'Arbuscular_Mycorrhizal_AM', growth_factor: 5.0 },
  { common: 'California Black Oak', scientific: 'Quercus kelloggii', taxon_id: 49139, guild: 'Ectomycorrhizal_EM', growth_factor: 4.5 },
  { common: 'Pacific Madrone', scientific: 'Arbutus menziesii', taxon_id: 51046, guild: 'Ericoid_Arbutoid_Mycorrhizal', growth_factor: 4.5 },
];

function resolveSpeciesInfo(rawSpecies) {
  const input = String(rawSpecies || '').trim();
  if (!input) return SPECIES_PRESETS[0];
  const lower = input.toLowerCase();
  const matched = SPECIES_PRESETS.find(
    (s) =>
      s.common.toLowerCase() === lower ||
      s.scientific.toLowerCase() === lower ||
      lower.includes(s.common.toLowerCase()) ||
      lower.includes(s.scientific.toLowerCase())
  );
  if (matched) return matched;
  return {
    common: input,
    scientific: input.includes(' ') ? input : 'Quercus spp.',
    taxon_id: 47851,
    guild: 'Ectomycorrhizal_EM',
    growth_factor: 4.5,
  };
}

/**
 * Inspect municipal ordinance coverage and enumerate explicit UNVERIFIED statutory gaps.
 */
export function inspectOrdinanceGaps(muni) {
  if (!muni) return null;
  const hasPermitTriggers = Boolean(
    muni.permit_triggers_by_work_type && Object.keys(muni.permit_triggers_by_work_type).length > 0
  );
  const hasPlanRules = Boolean(muni.plan_rules && Object.keys(muni.plan_rules).length > 0);
  const hasSurvey = Boolean(muni.plan_rules?.survey);
  const hasRootZone = Boolean(muni.plan_rules?.root_zone);
  const hasPruning = Boolean(muni.plan_rules?.pruning);
  const hasSpeciesThresholds = Boolean(
    muni.heritage_species_thresholds && Object.keys(muni.heritage_species_thresholds).length > 0
  );
  const hasCivilPenalty = muni.mitigation_fee_schedule?.penalty_civil_per_tree !== undefined;
  const recordTier = hasPermitTriggers && hasPlanRules ? 'Full_Rule_Record' : 'Threshold_And_Fee_Record';

  const verifiedSections = [
    {
      field: 'dbh_threshold_inches & heritage_threshold_inches',
      value: `Protected >= ${muni.dbh_threshold_inches} in; Heritage >= ${muni.heritage_threshold_inches ?? 'N/A'} in`,
      citation: muni.ordinance_numbers,
    },
    {
      field: 'mitigation_fee_schedule.tiers',
      value: `${(muni.mitigation_fee_schedule?.tiers || []).length} caliper replacement and cash-in-lieu tiers encoded`,
      citation: muni.mitigation_fee_schedule?.citation || muni.ordinance_numbers,
    },
  ];
  if (hasSpeciesThresholds) {
    verifiedSections.push({
      field: 'heritage_species_thresholds',
      value: `${Object.keys(muni.heritage_species_thresholds).length} species-specific Heritage DBH thresholds encoded`,
      citation: muni.ordinance_numbers,
    });
  }
  if (hasPermitTriggers) {
    verifiedSections.push({
      field: 'permit_triggers_by_work_type',
      value: `Protected: [${(muni.permit_triggers_by_work_type.protected || []).join(', ')}]; Heritage: [${(muni.permit_triggers_by_work_type.heritage || []).join(', ')}]`,
      citation: muni.permit_triggers_by_work_type.citation || muni.ordinance_numbers,
    });
  }
  if (hasSurvey) {
    verifiedSections.push({
      field: 'plan_rules.survey',
      value: `Multi-trunk method: ${muni.plan_rules.survey.multi_trunk}; min survey DBH: ${muni.plan_rules.survey.hardwood_min_dbh} in`,
      citation: muni.plan_rules.survey.citation || muni.ordinance_numbers,
    });
  }
  if (hasRootZone) {
    verifiedSections.push({
      field: 'plan_rules.root_zone',
      value: `CRZ ${muni.plan_rules.root_zone.crz_ft_per_inch} ft/in (min ${muni.plan_rules.root_zone.crz_min_ft} ft); removal trigger >${muni.plan_rules.root_zone.removal_if_disturbed_pct}% CRZ disturbance`,
      citation: muni.plan_rules.root_zone.citation || muni.ordinance_numbers,
    });
  }
  if (hasPruning) {
    verifiedSections.push({
      field: 'plan_rules.pruning',
      value: `Standard: ${muni.plan_rules.pruning.standard}${muni.plan_rules.pruning.oak_months ? `; permitted oak pruning months: [${muni.plan_rules.pruning.oak_months.join(', ')}]` : ''}`,
      citation: muni.plan_rules.pruning.citation || muni.ordinance_numbers,
    });
  }

  const unverifiedGaps = [];
  if (!hasPermitTriggers) {
    unverifiedGaps.push({
      field: 'permit_triggers_by_work_type',
      status: 'UNVERIFIED',
      description: 'Work-type permit triggers are not encoded in this Threshold_And_Fee_Record; verify with municipal staff.',
    });
  }
  if (!hasSurvey) {
    unverifiedGaps.push({
      field: 'plan_rules.survey (multi_trunk, hardwood_min_dbh, max_age_years)',
      status: 'UNVERIFIED',
      description: 'Municipal tree survey rules are not encoded; caller-selected multi-stem aggregation applies.',
    });
  }
  if (!hasRootZone) {
    unverifiedGaps.push({
      field: 'plan_rules.root_zone (crz_ft_per_inch, removal_if_disturbed_pct, cutfill_max_in, impervious_max_pct, crown_removal_max_pct)',
      status: 'UNVERIFIED',
      description: 'Municipal CRZ thresholds are not encoded; engine applies ANSI A300 1.0 ft/in baseline without asserting city code triggers.',
    });
  }
  if (!hasPruning) {
    unverifiedGaps.push({
      field: 'plan_rules.pruning (standard, oak_months)',
      status: 'UNVERIFIED',
      description: 'Municipal seasonal Oak Wilt pruning window and pruning subsection citation are not encoded.',
    });
  }
  if (!hasSpeciesThresholds) {
    unverifiedGaps.push({
      field: 'heritage_species_thresholds',
      status: 'UNVERIFIED',
      description: `Species-specific Heritage overrides are not encoded; general ${muni.heritage_threshold_inches}-inch threshold applies.`,
    });
  }
  if (!hasCivilPenalty) {
    unverifiedGaps.push({
      field: 'mitigation_fee_schedule.penalty_civil_per_tree & penalty_citation',
      status: 'UNVERIFIED',
      description: 'Civil fine per tree and enforcement citation for unpermitted removal are not encoded.',
    });
  }

  return {
    record_tier: recordTier,
    primary_citation: muni.ordinance_numbers,
    source_url: muni.source_url,
    verified_sections: verifiedSections,
    unverified_gaps: unverifiedGaps,
  };
}

export const MCP_TOOLS = [
  {
    name: 'openarbor_consult',
    description:
      'Unified single-call intake orchestrating root zones (CRZ/SRZ/TPZ), municipal ordinance compliance, Mattheck t/R structural biomechanics, AirSpade soil sponge care, 3-stage phased triage, and audience-tailored Logical English Orchestration (LEO-RAP) guidance.',
    inputSchema: {
      type: 'object',
      properties: {
        dbh_inches: {
          type: 'number',
          description: 'Trunk Diameter at Breast Height (4.5 ft / 1.37 m) in inches. Omit if supplying circumference_inches or stems_inches.',
        },
        circumference_inches: {
          type: 'number',
          description: 'Tape measurement around trunk at 4.5 ft above soil in inches (converted via circumference / pi when dbh_inches is omitted).',
        },
        stems_inches: {
          type: 'array',
          items: { type: 'number' },
          description: 'Optional multi-stem trunk diameters in inches.',
        },
        species: {
          type: 'string',
          default: 'Live Oak',
          description: 'Common or scientific tree species name (e.g., Live Oak, Oregon White Oak, Post Oak, Pecan, Ponderosa Pine).',
        },
        jurisdiction_id: {
          type: 'string',
          maxLength: MAX_JURISDICTION_ID_LENGTH,
          default: 'tx-austin',
          description: 'Municipality ID in data/ordinances/ (tx-austin, tx-georgetown, tx-liberty-hill, tx-cedar-park, tx-round-rock, or-ashland, or-medford, or-grants-pass).',
        },
        audience: {
          type: 'string',
          enum: ['homeowner', 'practitioner', 'municipal'],
          default: 'homeowner',
          description: 'Target reader for Logical English Orchestration guidance.',
        },
        cavity_pct: {
          type: 'number',
          default: 0,
          description: 'Estimated internal trunk hollow diameter percentage (0 to 95). Treated as visual estimate unless decay_measurement_method is sonic_tomography or resistograph.',
        },
        measured_t_over_r: {
          type: 'number',
          description: 'Optional Claus Mattheck sound shell ratio (t/R).',
        },
        decay_measurement_method: {
          type: 'string',
          enum: ['visual_only', 'sounding_mallet', 'resistograph', 'sonic_tomography'],
          default: 'visual_only',
          description: 'Diagnostic method used to inspect internal trunk wood.',
        },
        crz_disturbed_pct: {
          type: 'number',
          default: 0,
          description: 'Proposed Critical Root Zone trenching or grading disturbance percentage (0 to 100).',
        },
        proposed_removal: {
          type: 'boolean',
          default: false,
          description: 'Whether tree removal is proposed under the project scope.',
        },
        pruning_date: {
          type: 'string',
          description: 'Optional planned pruning ISO date (YYYY-MM-DD) for seasonal Oak Wilt check.',
        },
        condition: {
          type: 'string',
          enum: ['Excellent', 'Good', 'Fair', 'Poor', 'Critical', 'Dead'],
          default: 'Good',
          description: 'Field condition class.',
        },
        infiltration_mm_hr: {
          type: 'number',
          description: 'Optional soil infiltration rate in mm/hr.',
        },
        organic_matter_percent: {
          type: 'number',
          description: 'Optional soil organic matter percentage (0 to 100).',
        },
      },
    },
  },
  {
    name: 'calculate_root_zone',
    description:
      'Calculate Critical Root Zone (CRZ), international Tree Protection Zone (TPZ), and Mattheck/AS 4970 Structural Root Zone (SRZ) radii and areas in imperial (ft, sq ft) and metric (m, sq m) units.',
    inputSchema: {
      type: 'object',
      required: ['dbh'],
      properties: {
        dbh: { type: 'number', description: 'Diameter at Breast Height (4.5 ft / 1.37 m) in inches or cm.' },
        unit: { type: 'string', enum: ['inches', 'cm'], default: 'inches', description: 'Unit of the provided DBH measurement.' },
        standard: {
          type: 'string',
          enum: ['US_1_1', 'US_1_1.5', 'US_1_18', 'Australian_AS4970', 'UK_BS5837', 'Custom'],
          default: 'US_1_1',
          description: 'Tree Protection Zone standard to apply.',
        },
        multiplier: { type: 'number', default: 1.0, description: 'Feet of radius per inch of DBH for CRZ or Custom TPZ.' },
        min_radius_feet: { type: 'number', default: 0, description: 'Optional municipal minimum CRZ radius floor in feet.' },
        drf_inches: { type: 'number', description: 'Optional Diameter at Root Flare (DRF) in inches for AS 4970 SRZ calculation.' },
        stems_inches: { type: 'array', items: { type: 'number' }, description: 'Optional multi-stem diameters in inches to aggregate prior to root zone calculation.' },
        multistem_method: { type: 'string', enum: ['quadratic', 'largest_plus_half', 'sum'], default: 'quadratic', description: 'Aggregation formula when stems_inches is supplied.' },
      },
    },
  },
  {
    name: 'evaluate_ordinance',
    description:
      'Evaluate a tree inventory against a municipal tree protection ordinance, returning protected/heritage flags, CRZ encroachment triggers, seasonal Oak Wilt flags, permit determinations, and mitigation fee/replacement plans.',
    inputSchema: {
      type: 'object',
      required: ['trees'],
      properties: {
        trees: {
          type: 'array',
          maxItems: MAX_EVALUATE_TREES,
          description: 'Array of tree inventory rows (max 500 rows per call; tag, species_common, species_scientific, dbh or stems_inches, removal, crz_disturbed_pct, etc.).',
          items: { type: 'object' },
        },
        jurisdiction_id: {
          type: 'string',
          maxLength: MAX_JURISDICTION_ID_LENGTH,
          description: 'Jurisdiction ID in data/ordinances/ (e.g., tx-austin, tx-georgetown, tx-liberty-hill, tx-cedar-park, tx-round-rock, or-ashland, or-medford, or-grants-pass).',
        },
        ordinance: {
          type: 'object',
          description: 'Optional inline municipal ordinance object conforming to schemas/municipal-ordinance.schema.json (used when jurisdiction_id is not provided).',
        },
      },
    },
  },
  {
    name: 'calculate_ecosystem_benefits',
    description:
      'Compute annual and 20-year allometric ecosystem services (Nowak carbon storage/sequestration, Xiao stormwater interception, dry deposition air pollution removal, McPherson shade cooling kWh, CTLA structural value) and John White (FCIN12) veteran tree age.',
    inputSchema: {
      type: 'object',
      required: ['dbh_inches'],
      properties: {
        dbh_inches: { type: 'number', description: 'Diameter at Breast Height in inches (> 0).' },
        species: { type: 'string', description: 'Scientific or common species name.' },
        condition: { type: 'string', enum: ['Excellent', 'Good', 'Fair', 'Poor', 'Critical', 'Dead'], default: 'Good', description: 'Tree condition class.' },
        land_use: { type: 'string', enum: ['Residential', 'Commercial', 'Street', 'Park'], default: 'Residential', description: 'Surrounding site land use context.' },
        height_feet: { type: 'number', description: 'Optional measured tree height in feet.' },
        canopy_spread_feet: { type: 'number', description: 'Optional measured crown spread in feet.' },
        crown_light_exposure: { type: 'number', default: 4, description: 'Crown light exposure sides (0 to 5).' },
        annual_rainfall_inches: { type: 'number', default: 35, description: 'Local mean annual precipitation in inches.' },
        projection_years: { type: 'number', default: 20, description: 'Cumulative ecosystem benefit horizon in years.' },
        base_growth_factor: { type: 'number', default: 4.5, description: 'Species growth factor for John White FCIN12 age estimation.' },
        site_condition: { type: 'string', enum: ['Open Grown / Parkland', 'Forest / Woodland', 'Urban / Street Tree'], default: 'Open Grown / Parkland', description: 'Site exposure class for John White FCIN12 age estimation.' },
      },
    },
  },
  {
    name: 'rap_biomechanics',
    description:
      'Run RAP-Spec v2.0 biomechanical and rhizosphere evaluation (Mattheck t/R hollow-shell buckling safety factor, AS 4970 SRZ, Shigo CODIT wall response, pneumatic AirSpade trench volume, and biochar/compost/humate/mulch amendment quantities).',
    inputSchema: {
      type: 'object',
      required: ['assessment'],
      properties: {
        assessment: { type: 'object', description: 'RAP assessment object conforming to schemas/rap_assessment.schema.json.' },
      },
    },
  },
  {
    name: 'rap_lint',
    description:
      'Validate a RAP assessment object with the ASCA-grade and Nature-First Evidentiary Linter, blocking un-evidenced removals when Mattheck t/R >= 0.30 and rhizosphere remediation is viable.',
    inputSchema: {
      type: 'object',
      required: ['assessment'],
      properties: {
        assessment: { type: 'object', description: 'RAP assessment object conforming to schemas/rap_assessment.schema.json.' },
      },
    },
  },
  {
    name: 'lookup_ordinance',
    description:
      'Retrieve the verified municipal tree protection ordinance record for a jurisdiction ID from data/ordinances/.',
    inputSchema: {
      type: 'object',
      required: ['jurisdiction_id'],
      properties: {
        jurisdiction_id: {
          type: 'string',
          maxLength: MAX_JURISDICTION_ID_LENGTH,
          description: 'Municipality identifier (max 128 chars; e.g., tx-austin, tx-georgetown, tx-liberty-hill, tx-cedar-park, tx-round-rock, or-ashland, or-medford, or-grants-pass).',
        },
      },
    },
  },
  {
    name: 'validate_soil_function',
    description:
      'Validate an optional soil_function provenance block (enforcing source attribution and chronological ISO measurement_dates whenever numeric soil metrics are supplied) and compute deterministic vadose storm capture and NRCS organic-matter sponge capacity.',
    inputSchema: {
      type: 'object',
      properties: {
        soil_function: { type: 'object', description: 'Optional soil_function object (infiltration_mm_hr, organic_matter_percent, water_holding_gal_acre_ft, measurement_dates, source, method).' },
        tiz_area_m2: { type: 'number', default: 100, description: 'Tree Influence Zone area in square meters for vadose sponge capacity scaling.' },
        infiltration_mm_hr: { type: 'number', description: 'Optional infiltration rate in mm/hr (used for sponge capacity when soil_function is omitted).' },
        organic_matter_percent: { type: 'number', description: 'Optional soil organic matter percentage from 0 to 100 (used for sponge capacity when soil_function is omitted).' },
      },
    },
  },
  {
    name: 'leo_rap_verify',
    description:
      'Compile a deterministic 6-Slot LEO-RAP Profile 01 stewardship brief with 3-stage phased triage, verify narrative prose against oracle anchors and the Mattheck t/R >= 0.30 anti-liquidation invariant, and run a 3-fixture negative sabotage self-audit.',
    inputSchema: {
      type: 'object',
      required: ['assessment'],
      properties: {
        assessment: { type: 'object', description: 'RAP assessment object conforming to schemas/rap_assessment.schema.json.' },
        markdown_narrative: { type: 'string', maxLength: MAX_NARRATIVE_LENGTH, description: 'Optional Markdown narrative (max 100,000 chars) to verify against deterministic oracle anchors and Mattheck stability invariants.' },
        jurisdiction_id: { type: 'string', maxLength: MAX_JURISDICTION_ID_LENGTH, description: 'Optional jurisdiction ID in data/ordinances/ to attach municipal CRZ and cash-in-lieu context.' },
        run_self_audit: { type: 'boolean', default: true, description: 'Whether to execute the 3-fixture negative sabotage self-audit gate.' },
      },
    },
  },
];

export const MCP_PROMPTS = [
  {
    name: 'homeowner-tree-guide',
    description:
      'Translate municipal tree protection rules, Critical Root Zone boundaries, Oak Wilt windows, and phased root-collar triage into calm everyday English for a homeowner.',
    arguments: [
      { name: 'species', description: 'Common or scientific species name (e.g., Live Oak)', required: false },
      { name: 'size_description', description: 'Trunk diameter or circumference measurement (e.g., 30 in DBH or 94 in around at chest height)', required: false },
      { name: 'city', description: 'Municipality name or jurisdiction ID (e.g., tx-austin)', required: false },
      { name: 'concern', description: 'Owner concern such as trenching, root flare burial, construction, or cavity', required: false },
    ],
  },
  {
    name: 'rap-practitioner-brief',
    description:
      'Prepare a Regenerative Arboriculture Protocol (RAP-Spec v2.0) diagnostic brief covering Mattheck t/R stability, AirSpade soil specifications, 3-stage triage margins, and Year-1/Year-5 STIM monitoring.',
    arguments: [
      { name: 'species', description: 'Common or scientific species name', required: false },
      { name: 'dbh_inches', description: 'Diameter at Breast Height in inches', required: false },
      { name: 'city', description: 'Jurisdiction ID in data/ordinances/', required: false },
      { name: 'diagnostic_notes', description: 'Observed hollow shell ratio, root collar depth, SGRs, or soil infiltration notes', required: false },
    ],
  },
  {
    name: 'municipal-plan-review',
    description:
      'Review proposed site plan grading, CRZ encroachment, pruning dates, and mitigation exposure against verified municipal code with explicit UNVERIFIED gap visibility.',
    arguments: [
      { name: 'city', description: 'Jurisdiction ID in data/ordinances/ (e.g., tx-austin, tx-cedar-park, or-ashland)', required: false },
      { name: 'tree_summary', description: 'Summary of tree tag(s), species, and DBH', required: false },
      { name: 'proposed_work', description: 'Proposed trenching %, impervious cover, pruning date, or removal request', required: false },
    ],
  },
];

export function getMcpPrompt(name, rawArgs = {}) {
  const args = rawArgs && typeof rawArgs === 'object' ? rawArgs : {};
  const species = args.species || 'Live Oak';
  const city = args.city || 'tx-austin';

  switch (name) {
    case 'homeowner-tree-guide': {
      const sizeText = args.size_description || '30 inches diameter (or 94.2 inches around the trunk at 4.5 ft)';
      const concern = args.concern || 'utility trenching near the root zone and overall structural health';
      return {
        description: 'Plain-English homeowner tree consultation using Logical English Orchestration (LEO-RAP).',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: [
                `I need a clear, plain-language assessment for a homeowner asking about a ${species} (${sizeText}) in ${city}. Main concern: ${concern}.`,
                'Workflow:',
                '1. Call the `openarbor_consult` MCP tool with `audience: "homeowner"`, converting any circumference measurement via `circumference_inches` if DBH was not measured directly.',
                '2. Lead with Layer 1 facts first: protected or heritage status, whether a city permit is triggered, and the Critical Root Zone radius expressed in everyday yard landmarks (steps/feet from the trunk).',
                '3. Keep Layer 2 models (CTLA value, 200-year ecological equity, and Stage 1 vs. removal cost estimates) in a clearly labeled optional section with declared assumptions.',
                '4. Never cite an unmeasured Mattheck t/R ratio as fact: if no resistograph or sonic tomogram was run, tell the homeowner a certified arborist must inspect internal wood on site before cutting.',
                '5. If the municipality is a Threshold_And_Fee_Record, state every UNVERIFIED statutory subsection clearly rather than guessing.',
              ].join('\n'),
            },
          },
        ],
      };
    }

    case 'rap-practitioner-brief': {
      const dbh = args.dbh_inches || '30';
      const notes = args.diagnostic_notes || 'assess root collar burial, stem-girdling roots, and 150 psi AirSpade radial trenching';
      return {
        description: 'Technical RAP-Spec v2.0 diagnostic and stewardship brief for a consulting or practicing arborist.',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: [
                `Prepare a peer-level RAP-Spec v2.0 technical stewardship brief for a ${dbh}-inch DBH ${species} in ${city}. Field notes: ${notes}.`,
                'Workflow:',
                '1. Call `openarbor_consult` with `audience: "practitioner"` as the primary single-call baseline.',
                '2. When a complete 5-domain `rap_assessment.schema.json` file or lab soil readings with ISO dates are supplied, also validate with `rap_lint`, `validate_soil_function`, and `leo_rap_verify`.',
                '3. State exact ANSI A300 CRZ, AS 4970 SRZ, Mattheck t/R buckling ratio (with instrument provenance status), AirSpade radial volume, biochar/compost/humate/mulch quantities, 3-stage phased triage economics, and Year-1/Year-5 STIM kill criteria.',
                '4. Preserve the t/R >= 0.30 anti-liquidation gate and surface all UNVERIFIED gaps.',
              ].join('\n'),
            },
          },
        ],
      };
    }

    case 'municipal-plan-review': {
      const treeSummary = args.tree_summary || '30-inch DBH Live Oak (ATX-QV-101)';
      const work = args.proposed_work || '15% CRZ trenching near drip line';
      return {
        description: 'Municipal compliance and permit screening guide with explicit gap visibility.',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: [
                `Perform a municipal tree protection compliance review in jurisdiction ${city} for ${treeSummary} with proposed work: ${work}.`,
                'Workflow:',
                '1. Call `openarbor_consult` with `audience: "municipal"` for a single specimen, or `evaluate_ordinance` (up to 500 rows) for a multi-tree site plan inventory.',
                '2. Lead strictly with statutory classification, ordinance chapter/section citation, permit triggers, seasonal Oak Wilt restrictions, and statutory replacement inches or cash-in-lieu liability.',
                '3. List every UNVERIFIED subsection from the jurisdiction provenance record before concluding so plan reviewers do not rely on omitted defaults.',
              ].join('\n'),
            },
          },
        ],
      };
    }

    default:
      return null;
  }
}

export function formatToolResult(payload, isError = false) {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(payload, null, 2),
      },
    ],
    structuredContent: payload,
    isError,
  };
}

function buildConsultAudienceGuidance({
  audience,
  speciesInfo,
  dbhInches,
  circumferenceInches,
  muni,
  protectionTier,
  permit,
  permitText,
  crz,
  srz,
  tOverR,
  instrumentVerified,
  decayMethod,
  oakWiltWarning,
  mitigationIfRemoved,
  triage,
  spongeCapacity,
  valuation,
  benefits,
  ageEstimate,
  provenance,
}) {
  const gapCount = provenance?.unverified_gaps?.length || 0;
  const stage1 = triage.stages[0];
  const removalMitUsd = Number(mitigationIfRemoved?.cash_in_lieu_usd || 0);
  const commonSci = `${speciesInfo.common} (${speciesInfo.scientific})`;
  const crzSteps = Math.max(1, Math.round(crz.radius_feet / 2.5));

  if (audience === 'practitioner') {
    const shellClause = instrumentVerified
      ? `Instrument-verified Mattheck t/R = ${tOverR} via ${decayMethod} (${tOverR >= 0.3 ? 'satisfies >= 0.30 sound shell criterion' : 'below 0.30 buckling limit'}).`
      : `Visual-only shell model t/R = ${tOverR} (${decayMethod}; unverified on-site until resistograph or sonic tomography confirms wall thickness).`;
    return {
      audience: 'practitioner',
      voice: 'RAP Practitioner & Consulting Arborist (Peer Technical)',
      translation_rules: [
        'Separate Layer 1 statutory/physical metrics (DBH, CRZ, SRZ, permit triggers) from Layer 2 economic and ecological models.',
        'Declare instrument provenance explicitly whenever Mattheck t/R comes from visual inspection rather than sonic tomography or resistograph.',
        'Include 150 psi AirSpade radial trenching amendments, 3-stage phased triage figures as illustrative practice models, and Year-1 STIM kill criteria.',
        'Surface all UNVERIFIED statutory subsections verbatim on Threshold_And_Fee_Record cities.',
      ],
      digest_summary: `${commonSci} at ${dbhInches} in DBH in ${muni.name}, ${muni.state} classifies as ${protectionTier} under ${muni.ordinance_numbers}. Statutory CRZ radius is ${crz.radius_feet} ft (${crz.radius_meters} m); AS 4970 SRZ windthrow plate is ${srz.radius_feet} ft (${srz.radius_meters} m). ${shellClause} ${permitText} City removal mitigation liability models at ${usd(removalMitUsd)} (${mitigationIfRemoved?.replacement_inches_owed || 0} replacement inches). Modeled Stage 1 collar triage (${usd(stage1.client_price_usd)}) undercuts illustrative removal (${usd(triage.removal_bid_usd)}), while 5-year RAP stewardship returns a modeled ${triage.net_margin_multiplier}x practitioner margin multiplier and preserves modeled ${usd(valuation.holobiont_200yr_biological_equity_usd)} 200-year equity vs. ${usd(valuation.ctla_10th_ed_depreciated_usd)} CTLA.${oakWiltWarning ? ` ${oakWiltWarning}` : ''}`,
      recommended_next_step: instrumentVerified
        ? 'Execute Stage 1 root-collar AirSpade excavation, relieve any stem-girdling roots, and establish Year-1 fixed photopoint and shoot-extension baselines.'
        : 'Confirm internal wall thickness on site with a resistograph or sonic tomogram alongside pneumatic root-collar excavation before prescribing structural work.',
    };
  }

  if (audience === 'municipal') {
    const gapNotice =
      gapCount > 0
        ? ` Dataset completeness is ${provenance.record_tier} with ${gapCount} explicit UNVERIFIED subsection(s) flagged below.`
        : ' Dataset completeness is Full_Rule_Record (0 missing core rule domains).';
    return {
      audience: 'municipal',
      voice: 'Municipal Plan Review & Urban Forestry Code Officer',
      translation_rules: [
        'Lead strictly with statutory classification, ordinance chapter/section citation, and formal permit requirement.',
        'Report CRZ and half-CRZ protection radii in feet and metric alongside replacement caliper inches and cash-in-lieu calculations.',
        'Highlight Oak Wilt pruning restrictions when Quercus specimens occur in covered Texas jurisdictions.',
        'List every UNVERIFIED subsection from provenance before issuing plan-review guidance.',
      ],
      digest_summary: `Under ${muni.ordinance_numbers} (${muni.name}, ${muni.state}), the ${dbhInches} in DBH ${commonSci} qualifies as ${protectionTier}. Statutory Critical Root Zone radius is ${crz.radius_feet} ft (${crz.half_radius_feet} ft half-CRZ structural zone). Disposition status: ${permitText} Removal mitigation calculation equals ${mitigationIfRemoved?.replacement_inches_owed || 0} replacement caliper inches or ${usd(removalMitUsd)} cash-in-lieu (CTLA depreciated structural reference model: ${usd(valuation.ctla_10th_ed_depreciated_usd)}).${oakWiltWarning ? ` ${oakWiltWarning}` : ''}${gapNotice}`,
      recommended_next_step:
        permit.required || permit.unknown
          ? `Require formal municipal tree permit documentation citing ${muni.ordinance_numbers} and verify CRZ fencing perimeter at ${crz.radius_feet} ft before grading or trenching.`
          : `Confirm tree protection fencing at ${crz.radius_feet} ft on approved civil sheets prior to site disturbance.`,
    };
  }

  // Default: homeowner (warm, clear everyday English; omits unverified t/R claims in favor of on-site check)
  const permitPlain = permit.unknown
    ? `Open Arbor cannot confirm whether a city permit is required in ${muni.name} because this city's permit trigger subsections are marked UNVERIFIED, so call the city planning desk before any cutting or digging.`
    : permit.required
    ? `${muni.name} rules require a city permit before the proposed work on this ${protectionTier.toLowerCase()} tree.`
    : `No city permit is triggered under ${muni.name} rules for the non-destructive care entered here, though you still need a permit before removing a protected tree.`;
  const decayPlain = instrumentVerified
    ? `An instrument check (${decayMethod}) indicates the outer living wood wall keeps ${tOverR >= 0.3 ? 'adequate structural strength for preservation' : 'less than the 0.30 shell threshold, so an arborist should inspect crown load right away'}.`
    : 'Because no resistograph or sonic tomogram has been run inside the trunk yet, do not assume a visible hollow makes the tree unsafe or safe without an on-site arborist check.';
  const mitigationPlain =
    removalMitUsd > 0
      ? ` Removing a healthy tree this size would trigger about ${usd(removalMitUsd)} in city mitigation fees or ${mitigationIfRemoved?.replacement_inches_owed || 0} inches of replacement plantings.`
      : '';

  return {
    audience: 'homeowner',
    voice: 'Homeowner & Land Steward (Plain English)',
    translation_rules: [
      'Translate DBH and CRZ into everyday terms: trunk circumference at chest height (4.5 ft) and walking paces outward across the shallow pancake of roots.',
      'State protection status and permit rules plainly at the top; never claim a permit rule that is UNVERIFIED for the city.',
      'Explain clearly when decay findings are only a visual guess versus an instrument measurement.',
      'Label dollar valuations and age as models with their stated assumptions rather than guarantees.',
    ],
    digest_summary: `Your ${speciesInfo.common} measures ${dbhInches} inches across the trunk (${circumferenceInches} inches around with a tape measure at 4.5 ft), which makes it a ${protectionTier} tree in ${muni.name}, ${muni.state} (${muni.ordinance_numbers}). Its Critical Root Zone reaches ${crz.radius_feet} feet out in every direction from the trunk (about ${crzSteps} adult walking paces), while its primary anchor root plate spans ${srz.radius_feet} feet. ${permitPlain}${mitigationPlain} ${decayPlain} Modeled soil sponge capacity across its root influence zone holds ${spongeCapacity.storm_1in_capture_gallons.toLocaleString('en-US')} gallons during a 1-inch rainstorm, and the tree captures an estimated ${benefits.carbon_sequestration_lbs_yr} lbs of carbon each year (model estimate: roughly ${ageEstimate.estimated_age_years} years old). Before considering tree removal (modeled at roughly ${usd(triage.removal_bid_usd)}), Stage 1 root-collar inspection and care starts at an illustrative ${usd(stage1.client_price_usd)}.${oakWiltWarning ? ` ${oakWiltWarning}` : ''}`,
    recommended_next_step:
      'Keep excavation, heavy trucks, soil piling, and weed-fabric away from the ' +
      `${crz.radius_feet}-ft root zone, and invite an ISA Certified or RAP arborist to inspect the root flare on site first.`,
  };
}

function executeConsultTool(safeArgs, ordinanceCatalog) {
  const jurInput = String(safeArgs.jurisdiction_id || 'tx-austin');
  if (jurInput.length > MAX_JURISDICTION_ID_LENGTH) {
    return formatToolResult(
      {
        error: 'JURISDICTION_ID_TOO_LONG',
        max_length: MAX_JURISDICTION_ID_LENGTH,
        received_length: jurInput.length,
        message: `jurisdiction_id exceeds maximum length of ${MAX_JURISDICTION_ID_LENGTH} characters.`,
      },
      true
    );
  }

  const jurId = jurInput.toLowerCase().trim() || 'tx-austin';
  const entry = ordinanceCatalog?.get(jurId);
  if (!entry) {
    return formatToolResult(
      {
        error: 'UNKNOWN_JURISDICTION',
        message: `No ordinance record found for jurisdiction_id '${safeArgs.jurisdiction_id}'.`,
        available_jurisdictions: ordinanceCatalog ? Array.from(ordinanceCatalog.keys()) : [],
      },
      true
    );
  }
  const muni = entry.record;

  const stems = Array.isArray(safeArgs.stems_inches)
    ? safeArgs.stems_inches.map(Number).filter((n) => Number.isFinite(n) && n > 0)
    : [];
  const multiMethod = muni.plan_rules?.survey?.multi_trunk || safeArgs.multistem_method || 'quadratic';

  let dbhInches = Number(safeArgs.dbh_inches ?? safeArgs.dbh ?? 0);
  if ((!Number.isFinite(dbhInches) || dbhInches <= 0) && Number(safeArgs.circumference_inches) > 0) {
    dbhInches = Number(safeArgs.circumference_inches) / Math.PI;
  } else if ((!Number.isFinite(dbhInches) || dbhInches <= 0) && stems.length > 0) {
    dbhInches = stems.length === 1 ? stems[0] : calculateMultiStemDBH(stems, multiMethod);
  }
  if (!Number.isFinite(dbhInches) || dbhInches <= 0) {
    return formatToolResult(
      {
        error: 'INVALID_DBH',
        message: 'Provide a positive dbh_inches, circumference_inches, or non-empty stems_inches array.',
      },
      true
    );
  }

  dbhInches = round2(dbhInches);
  const dbhCm = round2(dbhInches * 2.54);
  const circumferenceInches = round1(dbhInches * Math.PI);
  const speciesInfo = resolveSpeciesInfo(safeArgs.species);
  const audience = ['homeowner', 'practitioner', 'municipal'].includes(safeArgs.audience)
    ? safeArgs.audience
    : 'homeowner';
  const condition = ['Excellent', 'Good', 'Fair', 'Poor', 'Critical', 'Dead'].includes(safeArgs.condition)
    ? safeArgs.condition
    : 'Good';

  const decayMethod = ['visual_only', 'sounding_mallet', 'resistograph', 'sonic_tomography'].includes(
    safeArgs.decay_measurement_method
  )
    ? safeArgs.decay_measurement_method
    : 'visual_only';
  const instrumentVerified =
    decayMethod === 'resistograph' || decayMethod === 'sonic_tomography';
  const clampedCavityPct = Math.max(0, Math.min(95, Number(safeArgs.cavity_pct ?? 0) || 0));
  const tOverR =
    safeArgs.measured_t_over_r != null && Number.isFinite(Number(safeArgs.measured_t_over_r))
      ? round2(Math.max(0.05, Math.min(1.0, Number(safeArgs.measured_t_over_r))))
      : round2(Math.max(0.05, Math.min(1.0, 1 - clampedCavityPct / 100)));

  const crzMult = Number(muni.plan_rules?.root_zone?.crz_ft_per_inch) || 1.0;
  const crzMin = Number(muni.plan_rules?.root_zone?.crz_min_ft) || 0;
  const crz = calculateCRZ(dbhInches, crzMult, crzMin);
  const drfInches = round2(dbhInches * 1.25);
  const srz = calculateSRZ(drfInches, dbhInches);
  const tpzAs4970 = calculateTPZ(dbhInches, 'inches', 'Australian_AS4970');
  const crzDisturbedPct = Math.max(0, Math.min(100, Number(safeArgs.crz_disturbed_pct ?? 0) || 0));
  const proposedRemoval = Boolean(safeArgs.proposed_removal);
  const pruningDate = typeof safeArgs.pruning_date === 'string' ? safeArgs.pruning_date.trim() : '';

  const coords = muni.coordinates || { lat: 30.27, lng: -97.74 };
  const condScoreMap = { Excellent: 10, Good: 8, Fair: 6, Poor: 4, Critical: 2, Dead: 0 };
  const effectiveStems = stems.length > 0 ? stems : [dbhInches];
  const baseRow = {
    tag: 'CONSULT-01',
    species_common: speciesInfo.common,
    species_scientific: speciesInfo.scientific,
    stems_inches: effectiveStems,
    dbh_inches: dbhInches,
    lat: coords.lat,
    lng: coords.lng,
    condition_score: condScoreMap[condition] ?? 8,
    removal: proposedRemoval,
    pruning_date: pruningDate || undefined,
    crz_disturbed_pct: crzDisturbedPct,
    actions: pruningDate ? ['pruning'] : [],
  };

  const evaluatedRows = evaluateTreeInventory([baseRow], muni);
  const evaluatedRow = evaluatedRows[0];
  const protectionTier = statusLabel(evaluatedRow);
  const permit = permitDetermination(evaluatedRows, muni);
  const permitText = permitSummary(permit);
  const removedRows = evaluateTreeInventory([{ ...baseRow, removal: true }], muni);
  const mitigationIfRemoved = computeMitigationPlan(removedRows, muni);
  const provenance = inspectOrdinanceGaps(muni);

  const benefits = calculateTreeEcosystemBenefits({
    species_name: speciesInfo.scientific,
    common_name: speciesInfo.common,
    dbh_inches: dbhInches,
    condition_class: condition,
    land_use: 'Residential',
  });
  const ageEstimate = estimateTreeAge({
    dbh_inches: dbhInches,
    base_growth_factor: speciesInfo.growth_factor,
    site_condition: 'Open Grown / Parkland',
  });

  const tizRadiusM = round2(crz.radius_meters * 1.5);
  const tizAreaM2 = round2(Math.PI * tizRadiusM ** 2);
  const infRate = safeArgs.infiltration_mm_hr != null ? Number(safeArgs.infiltration_mm_hr) : 16;
  const somPct =
    safeArgs.organic_matter_percent != null ? Number(safeArgs.organic_matter_percent) : 2.6;
  const spongeCapacity = estimateSoilSpongeCapacity({
    tiz_area_m2: tizAreaM2,
    infiltration_mm_hr: infRate,
    organic_matter_percent: somPct,
  });

  const txOak = isOakSpecies(speciesInfo.common, speciesInfo.scientific) && jurId.startsWith('tx-');
  const oakWiltWarning = txOak
    ? 'Texas Oak Wilt advisory: avoid non-emergency oak pruning February through June and paint fresh cuts immediately.'
    : '';

  const structuralBaseline = {
    tree_tag: 'CONSULT-01',
    species_scientific: speciesInfo.scientific,
    species_common: speciesInfo.common,
    inaturalist_taxon_id: speciesInfo.taxon_id,
    assessment_date: pruningDate || '2026-10-28',
    dbh_cm: dbhCm,
    is_multistem: effectiveStems.length > 1,
    multistem_aggregation_method: effectiveStems.length > 1 ? multiMethod : 'single_stem',
    height_m: round1(benefits.estimated_height_feet * 0.3048),
    crown_spread_ns_m: round1(benefits.estimated_canopy_spread_feet * 0.3048),
    crown_spread_ew_m: round1(benefits.estimated_canopy_spread_feet * 0.3048),
    live_crown_ratio_pct: 75,
    plus_code_global: jurId.startsWith('or-') ? '84JV57VR+R6' : '8624M38F+4X',
    codit_wall_response_rating: 'Wall_4_Active_Barrier_Zone',
    sound_shell_thickness_ratio_t_over_r: tOverR,
    municipal_permit_disposition: {
      jurisdiction_id: muni.id,
      ordinance_citation: muni.ordinance_numbers,
      protection_tier: protectionTier,
      permit_required: Boolean(permit.required),
      recommended_disposition:
        tOverR >= 0.3
          ? 'Preservation_With_Rhizosphere_Remediation'
          : 'Level_3_Mitigation_And_Crown_Load_Review',
      seasonal_oak_wilt_restriction_active: Boolean(
        evaluatedRow.flags.some((f) => /oak wilt/i.test(f))
      ),
    },
  };
  if (instrumentVerified) {
    structuralBaseline.sonic_tomography_or_resistograph_uri =
      typeof safeArgs.instrument_uri === 'string' && safeArgs.instrument_uri.trim()
        ? safeArgs.instrument_uri.trim()
        : `field-instrument://${decayMethod}-verified`;
  }

  const syntheticAssessment = {
    schema_version: 'RAP_v2',
    assessment_mode: 'Regenerative Diagnostic',
    structural_baseline: structuralBaseline,
    rhizosphere_and_root_collar: {
      root_flare_burial_depth_cm: 15,
      root_flare_diameter_cm: round1(drfInches * 2.54),
      stem_girdling_root_count: 1,
      stem_girdling_root_severity: 'Minor_Under_25_Pct_Circumference',
      airspade_radial_trenching_geometry: {
        execution_status: 'Prescribed_Radial_Remediation',
        operating_pressure_psi: 150,
        trench_count: 8,
        trench_length_m: round2(crz.radius_meters * 0.75),
        trench_width_cm: 30,
        trench_depth_cm: 35,
        root_collar_excavation_radius_m: 1.0,
      },
      crz_radius_m: crz.radius_meters,
      srz_radius_m: srz.radius_meters,
      tiz_radius_m: tizRadiusM,
    },
    soil_and_microbiome_baseline: {
      bulk_density_g_cm3: 1.5,
      infiltration_rate_mm_hr: infRate,
      organic_matter_pct: somPct,
      mycorrhizal_and_fungal_observations: {
        dominant_mycorrhizal_guild: speciesInfo.guild,
        fungal_to_bacterial_biomass_ratio: 0.45,
      },
    },
    understory_and_guild_prescription: {
      native_companion_species_guild: [
        { common_name: 'Native Understory Shrubs', quantity_planted: 12 },
        { common_name: 'Native Carex Groundcover Matrix', quantity_planted: 24 },
      ],
    },
    outcome_monitoring_schedule: {
      stim_kill_criterion:
        'If Year-1 terminal shoot extension remains below 6 cm or upper crown dieback exceeds 12%, halt amendment staging and re-inspect root collar, vadose drainage, and vascular health.',
    },
  };

  const biomechanics = evaluateBiomechanicsAndRhizosphere(syntheticAssessment);
  const valuation = computeHolobiontValuation(syntheticAssessment);
  const economics = computeRegenerativePracticeEconomics(syntheticAssessment);
  const triage = computePhasedStewardshipTriage(syntheticAssessment, economics);
  const evalContext = {
    biomechanics,
    valuation,
    economics,
    triage,
    municipality: muni,
    rootZones: { crz, srz },
    evaluatedRow,
    permitText,
    mitigationIfRemoved,
    provenance,
  };
  const compiledBrief = compileLeoRapBrief(syntheticAssessment, evalContext);
  const handoffBrief = composeArboristHandoffBrief({
    speciesCommon: speciesInfo.common,
    speciesScientific: speciesInfo.scientific,
    dbhInches,
    cityLabel: `${muni.name}, ${muni.state}`,
    protectionStatus: protectionTier,
    tOverR,
    crzFeet: crz.radius_feet,
    holobiontUsd: valuation.holobiont_200yr_biological_equity_usd,
    ctlaUsd: valuation.ctla_10th_ed_depreciated_usd,
    cashInLieuUsd: mitigationIfRemoved?.cash_in_lieu_usd || 0,
    stage1Usd: triage.stages[0].client_price_usd,
    removalBidUsd: triage.removal_bid_usd,
    marginMultiplier: triage.net_margin_multiplier,
    oakWiltWarning,
    sonicTomographyVerified: instrumentVerified,
  });

  const audienceGuidance = buildConsultAudienceGuidance({
    audience,
    speciesInfo,
    dbhInches,
    circumferenceInches,
    muni,
    protectionTier,
    permit,
    permitText,
    crz,
    srz,
    tOverR,
    instrumentVerified,
    decayMethod,
    oakWiltWarning,
    mitigationIfRemoved,
    triage,
    spongeCapacity,
    valuation,
    benefits,
    ageEstimate,
    provenance,
  });

  return formatToolResult({
    audience_guidance: audienceGuidance,
    determination: {
      layer: 'Layer 1 Primary Statutory and Physical Determination',
      species_common: speciesInfo.common,
      species_scientific: speciesInfo.scientific,
      dbh_inches: dbhInches,
      dbh_cm: dbhCm,
      circumference_inches: circumferenceInches,
      condition,
      jurisdiction: {
        id: muni.id,
        name: muni.name,
        state: muni.state,
        ordinance_numbers: muni.ordinance_numbers,
        source_url: muni.source_url,
      },
      protection_status: protectionTier,
      permit_determination: permit,
      permit_summary: permitText,
      flags: evaluatedRow.flags,
      oak_wilt_warning: oakWiltWarning || null,
      root_zones: {
        crz,
        srz,
        tpz_as4970: tpzAs4970,
        tiz_radius_m: tizRadiusM,
        tiz_area_m2: tizAreaM2,
      },
      structural_shell: {
        t_over_r: tOverR,
        cavity_pct: clampedCavityPct,
        decay_measurement_method: decayMethod,
        instrument_verified: instrumentVerified,
        mattheck_criterion_satisfied: tOverR >= 0.3,
        stability_rating: biomechanics.biomechanics.stability_rating,
      },
      mitigation_if_removed: mitigationIfRemoved,
      provenance,
    },
    stewardship_prescription: {
      rhizosphere_prescription: biomechanics.rhizosphere_prescription,
      soil_sponge_capacity: spongeCapacity,
      phased_stewardship_triage: triage,
      triage_model_note:
        'Illustrative regional contractor cost and Stage 1 triage model calibrated for mature specimens; confirm local bids on site.',
    },
    secondary_models: {
      layer: 'Layer 2 and Layer 3 Secondary Models (Assumptions Declared)',
      assumptions:
        'Estimates depend on John White FCIN12 growth factors, Nowak/Xiao/McPherson urban forestry allometrics, CTLA 10th Edition Trunk Formula inputs, and 200-year holobiont habitat multipliers.',
      age_estimate: ageEstimate,
      ecosystem_benefits: benefits,
      dual_valuation: valuation,
      practice_economics: economics,
    },
    leo_rap_orchestration: {
      status_line: compiledBrief.status_line,
      oracle_anchors: compiledBrief.oracle_anchors,
      unverified_tokens: compiledBrief.unverified_tokens,
      brief_markdown: compiledBrief.brief_markdown,
      handoff_messages: handoffBrief,
    },
  });
}

/**
 * Execute a named MCP tool call deterministically.
 * @param {string} name
 * @param {object} args
 * @param {Map<string, {record: object, file: string, region: string}>} ordinanceCatalog
 */
export function executeMcpTool(name, args = {}, ordinanceCatalog = new Map()) {
  const safeArgs = args && typeof args === 'object' ? args : {};

  switch (name) {
    case 'openarbor_consult':
    case 'consult_tree':
      return executeConsultTool(safeArgs, ordinanceCatalog);

    case 'calculate_root_zone': {
      const unit = safeArgs.unit || 'inches';
      const standard = safeArgs.standard || 'US_1_1';
      const multiplier = safeArgs.multiplier != null ? Number(safeArgs.multiplier) : 1.0;
      const minRadiusFeet = safeArgs.min_radius_feet != null ? Number(safeArgs.min_radius_feet) : 0;

      let rawDbh = Number(safeArgs.dbh ?? safeArgs.dbh_inches ?? 0);
      if ((!rawDbh || rawDbh <= 0) && Array.isArray(safeArgs.stems_inches) && safeArgs.stems_inches.length > 0) {
        rawDbh = calculateMultiStemDBH(safeArgs.stems_inches, safeArgs.multistem_method || 'quadratic');
      }
      if (!rawDbh || rawDbh <= 0) {
        return formatToolResult(
          { error: 'INVALID_DBH', message: 'dbh must be a positive number (or supply non-empty stems_inches).' },
          true
        );
      }

      const dbhInches = unit === 'cm' ? rawDbh / 2.54 : rawDbh;
      const dbhCm = unit === 'inches' ? rawDbh * 2.54 : rawDbh;
      const tpz = calculateTPZ(rawDbh, unit, standard, multiplier);
      const crz = calculateCRZ(dbhInches, multiplier, minRadiusFeet);
      const srz = calculateSRZ(safeArgs.drf_inches != null ? Number(safeArgs.drf_inches) : null, dbhInches);

      return formatToolResult({
        dbh_input: rawDbh,
        unit,
        dbh_inches: round2(dbhInches),
        dbh_cm: round2(dbhCm),
        standard,
        radius_feet: tpz.radius_feet,
        radius_meters: tpz.radius_meters,
        area_sqft: tpz.area_sqft,
        area_sqm: tpz.area_sqm,
        formula_used: tpz.formula_used,
        crz,
        tpz,
        srz,
      });
    }

    case 'evaluate_ordinance': {
      const trees = Array.isArray(safeArgs.trees)
        ? safeArgs.trees
        : Array.isArray(safeArgs.tree_rows)
        ? safeArgs.tree_rows
        : null;
      if (!trees) {
        return formatToolResult(
          { error: 'INVALID_TREES_INPUT', message: 'evaluate_ordinance requires a trees array.' },
          true
        );
      }
      if (trees.length > MAX_EVALUATE_TREES) {
        return formatToolResult(
          {
            error: 'MAX_TREES_EXCEEDED',
            max_trees: MAX_EVALUATE_TREES,
            received_trees: trees.length,
            message: `evaluate_ordinance accepts at most ${MAX_EVALUATE_TREES} tree rows per call (received ${trees.length}) to bound 1-ft spatial grid union evaluation.`,
          },
          true
        );
      }
      if (safeArgs.jurisdiction_id && String(safeArgs.jurisdiction_id).length > MAX_JURISDICTION_ID_LENGTH) {
        return formatToolResult(
          {
            error: 'JURISDICTION_ID_TOO_LONG',
            max_length: MAX_JURISDICTION_ID_LENGTH,
            received_length: String(safeArgs.jurisdiction_id).length,
            message: `jurisdiction_id exceeds maximum length of ${MAX_JURISDICTION_ID_LENGTH} characters.`,
          },
          true
        );
      }

      let ordinanceRecord = safeArgs.ordinance || null;
      let sourceMeta = null;
      if (!ordinanceRecord && safeArgs.jurisdiction_id) {
        const found = ordinanceCatalog.get(String(safeArgs.jurisdiction_id).toLowerCase().trim());
        if (!found) {
          return formatToolResult(
            {
              error: 'UNKNOWN_JURISDICTION',
              message: `No ordinance record found for jurisdiction_id '${safeArgs.jurisdiction_id}'.`,
              available_jurisdictions: Array.from(ordinanceCatalog.keys()),
            },
            true
          );
        }
        ordinanceRecord = found.record;
        sourceMeta = { file: found.file, region: found.region };
      }
      if (!ordinanceRecord) {
        return formatToolResult(
          { error: 'MISSING_ORDINANCE', message: 'Provide either jurisdiction_id or an inline ordinance object.' },
          true
        );
      }

      const evaluatedRows = evaluateTreeInventory(trees, ordinanceRecord);
      const permit = permitDetermination(evaluatedRows, ordinanceRecord);
      return formatToolResult({
        jurisdiction: {
          id: ordinanceRecord.id,
          name: ordinanceRecord.name,
          state: ordinanceRecord.state,
          ordinance_numbers: ordinanceRecord.ordinance_numbers,
          source_url: ordinanceRecord.source_url,
          ...(sourceMeta || {}),
        },
        evaluated_trees: evaluatedRows,
        permit_determination: permit,
        permit_summary: permitSummary(permit),
        mitigation_plan: computeMitigationPlan(evaluatedRows, ordinanceRecord),
        remediation_estimate: estimateRootZoneRemediation(evaluatedRows),
      });
    }

    case 'calculate_ecosystem_benefits': {
      const dbhInches = Number(safeArgs.dbh_inches ?? safeArgs.dbh ?? 0);
      if (!dbhInches || dbhInches <= 0) {
        return formatToolResult(
          { error: 'INVALID_DBH', message: 'dbh_inches must be a positive number.' },
          true
        );
      }
      const benefits = calculateTreeEcosystemBenefits({
        species_name: safeArgs.species || safeArgs.species_name || 'Quercus virginiana',
        common_name: safeArgs.common_name || safeArgs.species || '',
        dbh_inches: dbhInches,
        height_feet: safeArgs.height_feet ?? null,
        canopy_spread_feet: safeArgs.canopy_spread_feet ?? null,
        condition_class: safeArgs.condition || safeArgs.condition_class || 'Good',
        crown_light_exposure: safeArgs.crown_light_exposure ?? 4,
        land_use: safeArgs.land_use || 'Residential',
        annual_rainfall_inches: safeArgs.annual_rainfall_inches ?? 35,
        projection_years: safeArgs.projection_years ?? 20,
      });
      const ageEstimate = estimateTreeAge({
        dbh_inches: dbhInches,
        base_growth_factor: safeArgs.base_growth_factor ?? 4.5,
        site_condition: safeArgs.site_condition || 'Open Grown / Parkland',
      });
      return formatToolResult({ ...benefits, age_estimate: ageEstimate });
    }

    case 'rap_biomechanics':
    case 'rca_biomechanics': {
      const assessment = safeArgs.assessment || (safeArgs.structural_baseline ? safeArgs : null);
      if (!assessment || typeof assessment !== 'object') {
        return formatToolResult(
          { error: 'INVALID_ASSESSMENT', message: `${name} requires an assessment object with structural_baseline.` },
          true
        );
      }
      try {
        return formatToolResult(evaluateBiomechanicsAndRhizosphere(assessment));
      } catch (err) {
        return formatToolResult({ error: 'RAP_BIOMECHANICS_ERROR', message: err.message }, true);
      }
    }

    case 'rap_lint':
    case 'rca_lint': {
      const assessment = safeArgs.assessment || (safeArgs.structural_baseline ? safeArgs : null);
      if (!assessment || typeof assessment !== 'object') {
        return formatToolResult(
          { error: 'INVALID_ASSESSMENT', message: `${name} requires an assessment object.` },
          true
        );
      }
      return formatToolResult(lintRapEvidentiaryReport(assessment));
    }

    case 'lookup_ordinance': {
      const rawInput = String(safeArgs.jurisdiction_id || '');
      if (rawInput.length > MAX_JURISDICTION_ID_LENGTH) {
        return formatToolResult(
          {
            error: 'JURISDICTION_ID_TOO_LONG',
            max_length: MAX_JURISDICTION_ID_LENGTH,
            received_length: rawInput.length,
            message: `jurisdiction_id exceeds maximum length of ${MAX_JURISDICTION_ID_LENGTH} characters.`,
          },
          true
        );
      }
      const rawId = rawInput.toLowerCase().trim();
      if (!rawId) {
        return formatToolResult(
          {
            error: 'MISSING_JURISDICTION_ID',
            message: 'jurisdiction_id is required.',
            available_jurisdictions: Array.from(ordinanceCatalog.keys()),
          },
          true
        );
      }
      const entry = ordinanceCatalog.get(rawId);
      if (!entry) {
        return formatToolResult(
          {
            error: 'UNKNOWN_JURISDICTION',
            message: `Unknown jurisdiction '${safeArgs.jurisdiction_id}'.`,
            available_jurisdictions: Array.from(ordinanceCatalog.keys()),
          },
          true
        );
      }
      return formatToolResult({
        dataset_file: entry.file,
        dataset_region: entry.region,
        ordinance: entry.record,
      });
    }

    case 'validate_soil_function': {
      try {
        const hasExplicitBlock = Object.prototype.hasOwnProperty.call(safeArgs, 'soil_function');
        const hasTopLevelMeta =
          Object.prototype.hasOwnProperty.call(safeArgs, 'measurement_dates') ||
          Object.prototype.hasOwnProperty.call(safeArgs, 'source') ||
          Object.prototype.hasOwnProperty.call(safeArgs, 'method') ||
          Object.prototype.hasOwnProperty.call(safeArgs, 'water_holding_gal_acre_ft');

        let rawSoil = null;
        if (hasExplicitBlock) {
          rawSoil = safeArgs.soil_function;
        } else if (hasTopLevelMeta) {
          rawSoil = {};
          for (const k of [
            'infiltration_mm_hr',
            'organic_matter_percent',
            'water_holding_gal_acre_ft',
            'measurement_dates',
            'source',
            'method',
          ]) {
            if (Object.prototype.hasOwnProperty.call(safeArgs, k)) rawSoil[k] = safeArgs[k];
          }
        }

        const normalized = validateSoilFunction(rawSoil);
        const tizAreaM2 = safeArgs.tiz_area_m2 != null ? Number(safeArgs.tiz_area_m2) : 100;
        const infRate =
          normalized?.infiltration_mm_hr ??
          (safeArgs.infiltration_mm_hr != null ? Number(safeArgs.infiltration_mm_hr) : 18);
        const somPct =
          normalized?.organic_matter_percent ??
          (safeArgs.organic_matter_percent != null ? Number(safeArgs.organic_matter_percent) : 2.5);

        return formatToolResult({
          valid: true,
          soil_function: normalized,
          omitted_by_default: normalized === null,
          sponge_capacity: estimateSoilSpongeCapacity({
            tiz_area_m2: tizAreaM2,
            infiltration_mm_hr: infRate,
            organic_matter_percent: somPct,
          }),
        });
      } catch (err) {
        return formatToolResult(
          { valid: false, error: 'INVALID_SOIL_FUNCTION', message: err.message },
          true
        );
      }
    }

    case 'leo_rap_verify':
    case 'leo_rca_verify': {
      const assessment = safeArgs.assessment || (safeArgs.structural_baseline ? safeArgs : null);
      if (!assessment || typeof assessment !== 'object' || Array.isArray(assessment)) {
        return formatToolResult(
          { error: 'INVALID_ASSESSMENT', message: `${name} requires an assessment object with structural_baseline.` },
          true
        );
      }
      if (
        safeArgs.markdown_narrative !== undefined &&
        safeArgs.markdown_narrative !== null &&
        typeof safeArgs.markdown_narrative !== 'string'
      ) {
        return formatToolResult(
          { error: 'INVALID_NARRATIVE_TYPE', message: 'markdown_narrative must be a string when provided.' },
          true
        );
      }
      if (
        typeof safeArgs.markdown_narrative === 'string' &&
        safeArgs.markdown_narrative.length > MAX_NARRATIVE_LENGTH
      ) {
        return formatToolResult(
          {
            error: 'MAX_NARRATIVE_LENGTH_EXCEEDED',
            max_length: MAX_NARRATIVE_LENGTH,
            received_length: safeArgs.markdown_narrative.length,
            message: `markdown_narrative exceeds maximum length of ${MAX_NARRATIVE_LENGTH} characters.`,
          },
          true
        );
      }
      if (safeArgs.jurisdiction_id && String(safeArgs.jurisdiction_id).length > MAX_JURISDICTION_ID_LENGTH) {
        return formatToolResult(
          {
            error: 'JURISDICTION_ID_TOO_LONG',
            max_length: MAX_JURISDICTION_ID_LENGTH,
            received_length: String(safeArgs.jurisdiction_id).length,
            message: `jurisdiction_id exceeds maximum length of ${MAX_JURISDICTION_ID_LENGTH} characters.`,
          },
          true
        );
      }

      try {
        const evalContext =
          safeArgs.eval_context && typeof safeArgs.eval_context === 'object'
            ? { ...safeArgs.eval_context }
            : {};

        if (!evalContext.municipality && safeArgs.jurisdiction_id) {
          const found = ordinanceCatalog.get(String(safeArgs.jurisdiction_id).toLowerCase().trim());
          if (!found) {
            return formatToolResult(
              {
                error: 'UNKNOWN_JURISDICTION',
                message: `No ordinance record found for jurisdiction_id '${safeArgs.jurisdiction_id}'.`,
                available_jurisdictions: Array.from(ordinanceCatalog.keys()),
              },
              true
            );
          }
          evalContext.municipality = found.record;
          if (!evalContext.provenance && !evalContext.unverified_gaps) {
            evalContext.provenance = inspectOrdinanceGaps(found.record);
          }
        }

        const compiled = compileLeoRapBrief(assessment, evalContext);
        const narrativeText =
          typeof safeArgs.markdown_narrative === 'string'
            ? safeArgs.markdown_narrative
            : compiled.brief_markdown;
        const verification = verifyLeoRapNarrative(narrativeText, assessment, evalContext);
        const selfAudit =
          safeArgs.run_self_audit !== false ? runLeoRapSelfAudit(assessment, evalContext) : null;

        return formatToolResult({
          valid: verification.valid && (selfAudit ? selfAudit.self_audit_passed : true),
          verification,
          compiled_brief: compiled,
          self_audit: selfAudit,
        });
      } catch (err) {
        return formatToolResult({ error: 'LEO_RAP_VERIFY_ERROR', message: err.message }, true);
      }
    }

    default:
      return formatToolResult(
        {
          error: 'UNKNOWN_TOOL',
          message: `Unknown tool '${name}'.`,
          available_tools: MCP_TOOLS.map((t) => t.name),
        },
        true
      );
  }
}
