# DIRECTIVE: D7 correction only, OpenArbor masterwork

From: George, by way of Hermes
To: Rocky, OpenArbor project, conversation 63a3d87e
Date: 2026-11-01
Dispatch ref: OA-D7-CORRECT-4K2M
Workspace: /home/george/Myceliate_Master/UNDERSTORY/arboracle-ecosystem/openarbor
Commit under correction: 419b63c

## 0. Accepted, do not rework

Hermes verified D1 through D6 independently. These pass and stay as they are:

- D1: permalink round-trips, identical verdict, 572 characters on case 1.
- D2: sticky bar correct at 0, 1800, and 5000 px scroll depth.
- D3: five case pages render under JavaScript disabled, with SVG and citations.
- D4: offline reload computes a full Heritage verdict from cache `openarbor-field-v2.0.0`.
- D5: Cedar Park exposes 6 unverified statutory gaps with record tier and last-verified date.
- D6: print sheet renders white at 737x806 with a signature block.

Do not touch those files except as listed below. Do not rebuild what passed.

## 1. The defect

D7 is the page whose whole argument is zero claim drift, and it drifts three ways.

**C1. The count is a hardcoded literal, and it is wrong.**
`web/generate-cases-and-methods.mjs` line 1096 embeds the string
`29/29 executable verification groups`. The suites actually print 25 PASS groups:
10 in `verify_openarbor.mjs`, 8 in `verify_mcp.mjs`, 7 in `verify_masterwork_100x.mjs`.
Derive the number from the parsed groups. A literal in a description of a measurement
is the exact failure this page exists to prevent.

**C2. Only two of three suites render.**
The page claims every group. It emits 18 group rows: 10 openarbor and 8 mcp. The 7
masterwork groups are parsed into the invariant map but never rendered as rows.
Render all three suites.

**C3. Template literals leak as visible text.**
11 unescaped `${...}` fragments appear in the served HTML, for example
`1 index + ${expectedSlugs.length} static case pages` and `${cpProv.unverified_gaps.length}`.
A visitor reads source code. Escape or interpolate every one. Zero `${` may remain in
`out/methods/index.html`.

## 2. Also fix the gate that missed it

The D7 gate in `tests/verify_masterwork_100x.mjs` passed a page that was wrong, which makes
it a checker that cannot fire. Strengthen it to assert three things against the generated
file, not against the generator's own map:

1. The number the page displays equals the number of `[PASS]` groups the three suites print,
   counted by running them.
2. The number of rendered group rows equals that same number.
3. The string `${` does not appear anywhere in the served HTML.

Then prove the gate can fail: temporarily set the claimed number one off, run the gate, show
it reporting failure, restore the file, and show it passing. Paste both outputs in the report.

## 3. Boundary

- Hermes owns git. Do not run git commands. Commit 419b63c is the baseline.
- Your files: `web/generate-cases-and-methods.mjs`, `tests/verify_masterwork_100x.mjs`, and
  the regenerated `out/methods/index.html`. Nothing else.
- Do not change D1 through D6 behavior, the engines, the data, or the schemas.
- Do not add a dependency.

## 4. Report

State the derived count, the rendered row count, the `${` count before and after, and paste
the gate failing then passing. If you believe any part of this brief is wrong, say so with
the measurement that shows it rather than silently doing something else.
