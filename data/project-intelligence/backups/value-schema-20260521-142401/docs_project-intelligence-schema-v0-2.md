# ConstructionFront Project Intelligence Schema v0.2

Schema v0.2 refines update/event milestone classification before full-database migration.

## Controlled `milestoneType`

Allowed values:

- `Development / Planning`
- `Approval / Permitting`
- `FEED / FEL`
- `ECI / Pre-Construction`
- `FID / Financial Close`
- `PPA / Offtake`
- `Procurement Launch`
- `Preferred Bidder / Shortlist`
- `Contract Award`
- `Under Construction`
- `Construction Completed`
- `Operational`
- `M&A`
- `Dispute / Settlement`
- `Financing / Investment`
- `Other`
- `Unknown`

## Classification Rules

Keep `currentProjectStage` separate from `milestoneType`.

- `currentProjectStage` describes where the project currently sits in its lifecycle.
- `milestoneType` describes what the article or update is about.
- `milestoneSummary` explains the event in human-readable detail.

Do not use separate `milestoneType` values for detailed construction states. Map them as follows:

- Construction Started -> `Under Construction`
- Construction Progress -> `Under Construction`
- Substantial Completion -> `Construction Completed`
- Mechanical Completion -> `Construction Completed`
- Practical Completion -> `Construction Completed`
- Testing / Commissioning -> `Construction Completed`, unless the asset is clearly operational
- Commercial Operations -> `Operational`
- Opened to Traffic -> `Operational`

Use `M&A` for acquisitions, divestments, mergers, equity sales, corporate transactions and asset/platform transactions.

Use `FID / Financial Close` for final investment decision, formal project financial close, full notice to proceed and formal project-level financing close.

Use `Financing / Investment` for broader funding, equity investment, corporate finance, JV contribution, debt facility or programme-level investment that is not necessarily a formal project financial close.

Use `PPA / Offtake` for power purchase agreements, LNG offtake, utility purchase agreements and similar commercial offtake events. Do not classify PPA/offtake articles as construction contract awards unless the article separately states a construction contract award.

## Sample Files

The v0.2 clean working sample is sidecar-only:

- `data/project-intelligence/sample/projects_master_sample_5_clean.csv`
- `data/project-intelligence/sample/project_updates_sample_5_clean.csv`
- `data/project-intelligence/sample/sample_schema_validation_report_clean.md`

The original 5-project sample files are preserved for comparison.

## Map Anchors For Programmes

Project master rows may use `mapAnchorType` to distinguish physical locations from display anchors.

Allowed values:

- `Exact Project Location`
- `Approximate Project Location`
- `Corridor Midpoint`
- `Regional Anchor`
- `Country Capital Anchor`
- `Programme / Portfolio Anchor`
- `Unknown`

For national programmes, broad grid expansion programmes, country-level financing records or portfolios without a discrete site, a country capital can be used as a display anchor if the record is clearly labelled approximate.

Required handling:

- `locationPrecision` = `National`
- `mapAnchorType` = `Country Capital Anchor` or `Programme / Portfolio Anchor`
- `mapEligibilityStatus` = `Map Ready - Approximate`
- `mapEligibilityNotes` must say the coordinates are a country-level display anchor only, not the physical project location

Do not use capital-city anchors for discrete projects where the real location is known or can be reasonably identified.
