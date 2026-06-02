import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve("C:/Users/denys/OneDrive/Documentos/New project 3");
const dataDir = "C:/Users/denys/Documents/intelligence platform/data/project-intelligence/v2";
const supabaseUrl = "https://sewvfcwdoswqvpsqtjdj.supabase.co";

function loadEnv() {
  const envPath = resolve(root, ".env.local");
  try {
    for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match && process.env[match[1]] === undefined) {
        process.env[match[1]] = match[2];
      }
    }
  } catch {
    // Optional; CI/shell env can provide the service key.
  }
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }

  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }

  const [rawHeaders, ...records] = rows;
  const headers = rawHeaders.map((header, index) => (index === 0 ? header.replace(/^\uFEFF/, "") : header));
  return records
    .filter((record) => record.some((value) => value !== ""))
    .map((record) => Object.fromEntries(headers.map((header, index) => [header, record[index] ?? ""])));
}

function readCsv(name) {
  return parseCsv(readFileSync(resolve(dataDir, name), "utf8"));
}

function normalizeValue(value) {
  if (value === "") return null;
  if (/^Q[1-4]$/.test(value)) return Number(value.slice(1));
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  if (value === "TRUE") return true;
  if (value === "FALSE") return false;
  return value;
}

function normalizeRows(rows) {
  return rows.map((row) => {
    const normalized = {};
    for (const [key, value] of Object.entries(row)) {
      normalized[key] = normalizeValue(value);
    }
    return normalized;
  });
}

function pickRows() {
  const sourceIds = new Set(Array.from({ length: 20 }, (_, i) => `SRC-${String(i + 187).padStart(4, "0")}`));
  const milestoneIds = new Set(Array.from({ length: 10 }, (_, i) => `MIL-${String(i + 66).padStart(4, "0")}`));
  const partyIds = new Set(Array.from({ length: 42 }, (_, i) => `PAR-${String(i + 182).padStart(4, "0")}`));
  const slugs = new Set([
    "windsor-woods-princess-anne-plaza-the-lakes-stormwater-improvements",
    "eagle-springs-solar-storage-project",
    "lupinus-1-solar-storage-project",
    "lupinus-2-solar-storage-project",
    "zeevonk-offshore-wind-project",
    "zeevonk-inter-array-cable-package",
  ]);

  return {
    project_sources: readCsv("project_sources.csv").filter((row) => sourceIds.has(row.sourceId)),
    projects_master: readCsv("projects_master.csv").filter((row) => slugs.has(row.projectSlug)),
    project_milestones: readCsv("project_milestones.csv").filter((row) => milestoneIds.has(row.milestoneId)),
    project_parties: readCsv("project_parties.csv").filter((row) => partyIds.has(row.partyId)),
  };
}

async function supabaseRequest(table, key, { method = "GET", body, count = false } = {}) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}${count ? "?select=*" : ""}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: count ? "count=exact" : "return=minimal",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${table} ${method} failed: ${response.status} ${text}`);
  }

  return response;
}

async function countRows(table, key) {
  const response = await supabaseRequest(table, key, { method: "HEAD", count: true });
  const range = response.headers.get("content-range") ?? "*/0";
  return Number(range.split("/").at(-1));
}

function csvCount(table) {
  const filename = {
    project_sources: "project_sources.csv",
    projects_master: "projects_master.csv",
    project_milestones: "project_milestones.csv",
    project_parties: "project_parties.csv",
  }[table];
  return readCsv(filename).length;
}

loadEnv();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;
if (!serviceKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY. Set it in the shell or .env.local before running.");
}

const batches = pickRows();
const order = ["projects_master", "project_sources", "project_milestones", "project_parties"];
const expectedBatchSizes = {
  project_sources: 20,
  projects_master: 6,
  project_milestones: 10,
  project_parties: 42,
};

for (const table of order) {
  const rows = batches[table];
  if (rows.length !== expectedBatchSizes[table]) {
    throw new Error(`${table}: expected ${expectedBatchSizes[table]} batch rows, found ${rows.length}`);
  }

  await supabaseRequest(table, serviceKey, {
    method: "POST",
    body: normalizeRows(rows),
  });

  const supabaseCount = await countRows(table, serviceKey);
  const localCsvCount = csvCount(table);
  if (supabaseCount !== localCsvCount) {
    throw new Error(`${table}: Supabase count ${supabaseCount} does not match CSV count ${localCsvCount}`);
  }

  console.log(`${table}: inserted ${rows.length}; Supabase count ${supabaseCount} matches CSV count ${localCsvCount}`);
}
