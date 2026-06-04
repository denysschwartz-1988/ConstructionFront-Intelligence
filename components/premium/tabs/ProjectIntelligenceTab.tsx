"use client";

import React, { useMemo, useState } from "react";
import type { ProjectRecord, ProjectPartyRecord, ProjectMilestoneRecord, ProjectSourceRecord } from "@/types/database";

type Props = {
  project: ProjectRecord;
  parties: ProjectPartyRecord[];
  milestones: ProjectMilestoneRecord[];
  sources: ProjectSourceRecord[];
};

const cardStyle: React.CSSProperties = {
  backgroundColor: "#161b22",
  border: "1px solid #30363d",
  borderRadius: 8,
  padding: 16
};

const sectionLabelStyle: React.CSSProperties = {
  color: "#f0a500",
  fontSize: 10,
  letterSpacing: "0.08em",
  fontWeight: 600,
  textTransform: "uppercase",
  marginBottom: 8
};

export default function ProjectIntelligenceTab({ project, parties, milestones, sources }: Props) {
  const [showAllParties, setShowAllParties] = useState(false);
  const [showAllMilestones, setShowAllMilestones] = useState(false);

  const projectDescriptionFull = project.projectDescription ?? project.projectSummary ?? "";
  const otherKeyInfo = project.sourceNotes ?? "";

  const partiesByRole = useMemo(() => {
    const map = new Map<string, ProjectPartyRecord[]>();
    parties.forEach((p) => {
      const key = p.roleCategory ?? "Other";
      const arr = map.get(key) ?? [];
      arr.push(p);
      map.set(key, arr);
    });
    return Array.from(map.entries());
  }, [parties]);

  const milestonesSorted = useMemo(() => {
    return [...milestones].sort((a, b) => {
      const da = a.milestoneDate ? new Date(a.milestoneDate).getTime() : 0;
      const db = b.milestoneDate ? new Date(b.milestoneDate).getTime() : 0;
      return db - da;
    });
  }, [milestones]);

  const latestCfArticle = sources
    .filter((s) => s.sourceType === "CF Article")
    .sort((a, b) => {
      const da = a.publicationDate ? new Date(a.publicationDate).getTime() : 0;
      const db = b.publicationDate ? new Date(b.publicationDate).getTime() : 0;
      return db - da;
    })[0];

  const now = Date.now();
  const ninetyDays = 90 * 24 * 60 * 60 * 1000;

  return (
    <div style={{ width: "100%", padding: 0, background: "transparent" }}>
      {/* Layout container */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* CARD 1 - ABOUT THE PROJECT */}
        {(projectDescriptionFull || otherKeyInfo) && (
          <div style={cardStyle}>
            <div style={sectionLabelStyle}>ABOUT THE PROJECT</div>
            {projectDescriptionFull ? (
              <p style={{ color: "#e6edf3", fontSize: 13, lineHeight: 1.6 }}>{projectDescriptionFull}</p>
            ) : null}
            {otherKeyInfo ? (
              <>
                <div style={{ borderTop: "1px solid #30363d", margin: "12px 0" }} />
                <p style={{ color: "#e6edf3", fontSize: 13, lineHeight: 1.6 }}>{otherKeyInfo}</p>
              </>
            ) : null}
          </div>
        )}

        {/* CARD 2 - KEY PARTIES */}
        {parties.length > 0 && (
          <div style={cardStyle}>
            <div style={sectionLabelStyle}>KEY PARTIES</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {partiesByRole.slice(0, showAllParties ? partiesByRole.length : 6).map(([role, group]) => (
                <div key={role}>
                  <div style={{ color: "#e6edf3", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{role}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {group.map((p) => (
                      <div key={p.partyId}>
                        <div style={{ color: "#e6edf3", fontSize: 13, fontWeight: 500 }}>{p.partyName}</div>
                        <div style={{ color: "#8b949e", fontSize: 11 }}>{p.roleDetail ?? p.partyRole}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {partiesByRole.length > 6 && (
                <button
                  type="button"
                  onClick={() => setShowAllParties((v) => !v)}
                  style={{ marginTop: 8, background: "transparent", border: "none", color: "#f0a500", cursor: 'pointer' }}
                >
                  {showAllParties ? "Show less" : `+ ${partiesByRole.length - 6} more`}
                </button>
              )}
            </div>
          </div>
        )}

        {/* CARD 3 - PROJECT KEY FEATURES */}
        <div style={cardStyle}>
          <div style={sectionLabelStyle}>{project.recordType === "Programme" ? "PROGRAMME STRUCTURE" : "PROJECT KEY FEATURES"}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ color: '#8b949e', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.05 }}>
                Owner / Developer
              </div>
              <div style={{ color: '#e6edf3', fontSize: 13, fontWeight: 500 }}>{project.ownerDeveloper}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ color: '#8b949e', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.05 }}>
                Main Contractor
              </div>
              <div style={{ color: '#e6edf3', fontSize: 13, fontWeight: 500 }}>{project.leadContractor}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ color: '#8b949e', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.05 }}>
                Scale / Size
              </div>
              <div style={{ color: '#e6edf3', fontSize: 13, fontWeight: 500 }}>{project.capacityDisplay}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ color: '#8b949e', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.05 }}>
                Location
              </div>
              <div style={{ color: '#e6edf3', fontSize: 13, fontWeight: 500 }}>{[project.country, project.stateProvince, project.cityArea].filter(Boolean).join(' / ').slice(0,40)}</div>
            </div>
          </div>
        </div>

        {/* CARD 4 - PROJECT PROGRAMME (stage track) */}
        <div style={cardStyle}>
          <div style={sectionLabelStyle}>PROJECT PROGRAMME</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Stage track */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {['Under Development', 'FID / Procurement / Financing', 'Contract Awarded', 'Under Construction', 'Construction Complete / Operational'].map((stage, idx) => {
                const currentStage = project.currentProjectStage ?? '';
                const stageIndex = ['Under Development', 'FID / Procurement / Financing', 'Contract Awarded', 'Under Construction', 'Construction Complete / Operational'].indexOf(currentStage);
                let circleStyle: React.CSSProperties = { width: 14, height: 14, borderRadius: 14, display: 'inline-block' };
                let labelStyle: React.CSSProperties = { color: '#8b949e', fontSize: 12 };
                if (idx < stageIndex) {
                  circleStyle = { ...circleStyle, background: '#94a3b8' };
                } else if (idx === stageIndex) {
                  circleStyle = { ...circleStyle, background: '#f0a500' };
                  labelStyle = { color: '#e6edf3', fontSize: 12 };
                } else {
                  circleStyle = { ...circleStyle, border: '2px solid #94a3b8', background: 'transparent' };
                }

                return (
                  <div key={stage} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                    <div style={circleStyle} />
                    <div style={{ marginTop: 6, textAlign: 'center', ...labelStyle }}>{stage}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* CARD 5 - LATEST INTELLIGENCE */}
        <div style={cardStyle}>
          <div style={sectionLabelStyle}>LATEST INTELLIGENCE</div>
          <div style={{ color: '#8b949e', fontSize: 12, marginBottom: 8 }}>
            {project.latestUpdateDate ? `Updated: ${new Date(project.latestUpdateDate).toLocaleString('en-US', { month: 'short', year: 'numeric' })}` : 'Updated: -'}
          </div>
          <div style={{ color: '#e6edf3', fontSize: 13 }}>{project.latestUpdateSummary}</div>
          <div style={{ marginTop: 12 }}>
            {latestCfArticle && latestCfArticle.publicationDate && (now - new Date(latestCfArticle.publicationDate).getTime() <= ninetyDays) ? (
              <a href={latestCfArticle.sourceUrl ?? '#'} target="_blank" rel="noreferrer" style={{ background: '#f0a500', color: '#0b1a2d', padding: '8px 12px', borderRadius: 6, textDecoration: 'none' }}>
                Read Detailed Coverage on ConstructionFront.com →
              </a>
            ) : null}
          </div>
        </div>

        {/* CARD 6 - MILESTONE HISTORY */}
        <div style={cardStyle}>
          <div style={sectionLabelStyle}>MILESTONE HISTORY</div>
          {milestonesSorted.length === 0 ? (
            <div style={{ color: '#8b949e' }}>No milestone history recorded yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {milestonesSorted.slice(0, showAllMilestones ? milestonesSorted.length : 5).map((m) => (
                <div key={m.milestoneId} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ color: '#8b949e', fontSize: 11, width: 80, flexShrink: 0 }}>{m.milestoneDate ? new Date(m.milestoneDate).toLocaleString('en-US', { month: 'short', year: 'numeric' }) : ''}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ background: 'transparent', border: '1px solid #f0a500', color: '#f0a500', fontSize: 10, padding: '2px 6px', borderRadius: 4, display: 'inline-block' }}>{m.milestoneType}</div>
                    <div style={{ color: '#e6edf3', fontSize: 13 }}>{m.milestoneSummary}</div>
                  </div>
                </div>
              ))}

              {milestonesSorted.length > 5 && (
                <button type="button" onClick={() => setShowAllMilestones((v) => !v)} style={{ background: 'transparent', border: 'none', color: '#f0a500', cursor: 'pointer' }}>
                  {showAllMilestones ? 'Show less' : `+ ${milestonesSorted.length - 5} more`}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
