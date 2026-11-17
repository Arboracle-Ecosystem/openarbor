# Open Arbor v2.2 CLI vs. Browser Bundle Parity Verification Report

- **Verification Date:** `2026-10-29`
- **Parity Verdict:** **4/4 IDENTICAL (`PASS`)**
- **Certified Engine Integrity:** Zero modifications to `src/core/*` or `data/ordinances/*`. The browser bundle (`out/openarbor-bundle.js`) imports the exact certified source modules via `esbuild`.

## 1. Static Build Artifact Inventory (`out/`)

| File Path | Size (Bytes) | Role |
| :--- | :--- | :--- |
| `out/CONTRIBUTING.md` | `2887` | Open Arbor Contributor & Statutory Verification Guide |
| `out/LICENSE` | `34523` | Engine & Web Portal License (`AGPL-3.0-only`) |
| `out/LICENSE-DATA` | `7048` | Schemas & Municipal Datasets Public Domain Dedication (`CC0-1.0`) |
| `out/NOTICE` | `286` | Open Arbor Attribution & Governance Notice |
| `out/agents/openarbor-steward/AGENTS.md` | `2235` | Portable OpenArbor Steward Agent Pack (`LEO-RAP`) |
| `out/agents/openarbor-steward/README.md` | `1717` | Portable OpenArbor Steward Agent Pack (`LEO-RAP`) |
| `out/agents/openarbor-steward/SKILL.md` | `5104` | Portable OpenArbor Steward Agent Pack (`LEO-RAP`) |
| `out/agents/openarbor-steward/claude-agent.md` | `2292` | Portable OpenArbor Steward Agent Pack (`LEO-RAP`) |
| `out/agents/openarbor-steward/hermes-steward.yaml` | `1172` | Portable OpenArbor Steward Agent Pack (`LEO-RAP`) |
| `out/cases/ashland-oregon-white-oak/index.html` | `52585` | Static Pre-Rendered Bioregional Field Case Page |
| `out/cases/austin-heritage-live-oak/index.html` | `52167` | Static Pre-Rendered Bioregional Field Case Page |
| `out/cases/georgetown-multistem-pecan/index.html` | `51110` | Static Pre-Rendered Bioregional Field Case Page |
| `out/cases/index.html` | `31043` | 5-Case Bioregional Field Gallery Index (`/cases/`) |
| `out/cases/liberty-hill-post-oak/index.html` | `51348` | Static Pre-Rendered Bioregional Field Case Page |
| `out/cases/medford-ponderosa-pine/index.html` | `51950` | Static Pre-Rendered Bioregional Field Case Page |
| `out/data/catalog/forestry-tools.json` | `22589` | Published open dataset JSON |
| `out/data/ordinances/central_texas_ordinances.json` | `10712` | Published open dataset JSON |
| `out/data/ordinances/rogue_valley_oregon_ordinances.json` | `7531` | Published open dataset JSON |
| `out/demo/index.html` | `63918` | Interactive 3-mode Open Arbor engine demo (`/demo/`) |
| `out/docs/00_MASTER_BLUEPRINT.html` | `89176` | Static Web Build Artifact |
| `out/docs/13_RAP_PRACTICE_SPECIFICATION_v1.html` | `22461` | Static Web Build Artifact |
| `out/docs/13_RCA_PRACTICE_SPECIFICATION_v1.html` | `8425` | Static Web Build Artifact |
| `out/docs/16_RAP_AND_RAPPER_ARCHITECTURE.html` | `32559` | Static Web Build Artifact |
| `out/docs/CONTRIBUTING_ORDINANCES.html` | `14302` | Static Web Build Artifact |
| `out/docs/DOCUMENTATION_ARCHITECTURE.html` | `12263` | Static Web Build Artifact |
| `out/docs/LAYERS.html` | `16219` | Static Web Build Artifact |
| `out/docs/LAYERS.md` | `6764` | Three-Layer Epistemic Architecture & Kill Criteria (`docs/LAYERS.md`) |
| `out/docs/START_QUICKSTART.html` | `10515` | Static Web Build Artifact |
| `out/docs/START_WHAT_OPEN_ARBOR_IS.html` | `10193` | Static Web Build Artifact |
| `out/docs/TOOLS_DIRECTORY.html` | `15426` | Static Web Build Artifact |
| `out/docs/docs.css` | `13423` | Static Web Build Artifact |
| `out/docs/index.html` | `10626` | Static Web Build Artifact |
| `out/icons/apple-touch-icon.png` | `50286` | PWA & Brand Icon Asset |
| `out/icons/icon-192.png` | `65521` | PWA & Brand Icon Asset |
| `out/icons/icon-512.png` | `49031` | PWA & Brand Icon Asset |
| `out/icons/icon-68.png` | `10726` | PWA & Brand Icon Asset |
| `out/icons/icon-maskable-512.png` | `335298` | PWA & Brand Icon Asset |
| `out/icons/icon.svg` | `5008` | PWA & Brand Icon Asset |
| `out/icons/screenshot-desktop.png` | `216969` | PWA & Brand Icon Asset |
| `out/icons/screenshot-mobile.png` | `147971` | PWA & Brand Icon Asset |
| `out/index.html` | `43178` | Open Arbor (`openarbor.org`) root landing and alliance portal |
| `out/manifest.webmanifest` | `2656` | PWA Web Application Manifest |
| `out/mcp/index.html` | `25141` | 8-Tool MCP Server Playground & JSON-RPC Tester (`/mcp/`) |
| `out/methods/index.html` | `61687` | Executable Proof & Falsifiability Ledger (`/methods/`) |
| `out/openarbor-bundle.js` | `549679` | Compiled ESM browser bundle (engines + ordinances + catalog + schemas + UI) |
| `out/ordinances/index.html` | `13708` | 8-City Municipal Ordinance Commons & Schema Validator (`/ordinances/`) |
| `out/schemas/municipal-ordinance.schema.json` | `3630` | Published JSON Schema (Draft 2020-12) |
| `out/schemas/rap_assessment.schema.json` | `43105` | Published JSON Schema (Draft 2020-12) |
| `out/schemas/rap_field_observation.schema.json` | `6317` | Published JSON Schema (Draft 2020-12) |
| `out/schemas/rap_openbadge_v3.schema.json` | `26589` | Published JSON Schema (Draft 2020-12) |
| `out/schemas/rca_assessment.schema.json` | `42896` | Published JSON Schema (Draft 2020-12) |
| `out/schemas/rca_openbadge_v3.schema.json` | `26473` | Published JSON Schema (Draft 2020-12) |
| `out/spec/index.html` | `28304` | RAP-Spec v2.0 & 200-Year Heartwood Vault Reference (`/spec/`) |
| `out/styles.css` | `72395` | Shared Sunlight Field & Canopy Dark design system stylesheet |
| `out/sw.js` | `5514` | Offline-First Service Worker Cache Shell |
| `out/tools/index.html` | `14124` | 41-tool Open-Source Forestry & Arboriculture Workbench (`/tools/`) |

