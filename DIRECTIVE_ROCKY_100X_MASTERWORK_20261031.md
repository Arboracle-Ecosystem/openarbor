# DIRECTIVE 100X: OpenArbor Masterwork

From: George, by way of Hermes
To: Rocky, OpenArbor project, conversation 63a3d87e
Date: 2026-10-31
Dispatch ref: OA-100X-7F3K
Workspace: /home/george/Myceliate_Master/UNDERSTORY/arboracle-ecosystem/openarbor

## 0. Boundary, read before anything else

- **Hermes owns git.** Do not run `git add`, `git commit`, `git push`, `git checkout`, or
  `git stash`. Hermes is committing and deploying the current v2 baseline while you work.
  If `git status` shows modified files in `web/` or `out/` that you did not touch, they are
  that baseline. Do not revert them.
- **This repo only.** `ARBORETUM/Active/OpenArbor` is a stale clone at an older commit. Do
  not read from it or write to it. All paths below are relative to the workspace above.
- **Do not touch:** `src/core/**` (engines are frozen and passing), `data/ordinances/**`
  (validated records), `schemas/**`, `tests/verify_*.mjs` except to add new cases in a new
  file. If an engine must change, stop and report it as a handoff item.
- **Your files:** `web/**`, `out/**` via the build only, `deploy/**`, and any new
  `web/cases/**`, `web/methods/**`, `web/sw.js`.

## 1. The charge

George watched a video where Emad Mostaque said the difference between humans and AI is
conviction. This project is the answer to that: not a claim of conviction, but evidence of it,
shipped.

Build the version of OpenArbor that makes a working arborist stop scrolling and say he has
needed this for twenty years. Make a municipal forester trust it enough to cite it in a hearing.
Make a technical reviewer open the network tab and find a deterministic engine with no vendor
behind it.

Go bold. Be creative. Think on the 200 year horizon, because the data model you extend now is
the one someone reads in 2226. Be methodical and thorough, because poetry without receipts is
just noise. Build beyond current wisdom, but of it. Every number must be traceable to a code
section. Every screen must be falsifiable by an expert in under a minute.

You have permission to be excellent. You do not have permission to be vague.

## 2. The measured baseline, so you do not rebuild what exists

Verified in this session, not estimated:

- 4 existing routes: `/` landing, `/demo/` field engine, `/tools/` 41 tool workbench,
  `/mcp/` simulator, plus `/ordinances/` and `/spec/`.
- 10 of 10 core verification groups pass. 8 of 8 MCP and validator security checks pass.
  8 municipality records validate (6 full rule records, 2 threshold and fee records).
  Parity 4 of 4 identical, 84 of 84 metrics.
- Bundle 405,229 bytes. Page heights: landing 3,502 px, demo 9,669 px, tools 16,564 px.
- The demo already does: presets for Central Texas and Rogue Valley, ordinance lookup, DBH
  provenance, A300 root zone, oak wilt window, mitigation tiers and exemption walk, allometric
  valuation, GeoJSON export, ASCA linter, counter-notice.

That is a strong tool. It is not yet a masterwork, for one measurable reason: a 9,669 px page
answers a question the user cannot keep in view, and the answer cannot leave the page.

## 3. The central design problem, and the insight that resolves it

**The problem.** A field determination is a small object produced by a large page. Everything
valuable is at the bottom of a long scroll, and none of it survives leaving the browser. So the
tool is impressive in a demo and useless in a dispute, which is exactly when an arborist needs it.

**The insight.** Treat every determination as a document with an address. Once an assessment has
a stable, self-contained URL and a printable form, the long page stops being a liability and
becomes the workbench that produces a citable artifact. The scroll is fine if the result travels.

## 4. Deliverables

Each is testable. Each needs a receipt. Build all seven, or name the ones you cut and why.

