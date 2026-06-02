"use client";

import type { ProjectPartyRecord, ProjectRecord, ProjectSourceRecord } from "@/types/database";
import { getStageColor } from "@/lib/utils";

export type ProjectPanelProps = {
  selectedProject: ProjectRecord;
  projectParties: ProjectPartyRecord[];
  projectSources: ProjectSourceRecord[];
  onClose: () => void;
  isLoading?: boolean;
  error?: string | null;
};

const formatDate = (value?: string | null) => {
  if (!value) {
    return "";
  }

  const [year, month, day] = value.split("-");
  if (!year || !month) {
    return value;
  }

  return new Date(`${year}-${month}-${day}`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
};

const getStageBadgeStyles = (stage?: string | null) => {
  const color = getStageColor(stage ?? undefined);

  return {
    backgroundColor: `${color}20`,
    borderColor: color,
    color,
    borderWidth: 1,
    borderStyle: "solid"
  };
};

const getSummarySentences = (text?: string | null, sentenceCount = 2) => {
  if (!text) {
    return "No project description available.";
  }

  const sentences = text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);

  return sentences.slice(0, sentenceCount).join(" ").trim();
};

const truncate = (value?: string | null, maxLength = 40) => {
  if (!value) {
    return "";
  }

  return value.length > maxLength ? `${value.slice(0, maxLength)}…` : value;
};

const getPartyNames = (parties: ProjectPartyRecord[], category: string) => {
  return parties
    .filter((party) =>
      party.roleCategory?.toLowerCase().includes(category.toLowerCase())
    )
    .map((party) => party.partyName)
    .filter(Boolean)
    .join(" | ");
};

const isContractorVisible = (project: ProjectRecord) => {
  const stage = project.currentProjectStage?.toLowerCase() ?? "";
  const validStage = [
    "contract awarded",
    "under construction",
    "construction complete",
    "operational"
  ].some((term) => stage.includes(term));

  const confirmed =
    project.contractorConfirmed === true ||
    String(project.contractorConfirmed).toLowerCase() === "true";

  return Boolean(validStage && confirmed && project.leadContractor?.trim());
};

const getProjectValue = (project: ProjectRecord) => {
  if (!project.projectValueAmount && !project.projectValueCurrency && !project.projectValueScale) {
    return "";
  }

  const amount = project.projectValueAmount != null ? project.projectValueAmount : "";
  const currency = project.projectValueCurrency?.trim() ?? "";
  const scale = project.projectValueScale?.trim() ?? "";

  return [amount, currency, scale].filter(Boolean).join(" ");
};

