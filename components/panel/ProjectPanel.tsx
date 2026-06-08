"use client";

import { useEffect, useState } from "react";
import type { ProjectPartyRecord, ProjectRecord, ProjectSourceRecord } from "@/types/database";
import { cleanCityArea, formatDate, formatProjectValue, getStageBadgeStyle } from "@/lib/utils";
import { cardStyle, rowLabelStyle, rowValueStyle, sectionLabelStyle } from "@/lib/styles";

export type ProjectPanelProps = {
  selectedProject: ProjectRecord;
  projectParties: ProjectPartyRecord[];
  projectSources: ProjectSourceRecord[];
  onClose: () => void;
  isLoading?: boolean;
  error?: string | null;
};

const panelCardStyle = cardStyle;

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

const ProjectPanel = ({
  selectedProject,
  projectParties,
  projectSources,
  onClose,
  isLoading,
  error
}: ProjectPanelProps) => {
  const [currentArticleIndex, setCurrentArticleIndex] = useState(0);
  const headerLabel = selectedProject.projectName ?? selectedProject.projectSlug;
  const ownerDeveloper = getPartyNames(projectParties, "Developer / Owner");
  const publicAuthority = getPartyNames(projectParties, "Public Authority");
  const contractor = isContractorVisible(selectedProject)
    ? selectedProject.leadContractor?.trim()
    : "";
  const scaleSize = selectedProject.capacityDisplay?.trim() ?? "";
  const projectValue = formatProjectValue(
    selectedProject.projectValueAmount,
    selectedProject.projectValueCurrency,
    selectedProject.projectValueScale
  );
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
  const currentArticle = cfArticles[currentArticleIndex] ?? cfArticles[0];
  const keyDetails = [
    { label: "Owner / Developer", value: ownerDeveloper },
    { label: "Public Authority", value: publicAuthority },
    { label: "Main Contractor", value: contractor },
    { label: "Scale / Size", value: scaleSize },
    { label: "Est. Project Value", value: projectValue },
    { label: "Location", value: locationParts }
  ].filter((detail) => detail.value);

  useEffect(() => {
    if (cfArticles.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setCurrentArticleIndex((previous) => (previous + 1) % cfArticles.length);
    }, 4000);

    return () => window.clearInterval(timer);
  }, [cfArticles.length]);

  useEffect(() => {
    setCurrentArticleIndex(0);
  }, [selectedProject.projectSlug]);

  return (
    <div
      style={{
        fontSize: 13,
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        backgroundColor: '#0a1628'
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

      <div style={{ height: 160, width: '100%', overflow: 'hidden', backgroundColor: '#0f2240', flexShrink: 0 }}>
        {selectedProject.projectImageUrl ? (
          <img
            src={selectedProject.projectImageUrl}
            alt={selectedProject.projectName ?? "Project image"}
            style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f2240', color: '#64748b' }}>
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
              <span style={{ backgroundColor: 'transparent', border: '1px solid #1e3a5f', borderRadius: 4, padding: '3px 8px', color: '#8b949e', fontSize: 11 }}>{selectedProject.country}</span>
            ) : null}
            {selectedProject.region ? (
              <span style={{ backgroundColor: 'transparent', border: '1px solid #1e3a5f', borderRadius: 4, padding: '3px 8px', color: '#8b949e', fontSize: 11 }}>{selectedProject.region}</span>
            ) : null}
            {selectedProject.sector ? (
              <span style={{ backgroundColor: 'transparent', border: '1px solid #1e3a5f', borderRadius: 4, padding: '3px 8px', color: '#8b949e', fontSize: 11 }}>{selectedProject.sector}</span>
            ) : null}
            {selectedProject.subsector ? (
              <span style={{ backgroundColor: 'transparent', border: '1px solid #1e3a5f', borderRadius: 4, padding: '3px 8px', color: '#8b949e', fontSize: 11 }}>{selectedProject.subsector}</span>
            ) : null}
          </div>
        </div>

        <section style={{ ...panelCardStyle, marginBottom: 14 }}>
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

        <section style={{ ...panelCardStyle, marginBottom: 14 }}>
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
                  borderBottom: '1px solid #162f52'
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
            backgroundColor: '#0f2240',
            border: '1px solid #1e3a5f',
            borderRadius: 8,
            padding: '10px 12px',
            marginBottom: 14
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
          ) : currentArticle ? (
            <>
              <div
                style={{
                  backgroundColor: '#0a1e3a',
                  borderLeft: '3px solid #f0a500',
                  borderRadius: '0 6px 6px 0',
                  padding: '10px 12px',
                  marginTop: 6,
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ color: '#8b949e', fontSize: 11 }}>
                    {formatDate(currentArticle.publicationDate)}
                  </span>
                  <span style={{ backgroundColor: 'rgba(240,165,0,0.15)', color: '#f0a500', fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 3 }}>
                    CF Article
                  </span>
                </div>

                <div
                  style={{
                    color: '#e6edf3',
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 6,
                    lineHeight: 1.4
                  }}
                >
                  {currentArticle.sourceTitle ?? "ConstructionFront coverage"}
                </div>

                {currentArticle.summary ? (
                  <div
                    style={{
                      color: '#8b949e',
                      fontSize: 12,
                      lineHeight: 1.5,
                      marginBottom: 8
                    }}
                  >
                    {currentArticle.summary}
                  </div>
                ) : null}

                {/* Removed secondary label (milestoneConfirmed) as requested */}

                {currentArticle.sourceUrl ? (
                  <a
                    href={currentArticle.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#f0a500', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}
                  >
                    Read on ConstructionFront.com {"\u2192"}
                  </a>
                ) : null}
              </div>

              {cfArticles.length > 1 ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 8,
                    gap: 8
                  }}
                >
                  <div style={{ display: 'flex', gap: 5 }}>
                    {cfArticles.map((article, index) => (
                      <button
                        key={article.sourceId}
                        type="button"
                        aria-label={`Show coverage article ${index + 1}`}
                        onClick={() => setCurrentArticleIndex(index)}
                        style={{
                          width: index === currentArticleIndex ? 16 : 6,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: index === currentArticleIndex ? '#f0a500' : '#1e3a5f',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          padding: 0
                        }}
                      />
                    ))}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#8b949e', fontSize: 10 }}>
                      {currentArticleIndex + 1} of {cfArticles.length}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentArticleIndex((previous) =>
                          (previous - 1 + cfArticles.length) % cfArticles.length
                        )
                      }
                      style={{
                        backgroundColor: 'transparent',
                        border: '1px solid #1e3a5f',
                        borderRadius: 4,
                        color: '#8b949e',
                        fontSize: 11,
                        padding: '2px 6px',
                        cursor: 'pointer'
                      }}
                    >
                      {"\u2190"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentArticleIndex((previous) => (previous + 1) % cfArticles.length)
                      }
                      style={{
                        backgroundColor: 'transparent',
                        border: '1px solid #1e3a5f',
                        borderRadius: 4,
                        color: '#8b949e',
                        fontSize: 11,
                        padding: '2px 6px',
                        cursor: 'pointer'
                      }}
                    >
                      {"\u2192"}
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          ) : null}
        </section>
      </div>
    </div>
  );
};

export default ProjectPanel;
