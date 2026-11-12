# Contributing to Open Arbor

Open Arbor welcomes statutory updates, peer review on core forestry calculations, and field bug reports. Code contributions under `src/` and `web/` follow `AGPL-3.0-only` ([LICENSE](./LICENSE)); schemas and ordinance datasets under `schemas/` and `data/` are dedicated to the public domain under `CC0-1.0` ([LICENSE-DATA](./LICENSE-DATA), [NOTICE](./NOTICE)).

## How to Add a City Ordinance

Municipal rules live in declarative JSON files under `data/ordinances/` (such as `data/ordinances/central_texas_ordinances.json` and `data/ordinances/rogue_valley_oregon_ordinances.json`) and must conform to the Draft 2020-12 schema at `schemas/municipal-ordinance.schema.json`. Zero city-specific branches belong in `src/core/` code.

1. **Start from the draft template:** Copy `NEW_MUNICIPALITY_DRAFT_TEMPLATE` from `web/pages/ordinances-ui.js` (also documented in `data/ordinances/CONTRIBUTING_DATA.md` and inspectable interactively on `/ordinances/`).
2. **Cite every encoded clause:** Populate `primary_citation`, `source_url`, and per-rule statutory citations from the active municipal code. Do not estimate missing figures or copy assumptions from a neighboring jurisdiction.
3. **Leave unverified sub-sections visible (`UNVERIFIED`):** If only diameter thresholds and mitigation fees are confirmed while site-plan disturbance limits, work-type triggers, or pruning windows have not yet been audited, omit those unverified rule blocks and classify the record accordingly (`Threshold_And_Fee_Record` vs. `Full_Rule_Record`). `inspectMunicipalityProvenance` in `web/pages/masterwork-core.js` surfaces omitted sections explicitly as `UNVERIFIED` gaps rather than silently inventing statutory rules.
4. **Validate before opening a PR:**
   ```bash
   npm run validate:ordinances
   npm test
   ```
   `scripts/validate-ordinance.mjs` validates every file under `data/ordinances/` against `schemas/municipal-ordinance.schema.json`. The `/ordinances/` page also exposes an in-browser draft validator for quick schema checking before committing.
5. **Confirm UI unit tests if bundles change:**
   ```bash
   npm run build:web
   node tests/verify_masterwork_100x.mjs
   ```

## Good First Issue: Upgrade Cedar Park (`tx-cedar-park`) to `Full_Rule_Record`

**Target:** `tx-cedar-park` in `data/ordinances/central_texas_ordinances.json`  
**Current status:** `Threshold_And_Fee_Record` (Verified threshold and fee baseline; missing work-type permit triggers, site-plan CRZ disturbance caps, species overrides, and pruning rules render as visible `UNVERIFIED` gaps).  
**Task:** Audit Cedar Park Code Chapter 14 primary text, add exact statutory citations for each missing sub-section, validate with `npm run validate:ordinances` (`scripts/validate-ordinance.mjs`), and verify the `/ordinances/` provenance card updates cleanly with zero remaining `UNVERIFIED` gaps.