**D1. Shareable assessment permalink.**
Encode the full assessment state in a versioned URL fragment: jurisdiction, species, DBH, work
type, disturbance, site context, and the engine version. Add a "Copy verdict link" control.
Loading the link restores the exact determination without re-entry.
Receipt: round-trip three presets, confirm every field and every computed output matches the
pre-link state, and report the longest URL length produced.

**D2. Sticky determination bar.**
A persistent summary that keeps status, DBH, CRZ, replacement owed, and cash in lieu visible at
every scroll depth on the demo route. On mobile it collapses to one line. It must never cover
content or trap keyboard focus.
Receipt: report the bar's text at three scroll depths, and confirm it is reachable by keyboard.

**D3. Case gallery as static, crawlable pages.**
`/cases/` index plus one page per case, at least five: Austin heritage live oak, Georgetown
multi-stem pecan, Liberty Hill post oak, Ashland, Medford. Each page must render its determination,
citations, and root zone map as HTML that works with JavaScript disabled. Generate them from the
engine at build time, never hand-written.
Receipt: report the generated page count, and paste the text of one determination as served with
JS off.

**D4. Offline field mode.**
A service worker caching the app shell, bundle, and both ordinance datasets. After one online
load, the full determination must compute with the network off, because a field arborist has no
signal under a canopy.
Receipt: load online, disable the network, reload, and report the computed verdict with the
network confirmed off.

**D5. Provenance surface.**
Every output shows dataset version, record id, citation, and last verified date. Add a "What
this record does not know" panel driven by the UNVERIFIED fields already present in the data,
so a threshold-and-fee record says so plainly instead of implying full coverage.
Receipt: for Cedar Park and Round Rock, list exactly what the panel reports as unverified.

**D6. Evidentiary print report.**
A print stylesheet and an "Export report" action producing a clean single document: tree data,
determination, citations, root zone map, and a signature block. No dark backgrounds, no clipped
text, sensible page breaks.
Receipt: report page count at Letter size and confirm no text is cut at any page boundary.

**D7. Falsifiability page.**
`/methods/` listing every verification group, what it proves, and the exact command to run it.
Generate the counts from the suite itself so the page cannot drift from reality.
Receipt: report the count the page displays and the count the suite actually ran, and confirm
they match.

## 5. What not to do

- Do not add marketing claims that a test does not back.
- Do not invent metrics, coverage numbers, or user counts.
- Do not state a legal position the cited section does not state. Leave the gap visible.
- Do not copy another city's rules into a record that lacks them.
- Do not add a dependency. Zero runtime dependencies is a feature and stays one.
- Do not restyle the existing palettes into something generic. Sunlight Field and Canopy Dark stay.

## 6. Receipts, not prose

A claim without a measurement fails this task. Run the build, run `node tests/verify_openarbor.mjs`,
run `node tests/verify_mcp.mjs`, run `node scripts/validate-ordinance.mjs`, run
`node deploy/verify-parity.mjs`, and report their actual output. If you add tests, say how many
and show them failing against the old build before they pass against yours for any gate you add.

**Report the skeleton early.** Once D2 and D3 render with a first real case, say so before you
finish the rest, so a wrong structural choice costs an hour instead of a night.

## 7. Scope cut rule

A verified spine beats an unverified sprawl. If time binds, ship D1, D2, D3 and D5 complete, and
say plainly which of D4, D6, D7 you deferred. Never report a partial deliverable as finished, and
never pad a report with intent.

## 8. Parallel work

If your environment supports parallel workers, split D1 through D7 across them with the file
ownership stated per worker, and integrate once at the end. If it does not, sequence them and say
so. In either case a single integrator runs the full suite last and reports the result.

## 9. Report format

For each deliverable: state DONE, PARTIAL, or DEFERRED, the files touched, one executed receipt,
and anything a reviewer should doubt. End with the suite output, quoted, and the one thing you
would build next if you had another night.

House style in all generated prose: no em dashes, no en dashes, no filler. Plain declarative
sentences. The work speaks.
