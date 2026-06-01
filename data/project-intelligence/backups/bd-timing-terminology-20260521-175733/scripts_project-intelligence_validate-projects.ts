import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type Row = Record<string, string>;

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const DATA_DIR = resolve(ROOT, "data/project-intelligence");
const DEFAULT_CLEAN_PATH = resolve(DATA_DIR, existsSync(resolve(DATA_DIR, "projects_clean_v0_1.csv")) ? "projects_clean_v0_1.csv" : "projects_clean.csv");
const CLEAN_PATH = arg("input") || DEFAULT_CLEAN_PATH;
const REVIEW_PATH = arg("review-output") || resolve(DATA_DIR, CLEAN_PATH.endsWith("projects_clean_v0_1.csv") ? "projects_review_queue_v0_1.csv" : "projects_review_queue.csv");
const TAXONOMIES_PATH = resolve(DATA_DIR, "taxonomies.json");

function arg(name: string): string {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? "" : process.argv[index + 1] ?? "";
}

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
  return rows.filter((values) => values.some(Boolean)).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
}

function stringifyCsv(rows: Row[], headers: string[]): string {
  const escape = (value: unknown) => {
    const text = value === undefined || value === null ? "" : String(value);
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, "\"\"")}"` : text;
  };
  return [headers.map(escape).join(","), ...rows.map((row) => headers.map((header) => escape(row[header])).join(","))].join("\n") + "\n";
}

function multiValues(value: string): string[] {
  return value.split(";").map((item) => item.trim()).filter(Boolean);
}

function validateMultiTaxonomy(row: Row, field: string, taxonomy: string[], reasons: string[]): void {
  for (const value of multiValues(row[field] || "")) {
    if (!taxonomy.includes(value)) reasons.push(`${field} contains unapproved value: ${value}.`);
  }
}

function isV01(row: Row): boolean {
  return "preConstructionApproach" in row;
}

function reviewStatusFor(row: Row, reasons: string[]): string {
  if (!row.latitude || !row.longitude) return "Needs Coordinates";
  if (reasons.some((reason) => reason.toLowerCase().includes("contractor"))) return "Needs Contractor Verification";
  if (reasons.some((reason) => reason.toLowerCase().includes("value"))) return "Needs Value Verification";
  if (reasons.some((reason) => reason.toLowerCase().includes("source"))) return "Needs Source Check";
  return reasons.length ? "Needs Review" : "Needs Review";
}

function hasRawIntegerValue(value: string): boolean {
  return /^\d{7,}$/.test((value || "").trim());
}

function validateValueFields(row: Row, prefix: "projectValue" | "eventValue", reasons: string[]): void {
  const amount = row[`${prefix}Amount`] || "";
  const currency = row[`${prefix}Currency`] || "";
  const scale = row[`${prefix}Scale`] || "";
  const basis = row[`${prefix}Basis`] || "";
  const notes = row[`${prefix}Notes`] || "";

  if (scale && !taxonomies.valueScale.includes(scale)) reasons.push(`${prefix}Scale is outside controlled taxonomy: ${scale}.`);
  if (basis && !taxonomies.valueBasis.includes(basis)) reasons.push(`${prefix}Basis is outside controlled taxonomy: ${basis}.`);
  if (hasRawIntegerValue(amount)) reasons.push(`${prefix}Amount appears to be a raw integer value; use display-scale amount with valueScale.`);
  if (amount && (!currency || !scale)) reasons.push(`${prefix}Currency and ${prefix}Scale are required when ${prefix}Amount is populated.`);
  if (amount && !notes) reasons.push(`${prefix}Notes should explain what the value represents.`);
  if (!amount && basis && basis !== "Unknown" && !notes) reasons.push(`${prefix}Notes should explain missing amount or value basis.`);
}

const taxonomies = JSON.parse(readFileSync(TAXONOMIES_PATH, "utf8"));
const rows = parseCsv(readFileSync(CLEAN_PATH, "utf8"));
const isUpdateTable = rows.length > 0 && "updateId" in rows[0] && "milestoneType" in rows[0];
const isProjectMasterTable = rows.length > 0 && "projectSlug" in rows[0] && "currentProjectStage" in rows[0];

