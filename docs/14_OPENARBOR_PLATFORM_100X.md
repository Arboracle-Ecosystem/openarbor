# Open Arbor Platform Strategy: The 100x Deterministic Substrate (`OA-PLATFORM-100X`)

* **Document ID:** `docs/14_OPENARBOR_PLATFORM_100X.md`
* **Date:** `2026-10-23`
* **Steward & Founding Author:** George Steward, ISA Certified Arborist (`TX-362025A`, Oak Wilt Qualified), Open Arbor Alliance / Soil Grower
* **Companion Practitioner Specification:** [`docs/13_RCA_PRACTICE_SPECIFICATION_v1.md`](13_RCA_PRACTICE_SPECIFICATION_v1.md) (`RCA-Spec v2.0`)
* **License:** Specification text under `CC BY-SA 4.0`; code and schemas under `AGPL-3.0-only`

---

## 1. Substrate vs. Product: Becoming the PostgreSQL of Arboriculture

Software in urban forestry and arboriculture has historically competed at the surface layer: proprietary mobile forms, closed GIS viewers, and per-seat SaaS dashboards. Competing solely as another end-user application limits adoption to the practitioners willing to migrate their entire workflow at once.

Open Arbor's 100x trajectory separates the **practitioner layer** from the **tooling substrate**:

1. **The Practitioner Layer (`RCA-Spec v2.0`):** Defined in [`docs/13_RCA_PRACTICE_SPECIFICATION_v1.md`](13_RCA_PRACTICE_SPECIFICATION_v1.md) and executed via `bin/openarbor-rca.mjs`, the Regenerative Consulting Arborist (RCA) methodology is the credential, diagnostic standard, and evidentiary report compiler. It is Open Arbor's first flagship application.
2. **The Tooling Substrate (`openarbor` Core, MCP, and Ordinance Commons):** Underneath the RCA sits the deterministic calculation kernel (`src/core/rootZone.js`, `src/core/ordinanceEngine.js`, `src/core/ecosystemBenefits.js`, and `src/core/rcaEngine.js`) paired with the machine-readable municipal ordinance commons (`data/ordinances/`).

Open Arbor's structural objective is to become the **PostgreSQL of arboriculture**: the zero-dependency, standards-cited deterministic engine that every other tool, civil engineering pipeline, municipal review portal, and AI assistant calls when a tree question requires a defensible answer.

| Architectural Layer | Component Artifacts | Role in the Ecosystem |
| :--- | :--- | :--- |
| **Layer 3: Practitioner & Commercial Surface** | `RCA-Spec v2.0`, `bin/openarbor-rca.mjs`, Arboracle Pro (hosted convenience layer) | Delivers court-defensible 10-section evidentiary reports, anti-liquidation counter-notices, 5-year stewardship economics, and W3C Open Badges 3.0 attestations. |
| **Layer 2: Agentic & Package Distribution** | `server/mcp/openarbor-mcp.mjs` (stdio JSON-RPC 2.0 MCP), `package.json` subpath exports | Routes AI assistant queries (Claude Desktop, Hermes, local agents) and Node.js applications directly into Open Arbor's deterministic functions. |
| **Layer 1: Deterministic Kernel & Data Commons** | `src/core/*.js`, `schemas/*.schema.json`, `data/ordinances/*.json`, `scripts/validate-ordinance.mjs` | Encodes Mattheck `t/R` biomechanics, `ANSI A300` / `AS 4970` root zones, Nowak/McPherson allometrics, and statutory municipal tree codes with zero runtime dependencies. |

---

## 2. Move 1: The MCP Distribution Thesis (AI Assistants as the 2027 Channel)

The distribution channel for technical standards has shifted. In 2027, an arborist, landscape architect, civil engineer, or homeowner standing in front of a mature tree does not search a textbook for the `AS 4970` Structural Root Zone formula or dig through a 400-page municipal PDF to check whether a 26-inch Live Oak triggers heritage mitigation. They ask an AI assistant.

When a language model answers a tree-protection question from pre-training memory alone, it hallucinates DBH thresholds, miscalculates root-zone areas, and defaults to legacy risk-liquidation bias. When that same assistant connects to `server/mcp/openarbor-mcp.mjs` over the Model Context Protocol (MCP), two things happen simultaneously:

1. **Deterministic Mathematical Authority:** Every calculation routes through verified ECMAScript modules (`calculate_root_zone`, `evaluate_ordinance`, `calculate_ecosystem_benefits`, `rca_biomechanics`, `rca_lint`, `lookup_ordinance`). The assistant returns exact imperial and metric root zones, statutory citations, and biological equity figures rather than statistical guesses.
2. **Routing Around Legacy Institutional Gatekeeping:** Whose engine the AI calls determines whose methodology governs the field. Because `rca_biomechanics` and `rca_lint` enforce Claus Mattheck's `t/R >= 0.30` hollow-shell stability criterion, pneumatic rhizosphere decompression (`AirSpade`), and Holobiont Biological Equity at the tool layer, any AI assistant connected to Open Arbor defaults to preservation-first regenerative science rather than un-evidenced tree removal.

---

## 3. Move 2: The Municipal Ordinance Data Commons Moat

