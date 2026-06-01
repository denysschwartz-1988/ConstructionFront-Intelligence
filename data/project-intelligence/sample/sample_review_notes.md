# 5-Project Working Sample Review Notes

Date: 2026-05-21

This sidecar sample tests a 3-table model for ConstructionFront project intelligence without processing the full database or overwriting existing files.

## Selected Projects

1. El Patrimonio Solar Project - energy/solar project with PPA/offtaker role and construction-start update.
2. D35 Motorway Úlibice-Hořice Section - transport/civil package with construction contract award and JV/consortium contractor classification.
3. Beacon Point AI Data Center Campus - digital infrastructure project with EPCM award and large programme value.
4. Commonwealth LNG - LNG project demonstrating multiple article updates linked to one project, FID/financing close, NTP, suppliers and offtakers.
5. German Grid Expansion / Amprion Financing JV - broad programme/financing-led record that is not a simple project dot.

## Model Points Tested

- Project master rows represent canonical projects/packages/programmes, not one row per article.
- Project update rows hold article/event history. Commonwealth LNG has two update rows linked to one master project.
- Party rows separate owners, public authorities, contractors, JV/consortium names, JV members, offtakers, suppliers and financiers.
- PPA/offtake and financing-close events are classified as commercial or milestone events, not automatically as construction contract awards.
- Broad programme records can stay in the database while being marked not map-ready.

## Map Eligibility

Map-ready or approximately map-eligible records:

- El Patrimonio Solar Project - county-level coordinates.
- D35 Motorway Úlibice-Hořice Section - corridor midpoint coordinates.
- Beacon Point AI Data Center Campus - county/campus-area coordinates.
- Commonwealth LNG - Cameron Parish-level coordinates, but still needs source check.

Not map-ready:

- German Grid Expansion / Amprion Financing JV - broad national/grid financing programme, not a discrete project dot.

## Stage Taxonomy Note

The project-stage taxonomy now includes Construction Completed. Use it only where physical/substantial/practical/mechanical completion or major delivery completion has been reached but the asset is not necessarily operating. Use Operational only once the asset is in service, producing, processing, treating, carrying traffic or otherwise performing its intended function.

## Recommended Refinements Before Scaling

- Add controlled values for recordType, locationPrecision, articleUpdateType, commercialEventType, sourceType, partyRole and partyType.
- Add date precision fields to update/event rows, mirroring the structured schedule fields in v0.1.
- Add a canonical project/update merge rule for duplicate slugs and recurring article coverage.
- Consider a child-package model for corridor/programme records so map views can show packages while preserving parent programme context.
- Split parties into canonical organization records later if search and deduplication become important.
