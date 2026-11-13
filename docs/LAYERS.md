# Open Arbor Architecture Plan: Three Independently Versioned Layers & Ordinance Expiry

> **Status:** Planning document only. No changes to `schemas/` or core calculation math are implemented in this pass.

Open Arbor's commit history (`25` commits across four identities on `master`) evolved rapidly across statutory determinations, speculative ecological valuations, and practitioner business models. Separating these concerns into three distinct, independently versioned layers ensures property owners, arborists, and municipal reviewers never mistake an uncalibrated economic model for city law or ANSI biomechanics.

---

## 1. Layer Separation & Independent Versioning

| Layer | Version | Scope & Primary Modules | Epistemic Standing |
| --- | --- | --- | --- |
| **Layer 1: Determination** | `determination-v1.0.0` | `src/core/rootZone.js` (`calculateCRZ`, `calculateTPZ`, `calculateSRZ`), `src/core/ordinanceEngine.js` (`evaluateTreeInventory`, `permitDetermination`, `computeMitigationPlan`), `src/core/rapEngine.js` (`evaluateBiomechanicsAndRhizosphere`), `web/pages/masterwork-core.js` (`inspectMunicipalityProvenance`), `schemas/municipal-ordinance.schema.json`. | Deterministic rules grounded directly in municipal codes, ANSI A300 Part 5, AS 4970-2009, BS 5837, and Mattheck `t/R >= 0.30`. Surfaces unencoded rules as explicit `UNVERIFIED` gaps. |
| **Layer 2: Valuation Models** | `valuation-models-v0.3.0` | `src/core/rapEngine.js` (`computeHolobiontValuation` producing `ctla_10th_ed_depreciated_usd` and `holobiont_200yr_biological_equity_usd`), `src/core/ecosystemBenefits.js` (`calculateTreeEcosystemBenefits`, `estimateTreeAge`), `src/core/soilFunction.js` (`estimateSoilSpongeCapacity`). | Named appraisal formulas (CTLA 10th Edition Trunk Formula) and experimental ecological hypotheses (200-year holobiont valuation, John White FCIN12 age bands, Nowak/McPherson benefits). Subordinate visually and structurally behind Layer 1. |
| **Layer 3: Practice Economics** | `practice-economics-v0.2.0` | `src/core/rapEngine.js` (`computeRegenerativePracticeEconomics`), `src/core/leoRapEngine.js` (`computePhasedStewardshipTriage`). | Regional cost-comparison models estimating removal bids vs. phased root-collar remediation and 5-year client retention margins. Depends on local market rates and operator pricing inputs. |

### Versioning Rules
1. Layer 1 (`determination-v1.0.0`) bumps `MAJOR` only on breaking statutory contract changes in determination outputs, allowing municipal integrations to rely on a stable core even as Layer 2 or Layer 3 hypotheses evolve.
2. Layer 2 (`valuation-models-v0.3.0`) and Layer 3 (`practice-economics-v0.2.0`) retain `0.x` minor versions until calibrated against empirical regional field cohorts, and are gated behind explicit disclosure controls in the front-door UI.

---

## 2. Valuation & Practice Economics Kill Criteria

Every Layer 2 and Layer 3 model is treated as a falsifiable hypothesis with declared inputs and explicit retirement or re-parameterization triggers:

1. **CTLA 10th Edition Appraisal Model (`ctla_10th_ed_depreciated_usd`):**
   - **Declared assumptions:** Regional unit trunk cost (`$65/sq in` default baseline) adjusted by species, site, and condition depreciation ratings.
   - **Kill criterion:** Deprecate default constant unit cost if regional ISA/CTLA plant appraisal schedules drift by more than 25% from published regional nursery replacement benchmarks; require explicit practitioner-entered unit cost override instead of silent fallback.
2. **200-Year Living Holobiont Biological Equity (`holobiont_200yr_biological_equity_usd`):**
   - **Declared assumptions:** Uncalibrated multi-century accumulation applying veteran keystone habitat multipliers over base annual ecosystem service estimates.
   - **Kill criterion:** Until longitudinal cohort survival curves (e.g., 30-to-100-year urban oak retention mortality data across Texas and Oregon bioregions) and direct field infiltration measurements calibrate the multiplier and discount horizon, never present this figure alongside Layer 1 statutory numbers at equal weight. If retrospective urban tree survival studies falsify assumed mean survival below 50% of the model curve, retire the single-point 200-year multiplier in favor of a bounded interquartile survival range.
3. **Soil Sponge & Allometric Ecosystem Services (`estimateSoilSpongeCapacity`, `calculateTreeEcosystemBenefits`):**
   - **Declared assumptions:** NRCS organic-matter water retention benchmarks and literature-derived allometric equations (Nowak, Cairns, Xiao, McPherson).
   - **Kill criterion:** Flag soil sponge figures as upper-bound theoretical capacity when site bulk density exceeds compaction limits (> 1.65 g/cm3) unless field penetrometer or double-ring infiltrometer measurements confirm permeable infiltration.
4. **Practice Economics & 5-Year Margin Multiplier (`computeRegenerativePracticeEconomics`, `computePhasedStewardshipTriage`):**
   - **Declared assumptions:** Illustrative Central Texas crew billing assumptions and multi-year client retention across Stages 1 to 3.
   - **Kill criterion:** Retire hard-coded default bid comparisons once practitioner-submitted invoicing cohorts show empirical 5-year retention dropping below the break-even retention threshold, or require local crew labor/equipment rate inputs before generating client-facing fee quotes.

---

## 3. Ordinance Expiry Proposal (`last_verified` + `review_window_days`)

Municipal tree ordinances change through council amendments and Development Code updates. Right now `web/pages/masterwork-core.js` tracks a single dataset timestamp (`DATASET_LAST_VERIFIED`), and individual city records under `data/ordinances/` do not expire automatically.

**Proposed Schema Addition (Deferred to Next Minor Schema Pass):**
1. Add per-record verification metadata to `schemas/municipal-ordinance.schema.json`:
   - `last_verified` (`string`, `format: "date"`): ISO 8601 date when the primary municipal code text (`source_url`) was last audited against published law.
   - `review_window_days` (`integer`, default `365`): Maximum days before the statutory audit record enters stale-review status.
2. **Runtime & CI Behavior Once Adopted:**
   - **UI Provenance Panel:** Compute `is_expired = (today - last_verified) > review_window_days` inside `inspectMunicipalityProvenance`. When expired, downgrade displayed confidence messaging with a visible warning banner (`Citation Review Overdue`) and prompt the practitioner to click `source_url` before relying on automated fee or threshold calculations.
   - **CI Check (`scripts/validate-ordinance.mjs`):** Emit non-blocking warnings when records approach 30 days of expiry and report stale counts in verification output.
