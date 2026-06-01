import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type Row = Record<string, string>;

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const DATA_DIR = resolve(ROOT, "data/project-intelligence");
const RAW_PATH = resolve(DATA_DIR, "projects_raw.csv");
const CLEAN_PATH = resolve(DATA_DIR, "projects_clean_v0_1.csv");
const REVIEW_PATH = resolve(DATA_DIR, "projects_review_queue_v0_1.csv");
const CHANGE_LOG_PATH = resolve(DATA_DIR, "project_change_log_v0_1.csv");
const TAXONOMIES_PATH = resolve(DATA_DIR, "taxonomies.json");

const CLEAN_FIELDS = [
  "projectName",
  "slug",
  "articleTitle",
  "cfArticleUrl",
  "region",
  "country",
  "stateProvince",
  "cityArea",
  "latitude",
  "longitude",
  "sector",
  "subsector",
  "projectStage",
  "preConstructionApproach",
  "bdTiming",
  "projectValue",
  "currency",
  "ownerDeveloper",
  "clientAuthority",
  "mainContractor",
  "keyContractors",
  "contractType",
  "procurementStatus",
  "fidStatus",
  "constructionStart",
  "constructionStartYear",
  "constructionStartQuarter",
  "constructionStartPrecision",
  "constructionStartNotes",
  "completionTarget",
  "completionTargetYear",
  "completionTargetQuarter",
  "completionTargetPrecision",
  "completionTargetNotes",
  "commercialOpportunity",
  "potentialOpportunities",
  "opportunityCategories",
  "targetBuyerTypes",
  "confidenceLevel",
  "latestUpdateDate",
  "lastReviewed",
  "sourceUrl",
  "sourceNotes",
  "reviewStatus",
  "mapReady",
  "includeInV0Map"
];

const MILESTONE_TYPE_MAP: Record<string, string> = {
  "Construction Started": "Under Construction",
  "Construction Progress": "Under Construction",
  "Substantial Completion": "Construction Completed",
  "Mechanical Completion": "Construction Completed",
  "Practical Completion": "Construction Completed",
  "Testing / Commissioning": "Construction Completed",
  "Commercial Operations": "Operational",
  "Opened to Traffic": "Operational",
  "Acquisition": "M&A",
  "Financial Close": "FID / Financial Close",
  "Financing Secured": "FID / Financial Close",
  "FID Reached": "FID / Financial Close"
};

function parseCsv(input: string): Row[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    const next = input[i + 1];
    if (quoted) {
      if (char === "\"" && next === "\"") {
        cell += "\"";
        i += 1;
      } else if (char === "\"") {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === "\"") {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") {
      cell += char;
    }
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }

  const headers = rows.shift() ?? [];
  return rows
    .filter((values) => values.some((value) => value.trim() !== ""))
    .map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
}

function stringifyCsv(rows: Row[], headers: string[]): string {
  const escape = (value: unknown) => {
    const text = value === undefined || value === null ? "" : String(value);
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, "\"\"")}"` : text;
  };
  return [headers.map(escape).join(","), ...rows.map((row) => headers.map((header) => escape(row[header])).join(","))].join("\n") + "\n";
}

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeRegion(value: string): string {
  if (["Latin America", "Middle East & Africa"].includes(value)) return "Other";
  return value || "Other";
}

function normalizeBool(value: string): string {
  return /^(yes|true|1)$/i.test(value.trim()) ? "true" : "false";
}

function cleanConfidence(value: string): string {
  if (["Confirmed", "Likely", "Inferred", "Unknown"].includes(value)) return value;
  return "Needs Review";
}

function normalizeProjectStage(value: string): string {
  if (value === "FEED / Design Development") return "Pre-Construction / Design";
  return value || "Unknown";
}

function normalizeBdTiming(value: string): string {
  if (value === "Contractor Route") return "Supply Chain Opportunity";
  return value || "Low Visibility";
}

