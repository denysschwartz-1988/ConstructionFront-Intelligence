import type { ProjectRecord } from "@/types/database";

export default function PlatformStats({
  projects,
  sourceCount
}: {
  projects: ProjectRecord[];
  sourceCount: number;
}) {
  const countries = new Set(projects.map((project) => project.country).filter(Boolean)).size;
  const sectors = new Set(projects.map((project) => project.sector).filter(Boolean)).size;
  const underConstruction = projects.filter((project) =>
    project.currentProjectStage?.includes("Under Construction")
  ).length;
  const activeProcurement = projects.filter(
    (project) =>
      project.currentProjectStage?.includes("FID") ||
      project.currentProjectStage?.includes("Contract Awarded")
  ).length;

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
        PLATFORM STATS
      </div>

      {[
        { label: "Projects tracked", value: projects.length },
        { label: "Countries covered", value: countries },
        { label: "Source documents", value: sourceCount },
        { label: "Active sectors", value: sectors },
        { label: "Under construction", value: underConstruction },
        { label: "Active procurement", value: activeProcurement }
      ].map((stat) => (
        <div
          key={stat.label}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px 0",
            borderBottom: "1px solid #162f52"
          }}
        >
          <span style={{ color: "#8b949e", fontSize: 12 }}>{stat.label}</span>
          <span style={{ color: "#f0a500", fontSize: 14, fontWeight: 700 }}>
            {stat.value}
          </span>
        </div>
      ))}
    </div>
  );
}
