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

function scoreRelatedProject(candidate: ProjectRecord, current: ProjectRecord): number {
  let score = 0;
  const sameCountry = candidate.country === current.country;
  const sameRegion = candidate.region === current.region;
  const sameSector = candidate.sector === current.sector;
  const sameSubsector = candidate.subsector === current.subsector;

  if (sameCountry && sameSubsector) score += 60;
  if (sameRegion && sameSubsector) score += 45;
  if (!sameRegion && sameSubsector) score += 30;
  if (sameCountry && sameSector && !sameSubsector) score += 20;
  if (sameRegion && sameSector && !sameSubsector) score += 10;
  if (!sameRegion && sameSector && !sameSubsector) score += 5;

  return score;
}

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

    const relatedProjectsWithScores = allProjects
      .filter((project) => {
        const sameParentProjectSlug =
          project.parentProjectSlug &&
          currentProject.parentProjectSlug &&
          project.parentProjectSlug === currentProject.parentProjectSlug;

        return (
          isDisplayProject(project) &&
          project.projectSlug !== currentProject.projectSlug &&
          !sameParentProjectSlug
        );
      })
      .map((project) => ({
        project,
        score: scoreRelatedProject(project, currentProject)
      }))
      .filter(({ score }) => score > 0);

    return relatedProjectsWithScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map(({ project }) => project);
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
