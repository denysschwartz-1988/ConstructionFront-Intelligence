# Sample Timeline Validation Report

Date: 2026-05-21

## Validation Result

- Passes validation: Yes
- Project master rows: 5
- Update/event rows: 6
- Valid ConstructionFront article URLs: 6
- Missing or malformed ConstructionFront article URLs: 0
- Projects with constructionStartYear populated: 2
- Projects with constructionCompletionYear populated: 0
- Projects with operationsStartYear populated: 2
- Unknown timeline precision fields: 11
- National/programme anchor rows: 1

## Issues

No validation issues found.

## Map Anchor Notes

- German Grid Expansion / Amprion Financing JV now uses Berlin as a country-level display anchor with `mapAnchorType = Country Capital Anchor`.
- The Berlin coordinates are explicitly labelled as an anchor only, not a physical project location.
- Discrete projects continue to use approximate project or corridor anchors rather than capital-city anchors.

## Remaining Stage / Timeline Notes

- Commonwealth LNG is marked Under Construction due to FID/full NTP, but exact construction start and operations timing remain unknown because the reviewed article/source notes do not cleanly support a single date.
- Beacon Point has an indicative Q1 2027 energization/operations target but remains Contract Awarded because construction start is not stated.

## Readiness

The 5-project timeline sample is structurally ready to apply to the full detailed database once the same validation is applied batch-by-batch and records with uncertain timing are left Unknown rather than guessed.
