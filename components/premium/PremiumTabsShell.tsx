"use client";

import { useState } from "react";
import { useClerk } from "@clerk/nextjs";
import type { ProjectRecord, ProjectPartyRecord, ProjectSourceRecord, ProjectMilestoneRecord } from "@/types/database";
import ProjectIntelligenceTab from "./tabs/ProjectIntelligenceTab";

type PremiumTabsShellProps = {
  project: ProjectRecord;
  parties: ProjectPartyRecord[];
  sources: ProjectSourceRecord[];
  milestones: ProjectMilestoneRecord[];
  isAuthenticated: boolean;
};

export default function PremiumTabsShell({ project, parties, sources, milestones, isAuthenticated }: PremiumTabsShellProps) {
  const [activeTab, setActiveTab] = useState<"project" | "market" | "sources">("project");

  const placeholderText = {
    project: "Project Intelligence content coming soon.",
    market: "Market Signals content coming soon.",
    sources: "Sources content coming soon."
  };

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        backgroundColor: "var(--primary-bg)",
        borderTop: `1px solid var(--border)`
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "0 24px",
          height: 44,
          minHeight: 44,
          backgroundColor: "var(--secondary-bg)",
          borderBottom: `1px solid var(--border)`
        }}
      >
        {[
          { key: "project", label: "Project Intelligence" },
          { key: "market", label: "Market Signals" },
          { key: "sources", label: "Sources" }
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as "project" | "market" | "sources")}
            style={{
              border: "none",
              background: "transparent",
              color: activeTab === tab.key ? "var(--text)" : "var(--muted)",
              borderBottom: activeTab === tab.key ? `2px solid var(--amber)` : "2px solid transparent",
              padding: "10px 12px",
              cursor: "pointer",
              fontSize: 13
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {activeTab === 'project' ? (
          <ProjectIntelligenceTab
            project={project}
            parties={parties}
            milestones={milestones}
            sources={sources}
          />
        ) : (
          <>
            <h3 style={{ color: 'var(--amber)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.08em' }}>
              {activeTab === "market" ? "Market Signals" : "Sources"}
            </h3>
            <p style={{ color: 'var(--muted)' }}>{placeholderText[activeTab]}</p>
          </>
        )}
      </div>
    </div>
  );
}
