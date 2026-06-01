# Sample Schema Validation Report - Clean Milestone Taxonomy

Date: 2026-05-21

## Result

- Project master rows checked: 5
- Update/event rows checked: 6
- milestoneType values changed: 6
- Invalid milestoneType values after cleanup: 0
- All milestoneType values match the controlled taxonomy: Yes

## Milestone Changes

- UPD-ELP-20260513: `(blank)` -> `Under Construction` (Groundbreaking and construction start reported; PPA/offtake detail remains in commercialEventType.)
- UPD-D35-20260507: `(blank)` -> `Contract Award` (EUR 177m construction contract award reported; article/source notes also support April 2026 construction start detail.)
- UPD-BEACON-20260514: `(blank)` -> `Contract Award` (Sole-source EPCM contract awarded to Jacobs; no completion or operational milestone implied.)
- UPD-CWLNG-20260420: `(blank)` -> `ECI / Pre-Construction` (Substantial authorization to advance work ahead of FID; not yet formal FID/financial close.)
- UPD-CWLNG-20260516: `FID Reached` -> `FID / Financial Close` (FID reached, formal project financing closed and full NTP issued to Technip Energies.)
- UPD-GERGRID-20250908: `(blank)` -> `Financing / Investment` (Broad JV/equity contribution for German grid expansion; not formal project-level financial close.)

## Remaining Ambiguous Records

- UPD-CWLNG-20260420: classified as `ECI / Pre-Construction` because it is a pre-FID authorization, but it should be reviewed against the source if a more formal limited notice-to-proceed taxonomy is added later.
- UPD-CWLNG-20260516: classified as `FID / Financial Close`; record still needs source check because the article had conflicting operation timing references.
- UPD-GERGRID-20250908: classified as `Financing / Investment`; the master record remains a broad programme/financing record and is not a simple map dot.

## Scaling Readiness

The 5-project sample is ready as a schema test for full-database migration. Before full migration, add controlled values for articleUpdateType, commercialEventType, sourceType, partyRole and locationPrecision, then migrate update/event rows with milestoneSummary populated from the article-specific detail.
