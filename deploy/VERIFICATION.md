# Open Arbor v2.0 CLI vs. Browser Bundle Parity Verification Report

- **Verification Date:** `2026-10-29`
- **Parity Verdict:** **4/4 IDENTICAL (`PASS`)**
- **Certified Engine Integrity:** Zero modifications to `src/core/*` or `data/ordinances/*`. The browser bundle (`out/openarbor-bundle.js`) imports the exact certified source modules via `esbuild`.

## 1. Static Build Artifact Inventory (`out/`)

| File Path | Size (Bytes) | Role |
| :--- | :--- | :--- |
| `out/.nojekyll` | `0` | GitHub Pages Jekyll bypass marker |
| `out/cases/ashland-oregon-white-oak/index.html` | `33256` | GitHub Pages Jekyll bypass marker |
| `out/cases/austin-heritage-live-oak/index.html` | `32744` | GitHub Pages Jekyll bypass marker |
| `out/cases/georgetown-multistem-pecan/index.html` | `32070` | GitHub Pages Jekyll bypass marker |
| `out/cases/index.html` | `29129` | GitHub Pages Jekyll bypass marker |
| `out/cases/liberty-hill-post-oak/index.html` | `32187` | GitHub Pages Jekyll bypass marker |
| `out/cases/medford-ponderosa-pine/index.html` | `32598` | GitHub Pages Jekyll bypass marker |
| `out/data/catalog/forestry-tools.json` | `22781` | Published open dataset JSON |
| `out/data/ordinances/central_texas_ordinances.json` | `10712` | Published open dataset JSON |
| `out/data/ordinances/rogue_valley_oregon_ordinances.json` | `7531` | Published open dataset JSON |
| `out/demo/index.html` | `46928` | Interactive 3-mode Open Arbor engine demo (`/demo/`) |
| `out/index.html` | `19196` | Open Arbor (`openarbor.org`) root landing and alliance portal |
| `out/mcp/index.html` | `9030` | 6-Tool MCP Server Playground & JSON-RPC 2.0 Inspector (`/mcp/`) |
| `out/methods/index.html` | `48403` | GitHub Pages Jekyll bypass marker |
| `out/openarbor-bundle.js` | `443035` | Compiled ESM browser bundle (engines + ordinances + catalog + schemas + UI) |
| `out/ordinances/index.html` | `10936` | 8-City Municipal Ordinance Commons & Schema Validator (`/ordinances/`) |
| `out/schemas/municipal-ordinance.schema.json` | `3630` | Published JSON Schema (Draft 2020-12) |
| `out/schemas/rca_assessment.schema.json` | `41996` | Published JSON Schema (Draft 2020-12) |
| `out/schemas/rca_openbadge_v3.schema.json` | `26205` | Published JSON Schema (Draft 2020-12) |
| `out/spec/index.html` | `24853` | RCA-Spec v2.0 & 200-Year Architecture Reference (`/spec/`) |
| `out/styles.css` | `28752` | Shared Sunlight Field & Canopy Dark design system stylesheet |
| `out/sw.js` | `4347` | GitHub Pages Jekyll bypass marker |
| `out/tools/index.html` | `10953` | 41-tool Open-Source Forestry & Arboriculture Workbench (`/tools/`) |

## 2. Executive Summary of 4 Fixed Bioregional Input Cases (Texas & Oregon)

| Case ID | Municipality | Species & Tag | DBH | CLI vs. Browser Bundle Parity |
| :--- | :--- | :--- | :--- | :--- |
| `case-1-austin-live-oak` | `tx-austin` | *Quercus virginiana* (`ATX-QV-101`) | 76.2 cm / 30 in | **IDENTICAL (21/21 metrics match)** |
| `case-2-georgetown-pecan` | `tx-georgetown` | *Carya illinoinensis* (`GTN-CI-204`) | 68.58 cm / 27 in | **IDENTICAL (21/21 metrics match)** |
| `case-3-liberty-hill-post-oak` | `tx-liberty-hill` | *Quercus stellata* (`LBH-QS-309`) | 50.8 cm / 20 in | **IDENTICAL (21/21 metrics match)** |
| `case-4-ashland-oregon-white-oak` | `or-ashland` | *Quercus garryana* (`ASH-QG-105`) | 105 cm / 41.34 in | **IDENTICAL (21/21 metrics match)** |

## 3.1 Case 1: Austin Heritage Live Oak (30 in DBH)

