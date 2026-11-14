# Regenerative Arboriculture Protocol Specification (RAP-Spec v2.0)

Status: Canonical Practice and Data Specification
Protocol Name: Regenerative Arboriculture Protocol (`RAP`), "That's a RAP"
Practitioner Designation: Regenerative Arboriculture Protocol Practitioner in Ecological Restoration (`RAPPER`)
Schema Identifier: `RAP_v2` (backward compatible with `RAP_v1`, `RCA_v1`, `RCA_v2`)

## 1. Purpose and professional context

The Regenerative Arboriculture Protocol (`RAP`) is an open diagnostic, evidentiary, and stewardship standard for living trees and urban-wildland root-soil systems.

`RAP` builds upon established arboricultural standards and literature rather than replacing them:

- Construction and root protection: `ANSI A300` (Part 5), `ISA BMP`, `AS 4970-2009`, and `BS 5837:2012`
- Visual and advanced risk assessment: `ISA TRAQ`
- Structural mechanics and decay compartmentalization: Claus Mattheck hollow-cylinder `t/R` criterion and Alex Shigo `CODIT` wall response model
- Appraisal and evidentiary reporting: Council of Tree and Landscape Appraisers (`CTLA` 10th Edition) and the `ASCA` seven-part evidentiary report structure

### 1.1 Protocol boundary: `RAP` / `RAPPER` vs. `ASCA` `RCA`

In professional arboriculture, `RCA` denotes a Registered Consulting Arborist credentialed under `ASCA` (`ASCA_Registered_Consulting_Arborist`). Open Arbor reserves `RCA` strictly for `ASCA` Registered Consulting Arborist references. Open Arbor's diagnostic protocol is named the **Regenerative Arboriculture Protocol (`RAP`)**, and practitioners certified against `RAP-Spec v2.0` hold the **Regenerative Arboriculture Protocol Practitioner in Ecological Restoration (`RAPPER`)** designation. See [docs/16_RAP_AND_RAPPER_ARCHITECTURE.md](./16_RAP_AND_RAPPER_ARCHITECTURE.md) for the protocol-first ontology, four-rung `RAPPER` progression ladder, Two-Register Citation Rule, and adoption kill criteria (`H-RAP-1` through `H-RAP-3`).

## 2. Licensing

Open Arbor separates software, data schemas, and practice documentation under distinct open licenses:

- **Code (`src/`, `bin/`, `web/`, `server/`):** `AGPL-3.0-only`
- **Schemas and datasets (`schemas/`, `data/`):** `CC0-1.0`
- **Specification prose (`docs/13_RAP_PRACTICE_SPECIFICATION_v1.md`, `docs/16_RAP_AND_RAPPER_ARCHITECTURE.md`):** `CC BY-SA 4.0`

## 3. Five Mandatory Diagnostic Domains (`schemas/rap_assessment.schema.json`)

Every `RAP_v2` diagnostic record conforms to `schemas/rap_assessment.schema.json` (`assessment_mode: "Regenerative Diagnostic"`, `additionalProperties: false`) and contains five mandatory object domains evaluated by `src/core/rapEngine.js`:

1. `structural_baseline`: Aboveground biometrics (`dbh_cm`, `is_multistem`, `stem_diameters_cm`, `multistem_aggregation_method`, `height_m`, `crown_spread_ns_m`, `crown_spread_ew_m`, `live_crown_ratio_pct`), coarse geographic location (`plus_code_global`), `codit_wall_response_rating`, Mattheck shell ratio (`sound_shell_thickness_ratio_t_over_r`), instrument artifact URI (`sonic_tomography_or_resistograph_uri`), `dual_valuation`, `isa_traq_risk`, and `municipal_permit_disposition`.
2. `rhizosphere_and_root_collar`: Root flare burial (`root_flare_burial_depth_cm`), flare diameter (`root_flare_diameter_cm`), stem girdling roots (`stem_girdling_root_count`, `stem_girdling_root_severity`), pneumatic excavation geometry (`airspade_radial_trenching_geometry` at nominal `operating_pressure_psi`), and concentric protection radii (`crz_radius_m`, `srz_radius_m`, `tiz_radius_m`).
3. `soil_and_microbiome_baseline`: Compaction and hydrology (`bulk_density_g_cm3`, `penetrometer_resistance_psi`, `infiltration_rate_mm_hr`, `organic_matter_pct`, `soil_ph`), lab provenance (`lab_panel_url`, `lab_sample_id`), and `mycorrhizal_and_fungal_observations`.
4. `understory_and_guild_prescription`: Bioregional `reference_ecosystem_name`, biochar (`biochar_volume_liters`), humate (`humate_mass_kg`), compost, ramial woodchip mulch, and `native_companion_species_guild` entries.
5. `outcome_monitoring_schedule`: Longitudinal leading indicators including `one_year_leading_indicators` (`scheduled_reinspection_date`) and subsequent recovery checkpoints.