## 2. Executive Summary of 4 Fixed Bioregional Input Cases (Texas & Oregon)

| Case ID | Municipality | Species & Tag | DBH | CLI vs. Browser Bundle Parity |
| :--- | :--- | :--- | :--- | :--- |
| `case-1-austin-live-oak` | `tx-austin` | *Quercus virginiana* (`ATX-QV-101`) | 76.2 cm / 30 in | **IDENTICAL (21/21 metrics match)** |
| `case-2-georgetown-pecan` | `tx-georgetown` | *Carya illinoinensis* (`GTN-CI-204`) | 68.58 cm / 27 in | **IDENTICAL (21/21 metrics match)** |
| `case-3-liberty-hill-post-oak` | `tx-liberty-hill` | *Quercus stellata* (`LBH-QS-309`) | 50.8 cm / 20 in | **IDENTICAL (21/21 metrics match)** |
| `case-4-ashland-oregon-white-oak` | `or-ashland` | *Quercus garryana* (`ASH-QG-105`) | 105 cm / 41.34 in | **IDENTICAL (21/21 metrics match)** |

## 3.1 Case 1: Austin Heritage Live Oak (30 in DBH)

- **Fixture File:** `deploy/fixtures/case-1-austin-live-oak.json`
- **CLI Command Executed:** `node bin/openarbor-rap.mjs compile deploy/fixtures/case-1-austin-live-oak.json --ordinance tx-austin`
- **CLI Economics Command:** `node bin/openarbor-rap.mjs economics deploy/fixtures/case-1-austin-live-oak.json --json`
- **CLI Counter-Notice Command:** `node bin/openarbor-rap.mjs counter-notice deploy/fixtures/case-1-austin-live-oak.json`
- **Browser Bundle Call:** `evaluateCompleteFieldCase(assessment, { ordinance_id: 'tx-austin', ... })` from `out/openarbor-bundle.js`

