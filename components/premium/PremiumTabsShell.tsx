"use client";

import { useState } from "react";
import type { ProjectRecord, ProjectPartyRecord, ProjectSourceRecord, ProjectMilestoneRecord } from "@/types/database";
import ProjectIntelligenceTab from "./tabs/ProjectIntelligenceTab";
import TimelinesTab from "./tabs/TimelinesTab";
import MarketSignalsTab from "./tabs/MarketSignalsTab";
import SourcesTab from "./tabs/SourcesTab";
import RelatedProjectsTab from "./tabs/RelatedProjectsTab";
import ProjectReportTab from "./tabs/ProjectReportTab";

type PremiumTabsShellProps = {
  project: ProjectRecord;
  parties: ProjectPartyRecord[];
  sources: ProjectSourceRecord[];
  milestones: ProjectMilestoneRecord[];
  allProjects: ProjectRecord[];
  onProjectSelect: (project: ProjectRecord) => void;
};

export default function PremiumTabsShell({
  project,
  parties,
  sources,
  milestones,
  allProjects,
  onProjectSelect
}: PremiumTabsShellProps) {
  const isAuthenticated = true;
  const [activeTab, setActiveTab] = useState<
    "project" | "timelines" | "market" | "related" | "sources" | "report"
  >("project");
  const tabs = [
    { key: "project", label: "Project Intelligence" },
    { key: "timelines", label: "Timelines & Milestones" },
    { key: "market", label: "Market Signals" },
    { key: "related", label: "Related Projects" },
    { key: "sources", label: "Sources" },
    { key: "report", label: "Project Report" }
  ] as const;
  const premiumTabs = [
    "Project Intelligence",
    "Timelines & Milestones",
    "Market Signals",
    "Sources",
    "Project Report"
  ];

  return (
    <div
      style={{
        fontSize: 13,
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        backgroundColor: "#0f2240",
        borderTop: `1px solid var(--border)`
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 44,
          minHeight: 44,
          backgroundColor: "#0f2240",
          borderBottom: "1px solid #1e3a5f",
          padding: "0 24px"
        }}
      >
        <div style={{ display: "flex", gap: 0 }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              style={{
                backgroundColor: "transparent",
                border: "none",
                borderBottom:
                  activeTab === tab.key
                    ? "2px solid #f0a500"
                    : "2px solid transparent",
                color: activeTab === tab.key ? "#e6edf3" : "#8b949e",
                fontSize: 13,
                fontWeight: activeTab === tab.key ? 600 : 400,
                padding: "0 16px",
                height: 44,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4
              }}
            >
              {!isAuthenticated && premiumTabs.includes(tab.label) ? (
                <span style={{ fontSize: 9, opacity: 0.7 }}>{"\u{1f512}"}</span>
              ) : null}
              {tab.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            // open report modal
          }}
          style={{
            backgroundColor: "transparent",
            border: "1px solid #f0a500",
            borderRadius: 6,
            color: "#f0a500",
            fontSize: 11,
            fontWeight: 600,
            padding: "4px 12px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
            letterSpacing: "0.04em"
          }}
          onMouseEnter={(event) => {
            event.currentTarget.style.backgroundColor = "rgba(240,165,0,0.1)";
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          {"\u2691"} Report an Update
        </button>
      </div>
      <div
        className="premium-tab-content"
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          backgroundColor: "#0a1628",
          scrollbarWidth: "thin",
          scrollbarColor: "#1e3a5f #0a1628"
        }}
      >
        {activeTab === 'project' ? (
          <ProjectIntelligenceTab
            project={project}
            parties={parties}
            sources={sources}
            milestones={milestones}
            isAuthenticated={isAuthenticated}
          />
        ) : null}
        {activeTab === "timelines" ? (
          <TimelinesTab
            project={project}
            milestones={milestones}
            sources={sources}
            isAuthenticated={isAuthenticated}
          />
        ) : null}
        {activeTab === "market" ? (
          <MarketSignalsTab project={project} isAuthenticated={isAuthenticated} />
        ) : null}
        {activeTab === "sources" ? (
          <SourcesTab project={project} sources={sources} isAuthenticated={isAuthenticated} />
        ) : null}
        {activeTab === "related" ? (
          <RelatedProjectsTab
            currentProject={project}
            allProjects={allProjects}
            onProjectSelect={onProjectSelect}
            isAuthenticated={isAuthenticated}
          />
        ) : null}
        {activeTab === "report" ? (
          <ProjectReportTab project={project} isAuthenticated={isAuthenticated} />
        ) : null}
      </div>
    </div>
  );
}