A complete reference case is stored at `examples/ashland_oregon_white_oak_rap_v2.json` (`ASH-QG-105`, `Quercus garryana` in Ashland, Oregon, `t/R = 0.34`, `crz_radius_m = 12.6`, `srz_radius_m = 3.68`, `tiz_radius_m = 16.5`).

## 4. Deterministic Biomechanics and Evidentiary Gates

`src/core/rapEngine.js` implements pure ESM functions compiled identically in Node.js CLI (`bin/openarbor-rap.mjs`) and the static browser bundle (`out/openarbor-bundle.js`):

- `evaluateBiomechanicsAndRhizosphere(assessment)`: evaluates Mattheck `t/R >= 0.30` hollow-cylinder bending stability, computes concentric `SRZ`, `CRZ`, and `TIZ` areas, and scales pneumatic rhizosphere decompaction and amendment volumes (biochar at `8%` of decompacted volume, fungal compost at `15%` of decompacted volume, ramial woodchip mulch at 8 cm depth across `TIZ`, humate at 1.5 kg per cubic meter).
- `lintRapEvidentiaryReport(assessment)`: runs five hard evidentiary gates:
  1. `MISSING_DOMAIN`: verifies all five mandatory domains exist.
  2. `INVALID_BIOMETRICS` / `INVALID_GEO_LOCATION`: requires positive `dbh_cm` and non-empty `plus_code_global`.
  3. `UNJUSTIFIED_REMOVAL` and `EVIDENTIARY_DEFECT`: blocks `Removal_Last_Resort_Unmitigable_Hazard` when `sound_shell_thickness_ratio_t_over_r >= 0.30`, and requires an acoustic tomogram or resistograph URI in `sonic_tomography_or_resistograph_uri` for mature or protected tree removals.
  4. `OAK_WILT_VIOLATION`: blocks `Structural_Risk_Reduction_Pruning` when `seasonal_oak_wilt_restriction_active === true` (`Ceratocystis fagacearum`).
  5. `INCOMPLETE_SOIL_DATA`: requires `bulk_density_g_cm3`, `organic_matter_pct`, and `infiltration_rate_mm_hr`.
- `computeCanonicalSha256(obj)` and `compileRapEvidentiaryMarkdown(assessment)`: produces SHA-256 hashed Markdown reports (`# Open Arbor Regenerative Diagnostic & Evidentiary Report (RAP_v2)`) and preservation counter-notices (`compilePreservationCounterNotice`).
- Layer separation: Layer 1 (`determination-v1.0.0`), Layer 2 (`valuation-models-v0.3.0`), and Layer 3 (`practice-economics-v0.2.0`) remain versioned and visually separated per `docs/LAYERS.md`.

## 5. Narrative verification (`LEO-RAP`) and arborist handoff

`src/core/leoRapEngine.js` enforces deterministic grounding between structured diagnostics and prose outputs:

- `compileLeoRapBrief`, `verifyLeoRapNarrative`, and `runLeoRapSelfAudit` verify prose against deterministic biomechanics, rejecting ungrounded removals when `t/R >= 0.30` (`RAP_MATTHECK_T_OVER_R`), flagging unverified statutory defaults, and verifying epistemic status markers (`VERIFIED` vs. `UNVERIFIED`).
- `composeArboristHandoffBrief(params)` compiles a collaborative homeowner-to-arborist consultation message (`steward_to_arborist_message`). By design, when `sonicTomographyVerified` is false or omitted, it omits any `t/R` ratio instead of presenting a synthetic default as an instrument measurement, and it omits contractor bid figures (`stage1Usd`, `removalBidUsd`). It transmits only measured DBH and circumference, species, municipal protection tier, CRZ radius, cash-in-lieu exposure, seasonal Oak Wilt warnings where active, an on-site inspection request, and the reproducible `#oa1=` state link.

## 6. Attestation and Local-First Longitudinal Observation

### 6.1 `RAPPER` Open Badges 3.0 Competency Proof (`schemas/rap_openbadge_v3.schema.json`)