| Output Metric / Artifact | Local CLI (`bin/openarbor-rap.mjs` + Node Core) | Browser Bundle (`out/openarbor-bundle.js`) | Match |
| :--- | :--- | :--- | :--- |
| **RAP_v2 Canonical SHA-256 Digest** | `369f3fbe5f1ceb13e7d384248bd2462ffadb37129e980af0cc71372d0a39bd6f` | `369f3fbe5f1ceb13e7d384248bd2462ffadb37129e980af0cc71372d0a39bd6f` | **IDENTICAL** |
| **CLI compile Report Markdown Length (chars)** | `6694` | `6694` | **IDENTICAL** |
| **CLI compile Report Exact String Match** | `SHA256:f19a96a635a7a52cce6fa7d9046f99741075d9355ce5b3312be9dc6a79fca2d6` | `SHA256:f19a96a635a7a52cce6fa7d9046f99741075d9355ce5b3312be9dc6a79fca2d6` | **IDENTICAL** |
| **CLI counter-notice Exact String Match** | `SHA256:9d34e55e149f3c20bdede438ed0dbf0ebe2f703aa5b3ba26060f5fbece08d152` | `SHA256:9d34e55e149f3c20bdede438ed0dbf0ebe2f703aa5b3ba26060f5fbece08d152` | **IDENTICAL** |
| **Evidentiary Linter Status (Passed Checks)** | `true (9)` | `true (9)` | **IDENTICAL** |
| **Evaluated DBH (cm / inches)** | `76.2 cm / 30 in` | `76.2 cm / 30 in` | **IDENTICAL** |
| **Mattheck Sound Shell Ratio (t/R) & Stability** | `0.38 (true)` | `0.38 (true)` | **IDENTICAL** |
| **Root Zones: SRZ / CRZ / TIZ Radius (m)** | `3.28 m / 9.14 m / 13.71 m` | `3.28 m / 9.14 m / 13.71 m` | **IDENTICAL** |
| **AirSpade Decompacted Soil Volume (m3)** | `7.64 m3` | `7.64 m3` | **IDENTICAL** |
| **Amendments: Biochar (L) / Compost (m3) / Mulch (m3)** | `611 L / 1.15 m3 / 47.24 m3` | `611 L / 1.15 m3 / 47.24 m3` | **IDENTICAL** |
| **Municipal Protection Tier & Citation** | `Heritage (Austin LDC § 25-8-604 / ECM Section 3.5)` | `Heritage (Austin LDC § 25-8-604 / ECM Section 3.5)` | **IDENTICAL** |
| **Municipal Permit Verdict** | `Permit required: ATX-QV-101 Live Oak (pruning).` | `Permit required: ATX-QV-101 Live Oak (pruning).` | **IDENTICAL** |
| **Mitigation If Destroyed (Cash-in-Lieu / Inches)** | `$18000 (90 in)` | `$18000 (90 in)` | **IDENTICAL** |
| **Classical CTLA 10th Ed. Depreciated Value (USD)** | `$13699` | `$13699` | **IDENTICAL** |
| **200-Yr Holobiont Biological Equity (USD)** | `$218609 (15.96x)` | `$218609 (15.96x)` | **IDENTICAL** |
| **Legacy Removal Bid Gross / Net Margin (USD)** | `$3140 / $1005` | `$3140 / $1005` | **IDENTICAL** |
| **RAP 5-Yr Stewardship Gross / Net Margin (USD)** | `$11604 / $6382 (6.35x)` | `$11604 / $6382 (6.35x)` | **IDENTICAL** |
| **John White (FCIN12) Estimated Tree Age** | `291 yrs (factor 3.83)` | `291 yrs (factor 3.83)` | **IDENTICAL** |
| **Allometric Carbon Stored / Annual Runoff Avoided** | `3465.2 lbs / 16189 gal/yr` | `3465.2 lbs / 16189 gal/yr` | **IDENTICAL** |
| **Allometric Annual / 20-Yr Projected Benefits (USD)** | `$496.47/yr / $10724` | `$496.47/yr / $10724` | **IDENTICAL** |
| **OGC CRS84 GeoJSON Export SHA-256** | `809725b85c0ffa0626e2adc77e13b7fa156f1d059069b27147c25640a6039d12` | `809725b85c0ffa0626e2adc77e13b7fa156f1d059069b27147c25640a6039d12` | **IDENTICAL** |

