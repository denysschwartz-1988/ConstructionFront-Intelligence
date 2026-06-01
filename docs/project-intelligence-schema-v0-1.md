# ConstructionFront Project Intelligence Schema v0.1

Schema v0.1 keeps the v0 project-intelligence workflow internal and adds fields needed for editorial review of pre-construction pathways, schedule precision and opportunity framing.

## New And Updated Fields

### `preConstructionApproach`

Captures the specific early-stage, design or procurement approach without overloading `projectStage`.

Allowed values:

- `Development`
- `FEL`
- `FEED`
- `ECI`
- `Reference Design`
- `Detailed Design`
- `Alliance Development Phase`
- `Pre-Construction Services`
- `Not Applicable`
- `Unknown`

Editorial rule: do not treat FEED and ECI as identical. FEED/FEL is usually an energy, LNG, hydrogen, nuclear, process or industrial pathway. ECI is usually a civil infrastructure, transport, social infrastructure or staged procurement pathway.

### `projectStage`

`projectStage` remains the broad lifecycle status.

Allowed values:

- `Early Development`
- `Planning / Approvals`
- `Pre-Construction / Design`
- `FID Pending`
- `FID Reached`
- `Tendering / Procurement`
- `Contract Awarded`
- `Under Construction`
- `Operational`
- `On Hold / Delayed`
- `Cancelled`
- `Unknown`

The former v0 value `FEED / Design Development` maps to `Pre-Construction / Design`, with the specific approach held separately in `preConstructionApproach`.

### Structured Schedule Fields

`constructionStart` and `completionTarget` remain temporarily for backward compatibility, but v0.1 uses structured fields:

- `constructionStartYear`
- `constructionStartQuarter`
- `constructionStartPrecision`
- `constructionStartNotes`
- `completionTargetYear`
- `completionTargetQuarter`
- `completionTargetPrecision`
- `completionTargetNotes`

Allowed quarter values:

- `Q1`
- `Q2`
- `Q3`
- `Q4`
- `Unknown`

Allowed precision values:

- `Exact Date`
- `Quarter`
- `Year`
- `Indicative`
- `Unknown`

Schedule rules:

- Do not infer a quarter unless the source clearly supports it.
- If only a year is known, set quarter to `Unknown` and precision to `Year`.
- If the source says expected, planned, targeted or anticipated, use precision `Indicative` unless timing is otherwise confirmed.
- Put the source wording in the notes field when it helps an editor audit the date.

### `potentialOpportunities`

Preferred replacement for `commercialOpportunity`. For v0.1, `commercialOpportunity` remains for backward compatibility and is copied into `potentialOpportunities` during migration.

Potential opportunities should include relevant suppliers, subcontractors, consultants, commercial consultants, claims consultants, legal/contract advisors, insurance/risk advisors and other stakeholders where supported by the source and project type.

### `opportunityCategories`

Controlled multi-value field using semicolon-separated values.

Allowed values:

- `Civil Works`
- `Earthworks`
- `Electrical Works`
- `Grid Connection`
- `Substations`
- `Transmission`
- `Mechanical Works`
- `Rail Systems`
- `Roadworks`
- `Structures`
- `Utilities Relocation`
- `Water / Wastewater`
- `Design / Engineering`
- `Project Controls`
- `Planning / Environmental`
- `Commercial Management`
- `Claims / Dispute Support`
- `Legal / Contract Advisory`
- `Insurance / Risk Advisory`
- `Financing / Investment`
- `O&M`
- `Asset Management`
- `Technology / Software`
- `Recruitment / Workforce`
- `Unknown`

Populate only where reasonably supported by project type, stage and source detail. Avoid over-specific opportunities not supported by the article or official source.

## Validation Rules Added In v0.1

- If `preConstructionApproach` is `ECI`, `projectStage` should usually be `Pre-Construction / Design` or `Tendering / Procurement`, unless source information supports another stage.
- If `preConstructionApproach` is `FEED` or `FEL`, `projectStage` should usually be `Pre-Construction / Design`, `FID Pending` or `Early Development`.
- `constructionStartQuarter` and `completionTargetQuarter` must remain `Unknown` when only a year is known.
- `potentialOpportunities` should be populated for editorial review.
- `opportunityCategories` must use the controlled taxonomy.
- `mapReady` still requires credible latitude and longitude.

## Versioned Outputs

Schema v0.1 outputs are additive and do not overwrite the v0 files:

- `data/project-intelligence/projects_clean_v0_1.csv`
- `data/project-intelligence/projects_review_queue_v0_1.csv`
- `data/project-intelligence/project_change_log_v0_1.csv`

The v0 files and enrichment pilot outputs are preserved.
