# Adding a city tree code to Open Arbor

This page is for arborists, municipal foresters, and anyone who wants their city's tree protection rules to work in Open Arbor. You do not need to write code. You need the code section, the numbers it states, and a citation for each number.

## What a record is

A municipality record is one JSON object that describes how a city protects trees: what size tree counts, which species are exempt, what work needs a permit, and what mitigation costs when a protected tree comes down.

There are two levels, and both are accepted:

```
  Threshold_And_Fee_Record   the DBH threshold, the mitigation rate, the
                             ordinance number, and the source URL. Enough to
                             calculate exposure. Fields you cannot verify stay
                             marked UNVERIFIED and the record still validates.
  Full_Rule_Record           everything above plus permit triggers by work
                             type, heritage species thresholds, and plan rules.
```

Start with the smaller one. A verified threshold record for your city is worth more than a full record with guessed numbers in it.

## Required fields

```
  id                        lowercase, state prefix, hyphens: or-ashland
  name                      the city name as the city writes it
  state                     two letter code
  ordinance_numbers         the exact chapter and section numbers, in words
  source_url                a URL that opens the actual code text
  dbh_threshold_inches      the size at which a tree becomes protected
```

Optional, and worth adding when you have the source:

```
  coordinates                     lat and lng for the city center
  heritage_threshold_inches       the size at which a tree becomes heritage
  heritage_species_thresholds     species name to threshold, in inches
  excepted_species                invasive or nuisance species the code excludes
  permit_triggers_by_work_type    work type to the tiers that trigger a permit,
                                  with a citation
  mitigation_fee_schedule         tiers with min_dbh, max_dbh, rate_per_inch,
                                  replacement_ratio, plus the citation
  plan_rules                      survey requirements and plan drawing rules
```

## A complete working example

This is the Ashland record, shortened. It passes the validator as a Full_Rule_Record.

```json
{
  "id": "or-ashland",
  "name": "Ashland",
  "state": "OR",
  "coordinates": { "lat": 42.1946, "lng": -122.7095 },
  "ordinance_numbers": "Ashland Municipal Code (AMC) Chapter 18.4.5 (Tree Preservation and Protection) and Chapter 18.5.7 (Tree Removal Permits)",
  "source_url": "https://ashland.municipal.codes/AMC/18.4.5",
  "dbh_threshold_inches": 6,
  "heritage_threshold_inches": 18,
  "excepted_species": [
    "Ailanthus altissima (Tree of Heaven)",
    "Robinia pseudoacacia (Black Locust)"
  ],
  "mitigation_fee_schedule": {
    "citation": "AMC § 18.5.7.060 Mitigation and Replacement",
    "tiers": [
      { "min_dbh": 6, "max_dbh": 17.9, "rate_per_inch": 75, "replacement_ratio": 1 },
      { "min_dbh": 18, "max_dbh": null, "rate_per_inch": 150, "replacement_ratio": 2 }
    ]
  }
}
```

Species names carry their Latin binomial and the common name in parentheses, because the engine matches on the binomial and a reader needs the common name to check your work.

## Where the file goes

```
  data/ordinances/<region>_ordinances.json
```

One file per region, with a `municipalities` array. Add your object to that array. If your city belongs to a region with no file yet, create one and use the same top-level shape:

```json
{
  "dataset_version": "2.0.0",
  "region": "Willamette Valley, Oregon",
  "standard": "Municipal tree protection codes",
  "municipalities": [ { ... } ]
}
```

## Validate before you open a pull request

```bash
npm run validate:ordinances
```

A passing record prints like this:

```
  [PASS] or-ashland (Ashland, OR) [Full_Rule_Record]
  Summary: 8 municipality records validated. Status: VALID
```

If it fails, the message names the field. The two most common failures are a DBH threshold expressed as a string instead of a number, and a `max_dbh` left out of a tier where the real code says "and above". `null` means no upper bound.

## Rules that keep the dataset trustworthy

```
  never type a number from memory. Quote the section it came from.
  never fill a field you could not verify. Leave it out, or mark the record
  UNVERIFIED at the field level, which the validator accepts on purpose.
  the source_url must open the code, not a summary page or a news article.
  if the city publishes an amended code, cite the amendment date.
  when a city's rule changes, update the record rather than adding a second one.
```

## Submitting

1. Fork the repository.
2. Add your record to the right regional file.
3. Run `npm run validate:ordinances` and keep the output.
4. Open a pull request with the validator output pasted in the description, and one line naming the section that establishes the threshold.
5. A reviewer checks the citation against the source URL, not your summary of it.

## What reviewers are looking for

```
  the threshold matches the code, not a guidance document about the code
  the mitigation tiers reproduce the fee schedule exactly, including rounding
  heritage species thresholds are per species where the code is per species
  excepted species are the ones the code excepts, not the ones commonly removed
  the record does not invent a permit trigger the city does not enforce
```

Corrections to existing records are as valuable as new ones. If a city amended its code and the record is stale, that is a bug, and it gets fixed the same way.