## 3.2 Case 2: Georgetown Multi-Stem Heritage Pecan (27 in DBH)

- **Fixture File:** `deploy/fixtures/case-2-georgetown-pecan.json`
- **CLI Command Executed:** `node bin/openarbor-rap.mjs compile deploy/fixtures/case-2-georgetown-pecan.json --ordinance tx-georgetown`
- **CLI Economics Command:** `node bin/openarbor-rap.mjs economics deploy/fixtures/case-2-georgetown-pecan.json --json`
- **CLI Counter-Notice Command:** `node bin/openarbor-rap.mjs counter-notice deploy/fixtures/case-2-georgetown-pecan.json`
- **Browser Bundle Call:** `evaluateCompleteFieldCase(assessment, { ordinance_id: 'tx-georgetown', ... })` from `out/openarbor-bundle.js`

| Output Metric / Artifact | Local CLI (`bin/openarbor-rap.mjs` + Node Core) | Browser Bundle (`out/openarbor-bundle.js`) | Match |
| :--- | :--- | :--- | :--- |
| **RAP_v2 Canonical SHA-256 Digest** | `c458a0d5a84412f49c76a70a9beccd92a8e023e818fe84569083390422ace4de` | `c458a0d5a84412f49c76a70a9beccd92a8e023e818fe84569083390422ace4de` | **IDENTICAL** |
| **CLI compile Report Markdown Length (chars)** | `6414` | `6414` | **IDENTICAL** |
| **CLI compile Report Exact String Match** | `SHA256:429dbbc96016dbc7acd386b118e41bd62f432d974c56440ab278609b8d541cd2` | `SHA256:429dbbc96016dbc7acd386b118e41bd62f432d974c56440ab278609b8d541cd2` | **IDENTICAL** |
| **CLI counter-notice Exact String Match** | `SHA256:4e3db904cf474b4e7feb0a5f3f7eb4fe4ad87caeb5a7fc2fada430163c6fc4f8` | `SHA256:4e3db904cf474b4e7feb0a5f3f7eb4fe4ad87caeb5a7fc2fada430163c6fc4f8` | **IDENTICAL** |
| **Evidentiary Linter Status (Passed Checks)** | `true (9)` | `true (9)` | **IDENTICAL** |
| **Evaluated DBH (cm / inches)** | `68.58 cm / 27 in` | `68.58 cm / 27 in` | **IDENTICAL** |
| **Mattheck Sound Shell Ratio (t/R) & Stability** | `0.46 (true)` | `0.46 (true)` | **IDENTICAL** |
| **Root Zones: SRZ / CRZ / TIZ Radius (m)** | `3.11 m / 8.23 m / 12.34 m` | `3.11 m / 8.23 m / 12.34 m` | **IDENTICAL** |
| **AirSpade Decompacted Soil Volume (m3)** | `4.96 m3` | `4.96 m3` | **IDENTICAL** |
| **Amendments: Biochar (L) / Compost (m3) / Mulch (m3)** | `397 L / 0.74 m3 / 38.27 m3` | `397 L / 0.74 m3 / 38.27 m3` | **IDENTICAL** |
| **Municipal Protection Tier & Citation** | `Heritage (Georgetown UDC § 8.02)` | `Heritage (Georgetown UDC § 8.02)` | **IDENTICAL** |
| **Municipal Permit Verdict** | `Permit required: GTN-CI-204 Pecan (pruning).` | `Permit required: GTN-CI-204 Pecan (pruning).` | **IDENTICAL** |
| **Mitigation If Destroyed (Cash-in-Lieu / Inches)** | `$8100 (81 in)` | `$8100 (81 in)` | **IDENTICAL** |
| **Classical CTLA 10th Ed. Depreciated Value (USD)** | `$13432` | `$13432` | **IDENTICAL** |
| **200-Yr Holobiont Biological Equity (USD)** | `$124448 (9.27x)` | `$124448 (9.27x)` | **IDENTICAL** |
| **Legacy Removal Bid Gross / Net Margin (USD)** | `$2936 / $940` | `$2936 / $940` | **IDENTICAL** |
| **RAP 5-Yr Stewardship Gross / Net Margin (USD)** | `$9713 / $5342 (5.68x)` | `$9713 / $5342 (5.68x)` | **IDENTICAL** |
| **John White (FCIN12) Estimated Tree Age** | `315 yrs (factor 4.6)` | `315 yrs (factor 4.6)` | **IDENTICAL** |
| **Allometric Carbon Stored / Annual Runoff Avoided** | `2710.2 lbs / 12638 gal/yr` | `2710.2 lbs / 12638 gal/yr` | **IDENTICAL** |
| **Allometric Annual / 20-Yr Projected Benefits (USD)** | `$391.48/yr / $8456` | `$391.48/yr / $8456` | **IDENTICAL** |
| **OGC CRS84 GeoJSON Export SHA-256** | `00a3713daab55f488a1755769df5e0097335aede5a8816a822c26dc37297ed26` | `00a3713daab55f488a1755769df5e0097335aede5a8816a822c26dc37297ed26` | **IDENTICAL** |

