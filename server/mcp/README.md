# Open Arbor Unified MCP Server (`openarbor-mcp` v2.2.0)

Zero-dependency local Model Context Protocol (`MCP`) `stdio` server exposing Open Arbor's unified plain-language consultation entrypoint (`openarbor_consult`), 8 specialist forestry and ordinance engines, and 3 built-in Logical English Orchestration (`LEO-RAP`) prompts over a single connection.

Every client stays completely local with zero external API keys, zero built-in LLM charges, and deterministic parity between CLI harnesses, Node.js tests, and `https://openarbor.org/mcp/`.

## One-Command Connection Across 6 Agent Harnesses

Run directly from GitHub via `npx` with no manual clone or build step:

- **Claude Code:**
  ```bash
  claude mcp add openarbor -- npx -y --package=github:Arboracle-Ecosystem/openarbor openarbor-mcp
  ```
- **OpenAI Codex CLI:**
  ```bash
  codex mcp add openarbor -- npx -y --package=github:Arboracle-Ecosystem/openarbor openarbor-mcp
  ```
- **Hermes:**
  ```bash
  hermes mcp add openarbor --command npx --args -y --package=github:Arboracle-Ecosystem/openarbor openarbor-mcp
  ```
- **Cursor:** Add to `.cursor/mcp.json` (or use the one-click deeplink on `/mcp/`).
- **Claude Desktop:** Add to `claude_desktop_config.json`.
- **Antigravity & Gemini CLI:** Add to `~/.gemini/config/mcp_config.json`.

Standard `mcpServers` JSON block for Cursor, Claude Desktop, and Antigravity:

```json
{
  "mcpServers": {
    "openarbor": {
      "command": "npx",
      "args": [
        "-y",
        "--package=github:Arboracle-Ecosystem/openarbor",
        "openarbor-mcp"
      ]
    }
  }
}
```

From a local repository clone, you can also run `node bin/openarbor-mcp.mjs` or `node server/mcp/openarbor-mcp.mjs` directly (zero `npm install` needed for MCP runtime).

## Steward Agent Definition Pack (`agents/openarbor-steward/`)

Drop the open-source Steward Agent Pack files into your agent harness so the model translates raw CRZ geometry, Mattheck `t/R` safety factors, and municipal subsections accurately for homeowners, RAP practitioners, and city plan reviewers:

| File | Purpose | Download / Hosted URL |
| :--- | :--- | :--- |
| `agents/openarbor-steward/SKILL.md` | Agent Skills standard workflow and 3-audience translation rules | `https://openarbor.org/agents/openarbor-steward/SKILL.md` |
| `agents/openarbor-steward/AGENTS.md` | Workspace instruction file (`AGENTS.md` / `CLAUDE.md`) | `https://openarbor.org/agents/openarbor-steward/AGENTS.md` |
| `agents/openarbor-steward/claude-agent.md` | Dedicated Claude Code subagent (`.claude/agents/openarbor-steward.md`) | `https://openarbor.org/agents/openarbor-steward/claude-agent.md` |
| `agents/openarbor-steward/hermes-steward.yaml` | Hermes `config.yaml` MCP block and companion skill install commands | `https://openarbor.org/agents/openarbor-steward/hermes-steward.yaml` |
| `agents/openarbor-steward/README.md` | Quick harness mapping table | `https://openarbor.org/agents/openarbor-steward/README.md` |

## Exposed Tools (9)

| Tool | Role | Source Module |
| :--- | :--- | :--- |
| `openarbor_consult` | Primary unified intake orchestrating root zones, city permits, Mattheck `t/R`, AirSpade soil care, phased triage, provenance gaps, and audience guidance | `server/mcp/mcpCore.mjs` |
| `calculate_root_zone` | CRZ, TPZ (`US_1_1`, `US_1_1.5`, `US_1_18`, `Australian_AS4970`, `UK_BS5837`, `Custom`), AS 4970 SRZ, and multi-stem DBH aggregation | `src/core/rootZone.js` |
| `evaluate_ordinance` | Batch site inventory evaluation (bounded to 500 trees), permit disposition, Oak Wilt seasonal check, and replacement/cash-in-lieu mitigation | `src/core/ordinanceEngine.js` |
| `calculate_ecosystem_benefits` | Nowak carbon, Xiao rainfall interception, McPherson energy cooling, CTLA structural reference, and John White `FCIN12` veteran tree age | `src/core/ecosystemBenefits.js` |
| `rap_biomechanics` | RAP-Spec v2.0 Mattheck `t/R` safety factor, CODIT wall response, and 150 psi AirSpade radial trench amendments | `src/core/rapEngine.js` |
| `rap_lint` | Evidentiary linter rejecting un-evidenced removals when `t/R >= 0.30` and rhizosphere remediation is viable | `src/core/rapEngine.js` |
| `lookup_ordinance` | Verified open municipal ordinance lookup across Texas and Southern Oregon datasets (`data/ordinances/`) | `data/ordinances/` |
| `validate_soil_function` | Chronological `soil_function` provenance validator and vadose stormwater sponge calculator | `src/core/soilFunction.js` |
| `leo_rap_verify` | 6-slot LEO-RAP Profile 01 compiler, narrative oracle verifier, and 3-fixture negative sabotage self-audit | `src/core/leoRapEngine.js` |

## Exposed Built-In Prompts (`prompts/list`, `prompts/get`)

1. `homeowner-tree-guide`: Everyday English homeowner guidance converting trunk circumference or DBH, explaining permits, leaving `UNVERIFIED` gaps visible, and distinguishing visual hollows from verified tomography.
2. `rap-practitioner-brief`: Peer technical RAP-Spec v2.0 brief covering Layer 1 facts, Mattheck `t/R`, AirSpade prescriptions, illustrative 3-stage economics, and Year-1 STIM kill criteria.
3. `municipal-plan-review`: Plan-review compliance summary citing municipal chapters/sections, CRZ fencing radii, Oak Wilt restrictions, and missing `Threshold_And_Fee_Record` subsections.

## Verification

```bash
npm run test:mcp
```

Spawns `server/mcp/openarbor-mcp.mjs` over `stdio` and asserts JSON-RPC 2.0 `initialize` (`v2.2.0`, `capabilities.tools`, `capabilities.prompts`), `tools/list` (`9` tools), `prompts/list` (`3` prompts), `prompts/get`, `openarbor_consult` across all 3 audiences and `circumference_inches`, `Steward Agent Pack` file integrity, bounded input guards (`500` trees, `128`-char ID, `100 KB` narrative), prototype pollution immunity, and clean shutdown.
