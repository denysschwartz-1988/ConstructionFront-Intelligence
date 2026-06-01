import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type Row = Record<string, string>;

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const DATA_DIR = resolve(ROOT, "data/project-intelligence");
const RAW_PATH = resolve(DATA_DIR, "projects_raw.csv");
const CLEAN_PATH = resolve(DATA_DIR, "projects_clean.csv");
const REVIEW_PATH = resolve(DATA_DIR, "projects_review_queue.csv");
const CHANGE_LOG_PATH = resolve(DATA_DIR, "project_change_log.csv");
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
  "completionTarget",
  "commercialOpportunity",
  "confidenceLevel",
  "latestUpdateDate",
  "lastReviewed",
  "sourceUrl",
  "sourceNotes",
  "reviewStatus",
  "mapReady",
  "includeInV0Map"
];

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
  return [
    headers.map(escape).join(","),
    ...rows.map((row) => headers.map((header) => escape(row[header])).join(","))
  ].join("\n") + "\n";
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

function validationReasons(row: Row, seenSlugs: Map<string, number>, nameGroups: Map<string, number>): string[] {
  const taxonomies = JSON.parse(readFileSync(TAXONOMIES_PATH, "utf8"));
  const reasons: string[] = [];
  const title = row.articleTitle.toLowerCase();

  if (!row.projectName) reasons.push("Missing projectName.");
  if (!row.slug) reasons.push("Missing slug.");
  if (!row.cfArticleUrl) reasons.push("Missing cfArticleUrl.");
  for (const field of ["region", "sector", "projectStage", "bdTiming", "confidenceLevel", "reviewStatus"]) {
    if (!taxonomies[field].includes(row[field])) reasons.push(`${field} is outside controlled taxonomy.`);
  }
  if (row.mapReady === "true" && (!row.latitude || !row.longitude)) {
    reasons.push("mapReady cannot be true without latitude and longitude.");
  }
  if (!["North America", "Europe", "Australia & NZ"].includes(row.region)) {
    reasons.push("Outside core coverage region.");
  }
  if (row.projectStage === "Contract Awarded" && row.bdTiming !== "Contractor Route") {
    reasons.push("Contract Awarded records usually need bdTiming Contractor Route.");
  }
  if (row.projectStage === "Under Construction" && !["Late Stage", "Contractor Route"].includes(row.bdTiming)) {
    reasons.push("Under Construction records usually need bdTiming Late Stage or Contractor Route.");
  }
  if (row.projectStage === "Operational" && row.bdTiming !== "O&M Opportunity") {
    reasons.push("Operational records usually need bdTiming O&M Opportunity.");
  }
  if (/\b(fid|financial close)\b/i.test(row.articleTitle) && !row.fidStatus) {
    reasons.push("Article mentions FID or financial close; fidStatus needs review.");
  }
  if (/\b(awarded|wins|selected|secures|contract)\b/i.test(row.articleTitle) && (!row.procurementStatus || row.procurementStatus === "Unknown")) {
    reasons.push("Article suggests award/contract activity; procurementStatus needs review.");
  }
  if (/\b(financing|financial close)\b/i.test(row.articleTitle)) {
    reasons.push("Article mentions financing/financial close; projectStage needs review.");
  }
  if (!row.sourceUrl && !row.cfArticleUrl) reasons.push("Missing source URL.");
  if (row.confidenceLevel === "Needs Review" || /title-derived|requires article review/i.test(row.sourceNotes)) {
    reasons.push("Title-derived record requires article/source review before approval.");
  }
  if ((seenSlugs.get(row.slug) ?? 0) > 1) reasons.push("Duplicate slug.");

  const nearKey = [row.projectName, row.cfArticleUrl, row.country, row.stateProvince, row.cityArea]
    .join("|")
    .toLowerCase()
    .replace(/[^a-z0-9|]/g, "");
  if ((nameGroups.get(nearKey) ?? 0) > 1) reasons.push("Possible duplicate or near-duplicate project/location/source combination.");

  if (title.includes("financial close") && row.projectStage !== "FID Reached") {
    reasons.push("Financial close may indicate FID Reached; verify before changing stage.");
  }
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
  const includeInV0Map = /include in v0 map/i.test(source["MVP Inclusion"] || "") ? "true" : "false";

  addChange(changes, recordId, slug, "slug", originalSlug, slug, "Generated missing slug from projectName.");
  addChange(changes, recordId, slug, "region", originalRegion, region, "Mapped non-core region into approved taxonomy.");
  addChange(changes, recordId, slug, "confidenceLevel", originalConfidence, confidenceLevel, "Mapped title-derived confidence into Needs Review.");
  addChange(changes, recordId, slug, "mapReady", originalMapReady, mapReady, "Normalized yes/no map readiness to boolean text.");

  return {
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
    projectStage: source["Project Stage"] || "Unknown",
    bdTiming: source["BD Timing"] || "Low Visibility",
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
    completionTarget: "",
    commercialOpportunity: source["Commercial Opportunity"] || "",
    confidenceLevel,
    latestUpdateDate: source["Latest Update Date"] || source["Article Date"] || "",
    lastReviewed: source["Last Reviewed"] || "",
    sourceUrl: source["Source URL"] || source["CF Article URL"] || "",
    sourceNotes: source["Source Notes"] || "Imported from v0 source workbook.",
    reviewStatus: "Needs Review",
    mapReady,
    includeInV0Map
  };
});

const slugCounts = cleanRows.reduce((map, row) => map.set(row.slug, (map.get(row.slug) ?? 0) + 1), new Map<string, number>());
const nearCounts = cleanRows.reduce((map, row) => {
  const key = [row.projectName, row.cfArticleUrl, row.country, row.stateProvince, row.cityArea]
    .join("|")
    .toLowerCase()
    .replace(/[^a-z0-9|]/g, "");
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

console.log(`Normalized ${cleanRows.length} records.`);
console.log(`Queued ${reviewRows.length} records for review.`);
console.log(`Logged ${changes.length} normalization changes.`);
