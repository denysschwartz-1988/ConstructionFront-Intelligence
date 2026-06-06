"use client";

import React, { useMemo, useState } from "react";
import type { ProjectMilestoneRecord, ProjectRecord } from "@/types/database";
import { bodyTextStyle, cardStyle, mutedTextStyle, sectionLabelStyle, tabRootStyle } from "@/lib/styles";

type TimelinesTabProps = {
  project: ProjectRecord;
  milestones: ProjectMilestoneRecord[];
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
          backgroundColor: "rgba(13,17,23,0.55)",
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
              color: "#0d1117",
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
              border: "1px solid #30363d",
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

export default function TimelinesTab({
  project,
  milestones,
  isAuthenticated
}: TimelinesTabProps) {
  const [showAllMilestones, setShowAllMilestones] = useState(false);

  const milestonesSorted = useMemo(() => {
    return [...milestones].sort((a, b) => {
      const da = a.milestoneDate ? new Date(a.milestoneDate).getTime() : 0;
      const db = b.milestoneDate ? new Date(b.milestoneDate).getTime() : 0;
      return db - da;
    });
  }, [milestones]);

  return (
    <div style={{ ...tabRootStyle, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={cardStyle}>
        <div style={sectionLabelStyle}>PROJECT PROGRAMME</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {[
              "Under Development",
              "FID / Procurement / Financing",
              "Contract Awarded",
              "Under Construction",
              "Construction Complete / Operational"
            ].map((stage, idx) => {
              const currentStage = project.currentProjectStage ?? "";
              const stageIndex = [
                "Under Development",
                "FID / Procurement / Financing",
                "Contract Awarded",
                "Under Construction",
                "Construction Complete / Operational"
              ].indexOf(currentStage);
              let circleStyle: React.CSSProperties = {
                width: 14,
                height: 14,
                borderRadius: 14,
                display: "inline-block"
              };
              let labelStyle: React.CSSProperties = { color: "#8b949e", fontSize: 12 };
              if (idx < stageIndex) {
                circleStyle = { ...circleStyle, background: "#94a3b8" };
              } else if (idx === stageIndex) {
                circleStyle = { ...circleStyle, background: "#f0a500" };
                labelStyle = { color: "#e6edf3", fontSize: 12 };
              } else {
                circleStyle = {
                  ...circleStyle,
                  border: "2px solid #94a3b8",
                  background: "transparent"
                };
              }

              return (
                <div
                  key={stage}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    flex: 1
                  }}
                >
                  <div style={circleStyle} />
                  <div style={{ marginTop: 6, textAlign: "center", ...labelStyle }}>
                    {stage}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <PremiumBlur isAuthenticated={isAuthenticated}>
        <div style={cardStyle}>
          <div style={sectionLabelStyle}>MILESTONE HISTORY</div>
          {milestonesSorted.length === 0 ? (
            <div style={{ color: "#8b949e" }}>No milestone history recorded yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {milestonesSorted
                .slice(0, showAllMilestones ? milestonesSorted.length : 5)
                .map((m) => (
                  <div
                    key={m.milestoneId}
                    style={{ display: "flex", gap: 12, alignItems: "flex-start" }}
                  >
                    <div
                      style={{
                        color: "#8b949e",
                        fontSize: 11,
                        width: 80,
                        flexShrink: 0
                      }}
                    >
                      {m.milestoneDate
                        ? new Date(m.milestoneDate).toLocaleString("en-US", {
                            month: "short",
                            year: "numeric"
                          })
                        : ""}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <div
                        style={{
                          background: "transparent",
                          border: "1px solid #f0a500",
                          color: "#f0a500",
                          fontSize: 10,
                          padding: "2px 6px",
                          borderRadius: 4,
                          display: "inline-block"
                        }}
                      >
                        {m.milestoneType}
                      </div>
                      <div style={{ color: "#e6edf3", fontSize: 13 }}>
                        {m.milestoneSummary}
                      </div>
                    </div>
                  </div>
                ))}

              {milestonesSorted.length > 5 && (
                <button
                  type="button"
                  onClick={() => setShowAllMilestones((v) => !v)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#f0a500",
                    cursor: "pointer"
                  }}
                >
                  {showAllMilestones ? "Show less" : `+ ${milestonesSorted.length - 5} more`}
                </button>
              )}
            </div>
          )}
        </div>
      </PremiumBlur>
    </div>
  );
}