- **Fixture File:** `deploy/fixtures/case-1-austin-live-oak.json`
- **CLI Command Executed:** `node bin/openarbor-rca.mjs compile deploy/fixtures/case-1-austin-live-oak.json --ordinance tx-austin`
- **CLI Economics Command:** `node bin/openarbor-rca.mjs economics deploy/fixtures/case-1-austin-live-oak.json --json`
- **CLI Counter-Notice Command:** `node bin/openarbor-rca.mjs counter-notice deploy/fixtures/case-1-austin-live-oak.json`
- **Browser Bundle Call:** `evaluateCompleteFieldCase(assessment, { ordinance_id: 'tx-austin', ... })` from `out/openarbor-bundle.js`

| Output Metric / Artifact | Local CLI (`bin/openarbor-rca.mjs` + Node Core) | Browser Bundle (`out/openarbor-bundle.js`) | Match |
| :--- | :--- | :--- | :--- |
| **RCA_v2 Canonical SHA-256 Digest** | `035bccca002d2569205cfad3a434f4f4bbd94ea20e4eeb470b279b60ab3dac7d` | `035bccca002d2569205cfad3a434f4f4bbd94ea20e4eeb470b279b60ab3dac7d` | **IDENTICAL** |
| **CLI compile Report Markdown Length (chars)** | `6694` | `6694` | **IDENTICAL** |
| **CLI compile Report Exact String Match** | `SHA256:8d6744c81a5171e23baa45b277ab92e6bc9e065745decd3d8ba39101e9a17d39` | `SHA256:8d6744c81a5171e23baa45b277ab92e6bc9e065745decd3d8ba39101e9a17d39` | **IDENTICAL** |
| **CLI counter-notice Exact String Match** | `SHA256:78ccb5b56f0e7f3bde05c916ab63ef7a158c4330c3d47463a503b8c8640e9a35` | `SHA256:78ccb5b56f0e7f3bde05c916ab63ef7a158c4330c3d47463a503b8c8640e9a35` | **IDENTICAL** |
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
| **RCA 5-Yr Stewardship Gross / Net Margin (USD)** | `$11604 / $6382 (6.35x)` | `$11604 / $6382 (6.35x)` | **IDENTICAL** |
| **John White (FCIN12) Estimated Tree Age** | `291 yrs (factor 3.83)` | `291 yrs (factor 3.83)` | **IDENTICAL** |
| **Allometric Carbon Stored / Annual Runoff Avoided** | `3465.2 lbs / 16189 gal/yr` | `3465.2 lbs / 16189 gal/yr` | **IDENTICAL** |
| **Allometric Annual / 20-Yr Projected Benefits (USD)** | `$496.47/yr / $10724` | `$496.47/yr / $10724` | **IDENTICAL** |
| **OGC CRS84 GeoJSON Export SHA-256** | `22e6c2c3156e31caff920340a4468cb70df3b7b4eb500e3b42a0e9d40e0f9de5` | `22e6c2c3156e31caff920340a4468cb70df3b7b4eb500e3b42a0e9d40e0f9de5` | **IDENTICAL** |

## 3.2 Case 2: Georgetown Multi-Stem Heritage Pecan (27 in DBH)

- **Fixture File:** `deploy/fixtures/case-2-georgetown-pecan.json`
- **CLI Command Executed:** `node bin/openarbor-rca.mjs compile deploy/fixtures/case-2-georgetown-pecan.json --ordinance tx-georgetown`
- **CLI Economics Command:** `node bin/openarbor-rca.mjs economics deploy/fixtures/case-2-georgetown-pecan.json --json`
- **CLI Counter-Notice Command:** `node bin/openarbor-rca.mjs counter-notice deploy/fixtures/case-2-georgetown-pecan.json`
- **Browser Bundle Call:** `evaluateCompleteFieldCase(assessment, { ordinance_id: 'tx-georgetown', ... })` from `out/openarbor-bundle.js`

