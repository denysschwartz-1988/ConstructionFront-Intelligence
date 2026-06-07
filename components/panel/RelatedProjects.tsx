"use client";

import { useMemo } from "react";
import { getStageBadgeStyle } from "@/lib/utils";
import type { ProjectRecord } from "@/types/database";

type RelatedProjectsProps = {
  currentProject: ProjectRecord;
  allProjects: ProjectRecord[];
  onProjectSelect: (project: ProjectRecord) => void;
};

const getTimestamp = (project: ProjectRecord) => {
  const value = project.lastUpdated ?? project.latestUpdateDate;
  const millis = value ? new Date(value).getTime() : 0;
  return Number.isFinite(millis) ? millis : 0;
};

export default function RelatedProjects({
  currentProject,
  allProjects,
  onProjectSelect
}: RelatedProjectsProps) {
  const relatedProjects = useMemo(() => {
    if (!currentProject) {
      return [];
    }

    const others = allProjects.filter(
      (project) =>
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
    <div style={{ padding: 16 }}>
      <div
        style={{
          color: "#f0a500",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: 12
        }}
      >
        RELATED PROJECTS
      </div>

      {relatedProjects.map((project) => {
        return (
          <div
            key={project.projectSlug}
            onClick={() => onProjectSelect(project)}
            style={{
              backgroundColor: "#132845",
              border: "1px solid #1e3a5f",
              borderRadius: 8,
              padding: "12px 14px",
              marginBottom: 8,
              cursor: "pointer",
              transition: "border-color 0.15s"
            }}
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
                  width: "100%",
                  height: 72,
                  objectFit: "cover",
                  borderRadius: 6,
                  marginBottom: 10,
                  display: "block"
                }}
              />
            ) : null}
            <div
              style={{
                color: "#e6edf3",
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 4
              }}
            >
              {project.projectName}
            </div>

            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                flexWrap: "wrap"
              }}
            >
              <span style={{ color: "#8b949e", fontSize: 11 }}>{project.country}</span>
              <span style={{ color: "#444c56", fontSize: 11 }}>&middot;</span>
              <span style={{ color: "#8b949e", fontSize: 11 }}>
                {project.subsector || project.sector}
              </span>
              <span style={{ color: "#444c56", fontSize: 11 }}>&middot;</span>
              {project.capacityDisplay ? (
                <>
                  <span style={{ color: "#8b949e", fontSize: 11 }}>
                    {project.capacityDisplay}
                  </span>
                  <span style={{ color: "#444c56", fontSize: 11 }}>&middot;</span>
                </>
              ) : null}
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  padding: "1px 6px",
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

      {relatedProjects.length === 0 ? (
        <div style={{ color: "#8b949e", fontSize: 12 }}>
          No related projects found in this sector.
        </div>
      ) : null}
    </div>
  );
}
