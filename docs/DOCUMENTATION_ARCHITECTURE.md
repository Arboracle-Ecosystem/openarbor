# Documentation architecture for the full stack

Written 2026-11-16. Covers Open Arbor and the Forest OS tools that surround it.

## The problem with the current docs directory

`docs/` holds 20 files written at different times for different readers: brand guides next to philosophy essays next to 2031 strategy specs next to implementation plans. A visitor who wants to know how to use the software cannot tell which file is a manual and which is a memo. Nothing is ordered, nothing is linked, and the file numbers collide (two files numbered 13 and 14).

That is fine for a working notebook. It is not fine for a public release.

## Recommendation: a static docs site, built from markdown, no dependency

Keep every page as markdown in `docs/`. Add one manifest that defines the menu and the order. Build it with the same pattern already used by `web/build.mjs`, which means no new runtime, no MkDocs install, no theme dependency, and it matches the project's own zero-dependency claim.

```
  docs/*.md            the pages
  docs/manifest.json   menu structure, page order, section grouping
  web/build-docs.mjs   renders docs plus a sidebar into out/docs/
  out/docs/index.html  what gets published
```

Two alternatives, and why not:

```
  MkDocs Material   good output, adds a Python toolchain to a Node project,
                    and the theme becomes a dependency to maintain
  GitHub wiki       fast to start, lives outside the repo, no code review on
                    docs, and it forks the source of truth away from the code
```

A static generator is the right shape here because the docs must ship with the version they describe. A wiki drifts.

## Proposed menu

Group by who is reading, not by when it was written.

```
  Start
    What Open Arbor is
    Quickstart, five minutes
    What it does not do

  Field work
    Root zone and protection zone calculation
    RAP-Spec v2.0 walkthrough
    Exporting GeoJSON to QGIS and ArcGIS Field Maps
    Field portal and offline use

  Standards and method
    ANSI A300 and ISA BMP mapping
    AS 4970 and BS 5837
    Allometrics: Nowak, McPherson, Xiao
    Mattheck t/R biomechanics
    Citations and limitations

  Municipal codes
    How the ordinance engine evaluates a tree
    Adding your city's code          <- CONTRIBUTING_ORDINANCES.md
    Record tiers and verification status
    Dataset coverage map

  Platform
    Architecture
    MCP server and tool calls
    Schemas and versioning
    Self-hosting

  Forest OS
    What Forest OS is
    Directory grammar
    Agent roles and lanes
    Tools directory                  <- one line per tool, what it does, when to use it

  Reference
    CLI reference
    Test suites and what each one proves
    Changelog
    License and contribution terms
```

## The tools directory page

The request behind this page is "the GitHub should tell all." A reader who lands on a repo sees folders, not functions. One table fixes that:

```
  tool                   what it does                                when to use it
  openarbor-rca.mjs      compiles an RAP field assessment to a       before a permit
                         signed, schema-valid payload
  rootZone.js            CRZ, TPZ, SRZ, multi-stem, spatial union    sizing protection areas
  ordinanceEngine.js     evaluates a stem against a municipal code   deciding permit triggers
  ecosystemBenefits.js   canopy, hydrology, air quality values       valuation and reports
  rcaEngine.js           Mattheck t/R, dual valuation, economics     structural risk calls
  ...
```

Each row links to the page that explains it. A tool with no page is a tool nobody adopts.

## Order of work

```
  1  manifest and generator, so the menu exists            half day
  2  Start, Municipal codes, and Tools directory           the three pages a
                                                            first-time visitor
                                                            actually needs
  3  Standards and method                                  the credibility pages
  4  Field work and Platform                               the usage pages
  5  Forest OS                                             the widest scope, and
                                                            the least urgent for
                                                            an Open Arbor release
  6  Move the existing 20 files into Reference, or archive them as
     historical documents with a banner saying so. Do not delete them.
```

## One rule for the rewrite

Every page states what the software does today, with the command that proves it. Anything aspirational belongs in a roadmap page that says so at the top. A docs site that describes a feature the code does not have is worse than no docs, because a contributor builds against it and then finds nothing there.