## 3.3 Case 3: Liberty Hill Protected Post Oak (20 in DBH)

- **Fixture File:** `deploy/fixtures/case-3-liberty-hill-post-oak.json`
- **CLI Command Executed:** `node bin/openarbor-rap.mjs compile deploy/fixtures/case-3-liberty-hill-post-oak.json --ordinance tx-liberty-hill`
- **CLI Economics Command:** `node bin/openarbor-rap.mjs economics deploy/fixtures/case-3-liberty-hill-post-oak.json --json`
- **CLI Counter-Notice Command:** `node bin/openarbor-rap.mjs counter-notice deploy/fixtures/case-3-liberty-hill-post-oak.json`
- **Browser Bundle Call:** `evaluateCompleteFieldCase(assessment, { ordinance_id: 'tx-liberty-hill', ... })` from `out/openarbor-bundle.js`

| Output Metric / Artifact | Local CLI (`bin/openarbor-rap.mjs` + Node Core) | Browser Bundle (`out/openarbor-bundle.js`) | Match |
| :--- | :--- | :--- | :--- |
| **RAP_v2 Canonical SHA-256 Digest** | `a40732dc070b402f8239f0a7d9b910dfc0590ef0c413d0cdb32011e5223c9d6f` | `a40732dc070b402f8239f0a7d9b910dfc0590ef0c413d0cdb32011e5223c9d6f` | **IDENTICAL** |
| **CLI compile Report Markdown Length (chars)** | `6546` | `6546` | **IDENTICAL** |
| **CLI compile Report Exact String Match** | `SHA256:48559a60f67c5f33e8e1903f603706b5735f24c5dc5ade2ca61485b8c08df3e2` | `SHA256:48559a60f67c5f33e8e1903f603706b5735f24c5dc5ade2ca61485b8c08df3e2` | **IDENTICAL** |
| **CLI counter-notice Exact String Match** | `SHA256:32a935d5d8ce84561b11af87e4fedca2f8396eb8edba8939e3201fcde9734eef` | `SHA256:32a935d5d8ce84561b11af87e4fedca2f8396eb8edba8939e3201fcde9734eef` | **IDENTICAL** |
| **Evidentiary Linter Status (Passed Checks)** | `true (9)` | `true (9)` | **IDENTICAL** |
| **Evaluated DBH (cm / inches)** | `50.8 cm / 20 in` | `50.8 cm / 20 in` | **IDENTICAL** |
| **Mattheck Sound Shell Ratio (t/R) & Stability** | `0.32 (true)` | `0.32 (true)` | **IDENTICAL** |
| **Root Zones: SRZ / CRZ / TIZ Radius (m)** | `2.74 m / 6.1 m / 9.15 m` | `2.74 m / 6.1 m / 9.15 m` | **IDENTICAL** |
| **AirSpade Decompacted Soil Volume (m3)** | `6.02 m3` | `6.02 m3` | **IDENTICAL** |
| **Amendments: Biochar (L) / Compost (m3) / Mulch (m3)** | `482 L / 0.9 m3 / 21.04 m3` | `482 L / 0.9 m3 / 21.04 m3` | **IDENTICAL** |
| **Municipal Protection Tier & Citation** | `Protected (Liberty Hill UDC § 6.07.01(c))` | `Protected (Liberty Hill UDC § 6.07.01(c))` | **IDENTICAL** |
| **Municipal Permit Verdict** | `No permit-triggering work on protected trees.` | `No permit-triggering work on protected trees.` | **IDENTICAL** |
| **Mitigation If Destroyed (Cash-in-Lieu / Inches)** | `$4500 (40 in)` | `$4500 (40 in)` | **IDENTICAL** |
| **Classical CTLA 10th Ed. Depreciated Value (USD)** | `$5127` | `$5127` | **IDENTICAL** |
| **200-Yr Holobiont Biological Equity (USD)** | `$69172 (13.49x)` | `$69172 (13.49x)` | **IDENTICAL** |
| **Legacy Removal Bid Gross / Net Margin (USD)** | `$2460 / $787` | `$2460 / $787` | **IDENTICAL** |
| **RAP 5-Yr Stewardship Gross / Net Margin (USD)** | `$8553 / $4704 (5.98x)` | `$8553 / $4704 (5.98x)` | **IDENTICAL** |
| **John White (FCIN12) Estimated Tree Age** | `279 yrs (factor 5.5)` | `279 yrs (factor 5.5)` | **IDENTICAL** |
| **Allometric Carbon Stored / Annual Runoff Avoided** | `1346 lbs / 4853 gal/yr` | `1346 lbs / 4853 gal/yr` | **IDENTICAL** |
| **Allometric Annual / 20-Yr Projected Benefits (USD)** | `$148.97/yr / $3218` | `$148.97/yr / $3218` | **IDENTICAL** |
| **OGC CRS84 GeoJSON Export SHA-256** | `7cbc56be181c421fa95b49fa46a97b1cd8eef6c08064e46784187e9cd1c35d96` | `7cbc56be181c421fa95b49fa46a97b1cd8eef6c08064e46784187e9cd1c35d96` | **IDENTICAL** |

