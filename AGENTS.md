# OpenArbor Project Overlay

Scope: `ARBORETUM/Active/OpenArbor`
Domain: `product-openarbor`
Owner: George Steward (ISA Certified Arborist TX-362025A, Oak Wilt Qualified)
Canonical Repository: `https://github.com/Arboracle-Ecosystem/openarbor.git`

Global law in `GEMINI.md` applies at full strength; this overlay adds the domain rules below and removes none.

---

## 1. Domain Purpose & Philosophy

OpenArbor is the open-source, open-standards operating engine for professional arborists, consulting urban foresters, municipal review staff, and land stewards.

### Core Principles
1. **Zero Vendor Lock-In:** All calculations, models, and file exports run locally in standard ECMAScript Modules (`ESM`) with zero proprietary cloud runtime dependencies (no `@base44/sdk`, no external SaaS paywall).
2. **Deterministic & Grounded:** Every calculation traces directly to a cited industry standard or primary literature:
   - Root Zone & Protection: `ANSI A300` (Part 5 Management of Trees During Construction), `ISA BMP`, `Australian AS 4970-2009`, `UK BS 5837:2012`.
   - Structural Stability: `AS 4970` / Mattheck root flare windthrow equation.
   - Allometric Ecosystem Services: Nowak (1994), Cairns et al. (1997), Xiao et al. (2000), Nowak et al. (2006), McPherson & Simpson (1999) calibrated to ISA ~80 kWh/tree average.
   - Veteran Tree Age: John White (Forestry Commission Information Note FCIN12) site-modified growth factor model.
   - Municipal Code Compliance: Exact statutory chapter and section citations (e.g., Austin LDC § 25-8, Georgetown UDC Ch. 8, Liberty Hill UDC § 6.07.01).
3. **Open Standards First:** Native interoperability with `OGC CRS84` GeoJSON for direct import/export to QGIS, ArcGIS Field Maps, and Leaflet.
4. **Data-Driven Architecture:** All municipal rules are encoded as declarative JSON records conforming to `schemas/municipal-ordinance.schema.json`. Zero hardcoded city branches in code.

---

## 2. Directory Architecture

```text
ARBORETUM/Active/OpenArbor/
├── src/
│   ├── core/
│   │   ├── rootZone.js           # CRZ, TPZ, SRZ, Multi-Stem DBH & 1-ft Grid Union Area
│   │   ├── ordinanceEngine.js    # Data-driven municipal protection, Oak Wilt window & mitigation engine
│   │   └── ecosystemBenefits.js  # Nowak/McPherson allometrics, John White age & GeoJSON exporter
│   └── ui/                       # Optional web/field interface components
├── data/
│   └── ordinances/
│       └── central_texas_ordinances.json  # Verified open municipal rules (Austin, Georgetown, Liberty Hill, Cedar Park, Round Rock)
├── schemas/
│   └── municipal-ordinance.schema.json    # JSON Schema (Draft 2020-12) for municipal tree codes
├── tests/
│   └── verify_openarbor.mjs      # Deterministic Node.js verification test suite
├── docs/                         # Specifications, historical blueprints, and methodology docs
├── AGENTS.md                     # This file (project domain overlay)
├── package.json                  # ESM module declaration and test runner script
└── README.md                     # Canonical documentation and quick start
```

---

## 3. Authority & Modification Rules

- **Execution:** Local tests and verification (`npm test` / `node tests/verify_openarbor.mjs`) are free and encouraged before any commit.
- **Git Push:** Confirm before pushing to `Arboracle-Ecosystem/openarbor`.
- **Public Surface Quarantine:** Adhere strictly to George's privacy rules: zero family/children names, zero health claims, zero unverified assertions.
- **House Style:** Zero em dashes, zero en dashes, zero exclamation points, zero AI filler words.
