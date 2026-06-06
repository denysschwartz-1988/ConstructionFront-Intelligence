import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const supabaseUrl = "https://sewvfcwdoswqvpsqtjdj.supabase.co";
const worldGeoJsonUrl = "https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json";
const msPerDay = 24 * 60 * 60 * 1000;

const newsletterEditorialPrompt = `You are the editor of ConstructionFront's weekly infrastructure and construction intelligence brief.

Your job is to turn structured ConstructionFront project records into a concise, commercially useful newsletter. The output should feel like an intelligence brief, not a list of links.

Editorial objective:
- Explain what changed this week.
- Explain why those changes matter.
- Connect this week's coverage to recent ConstructionFront coverage from the last 60 days where there is a real editorial relationship.
- Use evergreen ConstructionFront Knowledge Hub links naturally inside the prose when they clarify terms, contract models, claims concepts, delivery structures or project-development milestones.
- Keep the brief succinct. Prefer a few useful signals over broad commentary.

Tone:
- Professional, practical and commercially aware.
- Clear enough for contractors, consultants, suppliers, investors and owner-side readers.
- Analytical, but not overconfident.
- Avoid hype, vague macro claims and unsupported causality.
- Use "suggests", "points to", "fits with", "is relevant to" when the connection is inferential.
- Use stronger wording only when the supplied records directly support it.

Market Readout logic:
- Identify the leading sectors, regions, project stages and named contractors in the weekly records.
- Interpret whether the week is more about early-stage development, financing/FID, procurement, contract awards, construction progress or operational movement.
- Explain what that means for market participants.
- If contract awards dominate, focus on delivery teams forming and follow-on package opportunities.
- If FID/procurement dominates, focus on upcoming tendering and positioning.
- If early development dominates, focus on monitoring approvals, financing and owner-side moves.

Connected Context logic:
- First prefer same-project or parent-project links from the last 60 days.
- Then look for same owner/developer, client authority, contractor or JV.
- Then look for same sector plus same region.
- Then look for similar milestone sequences, such as FID followed by EPC/EPCI award, RFQ followed by shortlist, award followed by NTP, or financing followed by procurement.
- Do not imply one article caused another. Phrase connections as editorial context.

Evergreen link policy:
- Evergreen links should appear naturally inside sentences, not as a dumped reading list.
- Link terms such as FID, EPC, EPCI, EPCM, procurement, PPP, Balance of Plant, Notice to Proceed, EOT, delay, variation, RFI, time bar, FEED and contract administration only where they help the reader.
- Use at most a few evergreen links per section.
- Do not link every possible term.

Map rationale:
- The map is used to show where contract awards landed this week.
- It should support geographic pattern recognition, not replace the project list.
- If multiple awards cluster in one region, mention that in the award or market interpretation.

Output structure:
1. Weekly snapshot
2. Market Readout
3. Connected Context
4. Contract Awards Map
5. Top Project Updates
6. Signals To Watch

Guardrails:
- Do not invent values, contractors, dates, financing status or causal relationships.
- Do not mention data gaps unless they materially affect the interpretation.
- If a connection is weak, omit it or phrase it as a related signal.
- Always link back to ConstructionFront articles where URLs are provided.`;

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
    // Optional for local fallback mode.
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
  const headers = rawHeaders.map((header, index) =>
    index === 0 ? header.replace(/^\uFEFF/, "") : header
  );

  return records
    .filter((record) => record.some((value) => value !== ""))
    .map((record) =>
      Object.fromEntries(headers.map((header, index) => [header, record[index] ?? ""]))
    );
}

function readLocalProjects() {
  const csvPath = resolve(root, "data/project-intelligence/projects_clean.csv");
  const rows = parseCsv(readFileSync(csvPath, "utf8"));
  return rows.map((row) => ({
    projectSlug: row.projectSlug || row.slug,
    projectName: row.projectName,
    region: row.region,
    country: row.country,
    stateProvince: row.stateProvince,
    cityArea: row.cityArea,
    latitude: toNumber(row.latitude),
    longitude: toNumber(row.longitude),
    sector: row.sector,
    subsector: row.subsector,
    currentProjectStage: row.currentProjectStage || row.projectStage,
    latestMilestone: row.latestMilestone || row.contractType || row.procurementStatus,
    latestMilestoneSummary: row.latestMilestoneSummary || row.articleTitle,
    projectSummary: row.projectSummary || row.commercialOpportunity,
    latestUpdateSummary: row.latestUpdateSummary || row.articleTitle,
    latestCfArticleUrl: row.latestCfArticleUrl || row.cfArticleUrl,
    ownerDeveloper: row.ownerDeveloper,
    clientAuthority: row.clientAuthority,
    leadContractor: row.leadContractor || row.mainContractor,
    bdTiming: row.bdTiming,
    projectValueAmount: toNumber(row.projectValueAmount || row.projectValue),
    projectValueCurrency: row.projectValueCurrency || row.currency,
    projectValueScale: row.projectValueScale,
    latestUpdateDate: row.latestUpdateDate,
    lastUpdated: row.lastUpdated || row.lastReviewed,
  }));
}