## 3.4 Case 4: Ashland Heritage Oregon White Oak (41.3 in DBH)

- **Fixture File:** `deploy/fixtures/case-4-ashland-oregon-white-oak.json`
- **CLI Command Executed:** `node bin/openarbor-rap.mjs compile deploy/fixtures/case-4-ashland-oregon-white-oak.json --ordinance or-ashland`
- **CLI Economics Command:** `node bin/openarbor-rap.mjs economics deploy/fixtures/case-4-ashland-oregon-white-oak.json --json`
- **CLI Counter-Notice Command:** `node bin/openarbor-rap.mjs counter-notice deploy/fixtures/case-4-ashland-oregon-white-oak.json`
- **Browser Bundle Call:** `evaluateCompleteFieldCase(assessment, { ordinance_id: 'or-ashland', ... })` from `out/openarbor-bundle.js`

| Output Metric / Artifact | Local CLI (`bin/openarbor-rap.mjs` + Node Core) | Browser Bundle (`out/openarbor-bundle.js`) | Match |
| :--- | :--- | :--- | :--- |
| **RAP_v2 Canonical SHA-256 Digest** | `e09796c9fadd669144ae4b7bbfc08e1d2cb8fa09716b9f630e2047059a92634f` | `e09796c9fadd669144ae4b7bbfc08e1d2cb8fa09716b9f630e2047059a92634f` | **IDENTICAL** |
| **CLI compile Report Markdown Length (chars)** | `6830` | `6830` | **IDENTICAL** |
| **CLI compile Report Exact String Match** | `SHA256:c8ccf66433e398d9a8b8ca27db75f2e47b3f5c507136735035ad5b27547434be` | `SHA256:c8ccf66433e398d9a8b8ca27db75f2e47b3f5c507136735035ad5b27547434be` | **IDENTICAL** |
| **CLI counter-notice Exact String Match** | `SHA256:20d94c4dd2e5d8e028e95e7537ed078e228e504137ffaa788ed025609ba6453f` | `SHA256:20d94c4dd2e5d8e028e95e7537ed078e228e504137ffaa788ed025609ba6453f` | **IDENTICAL** |
| **Evidentiary Linter Status (Passed Checks)** | `true (9)` | `true (9)` | **IDENTICAL** |
| **Evaluated DBH (cm / inches)** | `105 cm / 41.34 in` | `105 cm / 41.34 in` | **IDENTICAL** |
| **Mattheck Sound Shell Ratio (t/R) & Stability** | `0.34 (true)` | `0.34 (true)` | **IDENTICAL** |
| **Root Zones: SRZ / CRZ / TIZ Radius (m)** | `3.77 m / 12.6 m / 16.5 m` | `3.77 m / 12.6 m / 16.5 m` | **IDENTICAL** |
| **AirSpade Decompacted Soil Volume (m3)** | `10.79 m3` | `10.79 m3` | **IDENTICAL** |
| **Amendments: Biochar (L) / Compost (m3) / Mulch (m3)** | `863 L / 1.62 m3 / 68.42 m3` | `863 L / 1.62 m3 / 68.42 m3` | **IDENTICAL** |
| **Municipal Protection Tier & Citation** | `Heritage (AMC § 18.5.7.020 / AMC § 18.4.5.030)` | `Heritage (AMC § 18.5.7.020 / AMC § 18.4.5.030)` | **IDENTICAL** |
| **Municipal Permit Verdict** | `Permit required: ASH-QG-105 Oregon White Oak (pruning).` | `Permit required: ASH-QG-105 Oregon White Oak (pruning).` | **IDENTICAL** |
| **Mitigation If Destroyed (Cash-in-Lieu / Inches)** | `$6201 (82.68 in)` | `$6201 (82.68 in)` | **IDENTICAL** |
| **Classical CTLA 10th Ed. Depreciated Value (USD)** | `$23273` | `$23273` | **IDENTICAL** |
| **200-Yr Holobiont Biological Equity (USD)** | `$427039 (18.35x)` | `$427039 (18.35x)` | **IDENTICAL** |
| **Legacy Removal Bid Gross / Net Margin (USD)** | `$3911 / $1252` | `$3911 / $1252` | **IDENTICAL** |
| **RAP 5-Yr Stewardship Gross / Net Margin (USD)** | `$14942 / $8218 (6.56x)` | `$14942 / $8218 (6.56x)` | **IDENTICAL** |
| **John White (FCIN12) Estimated Tree Age** | `446 yrs (factor 4.25)` | `446 yrs (factor 4.25)` | **IDENTICAL** |
| **Allometric Carbon Stored / Annual Runoff Avoided** | `7319.8 lbs / 14479 gal/yr` | `7319.8 lbs / 14479 gal/yr` | **IDENTICAL** |
| **Allometric Annual / 20-Yr Projected Benefits (USD)** | `$448.99/yr / $9698` | `$448.99/yr / $9698` | **IDENTICAL** |
| **OGC CRS84 GeoJSON Export SHA-256** | `bf41178c7b16be659f279156377b03d1667d3b927927ae088be1455a69319ef6` | `bf41178c7b16be659f279156377b03d1667d3b927927ae088be1455a69319ef6` | **IDENTICAL** |

## 4. Findings & Engine Observations

- **Zero Engine Divergences:** All four fixed bioregional test cases (Austin, Georgetown, and Liberty Hill in Central Texas plus Ashland in Rogue Valley, Oregon) achieved 100% bit-for-bit parity across all 21 evaluated metrics (84/84 total assertions), including the canonical SHA-256 digest, compiled 10-section RAP Evidentiary Markdown report, Scientific Preservation Counter-Notice Markdown, 5-year practice economics JSON, municipal ordinance permit and cash-in-lieu mitigation math, Nowak/McPherson allometric benefits, John White (FCIN12) veteran tree age, and OGC CRS84 GeoJSON FeatureCollection output.
- **Browser Crypto Shim Note:** `src/core/rapEngine.js` imports `node:crypto` exclusively for `crypto.createHash('sha256').update(payload, 'utf8').digest('hex')` inside `computeCanonicalSha256`. By aliasing `node:crypto` to `web/crypto-shim.js` at bundle time in `web/build.mjs`, the browser bundle computes identical SHA-256 digests synchronously with zero modifications to `src/core/rapEngine.js`.
