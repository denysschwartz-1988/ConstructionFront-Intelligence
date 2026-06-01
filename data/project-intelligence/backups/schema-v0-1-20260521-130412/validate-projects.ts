import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type Row = Record<string, string>;

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const DATA_DIR = resolve(ROOT, "data/project-intelligence");
const CLEAN_PATH = resolve(DATA_DIR, "projects_clean.csv");
const REVIEW_PATH = resolve(DATA_DIR, "projects_review_queue.csv");
const TAXONOMIES_PATH = resolve(DATA_DIR, "taxonomies.json");

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

const taxonomies = JSON.parse(readFileSync(TAXONOMIES_PATH, "utf8"));
const rows = parseCsv(readFileSync(CLEAN_PATH, "utf8"));
const slugCounts = rows.reduce((map, row) => map.set(row.slug, (map.get(row.slug) ?? 0) + 1), new Map<string, number>());
const nearCounts = rows.reduce((map, row) => {
  const key = [row.projectName, row.cfArticleUrl, row.country, row.stateProvince, row.cityArea]
    .join("|")
    .toLowerCase()
    .replace(/[^a-z0-9|]/g, "");
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
  if (!row.sourceUrl && !row.cfArticleUrl) {
    reasons.push("Missing source URL.");
  }
  if (row.confidenceLevel === "Needs Review" || /title-derived|requires article review/i.test(row.sourceNotes)) {
    reasons.push("Title-derived record requires article/source review before approval.");
  }

  const nearKey = [row.projectName, row.cfArticleUrl, row.country, row.stateProvince, row.cityArea]
    .join("|")
    .toLowerCase()
    .replace(/[^a-z0-9|]/g, "");
  if ((nearCounts.get(nearKey) ?? 0) > 1) reasons.push("Possible duplicate or near-duplicate project/location/source combination.");

  if (reasons.length) {
    const reviewStatus = !row.latitude || !row.longitude
      ? "Needs Coordinates"
      : reasons.some((reason) => reason.toLowerCase().includes("contractor"))
        ? "Needs Contractor Verification"
        : reasons.some((reason) => reason.toLowerCase().includes("value"))
          ? "Needs Value Verification"
          : reasons.some((reason) => reason.toLowerCase().includes("source"))
            ? "Needs Source Check"
            : "Needs Review";
    reviewRows.push({
      rowNumber: String(index + 2),
      slug: row.slug,
      projectName: row.projectName,
      cfArticleUrl: row.cfArticleUrl,
      reviewStatus,
      reason: [...new Set(reasons)].join(" | ")
    });
  }
}

writeFileSync(REVIEW_PATH, stringifyCsv(reviewRows, ["rowNumber", "slug", "projectName", "cfArticleUrl", "reviewStatus", "reason"]));
console.log(`Validated ${rows.length} records. ${reviewRows.length} records require review.`);
if (reviewRows.length) process.exitCode = 1;