function readLocalSources(projects) {
  return projects
    .filter((project) => project.latestCfArticleUrl)
    .map((project, index) => ({
      sourceId: `LOCAL-SRC-${index + 1}`,
      projectSlug: project.projectSlug,
      sourceType: "ConstructionFront article",
      sourceTitle: project.latestUpdateSummary || project.projectName,
      sourceUrl: project.latestCfArticleUrl,
      publicationDate: project.latestUpdateDate || project.lastUpdated,
      publisher: "ConstructionFront",
      summary: project.latestUpdateSummary || project.projectSummary,
    }));
}

function readEvergreenArticles() {
  const csvPath = resolve(root, "00 CF News article prompt/CF_URLs.csv");
  try {
    return parseCsv(readFileSync(csvPath, "utf8"))
      .filter((row) => row.Title && row.URL?.includes("constructionfront.com"))
      .filter((row) => !["home", "resources", "about us", "contact us"].includes(row.Title.toLowerCase()))
      .filter((row) => {
        const categories = normalizeText(row.Categories).toLowerCase();
        const isEvergreenCategory = [
          "knowledge hub",
          "engineering",
          "claims",
          "contract administration",
          "procurement",
          "project development",
        ].some((category) => categories.includes(category));

        return isEvergreenCategory && !categories.startsWith("news");
      })
      .map((row, index) => ({
        id: `EVERGREEN-${index + 1}`,
        title: row.Title,
        url: row.URL,
        categories: row.Categories || "",
      }));
  } catch {
    return [];
  }
}

