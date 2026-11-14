# Open Arbor Project Overlay

**Scope:** `/home/george/Myceliate_Master/UNDERSTORY/arboracle-ecosystem/openarbor` (canonical repository for `product-openarbor`; note `/home/george/Myceliate_Master/ARBORETUM/Active/OpenArbor` is a retired stale clone and must not be read from or written to)
**Domain & Version:** `product-openarbor` (`openarbor@2.2.0`, `RAP-Spec v2.0`, `openarbor-mcp v2.2.0`) | **Canonical Repo:** `https://github.com/Arboracle-Ecosystem/openarbor.git`
**Owner:** George Steward (`ISA Certified Arborist TX-362025A`, Oak Wilt Qualified)

Global law in [`/home/george/AGENTS.md`](file:///home/george/AGENTS.md) applies at full strength; this overlay adds Project Open Arbor rules below and removes none. All `RAP` and `RAPPER` terminology, citation, and credentialing rules defined here are strictly confined to Project Open Arbor and are not universal fleet law.

---

## 1. Domain Purpose, Protocol Boundary, and Open Licensing

Open Arbor is the zero-dependency, local-first open-standards engine, static field portal, ordinance commons, and `stdio` MCP server for homeowners, practicing restoration arborists, and municipal review staff.

### Core Project Rules

1. **Trademark and Naming Hygiene:** Public prose uses the spaced two-word mark **Open Arbor**. Unspaced `openarbor` is reserved for npm package identifiers, CLI commands (`openarbor-rap`, `openarbor-mcp`), MCP server identifiers, and repository paths.
2. **Protocol, Practitioner Designation, and `ASCA` `RCA` Boundary:**
   * Open Arbor's diagnostic and stewardship protocol is the **Regenerative Arboriculture Protocol (`RAP`, `RAP-Spec v2.0`, tagline `"That's a RAP"`)**, defined in [docs/13_RAP_PRACTICE_SPECIFICATION_v1.md](./docs/13_RAP_PRACTICE_SPECIFICATION_v1.md) and [docs/16_RAP_AND_RAPPER_ARCHITECTURE.md](./docs/16_RAP_AND_RAPPER_ARCHITECTURE.md).
   * Practitioners attested against `RAP-Spec v2.0` hold the **Regenerative Arboriculture Protocol Practitioner in Ecological Restoration (`RAPPER`)** designation (`schemas/rap_openbadge_v3.schema.json`).
   * **Strict `RCA` Reservation:** Inside Project Open Arbor, `RCA` denotes **only** `ASCA` Registered Consulting Arborist (`ASCA_Registered_Consulting_Arborist`). Thin shims (`src/core/rcaEngine.js`, `src/core/leoRcaEngine.js`, `bin/openarbor-rca.mjs`, legacy `rca_biomechanics` / `rca_lint` / `leo_rca_verify` MCP aliases, and the `#oa1=` `.rca` envelope key) remain solely for backward compatibility.
3. **Open Arbor Two-Register Citation Rule:**
   * **Register A (Municipal, Legal, Statutory, and CV Submittals):** Lead with **Regenerative Arboriculture Protocol Practitioner in Ecological Restoration (`RAP-Spec v2.0`)** (or **Certified RAP Practitioner** on character-limited municipal forms) paired with statutory credentials in `legacy_statutory_equivalencies` (`ISA_Certified_Arborist`, `ISA_Board_Certified_Master_Arborist`, `ASCA_Registered_Consulting_Arborist`, `SAF_Certified_Urban_And_Community_Forester`, `SAF_Certified_Forester`, `SER_Certified_Ecological_Restoration_Practitioner`, or accredited degree). Never abbreviate an Open Arbor practitioner as `RCA`.
   * **Register B (Field Practice, Open Badges, Peer Guild, and Stewardship Culture):** Use **`RAPPER`**, **`RAP`**, and **`"That's a RAP"`** across 1EdTech Open Badges 3.0 credentials, CLI/MCP workflows, and field handoffs.
4. **Three-Layer Epistemic Separation (`docs/LAYERS.md`):**
   * **Layer 1 (`determination-v1.0.0`):** `ANSI A300` Part 5, `AS 4970-2009`, `BS 5837:2012`, seasonal *Ceratocystis fagacearum* (Oak Wilt) restrictions, declarative municipal code outcomes, and Mattheck hollow-cylinder `t/R >= 0.30` safety checks always lead every brief. Keep missing rules on `Threshold_And_Fee_Record` cities (`tx-cedar-park`, `tx-round-rock`) visible as `UNVERIFIED`.
   * **Layer 2 (`valuation-models-v0.3.0`):** `CTLA` 10th Edition appraisals, 200-year holobiont equity hypotheses, Nowak/Cairns/Xiao/McPherson ecosystem services, John White `FCIN12` age bands, and NRCS soil sponge estimates remain labeled as `0.x` models subordinate to Layer 1.
   * **Layer 3 (`practice-economics-v0.2.0`):** Phased 3-stage triage and 5-year margin comparisons remain regional economic models governed by kill criteria in [docs/LAYERS.md](./docs/LAYERS.md).
5. **Instrument, Soil, and Privacy Honesty:** Never report `visual_only` or mallet acoustic impressions as instrument-verified `t/R` numbers (`resistograph` or `sonic_tomography` required; `visual_only_unmeasured` forces `measured_t_over_r: null`). Never fabricate `soil_function` numbers without measurement dates and source provenance. Strip all client PII (`FORBIDDEN_PII_KEYS`) and coarsen GPS Plus Codes to `XXXXXX00+` (`~1.1 km` watershed cells) before persisting field observation cohorts.
6. **Open Licensing Split:** Engine, CLI, web, and MCP code (`src/`, `bin/`, `web/`, `server/`) is `AGPL-3.0-only`; schemas and municipal ordinance datasets (`schemas/`, `data/`) are `CC0-1.0` public domain; specification prose (`docs/`) is `CC BY-SA 4.0`.

---

## 2. Repository Architecture (`v2.2.0`)

| Surface | Key Paths | Role |
| :--- | :--- | :--- |
| **Core Deterministic Modules (`src/core/`)** | `rootZone.js`, `ordinanceEngine.js`, `ecosystemBenefits.js`, `soilFunction.js`, `fieldObservationLog.js`, `rapEngine.js`, `leoRapEngine.js` (plus `rcaEngine.js` and `leoRcaEngine.js` shims) | Zero-dependency ESM calculations for `CRZ`/`TPZ`/`SRZ`, municipal mitigation, Nowak/Xiao/McPherson/White models, NRCS vadose sponge, zero-PII `.jsonl` cohorts, `RAP_v2` biomechanics/linting/badges, and 6-slot `LEO-RAP` verification |
| **CLI Tools (`bin/`)** | `openarbor-rap.mjs`, `openarbor-mcp.mjs`, `openarbor-rca.mjs` (shim) | CLI compiler (`compile`, `counter-notice`, `economics`, `attest`), MCP launcher wrapper, and legacy RCA shim |
| **Unified MCP Server (`server/mcp/`)** | `openarbor-mcp.mjs` (`v2.2.0`), `mcpCore.mjs`, `README.md` | Local stdio JSON-RPC 2.0 server exposing `openarbor_consult`, 8 specialist tools, and 3 `LEO-RAP` prompts with zero API keys |
| **Steward Agent Pack (`agents/openarbor-steward/`)** | `SKILL.md`, `AGENTS.md`, `claude-agent.md`, `hermes-steward.yaml`, `README.md` | Drop-in cross-harness agent instructions covered by `tests/verify_mcp.mjs` and `deploy/VERIFICATION.md` |
| **Public-Domain Schemas & Data (`schemas/`, `data/`)** | `municipal-ordinance.schema.json`, `rap_assessment.schema.json`, `rap_field_observation.schema.json`, `rap_openbadge_v3.schema.json` (plus legacy `rca_*.json`), `central_texas_ordinances.json`, `rogue_valley_oregon_ordinances.json` | JSON Schema (`Draft 2020-12` / Open Badges 3.0) contracts and verified Central Texas & Southern Oregon municipal ordinance datasets |
| **Specifications (`docs/`)** | `13_RAP_PRACTICE_SPECIFICATION_v1.md`, `16_RAP_AND_RAPPER_ARCHITECTURE.md`, `LAYERS.md`, `14_OPENARBOR_PLATFORM_100X.md`, `13_RCA_PRACTICE_SPECIFICATION_v1.md` (redirect) | Normative `RAP-Spec v2.0` standard, `RAP` / `RAPPER` architecture & progression model, 3-layer kill criteria, and legacy redirect |
| **Verification Suites (`tests/`)** | `verify_openarbor.mjs`, `verify_soil_function.mjs`, `verify_mcp.mjs`, `verify_masterwork_100x.mjs` | Deterministic verification across core math, soil provenance, MCP subprocess compliance, web bundle, `#oa1=` parity, and live `out/methods/index.html` counts |

---

## 3. Verification, Parity, and Authority Rules

* **Required Local Checks Before Commits or PRs:**
  * `npm test` (`tests/verify_openarbor.mjs`)
  * `npm run test:soil` (`tests/verify_soil_function.mjs`)
  * `npm run test:mcp` (`tests/verify_mcp.mjs`)
  * `node tests/verify_masterwork_100x.mjs` (enforces `D7` parity matching live verification group counts in `out/methods/index.html`; rebuild with `npm run build:web` whenever web build inputs or pass-group counts change)
* **Protected Artifacts:** Do not edit `agents/openarbor-steward/*` or `tests/` pass-group structures casually without running `npm run test:mcp`, `npm run build:web`, and `node tests/verify_masterwork_100x.mjs` and checking `deploy/VERIFICATION.md`.
* **Git Push:** Confirm with George in conversation before running `git push` to `Arboracle-Ecosystem/openarbor`.
* **Privacy and House Style:** Zero client PII (names, street addresses, phones, emails, APNs), zero family/children names or unverified claims, zero em dashes, zero en dashes, zero spaced hyphens as dashes, zero exclamation points, zero spelled-out `percent`/`dollar`/`dollars` words, and zero AI filler vocabulary. Validate prose edits with `gate.py` and `grounding_check.py`.
