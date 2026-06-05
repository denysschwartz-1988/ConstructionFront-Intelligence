"use client";

import { useMemo } from "react";
import { getStageBadgeStyle } from "@/lib/utils";
import type { ProjectRecord } from "@/types/database";

type LatestUpdatesTickerProps = {
  projects: ProjectRecord[];
  isOpen: boolean;
  onToggle: () => void;
  onProjectSelect: (project: ProjectRecord) => void;
};

const getUpdateTimestamp = (project: ProjectRecord) => {
  const value = project.latestUpdateDate?.trim();
  const millis = value ? new Date(value).getTime() : 0;
  return Number.isFinite(millis) ? millis : 0;
};

const getProjectValue = (project: ProjectRecord) => {
  if (project.projectValueAmount == null) {
    return null;
  }

  const currency = project.projectValueCurrency?.trim();
  const scale = project.projectValueScale?.trim();

  return [currency, project.projectValueAmount, scale]
    .filter((value) => value !== undefined && value !== null && value !== "")
    .join(" ");
};

const Separator = () => (
  <span style={{ color: "#475569", fontSize: 12 }} aria-hidden="true">
    &middot;
  </span>
);

export default function LatestUpdatesTicker({
  projects,
  isOpen,
  onToggle,
  onProjectSelect
}: LatestUpdatesTickerProps) {
  const sorted = useMemo(
    () =>
      [...projects]
        .filter((project) => project.projectName)
        .sort((a, b) => getUpdateTimestamp(b) - getUpdateTimestamp(a)),
    [projects]
  );

  const tickerItems = [...sorted, ...sorted];

  return (
    <div
      style={{
        height: isOpen ? 36 : 0,
        overflow: "hidden",
        transition: "height 0.25s ease",
        backgroundColor: "#0f172a",
        borderTop: "1px solid #30363d",
        display: "flex",
        alignItems: "center",
        padding: isOpen ? "0 24px" : "0",
        minHeight: isOpen ? 36 : 0
      }}
    >
      <style>{`
        @keyframes tickerScroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .ticker-project-item:hover {
          opacity: 0.8;
        }
      `}</style>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flex: "1 1 auto",
          minWidth: 0,
          overflow: "hidden"
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "0 12px",
            flexShrink: 0,
            borderRight: "1px solid var(--border)",
            color: "var(--amber)",
            fontSize: 11,
            fontWeight: 700,
            paddingRight: 16,
            letterSpacing: "0.08em"
          }}
        >
          LATEST UPDATES
        </div>

        <div
          style={{
            position: "relative",
            flex: "1 1 auto",
            minWidth: 0,
            overflow: "hidden"
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 0,
              paddingLeft: 24,
              minWidth: "max-content",
              animation: "tickerScroll 300s linear infinite"
            }}
          >
            {tickerItems.map((project, index) => {
              const capacityDisplay = project.capacityDisplay?.trim();
              const projectValue = getProjectValue(project);
              const stageLabel = project.currentProjectStage?.trim() || "Stage unknown";

              return (
                <button
                  type="button"
                  key={`${project.projectSlug}-${index}`}
                  className="ticker-project-item"
                  onClick={() => onProjectSelect(project)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "transparent",
                    border: "none",
                    color: "var(--text)",
                    whiteSpace: "nowrap",
                    padding: "0 24px",
                    borderRight:
                      index % 2 === 0
                        ? "1px solid rgba(255,255,255,0.04)"
                        : undefined,
                    cursor: "pointer",
                    opacity: 1,
                    transition: "opacity 0.15s ease"
                  }}
                >
                  <span
                    style={{
                      color: "#e6edf3",
                      fontSize: 13,
                      fontWeight: 600
                    }}
                  >
                    {project.projectName}
                  </span>

                  {capacityDisplay ? (
                    <>
                      <Separator />
                      <span
                        style={{
                          color: "#94a3b8",
                          fontSize: 12,
                          fontWeight: 400
                        }}
                      >
                        {capacityDisplay}
                      </span>
                    </>
                  ) : null}

                  {projectValue ? (
                    <>
                      <Separator />
                      <span
                        style={{
                          color: "#94a3b8",
                          fontSize: 12,
                          fontWeight: 400
                        }}
                      >
                        {projectValue}
                      </span>
                    </>
                  ) : null}

                  <Separator />
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "2px 7px",
                      borderRadius: 3,
                      fontSize: 11,
                      fontWeight: 600,
                      ...getStageBadgeStyle(stageLabel)
                    }}
                  >
                    {stageLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onToggle}
        style={{
          flexShrink: 0,
          padding: "0 12px",
          background: "transparent",
          border: "none",
          color: "#64748b",
          cursor: "pointer"
        }}
      >
        {isOpen ? "\u25b2" : "\u25bc"}
      </button>
    </div>
  );
}