const ProjectPanel = ({
  selectedProject,
  projectParties,
  projectSources,
  onClose,
  isLoading,
  error
}: ProjectPanelProps) => {
  const imageUrl = selectedProject.projectImageUrl?.trim();
  const headerLabel = selectedProject.projectName ?? selectedProject.projectSlug;
  const stageColor = getStageColor(selectedProject.currentProjectStage ?? undefined);
  const ownerDeveloper = getPartyNames(projectParties, "Developer / Owner");
  const publicAuthority = getPartyNames(projectParties, "Public Authority");
  const contractor = isContractorVisible(selectedProject)
    ? selectedProject.leadContractor?.trim()
    : "";
  const scaleSize = selectedProject.capacityDisplay?.trim() ?? "";
  const projectValue = getProjectValue(selectedProject);
  const locationParts = [
    selectedProject.country?.trim(),
    selectedProject.stateProvince?.trim(),
    truncate(selectedProject.cityArea)
  ]
    .filter(Boolean)
    .join(" / ");

  const cfArticles = projectSources.filter(
    (source) => source.sourceType?.trim().toLowerCase() === "cf article"
  );

  return (
    <aside className="h-full min-h-screen overflow-y-auto border-l border-white/10 bg-slate-950">
      <div className="sticky top-0 z-20 flex justify-end border-b border-white/10 bg-slate-950/90 px-4 py-4 backdrop-blur">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-slate-900/80 text-slate-200 transition hover:bg-slate-800"
          aria-label="Close project panel"
        >
          ×
        </button>
      </div>

      <div className="relative h-56 w-full overflow-hidden bg-slate-800">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={selectedProject.projectName ?? "Project image"}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-slate-800 text-slate-500">
            <span>No image available</span>
          </div>
        )}
      </div>

      <div className="space-y-6 p-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <h1 className="text-2xl font-semibold leading-tight text-white">
                {headerLabel}
              </h1>
              <span
                className="inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]"
                style={getStageBadgeStyles(selectedProject.currentProjectStage)}
              >
                {selectedProject.currentProjectStage ?? "Stage unknown"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {selectedProject.country ? (
              <span className="rounded-full bg-slate-900/70 px-3 py-1 text-xs text-slate-300">
                {selectedProject.country}
              </span>
            ) : null}
            {selectedProject.region ? (
              <span className="rounded-full bg-slate-900/70 px-3 py-1 text-xs text-slate-300">
                {selectedProject.region}
              </span>
            ) : null}
            {selectedProject.sector ? (
              <span className="rounded-full bg-slate-900/70 px-3 py-1 text-xs text-slate-300">
                {selectedProject.sector}
              </span>
            ) : null}
            {selectedProject.subsector ? (
              <span className="rounded-full bg-slate-900/70 px-3 py-1 text-xs text-slate-300">
                {selectedProject.subsector}
              </span>
            ) : null}
          </div>
        </div>

        <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-4">
          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            ABOUT THIS PROJECT
          </div>
          <p className="text-sm leading-6 text-slate-200">
            {getSummarySentences(selectedProject.projectDescription)}
          </p>
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-4">
          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            KEY DETAILS
          </div>
          <div className="space-y-3 text-sm text-slate-200">
            {ownerDeveloper ? (
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                  Owner / Developer
                </p>
                <p>{ownerDeveloper}</p>
              </div>
            ) : null}

            {publicAuthority ? (
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                  Public Authority
                </p>
                <p>{publicAuthority}</p>
              </div>
            ) : null}

            {contractor ? (
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                  Main Contractor
                </p>
                <p>{contractor}</p>
              </div>
            ) : null}

            {scaleSize ? (
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                  Scale / Size
                </p>
                <p>{scaleSize}</p>
              </div>
            ) : null}

            {projectValue ? (
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                  Est. Project Value
                </p>
                <p>{projectValue}</p>
              </div>
            ) : null}

            {locationParts ? (
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                  Location
                </p>
                <p>{locationParts}</p>
              </div>
            ) : null}

            {!ownerDeveloper && !publicAuthority && !contractor && !scaleSize && !projectValue && !locationParts ? (
              <p className="text-sm text-slate-500">No key details available.</p>
            ) : null}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-4">
          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            CONSTRUCTIONFRONT COVERAGE
          </div>
          {error ? (
            <p className="text-sm text-rose-300">{error}</p>
          ) : isLoading ? (
            <p className="text-sm text-slate-400">Loading coverage…</p>
          ) : cfArticles.length === 0 ? (
            <p className="text-sm text-slate-400">No coverage recorded yet.</p>
          ) : (
            <div className="space-y-4">
              {cfArticles.map((source) => (
                <article key={source.sourceId} className="rounded-3xl border border-white/10 bg-slate-950/60 p-4">
                  <div className="mb-2 flex items-center justify-between gap-2 text-[11px] uppercase tracking-[0.24em] text-slate-500">
                    <span>{formatDate(source.publicationDate)}</span>
                    <span className="rounded-full bg-slate-900/70 px-2 py-1 text-slate-400">
                      CF Article
                    </span>
                  </div>
                  <h2 className="mb-2 text-sm font-semibold text-white">
                    {source.sourceTitle ?? "ConstructionFront coverage"}
                  </h2>
                  <p className="mb-3 text-sm leading-6 text-slate-300">
                    {source.summary ?? "No summary available."}
                  </p>
                  {source.milestoneConfirmed ? (
                    <p className="mb-3 text-xs uppercase tracking-[0.24em] text-slate-500">
                      {source.milestoneConfirmed}
                    </p>
                  ) : null}
                  {source.sourceUrl ? (
                    <a
                      href={source.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-semibold text-amber-300 transition hover:text-amber-200"
                    >
                      Read on ConstructionFront.com →
                    </a>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </aside>
  );
};

export default ProjectPanel;