| Output Metric / Artifact | Local CLI (`bin/openarbor-rca.mjs` + Node Core) | Browser Bundle (`out/openarbor-bundle.js`) | Match |
| :--- | :--- | :--- | :--- |
| **RCA_v2 Canonical SHA-256 Digest** | `5e52af5dfc4ff7755ae424d0a43201cc17c0de6a4dabd34b17eda2a57763010a` | `5e52af5dfc4ff7755ae424d0a43201cc17c0de6a4dabd34b17eda2a57763010a` | **IDENTICAL** |
| **CLI compile Report Markdown Length (chars)** | `6414` | `6414` | **IDENTICAL** |
| **CLI compile Report Exact String Match** | `SHA256:fc7f5fcd7305908a720f4043d1fc5bd4efa93140fc806a9b4d643bad5c46dae3` | `SHA256:fc7f5fcd7305908a720f4043d1fc5bd4efa93140fc806a9b4d643bad5c46dae3` | **IDENTICAL** |
| **CLI counter-notice Exact String Match** | `SHA256:de607fa5c888432da547b049faffa9b37bf329a69727bde3578318c2bc368966` | `SHA256:de607fa5c888432da547b049faffa9b37bf329a69727bde3578318c2bc368966` | **IDENTICAL** |
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
| **RCA 5-Yr Stewardship Gross / Net Margin (USD)** | `$9713 / $5342 (5.68x)` | `$9713 / $5342 (5.68x)` | **IDENTICAL** |
| **John White (FCIN12) Estimated Tree Age** | `315 yrs (factor 4.6)` | `315 yrs (factor 4.6)` | **IDENTICAL** |
| **Allometric Carbon Stored / Annual Runoff Avoided** | `2710.2 lbs / 12638 gal/yr` | `2710.2 lbs / 12638 gal/yr` | **IDENTICAL** |
| **Allometric Annual / 20-Yr Projected Benefits (USD)** | `$391.48/yr / $8456` | `$391.48/yr / $8456` | **IDENTICAL** |
| **OGC CRS84 GeoJSON Export SHA-256** | `649fcb9e2853a54bec24b0d3d16b6f9d79547b4c8e3a32a1cd5b2f52e83adcf0` | `649fcb9e2853a54bec24b0d3d16b6f9d79547b4c8e3a32a1cd5b2f52e83adcf0` | **IDENTICAL** |

## 3.3 Case 3: Liberty Hill Protected Post Oak (20 in DBH)

- **Fixture File:** `deploy/fixtures/case-3-liberty-hill-post-oak.json`
- **CLI Command Executed:** `node bin/openarbor-rca.mjs compile deploy/fixtures/case-3-liberty-hill-post-oak.json --ordinance tx-liberty-hill`
- **CLI Economics Command:** `node bin/openarbor-rca.mjs economics deploy/fixtures/case-3-liberty-hill-post-oak.json --json`
- **CLI Counter-Notice Command:** `node bin/openarbor-rca.mjs counter-notice deploy/fixtures/case-3-liberty-hill-post-oak.json`
- **Browser Bundle Call:** `evaluateCompleteFieldCase(assessment, { ordinance_id: 'tx-liberty-hill', ... })` from `out/openarbor-bundle.js`

| Output Metric / Artifact | Local CLI (`bin/openarbor-rca.mjs` + Node Core) | Browser Bundle (`out/openarbor-bundle.js`) | Match |
| :--- | :--- | :--- | :--- |
| **RCA_v2 Canonical SHA-256 Digest** | `2bd6bb1783a760e3b44b99e38d3ef1adfc046e03da694fec7b004f1b05a9004b` | `2bd6bb1783a760e3b44b99e38d3ef1adfc046e03da694fec7b004f1b05a9004b` | **IDENTICAL** |
| **CLI compile Report Markdown Length (chars)** | `6546` | `6546` | **IDENTICAL** |
| **CLI compile Report Exact String Match** | `SHA256:9f1bb63053bc7f94ea60f81df15534b5a5041f62cbd4f206c02e7bcac9860067` | `SHA256:9f1bb63053bc7f94ea60f81df15534b5a5041f62cbd4f206c02e7bcac9860067` | **IDENTICAL** |
| **CLI counter-notice Exact String Match** | `SHA256:a3c4c6d781a7ec4fbf8717558f837439cb4e1d546925b01d884035220f791b4c` | `SHA256:a3c4c6d781a7ec4fbf8717558f837439cb4e1d546925b01d884035220f791b4c` | **IDENTICAL** |
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
| **RCA 5-Yr Stewardship Gross / Net Margin (USD)** | `$8553 / $4704 (5.98x)` | `$8553 / $4704 (5.98x)` | **IDENTICAL** |
| **John White (FCIN12) Estimated Tree Age** | `279 yrs (factor 5.5)` | `279 yrs (factor 5.5)` | **IDENTICAL** |
| **Allometric Carbon Stored / Annual Runoff Avoided** | `1346 lbs / 4853 gal/yr` | `1346 lbs / 4853 gal/yr` | **IDENTICAL** |
| **Allometric Annual / 20-Yr Projected Benefits (USD)** | `$148.97/yr / $3218` | `$148.97/yr / $3218` | **IDENTICAL** |
| **OGC CRS84 GeoJSON Export SHA-256** | `7d67b19a908f73102a01066fd7c8318f9829f62481921a48b1007427546ccc9e` | `7d67b19a908f73102a01066fd7c8318f9829f62481921a48b1007427546ccc9e` | **IDENTICAL** |

