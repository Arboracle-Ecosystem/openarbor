# Quickstart

Five minutes, no dependencies beyond Node.

## Check the toolchain

```bash
node --version
```

Node 18 or newer. Nothing else to install. `package.json` declares no runtime dependencies, and that is deliberate.

## Get the code

```bash
git clone https://github.com/Arboracle-Ecosystem/openarbor.git
cd openarbor
```

## Prove it works before you trust it

```bash
npm test
```

The core suite runs the deterministic engines and prints PASS groups for root zones, the ordinance engine, ecosystem values, and the RAP payload. A clean run ends with every group passing and exit code 0.

Two more suites, each proving a separate surface:

```bash
npm run test:soil     # soil provenance and GeoJSON backward parity
npm run test:mcp      # subprocess MCP JSON-RPC round trip
```

## Check the municipal dataset

```bash
npm run validate:ordinances
```

Expected shape:

```
  [PASS] or-ashland (Ashland, OR) [Full_Rule_Record]
  Summary: 8 municipality records validated. Status: VALID
```

## Compile an assessment

The repository ships a complete, schema-valid reference payload: a 105 cm Oregon white oak in Ashland.

```bash
node bin/openarbor-rap.mjs compile examples/ashland_oregon_white_oak_rap_v2.json --ordinance or-ashland
```

Four commands are available:

```
  compile <assessment.json> [--ordinance <id>] [--out <report.md>]
  counter-notice <assessment.json> [--out <notice.md>]
  economics <assessment.json> [--json]
  attest <practitioner.json> <r1.json> <r2.json> <r3.json> [--out <badge.json>]
```

`compile` produces the assessment report. `counter-notice` produces the response to a municipal notice. `economics` prints the valuation in JSON for downstream use. `attest` issues an Open Badges 3.0 attestation from three independent assessments.

## Get the data into your GIS

The ecosystem module exports GeoJSON in OGC CRS84. Open the output file directly in QGIS, or import it into ArcGIS Field Maps. No conversion step and no extension required.

## Where to go next

```
  the field method          docs/13_RAP_PRACTICE_SPECIFICATION_v1.md
  your city's code          docs/CONTRIBUTING_ORDINANCES.md
  every tool and its job    docs/TOOLS_DIRECTORY.md
  what the numbers mean     docs/START_WHAT_OPEN_ARBOR_IS.md
```
