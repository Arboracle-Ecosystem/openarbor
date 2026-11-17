# What Open Arbor is

Open Arbor is an open-standards arboricultural field assessment library. It computes the numbers arborists and municipalities already argue about, and it shows the equation and the citation behind each one.

It runs locally, has no runtime dependencies, and stores nothing in a cloud it controls.

## What it computes

```
  root protection      critical root zone, tree protection zone, structural root
                       zone, multi-stem aggregation, and a spatial union so
                       overlapping root zones are not double counted
  municipal codes      protection thresholds, heritage thresholds, species
                       exceptions, permit triggers, and mitigation fees, read
                       from a data file rather than hardcoded
  ecosystem values     canopy interception, avoided runoff, air pollutant removal,
                       shade energy savings, compensatory structural value
  structural risk      RAP-Spec v2.0, including Mattheck t/R biomechanics and a
                       dual valuation of risk and asset value
```

## Why it exists

Proprietary arboricultural software keeps field observations, municipal rules, and preservation plans inside closed databases. A practitioner cannot check the allometric equation, a municipal forester cannot verify the ordinance citation, and the export is whatever the vendor offers rather than a standard format.

Open Arbor inverts that. The equations are in `src/core/`, readable in a text editor. The municipal codes are JSON records in `data/ordinances/`, each with a `source_url` that opens the actual code. The output is GeoJSON that opens in QGIS or ArcGIS Field Maps without a converter.

## What it does not do

```
  it does not decide whether a tree is hazardous. It computes and cites.
  the human makes the call and signs the assessment.
  it does not replace a site visit, a soil test, or a resistograph reading.
  it does not guarantee a municipal decision. It reproduces what the code says.
  it does not cover every city. Eight municipalities are verified today, and
  the dataset says which fields in each record are unverified.
```

## Who it is for

```
  consulting arborists writing tree protection plans
  municipal foresters checking permit applications
  urban forestry researchers who need the equation, not a report
  developers and landscape architects who need to know the exposure before
  they design around a tree
```

## Where the rules come from

ANSI A300 and the ISA BMPs for practice, AS 4970 and BS 5837 for protection zones, Nowak, McPherson and Simpson, and Xiao for ecosystem values, Mattheck for structural biomechanics, and the municipal code section itself for every municipal number.

Each module's header states which standard it implements. If a calculation cannot be traced to one, it does not belong in the library.

## Next

Read [Quickstart](START_QUICKSTART.md) to run it, or [Adding your city's code](CONTRIBUTING_ORDINANCES.md) to contribute a municipal record.
