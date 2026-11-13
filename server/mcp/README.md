# Open Arbor MCP Server (`server/mcp/`)

The Open Arbor Model Context Protocol (MCP) server (`v2.1.0`) exposes Open Arbor's deterministic calculation engines (`rootZone.js`, `ordinanceEngine.js`, `ecosystemBenefits.js`, `soilFunction.js`, `rapEngine.js`, and `leoRapEngine.js`) and municipal ordinance records (`data/ordinances/`) over newline-delimited stdio JSON-RPC 2.0. It requires Node.js 18 or newer and zero external npm dependencies.

---

## Registration

### 1. Claude Desktop (`claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "openarbor": {
      "command": "node",
      "args": [
        "/home/george/Myceliate_Master/UNDERSTORY/arboracle-ecosystem/openarbor/server/mcp/openarbor-mcp.mjs"
      ]
    }
  }
}
```

### 2. Hermes Agent (`~/.hermes/config.yaml`)

```yaml
mcp_servers:
  openarbor:
    command: node
    args:
      - /home/george/Myceliate_Master/UNDERSTORY/arboracle-ecosystem/openarbor/server/mcp/openarbor-mcp.mjs
```

---

## Exposed Deterministic Tools

| Tool Name | Underlying Module & Functions | Input Summary | Output Summary |
| :--- | :--- | :--- | :--- |
| `calculate_root_zone` | `src/core/rootZone.js` (`calculateCRZ`, `calculateTPZ`, `calculateSRZ`, `calculateMultiStemDBH`) | `dbh`, `unit` (`inches` or `cm`), `standard` (`US_1_1`, `US_1_1.5`, `US_1_18`, `Australian_AS4970`, `UK_BS5837`, `Custom`), `multiplier`, `min_radius_feet`, `drf_inches` | `radius_feet`, `radius_meters`, `area_sqft`, `area_sqm`, `formula_used`, plus full `crz`, `tpz`, and `srz` blocks |
| `evaluate_ordinance` | `src/core/ordinanceEngine.js` (`evaluateTreeInventory`, `permitDetermination`, `computeMitigationPlan`, `estimateRootZoneRemediation`) | `trees` (array of tree rows, bounded at `<= 500` rows per call), `jurisdiction_id` (`<= 128` chars, or inline `ordinance` object) | `evaluated_trees` (protected/heritage flags, CRZ disturbance, Oak Wilt flags), `permit_determination`, `permit_summary`, `mitigation_plan`, `remediation_estimate` |
| `calculate_ecosystem_benefits` | `src/core/ecosystemBenefits.js` (`calculateTreeEcosystemBenefits`, `estimateTreeAge`) | `dbh_inches`, `species`, `condition`, `land_use`, `height_feet`, `canopy_spread_feet`, `annual_rainfall_inches`, `projection_years` | Carbon storage and annual sequestration, stormwater runoff avoided, dry deposition air pollution removal, shade cooling (`kWh`), CTLA structural value, and John White (FCIN12) `age_estimate` |
| `rap_biomechanics` | `src/core/rapEngine.js` (`evaluateBiomechanicsAndRhizosphere`; alias `rca_biomechanics`) | `assessment` (RAP assessment object conforming to `schemas/rap_assessment.schema.json`) | Mattheck `t/R` hollow-shell buckling stability rating, `SRZ`/`CRZ`/`TIZ` radii, pneumatic `AirSpade` trench volume, and biochar/compost/humate/mulch amendment quantities |
| `rap_lint` | `src/core/rapEngine.js` (`lintRapEvidentiaryReport`; alias `rca_lint`) | `assessment` (RAP assessment object conforming to `schemas/rap_assessment.schema.json`) | `valid` boolean, `errors`, `warnings`, and `passed_checks` enforcing five-domain completeness and blocking un-evidenced removals when `t/R >= 0.30` |
| `lookup_ordinance` | `data/ordinances/*.json` (`central_texas_ordinances.json`, `rogue_valley_oregon_ordinances.json`) | `jurisdiction_id` (`<= 128` chars; e.g., `tx-austin`, `tx-liberty-hill`, `or-ashland`) | Full verified ordinance record for the named municipality, or a structured error listing all available jurisdiction IDs |
| `validate_soil_function` | `src/core/soilFunction.js` (`validateSoilFunction`, `estimateSoilSpongeCapacity`) | Optional `soil_function` provenance block, `tiz_area_m2`, `infiltration_mm_hr`, `organic_matter_percent` | Validated `soil_function` record (or `null` when omitted) plus 1-inch storm capture and NRCS SOM water-holding sponge gallons |
| `leo_rap_verify` | `src/core/leoRapEngine.js` (`compileLeoRapBrief`, `verifyLeoRapNarrative`, `runLeoRapSelfAudit`; alias `leo_rca_verify`) | `assessment`, optional `markdown_narrative` (`<= 100,000` chars), optional `jurisdiction_id` (`<= 128` chars), `run_self_audit` | 6-slot compiled `LEO-RAP` brief, 3-stage phased triage, inline `[[oracle:key=value]]` verification status, and 3-fixture negative sabotage self-audit |

### Input Size Bounds (`MAX_EVALUATE_TREES`, `MAX_JURISDICTION_ID_LENGTH`, and `MAX_NARRATIVE_LENGTH`)

* **`evaluate_ordinance` Tree Array Cap (`MAX_EVALUATE_TREES = 500`):** `evaluate_ordinance` invokes `estimateRootZoneRemediation`, which calls the `1-ft` spatial grid union calculator (`unionRootZoneArea` in `src/core/rootZone.js`). To prevent an unbounded tree array from stalling the stdio MCP host process, `evaluate_ordinance` rejects `trees` arrays exceeding `500` rows with a structured tool error (`error: "MAX_TREES_EXCEEDED"`, `max_trees: 500`, `isError: true`). Typical residential and commercial subdivision submittals contain 10 to 300 trees; inventories larger than 500 stems should be evaluated in spatial parcel batches of 500 or fewer.
* **`jurisdiction_id` Length Cap (`MAX_JURISDICTION_ID_LENGTH = 128`):** `lookup_ordinance`, `evaluate_ordinance`, and `leo_rap_verify` reject `jurisdiction_id` strings exceeding `128` characters with `error: "JURISDICTION_ID_TOO_LONG"` (`isError: true`).
* **`markdown_narrative` Length Cap (`MAX_NARRATIVE_LENGTH = 100000`):** `leo_rap_verify` rejects narrative strings exceeding `100,000` characters with `error: "MAX_NARRATIVE_LENGTH_EXCEEDED"` (`isError: true`).

---

## Verification

Run the subprocess protocol verification suite from the repository root:

```bash
npm run test:mcp
```

The test harness spawns `node server/mcp/openarbor-mcp.mjs` as a child process, performs `initialize` and `tools/list` (verifying all 8 tools), verifies known-answer calls across the engines, and checks negative-path error handling (`UNKNOWN_JURISDICTION`, missing soil provenance source, and Mattheck `t/R` anti-liquidation narrative sabotage).
