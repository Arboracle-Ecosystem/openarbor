# Tools directory

Every executable surface in the repository, what it does, and when to use it. If a row has no page yet, the README section it links to is the current documentation.

## Command line

| Tool | What it does | When to use it |
| --- | --- | --- |
| `bin/openarbor-rap.mjs` | Compiles an RAP-Spec v2.0 assessment into a report, a counter notice, an economics payload, or a signed attestation | Any time an assessment has to leave the file system. Four subcommands: `compile`, `counter-notice`, `economics`, `attest` |
| `scripts/validate-ordinance.mjs` | Validates every municipal record against the JSON Schema and reports its tier | Before contributing a record, and in CI on every change to `data/ordinances/` |

## Core engines

| Module | What it does | When to use it |
| --- | --- | --- |
| `src/core/rootZone.js` | CRZ, inner and quarter zones, TPZ under US 1:1, US 1:1.5, AS 4970, and BS 5837, SRZ from the Mattheck windthrow equation, multi-stem aggregation, and spatial union across GPS points | Sizing protection areas, pricing air-tilling or mulch volumes, and checking a plan against a code |
| `src/core/ordinanceEngine.js` | Reads a municipal record and evaluates each stem: protected, heritage, excepted, permit triggers, mitigation ledger | Deciding permit exposure before a design is fixed |
| `src/core/ecosystemBenefits.js` | Nowak allometrics, Xiao hydrology, pollutant removal, shade energy savings, compensatory value, and GeoJSON export | Valuation, grant applications, and council reports |
| `src/core/soilFunction.js` | Validates soil provenance and estimates vadose sponge function against NRCS parameters | When soil disturbance or compaction is the question rather than canopy |
| `src/core/rapEngine.js` | RAP-Spec v2.0 five-domain diagnostics, Mattheck t/R biomechanics, dual valuation, economics, and the CLI compilers | Structural risk calls and evidentiary reports |
| `src/core/leoRapEngine.js` | LEO-RAP Profile 01 six-slot compiler, three-stage phased triage, oracle verification, and handoff briefs | Municipal or legal review where the assessment has to survive challenge |

## Verification suites

| Suite | What it proves |
| --- | --- |
| `tests/verify_openarbor.mjs` | Ten PASS groups across root zones, ordinances, ecosystem values, schemas, and the CLI, including an evidentiary linter that blocks a lazy removal recommendation |
| `tests/verify_soil_function.mjs` | Soil provenance and GeoJSON backward parity |
| `tests/verify_mcp.mjs` | Subprocess MCP JSON-RPC round trip |
| `tests/verify_masterwork_100x.mjs` | Live build, permalinks, offline service worker, and the LEO-RAP surface |

## Build and serving

| Tool | What it does | When to use it |
| --- | --- | --- |
| `web/build.mjs` | Builds the static field portal into `out/`, including routes for cases, methods, ordinances, and MCP | Before publishing, and in CI |
| `deploy/verify-parity.mjs` | Compares the CLI bundle against the browser bundle and fails on drift | Before a release, so the portal and the CLI cannot disagree |

## Data

| Path | What it holds |
| --- | --- |
| `data/ordinances/central_texas_ordinances.json` | Five verified municipal records: Austin, Georgetown, Liberty Hill, Cedar Park, Round Rock |
| `data/ordinances/rogue_valley_oregon_ordinances.json` | Three verified municipal records: Ashland, Medford, Grants Pass |
| `schemas/municipal-ordinance.schema.json` | The contract a contributed city record must satisfy |
| `schemas/rap_assessment.schema.json` | RAP-Spec v2.0 payload schema |
| `schemas/rca_openbadge_v3.schema.json` | Open Badges 3.0 attestation schema |
| `examples/ashland_oregon_white_oak_rap_v2.json` | A complete, schema-valid reference assessment: 105 cm Quercus garryana |

## Verified today

```
  npm test                    ten PASS groups, exit 0
  npm run validate:ordinances 8 records valid, 6 Full_Rule_Record, 2 Threshold_And_Fee_Record
  compile on the example      exit 0, report with a SHA-256 digest and a passing
                              evidentiary linter
```
