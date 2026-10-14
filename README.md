# OpenArbor

**Open-Standards Arboricultural Field Assessment, Root Zone Protection (`ANSI A300` / `ISA BMP`), Allometric Ecosystem Valuation, and Municipal Tree Ordinance Engine**

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Standards: ANSI A300 / ISA BMP](https://img.shields.io/badge/Standards-ANSI_A300_%7C_ISA_BMP-2d6a4f)](#architecture--open-standards-modules)
[![GeoJSON: OGC CRS84](https://img.shields.io/badge/GeoJSON-OGC_CRS84-74ac00)](#architecture--open-standards-modules)

---

## Overview

Proprietary arboriculture and urban forestry software often locks field observations, municipal tree protection rules, and preservation plans inside closed cloud databases. When a practitioner, municipal forester, or researcher cannot inspect the underlying allometric equations, verify statutory ordinance citations, or export standard `GeoJSON` directly into `QGIS` or `ArcGIS Field Maps`, the software becomes a barrier rather than an instrument.

**OpenArbor** (`v2.0`) refactors the core deterministic engines developed for the Arboracle platform into a zero-dependency, local-first open-standards library and dataset. Every calculation traces to a published arboricultural standard (`ANSI A300`, `ISA BMP`, `AS 4970`, `BS 5837`), peer-reviewed urban forestry literature (`Nowak`, `McPherson & Simpson`, `Xiao`, `John White FCIN12`), or a cited municipal code section.

---

## Architecture & Open-Standards Modules

```text
openarbor/
├── src/
│   └── core/
│       ├── rootZone.js             # CRZ, TPZ (US / AS4970 / BS5837), SRZ, Multi-Stem DBH & 1-ft Grid Union Area
│       ├── ordinanceEngine.js      # Data-driven municipal tree protection, Oak Wilt window & mitigation calculator
│       └── ecosystemBenefits.js    # Nowak/McPherson allometrics, John White veteran tree age & OGC GeoJSON exporter
├── data/
│   └── ordinances/
│       └── central_texas_ordinances.json  # Verified open ordinance rules (Austin, Georgetown, Liberty Hill, Cedar Park, Round Rock)
├── schemas/
│   └── municipal-ordinance.schema.json    # JSON Schema (Draft 2020-12) for community-contributed municipal tree codes
├── tests/
│   └── verify_openarbor.mjs        # Deterministic zero-dependency Node.js verification suite
└── docs/                           # Architectural blueprints and historical design notes
```

### 1. Root Zone & Structural Stability Engine (`src/core/rootZone.js`)
* **Critical Root Zone (`CRZ`) & Inner/Quarter Root Zones:** Computes full, half (`1/2 CRZ`), and quarter (`1/4 CRZ`) radii and areas in both imperial (`ft`, `sq ft`) and metric (`m`, `sq m`) units, honoring municipal minimum radius floors.
* **International Tree Protection Zone (`TPZ`) Standards:** Supports `US 1:1` (`1.0 ft/in DBH`), `US 1:1.5` (`1.5 ft/in DBH` for mature/sensitive species), `Australian AS 4970` (`12x DBH`, clamped `2m to 15m`), and `UK BS 5837:2012`.
* **Structural Root Zone (`SRZ`):** Implements the `AS 4970` / Mattheck windthrow stability equation `(D * 50)^0.42 * 0.64` from Root Flare Diameter (`DRF`).
* **Multi-Stem DBH Aggregation:** Supports both ISA/CTLA quadratic mean (`sqrt(d1^2 + d2^2 + ...)`) and municipal largest-stem-plus-half formulas (`d_max + 0.5 * sum(d_rest)`).
* **Spatial Root Zone Union (`unionRootZoneArea`):** Uses `1-ft` spatial grid sampling across GPS coordinates so overlapping root zones in dense groves are never double-counted when calculating pneumatic air-tilling (`AirSpade`), compost, or mulch volumes.

### 2. Data-Driven Municipal Ordinance & Mitigation Engine (`src/core/ordinanceEngine.js`)
Rather than hardcoding city logic in application code, OpenArbor reads declarative JSON records conforming to [`schemas/municipal-ordinance.schema.json`](schemas/municipal-ordinance.schema.json):
* **Tiered Protection & Species Exceptions:** Evaluates each stem against general and species-specific `Protected`, `Legacy`, and `Heritage` DBH thresholds while automatically excluding listed invasive or nuisance species (such as *Celtis occidentalis*, *Melia azedarach*, *Triadica sebifera*).
* **CRZ Encroachment & Seasonal Oak Wilt Guards:** Flags trees when construction disturbance exceeds municipal CRZ limits (e.g., `> 30%` in Liberty Hill or `> 50%` in Austin/Georgetown), cut/fill exceeds `4 inches` inside `1/2 CRZ`, or *Quercus* pruning is scheduled during prohibited *Ceratocystis fagacearum* (Oak Wilt) vector months.
* **Ascending Diameter Exemption & Mitigation Ledger:** Implements whole-tree ascending diameter exemption caps (such as Liberty Hill UDC `§ 6.07.01(c)(5)(B)` `20%` cap), retained hardwood credits, replacement caliper inches, cash-in-lieu schedules, and unpermitted removal civil penalty disclosures.

### 3. Allometric Ecosystem Benefits, Veteran Tree Age & GeoJSON Exporter (`src/core/ecosystemBenefits.js`)
* **Biomass & Carbon Accounting:** Generalized urban hardwood allometric equations (`Nowak 1994`, `Cairns et al. 1997`) computing above-ground and below-ground dry biomass, stored carbon (`lbs`), and annual growth sequestration.
* **Hydrology, Air Quality & Shade Energy:** Canopy rainfall interception and avoided stormwater runoff (`Xiao et al. 2000`), dry deposition removal of `O3`, `NO2`, `SO2`, `PM2.5`, and `CO` (`Nowak et al. 2006`), building shade cooling savings (`McPherson & Simpson 1999`, calibrated to ISA `~80 kWh/tree` baseline), and `CTLA` compensatory structural value.
* **Veteran Tree Age Estimation:** Implements the `John White (FCIN12)` site-modified growth factor model across parkland, woodland, and urban street environments.
* **OGC `GeoJSON` Export:** Converts evaluated inventories directly into `urn:ogc:def:crs:OGC:1.3:CRS84` `FeatureCollection` payloads ready for `QGIS`, `ArcGIS`, or `Leaflet`.

---

## Quick Start & Verification

OpenArbor's core library uses standard ECMAScript Modules (`ESM`) with **zero external npm dependencies** required at runtime.

```bash
# Run the deterministic verification suite (Node.js >= 18)
npm test
```

### Example Usage

```javascript
import fs from 'node:fs';
import { evaluateTreeInventory, computeMitigationPlan, estimateRootZoneRemediation } from './src/core/ordinanceEngine.js';
import { toGeoJSONFeatureCollection } from './src/core/ecosystemBenefits.js';

const ordinances = JSON.parse(fs.readFileSync('./data/ordinances/central_texas_ordinances.json', 'utf8'));
const libertyHill = ordinances.municipalities.find((m) => m.id === 'tx-liberty-hill');

const stand = [
  { tag: 'T-101', species_common: 'Live Oak', species_scientific: 'Quercus virginiana', stems_inches: [26], lat: 30.6653, lng: -97.9250, removal: false },
  { tag: 'T-102', species_common: 'Cedar Elm', species_scientific: 'Ulmus crassifolia', stems_inches: [9], lat: 30.6654, lng: -97.9251, removal: true },
  { tag: 'T-103', species_common: 'Post Oak', species_scientific: 'Quercus stellata', stems_inches: [15], lat: 30.6655, lng: -97.9252, removal: true }
];

const evaluated = evaluateTreeInventory(stand, libertyHill);
const mitigation = computeMitigationPlan(evaluated, libertyHill);
const remediation = estimateRootZoneRemediation(evaluated);
const geojson = toGeoJSONFeatureCollection(evaluated, { municipality: 'Liberty Hill, TX' });
```

---

## Maintainer

**George Steward**  
ISA Certified Arborist (`TX-362025A`, Oak Wilt Qualified) | Founder, [Soil Grower](https://soilgrower.com)  
Master of Natural Resources (`MNR`) Candidate in Forests and Climate Change, Oregon State University  
Practice: [soilgrower.com](https://soilgrower.com)