async function fetchSupabaseTable(table, key) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });

  if (!response.ok) {
    throw new Error(`${table} fetch failed: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

async function loadProjects() {
  loadEnv();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    || process.env.SUPABASE_SERVICE_KEY
    || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!key) {
    const projects = readLocalProjects();
    return { projects, sources: readLocalSources(projects), source: "local CSV fallback" };
  }

  try {
    const [projects, sources] = await Promise.all([
      fetchSupabaseTable("projects_master", key),
      fetchSupabaseTable("project_sources", key),
    ]);
    return { projects, sources, source: "Supabase" };
  } catch (error) {
    console.warn(`Supabase unavailable, using local CSV fallback. ${error.message}`);
    const projects = readLocalProjects();
    return { projects, sources: readLocalSources(projects), source: "local CSV fallback" };
  }
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(date.valueOf()) ? null : date;
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function prettyDate(value) {
  const date = parseDate(value);
  if (!date) return "Date not available";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatLocation(project) {
  return [project.cityArea, project.stateProvince, project.country]
    .filter(Boolean)
    .join(", ") || project.region || "Location not specified";
}

function projectLabel(project) {
  return normalizeText(project.projectName || project.projectSlug || "Untitled project");
}

function normalizeText(value) {
  return String(value ?? "").trim();
}

function includesAny(project, needles) {
  const haystack = [
    project.currentProjectStage,
    project.latestMilestone,
    project.latestMilestoneSummary,
    project.latestUpdateSummary,
  ].map(normalizeText).join(" ").toLowerCase();

  return needles.some((needle) => haystack.includes(needle));
}

function isContractAward(project) {
  return includesAny(project, ["contract awarded", "wins", "won", "awarded", "epc", "epci"]);
}

function getUpdateDate(project) {
  return parseDate(project.latestUpdateDate || project.lastUpdated || project.last_updated || project.updatedAt);
}

function getSourceDate(source) {
  return parseDate(source.publicationDate || source.publishedAt || source.updatedAt);
}

function isConstructionFrontSource(source) {
  const url = normalizeText(source.sourceUrl);
  const publisher = normalizeText(source.publisher).toLowerCase();
  return url.includes("constructionfront.com") || publisher.includes("constructionfront");
}

function getProjectSource(project) {
  return {
    sourceId: `PROJECT-${project.projectSlug}`,
    projectSlug: project.projectSlug,
    sourceType: "ConstructionFront article",
    sourceTitle: project.latestUpdateSummary || project.latestMilestoneSummary || project.projectName,
    sourceUrl: project.latestCfArticleUrl,
    publicationDate: project.latestUpdateDate || project.lastUpdated || project.last_updated || project.updatedAt,
    publisher: "ConstructionFront",
    summary: project.latestUpdateSummary || project.projectSummary,
  };
}

function getContextSources({ projects, sources, weeklyProjects, week }) {
  const startDate = new Date(week.endDate.valueOf() - 59 * msPerDay);
  const weeklySlugs = new Set(weeklyProjects.map((project) => project.projectSlug));
  const projectBySlug = new Map(projects.map((project) => [project.projectSlug, project]));
  const syntheticSources = projects.map(getProjectSource).filter((source) => source.sourceUrl);

  const seen = new Set();
  return [...sources, ...syntheticSources]
    .filter(isConstructionFrontSource)
    .filter((source) => {
      const date = getSourceDate(source);
      if (!date || date < startDate || date > week.endDate) return false;
      const key = `${source.projectSlug}|${source.sourceUrl || source.sourceTitle}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((source) => ({
      ...source,
      project: projectBySlug.get(source.projectSlug),
      isWeeklyProject: weeklySlugs.has(source.projectSlug),
    }))
    .sort((a, b) => getSourceDate(b) - getSourceDate(a));
}

function isSameCalendarWeek(date, week) {
  return date && date >= week.startDate && date <= week.endDate;
}

function sourceTitle(source) {
  return normalizeText(source.sourceTitle || source.summary || source.project?.projectName || "previous ConstructionFront coverage");
}

function renderSourceLink(source) {
  const title = htmlEscape(sourceTitle(source));
  const url = htmlEscape(source.sourceUrl || "#");
  return `<a href="${url}">${title}</a>`;
}

function articleLink(article) {
  return `<a href="${htmlEscape(article.url)}">${htmlEscape(article.title)}</a>`;
}

function findEvergreenArticle(evergreenArticles, titleNeedles) {
  return evergreenArticles.find((article) => {
    const title = article.title.toLowerCase();
    return titleNeedles.every((needle) => title.includes(needle));
  });
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function inlineEvergreenLinks(text, evergreenArticles, usedUrls = new Set()) {
  const rules = [
    { phrase: "Final Investment Decision", needles: ["final investment decision"] },
    { phrase: "FID", needles: ["final investment decision"] },
    { phrase: "Balance of Plant", needles: ["balance of plant"] },
    { phrase: "BoP", needles: ["balance of plant"] },
    { phrase: "Notice to Proceed", needles: ["notice to proceed"] },
    { phrase: "NTP", needles: ["notice to proceed"] },
    { phrase: "Public Private Partnerships", needles: ["public private partnerships"] },
    { phrase: "PPP", needles: ["public private partnerships"] },
    { phrase: "Design-Bid-Build", needles: ["design-bid-build"] },
    { phrase: "Progressive Design-Build", needles: ["progressive design-build"] },
    { phrase: "Early Contractor Involvement", needles: ["eci contract"] },
    { phrase: "ECI", needles: ["eci contract"] },
    { phrase: "FEED", needles: ["feed study"] },
    { phrase: "EPCI", needles: ["epc contract"] },
    { phrase: "EPC", needles: ["epc contract"] },
    { phrase: "EPCM", needles: ["epc vs epcm"] },
    { phrase: "procurement", needles: ["procurement methods"] },
    { phrase: "delay", needles: ["delay analysis"] },
    { phrase: "Variation Order", needles: ["variation order"] },
    { phrase: "variation", needles: ["variation order"] },
    { phrase: "Time Bar", needles: ["time bar"] },
    { phrase: "Early Warning Notice", needles: ["early warning notice"] },
  ].sort((a, b) => b.phrase.length - a.phrase.length);

  let linked = htmlEscape(text);
  let linkCount = 0;

  for (const rule of rules) {
    if (linkCount >= 3) break;

    const article = findEvergreenArticle(evergreenArticles, rule.needles);
    if (!article || usedUrls.has(article.url)) continue;

    const pattern = new RegExp(`\\b(${escapeRegex(rule.phrase)})\\b`, "i");
    if (!pattern.test(linked)) continue;

    linked = linked.replace(
      pattern,
      `<a href="${htmlEscape(article.url)}">$1</a>`
    );
    usedUrls.add(article.url);
    linkCount++;
  }

  return linked;
}

function tokenize(value) {
  const stop = new Set([
    "and", "are", "for", "from", "how", "into", "more", "new", "the", "this",
    "use", "what", "when", "with", "worth", "wins", "project", "projects",
    "construction", "front", "article", "phase",
  ]);

  return normalizeText(value)
    .toLowerCase()
    .replace(/&amp;/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !stop.has(token));
}

function projectKeywords(project) {
  return new Set(tokenize([
    project.projectName,
    project.sector,
    project.subsector,
    project.region,
    project.country,
    project.stateProvince,
    project.cityArea,
    project.currentProjectStage,
    project.latestMilestone,
    project.latestUpdateSummary,
  ].join(" ")));
}

function scoreEvergreen(project, article) {
  const keywords = projectKeywords(project);
  const articleTokens = tokenize(`${article.title} ${article.categories}`);
  let score = 0;

  for (const token of articleTokens) {
    if (keywords.has(token)) score += 2;
  }

  const title = article.title.toLowerCase();
  const categories = article.categories.toLowerCase();
  const stageText = [
    project.currentProjectStage,
    project.latestMilestone,
    project.latestUpdateSummary,
  ].map(normalizeText).join(" ").toLowerCase();

  if (project.sector && title.includes(project.sector.toLowerCase())) score += 4;
  if (project.subsector && title.includes(project.subsector.toLowerCase().split("/")[0].trim())) score += 4;
  if (project.country && title.includes(project.country.toLowerCase())) score += 3;
  if (stageText.includes("fid") && title.includes("fid")) score += 5;
  if (stageText.includes("delay") && title.includes("delay")) score += 5;
  if (stageText.includes("claim") && (title.includes("claim") || categories.includes("contract administration"))) score += 5;
  if (stageText.includes("contract") && categories.includes("contract")) score += 3;
  if (stageText.includes("lng") && title.includes("lng")) score += 5;
  if (stageText.includes("battery") && title.includes("battery")) score += 4;
  if (stageText.includes("rail") && title.includes("rail")) score += 4;

  return score;
}

function findEvergreenForProject(project, evergreenArticles) {
  return evergreenArticles
    .map((article) => ({ article, score: scoreEvergreen(project, article) }))
    .filter((match) => match.score >= 5)
    .sort((a, b) => b.score - a.score || a.article.title.localeCompare(b.article.title))[0]?.article;
}

function buildEvergreenContext(projects, evergreenArticles) {
  const notes = [];
  const seen = new Set();

  for (const project of projects) {
    const article = findEvergreenForProject(project, evergreenArticles);
    if (!article || seen.has(article.url)) continue;
    seen.add(article.url);

    notes.push(`For background on ${htmlEscape(project.sector || project.subsector || "the project context")}, see ${articleLink(article)} in ConstructionFront's evergreen archive.`);
  }

  return notes.slice(0, 4);
}

function buildProjectContext(project, contextSources, week, evergreenArticles) {
  const projectDate = getUpdateDate(project);
  const sameProject = contextSources.find((source) => {
    const date = getSourceDate(source);
    return source.projectSlug === project.projectSlug
      && !isSameCalendarWeek(date, week)
      && source.sourceUrl !== project.latestCfArticleUrl;
  });

  if (sameProject) {
    return `This week's update connects with ${renderSourceLink(sameProject)} from ${prettyDate(sameProject.publicationDate)}.`;
  }

  const related = contextSources.find((source) => {
    const date = getSourceDate(source);
    if (!source.project || source.projectSlug === project.projectSlug || isSameCalendarWeek(date, week)) {
      return false;
    }

    const sameSector = normalizeText(source.project.sector) && source.project.sector === project.sector;
    const sameSubsector = normalizeText(source.project.subsector) && source.project.subsector === project.subsector;
    const sameRegion = normalizeText(source.project.region) && source.project.region === project.region;
    return sameSubsector || (sameSector && sameRegion);
  });

  if (related) {
    const relatedProject = projectLabel(related.project);
    return `This also fits the recent ${htmlEscape(project.sector || "project")} pattern seen in ${renderSourceLink(related)} covering ${htmlEscape(relatedProject)}.`;
  }

  const evergreen = findEvergreenForProject(project, evergreenArticles);
  if (evergreen) {
    return `This update also sits against ConstructionFront's broader ${articleLink(evergreen)} context.`;
  }

  if (projectDate) {
    return "";
  }

  return "";
}

function buildConnectedContext(projects, awards, contextSources, week) {
  const notes = [];
  const weeklySlugs = new Set(projects.map((project) => project.projectSlug));

  for (const award of awards) {
    const previous = contextSources.find((source) => {
      const date = getSourceDate(source);
      return source.projectSlug === award.projectSlug
        && !isSameCalendarWeek(date, week)
        && source.sourceUrl !== award.latestCfArticleUrl;
    });

    if (previous) {
      notes.push({
        key: `same-${award.projectSlug}`,
        text: `This week's award for ${htmlEscape(projectLabel(award))} connects with ${renderSourceLink(previous)}, showing the project moving from earlier market signal into delivery-side appointment.`,
      });
    }
  }

  const awardByRegionSector = new Map();
  for (const award of awards) {
    const key = `${award.region || ""}|${award.sector || ""}`;
    if (!awardByRegionSector.has(key)) awardByRegionSector.set(key, award);
  }

  for (const source of contextSources) {
    if (!source.project || weeklySlugs.has(source.projectSlug)) continue;
    const key = `${source.project.region || ""}|${source.project.sector || ""}`;
    const award = awardByRegionSector.get(key);
    if (!award) continue;

    notes.push({
      key: `market-${key}-${source.projectSlug}`,
      text: `Another ${htmlEscape(source.project.sector || "infrastructure")} project in ${htmlEscape(source.project.region || source.project.country || "the market")} remains relevant to this week's award activity: ${renderSourceLink(source)}.`,
    });
  }

  const deduped = [];
  const seen = new Set();
  for (const note of notes) {
    if (seen.has(note.key)) continue;
    seen.add(note.key);
    deduped.push(note.text);
  }

  return deduped.slice(0, 5);
}

function chooseWeek(projects, requestedEndDate) {
  if (requestedEndDate) {
    const endDate = parseDate(requestedEndDate);
    if (!endDate) throw new Error(`Invalid --week-ending value: ${requestedEndDate}`);
    return { endDate, startDate: new Date(endDate.valueOf() - 6 * msPerDay), strict: true };
  }

  const latest = projects
    .map(getUpdateDate)
    .filter(Boolean)
    .sort((a, b) => b - a)[0] || new Date();

  return { endDate: latest, startDate: new Date(latest.valueOf() - 6 * msPerDay), strict: false };
}

function countBy(projects, key) {
  const counts = new Map();
  for (const project of projects) {
    const value = normalizeText(project[key]) || "Unspecified";
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function joinTop(items, limit = 3) {
  return items.slice(0, limit).map(([label]) => label).join(", ");
}

function formatMoney(projects) {
  const byCurrency = new Map();
  for (const project of projects) {
    const amount = scaledProjectValue(project);
    const currency = normalizeText(project.projectValueCurrency) || "USD";
    if (amount) byCurrency.set(currency, (byCurrency.get(currency) ?? 0) + amount);
  }

  if (byCurrency.size === 0) return "Not disclosed";
  return [...byCurrency.entries()]
    .map(([currency, amount]) => `${currency} ${compactNumber(amount)}`)
    .join(" + ");
}

function scaledProjectValue(project) {
  const amount = toNumber(project.projectValueAmount);
  if (!amount) return null;

  const scale = normalizeText(project.projectValueScale || project.projectValueBasis).toLowerCase();
  if (scale.includes("billion") || scale === "bn") return amount * 1_000_000_000;
  if (scale.includes("million") || scale === "m" || scale === "mn") return amount * 1_000_000;
  if (scale.includes("thousand") || scale === "k") return amount * 1_000;

  return amount;
}

function compactNumber(value) {
  if (Math.abs(value) >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}bn`;
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}m`;
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function htmlEscape(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function getMarketReadout(projects, awards) {
  const sectors = countBy(projects, "sector");
  const regions = countBy(projects, "region");
  const countries = countBy(projects, "country");
  const stages = countBy(projects, "currentProjectStage");
  const contractors = countBy(projects.filter((project) => project.leadContractor), "leadContractor");

  const sectorText = joinTop(sectors) || "mixed sectors";
  const regionText = joinTop(regions) || joinTop(countries) || "multiple markets";
  const stageText = joinTop(stages, 2) || "mixed project stages";
  const contractorText = joinTop(contractors, 2);

  const first = `This week's ConstructionFront coverage was concentrated in ${sectorText}, with activity spread across ${regionText}. The update mix leans toward ${stageText.toLowerCase()}, suggesting the strongest near-term intelligence value is in tracking which projects are moving from announcement into executable work.`;
  const second = awards.length
    ? `The contract-award set points to delivery teams now forming around ${awards.length} covered project${awards.length === 1 ? "" : "s"}, which is useful for suppliers, advisers and subcontractors looking for follow-on package opportunities.`
    : "No mapped contract-award cluster dominated the week, so the more useful signal is early positioning: financing, procurement readiness and owners narrowing delivery routes.";
  const third = contractorText
    ? `Named contractor activity includes ${contractorText}, giving the week a clearer read on where supply-chain attention may shift next.`
    : "Named contractor activity remains limited in the available records, so future editions should watch for EPC, civil works, grid and specialist package appointments.";

  return [first, second, third];
}

function projectPin(project, index) {
  const point = projectMapPoint(project);
  if (!point) return "";

  const color = getPinColor(project);
  return `
    <g>
      <title>${htmlEscape(projectLabel(project))} - ${htmlEscape(formatLocation(project))}</title>
      <circle cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="9" fill="${color}" stroke="#07111f" stroke-width="3" />
      <text x="${point.x.toFixed(1)}" y="${(point.y + 4).toFixed(1)}" text-anchor="middle" font-size="10" font-weight="700" fill="#07111f">${index + 1}</text>
    </g>`;
}

function projectMapPoint(project) {
  const lat = toNumber(project.latitude);
  const lng = toNumber(project.longitude);
  if (lat === null || lng === null) return null;

  return {
    x: ((lng + 180) / 360) * 1000,
    y: ((90 - lat) / 180) * 500,
  };
}

function getPinColor(project) {
  if (project.sector?.toLowerCase().includes("energy")) return "#ffb703";
  if (project.sector?.toLowerCase().includes("transport")) return "#2ec4b6";
  if (project.sector?.toLowerCase().includes("water")) return "#66d9ef";
  return "#f472b6";
}

function renderPins(projects) {
  const occupied = new Map();

  return projects.map((project, index) => {
    const point = projectMapPoint(project);
    if (!point) return "";

    const key = `${Math.round(point.x / 8)}|${Math.round(point.y / 8)}`;
    const collisionIndex = occupied.get(key) ?? 0;
    occupied.set(key, collisionIndex + 1);

    const angle = collisionIndex * 2.35;
    const offset = collisionIndex === 0 ? 0 : 15;
    const x = point.x + Math.cos(angle) * offset;
    const y = point.y + Math.sin(angle) * offset;
    const color = getPinColor(project);

    return `
      <g>
        <title>${htmlEscape(projectLabel(project))} - ${htmlEscape(formatLocation(project))}</title>
        ${collisionIndex > 0 ? `<line x1="${point.x.toFixed(1)}" y1="${point.y.toFixed(1)}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#f8fafc" stroke-opacity="0.42" stroke-width="1" />` : ""}
        <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9" fill="${color}" stroke="#07111f" stroke-width="3" />
        <text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="middle" font-size="10" font-weight="700" fill="#07111f">${index + 1}</text>
      </g>`;
  }).join("");
}

async function loadWorldMapPaths() {
  try {
    const response = await fetch(worldGeoJsonUrl);
    if (!response.ok) throw new Error(`World map fetch failed: ${response.status}`);
    const geoJson = await response.json();
    return renderWorldPaths(geoJson);
  } catch (error) {
    console.warn(`World map unavailable, using simplified fallback. ${error.message}`);
    return renderFallbackWorldPaths();
  }
}

function renderWorldPaths(geoJson) {
  return geoJson.features
    .map((feature) => geometryToPath(feature.geometry))
    .filter(Boolean)
    .map((path) => `<path d="${path}" fill="#182942" stroke="#2c4565" stroke-width="0.7" />`)
    .join("");
}

function geometryToPath(geometry) {
  if (!geometry) return "";
  if (geometry.type === "Polygon") return polygonToPath(geometry.coordinates);
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.map(polygonToPath).join(" ");
  }
  return "";
}

function polygonToPath(polygon) {
  return polygon.map(ringToPath).join(" ");
}

function ringToPath(ring) {
  const points = ring
    .filter((_, index) => index === 0 || index === ring.length - 1 || index % 3 === 0)
    .map(([lng, lat]) => {
      const x = ((lng + 180) / 360) * 1000;
      const y = ((90 - lat) / 180) * 500;
      return `${x.toFixed(1)} ${y.toFixed(1)}`;
    });

  if (!points.length) return "";
  return `M ${points.join(" L ")} Z`;
}

function renderFallbackWorldPaths() {
  return `
    <path d="M165 145 C210 120 245 132 270 165 L245 218 C210 222 180 205 150 175 Z" fill="#182942" stroke="#2c4565" stroke-width="0.7" />
    <path d="M265 235 C300 230 332 260 325 310 C315 375 270 402 250 452 C230 398 245 340 230 305 C218 278 235 248 265 235 Z" fill="#182942" stroke="#2c4565" stroke-width="0.7" />
    <path d="M430 130 C495 105 565 120 610 160 C575 190 535 185 498 205 C465 222 428 195 405 168 Z" fill="#182942" stroke="#2c4565" stroke-width="0.7" />
    <path d="M520 235 C575 228 622 252 648 300 C615 325 555 322 515 295 C488 276 490 246 520 235 Z" fill="#182942" stroke="#2c4565" stroke-width="0.7" />
    <path d="M680 150 C742 108 818 128 858 185 C822 230 760 232 704 205 C668 188 650 170 680 150 Z" fill="#182942" stroke="#2c4565" stroke-width="0.7" />
    <path d="M775 325 C820 308 875 335 895 378 C855 410 800 400 760 360 C748 345 755 334 775 325 Z" fill="#182942" stroke="#2c4565" stroke-width="0.7" />`;
}

function renderMap(projects, worldMapPaths) {
  const pins = projects.filter((project) => project.latitude != null && project.longitude != null);

  return `
    <div class="map-panel">
      <svg viewBox="0 0 1000 500" role="img" aria-label="Contract awards covered this week">
        <rect width="1000" height="500" fill="#081321" />
        ${Array.from({ length: 13 }, (_, i) => `<line x1="${i * 83.33}" y1="0" x2="${i * 83.33}" y2="500" stroke="#18314d" stroke-width="1" />`).join("")}
        ${Array.from({ length: 7 }, (_, i) => `<line x1="0" y1="${i * 83.33}" x2="1000" y2="${i * 83.33}" stroke="#18314d" stroke-width="1" />`).join("")}
        ${worldMapPaths}
        ${renderPins(pins)}
      </svg>
      <p class="caption">${pins.length ? `${pins.length} mapped contract award${pins.length === 1 ? "" : "s"} from this week's coverage.` : "No contract awards with coordinates were available for the selected week."}</p>
    </div>`;
}

function renderProjectList(projects, contextSources, week, evergreenArticles) {
  return projects.slice(0, 8).map((project, index) => {
    const title = htmlEscape(project.projectName || project.projectSlug || "Untitled project");
    const url = htmlEscape(project.latestCfArticleUrl || "#");
    const summary = htmlEscape(project.latestUpdateSummary || project.latestMilestoneSummary || project.projectSummary || "Update summary not available.");
    const stage = htmlEscape(project.currentProjectStage || "Stage not specified");
    const meta = htmlEscape([formatLocation(project), project.sector, prettyDate(project.latestUpdateDate || project.lastUpdated)].filter(Boolean).join(" | "));
    const context = buildProjectContext(project, contextSources, week, evergreenArticles);

    return `
      <article class="project">
        <div class="rank">${index + 1}</div>
        <div>
          <h3><a href="${url}">${title}</a></h3>
          <p class="meta">${meta}</p>
          <p>${summary}</p>
          ${context ? `<p class="context-note">${context}</p>` : ""}
          <span class="badge">${stage}</span>
        </div>
      </article>`;
  }).join("");
}

function renderAwardLegend(projects) {
  return projects.slice(0, 8).map((project, index) => `
    <li>${htmlEscape(project.projectName || project.projectSlug)} <span>${htmlEscape(formatLocation(project))}</span></li>
  `).join("");
}

function renderContextNotes(notes) {
  if (!notes.length) {
    return `<p>There were no strong 60-day context links in the current dataset for this weekly selection. As more article history is captured in Supabase, this section should become one of the most useful parts of the brief.</p>`;
  }

  return `<ul class="context-list">${notes.map((note) => `<li>${note}</li>`).join("")}</ul>`;
}

function renderHtml({ projects, awards, contextSources, evergreenArticles, worldMapPaths, week, source }) {
  const sectors = countBy(projects, "sector");
  const countries = countBy(projects, "country").filter(([country]) => country !== "Unspecified");
  const readout = getMarketReadout(projects, awards);
  const connectedContext = buildConnectedContext(projects, awards, contextSources, week);
  const weekLabel = `${prettyDate(formatDate(week.startDate))} - ${prettyDate(formatDate(week.endDate))}`;
  const inlineLinkUrls = new Set();
  const signalsText = "Watch for follow-on packages around awarded EPC and EPCI work, procurement notices tied to projects in FID or financing stages, and owner-side activity that indicates projects are moving from development into delivery planning.";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>ConstructionFront Weekly Brief - ${htmlEscape(weekLabel)}</title>
  <style>
    body { margin: 0; background: #eef2f6; color: #172033; font-family: Arial, Helvetica, sans-serif; }
    .shell { max-width: 920px; margin: 0 auto; background: #ffffff; }
    .hero { background: #07111f; color: #ffffff; padding: 34px 36px 28px; }
    .kicker { color: #ffb703; font-size: 12px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
    h1 { margin: 10px 0 8px; font-size: 34px; line-height: 1.08; }
    .hero p { max-width: 760px; color: #d8e2ef; font-size: 16px; line-height: 1.55; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: #d9e1ea; }
    .stat { background: #f8fafc; padding: 18px; }
    .stat strong { display: block; font-size: 24px; color: #07111f; }
    .stat span { color: #607086; font-size: 12px; text-transform: uppercase; letter-spacing: .08em; }
    section { padding: 28px 36px; border-top: 1px solid #e5ebf2; }
    h2 { margin: 0 0 14px; font-size: 21px; color: #07111f; }
    p { line-height: 1.55; }
    .readout { display: grid; gap: 12px; }
    .readout p { margin: 0; padding-left: 14px; border-left: 3px solid #ffb703; }
    .map-panel { background: #07111f; border-radius: 8px; overflow: hidden; }
    .map-panel svg { display: block; width: 100%; height: auto; }
    .caption { margin: 0; padding: 12px 16px; color: #d8e2ef; font-size: 13px; background: #0b1422; }
    .award-legend { columns: 2; padding-left: 18px; color: #172033; }
    .award-legend li { break-inside: avoid; margin: 0 0 8px; }
    .award-legend span { color: #607086; }
    .project { display: grid; grid-template-columns: 34px 1fr; gap: 14px; padding: 18px 0; border-top: 1px solid #e5ebf2; }
    .project:first-child { border-top: 0; }
    .rank { width: 28px; height: 28px; border-radius: 50%; background: #07111f; color: #ffb703; display: grid; place-items: center; font-weight: 700; font-size: 13px; }
    h3 { margin: 0; font-size: 17px; }
    a { color: #074f86; text-decoration: none; }
    .meta { margin: 6px 0; color: #607086; font-size: 13px; }
    .context-list { margin: 0; padding-left: 20px; }
    .context-list li { margin-bottom: 10px; line-height: 1.5; }
    .context-note { margin: 8px 0 0; color: #334155; font-size: 14px; border-left: 3px solid #d7e4ef; padding-left: 10px; }
    .badge { display: inline-block; margin-top: 8px; padding: 5px 8px; border-radius: 999px; background: #eef5fb; color: #17446b; font-size: 12px; font-weight: 700; }
    .footer { padding: 20px 36px 32px; color: #607086; font-size: 12px; }
    @media (max-width: 720px) {
      .hero, section, .footer { padding-left: 20px; padding-right: 20px; }
      .stats { grid-template-columns: repeat(2, 1fr); }
      h1 { font-size: 28px; }
      .award-legend { columns: 1; }
    }
  </style>
</head>
<body>
  <main class="shell">
    <header class="hero">
      <div class="kicker">ConstructionFront Weekly Brief</div>
      <h1>Projects, Awards and Market Signals</h1>
      <p>A succinct digest of ConstructionFront coverage for ${htmlEscape(weekLabel)}, with contract-award mapping and a broader read on what the week suggests for infrastructure and construction markets.</p>
    </header>

    <div class="stats">
      <div class="stat"><strong>${projects.length}</strong><span>updates covered</span></div>
      <div class="stat"><strong>${awards.length}</strong><span>contract awards</span></div>
      <div class="stat"><strong>${countries.length}</strong><span>countries</span></div>
      <div class="stat"><strong>${htmlEscape(formatMoney(projects))}</strong><span>reported value</span></div>
    </div>

    <section>
      <h2>Market Readout</h2>
      <div class="readout">
        ${readout.map((paragraph) => `<p>${inlineEvergreenLinks(paragraph, evergreenArticles, inlineLinkUrls)}</p>`).join("")}
      </div>
    </section>

    <section>
      <h2>Weekly Snapshot</h2>
      <p>This edition is led by ${htmlEscape(joinTop(sectors) || "a mixed project set")}, with coverage across ${htmlEscape(joinTop(countries, 4) || "multiple geographies")}. The digest below keeps to the main project movement and links back to the original ConstructionFront coverage.</p>
    </section>

    <section>
      <h2>Connected Context</h2>
      ${renderContextNotes(connectedContext)}
    </section>

    <section>
      <h2>Contract Awards Map</h2>
      ${renderMap(awards, worldMapPaths)}
      ${awards.length ? `<ol class="award-legend">${renderAwardLegend(awards)}</ol>` : ""}
    </section>

    <section>
      <h2>Top Project Updates</h2>
      ${renderProjectList(projects, contextSources, week, evergreenArticles)}
    </section>

    <section>
      <h2>Signals To Watch</h2>
      <p>${inlineEvergreenLinks(signalsText, evergreenArticles, inlineLinkUrls)}</p>
    </section>

    <footer class="footer">
      Generated from ${htmlEscape(source)}. Review before distribution, especially inferred project values, contractor roles and award status.
    </footer>
  </main>
</body>
</html>`;
}

function renderEditorialPromptArtifact({
  projects,
  awards,
  contextSources,
  evergreenArticles,
  week,
  source,
}) {
  const weekLabel = `${formatDate(week.startDate)} to ${formatDate(week.endDate)}`;
  const projectLines = projects.slice(0, 12).map((project, index) => {
    return [
      `${index + 1}. ${projectLabel(project)}`,
      `Location: ${formatLocation(project)}`,
      `Sector: ${project.sector || "N/A"} / ${project.subsector || "N/A"}`,
      `Stage: ${project.currentProjectStage || "N/A"}`,
      `Latest update: ${project.latestUpdateSummary || project.latestMilestoneSummary || "N/A"}`,
      `Article: ${project.latestCfArticleUrl || "N/A"}`,
    ].join("\n");
  }).join("\n\n");

  const awardLines = awards.slice(0, 12).map((project, index) => {
    return `${index + 1}. ${projectLabel(project)} | ${formatLocation(project)} | ${project.sector || "N/A"} | ${project.latestCfArticleUrl || "N/A"}`;
  }).join("\n");

  const contextLines = contextSources.slice(0, 20).map((source, index) => {
    return `${index + 1}. ${sourceTitle(source)} | ${source.publicationDate || "N/A"} | ${source.sourceUrl || "N/A"}`;
  }).join("\n");

  const evergreenLines = evergreenArticles.slice(0, 40).map((article, index) => {
    return `${index + 1}. ${article.title} | ${article.categories || "N/A"} | ${article.url}`;
  }).join("\n");

  return `${newsletterEditorialPrompt}

---

WEEKLY DATA PACK

Source: ${source}
Week: ${weekLabel}
Weekly update count: ${projects.length}
Contract award count: ${awards.length}

WEEKLY PROJECT RECORDS

${projectLines || "No weekly projects available."}

CONTRACT AWARDS TO MAP

${awardLines || "No mapped contract awards available."}

RECENT 60-DAY CONSTRUCTIONFRONT CONTEXT SOURCES

${contextLines || "No recent context sources available."}

EVERGREEN CONSTRUCTIONFRONT CANDIDATES

${evergreenLines || "No evergreen candidates available."}

---

Use the prompt above to refine the newsletter's editorial judgement, tone and linking rationale. The current script implements deterministic approximations of this prompt; future versions can send this data pack to an LLM and then render the edited prose into the HTML template.`;
}

function getArg(name) {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

const { projects: allProjects, sources: allSources, source } = await loadProjects();
const evergreenArticles = readEvergreenArticles();
const worldMapPaths = await loadWorldMapPaths();
const week = chooseWeek(allProjects, getArg("week-ending"));
let weeklyProjects = allProjects
  .filter((project) => {
    const date = getUpdateDate(project);
    return date && date >= week.startDate && date <= week.endDate;
  })
  .sort((a, b) => getUpdateDate(b) - getUpdateDate(a));

if (!weeklyProjects.length && !week.strict) {
  weeklyProjects = allProjects
    .filter((project) => getUpdateDate(project))
    .sort((a, b) => getUpdateDate(b) - getUpdateDate(a))
    .slice(0, 8);
}

const awards = weeklyProjects.filter(isContractAward);
const contextSources = getContextSources({
  projects: allProjects,
  sources: allSources,
  weeklyProjects,
  week,
});
const outputPath = resolve(
  root,
  getArg("out") || `output/constructionfront-weekly-brief-${formatDate(week.endDate)}.html`
);
const promptOutputPath = outputPath.replace(/\.html$/i, ".prompt.txt");

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(
  outputPath,
  renderHtml({
    projects: weeklyProjects,
    awards,
    contextSources,
    evergreenArticles,
    worldMapPaths,
    week,
    source,
  }),
  "utf8"
);
writeFileSync(
  promptOutputPath,
  renderEditorialPromptArtifact({
    projects: weeklyProjects,
    awards,
    contextSources,
    evergreenArticles,
    week,
    source,
  }),
  "utf8"
);

console.log(`Generated ${outputPath}`);
console.log(`Generated ${promptOutputPath}`);
console.log(`Source: ${source}`);
console.log(`Week: ${formatDate(week.startDate)} to ${formatDate(week.endDate)}`);
console.log(`Updates: ${weeklyProjects.length}; awards: ${awards.length}`);
console.log(`Context sources: ${contextSources.length}; evergreen articles: ${evergreenArticles.length}`);