if (isUpdateTable) {
  const invalidRows: Row[] = [];
  for (const [index, row] of rows.entries()) {
    const reasons: string[] = [];
    if (!row.updateId) reasons.push("Missing updateId.");
    if (!row.projectSlug) reasons.push("Missing projectSlug.");
    if (!row.articleTitle) reasons.push("Missing articleTitle.");
    if (!row.cfArticleUrl) reasons.push("Missing cfArticleUrl.");
    if (!row.milestoneType) reasons.push("Missing milestoneType.");
    if (row.milestoneType && !taxonomies.milestoneType.includes(row.milestoneType)) {
      reasons.push(`milestoneType is outside controlled taxonomy: ${row.milestoneType}.`);
    }
    if ("milestoneSummary" in row && !row.milestoneSummary) {
      reasons.push("Missing milestoneSummary.");
    }
    if ("eventValueAmount" in row) validateValueFields(row, "eventValue", reasons);
    if (reasons.length) {
      invalidRows.push({
        rowNumber: String(index + 2),
        slug: row.projectSlug,
        projectName: row.updateId,
        cfArticleUrl: row.cfArticleUrl,
        reviewStatus: "Needs Review",
        reason: [...new Set(reasons)].join(" | ")
      });
    }
  }
  writeFileSync(REVIEW_PATH, stringifyCsv(invalidRows, ["rowNumber", "slug", "projectName", "cfArticleUrl", "reviewStatus", "reason"]));
  console.log(`Validated ${rows.length} update/event records from ${CLEAN_PATH}. ${invalidRows.length} records require review.`);
  if (invalidRows.length) process.exitCode = 1;
  process.exit();
}

if (isProjectMasterTable) {
  const invalidRows: Row[] = [];
  for (const [index, row] of rows.entries()) {
    const reasons: string[] = [];
    if (!row.projectSlug) reasons.push("Missing projectSlug.");
    if (!row.projectName) reasons.push("Missing projectName.");
    if (!row.currentProjectStage || !taxonomies.projectStage.includes(row.currentProjectStage)) {
      reasons.push(`currentProjectStage is outside controlled taxonomy: ${row.currentProjectStage}.`);
    }
    if ("mapAnchorType" in row && !taxonomies.mapAnchorType.includes(row.mapAnchorType)) {
      reasons.push(`mapAnchorType is outside controlled taxonomy: ${row.mapAnchorType}.`);
    }
    if (row.mapEligibilityStatus === "Map Ready" && row.mapAnchorType !== "Exact Project Location") {
      reasons.push("Map Ready records should use mapAnchorType Exact Project Location.");
    }
    if (row.mapEligibilityStatus === "Map Ready - Approximate" && (!row.latitude || !row.longitude)) {
      reasons.push("Map Ready - Approximate records require latitude and longitude.");
    }
    if (row.locationPrecision === "National" && row.mapEligibilityStatus === "Map Ready - Approximate") {
      if (!["Country Capital Anchor", "Programme / Portfolio Anchor"].includes(row.mapAnchorType)) {
        reasons.push("National approximate records must use Country Capital Anchor or Programme / Portfolio Anchor.");
      }
      if (!/anchor only|not (a|the) physical project location|not exact|display anchor/i.test(row.mapEligibilityNotes || "")) {
        reasons.push("National approximate records need mapEligibilityNotes explaining the display anchor is not the physical project location.");
      }
    }
    if (row.locationPrecision === "National" && row.mapAnchorType === "Exact Project Location") {
      reasons.push("National records cannot use Exact Project Location.");
    }
    if (/Map Ready - Approximate/.test(row.mapEligibilityStatus || "") && !row.mapEligibilityNotes) {
      reasons.push("Approximate map-ready records need mapEligibilityNotes.");
    }
    if ("opportunityCategories" in row) {
      validateMultiTaxonomy(row, "opportunityCategories", taxonomies.opportunityCategories, reasons);
      if (!row.opportunityCategories) reasons.push("Missing opportunityCategories.");
    }
    if ("targetBuyerTypes" in row) {
      validateMultiTaxonomy(row, "targetBuyerTypes", taxonomies.targetBuyerTypes, reasons);
      if (!row.targetBuyerTypes) reasons.push("Missing targetBuyerTypes.");
    }
    if ("projectValueAmount" in row) validateValueFields(row, "projectValue", reasons);
    if (reasons.length) {
      invalidRows.push({
        rowNumber: String(index + 2),
        slug: row.projectSlug,
        projectName: row.projectName,
        cfArticleUrl: row.latestCfArticleUrl || "",
        reviewStatus: "Needs Review",
        reason: [...new Set(reasons)].join(" | ")
      });
    }
  }
  writeFileSync(REVIEW_PATH, stringifyCsv(invalidRows, ["rowNumber", "slug", "projectName", "cfArticleUrl", "reviewStatus", "reason"]));
  console.log(`Validated ${rows.length} project master records from ${CLEAN_PATH}. ${invalidRows.length} records require review.`);
  if (invalidRows.length) process.exitCode = 1;
  process.exit();
}

