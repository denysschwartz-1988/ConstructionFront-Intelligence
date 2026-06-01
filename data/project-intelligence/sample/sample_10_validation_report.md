# 10-Project Sample Validation Report

Date: 2026-05-21

## Result

- Passes validation: Yes
- Project master rows: 10
- Project update rows: 11
- Project party rows: 35
- Valid ConstructionFront article URLs: 11
- Missing or malformed ConstructionFront article URLs: 0
- Map Ready records: 0
- Approximate map-ready records: 10
- Programme/capital-anchor records: 1
- Projects with constructionStartYear populated: 3
- Projects with constructionCompletionYear populated: 2
- Projects with operationsStartYear populated: 4
- Project value fields populated: 7
- Event value fields populated: 7
- Raw integer value fields detected: 0

## Selected Projects

1. El Patrimonio Solar Project - Energy, United States
2. D35 Motorway Úlibice-Hořice Section - Transport, Czech Republic
3. Beacon Point AI Data Center Campus - Digital Infrastructure, United States
4. Commonwealth LNG - Energy, United States
5. German Grid Expansion / Amprion Financing JV - Energy, Germany
6. Wagerup BESS - Energy, Australia
7. Hamilton LRT - Transport, Canada
8. North Shore Wastewater Treatment Plant - Water, Canada
9. OL32 Skavsta Rail Contract - Transport, Sweden
10. Big Horn I Wind Project Upgrade - Energy, United States

## Coverage Notes

The sample covers North America, Europe and Australia & NZ; energy, transport, water and digital infrastructure; discrete projects, corridor/package records and a national programme/capital anchor. Party classification includes public authorities, contractors, JV/consortium members, EPC/EPCM contractors, suppliers, offtakers and financiers/investors.

## Remaining Refinements Before Full Migration

- Lock controlled taxonomies for articleUpdateType, commercialEventType, partyRole, partyType and sourceType.
- Decide how to model programme parents and package children for corridors and national portfolios.
- Add a separate rawValueAmount field later only if numeric aggregation is required; keep editorial display values as the default for map cards.
- Continue source-checking records with unknown construction or operations dates instead of inferring timeline data.
