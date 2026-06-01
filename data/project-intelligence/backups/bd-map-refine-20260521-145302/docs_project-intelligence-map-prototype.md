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
- Provides filters for region, country, sector, subsector, current stage, BD timing, map eligibility and record type.
- Search checks project name, owner/developer, client authority, country, sector and party names included in the JSON search helper.
- Project cards display values using display-scale fields, such as `EUR 177 million` or `USD 9.75 billion`.

## Notes Before Scaling

The map is intentionally static and reads the sample JSON only. Before connecting it to the full database, lock the controlled taxonomies for article update type, commercial event type, party roles, party types and source type, then add a repeatable export that generates map-ready JSON from approved records only.
