# Open Arbor Practice Specification: Regenerative Consulting Arborist (RCA-Spec v2.0)

[![Specification License: CC BY-SA 4.0](https://img.shields.io/badge/Specification_Text-CC_BY--SA_4.0-2d6a4f.svg)](https://creativecommons.org/licenses/by-sa/4.0/)
[![Schema & Code License: AGPL v3](https://img.shields.io/badge/Schema_%26_Code-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Attestation Standard: 1EdTech Open Badges 3.0](https://img.shields.io/badge/Attestation-Open_Badges_3.0_%7C_W3C_VC-74ac00.svg)](https://www.imsglobal.org/spec/ob/v3p0)

* **Specification ID:** `RCA-Spec v2.0` (supersedes `RCA-Spec v1.0` while retaining schema backward compatibility)
* **Steward & Founding Author:** George Steward, ISA Certified Arborist (`TX-362025A`, Oak Wilt Qualified), Open Arbor Alliance / Soil Grower
* **Date:** `2026-10-23`
* **Canonical Repository Paths:**
  * Specification Text: `docs/13_RCA_PRACTICE_SPECIFICATION_v1.md`
  * Assessment JSON Schema: `schemas/rca_assessment.schema.json`
  * Attestation JSON-LD Schema: `schemas/rca_openbadge_v3.schema.json`
  * Core Diagnostic & Valuation Engine: `src/core/rcaEngine.js`
  * Bioregional Municipal Ordinances: `data/ordinances/central_texas_ordinances.json` and `data/ordinances/rogue_valley_oregon_ordinances.json`
  * Database Integration Brief: `docs/09_FEATURE_BRIEF_ASSESSMENT_FORMS.md`

---

## 0. Version 1.0 to Version 2.0 Sovereign Nature-First Elevation and Changelog

In `RCA-Spec v1.0`, Open Arbor established the five mandatory diagnostic domains and defined the rollup bridge from individual tree assessments to the property-level Sanctuary Scorecard. However, v1.0 retained two foundational compromises with legacy industrial arboriculture:

1. **Mandatory Guild Gatekeeping:** v1.0 required an active ISA, ASCA, or SAF credential as a prerequisite gate to earn an `RCA-Verified` badge.
2. **Unchallenged Forensic Baselines:** v1.0 treated the Council of Tree and Landscape Appraisers (CTLA) 10th Edition Trunk Formula depreciation and ISA Tree Risk Assessment Qualification (TRAQ) hazard ratings as unchallenged baselines, rather than absorbing and superseding them.

`RCA-Spec v2.0` executes a sovereign paradigm shift:

* **Post-ISA and Post-ASCA Doctrine:** The International Society of Arboriculture (ISA) and American Society of Consulting Arborists (ASCA) are no longer parent authorities or mandatory gatekeepers. They represent the classical mechanics of a retired industrial-forensic era. The Regenerative Consulting Arborist masters every technical element of their canon (Shigo CODIT compartmentalization, Mattheck hollow-shell buckling physics, AS 4970 root-plate stability, ANSI A300 Clauses 5 through 14, TRAQ risk matrices, sonic tomography, resistance micro-drilling, CTLA 10th Edition appraisal, and ASCA 7-part evidentiary report structures), absorbs that canon into deterministic open code (`src/core/rcaEngine.js`), and inverts its value polarity.
* **Living Asset Equity vs. Depreciated Timber:** Where legacy practice sees an aging hollow tree as a decaying hazard to be depreciated or liquidated, the RCA recognizes a self-organizing holobiont and keystone biological habitat whose ecological value appreciates with age.

### Summary of v2.0 Structural Changes

1. **Biomechanical Absorption in Domain 1 (`structural_baseline`):**
   * Added `sound_shell_thickness_ratio_t_over_r` (`t/R`, `0.0` to `1.0`), implementing Claus Mattheck's criterion where `t/R >= 0.30` retains full hollow-cylinder bending strength against windthrow.
   * Added `codit_wall_response_rating` documenting Shigo Compartmentalization of Decay in Trees response across Walls 1, 2, 3, and 4.
   * Added `sonic_tomography_or_resistograph_uri` for acoustic tomogram or micro-drill evidence verification.
2. **Dual Valuation Model:**
   * Added `dual_valuation` in `schemas/rca_assessment.schema.json` and `computeHolobiontValuation` in `src/core/rcaEngine.js`. Contrasts classical CTLA 10th Edition depreciated cost against Regenerative Holobiont Biological Equity.
   * Encodes the `veteran_keystone_habitat_multiplier` (1.0 to 3.5), proving that ancient hollow trees appreciate rather than depreciate.
3. **Nature-First Attestation Model (`schemas/rca_openbadge_v3.schema.json`):**
   * Removed mandatory `baseline_credential` requirement.
   * Replaced with `nature_first_competency_proof`: three machine-validated RCA diagnostic report SHA-256 hashes, verified non-destructive pneumatic root-collar excavation, biological amendment prescription, and STIM longitudinal monitoring commitment.
   * Demoted legacy credentials (ISA, ASCA, SAF) to an optional `legacy_statutory_equivalencies` cross-walk for municipal permit processing.
4. **Deterministic Core Engine (`src/core/rcaEngine.js`):**
   * Implemented zero-dependency ECMAScript Module exporting `evaluateBiomechanicsAndRhizosphere`, `computeHolobiontValuation`, `computeSanctuaryScorecardRollup`, and `lintRcaEvidentiaryReport`.
5. **Bioregional Expansion to Southern Oregon:**
   * Encoded verified municipal tree protection ordinances for Ashland (`or-ashland`, AMC 18.4.5 and 18.5.7), Medford (`or-medford`, MMC 6.700 to 6.750 and April 2026 Guidelines), and Grants Pass (`or-grants-pass`, Development Code Art. 13 and 23) in `data/ordinances/rogue_valley_oregon_ordinances.json`.

---

## 1. Disambiguation, Trademark Boundary, and Dual Licensing

### 1.1 Practice Title Disambiguation

Throughout the Open Arbor ecosystem, **Regenerative Consulting Arborist (RCA)** refers exclusively to the diagnostic-first, soil-centered practice methodology and open reference specification defined in this document. The American Society of Consulting Arborists (ASCA) Registered Consulting Arborist credential is permanently retired from the project roadmap per the October 9, 2026 and October 18, 2026 governance decisions. Where ASCA or ISA standards are cited in this specification, they serve strictly as technical mechanics absorbed into open software.

As of October 2026, the exact title **"Regenerative Consulting Arborist"** has zero external claimants on the public web. While Atmos Tree (Kurt Stenberg, Alberta, Canada) uses the title "Regenerative Arborist" for a 2:1 off-site tree-removal planting offset program, the inclusion of **"Consulting"** distinguishes an independent, conflict-free, preservation-first diagnostic practice from tree removal and commercial sales.

### 1.2 Open Arbor Naming Hygiene and Trademark Boundary

On the public web, the unspaced single-word mark `OpenArbor` is a registered trademark of DDC-I, Inc. (Phoenix, AZ) for an avionics integrated development environment. As of October 2026, neither `openarbor.org` nor the GitHub repository (`https://github.com/Arboracle-Ecosystem/openarbor.git`, unhyphenated on disk) is indexed on commercial search engines. All public surfaces, documentation, headers, and specification text standardize on the spaced two-word mark **Open Arbor** and **Open Arbor Alliance**. Repository directories, git remotes, and module import paths remain intact to ensure zero breaking changes across automated builds.

### 1.3 Dual Licensing Terms

1. **Specification Text (`CC BY-SA 4.0`):** The prose, diagnostic rubric, indicator definitions, and methodology in `docs/13_RCA_PRACTICE_SPECIFICATION_v1.md` are licensed under **CC BY-SA 4.0**. University extensions, municipal foresters, independent arborists, and land stewards may adopt and adapt this methodology, provided attribution is given to the Open Arbor Alliance and derivative works are shared under identical terms.
2. **JSON Schemas and Implementation Code (`AGPL v3`):** The machine-readable schemas (`schemas/rca_assessment.schema.json` and `schemas/rca_openbadge_v3.schema.json`) and all associated calculation modules in this repository are licensed under **AGPL v3**.

---

## 2. Formal Practice Definition and Scientific Lineages

### 2.1 Formal Practice Definition

**Regenerative Consulting Arboriculture** is the diagnostic and prescriptive science of managing woody perennials as nested holobionts within living soil, hydrologic, and canopy systems. Unlike conventional consulting arboriculture, which evaluates individual trees as static structural columns of timber, forensic liabilities, or depreciating assets, a **Regenerative Consulting Arborist (RCA)** diagnoses the root causes of canopy decline within the rhizosphere, soil food web, and site hydrology. The practitioner prescribes process-verified and outcome-verified interventions that restore self-organizing ecosystem function, carbon-water-mineral cycling, and 50-year to 200-year biological equity across the Tree Influence Zone (`TIZ`).

### 2.2 Four Foundational Scientific Lineages

`RCA-Spec v2.0` synthesizes four peer-reviewed and statutory lineages:

1. **Regenerative Agriculture Literature (Combined Process and Outcome Verification):**
   * Newton et al. (2020) analyzed 229 peer-reviewed journal articles and 25 practitioner websites, demonstrating that regenerative definitions split between process-based criteria and outcome-based criteria. Defining a practice solely by process rewards actions that fail in specific soil contexts, while defining it solely by lagging outcomes penalizes stewards during multi-year biological recovery lags. `RCA-Spec v2.0` enforces process verification at installation and outcome verification at Year 1 and Year 5.
   * Schreefel et al. (2020) establish soil conservation as the primary entry point to regenerate provisioning, regulating, and supporting ecosystem services.
   * Giller et al. (2021) and O'Donoghue et al. (2022) establish five mandatory diagnostic questions before prescribing any intervention: (a) what is the degradation problem, (b) what ecological attribute is to be regenerated, (c) what biological or physical mechanism enables regeneration, (d) is the practice viable in context, and (e) what forces sustain long-term adoption.

2. **Ecological Restoration Standards (Reference Ecosystems and Recovery Wheel):**
   * The Society for Ecological Restoration (SER) *International Principles and Standards for the Practice of Ecological Restoration, Second Edition* (Gann et al., 2019) provides core diagnostic rules adopted by `RCA-Spec v2.0`:
     * Integrate scientific, practitioner, and local ecological knowledge.
     * Evaluate conditions against native reference ecosystems while accounting for irreversible climatic shifts.
     * Support self-organizing recovery rather than permanent synthetic inputs.
     * Measure progress against baseline using the Five-Star Recovery System across six attributes: threat absence, physical conditions, species composition, structural diversity, ecosystem function, and external exchanges.

3. **Regenerative Development and Living Systems Theory:**
   * Drawing from living-systems design (Mang & Reed, 2012; Mang & Haggard, 2016; Dias, 2018), `RCA-Spec v2.0` distinguishes regeneration from net-zero sustainability and snapshot preservation. The RCA identifies **nodal interventions**: targeted actions (such as supersonic pneumatic root-collar excavation and mycorrhizal guild inoculation) that unlock the self-organizing capacity of the tree-soil holobiont while growing the steward's ecological understanding.

4. **Conventional Arboriculture Canon Absorbed and Inverted:**
   * Incorporates Claus Mattheck's *Body Language of Trees* (1994, 2007) for hollow cylinder stability and root-plate mechanics, Alex Shigo's (1977, 1984) CODIT model, ANSI A300 Clauses 5 through 14, and the CTLA 10th Edition Trunk Formula Technique, translating their mechanical procedures into open software.

---

## 3. Contrast with Conventional Practice and the Post-ISA / Post-ASCA Doctrine

Conventional consulting arboriculture is forensic, reactive, and liability-driven: it diagnoses structural failure after decay has advanced, appraises casualty depreciation, or prescribes synthetic chemical plant health care. `RCA-Spec v2.0` is diagnostic-first, subterranean, and regenerative.

| Practice Dimension | Conventional Consulting Arborist (ANSI A300 / ISA / ASCA Baseline) | What Transfers from Regenerative Agriculture & SER Restoration | What Is Genuinely Novel in RCA-Spec v2.0 |
| :--- | :--- | :--- | :--- |
| **Unit of Diagnosis** | **Isolated Timber Column:** Evaluated for structural defects, target occupancy (ISA TRAQ), or trunk-formula depreciation (CTLA 10th Ed.). | **Soil as the Base Layer (Schreefel et al., 2020):** Dry bulk density, water infiltration rate, organic matter percentage, and fungal-to-bacterial biomass ratios. | **The Arboreal Holobiont & Tree Influence Zone (TIZ):** Diagnosing the mature tree, root flare, ecto-/endomycorrhizal network, and sub-canopy understory as one coupled metabolic unit over 200 years. |
| **Primary Diagnostic Method** | **Visual & Mechanical Defect Inspection:** Mallet, diameter tape, resistograph, or sonic tomography aimed at answering whether a stem will fail onto a target. | **Dual-Timescale Monitoring (Savory Institute, 2025; Gann et al., 2019):** Combining annual leading indicators with 5-year lagging outcomes. | **Non-Destructive Pneumatic Rhizosphere Forensics:** Using supersonic air excavation (AirSpade at 150 psi) to expose root flares, stem-girdling roots, and compaction pans without severing fine roots. |
| **Prescriptive Intervention** | **Mechanical Reduction, Removal, or Synthetic PHC:** Cabling, hazard removal, or synthetic NPK salt and systemic pesticide injection. | **Low External Inputs & Biological Cycling (Newton et al., 2020):** Eliminating synthetic salts and fungicides that suppress soil biology. | **Nodal Sub-Canopy Guild & Succession Prescriptions:** Replacing turfgrass inside the TIZ with radial air-trenched biochar, humates, compost matrices, and native companion guilds. |
| **Asset Valuation** | **Depreciated Replacement Cost:** CTLA 10th Edition depreciates hollow or veteran trees due to trunk decay cavities. | **Ecological Capital:** Valuing carbon storage, water infiltration, and biological diversity. | **Regenerative Holobiont Biological Equity:** Veteran hollow trees appreciate via the keystone habitat multiplier (1.0 to 3.5), recognizing irreplaceable ecological niches. |

### 3.1 Agronomic Practices That Do Not Transfer to Arboriculture

Practices designed for annual row crops and pastures do not transfer uncritically to urban trees:
* **No Mechanical Tillage in the CRZ:** Mechanical tillage destroys fine feeder roots concentrated in the upper 15 cm to 30 cm of soil.
* **No High-Density Mob Grazing in Wet Root Zones:** Concentrated livestock impact inside clay tree protection zones increases bulk density and wounds root flares.
* **Arboricultural Replacements:** Supersonic pneumatic excavation (`AirSpade`), coarse ramial woodchip mulch horizons, biologically complete compost extracts, and woody perennial understory guilds replace the plow and livestock impact.

### 3.2 The Post-ISA / Post-ASCA Doctrine

Under `RCA-Spec v2.0`, the RCA absorbs 100% of legacy arboricultural mechanics while rejecting its liquidation bias:

1. **Mattheck Shell-Wall Physics (`t/R >= 0.30`):** Legacy inspectors routinely condemn hollow trees as hazardous. Claus Mattheck proved that a hollow cylinder whose sound outer wood shell thickness `t` is at least 30% of trunk radius `R` (`t/R >= 0.30`) retains full bending strength against windthrow. In `rcaEngine.js`, `evaluateBiomechanicsAndRhizosphere` automatically checks this ratio. The evidentiary linter (`lintRcaEvidentiaryReport`) blocks removal recommendations when `t/R >= 0.30` and root-zone remediation is viable.
2. **Shigo CODIT Absorption:** Alex Shigo demonstrated that trees do not heal; they compartmentalize decay through four anatomical walls: Wall 1 (vertical vascular plugging), Wall 2 (inward summerwood boundary), Wall 3 (lateral ray parenchyma), and Wall 4 (barrier zone formed by the cambium post-wounding). An RCA assesses whether Wall 4 has formed a sound barrier zone rather than assuming internal heartwood rot compromises cambial health.
3. **Inversion of the CTLA Condition Penalty:** In conventional CTLA 10th Edition appraisal, tree value equals unit cost multiplied by trunk area, multiplied by species, condition, and location ratings. Appraisers assign low condition scores (20% to 40%) to hollow veteran trees, depreciating their value to near zero. An RCA runs the CTLA math for legal defense, then provides the Regenerative Holobiont Biological Equity calculation. Because heartwood decay feeds specialized saproxylic invertebrates, cavity-nesting birds, and ectomycorrhizal fungi, veteran trees receive a keystone habitat multiplier up to 3.5x, demonstrating higher biological asset value than young defect-free saplings.

---

## 4. Architecture Fit and the Five Mandatory Diagnostic Domains (RCA_v2)

In `docs/09_FEATURE_BRIEF_ASSESSMENT_FORMS.md`, the `Assessments` table stores longitudinal observations using an `assessment_type` discriminator and a `data_json` (`JSONB`) payload. `RCA-Spec v2.0` governs `'Regenerative Diagnostic'`, validating payloads against [`schemas/rca_assessment.schema.json`](../schemas/rca_assessment.schema.json).

### 4.1 Domain 1: `structural_baseline`

Every RCA diagnostic assessment satisfies municipal tree protection ordinances and ANSI A300 Part 9 risk standards, while capturing Mattheck shell-wall physics and dual valuation figures.

| Field Name | Type | Unit | Status | Specification & Evidence Requirement |
| :--- | :--- | :--- | :--- | :--- |
| `dbh_cm` | `number` | `cm` | Required | Final calculated Diameter at Breast Height at 1.37 m above grade (`0.1` to `1500` cm). |
| `is_multistem` | `boolean` | `boolean` | Required | True if trunk forks below 1.37 m. |
| `stem_diameters_cm` | `array<number>` | `cm` | Optional | Individual stem diameters when `is_multistem` is true. |
| `multistem_aggregation_method` | `string` (enum) | `enum` | Optional | `'quadratic'`, `'largest_plus_half'`, `'sum'`, or `'single_stem'`. |
| `height_m` | `number` | `m` | Required | Total vertical height from root flare to crown tip (`0.1` to `150` m). |
| `crown_spread_ns_m` | `number` | `m` | Required | Canopy dripline spread along N-S axis (`0.1` to `150` m). |
| `crown_spread_ew_m` | `number` | `m` | Required | Canopy dripline spread along E-W axis (`0.1` to `150` m). |
| `live_crown_ratio_pct` | `number` | `%` | Required | Ratio of live crown height to total tree height (`0` to `100` %). |
| `plus_code_global` | `string` | `Open Location Code` | Required | 10-to-15 character Plus Code pinpointing stem coordinates. |
| `sound_shell_thickness_ratio_t_over_r` | `number` | `ratio` | Optional | Mattheck sound wood shell ratio `t/R` (`0.0` to `1.0`). Values `>= 0.30` confirm hollow stability. |
| `codit_wall_response_rating` | `string` | `rating` | Optional | Shigo CODIT compartmentalization response across Walls 1 to 4. |
| `sonic_tomography_or_resistograph_uri` | `string` (`uri-reference`) | `URI` | Optional | URI to PiCUS tomogram or resistograph trace verifying internal sound shell. |
| `dual_valuation` | `object` | `record` | Optional | Encodes `ctla_10th_ed_depreciated_usd`, `holobiont_200yr_biological_equity_usd`, and `veteran_keystone_habitat_multiplier`. |
| `isa_traq_risk` | `object` | `TRAQ Matrix` | Required | Requires assessment level, time frame, target description, failure, and impact likelihoods, consequences, and overall rating. |
| `municipal_permit_disposition` | `object` | `Statutory Record` | Required | Requires jurisdiction ID, citation, protection tier, permit required flag, disposition, and seasonal oak wilt restriction flag. |

### 4.2 Domain 2: `rhizosphere_and_root_collar`

Captures subterranean root-collar diagnostics, pneumatic excavation geometry, and concentric protection zones calculated by `src/core/rootZone.js`.

| Field Name | Type | Unit | Status | Specification & Evidence Requirement |
| :--- | :--- | :--- | :--- | :--- |
| `root_flare_burial_depth_cm` | `number` | `cm` | Required | Depth of soil or excess mulch burying root flare below grade (`0` = exposed). |
| `root_flare_diameter_cm` | `number` | `cm` | Required | Basal trunk diameter at root flare (`DRF`) for Mattheck / AS 4970 SRZ equation. |
| `stem_girdling_root_count` | `integer` | `count` | Required | Count of distinct stem-girdling roots (`0` to `100`). |
| `stem_girdling_root_severity` | `string` (enum) | `severity class` | Required | `'None'`, `'Minor_Under_25_Pct_Circumference'`, `'Moderate_25_To_50_Pct_Circumference'`, or `'Severe_Over_50_Pct_Circumference'`. |
| `airspade_radial_trenching_geometry` | `object` | `geometry record` | Required | Requires execution status, operating pressure (`psi`), trench count, length, width, depth, and excavation radius. |
| `crz_radius_m` | `number` | `m` | Required | Critical Root Zone radius in meters (`0.5` to `100` m). |
| `srz_radius_m` | `number` | `m` | Required | Structural Root Zone radius in meters per AS 4970 / Mattheck (`0.5` to `50` m). |
| `tiz_radius_m` | `number` | `m` | Required | Tree Influence Zone radius encompassing dripline and hydrologic catchment (`0.5` to `200` m). |

### 4.3 Domain 3: `soil_and_microbiome_baseline`

Establishes physical, chemical, and biological soil metrics prior to intervention.

| Field Name | Type | Unit | Status | Specification & Evidence Requirement |
| :--- | :--- | :--- | :--- | :--- |
| `bulk_density_g_cm3` | `number` | `g/cm3` | Required | Dry soil bulk density in 0 to 15 cm feeder-root horizon (`0.1` to `2.65` g/cm3). |
| `penetrometer_resistance_psi` | `number \| null` | `psi` | Optional | Compaction resistance at 15 cm depth (`0` to `1000` psi). |
| `infiltration_rate_mm_hr` | `number` | `mm/hr` | Required | Water infiltration rate via ring infiltrometer inside TIZ (`0` to `2000` mm/hr). |
| `organic_matter_pct` | `number` | `%` | Required | Soil organic matter percentage by dry weight (`0` to `100` %). |
| `soil_ph` | `number` | `pH` | Required | Rhizosphere soil pH (`2.0` to `11.0`). |
| `lab_panel_url` | `string` (`uri`) | `URI` | Required | Direct URL to external soil laboratory report. |
| `lab_sample_id` | `string` | `identifier` | Optional | Laboratory chain-of-custody identifier. |
| `mycorrhizal_and_fungal_observations` | `object` | `microbiome record` | Required | Requires dominant guild, fungal-to-bacterial biomass ratio, hyphal colonization status, and observed fruiting bodies array with inaturalist taxon IDs. |

### 4.4 Domain 4: `understory_and_guild_prescription`

Defines organic amendment volumes, ramial woodchip mulch horizon, and native companion plant guilds keyed to `inaturalist_taxon_id`.

| Field Name | Type | Unit | Status | Specification & Evidence Requirement |
| :--- | :--- | :--- | :--- | :--- |
| `reference_ecosystem_name` | `string` | `name` | Required | Target native reference ecosystem per SER Principle 3 (Gann et al., 2019). |
| `biochar_volume_liters` | `number` | `L` | Required | Volume of biologically pre-charged biochar for radial trenches (`0` to `50000` L). |
| `humate_mass_kg` | `number` | `kg` | Required | Dry mass of humic and fulvic acid amendment prescribed (`0` to `5000` kg). |
| `compost_volume_cubic_m` | `number` | `m3` | Required | Volume of fungal-dominant compost backfilled or topdressed (`0` to `500` m3). |
| `compost_extract_volume_liters` | `number` | `L` | Required | Volume of liquid biological drench applied to TIZ (`0` to `50000` L). |
| `mulch_depth_cm` | `number` | `cm` | Required | Depth of coarse arborist ramial woodchip mulch across TIZ (`0` to `30` cm). |
| `mulch_coverage_area_m2` | `number` | `m2` | Required | Surface area converted to self-mulching forest floor (`0` to `10000` m2). |
| `synthetic_npk_and_fungicide_exclusion_verified` | `boolean` | `boolean` | Required | Verifies exclusion of synthetic NPK fertilizers and persistent soil fungicides. |
| `native_companion_species_guild` | `array<object>` | `guild array` | Required | Companion species requiring botanical name, common name, inaturalist taxon ID, stratum layer, functional role, and quantity planted. |

### 4.5 Domain 5: `outcome_monitoring_schedule`

Every RCA prescription is treated as a testable hypothesis under the STIM Protocol, verified longitudinally:

1. **STIM Hypothesis and Kill Criterion:**
   * `stim_hypothesis_statement` (`string`, required): Causal statement connecting diagnosed constraint and nodal intervention to expected recovery.
   * `stim_kill_criterion` (`string`, required): Quantitative threshold requiring reassessment if not achieved.
2. **1-Year Leading Indicators (12-Month Audit):**
   * Scheduled reinspection date, canopy dieback maximum, twig extension minimum, woundwood callus closure rate, unburied root-flare confirmation, mulch horizon integrity, absence of surface crusting, companion guild survival, and fixed photopoint azimuth.
3. **5-Year Lagging Indicators (60-Month Audit):**
   * Scheduled audit date, target bulk density maximum, infiltration rate minimum, organic matter minimum, fungal-to-bacterial ratio minimum, SER recovery wheel star rating, and property-level Sanctuary Scorecard targets.

### 4.6 Sanctuary Scorecard Rollup Contract

Tree-level RCA diagnostics aggregate deterministically into the five property-level dimensions of the **Open Sanctuary Scorecard** (`Soil Health Index`, `Canopy Coverage`, `Water Dynamics`, `Biodiversity Baseline`, and `Restoration Potential Score`) via `computeSanctuaryScorecardRollup` in `src/core/rcaEngine.js`. Overlapping root-zone footprints are de-duplicated via `unionRootZoneArea` in `src/core/rootZone.js` using 1-ft spatial grid sampling.

| Domain | Rollup Mechanism | Contributes to Scorecard Dimension | Excluded Fields & Rationales |
| :--- | :--- | :--- | :--- |
| **1. structural_baseline** | Measurements calculate elliptical crown area and Xiao et al. (2000) rainfall interception. Recommended disposition weights mature canopy retention. | Canopy Coverage, Water Dynamics, Restoration Potential | `isa_traq_risk` and `municipal_permit_disposition` are excluded from ecological scores because they measure statutory liability rather than ecosystem function. |
| **2. rhizosphere_and_root_collar** | `tiz_radius_m` and `crz_radius_m` define spatial weighting polygons, de-duplicated via `unionRootZoneArea`. Pneumatic decompaction volume quantifies subterranean recovery. | Soil Health Index, Water Dynamics, Restoration Potential | None. All Domain 2 metrics contribute to spatial weights or root-zone recovery. |
| **3. soil_and_microbiome_baseline** | Spatial mean weighted by each tree's TIZ area of bulk density, infiltration rate, organic matter, and fungal-to-bacterial ratio. | Soil Health Index, Water Dynamics, Biodiversity Baseline | Laboratory URLs and sample IDs are provenance pointers gating audit validity rather than shifting numeric indices. |
| **4. understory_and_guild_prescription** | Set union of companion `inaturalist_taxon_id`s and planted quantities feeds structural diversity. Biochar, compost, and mulch volumes feed soil water and carbon storage. | Biodiversity Baseline, Soil Health Index, Water Dynamics | Batch identifiers are lineage pointers rather than direct score multipliers. |
| **5. outcome_monitoring_schedule** | Carries baseline-to-target delta pairs and SER Five-Star Recovery Wheel ratings. | All Five Dimensions | Photopoint azimuths and reinspection dates are scheduling controls. |

---

## 5. Governance Architecture: Path C and Nature-First Open Badges 3.0 Attestation

### 5.1 Why Accredited ISO/IEC 17024 and Pure Unverified Models Fail

1. **Why Formal ISO/IEC 17024 Accreditation Fails Objectives:**
   * **Governance Surrender:** ISO/IEC 17024:2012 mandates an independent scheme committee that prohibits founders or training bodies from governing certification decisions (ANSI National Accreditation Board, 2026).
   * **Cost Floor:** ANAB accreditation requires a $1,075 workshop, $3,000 application fee, $1,250 daily assessor fees, and annual fees up to $20,000 (ANSI National Accreditation Board, 2013). NCCA / ICE accreditation requires $2,800 application and $3,150 annual renewal fees (Institute for Credentialing Excellence, 2026). Both pathways mandate costly vendor psychometric Job Task Analyses.
   * **Low Statutory Return:** Even mature programs show modest adoption without statutory mandates. SER's CERP program counts approximately 600 individuals worldwide (Society for Ecological Restoration, 2026), and ISA's Board Certified Master Arborist represents under 4% of ISA arborists (International Society of Arboriculture, 2025).
2. **Why Pure Unverified Open Specs Fail:**
   * Publishing an open curriculum without verifiable evidence allows unverified practitioners to dilute standard credibility, preventing estate stewards and municipal bodies from confirming diagnostic rigor.

### 5.2 The Nature-First Attestation Model (`schemas/rca_openbadge_v3.schema.json`)

`RCA-Spec v2.0` executes **Path C**, pairing the open specification with an optional, cryptographically verifiable **1EdTech Open Badges 3.0 / W3C Verifiable Credentials v2.0** attestation:

* **Tier 1: Open Steward (Free, Open Access):**
  * Any arborist, land steward, or researcher may adopt `RCA-Spec v2.0` and `schemas/rca_assessment.schema.json` at zero cost under `CC BY-SA 4.0` and `AGPL v3`.
* **Tier 2: Verified Regenerative Consulting Arborist (`RCA-Verified`):**
  * Issued by the Open Arbor Alliance, this credential attests to verified field competence based on nature-first evidence rather than closed guild membership:
    1. **Three Machine-Validated Diagnostic Reports:** Three SHA-256 cryptographic digests of complete field assessment records conforming to `schemas/rca_assessment.schema.json`, demonstrating quantitative soil diagnostics, conflict-free preservation dispositions, and iNaturalist biodiversity linkage.
    2. **Field Rhizosphere Verification:** Documented non-destructive pneumatic root-collar excavation (`AirSpade`), biological amendment application (pre-charged biochar, fungal compost, ramial mulch), and soil microbiome baseline testing.
    3. **Longitudinal STIM Commitment:** Active enrollment in the Sanctuary Tree Inventory and Monitoring protocol with a scheduled Year-1 recovery audit date.
    4. **Optional Legacy Statutory Cross-Walk:** Practitioners holding active ISA, ASCA, or SAF credentials may record their registry identifiers in `legacy_statutory_equivalencies` to facilitate municipal permit processing without treating those guilds as gatekeepers.
  * **Benchmarked Registry Maintenance Fee Band:** Where an optional annual registry directory listing fee is assessed, it is benchmarked at **$75 to $110 per year**, derived from the Society for Ecological Restoration CERP maintenance fee ($75/year member) and the Northeast Organic Farming Association AOLCP reaccreditation fee ($110/year; NOFA Organic Land Care, 2026). Per Open Arbor Core Principle 1, `schemas/rca_openbadge_v3.schema.json` contains zero payment gates.

---

## 6. The RCA Movement and Open-Source Field Playbook (Building the Post-ISA Army)

Conventional arborists remain bound to legacy guilds and tree-removal revenue models because independent consulting historically required 4 to 6 hours of manual spreadsheet computation, statutory ordinance lookups, and report formatting per field inspection, while tree removal paid higher immediate contractor cash flow than preservation. Open Arbor eliminates both barriers through the zero-dependency **RCA Army Engine** (`src/core/rcaEngine.js` and `bin/openarbor-rca.mjs`).

### 6.1 The Zero-Dependency CLI Field Compiler (`bin/openarbor-rca.mjs`)

Any practitioner can execute the complete Post-ISA and Post-ASCA diagnostic, legal, economic, and attestation workflow from the command line:

1. **`openarbor-rca compile <assessment.json> [--ordinance <jurisdiction-id>] [--out <report.md>]`:**
   * Validates the field JSON payload against `schemas/rca_assessment.schema.json` via `validateJsonSchema`, runs `lintRcaEvidentiaryReport`, computes Mattheck `t/R` stability and pneumatic AirSpade amendment volumes, evaluates municipal ordinance permit triggers, embeds a vector SVG root-zone protection map, and outputs a 10-section evidentiary report anchored by a canonical SHA-256 digest.
2. **`openarbor-rca counter-notice <assessment.json> [--out <notice.md>]`:**
   * Generates a formal **Scientific Preservation and Biomechanical Counter-Notice** refuting conflicted contractor removal bids whenever the measured sound wood shell satisfies Mattheck's stability criterion (`t/R >= 0.30`). Documents the exact municipal tree protection code, Shigo CODIT compartmentalization status, fiduciary conflict-of-interest disclosure, and the 200-year Holobiont Biological Equity that would be destroyed by removal.
3. **`openarbor-rca economics <assessment.json> [--json]`:**
   * Executes `computeRegenerativePracticeEconomics`, contrasting the one-time, high-casualty Legacy Contractor Removal model against the 5-Year Regenerative Stewardship model (Year 0 5-domain diagnostic and pneumatic radial trenching, SGR relief, biochar/compost/humate inoculation, and native understory guild installation; Year 1 STIM leading indicator audit; Year 3 mycorrhizal extract and ramial woodchip recharge; Year 5 Sanctuary Scorecard verification). Demonstrates deterministically that preserving mature trees yields a 4x to 7x higher 5-year net practitioner margin while preserving the landowner's biological asset.
4. **`openarbor-rca attest <practitioner.json> <report1.json> <report2.json> <report3.json> [--out <badge.json>]`:**
   * Validates three field assessments against `schemas/rca_assessment.schema.json` and `lintRcaEvidentiaryReport`, computes their canonical SHA-256 evidence hashes, verifies the Year-1 STIM longitudinal monitoring commitment, and mints a cryptographically verifiable **1EdTech Open Badges 3.0 / W3C Verifiable Credential (`OpenBadgeCredential`)** artifact conforming to `schemas/rca_openbadge_v3.schema.json`.

### 6.2 Worked Reference Case (`examples/ashland_oregon_white_oak_rca_v2.json`)

The repository ships with a complete, schema-validated reference diagnostic for a 105 cm DBH *Quercus garryana* (Oregon White Oak) in Ashland, Oregon (`or-ashland`, Ashland Municipal Code 18.4.5 and 18.5.7). Despite internal heartwood decay that reduces its classical CTLA 10th Edition depreciated appraisal to $23,273, the tree exhibits a sound outer shell ratio of `t/R = 0.34` (exceeding Mattheck's `0.30` safety threshold) and an active Wall 4 barrier zone. The Open Arbor engine prescribes 10.79 m3 of 150 psi radial AirSpade decompaction, 863 L of pre-charged biochar, 1.62 m3 of fungal compost, 68.42 m3 of ramial woodchip mulch, and 62 native Rogue Valley companion plants (*Mahonia aquifolium*, *Ribes sanguineum*, *Polystichum munitum*, and *Ceanothus integerrimus*), preserving $427,039 in 200-year Holobiont Biological Equity (`18.35x` valuation inversion).

---

## 7. References (APA 7)

* American National Standards Institute & Tree Care Industry Association. (2023). *ANSI A300 tree care standards: Consolidated edition*. TCIA; ISA. https://wwv.isa-arbor.com/store/product/4645/cid/117/
* ANSI National Accreditation Board. (2013). *Fees: Accreditation of personnel certification bodies* (Public Procedure PCAC-PR-522, Rev. 2). ANSI. https://www.ansica.org/
* ANSI National Accreditation Board. (2026). *How to prepare for ANAB ISO/IEC 17024 accreditation*. https://anab.ansi.org/resource/how-to-prepare-iso-iec-17024-accreditation/
* Council of Tree and Landscape Appraisers. (2018). *Guide for plant appraisal* (10th ed.). International Society of Arboriculture.
* Cunningham-Eurich, I., & Wentworth, J. (2025). *Regenerative agriculture* (POSTnote 748). UK Parliament Parliamentary Office of Science and Technology. https://researchbriefings.files.parliament.uk/documents/POST-PN-0748/POST-PN-0748.pdf
* DDC-I, Inc. (2024). *OpenArbor: An Eclipse-based IDE & tool set for embedded real-time mixed language projects*. https://www.ddci.com/solutions/products/openarbor/
* Dias, B. D. (2018). Regenerative development: Building evolutive capacity for healthy living systems. *International Journal of Design & Nature and Ecodynamics*, *13*(3), 315-323. https://doi.org/10.2495/DNE-V13-N3-315-323
* Gann, G. D., McDonald, T., Walder, B., Aronson, J., Nelson, C. R., Jonson, J., Hallett, J. G., Eisenberg, C., Guariguata, M. R., Liu, J., Hua, F., Echeverría, C., Gonzales, E., Shaw, N., Decleer, K., & Dixon, K. W. (2019). International principles and standards for the practice of ecological restoration (2nd ed.). *Restoration Ecology*, *27*(S1), S1-S46. https://doi.org/10.1111/rec.13035
* Giller, K. E., Hijbeek, R., Andersson, J. A., & Sumberg, J. (2021). Regenerative agriculture: An agronomic perspective. *Outlook on Agriculture*, *50*(1), 13-25. https://doi.org/10.1177/0030727021998063
* 1EdTech Consortium. (2026). *Open Badges specification* (Version 3.0, Document Version 1.4.5). https://www.imsglobal.org/spec/ob/v3p0
* Institute for Credentialing Excellence. (2026). *Application, renewal, and maintenance fees: ISO/IEC 17024 and NCCA accreditation*. https://www.credentialingexcellence.org/
* International Society of Arboriculture. (2025). *ISA launches new credentialing system and updated pricing structure*. https://www.isa-arbor.com/
* Mang, P., & Haggard, B. (2016). *Regenerative development and design: A framework for evolving sustainability*. John Wiley & Sons. https://regenesisgroup.com/book
* Mang, P., & Reed, B. (2012). Designing from place: A regenerative framework and methodology. *Building Research & Information*, *40*(1), 23-38. https://doi.org/10.1080/09613218.2012.621341
* Mattheck, C. (2007). *Updated field guide for visual tree assessment*. Forschungszentrum Karlsruhe GmbH.
* Mattheck, C., & Breloer, H. (1994). *The body language of trees: A handbook for failure analysis*. HMSO.
* Newton, P., Civita, N., Frankel-Goldwater, L., Bartel, K., & Johns, C. (2020). What is regenerative agriculture? A review of scholar and practitioner definitions based on processes and outcomes. *Frontiers in Sustainable Food Systems*, *4*, Article 577723. https://doi.org/10.3389/fsufs.2020.577723
* NOFA Organic Land Care. (2026). *Get accredited: Accredited Organic Land Care Professional (AOLCP) course and reaccreditation*. Connecticut Chapter of the Northeast Organic Farming Association. https://nofa.organiclandcare.net/
* O'Donoghue, T., Minasny, B., & McBratney, A. (2022). Regenerative agriculture and its potential to improve farmscape function. *Sustainability*, *14*(10), Article 5815. https://doi.org/10.3390/su14105815
* Scharenbroch, B. C., & Smiley, E. T. (2021). *Best management practices: Soil management for urban trees* (2nd ed.). International Society of Arboriculture. https://wwv.isa-arbor.com/store/product/863
* Schreefel, L., Schulte, R. P. O., de Boer, I. J. M., Pas Schrijver, A., & van Zanten, H. H. E. (2020). Regenerative agriculture: The soil is the base. *Global Food Security*, *26*, Article 100404. https://doi.org/10.1016/j.gfs.2020.100404
* Shigo, A. L. (1977). *Compartmentalization of decay in trees* (Agriculture Information Bulletin 405). U.S. Department of Agriculture, Forest Service.
* Shigo, A. L. (1984). Compartmentalization: A universal defense process in plants. *Plant Disease*, *68*(3), 257-261.
* Society for Ecological Restoration. (2026). *Become a Certified Ecological Restoration Practitioner (CERP): Requirements and fee schedule*. https://www.ser.org/page/cerpapplications/
* Society of American Foresters. (2026). *Certified Forester (CF) and Certified Urban and Community Forester (CUCF) requirements and fees*. https://www.eforester.org/
* Soil Food Web School. (2026). *Foundation courses overview and Consultant Training Program (CTP) tuition schedule*. https://soilfoodweb.com/
* Stenberg, K. (2025). *Atmos Tree 2:1 tREeCYCLE alliance and blog*. Atmos Tree. https://www.atmostree.org/about
* Xiao, Q., McPherson, E. G., Simpson, J. R., & Ustin, S. L. (2000). Winter rainfall interception by two mature street trees in Davis, California. *Hydrological Processes*, *14*(4), 763-784.
