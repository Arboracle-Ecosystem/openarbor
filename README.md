<div align="center">

<img src="https://arboracle.app/logo.png" alt="Arboracle" width="64" height="64" onerror="this.style.display='none'"/>

# Open Arbor

**The open-source operating system for land stewardship.**

*One platform. Four modules. 100-year thinking.*

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![STIM Protocol](https://img.shields.io/badge/STIM-Layer_0_Aligned-2d6a4f)](https://github.com/STIM-Protocol/stim-core)
[![iNaturalist](https://img.shields.io/badge/iNaturalist-Arboracle_Project-74ac00)](https://www.inaturalist.org/projects/arboracle)
[![Platform](https://img.shields.io/badge/Platform-arboracle.app-1a1a2e)](https://arboracle.app)

</div>

---

## What Is Open Arbor?

Open Arbor is the open-source core of the Arboracle ecosystem — a community-governed platform for professional arborists, ecological stewards, land managers, and citizen scientists.

It is not a tool. It is an instrument.

The distinction matters: tools are picked up and put down. Instruments are mastered over time, and they accumulate the knowledge of everyone who has played them. Open Arbor is designed to accumulate 100 years of ecological intelligence — every tree tagged, every treatment logged, every forest planted — and make that intelligence available to the stewards who come next.

> *"We are moving from SaaS (Software as a Service) to SaaI — Software as an Instrument."*
> — George Steward, Founder

---

## Architecture: One Repo, Four Modules

Open Arbor is a single platform organized into four functional modules. They are not separate projects — they are interconnected layers of the same operating system, the same way roots, trunk, canopy, and fruit are not separate trees.

```
openarbor/
├── modules/
│   ├── arbor/        ← Professional tree inventory & business ops
│   ├── nursery/      ← Native plant supply chain & propagation
│   ├── forest/       ← Reforestation design & Miyawaki installations
│   └── sanctuary/    ← Land tenure, stewardship agreements, legal frameworks
├── core/             ← Shared data models, STIM integration, API contracts
├── docs/             ← Architecture, philosophy, roadmap
└── contrib/          ← Contribution guides, governance, community protocols
```

### Module: Arbor
**For:** Professional arborists, tree care companies, municipal foresters

The field operations layer. Tree inventory, risk assessment, treatment logging, client management, and work order generation. Every tree is tagged. Every intervention is recorded. The data outlives the arborist.

- ISA-compliant tree tagging
- AirSpade and root collar excavation workflows
- Soil analysis integration (TAMU, A&L Labs)
- Treatment tracking with outcome encoding
- Client portal and proposal generation

### Module: Nursery
**For:** Native plant nurseries, propagators, ecological restoration contractors

The supply chain layer. Tracks provenance of plant material from seed source to installation site. Closes the loop between what gets planted and where it came from — critical for restoration genetics and regulatory compliance.

- Seed source and provenance tracking
- Propagation batch management
- Native species database with regional ecotype data
- Restoration contractor procurement workflows
- iNaturalist integration for observation linkage

### Module: Forest
**For:** Landscape architects, municipalities, land stewards, Miyawaki practitioners

The reforestation design layer. From site assessment through canopy closure. Built around the Miyawaki method — dense, rapid-growth, self-sustaining native forests — but compatible with any afforestation approach.

- Site suitability analysis
- Species selection by soil type, hydrology, and regional ecotype
- Miyawaki planting design tools (Nano Forest to Legacy Forest scale)
- Long-term monitoring and succession tracking
- 100-year stewardship agreement templates

### Module: Sanctuary
**For:** Landowners, conservation stewards, impact investors, tribal land managers

The land tenure layer. Tools for long-term stewardship agreements, conservation easements, and land transition planning. Designed for people who think in generations, not quarters.

- Stewardship agreement templates (10, 50, 100-year)
- Land transition planning tools
- Conservation easement documentation
- Tribal land restoration protocols (Miyawaki + indigenous knowledge integration)
- Carbon and biodiversity credit framework support

---

## The Enterprise Layer

**[Arboracle](https://arboracle.app)** is the managed enterprise platform built on Open Arbor's open-source core. It adds:

- Hosted infrastructure (no DevOps required)
- AI agent (Bodhi) — context-aware ecological intelligence powered by the STIM Protocol
- Multi-user organization management
- WhatsApp and mobile-first field interface
- Managed data persistence and backups
- Professional onboarding and support

Community members and individual stewards use Open Arbor free. Businesses and institutions that need managed infrastructure, AI capabilities, and enterprise support use Arboracle.

This is the same model as Linux → Red Hat, WordPress → WP Engine, or Postgres → Supabase. The open-source work makes the enterprise layer trustworthy. The enterprise layer funds the open-source work.

---

## The STIM Foundation

Every module in Open Arbor is built on the **STIM Protocol** — Stasis Through Inferred Memory — a Layer 0 AI alignment framework derived from biological systems.

Seven axioms. All derived from nature:

| Axiom | Principle |
|-------|-----------|
| Interconnectedness | All system components are interdependent |
| Balance | Systems seek dynamic equilibrium |
| Sustainability | Regenerative cycles sustain long-term function |
| Adaptation | Flexibility enables survival through change |
| Diversity | Biological diversity builds systemic resilience |
| Long-Term Perspective | Ecological processes operate across centuries |
| Circularity | Natural systems minimize waste through regeneration |

STIM governs how the AI agents within Open Arbor behave. They accumulate context chronologically rather than overwriting it. They infer from history rather than hallucinating from instructions. They encode outcomes rather than just logging actions.

→ [Read the STIM White Paper (v7.0009)](https://github.com/STIM-Protocol/white-paper/blob/master/STIM_White_Paper_v7.0009.md)

---

## Who Built This

Open Arbor was founded by **George Steward** — CW2, 7th Special Forces Group (Airborne); ecological restoration practitioner; founder of [Soil Grower](https://soilgrower.com); Clay Hunt Fellow (Team Rubicon).

He started working with trees at age 12. He spent 14 years keeping communications alive for Special Forces in combat. Then he came home and found that the software available for arborists was as fragmented as the ecosystems he was trying to restore. So he built the thing that should have existed.

Open Arbor is the result of that work made public — so that every arborist, every land steward, every person who has ever planted a tree and wanted to know if it would survive, has access to the same tools.

---

## Get Involved

**Use it:** Deploy the platform for your practice, nursery, or restoration project.

**Contribute:** See [CONTRIBUTING.md](./CONTRIBUTING.md) for protocols.

**Connect:** Join the [iNaturalist Arboracle Project](https://www.inaturalist.org/projects/arboracle) to link field observations.

**Enterprise:** For managed hosting, AI integration, and organizational support → [arboracle.app](https://arboracle.app)

---

## License

AGPL v3. Open source, permanently. Commercial use requires enterprise licensing via [Arboracle](https://arboracle.app).

---

<div align="center">

*Built by Soil Grower in Central Texas.*
*Governed by the community.*
*Designed for the next 200 years.*

</div>
