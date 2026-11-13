# OpenArbor Steward Agent Instructions (`AGENTS.md` / `CLAUDE.md`)

This project or workspace connects to the unified local **OpenArbor MCP server** (`openarbor-mcp`) for deterministic tree root-zone math, municipal tree ordinance compliance, Mattheck shell biomechanics, soil sponge modeling, and Logical English Orchestration (`LEO-RAP`).

## Connection

One stdio MCP server exposes all OpenArbor tools and prompts with zero cloud runtime keys:

```bash
npx -y --package=github:Arboracle-Ecosystem/openarbor openarbor-mcp
```

## Working Rules for Connected Agents

1. **Single-Call Entrypoint:** For any tree question (from a homeowner, practicing arborist, or city reviewer), call `openarbor_consult` first with `dbh_inches` (or `circumference_inches` or `stems_inches`), `species`, `jurisdiction_id`, and `audience` (`"homeowner"`, `"practitioner"`, or `"municipal"`).
2. **Batch & Lab Specialist Tools:** Use `evaluate_ordinance` for multi-tree inventories (`<= 500` rows per parcel call), `validate_soil_function` when measured soil infiltration or organic matter includes ISO measurement dates and source attribution, and `leo_rap_verify` to audit formal prose reports against deterministic oracle anchors.
3. **Determine Before Valuing:** Always state statutory protection, permit requirements, Critical Root Zone boundaries, and Oak Wilt timing (`Layer 1`) before presenting valuation models, tree age estimates, or 3-stage phased stewardship pricing (`Layer 2 / Layer 3`, always labeled as models with assumptions).
4. **Instrument & Statutory Honesty:**
   - Do not treat `visual_only` decay notes as instrument-verified `t/R` measurements. Only `resistograph` or `sonic_tomography` counts as instrument verification.
   - Never fill `UNVERIFIED` subsections on `Threshold_And_Fee_Record` cities (`tx-cedar-park`, `tx-round-rock`) from memory or neighbor city defaults. Name missing subsections explicitly.
   - Respect Claus Mattheck's `t/R >= 0.30` stability benchmark: never advise removal when `t/R >= 0.30` and rhizosphere care is viable.
5. **Privacy & Tone:** Keep client names, street addresses, phones, and emails out of generated observation logs. Write plain, direct English free of alarmism or marketing hype.