## 3.4 Case 4: Ashland Heritage Oregon White Oak (41.3 in DBH)

- **Fixture File:** `deploy/fixtures/case-4-ashland-oregon-white-oak.json`
- **CLI Command Executed:** `node bin/openarbor-rca.mjs compile deploy/fixtures/case-4-ashland-oregon-white-oak.json --ordinance or-ashland`
- **CLI Economics Command:** `node bin/openarbor-rca.mjs economics deploy/fixtures/case-4-ashland-oregon-white-oak.json --json`
- **CLI Counter-Notice Command:** `node bin/openarbor-rca.mjs counter-notice deploy/fixtures/case-4-ashland-oregon-white-oak.json`
- **Browser Bundle Call:** `evaluateCompleteFieldCase(assessment, { ordinance_id: 'or-ashland', ... })` from `out/openarbor-bundle.js`

| Output Metric / Artifact | Local CLI (`bin/openarbor-rca.mjs` + Node Core) | Browser Bundle (`out/openarbor-bundle.js`) | Match |
| :--- | :--- | :--- | :--- |
| **RCA_v2 Canonical SHA-256 Digest** | `c87412851e02c8a64e6976840c8cac769e6c2fe17adbaf99df856f4fc4e62345` | `c87412851e02c8a64e6976840c8cac769e6c2fe17adbaf99df856f4fc4e62345` | **IDENTICAL** |
| **CLI compile Report Markdown Length (chars)** | `6830` | `6830` | **IDENTICAL** |
| **CLI compile Report Exact String Match** | `SHA256:0f104a801e7e684a3fa5daeef154b34681c399bed5f933a11f4f7fe54fe55a83` | `SHA256:0f104a801e7e684a3fa5daeef154b34681c399bed5f933a11f4f7fe54fe55a83` | **IDENTICAL** |
| **CLI counter-notice Exact String Match** | `SHA256:de074f92116b89bc82149a3570ffb909c126f65668d623d64bb3b05413b7ba95` | `SHA256:de074f92116b89bc82149a3570ffb909c126f65668d623d64bb3b05413b7ba95` | **IDENTICAL** |
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
| **RCA 5-Yr Stewardship Gross / Net Margin (USD)** | `$14942 / $8218 (6.56x)` | `$14942 / $8218 (6.56x)` | **IDENTICAL** |
| **John White (FCIN12) Estimated Tree Age** | `446 yrs (factor 4.25)` | `446 yrs (factor 4.25)` | **IDENTICAL** |
| **Allometric Carbon Stored / Annual Runoff Avoided** | `7319.8 lbs / 14479 gal/yr` | `7319.8 lbs / 14479 gal/yr` | **IDENTICAL** |
| **Allometric Annual / 20-Yr Projected Benefits (USD)** | `$448.99/yr / $9698` | `$448.99/yr / $9698` | **IDENTICAL** |
| **OGC CRS84 GeoJSON Export SHA-256** | `4c880633459480625ea54b9047264829d8fab438a63f2813119bbe09f9a32873` | `4c880633459480625ea54b9047264829d8fab438a63f2813119bbe09f9a32873` | **IDENTICAL** |

## 4. Findings & Engine Observations

- **Zero Engine Divergences:** All four fixed bioregional test cases (Austin, Georgetown, and Liberty Hill in Central Texas plus Ashland in Rogue Valley, Oregon) achieved 100% bit-for-bit parity across all 21 evaluated metrics (84/84 total assertions), including the canonical SHA-256 digest, compiled 10-section RCA Evidentiary Markdown report, Scientific Preservation Counter-Notice Markdown, 5-year practice economics JSON, municipal ordinance permit and cash-in-lieu mitigation math, Nowak/McPherson allometric benefits, John White (FCIN12) veteran tree age, and OGC CRS84 GeoJSON FeatureCollection output.
- **Browser Crypto Shim Note:** `src/core/rcaEngine.js` imports `node:crypto` exclusively for `crypto.createHash('sha256').update(payload, 'utf8').digest('hex')` inside `computeCanonicalSha256`. By aliasing `node:crypto` to `web/crypto-shim.js` at bundle time in `web/build.mjs`, the browser bundle computes identical SHA-256 digests synchronously with zero modifications to `src/core/rcaEngine.js`.
