"use client";

import React, { useMemo } from "react";
import type { ProjectMilestoneRecord, ProjectRecord, ProjectSourceRecord } from "@/types/database";
import { cardStyle, mutedTextStyle, sectionLabelStyle, tabRootStyle } from "@/lib/styles";

type TimelinesTabProps = {
  project: ProjectRecord;
  milestones: ProjectMilestoneRecord[];
  sources?: ProjectSourceRecord[];
  isAuthenticated: boolean;
};

const PremiumBlur = ({
  isAuthenticated,
  children
}: {
  isAuthenticated: boolean;
  children: React.ReactNode;
}) => (
  <div style={{ position: "relative" }}>
    <div
      style={{
        filter: isAuthenticated ? "none" : "blur(5px)",
        userSelect: isAuthenticated ? "auto" : "none",
        pointerEvents: isAuthenticated ? "auto" : "none",
        transition: "filter 0.3s ease"
      }}
    >
      {children}
    </div>

    {!isAuthenticated ? (
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          backgroundColor: "rgba(10,22,40,0.55)",
          borderRadius: 8,
          zIndex: 10
        }}
      >
        <div style={{ fontSize: 28 }}>{"\u{1f512}"}</div>
        <div style={{ color: "#e6edf3", fontSize: 15, fontWeight: 700 }}>
          Premium Intelligence
        </div>
        <div
          style={{
            color: "#8b949e",
            fontSize: 12,
            textAlign: "center",
            maxWidth: 300,
            lineHeight: 1.6
          }}
        >
          Sign in to access full project intelligence, market signals, source analysis and related projects.
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <a
            href="/sign-up"
            style={{
              backgroundColor: "#f0a500",
              color: "#0a1628",
              fontWeight: 700,
              padding: "9px 20px",
              borderRadius: 6,
              textDecoration: "none",
              fontSize: 13
            }}
          >
            Get Started {"->"}
          </a>
          <a
            href="/sign-in"
            style={{
              backgroundColor: "transparent",
              color: "#e6edf3",
              border: "1px solid #1e3a5f",
              padding: "9px 20px",
              borderRadius: 6,
              textDecoration: "none",
              fontSize: 13
            }}
          >
            Sign In
          </a>
        </div>
      </div>
    ) : null}
  </div>
);

function getMilestoneLabel(milestoneType: string | null): string {
  if (!milestoneType) return "";
  const map: Record<string, string> = {
    "Approval / Permitting": "Approval",
    "Procurement Launch": "Procurement Launch",
    "Shortlist": "Shortlist",
    "Preferred Bidder": "Preferred Bidder",
    "Contract Award": "Contract Award",
    "Financial Close": "Financial Close",
    "Construction Start": "Construction Start",
    "Construction Complete": "Construction Complete",
    "Operations Start": "Operations Start"
  };
  return map[milestoneType.trim()] ?? milestoneType;
}

function getMilestoneBadgeStyle(milestoneType: string): React.CSSProperties {
  const t = milestoneType.toLowerCase();
  if ([
    "under construction",
    "groundbreaking",
    "construction milestone",
    "substantial completion",
    "construction completed",
    "first power / first production",
    "commercial operations",
    "traffic open / revenue service",
    "notice to proceed — full"
  ].some((v) => t.includes(v))) {
    return { backgroundColor: "#166534", color: "#4ade80" };
  }
  if ([
    "contract award",
    "preferred bidder",
    "shortlist",
    "procurement launch",
    "feed / fel",
    "eci / pre-construction",
    "notice to proceed — limited"
  ].some((v) => t.includes(v))) {
    return { backgroundColor: "#1e3a5f", color: "#60a5fa" };
  }
  if ([
    "fid / financial close",
    "financing / investment",
    "ppa / offtake",
    "refinancing"
  ].some((v) => t.includes(v))) {
    return { backgroundColor: "#78350f", color: "#fbbf24" };
  }
  if ([
    "dispute / settlement",
    "m&a"
  ].some((v) => t.includes(v))) {
    return { backgroundColor: "#7f1d1d", color: "#f87171" };
  }
  return { backgroundColor: "#1e3a5f", color: "#8b949e" };
}

