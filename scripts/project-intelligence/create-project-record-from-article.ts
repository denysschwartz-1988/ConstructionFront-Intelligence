import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type Row = Record<string, string>;

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const DATA_DIR = resolve(ROOT, "data/project-intelligence");
const CLEAN_PATH = resolve(DATA_DIR, "projects_clean_v0_1.csv");
const REVIEW_PATH = resolve(DATA_DIR, "projects_review_queue_v0_1.csv");
const CHANGE_LOG_PATH = resolve(DATA_DIR, "project_change_log_v0_1.csv");

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
  return value.normalize("NFKD").replace(/[^\w\s-]/g, "").trim().toLowerCase().replace(/[_\s]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function inferProjectName(title: string): string {
  return title
    .replace(/^(.*?)(wins|awarded|selected|secures|to acquire|signs|begin construction of|forms).*?\b(for|of)\b/i, "")
    .replace(/\s+in\s+[A-Z][A-Za-z\s,&.-]+$/, "")
    .trim() || title.trim();
}

function inferSector(title: string): string {
  if (/\b(solar|wind|battery|bess|hydrogen|transmission|grid|power|renewable|gas|lng|ppa)\b/i.test(title)) return "Energy";
  if (/\b(rail|road|highway|metro|airport|port|transport|bridge)\b/i.test(title)) return "Transport";
  if (/\b(water|desalination|wastewater|sanitation|reservoir)\b/i.test(title)) return "Water";
  if (/\b(data centre|data center|digital|fibre|fiber|cloud|ai)\b/i.test(title)) return "Digital Infrastructure";
  if (/\b(hospital|school|housing|university)\b/i.test(title)) return "Social Infrastructure";
  if (/\b(mine|mining|industrial|factory|plant)\b/i.test(title)) return "Industrial / Mining";
  return "Other";
}

function inferStage(title: string): string {
  if (/\b(financial close|fid reached)\b/i.test(title)) return "FID Reached";
  if (/\b(fid|financing)\b/i.test(title)) return "FID Pending";
  if (/\b(ecI|early contractor involvement|pre-construction|reference design|feed|fel)\b/i.test(title)) return "Pre-Construction / Design";
  if (/\b(wins|awarded|selected|secures|contract)\b/i.test(title)) return "Contract Awarded";
  if (/\b(begin construction|starts construction|under construction|break ground|groundbreaking)\b/i.test(title)) return "Under Construction";
  if (/\b(tender|procurement|rfq|rft|rfp)\b/i.test(title)) return "Tendering / Procurement";
  return "Unknown";
}

function inferPreConstructionApproach(title: string): string {
  if (/\balliance\b/i.test(title) && /\bdevelopment\b/i.test(title)) return "Alliance Development Phase";
  if (/\bpre[-\s]?construction\b/i.test(title)) return "Pre-Construction Services";
  if (/\beci\b|early contractor involvement/i.test(title)) return "ECI";
  if (/\breference design\b/i.test(title)) return "Reference Design";
  if (/\bdetailed design\b/i.test(title)) return "Detailed Design";
  if (/\bfeed\b/i.test(title)) return "FEED";
  if (/\bfel\b/i.test(title)) return "FEL";
  return "Unknown";
}

function inferOpportunityCategories(title: string, sector: string): string {
  const text = `${title} ${sector}`.toLowerCase();
  const categories = new Set<string>();
  if (/solar|wind|battery|bess|grid|transmission|power|lng|gas/.test(text)) {
    if (/battery|bess/.test(text)) categories.add("Balance of Plant (BoP)");
    categories.add("Electrical BoP");
    categories.add("Grid Connection");
    categories.add("Operations & Maintenance");
  }
  if (/rail|metro|lrt/.test(text)) {
    categories.add("Civil Works");
    categories.add("Rail Systems");
    categories.add("Utilities Relocation");
  }
  if (/road|highway|motorway|bridge/.test(text)) {
    categories.add("Roadworks / Access Roads");
    categories.add("Earthworks");
    categories.add("Concrete Works");
    categories.add("Steel / Structural");
  }
  if (/water|wastewater|sanitation/.test(text)) categories.add("Water / Wastewater");
  if (/data cent|digital|software|\bai\b/.test(text)) categories.add("Technology / Software");
  if (/fid|financ|ppa|investment/.test(text)) categories.add("Financing / Investment");
  if (/contract|award|procurement|design|eci|feed|fel/.test(text)) {
    categories.add("Design / Engineering");
    categories.add("Commercial Management");
  }
  return categories.size ? [...categories].join("; ") : "Unknown";
}

function inferTargetBuyerTypes(title: string, sector: string, categories: string): string {
  const text = `${title} ${sector} ${categories}`.toLowerCase();
  const buyers = new Set<string>();
  if (/epcm/.test(text)) buyers.add("EPCM Contractor");
  if (/\bepc\b/.test(text)) buyers.add("EPC Contractor");
  if (/contract|award|procurement|tender/.test(text)) buyers.add("Main Contractor");
  if (/civil|earthworks|roadworks|rail|bridge|concrete|structural|utilities/.test(text)) {
    buyers.add("Civil Contractor");
    buyers.add("Specialist Subcontractor");
  }
  if (/electrical|grid|transmission|battery|bess|solar|wind/.test(text)) {
    buyers.add("Electrical Contractor");
    buyers.add("Equipment Supplier");
  }
  if (/mechanical|water|wastewater|lng|gas/.test(text)) buyers.add("Mechanical Contractor");
  if (/design|engineering|eci|feed|fel/.test(text)) buyers.add("Engineering Consultant");
  if (/financ|investment|ppa/.test(text)) buyers.add("Lender / Investor");
  if (/operations|maintenance|o&m/.test(text)) buyers.add("Operator / O&M Provider");
  if (/software|technology|data cent|digital|\bai\b/.test(text)) buyers.add("Technology Vendor");
  return buyers.size ? [...buyers].join("; ") : "Unknown";
}

const title = arg("title");
const url = arg("url");
if (!title || !url) {
  console.error("Usage: node create-project-record-from-article.ts --title \"Article title\" --url \"https://...\" [--date YYYY-MM-DD] [--append]");
  process.exit(1);
}

const projectName = arg("projectName") || inferProjectName(title);
const stage = inferStage(title);
const sector = inferSector(title);
const opportunityCategories = inferOpportunityCategories(title, sector);
const potentialOpportunities = "Draft record from article title and URL. Review suppliers, subcontractors, consultants, commercial consultants, claims consultants, legal/contract advisors, insurance/risk advisors and other stakeholders before approval.";
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
  sector,
  subsector: "",
  projectStage: stage,
  preConstructionApproach: inferPreConstructionApproach(title),
  bdTiming: stage === "Contract Awarded" ? "Supply Chain Opportunity" : stage === "Under Construction" ? "Late Stage" : "Low Visibility",
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
  constructionStartYear: "",
  constructionStartQuarter: "Unknown",
  constructionStartPrecision: "Unknown",
  constructionStartNotes: "",
  completionTarget: "",
  completionTargetYear: "",
  completionTargetQuarter: "Unknown",
  completionTargetPrecision: "Unknown",
  completionTargetNotes: "",
  commercialOpportunity: potentialOpportunities,
  potentialOpportunities,
  opportunityCategories,
  targetBuyerTypes: inferTargetBuyerTypes(title, sector, opportunityCategories),
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
    reason: "New v0.1 draft article record requires human source review, taxonomy confirmation, structured schedule review, opportunity category review, location, coordinates, owner/contractor/value verification."
  });
  writeFileSync(REVIEW_PATH, stringifyCsv(reviewRows, ["rowNumber", "slug", "projectName", "cfArticleUrl", "reviewStatus", "reason"]));

  const changeRows = existsSync(CHANGE_LOG_PATH) ? parseCsv(readFileSync(CHANGE_LOG_PATH, "utf8")) : [];
  changeRows.push({
    changeDate: new Date().toISOString().slice(0, 10),
    recordId: "",
    slug: row.slug,
    field: "record",
    before: "",
    after: "v0.1 draft created",
    reason: "Generated draft project record from article title and URL.",
    changedBy: "create-project-record-from-article.ts"
  });
  writeFileSync(CHANGE_LOG_PATH, stringifyCsv(changeRows, ["changeDate", "recordId", "slug", "field", "before", "after", "reason", "changedBy"]));
  console.log(`Appended v0.1 draft record for ${row.slug}.`);
} else {
  console.log(JSON.stringify(row, null, 2));
}
