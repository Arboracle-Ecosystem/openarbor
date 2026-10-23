# Contributing to the Open Arbor Municipal Ordinance Commons

Municipal tree protection codes across the United States exist almost exclusively as static PDFs and unindexed municipal web portals (`Municode`, `eCode360`, `American Legal Publishing`). Because no organization publishes them as schema-validated, machine-readable open data, every consulting arborist, civil engineer, and urban forester repeats the same manual lookup work on every project.

The **Open Arbor Municipal Ordinance Commons** (`data/ordinances/`) turns municipal tree statutes into open, deterministic JSON records validated against [`schemas/municipal-ordinance.schema.json`](../../schemas/municipal-ordinance.schema.json) and executed directly by [`src/core/ordinanceEngine.js`](../../src/core/ordinanceEngine.js) and the Open Arbor MCP server (`server/mcp/openarbor-mcp.mjs`).

---

## 1. Honest Scope Statement

This commons starts with **six full-rule cities** (`tx-austin`, `tx-georgetown`, `tx-liberty-hill`, `or-ashland`, `or-medford`, `or-grants-pass`) plus **two baseline threshold-and-fee records** (`tx-cedar-park`, `tx-round-rock`, where `permit_triggers_by_work_type` and `plan_rules` remain `UNVERIFIED` pending code extraction), for eight municipal entries across two regional files (`central_texas_ordinances.json` and `rogue_valley_oregon_ordinances.json`).

Every accepted contribution makes the commons more valuable to practitioners and municipal reviewers. No pull request is rejected for being small: adding a single verified municipality, completing `plan_rules` for Cedar Park or Round Rock, or updating a single fee schedule after a city council amendment is a first-class contribution.

---

## 2. How to Translate a Municipal Code into the Schema

Each municipality entry in `data/ordinances/<region>_ordinances.json` conforms to [`schemas/municipal-ordinance.schema.json`](../../schemas/municipal-ordinance.schema.json). Follow this sequence when encoding a city:

1. **Locate the Primary Statutory Text:**
   * Find the official municipal code chapter governing tree preservation, landscaping, or street trees (for example, Unified Development Code, Land Development Code, or Municipal Code).
   * Record the permanent public URL in `source_url` (must be a valid `http://` or `https://` URI) and the exact chapter, article, and ordinance number in `ordinance_numbers`.
2. **Assign the Canonical Identifier (`id`):**
   * Format: `<lowercase-2-letter-state>-<kebab-case-city-name>` matching the regular expression `^[a-z]{2}-[a-z0-9-]+$` (for example, `tx-austin`, `or-ashland`, `or-grants-pass`).
3. **Extract Protection Tiers and Species Rules:**
   * `dbh_threshold_inches`: Minimum Diameter at Breast Height (4.5 feet above grade) in inches at which general tree protection begins.
   * `heritage_threshold_inches`: Minimum DBH in inches for heritage, landmark, or significant tree status (`null` if the municipality has no upper tier).
   * `heritage_species_thresholds`: Map of `"Scientific Name (Common Name)": number` when the municipality gates heritage status on an eligible species list or sets lower DBH thresholds for specific native species (for example, `Arbutus menziesii (Pacific Madrone): 12` in Ashland AMC 18.4.5).
   * `excepted_species`: Array of invasive or nuisance species exempted from protection by statute.
4. **Extract Work Triggers (`permit_triggers_by_work_type`):**
   * List which work types (`"removal"`, `"pruning"`) require a municipal permit for `protected` and `heritage` trees, and record the section in `citation`.
   * If the municipal code does not specify work-type triggers or you have not yet verified that section, omit `permit_triggers_by_work_type` rather than guessing. When omitted, `permitDetermination` in `src/core/ordinanceEngine.js` returns `unknown: true` and instructs the practitioner to verify with the city.
