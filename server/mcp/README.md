# Open Arbor MCP Server (`server/mcp/`)

The Open Arbor Model Context Protocol (MCP) server exposes Open Arbor's deterministic calculation engines (`rootZone.js`, `ordinanceEngine.js`, `ecosystemBenefits.js`, and `rcaEngine.js`) and municipal ordinance records (`data/ordinances/`) over newline-delimited stdio JSON-RPC 2.0. It requires Node.js 18 or newer and zero external npm dependencies.

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
| `rca_biomechanics` | `src/core/rcaEngine.js` (`evaluateBiomechanicsAndRhizosphere`) | `assessment` (RCA assessment object conforming to `schemas/rca_assessment.schema.json`) | Mattheck `t/R` hollow-shell buckling stability rating, `SRZ`/`CRZ`/`TIZ` radii, pneumatic `AirSpade` trench volume, and biochar/compost/humate/mulch amendment quantities |
| `rca_lint` | `src/core/rcaEngine.js` (`lintRcaEvidentiaryReport`) | `assessment` (RCA assessment object conforming to `schemas/rca_assessment.schema.json`) | `valid` boolean, `errors`, `warnings`, and `passed_checks` enforcing five-domain completeness and blocking un-evidenced removals when `t/R >= 0.30` |
| `lookup_ordinance` | `data/ordinances/*.json` (`central_texas_ordinances.json`, `rogue_valley_oregon_ordinances.json`) | `jurisdiction_id` (`<= 128` chars; e.g., `tx-austin`, `tx-liberty-hill`, `or-ashland`) | Full verified ordinance record for the named municipality, or a structured error listing all available jurisdiction IDs |

### Input Size Bounds (`MAX_EVALUATE_TREES` and `MAX_JURISDICTION_ID_LENGTH`)

* **`evaluate_ordinance` Tree Array Cap (`MAX_EVALUATE_TREES = 500`):** `evaluate_ordinance` invokes `estimateRootZoneRemediation`, which calls the `1-ft` spatial grid union calculator (`unionRootZoneArea` in `src/core/rootZone.js`). To prevent an unbounded tree array from stalling the stdio MCP host process, `evaluate_ordinance` rejects `trees` arrays exceeding `500` rows with a structured tool error (`error: "MAX_TREES_EXCEEDED"`, `max_trees: 500`, `isError: true`). Typical residential and commercial subdivision submittals contain 10 to 300 trees; inventories larger than 500 stems should be evaluated in spatial parcel batches of 500 or fewer.
* **`jurisdiction_id` Length Cap (`MAX_JURISDICTION_ID_LENGTH = 128`):** Both `lookup_ordinance` and `evaluate_ordinance` reject `jurisdiction_id` strings exceeding `128` characters with `error: "JURISDICTION_ID_TOO_LONG"` (`isError: true`).

---

## Verification

Run the subprocess protocol verification suite from the repository root:

```bash
npm run test:mcp
```

The test harness spawns `node server/mcp/openarbor-mcp.mjs` as a child process, performs `initialize` and `tools/list` (verifying all 6 tools), verifies known-answer calls across the engines, and checks negative-path error handling (`UNKNOWN_JURISDICTION` on `lookup_ordinance`).
