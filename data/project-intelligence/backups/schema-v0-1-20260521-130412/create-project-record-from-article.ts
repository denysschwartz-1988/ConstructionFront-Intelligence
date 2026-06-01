import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type Row = Record<string, string>;

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const DATA_DIR = resolve(ROOT, "data/project-intelligence");
const CLEAN_PATH = resolve(DATA_DIR, "projects_clean.csv");
const REVIEW_PATH = resolve(DATA_DIR, "projects_review_queue.csv");
const CHANGE_LOG_PATH = resolve(DATA_DIR, "project_change_log.csv");

const FIELDS = [
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

function inferProjectName(title: string): string {
  return title
    .replace(/^(.*?)(wins|awarded|selected|secures|to acquire|signs|begin construction of|forms).*?\b(for|of)\b/i, "")
    .replace(/\s+in\s+[A-Z][A-Za-z\s,&.-]+$/, "")
    .trim() || title.trim();
}

function inferSector(title: string): string {
  if (/\b(solar|wind|battery|bess|hydrogen|transmission|grid|power|renewable|gas|ppa)\b/i.test(title)) return "Energy";
  if (/\b(rail|road|highway|metro|airport|port|transport)\b/i.test(title)) return "Transport";
  if (/\b(water|desalination|wastewater|reservoir)\b/i.test(title)) return "Water";
  if (/\b(data centre|data center|digital|fibre|fiber|cloud)\b/i.test(title)) return "Digital Infrastructure";
  if (/\b(hospital|school|housing|university)\b/i.test(title)) return "Social Infrastructure";
  if (/\b(mine|mining|industrial|factory|plant)\b/i.test(title)) return "Industrial / Mining";
  return "Other";
}

function inferStage(title: string): string {
  if (/\b(financial close|fid reached)\b/i.test(title)) return "FID Reached";
  if (/\b(fid|financing)\b/i.test(title)) return "FID Pending";
  if (/\b(wins|awarded|selected|secures|contract)\b/i.test(title)) return "Contract Awarded";
  if (/\b(begin construction|starts construction|under construction)\b/i.test(title)) return "Under Construction";
  if (/\b(tender|procurement|rfq|rft|rfp)\b/i.test(title)) return "Tendering / Procurement";
  return "Unknown";
}

const title = arg("title");
const url = arg("url");
if (!title || !url) {
  console.error("Usage: node create-project-record-from-article.ts --title \"Article title\" --url \"https://...\" [--date YYYY-MM-DD] [--append]");
  process.exit(1);
}

const projectName = arg("projectName") || inferProjectName(title);
const stage = inferStage(title);
const row: Row = {
  projectName,
  slug: slugify(projectName),
  articleTitle: title,
  cfArticleUrl: url,
  region: "Other",
  country: "Unknown",
  stateProvince: "",
  cityArea: "",
  latitude: "",
  longitude: "",
  sector: inferSector(title),
  subsector: "",
  projectStage: stage,
  bdTiming: stage === "Contract Awarded" ? "Contractor Route" : stage === "Under Construction" ? "Late Stage" : "Low Visibility",
  projectValue: "",
  currency: "",
  ownerDeveloper: "",
  clientAuthority: "",
  mainContractor: "",
  keyContractors: "",
  contractType: "",
  procurementStatus: /\b(wins|awarded|selected|secures|contract)\b/i.test(title) ? "Needs Review" : "",
  fidStatus: /\b(fid|financial close)\b/i.test(title) ? "Needs Review" : "",
  constructionStart: "",
  completionTarget: "",
  commercialOpportunity: "Draft record from article title and URL. Review source before approval.",
  confidenceLevel: "Needs Review",
  latestUpdateDate: arg("date") || new Date().toISOString().slice(0, 10),
  lastReviewed: "",
  sourceUrl: url,
  sourceNotes: "Draft generated from ConstructionFront article title and URL only. Verify against full article and official source.",
  reviewStatus: "Needs Review",
  mapReady: "false",
  includeInV0Map: "false"
};

if (process.argv.includes("--append")) {
  const cleanRows = existsSync(CLEAN_PATH) ? parseCsv(readFileSync(CLEAN_PATH, "utf8")) : [];
  cleanRows.push(row);
  writeFileSync(CLEAN_PATH, stringifyCsv(cleanRows, FIELDS));

  const reviewRows = existsSync(REVIEW_PATH) ? parseCsv(readFileSync(REVIEW_PATH, "utf8")) : [];
  reviewRows.push({
    rowNumber: String(cleanRows.length + 1),
    slug: row.slug,
    projectName: row.projectName,
    cfArticleUrl: row.cfArticleUrl,
    reviewStatus: "Needs Review",
    reason: "New draft article record requires human source review, taxonomy confirmation, location, coordinates, owner/contractor/value verification."
  });
  writeFileSync(REVIEW_PATH, stringifyCsv(reviewRows, ["rowNumber", "slug", "projectName", "cfArticleUrl", "reviewStatus", "reason"]));

  const changeRows = existsSync(CHANGE_LOG_PATH) ? parseCsv(readFileSync(CHANGE_LOG_PATH, "utf8")) : [];
  changeRows.push({
    changeDate: new Date().toISOString().slice(0, 10),
    recordId: "",
    slug: row.slug,
    field: "record",
    before: "",
    after: "draft created",
    reason: "Generated draft project record from article title and URL.",
    changedBy: "create-project-record-from-article.ts"
  });
  writeFileSync(CHANGE_LOG_PATH, stringifyCsv(changeRows, ["changeDate", "recordId", "slug", "field", "before", "after", "reason", "changedBy"]));
  console.log(`Appended draft record for ${row.slug}.`);
} else {
  console.log(JSON.stringify(row, null, 2));
}
