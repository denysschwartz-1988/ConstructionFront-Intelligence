"use client";

import type { ProjectPartyRecord, ProjectRecord, ProjectSourceRecord } from "@/types/database";
import { cleanCityArea, getStageBadgeStyle } from "@/lib/utils";
import { rowLabelStyle, rowValueStyle, sectionLabelStyle } from "@/lib/styles";

export type ProjectPanelProps = {
  selectedProject: ProjectRecord;
  projectParties: ProjectPartyRecord[];
  projectSources: ProjectSourceRecord[];
  onClose: () => void;
  isLoading?: boolean;
  error?: string | null;
};

const systemFont =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, 'Helvetica Neue', Arial, sans-serif";

const panelCardStyle = {
  backgroundColor: "#161b22",
  border: "1px solid #21262d",
  borderRadius: 6,
  padding: 10,
  marginBottom: 8
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
        fontFamily: systemFont,
        fontSize: 13,
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        backgroundColor: '#0d1117'
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

      <div style={{ height: 160, width: '100%', overflow: 'hidden', backgroundColor: 'var(--secondary-bg)', flexShrink: 0 }}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={selectedProject.projectName ?? "Project image"}
            style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1b2736', color: '#64748b' }}>
            <span>No image available</span>
          </div>
        )}
      </div>

      <div
        style={{
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          flex: 1
        }}
      >
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
            <div>
              <h1
                style={{
                  color: '#e6edf3',
                  fontWeight: 700,
                  fontSize: 16,
                  margin: '0 0 6px',
                  lineHeight: 1.3
                }}
              >
                {headerLabel}
              </h1>
              <div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 4,
                    display: 'inline-block',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    ...getStageBadgeStyle(selectedProject.currentProjectStage)
                  }}
                >
                  {selectedProject.currentProjectStage ?? "Stage unknown"}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            {selectedProject.country ? (
              <span style={{ backgroundColor: 'transparent', border: '1px solid #30363d', borderRadius: 4, padding: '3px 8px', color: '#8b949e', fontSize: 11 }}>{selectedProject.country}</span>
            ) : null}
            {selectedProject.region ? (
              <span style={{ backgroundColor: 'transparent', border: '1px solid #30363d', borderRadius: 4, padding: '3px 8px', color: '#8b949e', fontSize: 11 }}>{selectedProject.region}</span>
            ) : null}
            {selectedProject.sector ? (
              <span style={{ backgroundColor: 'transparent', border: '1px solid #30363d', borderRadius: 4, padding: '3px 8px', color: '#8b949e', fontSize: 11 }}>{selectedProject.sector}</span>
            ) : null}
            {selectedProject.subsector ? (
              <span style={{ backgroundColor: 'transparent', border: '1px solid #30363d', borderRadius: 4, padding: '3px 8px', color: '#8b949e', fontSize: 11 }}>{selectedProject.subsector}</span>
            ) : null}
          </div>
        </div>

        <section style={panelCardStyle}>
          <div style={sectionLabelStyle}>
            ABOUT THIS PROJECT
          </div>
          <p
            style={{
              color: '#e6edf3',
              fontSize: 13,
              lineHeight: 1.6,
              margin: 0
            }}
          >
            {selectedProject.projectDescription?.trim() || "No project description available."}
          </p>
        </section>

        <section style={panelCardStyle}>
          <div style={sectionLabelStyle}>
            KEY DETAILS
          </div>
          <div>
            {keyDetails.map((detail) => (
              <div
                key={detail.label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  padding: '5px 0',
                  borderBottom: '1px solid #21262d'
                }}
              >
                <span
                  style={{
                    ...rowLabelStyle,
                    paddingRight: 8
                  }}
                >
                  {detail.label}
                </span>
                <span
                  style={{
                    ...rowValueStyle
                  }}
                >
                  {detail.value}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section
          style={{
            ...panelCardStyle,
            flex: 1
          }}
        >
          <div style={sectionLabelStyle}>
            CONSTRUCTIONFRONT COVERAGE
          </div>
          {error ? (
            <p style={{ color: '#ff7b7b' }}>{error}</p>
          ) : isLoading ? (
            <p style={{ color: '#94a3b8' }}>Loading coverage…</p>
          ) : cfArticles.length === 0 ? (
            <p style={{ color: '#8b949e', fontSize: 12 }}>No coverage recorded yet.</p>
          ) : (
            <>
              <div style={{ display: 'flex', overflowX: 'auto', gap: 10, paddingBottom: 6, scrollbarWidth: 'thin', scrollbarColor: '#30363d #161b22' }}>
              {cfArticles.map((source) => (
                <div key={source.sourceId} style={{ minWidth: 220, maxWidth: 220, backgroundColor: '#1c2128', borderLeft: '3px solid #f0a500', borderRadius: '0 6px 6px 0', padding: 10, flexShrink: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ color: '#8b949e', fontSize: 10 }}>{formatDate(source.publicationDate)}</span>
                    <span style={{ backgroundColor: 'rgba(240,165,0,0.15)', color: '#f0a500', fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 3 }}>CF Article</span>
                  </div>
                  <div style={{ color: '#e6edf3', fontSize: 11, fontWeight: 600, marginBottom: 4, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{source.sourceTitle ?? "ConstructionFront coverage"}</div>
                  {source.milestoneConfirmed ? (
                    <div style={{ color: '#f0a500', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{source.milestoneConfirmed}</div>
                  ) : null}
                  {source.sourceUrl ? (
                    <a
                      href={source.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#f0a500', fontSize: 10, fontWeight: 600, textDecoration: 'none' }}
                    >
                      Read on CF.com {"\u2192"}
                    </a>
                  ) : null}
                </div>
              ))}
              </div>
              {cfArticles.length > 1 ? (
                <div style={{ color: '#8b949e', fontSize: 10, marginTop: 4, textAlign: 'right' }}>
                  {cfArticles.length} articles {"\u2014"} scroll to see more {"\u2192"}
                </div>
              ) : null}
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default ProjectPanel;
