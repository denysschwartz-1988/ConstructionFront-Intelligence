"use client";

import type { ProjectPartyRecord, ProjectRecord, ProjectSourceRecord } from "@/types/database";
import { getStageBadgeStyle } from "@/lib/utils";

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

function cleanCityArea(cityArea: string | null): string {
  if (!cityArea) {
    return "";
  }

  const stopWords = [" of ", " to ", " near ", " connecting", " approximately", ","];
  let result = cityArea;

  for (const word of stopWords) {
    const index = result.indexOf(word);
    if (index > 0) {
      result = result.substring(0, index);
    }
  }

  return result.trim().substring(0, 40);
}

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
    cleanCityArea(selectedProject.cityArea)
  ]
    .filter(Boolean)
    .join(" / ");

  const cfArticles = projectSources.filter(
    (source) => source.sourceType?.trim().toLowerCase() === "cf article"
  );
  const keyDetails = [
    { label: "Owner / Developer", value: ownerDeveloper },
    { label: "Public Authority", value: publicAuthority },
    { label: "Main Contractor", value: contractor },
    { label: "Scale / Size", value: scaleSize },
    { label: "Est. Project Value", value: projectValue },
    { label: "Location", value: locationParts }
  ].filter((detail) => detail.value);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        backgroundColor: '#161b22'
      }}
    >
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close project panel"
          style={{ position: 'absolute', top: 12, right: 12, zIndex: 40, background: 'transparent', border: 'none', color: '#94a3b8', fontSize: 20, cursor: 'pointer' }}
        >
          ×
        </button>
      </div>

      <div style={{ height: 140, width: '100%', overflow: 'hidden', backgroundColor: 'var(--secondary-bg)', flexShrink: 0 }}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={selectedProject.projectName ?? "Project image"}
            style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1b2736', color: '#64748b' }}>
            <span>No image available</span>
          </div>
        )}
      </div>

      <div
        style={{
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          flex: 1
        }}
      >
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div>
              <h1 style={{ color: 'var(--text)', fontWeight: 600, fontSize: 14, margin: 0 }}>
                {headerLabel}
              </h1>
              <div style={{ marginTop: 8 }}>
                <span
                  style={{
                    display: 'inline-flex',
                    padding: '2px 6px',
                    borderRadius: 999,
                    fontSize: 10,
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    ...getStageBadgeStyle(selectedProject.currentProjectStage)
                  }}
                >
                  {selectedProject.currentProjectStage ?? "Stage unknown"}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {selectedProject.country ? (
              <span style={{ background: '#21262d', padding: '6px 10px', borderRadius: 999, color: 'var(--text)', fontSize: 11, border: '1px solid var(--border)' }}>{selectedProject.country}</span>
            ) : null}
            {selectedProject.region ? (
              <span style={{ background: '#21262d', padding: '6px 10px', borderRadius: 999, color: 'var(--text)', fontSize: 11, border: '1px solid var(--border)' }}>{selectedProject.region}</span>
            ) : null}
            {selectedProject.sector ? (
              <span style={{ background: '#21262d', padding: '6px 10px', borderRadius: 999, color: 'var(--text)', fontSize: 11, border: '1px solid var(--border)' }}>{selectedProject.sector}</span>
            ) : null}
            {selectedProject.subsector ? (
              <span style={{ background: '#21262d', padding: '6px 10px', borderRadius: 999, color: 'var(--text)', fontSize: 11, border: '1px solid var(--border)' }}>{selectedProject.subsector}</span>
            ) : null}
          </div>
        </div>

        <section style={{ borderRadius: 8, border: '1px solid var(--border)', backgroundColor: 'var(--card-bg)', padding: 12, marginBottom: 12 }}>
          <div style={{ marginBottom: 8, color: 'var(--amber)', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em' }}>
            ABOUT THIS PROJECT
          </div>
          <p
            style={{
              color: '#cbd5e1',
              fontSize: 13,
              lineHeight: 1.6,
              margin: 0
            }}
          >
            {selectedProject.projectDescription?.trim() || "No project description available."}
          </p>
        </section>

        <section style={{ borderRadius: 8, border: '1px solid var(--border)', backgroundColor: 'var(--card-bg)', padding: 12, marginBottom: 12 }}>
          <div style={{ marginBottom: 8, color: 'var(--amber)', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em' }}>
            KEY DETAILS
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {keyDetails.map((detail) => (
              <div key={detail.label}>
                <p style={{ color: 'var(--muted)', fontSize: 10, margin: 0, textTransform: 'uppercase' }}>{detail.label}</p>
                <p style={{ color: 'var(--text)', fontSize: 13, margin: '6px 0 0' }}>{detail.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section
          style={{
            borderRadius: 8,
            border: '1px solid #30363d',
            backgroundColor: '#1c2128',
            padding: 16,
            marginBottom: 12,
            flex: 1
          }}
        >
          <div style={{ marginBottom: 8, color: '#f59e0b', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
            CONSTRUCTIONFRONT COVERAGE
          </div>
          {error ? (
            <p style={{ color: '#ff7b7b' }}>{error}</p>
          ) : isLoading ? (
            <p style={{ color: '#94a3b8' }}>Loading coverage…</p>
          ) : cfArticles.length === 0 ? (
            <p style={{ color: '#94a3b8' }}>No coverage recorded yet.</p>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {cfArticles.map((source) => (
                <article key={source.sourceId} style={{ borderRadius: 8, border: '1px solid #30363d', backgroundColor: '#1c2128', padding: 12 }}>
                  <div style={{ marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, color: '#94a3b8', fontSize: 11, textTransform: 'uppercase' }}>
                    <span>{formatDate(source.publicationDate)}</span>
                    <span style={{ background: 'transparent', padding: '4px 8px', borderRadius: 999, color: '#94a3b8' }}>CF Article</span>
                  </div>
                  <h2 style={{ marginBottom: 6, color: '#ffffff', fontSize: 14, fontWeight: 700 }}>{source.sourceTitle ?? "ConstructionFront coverage"}</h2>
                  <p style={{ marginBottom: 8, color: '#cbd5e1', fontSize: 13, lineHeight: 1.6 }}>{source.summary ?? "No summary available."}</p>
                  {source.milestoneConfirmed ? (
                    <p style={{ marginBottom: 8, color: '#94a3b8', fontSize: 12, textTransform: 'uppercase' }}>{source.milestoneConfirmed}</p>
                  ) : null}
                  {source.sourceUrl ? (
                    <a
                      href={source.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#f59e0b', fontWeight: 700 }}
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
    </div>
  );
};

export default ProjectPanel;
