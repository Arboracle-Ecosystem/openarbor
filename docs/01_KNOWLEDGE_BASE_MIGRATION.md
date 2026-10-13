# OpenArbor Knowledge Base & Architecture Migration Digest

**Date:** 2026-10-13  
**Project:** OpenArbor (v2.0)  
**Location:** `ARBORETUM/Active/OpenArbor`  
**Upstream Source Repository:** `https://github.com/Arboracle-Ecosystem/arboracle.git` (commit `34e6907`)  
**Canonical Project Repository:** `https://github.com/Arboracle-Ecosystem/openarbor.git`  
**Lead Maintainer:** George Steward (ISA Certified Arborist `TX-362025A`, Oak Wilt Qualified)

---

## 1. Migration Background & Rationale

The Arboracle platform (`arboracle.app`) was originally developed on the proprietary Base44 application runtime (`@base44/sdk`). Over months of feature development, it accumulated substantial business and CRM overhead (145 React pages, 174 Deno serverless functions, Stripe billing, customer portals, timeclocks) alongside genuine arboricultural, municipal compliance, and ecological calculation engines.

In October 2026, George directed the extraction of the core intellectual property and field engines out of the Base44 walled garden into **OpenArbor v2.0**: a zero-dependency, open-standards library and dataset under the AGPL-3.0 license.

---

## 2. Core Mathematical & Ecological Engines (`src/core/`)

### A. Root Zone & Tree Protection Engine (`src/core/rootZone.js`)
* **Critical Root Zone (`CRZ`):**
  - Standard calculation: `radius_feet = max(min_radius_feet, dbh_inches * multiplier)`. Default is `1.0 ft` of radial protection per inch of trunk DBH.
  - Multi-tier outputs: Full CRZ, Half CRZ (`1/2 CRZ`, the inner critical root flare zone where trenching or compaction causes severe vascular root severance), and Quarter CRZ (`1/4 CRZ`).
  - Units: Imperial (`feet`, `sq ft`) and Metric (`meters`, `sq m`).
* **Tree Protection Zone (`TPZ` Standards):**
  - `US_1_1`: `1.0 ft / in DBH`.
  - `US_1_1.5`: `1.5 ft / in DBH` (standard for sensitive, mature, or declining species).
  - `US_1_18`: `18 in / in DBH` (used in specific municipal construction specifications).
  - `Australian_AS4970`: `12 * (dbh_cm / 100)`, clamped between `2.0 m` and `15.0 m`.
  - `UK_BS5837`: `12 * (dbh_cm / 100)`, capped at `15.0 m`.
* **Structural Root Zone (`SRZ`):**
  - Mattheck / AS 4970 windthrow anchorage calculation: `radius_meters = (diameter_meters * 50)^0.42 * 0.64`.
  - Uses Root Flare Diameter (`DRF`) or fallback `DBH * 1.1`.
* **Multi-Stem DBH Aggregation:**
  - `quadratic`: `sqrt(sum(d_i^2))` (standard ISA / CTLA formula representing combined cross-sectional trunk area).
  - `largest_plus_half`: `d_largest + 0.5 * sum(d_remaining)` (used in municipal codes such as Liberty Hill UDC and Austin LDC).
* **Spatial Root Zone Union Area (`unionRootZoneArea`):**
  - Employs `1-ft` grid cell sampling across GPS coordinates.
  - Corrects for overlapping root zones in multi-tree stands so that soil amendments, mulch, and pneumatic air-tilling volumes are calculated on true surface footprint rather than double-billed.

### B. Municipal Tree Ordinance & Mitigation Engine (`src/core/ordinanceEngine.js`)
* **Declarative Municipal Model:**
  - Encoded in `data/ordinances/central_texas_ordinances.json` adhering to `schemas/municipal-ordinance.schema.json`.
  - Jurisdictions currently loaded: Austin, Georgetown, Liberty Hill, Cedar Park, Round Rock.
* **Tiered Protection & Exemption Rules:**
  - Evaluates stems against general `dbh_threshold_inches` and species-specific `heritage_species_thresholds`.
  - Filters out `excepted_species` (such as invasive *Melia azedarach*, *Ligustrum lucidum*, *Triadica sebifera*, and nuisance *Celtis occidentalis*).
* **Construction Disturbance & Encroachment Flags:**
  - Flags trees when CRZ disturbance exceeds municipal removal thresholds (e.g., `> 30%` in Liberty Hill, `> 50%` in Austin).
  - Flags cut/fill exceeding `4 inches` within `1/2 CRZ`.
  - Flags impervious cover violations and crown pruning exceeding `25%`.
  - Detects Oak Wilt risk when pruning *Quercus* during restricted beetle vector windows (e.g., Feb 1 to June 30 in Austin/Georgetown, Feb to Sep in Liberty Hill).
* **Ascending Whole-Tree Mitigation Exemption:**
  - Implements the strict whole-tree ascending diameter walk (e.g., Liberty Hill `20%` cap on total protected inches).
  - Compares against partial-inch and site-wide smallest-tree interpretations.
  - Accounts for retained hardwood credits, replanting replacement ratios, cash-in-lieu fee tiers, and unpermitted removal double-fee penalties.
* **Vector SVG Site Map Generator (`renderSiteMapSVG`):**
  - Zero-dependency generator producing to-scale site sketches with retained trees (solid green), proposed removals (dashed red), tag labels, a `20-ft` scale bar, and North orientation.

### C. Allometric Benefits & Age Engine (`src/core/ecosystemBenefits.js`)
* **Dry Biomass & Carbon Accounting:** Nowak (1994) generalized urban hardwood equations with Cairns et al. (1997) root-to-shoot ratios (`28%` below-ground biomass).
* **Stormwater Hydrology:** Xiao et al. (2000) rainfall canopy interception and avoided runoff modeling.
* **Dry Deposition Air Pollution:** Nowak et al. (2006) deposition velocities across `O3`, `NO2`, `SO2`, `PM2.5`, and `CO`.
* **Building Energy Reduction:** McPherson & Simpson (1999) shade cooling, calibrated to ISA `~80 kWh/tree` baseline.
* **Veteran Tree Age:** John White (Forestry Commission Information Note FCIN12) site-modified growth factor model.
* **OGC GeoJSON Adapter:** `toGeoJSONFeatureCollection` exporting `CRS84` point layers with full attributes for QGIS and ArcGIS.

---

## 3. Verification & Test Execution

Run the deterministic test suite at any time:

```bash
cd /home/george/Myceliate_Master/ARBORETUM/Active/OpenArbor
npm test
```
