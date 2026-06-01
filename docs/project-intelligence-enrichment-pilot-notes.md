# Project Intelligence Enrichment Pilot Notes

Date: 2026-05-21

## Scope

This pilot reviewed 10 representative records from `projects_review_queue.csv` and wrote enriched pilot-only outputs. It did not overwrite `projects_clean.csv`.

Outputs:

- `data/project-intelligence/projects_enrichment_pilot.csv`
- `data/project-intelligence/projects_review_queue_pilot.csv`
- `data/project-intelligence/project_change_log_pilot.csv`

## Sample Mix

The selected sample covers:

- BESS: Wagerup BESS
- Solar: El Patrimonio Solar Project
- Wind: Big Horn I Wind Project Upgrade
- Transmission: German Grid Expansion / Amprion financing
- Rail: Hamilton LRT and OL32 Skavsta Rail Contract
- Road: D35 Motorway
- Data centre: Beacon Point AI Data Center Campus
- LNG / gas or power: Commonwealth LNG
- Water / sanitation: North Shore Wastewater Treatment Plant
- Contract award / procurement: Wagerup, Hamilton LRT, D35, Beacon Point, OL32 and Commonwealth LNG

## Source Basis

The pilot used the ConstructionFront article pages and the official/supporting sources cited inside those articles. No unsupported contractors, dates, values or coordinates were added.

Reviewed ConstructionFront articles:

- Wagerup BESS: `https://constructionfront.com/2025-09-20-genusplus-to-deliver-100mw-200mwh-wagerup-bess-for-alinta-energy-in-western-australia/`
- El Patrimonio Solar Project: `https://constructionfront.com/2026-05-13-cps-energy-and-ashtrom-break-ground-on-150mw-el-patrimonio-solar-project-in-texas/`
- Big Horn I Wind Project Upgrade: `https://constructionfront.com/2026-05-21-avangrid-and-puget-sound-energy-sign-ppa-for-199-5mw-big-horn-i-wind-project-upgrade-in-washington/`
- German Grid Expansion: `https://constructionfront.com/2025-09-08-rwe-and-apollo-global-management-form-strategic-joint-venture-for-german-grid-expansion/`
- Hamilton LRT: `https://constructionfront.com/2026-05-04-aecon-led-alliance-selected-for-hamilton-lrt-civil-and-utilities-works-in-ontario/`
- D35 Motorway: `https://constructionfront.com/2026-05-07-strabag-consortium-wins-177-million-d35-motorway-contract-in-the-czech-republic/`
- Beacon Point AI Data Center Campus: `https://constructionfront.com/2026-05-14-jacobs-awarded-epcm-contract-for-hut-8-1gw-beacon-point-ai-data-center-campus-in-texas/`
- Commonwealth LNG: `https://constructionfront.com/2026-05-16-caturus-reaches-fid-closes-9-75bn-financing-and-issues-ntp-to-technip-energies-for-commonwealth-lng-in-louisiana/`
- North Shore Wastewater Treatment Plant: `https://constructionfront.com/2026-05-17-metro-vancouver-and-acciona-settle-north-shore-wastewater-treatment-plant-claims-for-235-million/`
- OL32 Skavsta Rail Contract: `https://constructionfront.com/2026-05-11-feronord-consortium-selected-for-1-2-billion-ol32-skavsta-rail-contract-in-sweden/`

## Approval Results

Records reviewed: 10

Approved for public beta database: 7

Still requiring review: 3

Approved records:

- Wagerup BESS
- El Patrimonio Solar Project
- Hamilton LRT
- D35 Motorway
- Beacon Point AI Data Center Campus
- North Shore Wastewater Treatment Plant
- OL32 Skavsta Rail Contract

Still requiring review:

- Big Horn I Wind Project Upgrade: needs contractor verification because the article confirms the PPA and upgrade intent but does not disclose upgrade contractor, price, PPA term or detailed repowering scope.
- German Grid Expansion: needs source/data-model decision because it is a broad grid financing / equity JV record rather than a discrete mappable construction project.
- Commonwealth LNG: needs source check because the article confirms FID, financing close and full NTP, but contains conflicting operation timing references.

## Common Missing Or Weak Fields

- Exact project coordinates: several articles support county, corridor or programme-level placement, not site-level coordinates.
- Main contractor detail: PPA and financing articles often confirm commercial milestones without naming package-level contractors.
- Currency precision: several articles use `$` in local-market contexts; the pilot applied likely currency where strongly supported by jurisdiction and source context, but this should be checked against official releases for production.
- Completion dates: some articles provide programme-level rather than package-level dates.
- Procurement status nuance: staged models such as alliance development phase, ECI, volume contract and EPCM need more structured status fields than a simple award/not-awarded value.
- Duplicate project identity: Commonwealth LNG appears more than once in the clean database with the same slug and different article updates.

## Recommendations

1. Add a `locationPrecision` field with allowed values such as `Exact Site`, `Facility`, `County / LGA`, `Corridor`, `Country / Programme`, and `Unknown`.
2. Add a `capacityScale` field because many records include project capacity or size that does not fit cleanly into value or notes.
3. Add `sourceQuality` or `sourceType` to distinguish ConstructionFront article, official owner release, contractor release, regulator filing and media report.
4. Add `articleUpdateType` for records that are not new projects, such as `PPA`, `FID`, `Financial Close`, `Contract Award`, `Dispute`, `Settlement`, `Construction Start`, and `Operational Update`.
5. Add duplicate handling rules that allow multiple article updates to roll up to one canonical project record.
6. Split `projectValue` into `valueAmount`, `valueCurrency`, `valueBasis`, and `valueNotes` so financing, contract values, programme estimates and settlement amounts do not get mixed together.
7. Refine validation so broad financing/programme records cannot be marked `mapReady` using country centroids.
8. Add validation for sector/subsector consistency; the pilot found a wastewater record incorrectly classified as Transport / Rail.
9. Add validation for conflicting schedule signals when article text includes multiple operation or completion years.
10. Add a controlled taxonomy for `contractType` and `procurementStatus`, including `Alliance Development Phase`, `ECI`, `EPCM`, `EPC NTP`, `PPA`, `DBF`, `Construction Management`, and `Litigation / Settlement`.
