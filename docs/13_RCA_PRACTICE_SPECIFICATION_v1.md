# Legacy Pointer: RCA Practice Specification Moved to `RAP-Spec v2.0`

**Status:** Superseded Redirect Document

Open Arbor retired the internal protocol label `"Regenerative Consulting Arborist (RCA)"` to avoid colliding with the `ASCA` `RCA` (`ASCA_Registered_Consulting_Arborist`) credential. In Open Arbor documentation and tooling, `RCA` refers strictly to `ASCA` Registered Consulting Arborist.

The canonical practice specification now lives at [docs/13_RAP_PRACTICE_SPECIFICATION_v1.md](./13_RAP_PRACTICE_SPECIFICATION_v1.md):

- **Protocol:** Regenerative Arboriculture Protocol (`RAP`, `RAP-Spec v2.0`, schema version `RAP_v2`)
- **Practitioner Designation:** Regenerative Arboriculture Protocol Practitioner in Ecological Restoration (`RAPPER`)
- **Schemas (`CC0-1.0`):** `schemas/rap_assessment.schema.json`, `schemas/rap_openbadge_v3.schema.json`, `schemas/rap_field_observation.schema.json`
- **Core Modules (`AGPL-3.0-only`):** `src/core/rapEngine.js`, `src/core/leoRapEngine.js`, `src/core/fieldObservationLog.js`
- **CLI entrypoint:** `bin/openarbor-rap.mjs`

Legacy shims remain active at `src/core/rcaEngine.js`, `src/core/leoRcaEngine.js`, `bin/openarbor-rca.mjs`, `schemas/rca_assessment.schema.json`, and `schemas/rca_openbadge_v3.schema.json`, and the JSON/permalink envelope key `.rca` is preserved for `#oa1=` state links and CLI and browser parity.
