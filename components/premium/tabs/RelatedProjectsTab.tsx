"use client";

import { useMemo } from "react";
import { getStageBadgeStyle } from "@/lib/utils";
import type { ProjectRecord } from "@/types/database";
import { cardStyle, mutedTextStyle, sectionLabelStyle, tabRootStyle } from "@/lib/styles";

type RelatedProjectsTabProps = {
  currentProject: ProjectRecord;
  allProjects: ProjectRecord[];
  onProjectSelect: (project: ProjectRecord) => void;
  isAuthenticated: boolean;
};

const getTimestamp = (project: ProjectRecord) => {
  const value = project.lastUpdated ?? project.latestUpdateDate;
  const millis = value ? new Date(value).getTime() : 0;
  return Number.isFinite(millis) ? millis : 0;
};

const isDisplayProject = (project: ProjectRecord) => {
  const hierarchy = (project as unknown as { projectHierarchy?: string | null }).projectHierarchy;
  return project.recordType !== "Programme" && hierarchy !== "Parent";
};

const relatedCardStyle = {
  ...cardStyle,
  cursor: "pointer",
  display: "flex",
  flexDirection: "row",
  gap: 12,
  alignItems: "center"
} as const;

export default function RelatedProjectsTab({
  currentProject,
  allProjects,
  onProjectSelect,
  isAuthenticated: _isAuthenticated
}: RelatedProjectsTabProps) {
  const relatedProjects = useMemo(() => {
    if (!currentProject) {
      return [];
    }

    const others = allProjects.filter(
      (project) =>
        isDisplayProject(project) &&
        project.projectSlug !== currentProject.projectSlug &&
        project.projectDescription
    );

    const sameCountryAndSector = others.filter(
      (project) =>
        project.sector === currentProject.sector &&
        project.country === currentProject.country
    );

    const sameSectorOnly = others.filter(
      (project) =>
        project.sector === currentProject.sector &&
        project.country !== currentProject.country &&
        !sameCountryAndSector.includes(project)
    );

    return [...sameCountryAndSector, ...sameSectorOnly]
      .sort((a, b) => getTimestamp(b) - getTimestamp(a))
      .slice(0, 4);
  }, [currentProject, currentProject.projectSlug, allProjects]);

  return (
    <div style={tabRootStyle}>
      <div style={sectionLabelStyle}>
        RELATED PROJECTS
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {relatedProjects.map((project) => {
          return (
            <div
              key={project.projectSlug}
              onClick={() => onProjectSelect(project)}
              style={relatedCardStyle}
              onMouseEnter={(event) => {
                event.currentTarget.style.borderColor = "#f0a500";
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.borderColor = "#1e3a5f";
              }}
            >
              {project.projectImageUrl ? (
                <img
                  src={project.projectImageUrl}
                  alt={project.projectName ?? "Related project"}
                  style={{
                    width: 56,
                    height: 56,
                    objectFit: "cover",
                    borderRadius: 6,
                    flexShrink: 0
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 56,
                    height: 56,
                    backgroundColor: "#162f52",
                    borderRadius: 6,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#444c56",
                    fontSize: 20
                  }}
                >
                  {"\u{1f3d7}"}
                </div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    color: "#e6edf3",
                    fontSize: 12,
                    fontWeight: 600,
                    marginBottom: 4,
                    lineHeight: 1.3,
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical"
                  }}
                >
                  {project.projectName}
                </div>
                <div
                  style={{
                    ...mutedTextStyle,
                    marginBottom: 4,
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis"
                  }}
                >
                  {[project.country, project.subsector || project.sector, project.capacityDisplay]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: "1px 5px",
                    borderRadius: 3,
                    ...getStageBadgeStyle(project.currentProjectStage)
                  }}
                >
                  {project.currentProjectStage}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {relatedProjects.length === 0 ? (
        <div
          style={{
            color: "#8b949e",
            fontSize: 13,
            textAlign: "center",
            padding: "32px 0"
          }}
        >
          No related projects found in this sector.
        </div>
      ) : null}
    </div>
  );
}