function formatMilestoneHistoryDate(milestoneDate: string | null | undefined): string {
  if (!milestoneDate?.trim()) {
    return "";
  }

  const date = new Date(milestoneDate);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

function cleanMilestoneSummary(summary: string | null | undefined): string {
  const phrases = [
    "Under Review",
    "Source-supported",
    "Source supported",
    "yet to be confirmed",
    "is yet to be confirmed",
    "not yet confirmed",
    "ConstructionFront Intelligence indicates",
    "ConstructionFront intelligence indicates",
    "timing is inconsistent",
    "not captured",
    "Construction start timing yet to be confirmed",
    "Operation timing is inconsistent"
  ];

  return phrases
    .reduce((cleaned, phrase) => {
      return cleaned.replace(new RegExp(phrase, "gi"), "");
    }, summary ?? "")
    .replace(/\s+/g, " ")
    .replace(/\s+([.,;:])/g, "$1")
    .trim();
}

export default function TimelinesTab({
  project,
  milestones,
  sources = [],
  isAuthenticated
}: TimelinesTabProps) {
  const projectStages = [
    "Under Development",
    "FID / Procurement / Financing",
    "Contract Awarded",
    "Under Construction",
    "Construction Complete / Operational"
  ];
  const currentStageIndex = projectStages.indexOf(String(project.currentProjectStage ?? "").trim());

  const isHiddenProgrammeValue = (value: unknown) => {
    const trimmed = String(value ?? "").trim();
    return (
      trimmed === "" ||
      trimmed === "Unknown" ||
      trimmed === "N/A" ||
      trimmed === "Under Review"
    );
  };

  const formatMilestoneProgrammeDate = (value: unknown) => {
    if (isHiddenProgrammeValue(value)) {
      return "";
    }

    const date = new Date(String(value).trim());
    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const hasMonth = !/^\d{4}$/.test(String(value).trim());
    if (!hasMonth) {
      return String(date.getUTCFullYear());
    }

    return date.toLocaleString("en-US", {
      month: "short",
      year: "numeric",
      timeZone: "UTC"
    });
  };

  const getMostRecentMilestoneValue = (milestoneType: string) => {
    const matchingMilestone = milestones
      .filter((milestone) => milestone.milestoneType === milestoneType)
      .sort((a, b) => {
        const da = a.milestoneDate ? new Date(a.milestoneDate).getTime() : 0;
        const db = b.milestoneDate ? new Date(b.milestoneDate).getTime() : 0;
        return db - da;
      })[0];

    return formatMilestoneProgrammeDate(matchingMilestone?.milestoneDate);
  };

  const getMostRecentMilestoneSortDate = (milestoneType: string) => {
    const matchingMilestone = milestones
      .filter((milestone) => milestone.milestoneType === milestoneType)
      .sort((a, b) => {
        const da = a.milestoneDate ? new Date(a.milestoneDate).getTime() : 0;
        const db = b.milestoneDate ? new Date(b.milestoneDate).getTime() : 0;
        return db - da;
      })[0];

    return matchingMilestone?.milestoneDate
      ? new Date(matchingMilestone.milestoneDate).getTime()
      : 0;
  };

  const formatTimelineFieldValue = (year: unknown, precision: unknown) => {
    if (isHiddenProgrammeValue(year)) {
      return "";
    }

    const yearValue = String(year).trim();
    return String(precision ?? "").trim() === "Indicative"
      ? `${yearValue} (indicative)`
      : yearValue;
  };

  const getTimelineFieldSortDate = (year: unknown) => {
    if (isHiddenProgrammeValue(year)) {
      return 0;
    }

    return new Date(`${String(year).trim()}-01-01`).getTime();
  };

  const programmeRows = [
    {
      label: "Planning Approval",
      value: getMostRecentMilestoneValue("Approval / Permitting"),
      sortDate: getMostRecentMilestoneSortDate("Approval / Permitting")
    },
    {
      label: "EOI / ROI",
      value: getMostRecentMilestoneValue("EOI / ROI"),
      sortDate: getMostRecentMilestoneSortDate("EOI / ROI")
    },
    {
      label: "Procurement Launch",
      value: getMostRecentMilestoneValue("Procurement Launch"),
      sortDate: getMostRecentMilestoneSortDate("Procurement Launch")
    },
    {
      label: "Shortlist",
      value: getMostRecentMilestoneValue("Shortlist"),
      sortDate: getMostRecentMilestoneSortDate("Shortlist")
    },
    {
      label: "Preferred Bidder",
      value: getMostRecentMilestoneValue("Preferred Bidder"),
      sortDate: getMostRecentMilestoneSortDate("Preferred Bidder")
    },
    {
      label: "FID / Financial Close",
      value: getMostRecentMilestoneValue("FID / Financial Close"),
      sortDate: getMostRecentMilestoneSortDate("FID / Financial Close")
    },
    {
      label: "Contract Awarded",
      value: getMostRecentMilestoneValue("Contract Award"),
      sortDate: getMostRecentMilestoneSortDate("Contract Award")
    },
    {
      label: "Construction Start",
      value: formatTimelineFieldValue(
        project.constructionStartYear,
        project.constructionStartPrecision
      ),
      sortDate: getTimelineFieldSortDate(project.constructionStartYear)
    },
    {
      label: "Completion",
      value: formatTimelineFieldValue(
        project.constructionCompletionYear,
        project.constructionCompletionPrecision
      ),
      sortDate: getTimelineFieldSortDate(project.constructionCompletionYear)
    },
    {
      label: "Operations",
      value: formatTimelineFieldValue(
        project.operationsStartYear,
        project.operationsStartPrecision
      ),
      sortDate: getTimelineFieldSortDate(project.operationsStartYear)
    }
  ]
    .filter((row) => !isHiddenProgrammeValue(row.value))
    .sort((a, b) => a.sortDate - b.sortDate);

  const milestoneHistoryRows = useMemo(() => {
    return [...milestones].sort((a, b) => {
      const da = a.milestoneDate ? new Date(a.milestoneDate).getTime() : 0;
      const db = b.milestoneDate ? new Date(b.milestoneDate).getTime() : 0;
      return da - db;
    }).map((milestone) => {
      const sourceId = (milestone as unknown as { sourceId?: string | null }).sourceId;
      const source = sources.find((item) => item.sourceId === sourceId);
      const cleanedSummary = cleanMilestoneSummary(milestone.milestoneSummary);
      const sourceUrl = source?.sourceUrl?.trim() || "";

      return {
        milestone,
        cleanedSummary,
        date: formatMilestoneHistoryDate(milestone.milestoneDate),
        sourceUrl,
        sourceType: source?.sourceType,
        sourceTitle: source?.sourceTitle,
        publisher: source?.publisher
      };
    }).filter((row) => row.cleanedSummary.length >= 5);
  }, [milestones, sources]);

  return (
    <div style={tabRootStyle}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={cardStyle}>
          <div style={sectionLabelStyle}>PROJECT STAGE</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {projectStages.map((stage, index) => {
              const isPastStage = currentStageIndex !== -1 && index < currentStageIndex;
              const isCurrentStage = index === currentStageIndex;

              return (
                <div
                  key={stage}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10
                  }}
                >
                  <div
                    style={{
                      width: isCurrentStage ? 16 : 14,
                      height: isCurrentStage ? 16 : 14,
                      borderRadius: "50%",
                      backgroundColor: isCurrentStage
                        ? "#f0a500"
                        : isPastStage
                          ? "#8b949e"
                          : "transparent",
                      border:
                        !isPastStage && !isCurrentStage ? "2px solid #1e3a5f" : undefined,
                      flexShrink: 0
                    }}
                  />
                  <div
                    style={{
                      color: isCurrentStage ? "#f0a500" : "#8b949e",
                      fontSize: 12,
                      fontWeight: isCurrentStage ? 600 : 400
                    }}
                  >
                    {stage}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={sectionLabelStyle}>KEY DATES</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {programmeRows.map((row, index) => (
                <div
                  key={row.label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "6px 0",
                    borderBottom:
                      index === programmeRows.length - 1 ? "none" : "1px solid #1e3a5f",
                    gap: 12
                  }}
                >
                  <div
                    style={{
                      color: "#8b949e",
                      fontSize: 12,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em"
                    }}
                  >
                    {row.label}
                  </div>
                  <div
                    style={{
                      color: "#e6edf3",
                      fontSize: 13,
                      fontWeight: 500,
                      textAlign: "right"
                    }}
                  >
                    {row.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <PremiumBlur isAuthenticated={isAuthenticated}>
          <div style={cardStyle}>
            <div style={sectionLabelStyle}>MILESTONE HISTORY</div>
            {milestoneHistoryRows.length === 0 ? (
              <div style={mutedTextStyle}>No milestone history recorded yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {milestoneHistoryRows.map((row, index) => {
                  const milestoneTypes = String(row.milestone.milestoneType ?? "")
                    .split("|")
                    .map((type) => type.trim())
                    .filter(Boolean);

                  return (
                    <div
                      key={row.milestone.milestoneId}
                      style={{
                        paddingTop: 12,
                        paddingBottom: 12,
                        borderBottom:
                          index === milestoneHistoryRows.length - 1 ? "none" : "1px solid #1e3a5f"
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 6
                        }}
                      >
                        {row.date ? (
                          <span style={{ color: "#8b949e", fontSize: 12 }}>{row.date}</span>
                        ) : null}
                        {milestoneTypes.map((milestoneType) => (
                          <span
                            key={milestoneType}
                            style={{
                              ...getMilestoneBadgeStyle(milestoneType),
                              fontSize: 11,
                              fontWeight: 600,
                              padding: "2px 8px",
                              borderRadius: 4
                            }}
                          >
                            {getMilestoneLabel(milestoneType)}
                          </span>
                        ))}
                      </div>
                      <div
                        style={{
                          color: "#e6edf3",
                          fontSize: 13,
                          lineHeight: 1.6,
                          marginBottom: 6
                        }}
                      >
                        {row.cleanedSummary}
                      </div>
                      {row.sourceUrl ? (
                        <a
                          href={row.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            color: "#f0a500",
                            fontSize: 12,
                            textDecoration: "none",
                            display: "inline-block",
                            marginTop: 6
                          }}
                        >
                          Read article →
                        </a>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </PremiumBlur>
      </div>
    </div>
  );
}
