"use client";

import { formatDate, getStageBadgeStyle } from "@/lib/utils";
import type { ProjectRecord } from "@/types/database";

type ProjectListViewProps = {
  projects: ProjectRecord[];
  selectedProject: ProjectRecord | null;
  onProjectSelect: (project: ProjectRecord) => void;
};

const columns = [
  "",
  "Project",
  "Region",
  "Country",
  "Sector",
  "Subsector",
  "Last Updated",
  "Status"
];

const colgroup = (
  <colgroup>
    <col style={{ width: 88 }} />
    <col style={{ width: "22%" }} />
    <col style={{ width: "10%" }} />
    <col style={{ width: "10%" }} />
    <col style={{ width: "10%" }} />
    <col style={{ width: "10%" }} />
    <col style={{ width: "10%" }} />
    <col style={{ width: 110 }} />
  </colgroup>
);

const cellTextStyle = {
  padding: "20px 12px",
  color: "#8b949e",
  fontSize: 12,
  overflow: "hidden",
  whiteSpace: "nowrap",
  textOverflow: "ellipsis"
} as const;

const isDisplayProject = (project: ProjectRecord) => {
  const hierarchy = (project as unknown as { projectHierarchy?: string | null }).projectHierarchy;
  return project.recordType !== "Programme" && hierarchy !== "Parent";
};

export default function ProjectListView({
  projects,
  selectedProject,
  onProjectSelect
}: ProjectListViewProps) {
  const displayProjects = projects.filter(isDisplayProject);

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      }}
    >
      <div
        style={{
          backgroundColor: "#0f2240",
          borderBottom: "1px solid #1e3a5f",
          flexShrink: 0
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            tableLayout: "fixed"
          }}
        >
          {colgroup}
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  style={{
                    padding: "8px 12px",
                    textAlign: "left",
                    color: "#8b949e",
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    whiteSpace: "nowrap"
                  }}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
        </table>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            tableLayout: "fixed"
          }}
        >
          {colgroup}
          <tbody>
            {displayProjects.map((project) => {
              const isSelected = selectedProject?.projectSlug === project.projectSlug;
              const lastUpdated =
                project.lastUpdated ?? project.last_updated ?? project.updatedAt;

              return (
                <tr
                  key={project.projectSlug}
                  onClick={() => onProjectSelect(project)}
                  style={{
                    borderBottom: "1px solid #162f52",
                    cursor: "pointer",
                    backgroundColor: isSelected ? "#132845" : "transparent"
                  }}
                  onMouseEnter={(event) => {
                    if (!isSelected) {
                      event.currentTarget.style.backgroundColor = "#0f2240";
                    }
                  }}
                  onMouseLeave={(event) => {
                    if (!isSelected) {
                      event.currentTarget.style.backgroundColor = "transparent";
                    }
                  }}
                >
                  <td style={{ padding: "8px 10px", width: 88 }}>
                    {project.projectImageUrl ? (
                      <img
                        src={project.projectImageUrl}
                        alt=""
                        style={{
                          width: 72,
                          height: 72,
                          objectFit: "cover",
                          borderRadius: 6,
                          display: "block"
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 72,
                          height: 72,
                          backgroundColor: "#162f52",
                          borderRadius: 6,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#444c56",
                          fontSize: 24
                        }}
                      >
                        {"\u{1f3d7}"}
                      </div>
                    )}
                  </td>

                  <td
                    style={{
                      padding: "20px 12px",
                      color: "#e6edf3",
                      fontSize: 12,
                      fontWeight: 600,
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis"
                    }}
                  >
                    {project.projectName}
                  </td>

                  <td style={cellTextStyle}>{project.region || "\u2014"}</td>
                  <td style={cellTextStyle}>{project.country || "\u2014"}</td>
                  <td style={cellTextStyle}>{project.sector || "\u2014"}</td>
                  <td style={cellTextStyle}>{project.subsector || "\u2014"}</td>
                  <td
                    style={{
                      padding: "20px 12px",
                      color: "#8b949e",
                      fontSize: 12,
                      whiteSpace: "nowrap"
                    }}
                  >
                    {formatDate(lastUpdated)}
                  </td>
                  <td style={{ padding: "20px 8px 20px 0" }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        padding: "3px 8px",
                        borderRadius: 4,
                        display: "inline-block",
                        lineHeight: 1.4,
                        maxWidth: 100,
                        textAlign: "center",
                        whiteSpace: "normal",
                        ...getStageBadgeStyle(project.currentProjectStage)
                      }}
                    >
                      {project.currentProjectStage}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
