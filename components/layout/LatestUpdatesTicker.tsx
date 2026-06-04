"use client";

import { useMemo } from "react";
import { getStageColor } from "@/lib/utils";
import type { ProjectRecord } from "@/types/database";

type LatestUpdatesTickerProps = {
  projects: ProjectRecord[];
  isOpen: boolean;
  onToggle: () => void;
};

const getUpdateTimestamp = (project: ProjectRecord) => {
  const value = project.latestUpdateDate?.trim();
  const millis = value ? new Date(value).getTime() : 0;
  return Number.isFinite(millis) ? millis : 0;
};

export default function LatestUpdatesTicker({ projects, isOpen, onToggle }: LatestUpdatesTickerProps) {
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
        height: isOpen ? 40 : 0,
        overflow: "hidden",
        transition: "height 0.25s ease",
        backgroundColor: "#0f172a",
        borderTop: "1px solid #334155",
        display: "flex",
        alignItems: "center",
        padding: isOpen ? "0 24px" : "0",
        minHeight: isOpen ? 40 : 0
      }}
    >
      <style>{`
        @keyframes tickerScroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
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
                minWidth: "max-content",
                animation: "tickerScroll 120s linear infinite"
              }}
          >
            {tickerItems.map((project, index) => {
              const badgeColor = getStageColor(project.currentProjectStage ?? undefined);
              return (
                <div
                  key={`${project.projectSlug}-${index}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                      gap: 8,
                    color: "var(--text)",
                      whiteSpace: "nowrap",
                      padding: "0 12px",
                    borderRight: index % 2 === 0 ? "1px solid rgba(255,255,255,0.04)" : undefined
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                      {project.projectName}
                    </span>
                  <span style={{ color: 'var(--muted)', fontSize: 12, margin: '0 6px' }}>
                    ·
                  </span>
                  <span style={{ color: 'var(--muted)', fontSize: 12, opacity: 0.9 }}>
                    {project.capacityDisplay ?? "–"}
                  </span>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "2px 8px",
                      borderRadius: 999,
                        backgroundColor: `${badgeColor}20`,
                        color: badgeColor,
                        fontSize: 10,
                        fontWeight: 500
                    }}
                  >
                    {project.currentProjectStage ?? "Stage unknown"}
                  </span>
                </div>
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
        {isOpen ? "▲" : "▼"}
      </button>
    </div>
  );
}