`mintOpenBadgeAttestation(practitioner, assessments, rapAssessmentSchema)` compiles a 1EdTech Open Badges v3.0 / W3C Verifiable Credentials v2.0 `OpenBadgeCredential` JSON-LD document named `Verified Regenerative Arboriculture Protocol Practitioner in Ecological Restoration (RAPPER)` issued by `Open Arbor Alliance`. Each attestation binds three validated `RAP_v2` assessment SHA-256 hashes (`report_sha256_hash`), `plus_code_global` coordinates, iNaturalist taxon IDs (`inaturalist_taxon_id`), and `year_1_recovery_milestone_target_date`.

### 6.2 Signing Key Status

Cryptographic `Ed25519Signature2020` / `DataIntegrityProof` key custody and revocation registry publication remain unimplemented in the local static bundle and carry explicit placeholder status where rendered in verification artifacts.

### 6.3 Local-First Anonymized Field Observation Log (`schemas/rap_field_observation.schema.json`)

To build longitudinal survival and soil-recovery evidence without harvesting client personal data or transmitting telemetry, `src/core/fieldObservationLog.js` implements a local-first observation log conforming to `schemas/rap_field_observation.schema.json` (`schema_version: "RAP_Field_Observation_v1"`, stored locally in the browser or exported as `.jsonl`):

- **Zero client PII gate (`assertZeroClientPii`, `FORBIDDEN_PII_KEYS`, `redactPotentialPii`):** rejects forbidden property names (`client_name`, `owner_name`, `homeowner_name`, `customer_name`, `full_name`, `contact_name`, `email`, `client_email`, `phone`, `phone_number`, `street_address`, `address`, `mailing_address`, `parcel_id`, `parcel_apn`, `apn`, `tax_lot`) and prototype-pollution keys (`__proto__`, `constructor`, `prototype`), and scrubs email addresses, phone numbers, and street address patterns from `field_notes` and `amendments_applied`.
- **Watershed cell location coarsening (`coarsenPlusCode`):** truncates any Open Location Code (`Plus Code`) to six grid characters followed by `00+` (`^[23456789CFGHJMPQRVWX]{6}00\+$`), coarsening location to a roughly 1.1 km cell.
- **Measurement provenance honesty:** `baseline.internal_decay_method` permits `visual_only_unmeasured`, `resistograph`, or `sonic_tomography`. When `visual_only_unmeasured` is selected, `baseline.measured_t_over_r` is forced to `null` so uninstrumented observations cannot fabricate a numeric `t/R` value; `verifyFieldObservationRecord` fails with `PROVENANCE_VIOLATION` if this constraint is violated.
- **Intervention stages and longitudinal outcomes:** records `intervention.stage_executed` (`diagnostic_only`, `stage_1_stabilize`, `stage_2_soil_remediation`, `stage_3_guild_and_monitoring`), optional `baseline.soil_function` validated via `src/core/soilFunction.js`, and `longitudinal_outcomes` entries (`checkpoint_year`, `date`, `twig_extension_cm`, `canopy_dieback_pct`, `infiltration_mm_hr`, `survival_status` in `Thriving`, `Stable`, `Declining`, `Failed_Or_Removed`).
- **Deterministic integrity and cohort export:** each record is sealed with `canonical_sha256` (`computeCanonicalSha256`) and attested with `privacy_attestation` (`zero_client_pii: true`, `plus_code_coarsened_to_watershed_cell: true`). `serializeObservationCohortJsonl` validates all records before writing newline-delimited JSON, and `summarizeObservationCohort` tracks progress toward an initial 10-consultation cohort (`targetCohortSize = 10`).

## 7. Legacy shims

Legacy `RCA` module paths, CLI command names, and MCP tool names remain supported as thin re-export shims so existing assessments and links do not break:

- `src/core/rcaEngine.js` re-exports `src/core/rapEngine.js`
- `src/core/leoRcaEngine.js` re-exports `src/core/leoRapEngine.js`
- `bin/openarbor-rca.mjs` forwards to `bin/openarbor-rap.mjs`
- `schemas/rca_assessment.schema.json` and `schemas/rca_openbadge_v3.schema.json` accept both `RAP_*` and legacy `RCA_*` discriminators
- `server/mcp/openarbor-mcp.mjs` exposes `rap_biomechanics`, `rap_lint`, and `leo_rap_verify` while honoring `rca_biomechanics`, `rca_lint`, and `leo_rca_verify` aliases