function inferPreConstructionApproach(source: Row): string {
  const text = [
    source["Article Title"],
    source["Project Stage"],
    source["Contract / Procurement Model"],
    source["Commercial Opportunity"],
    source["Opportunity Route"],
    source["Source Notes"]
  ].join(" ").toLowerCase();

  if (/\balliance\b/.test(text) && /\bdevelopment\b/.test(text)) return "Alliance Development Phase";
  if (/\bpre[-\s]?construction\b/.test(text)) return "Pre-Construction Services";
  if (/\beci\b|early contractor involvement/.test(text)) return "ECI";
  if (/\breference design\b/.test(text)) return "Reference Design";
  if (/\bdetailed design\b/.test(text)) return "Detailed Design";
  if (/\bfeed\b/.test(text)) return "FEED";
  if (/\bfel\b/.test(text)) return "FEL";
  if (source["Project Stage"] === "FEED / Design Development") return "FEED";
  if (["Early Development", "Planning / Approvals"].includes(source["Project Stage"] || "")) return "Development";
  if (["Contract Awarded", "Under Construction", "Operational", "On Hold / Delayed", "Cancelled"].includes(source["Project Stage"] || "")) {
    return "Not Applicable";
  }
  return "Unknown";
}

function splitSchedule(value: string): { year: string; quarter: string; precision: string; notes: string } {
  const text = value.trim();
  if (!text) return { year: "", quarter: "Unknown", precision: "Unknown", notes: "" };
  const year = text.match(/\b(20\d{2}|19\d{2})\b/)?.[1] ?? "";
  const quarter = text.match(/\bQ([1-4])\b/i)?.[0].toUpperCase() ?? "Unknown";
  const hasIndicative = /\b(expected|planned|targeted|anticipated|indicative|approximately|about)\b/i.test(text);
  const hasExactDate = /\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}\s+[A-Za-z]+\s+\d{4}\b/.test(text);
  const precision = hasIndicative ? "Indicative" : hasExactDate ? "Exact Date" : quarter !== "Unknown" ? "Quarter" : year ? "Year" : "Unknown";
  return { year, quarter, precision, notes: text };
}

function inferOpportunityCategories(source: Row, row: Row): string {
  const text = [row.sector, row.subsector, row.projectStage, row.contractType, row.potentialOpportunities, source["Article Title"]].join(" ").toLowerCase();
  const categories = new Set<string>();
  if (/bess|battery|solar|wind|power|energy|grid|transmission|substation/.test(text)) {
    categories.add("Electrical BoP");
    categories.add("Grid Connection");
    if (/bess|battery/.test(text)) categories.add("Balance of Plant (BoP)");
    if (/transmission/.test(text)) categories.add("Transmission Lines");
    if (/substation/.test(text)) categories.add("Substations");
    categories.add("Operations & Maintenance");
  }
  if (/rail|metro|lrt|subway/.test(text)) {
    categories.add("Civil Works");
    categories.add("Rail Systems");
    categories.add("Utilities Relocation");
    categories.add("Stations / Buildings");
    categories.add("Design / Engineering");
  }
  if (/road|motorway|highway|bridge/.test(text)) {
    categories.add("Roadworks / Access Roads");
    categories.add("Earthworks");
    categories.add("Concrete Works");
    categories.add("Steel / Structural");
    categories.add("Utilities Relocation");
  }
  if (/water|wastewater|sanitation|desalination/.test(text)) {
    categories.add("Water / Wastewater");
    categories.add("Mechanical Works");
    categories.add("Design / Engineering");
    categories.add("Operations & Maintenance");
  }
  if (/data cent|digital|software|\bai\b/.test(text)) {
    categories.add("Electrical BoP");
    categories.add("Mechanical BoP");
    categories.add("Technology / Software");
    categories.add("Design / Engineering");
  }
  if (/fid|financ|investment|ppa|joint venture|equity/.test(text)) categories.add("Financing / Investment");
  if (/claim|dispute|settlement|delay|variation/.test(text)) {
    categories.add("Claims / Dispute Support");
    categories.add("Legal / Contract Advisory");
    categories.add("Commercial Management");
  }
  if (/procurement|contract|award|tender|eci|alliance|epc|epcm|design/.test(text)) {
    categories.add("Design / Engineering");
    categories.add("Project Controls");
    categories.add("Commercial Management");
  }
  return categories.size ? [...categories].join("; ") : "Unknown";
}

