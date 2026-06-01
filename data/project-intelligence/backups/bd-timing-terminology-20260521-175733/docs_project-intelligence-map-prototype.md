# ConstructionFront Internal Map Prototype

This is an internal MVP prototype using only the 10-project sample. It does not include authentication, payments, alerts, user accounts or public map publishing.

## Files

- `data/project-intelligence/sample/projects_master_sample_10.csv`
- `data/project-intelligence/sample/project_updates_sample_10.csv`
- `data/project-intelligence/sample/project_parties_sample_10.csv`
- `data/project-intelligence/sample/projects_master_sample_10.json`
- `data/project-intelligence/sample/project-intelligence-map-prototype.html`

## How To Run

From the workspace root:

```powershell
python -m http.server 8765 --directory data/project-intelligence/sample
```

Then open:

`http://localhost:8765/project-intelligence-map-prototype.html`

If Python is not on PATH, use any simple static file server. The page fetches `projects_master_sample_10.json`, so opening the HTML directly from the filesystem may not work in all browsers.

## Prototype Behavior

- Shows only records with `Map Ready` or `Map Ready - Approximate`.
- Uses distinct marker styling for approximate and programme/capital anchors.
- Provides first-class BD filters for `Potential Opportunity` (`opportunityCategories`) and `Target Buyer Type` (`targetBuyerTypes`), plus market filters for region, country, sector, subsector, current stage and opportunity timing.
- Search checks project name, owner/developer, client authority, country, sector, subsector, party names, `potentialOpportunities`, `opportunityCategories` and `targetBuyerTypes`.
- The selected-project panel includes a `Business Development Relevance` section with opportunity timing, opportunity category chips, target buyer type chips and the potential-opportunities narrative.
- Visible project rows show country, sector, stage, opportunity timing and the first few opportunity category chips.
- Project cards display values using display-scale fields, such as `EUR 177 million` or `USD 9.75 billion`.

## Business Development Filtering

`opportunityCategories` and `targetBuyerTypes` are controlled semicolon-separated multi-value fields. A record passes a multi-select filter when at least one selected tag appears in that field. Combining filters narrows the sample, for example:

- Country = `Australia`
- Potential Opportunity = `Balance of Plant (BoP)` or `Civil Works`
- Target Buyer Type = `Civil Contractor`

This is intended to support suppliers, subcontractors, contractors, consultants, advisors, financiers and risk/insurance users looking for commercially relevant records rather than only map pins.

## Notes Before Scaling

The map is intentionally static and reads the sample JSON only. Before connecting it to the full database, lock the controlled taxonomies for article update type, commercial event type, party roles, party types and source type, then add a repeatable export that generates map-ready JSON from approved records only.
