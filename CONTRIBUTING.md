# Contributing to Open Arbor

Open Arbor is governed by ecological principles. The same rules that sustain a healthy forest govern how this codebase grows.

---

## The Prime Directive

**Accumulate, never overwrite.**

Every contribution adds to the living record of this platform. We don't delete history — we evolve it. If something is wrong, we correct it with a new commit that explains why. The git log is part of the system's memory.

---

## Module Ownership

Each module has a designated steward — a contributor who has demonstrated deep domain knowledge and consistent, reliable contributions over time. Module stewards review PRs for their module and have final say on architectural decisions within their layer.

| Module | Domain | Steward |
|--------|--------|---------|
| `modules/arbor` | Arboriculture, ISA standards, field ops | Open |
| `modules/nursery` | Native plants, propagation, restoration genetics | Open |
| `modules/forest` | Miyawaki method, afforestation, succession | Open |
| `modules/sanctuary` | Land tenure, conservation law, stewardship agreements | Open |
| `core/` | Data models, API contracts, STIM integration | @soilgrowerx |

All steward positions marked **Open** are available. See [becoming a module steward](#becoming-a-module-steward) below.

---

## How to Contribute

### 1. Find your entry point

- **Field practitioners** (arborists, nursery operators, land stewards): Your operational knowledge is the most valuable contribution. Open issues describing real workflows we're missing or getting wrong. No code required.
- **Developers**: Check open issues tagged `good-first-issue` or `module-*`. Read the architecture docs in `docs/` before writing code.
- **Researchers**: If your work touches forestry, ecology, indigenous land management, or AI alignment — open a discussion. We want your peer review.
- **Citizen scientists**: Join the [iNaturalist Arboracle Project](https://www.inaturalist.org/projects/arboracle) and tag observations. That data feeds directly into the platform.

### 2. Open an issue first

Before writing code, open an issue describing what you want to build and why. This prevents duplicate work and ensures the contribution fits the architecture. Exception: typo fixes and documentation improvements — just PR those directly.

### 3. Branch naming

```
feature/module-name/short-description
fix/module-name/what-was-broken
docs/what-you-documented
```

### 4. Commit messages

Write commit messages in the present tense, describing what the commit does — not what you did.

```
✅ Add soil pH correction workflow to arbor module
❌ Added soil pH stuff
```

### 5. Pull request checklist

- [ ] Issue linked in PR description
- [ ] Tests written for new functionality
- [ ] Documentation updated if behavior changed
- [ ] No hardcoded credentials or API keys
- [ ] STIM Protocol compliance checked (see below)

---

## STIM Protocol Compliance

All AI agent interactions built on Open Arbor must comply with the STIM Protocol. This means:

- **Accumulate, never overwrite** — agent memory appends chronologically
- **Label uncertainty** — inferred outputs are marked `HYPOTHESIS` until outcome-encoded
- **Encode outcomes** — actions without results are incomplete data
- **Earn structure** — schema changes require proven pattern evidence, not assumptions

Read the [STIM White Paper (v7.0009)](https://github.com/STIM-Protocol/white-paper/blob/master/STIM_White_Paper_v7.0009.md) before contributing to `core/` or any AI agent code.

---

## Becoming a Module Steward

Module stewardship is earned, not assigned. To become a steward:

1. Make 10+ meaningful contributions to the module over at least 60 days
2. Demonstrate domain expertise — either professional credentials or documented field experience
3. Be nominated by an existing steward or the founding maintainer
4. Accept the stewardship responsibilities: reviewing PRs within 5 business days, attending monthly community calls, maintaining the module roadmap

Stewardship is not a status. It is a responsibility.

---

## Code of Conduct

This project operates on a single principle: **respect for living systems.**

That means respect for the ecosystems we're building software to protect. It means respect for the indigenous knowledge systems that have stewarded these lands for millennia. It means respect for contributors at every experience level.

Violations of this principle — harassment, bad faith contributions, extraction without reciprocity — result in removal. No warnings for egregious violations.

---

## License

By contributing to Open Arbor, you agree that your contributions will be licensed under AGPL v3. Commercial use of Open Arbor code requires enterprise licensing through [Arboracle](https://arboracle.app).

---

*Open Arbor is built by practitioners for practitioners.*
*The forest doesn't ask for your credentials. It asks for your attention.*