5. **Extract Mitigation Fee and Replacement Schedules (`mitigation_fee_schedule`):**
   * Every fee schedule requires a `citation` string and a `tiers` array (`min_dbh`, `max_dbh`, `rate_per_inch`, `replacement_ratio`).
   * Include `exemption_pct` and `exemption_citation` only when the code grants a percentage exemption (such as Liberty Hill UDC `§ 6.07.01(c)(5)(B)`).
   * Include `penalty_civil_per_tree` and `penalty_citation` when civil penalties for unpermitted removal are stated in the ordinance.
6. **Extract Survey, Root Zone, and Pruning Rules (`plan_rules`):**
   * `survey`: `citation`, `hardwood_min_dbh`, `max_age_years`, and `multi_trunk` (`"largest_plus_half"`, `"quadratic"`, or `"sum"`).
   * `root_zone`: `citation`, `crz_ft_per_inch`, `crz_min_ft`, `removal_if_disturbed_pct` (percentage of CRZ disturbance at which a tree is counted as removed), `cutfill_max_in`, `impervious_max_pct`, and `crown_removal_max_pct`.
   * `pruning`: `citation`, `standard` (such as `"ANSI A300 Part 1"`), and `oak_months` (array of integer months `1` through `12` during which non-emergency *Quercus* pruning is permitted under Oak Wilt rules).

---

## 3. Required Evidence and the `UNVERIFIED` Rule

Open Arbor's ordinance engine is used for statutory compliance and evidentiary reports. Every number in `data/ordinances/` is a legal and technical claim:

* **Mandatory Citations:** Every municipality record must include top-level `ordinance_numbers` and `source_url`, plus section-specific `citation` strings inside `mitigation_fee_schedule`, `permit_triggers_by_work_type`, `plan_rules.survey`, `plan_rules.root_zone`, and `plan_rules.pruning`.
* **Zero Invented Numbers:** Never copy another city's fee rate, replacement ratio, CRZ disturbance limit, or multi-stem formula to fill a blank field.
* **Visible `UNVERIFIED` Markers:** If a city's fee schedule lives in a separate master fee resolution that you do not have in hand, or if a subsection of `plan_rules` is ambiguous, leave that sub-object out or mark the note explicitly with `UNVERIFIED: <reason and section needed>`. Our validator script (`scripts/validate-ordinance.mjs`) flags partial records as `Threshold_And_Fee_Record` with explicit `UNVERIFIED` notices so downstream users see what is verified and what remains open.

---

## 4. Running the Schema Validator

Before opening a pull request, validate your ordinance file from the repository root using the zero-dependency validator CLI:

```bash
# Validate a single regional ordinance file
node scripts/validate-ordinance.mjs data/ordinances/rogue_valley_oregon_ordinances.json

# Validate all ordinance files in data/ordinances/
node scripts/validate-ordinance.mjs data/ordinances/central_texas_ordinances.json data/ordinances/rogue_valley_oregon_ordinances.json
```

The validator exits with code `0` when all records conform to `schemas/municipal-ordinance.schema.json` and exits non-zero with a per-field JSONPath error list if any required property, type, enum, pattern, or numeric bound fails.

---

## 5. Pull Request Checklist

Include the following verification items in your pull request description:

- [ ] `source_url` resolves to the official municipal code or published city development manual.
- [ ] `ordinance_numbers` and every sub-section `citation` field cite exact chapter, article, and section numbers.
- [ ] Every fee amount (`rate_per_inch`, `heritage_rate_per_inch`, `penalty_civil_per_tree`), DBH threshold, and replacement ratio is copied directly from the cited ordinance text with zero estimated values.
- [ ] Any unextracted optional sub-block (`permit_triggers_by_work_type` or `plan_rules`) is omitted or marked `UNVERIFIED: <reason>` rather than filled from memory.
- [ ] `node scripts/validate-ordinance.mjs <path-to-file>` exits `0`.
- [ ] `npm test` and `npm run test:mcp` pass with zero regressions.