const slugCounts = rows.reduce((map, row) => map.set(row.slug, (map.get(row.slug) ?? 0) + 1), new Map<string, number>());
const nearCounts = rows.reduce((map, row) => {
  const key = [row.projectName, row.cfArticleUrl, row.country, row.stateProvince, row.cityArea].join("|").toLowerCase().replace(/[^a-z0-9|]/g, "");
  return map.set(key, (map.get(key) ?? 0) + 1);
}, new Map<string, number>());

const reviewRows: Row[] = [];

for (const [index, row] of rows.entries()) {
  const reasons: string[] = [];
  if (!row.projectName) reasons.push("Missing projectName.");
  if (!row.slug) reasons.push("Missing slug.");
  if ((slugCounts.get(row.slug) ?? 0) > 1) reasons.push("Duplicate slug.");
  if (!row.cfArticleUrl) reasons.push("Missing cfArticleUrl.");

  for (const field of ["region", "sector", "projectStage", "bdTiming", "confidenceLevel", "reviewStatus"]) {
    if (!taxonomies[field].includes(row[field])) reasons.push(`${field} is outside controlled taxonomy.`);
  }

  if (isV01(row)) {
    for (const field of ["preConstructionApproach", "constructionStartQuarter", "constructionStartPrecision", "completionTargetQuarter", "completionTargetPrecision"]) {
      if (!taxonomies[field].includes(row[field])) reasons.push(`${field} is outside controlled taxonomy.`);
    }
    for (const category of multiValues(row.opportunityCategories)) {
      if (!taxonomies.opportunityCategories.includes(category)) reasons.push(`opportunityCategories contains unapproved value: ${category}.`);
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
    if (!row.potentialOpportunities) reasons.push("Missing potentialOpportunities.");
    if (!row.opportunityCategories) reasons.push("Missing opportunityCategories.");
  }

  if (row.mapReady === "true" && (!row.latitude || !row.longitude)) reasons.push("mapReady cannot be true without latitude and longitude.");
  if (!["North America", "Europe", "Australia & NZ"].includes(row.region)) reasons.push("Outside core coverage region.");
  if (row.projectStage === "Contract Awarded" && row.bdTiming !== "Contractor Route") reasons.push("Contract Awarded records usually need bdTiming Contractor Route.");
  if (row.projectStage === "Under Construction" && !["Late Stage", "Contractor Route"].includes(row.bdTiming)) reasons.push("Under Construction records usually need bdTiming Late Stage or Contractor Route.");
  if (row.projectStage === "Operational" && row.bdTiming !== "O&M Opportunity") reasons.push("Operational records usually need bdTiming O&M Opportunity.");
  if (/\b(fid|financial close)\b/i.test(row.articleTitle) && !row.fidStatus) reasons.push("Article mentions FID or financial close; fidStatus needs review.");
  if (/\b(awarded|wins|selected|secures|contract)\b/i.test(row.articleTitle) && (!row.procurementStatus || row.procurementStatus === "Unknown")) reasons.push("Article suggests award/contract activity; procurementStatus needs review.");
  if (/\b(financing|financial close)\b/i.test(row.articleTitle)) reasons.push("Article mentions financing/financial close; projectStage needs review.");
  if (!row.sourceUrl && !row.cfArticleUrl) reasons.push("Missing source URL.");
  if (row.confidenceLevel === "Needs Review" || /title-derived|requires article review/i.test(row.sourceNotes)) reasons.push("Title-derived record requires article/source review before approval.");

  const nearKey = [row.projectName, row.cfArticleUrl, row.country, row.stateProvince, row.cityArea].join("|").toLowerCase().replace(/[^a-z0-9|]/g, "");
  if ((nearCounts.get(nearKey) ?? 0) > 1) reasons.push("Possible duplicate or near-duplicate project/location/source combination.");

  if (reasons.length) {
    reviewRows.push({
      rowNumber: String(index + 2),
      slug: row.slug,
      projectName: row.projectName,
      cfArticleUrl: row.cfArticleUrl,
      reviewStatus: reviewStatusFor(row, reasons),
      reason: [...new Set(reasons)].join(" | ")
    });
  }
}

writeFileSync(REVIEW_PATH, stringifyCsv(reviewRows, ["rowNumber", "slug", "projectName", "cfArticleUrl", "reviewStatus", "reason"]));
console.log(`Validated ${rows.length} records from ${CLEAN_PATH}. ${reviewRows.length} records require review.`);
if (reviewRows.length) process.exitCode = 1;