Across the United States, municipal tree preservation ordinances are locked inside dead PDFs and fragmented web portals (`Municode`, `eCode360`, `American Legal Publishing`). No institution publishes them as schema-validated, machine-readable open data.

Open Arbor turns this fragmentation into an appreciating open-data moat through three mechanisms:

1. **Declarative Schema Enforcement:** [`schemas/municipal-ordinance.schema.json`](../schemas/municipal-ordinance.schema.json) standardizes how protection DBH thresholds, species-gated heritage rules, invasive species exceptions, seasonal Oak Wilt pruning windows, ascending diameter exemption caps, and mitigation fee tiers are represented in JSON.
2. **Zero-Dependency Validation Pipeline:** Contributors validate new or updated city records locally in milliseconds via `node scripts/validate-ordinance.mjs` before opening a pull request, following [`data/ordinances/CONTRIBUTING_DATA.md`](../data/ordinances/CONTRIBUTING_DATA.md). Every number requires a verifiable `source_url` and section-level `citation`; any unextracted sub-rule is marked `UNVERIFIED` rather than guessed.
3. **Compounding Network Economics:** A single consulting arborist encoding their home city into `data/ordinances/` immediately unlocks automated permit determinations (`evaluate_ordinance`), SVG protection maps, and RCA counter-notices (`bin/openarbor-rca.mjs`) for every practitioner in that jurisdiction. Over time, municipalities themselves become downstream consumers of verified ordinance packages to automate plan-review intake.

---

## 4. Move 3: The npm, AGPL v3, and Arboracle Pro Red Hat Model

Open Arbor combines zero-friction open-source adoption with sustainable commercial capture using the Red Hat / dual-surface model:

1. **One-Command Developer & Researcher Adoption (`npm`):** Packaging `openarbor` (`v2.0.0`) with clean subpath exports (`openarbor/root-zone`, `openarbor/ordinance-engine`, `openarbor/ecosystem-benefits`, `openarbor/rca-engine`) and zero external dependencies allows any GIS pipeline, university lab, or civic-tech tool to import the engines with a single command and run them anywhere Node.js runs.
2. **Copyleft Reciprocity (`AGPL-3.0-only`):** Licensing the engines, schemas, and MCP server under `AGPL-3.0-only` guarantees that any third party embedding Open Arbor into a networked or hosted software service must release their modifications and ordinance additions back to the commons. Competitors cannot strip-mine the ordinance database or biomechanical kernel into a closed SaaS wrapper.
3. **Commercial Capture via Arboracle Pro:** While self-hosting the CLI, MCP server, and ESM libraries remains free and open for practitioners, researchers, and students, **Arboracle Pro** (the hosted convenience platform, already live) serves commercial tree care firms, multi-crew consultancies, and municipal forestry departments that prefer managed cloud sync, team workflows, client portals, and turnkey reporting over self-hosting.

---

## 5. Honest Current State Receipt (October 23, 2026)

Per Open Arbor's citation and integrity rules, the exact state of this repository on disk as of `2026-10-23` is recorded below:

* **Core Engines (`src/core/`):** Four zero-dependency ESM modules (`rootZone.js`, `ordinanceEngine.js`, `ecosystemBenefits.js`, `rcaEngine.js`) are implemented on disk and pass all 9 deterministic verification suites in `npm test` (`tests/verify_openarbor.mjs`).
* **Practitioner CLI (`bin/openarbor-rca.mjs`):** Implemented and verified (`compile`, `counter-notice`, `economics`, `attest`).
* **MCP Server (`server/mcp/openarbor-mcp.mjs`):** Implemented and verified on disk. Exposes 6 deterministic tools over stdio JSON-RPC 2.0 (`calculate_root_zone`, `evaluate_ordinance`, `calculate_ecosystem_benefits`, `rca_biomechanics`, `rca_lint`, `lookup_ordinance`) and passes all 6 subprocess protocol tests in `npm run test:mcp` (`tests/verify_mcp.mjs`).
* **Municipal Ordinance Commons (`data/ordinances/`):** Eight municipal records are encoded across two regional files (`central_texas_ordinances.json` and `rogue_valley_oregon_ordinances.json`), validated by `scripts/validate-ordinance.mjs`:
  * **Six full-rule cities (`Full_Rule_Record`):** Austin (`tx-austin`), Georgetown (`tx-georgetown`), Liberty Hill (`tx-liberty-hill`), Ashland (`or-ashland`), Medford (`or-medford`), and Grants Pass (`or-grants-pass`) carry complete protection thresholds, species rules, `permit_triggers_by_work_type`, `mitigation_fee_schedule`, and `plan_rules`.
  * **Two baseline threshold-and-fee cities (`Threshold_And_Fee_Record`):** Cedar Park (`tx-cedar-park`) and Round Rock (`tx-round-rock`) carry verified protection thresholds, species exceptions, and `mitigation_fee_schedule` tiers; their `permit_triggers_by_work_type` and `plan_rules` sub-blocks remain `UNVERIFIED` pending extraction from municipal code.
* **npm Package Publication Status:** `package.json` (`v2.0.0`) is configured and verified via `npm pack --dry-run`, but the package is **not yet published** to the public npm registry. Publishing is an external release action reserved for maintainer sign-off.
