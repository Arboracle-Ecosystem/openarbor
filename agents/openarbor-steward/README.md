# OpenArbor Steward Agent Pack (`agents/openarbor-steward/`)

Connect any coding or research agent to OpenArbor's single zero-dependency MCP server (`openarbor-mcp`) and equip it with Logical English Orchestration (`LEO-RAP`) instructions so homeowners, arborists, and municipal staff receive clear, accurate answers.

## Files in This Pack

| File | Purpose | Target Harness Location |
| :--- | :--- | :--- |
| `SKILL.md` | Agent Skills standard workflow & LEO-RAP translation rules | `~/.hermes/skills/openarbor-steward/SKILL.md`, `.claude/skills/openarbor-steward/SKILL.md`, `.agents/skills/openarbor-steward/SKILL.md`, `~/.gemini/config/skills/openarbor-steward/SKILL.md` |
| `AGENTS.md` | Drop-in workspace instruction file | `AGENTS.md` or `CLAUDE.md` at your project root (Codex, Claude Code, Cursor, Antigravity) |
| `claude-agent.md` | Ready-to-use Claude Code subagent definition | `.claude/agents/openarbor-steward.md` |
| `hermes-steward.yaml` | Hermes `config.yaml` MCP snippet & skill setup | `~/.hermes/config.yaml` |

## One-Command Harness Connections (Zero Repo Clone Needed)

- **Claude Code:**
  `claude mcp add openarbor -- npx -y --package=github:Arboracle-Ecosystem/openarbor openarbor-mcp`
- **OpenAI Codex CLI:**
  `codex mcp add openarbor -- npx -y --package=github:Arboracle-Ecosystem/openarbor openarbor-mcp`
- **Hermes:**
  `hermes mcp add openarbor --command npx --args -y --package=github:Arboracle-Ecosystem/openarbor openarbor-mcp`
- **Cursor / Claude Desktop / Antigravity:**
  Register command `npx` with args `["-y", "--package=github:Arboracle-Ecosystem/openarbor", "openarbor-mcp"]` inside `.cursor/mcp.json`, `claude_desktop_config.json`, or `~/.gemini/config/mcp_config.json`.