function inferTargetBuyerTypes(source: Row, row: Row): string {
  const text = [row.sector, row.subsector, row.projectStage, row.contractType, row.opportunityCategories, row.potentialOpportunities, source["Article Title"]].join(" ").toLowerCase();
  const buyers = new Set<string>();
  if (/epcm/.test(text)) buyers.add("EPCM Contractor");
  if (/\bepc\b/.test(text)) buyers.add("EPC Contractor");
  if (/contract|award|procurement|tender/.test(text)) buyers.add("Main Contractor");
  if (/civil|earthworks|roadworks|rail|bridge|concrete|structural|utilities/.test(text)) {
    buyers.add("Civil Contractor");
    buyers.add("Specialist Subcontractor");
  }
  if (/electrical|grid|substation|transmission|cabling|bop|battery|solar|wind/.test(text)) {
    buyers.add("Electrical Contractor");
    buyers.add("Equipment Supplier");
  }
  if (/mechanical|process|water|wastewater|lng|gas|pipeline/.test(text)) {
    buyers.add("Mechanical Contractor");
    buyers.add("Equipment Supplier");
  }
  if (/design|engineering|owner's engineer|environmental|planning/.test(text)) buyers.add("Engineering Consultant");
  if (/claim|dispute|commercial|project controls/.test(text)) buyers.add("Commercial / Claims Consultant");
  if (/legal|contract advisory/.test(text)) buyers.add("Legal Advisor");
  if (/insurance|risk/.test(text)) buyers.add("Insurer / Broker");
  if (/financ|investment|debt|equity|jv/.test(text)) buyers.add("Lender / Investor");
  if (/o&m|operations|maintenance|asset management/.test(text)) buyers.add("Operator / O&M Provider");
  if (/software|technology|data cent|digital|\bai\b/.test(text)) buyers.add("Technology Vendor");
  return buyers.size ? [...buyers].join("; ") : "Unknown";
}

function reviewStatusFor(row: Row, reasons: string[]): string {
  if (!row.latitude || !row.longitude) return "Needs Coordinates";
  if (reasons.some((reason) => reason.toLowerCase().includes("contractor"))) return "Needs Contractor Verification";
  if (reasons.some((reason) => reason.toLowerCase().includes("value"))) return "Needs Value Verification";
  if (reasons.some((reason) => reason.toLowerCase().includes("source"))) return "Needs Source Check";
  return reasons.length ? "Needs Review" : "Needs Review";
}

function addChange(changes: Row[], recordId: string, slug: string, field: string, before: string, after: string, reason: string): void {
  if (before !== after) {
    changes.push({
      changeDate: new Date().toISOString().slice(0, 10),
      recordId,
      slug,
      field,
      before,
      after,
      reason,
      changedBy: "normalize-project-records.ts"
    });
  }
}

function valuesFromMulti(value: string): string[] {
  return value.split(";").map((item) => item.trim()).filter(Boolean);
}

function validationReasons(row: Row, seenSlugs: Map<string, number>, nameGroups: Map<string, number>): string[] {
  const taxonomies = JSON.parse(readFileSync(TAXONOMIES_PATH, "utf8"));
  const reasons: string[] = [];
  const title = row.articleTitle.toLowerCase();

  if (!row.projectName) reasons.push("Missing projectName.");
  if (!row.slug) reasons.push("Missing slug.");
  if (!row.cfArticleUrl) reasons.push("Missing cfArticleUrl.");

  for (const field of [
    "region",
    "sector",
    "projectStage",
    "preConstructionApproach",
    "bdTiming",
    "constructionStartQuarter",
    "constructionStartPrecision",
    "completionTargetQuarter",
    "completionTargetPrecision",
    "confidenceLevel",
    "reviewStatus"
  ]) {
    if (!taxonomies[field].includes(row[field])) reasons.push(`${field} is outside controlled taxonomy.`);
  }
  for (const category of valuesFromMulti(row.opportunityCategories)) {
    if (!taxonomies.opportunityCategories.includes(category)) reasons.push(`opportunityCategories contains unapproved value: ${category}.`);
  }
  if ("targetBuyerTypes" in row) {
    for (const buyerType of valuesFromMulti(row.targetBuyerTypes)) {
      if (!taxonomies.targetBuyerTypes.includes(buyerType)) reasons.push(`targetBuyerTypes contains unapproved value: ${buyerType}.`);
    }
  }
  if (row.preConstructionApproach === "ECI" && !["Pre-Construction / Design", "Tendering / Procurement"].includes(row.projectStage)) {
    reasons.push("ECI usually aligns with Pre-Construction / Design or Tendering / Procurement unless source supports another stage.");
  }
  if (["FEED", "FEL"].includes(row.preConstructionApproach) && !["Pre-Construction / Design", "FID Pending", "Early Development"].includes(row.projectStage)) {
    reasons.push("FEED/FEL usually aligns with Pre-Construction / Design, FID Pending or Early Development.");
  }
  if (row.constructionStartPrecision === "Year" && row.constructionStartQuarter !== "Unknown") {
    reasons.push("constructionStartQuarter should be Unknown when only a year is known.");
  }
  if (row.completionTargetPrecision === "Year" && row.completionTargetQuarter !== "Unknown") {
    reasons.push("completionTargetQuarter should be Unknown when only a year is known.");
  }
  if (row.mapReady === "true" && (!row.latitude || !row.longitude)) reasons.push("mapReady cannot be true without latitude and longitude.");
  if (!["North America", "Europe", "Australia & NZ"].includes(row.region)) reasons.push("Outside core coverage region.");
  if (row.projectStage === "Contract Awarded" && !["Supply Chain Opportunity", "Contractor Route"].includes(row.bdTiming)) reasons.push("Contract Awarded records usually need bdTiming Supply Chain Opportunity.");
  if (row.projectStage === "Under Construction" && !["Late Stage", "Supply Chain Opportunity", "Contractor Route"].includes(row.bdTiming)) reasons.push("Under Construction records usually need bdTiming Late Stage or Supply Chain Opportunity.");
  if (row.projectStage === "Operational" && row.bdTiming !== "O&M Opportunity") reasons.push("Operational records usually need bdTiming O&M Opportunity.");
  if (/\b(fid|financial close)\b/i.test(row.articleTitle) && !row.fidStatus) reasons.push("Article mentions FID or financial close; fidStatus needs review.");
  if (/\b(awarded|wins|selected|secures|contract)\b/i.test(row.articleTitle) && (!row.procurementStatus || row.procurementStatus === "Unknown")) reasons.push("Article suggests award/contract activity; procurementStatus needs review.");
  if (/\b(financing|financial close)\b/i.test(row.articleTitle)) reasons.push("Article mentions financing/financial close; projectStage needs review.");
  if (!row.sourceUrl && !row.cfArticleUrl) reasons.push("Missing source URL.");
  if (row.confidenceLevel === "Needs Review" || /title-derived|requires article review/i.test(row.sourceNotes)) reasons.push("Title-derived record requires article/source review before approval.");
  if ((seenSlugs.get(row.slug) ?? 0) > 1) reasons.push("Duplicate slug.");

  const nearKey = [row.projectName, row.cfArticleUrl, row.country, row.stateProvince, row.cityArea].join("|").toLowerCase().replace(/[^a-z0-9|]/g, "");
  if ((nameGroups.get(nearKey) ?? 0) > 1) reasons.push("Possible duplicate or near-duplicate project/location/source combination.");
  if (title.includes("financial close") && row.projectStage !== "FID Reached") reasons.push("Financial close may indicate FID Reached; verify before changing stage.");
  return [...new Set(reasons)];
}

const rawRows = parseCsv(readFileSync(RAW_PATH, "utf8"));
const changes: Row[] = [];

const cleanRows = rawRows.map((source) => {
  const recordId = source["Record ID"] ?? "";
  const projectName = source["Project Name"] || source["Article Title"] || "Unknown";
  const originalSlug = source["Slug"] || "";
  const slug = originalSlug || slugify(projectName);
  const originalRegion = source["Region"] || "";
  const region = normalizeRegion(originalRegion);
  const originalConfidence = source["Confidence Level"] || "";
  const confidenceLevel = cleanConfidence(originalConfidence);
  const originalMapReady = source["Map Ready"] || "";
  const mapReady = normalizeBool(originalMapReady);
  const originalStage = source["Project Stage"] || "Unknown";
  const projectStage = normalizeProjectStage(originalStage);
  const preConstructionApproach = inferPreConstructionApproach(source);
  const construction = splitSchedule("");
  const completion = splitSchedule("");
  const includeInV0Map = /include in v0 map/i.test(source["MVP Inclusion"] || "") ? "true" : "false";

  addChange(changes, recordId, slug, "slug", originalSlug, slug, "Generated missing slug from projectName.");
  addChange(changes, recordId, slug, "region", originalRegion, region, "Mapped non-core region into approved taxonomy.");
  addChange(changes, recordId, slug, "projectStage", originalStage, projectStage, "Mapped v0 stage to v0.1 lifecycle taxonomy.");
  addChange(changes, recordId, slug, "preConstructionApproach", "", preConstructionApproach, "Added v0.1 pre-construction approach field.");
  addChange(changes, recordId, slug, "confidenceLevel", originalConfidence, confidenceLevel, "Mapped title-derived confidence into Needs Review.");
  addChange(changes, recordId, slug, "mapReady", originalMapReady, mapReady, "Normalized yes/no map readiness to boolean text.");
  addChange(changes, recordId, slug, "potentialOpportunities", "", source["Commercial Opportunity"] || "", "Copied commercialOpportunity into preferred v0.1 field.");

  const row: Row = {
    projectName,
    slug,
    articleTitle: source["Article Title"] || "",
    cfArticleUrl: source["CF Article URL"] || "",
    region,
    country: source["Country"] || "",
    stateProvince: source["State / Province"] || "",
    cityArea: source["City / Area"] || "",
    latitude: source["Latitude"] || "",
    longitude: source["Longitude"] || "",
    sector: source["Sector"] || "Other",
    subsector: source["Subsector"] || "",
    projectStage,
    preConstructionApproach,
    bdTiming: normalizeBdTiming(source["BD Timing"] || ""),
    projectValue: source["Project Value"] || "",
    currency: source["Currency"] || "",
    ownerDeveloper: source["Owner / Developer"] || "",
    clientAuthority: source["Client / Public Authority"] || "",
    mainContractor: source["Main Contractor / EPC / EPCM"] || "",
    keyContractors: source["Key Contractors / Suppliers"] || "",
    contractType: source["Contract / Procurement Model"] || "",
    procurementStatus: source["Procurement Status"] || "",
    fidStatus: source["FID Status"] || "",
    constructionStart: "",
    constructionStartYear: construction.year,
    constructionStartQuarter: construction.quarter,
    constructionStartPrecision: construction.precision,
    constructionStartNotes: construction.notes,
    completionTarget: "",
    completionTargetYear: completion.year,
    completionTargetQuarter: completion.quarter,
    completionTargetPrecision: completion.precision,
    completionTargetNotes: completion.notes,
    commercialOpportunity: source["Commercial Opportunity"] || "",
    potentialOpportunities: source["Commercial Opportunity"] || "",
    opportunityCategories: "",
    targetBuyerTypes: "",
    confidenceLevel,
    latestUpdateDate: source["Latest Update Date"] || source["Article Date"] || "",
    lastReviewed: source["Last Reviewed"] || "",
    sourceUrl: source["Source URL"] || source["CF Article URL"] || "",
    sourceNotes: source["Source Notes"] || "Imported from v0 source workbook.",
    reviewStatus: "Needs Review",
    mapReady,
    includeInV0Map
  };
  row.opportunityCategories = inferOpportunityCategories(source, row);
  row.targetBuyerTypes = inferTargetBuyerTypes(source, row);
  addChange(changes, recordId, slug, "opportunityCategories", "", row.opportunityCategories, "Added controlled v0.1 opportunity categories from sector, stage and title-derived project type.");
  addChange(changes, recordId, slug, "targetBuyerTypes", "", row.targetBuyerTypes, "Added controlled target buyer types for business development filtering.");
  return row;
});

const slugCounts = cleanRows.reduce((map, row) => map.set(row.slug, (map.get(row.slug) ?? 0) + 1), new Map<string, number>());
const nearCounts = cleanRows.reduce((map, row) => {
  const key = [row.projectName, row.cfArticleUrl, row.country, row.stateProvince, row.cityArea].join("|").toLowerCase().replace(/[^a-z0-9|]/g, "");
  return map.set(key, (map.get(key) ?? 0) + 1);
}, new Map<string, number>());

const reviewRows = cleanRows.flatMap((row, index) => {
  const reasons = validationReasons(row, slugCounts, nearCounts);
  row.reviewStatus = reviewStatusFor(row, reasons);
  if (row.mapReady === "true" && (!row.latitude || !row.longitude)) row.mapReady = "false";
  if (!reasons.length) return [];
  return [{
    rowNumber: String(index + 2),
    slug: row.slug,
    projectName: row.projectName,
    cfArticleUrl: row.cfArticleUrl,
    reviewStatus: row.reviewStatus,
    reason: reasons.join(" | ")
  }];
});

writeFileSync(CLEAN_PATH, stringifyCsv(cleanRows, CLEAN_FIELDS));
writeFileSync(REVIEW_PATH, stringifyCsv(reviewRows, ["rowNumber", "slug", "projectName", "cfArticleUrl", "reviewStatus", "reason"]));
writeFileSync(CHANGE_LOG_PATH, stringifyCsv(changes, ["changeDate", "recordId", "slug", "field", "before", "after", "reason", "changedBy"]));

console.log(`Normalized ${cleanRows.length} records into v0.1 schema.`);
console.log(`Queued ${reviewRows.length} records for review.`);
console.log(`Logged ${changes.length} schema and normalization changes.`);
