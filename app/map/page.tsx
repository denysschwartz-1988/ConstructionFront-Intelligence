export const dynamic = 'force-dynamic'
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import TopBar from "@/components/layout/TopBar";
import LatestUpdatesTicker from "@/components/layout/LatestUpdatesTicker";
import ProjectListView from "@/components/list/ProjectListView";
import ProjectMap from "@/components/map/ProjectMap";
import EmptyPanel from "@/components/panel/EmptyPanel";
import EmptyTabsPlaceholder from "@/components/panel/EmptyTabsPlaceholder";
import ProjectPanel from "@/components/panel/ProjectPanel";
import PremiumTabsShell from "@/components/premium/PremiumTabsShell";
import { supabase } from "@/lib/supabase/client";
import type {
  ProjectRecord,
  ProjectPartyRecord,
  ProjectSourceRecord,
  ProjectMilestoneRecord
} from "@/types/database";

const isValidProject = (project: ProjectRecord) => {
  return Boolean(
    project.projectDescription?.trim() &&
      project.latitude != null &&
      project.longitude != null
  );
};

const getUpdateTimestamp = (project: ProjectRecord) => {
  const value = project.latestUpdateDate?.trim();
  const millis = value ? new Date(value).getTime() : 0;
  return Number.isFinite(millis) ? millis : 0;
};

export default function Home() {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectRecord | null>(null);
  const [projectParties, setProjectParties] = useState<ProjectPartyRecord[]>([]);
  const [projectSources, setProjectSources] = useState<ProjectSourceRecord[]>([]);
  const [projectMilestones, setProjectMilestones] = useState<ProjectMilestoneRecord[]>([]);
  const [coverageCount, setCoverageCount] = useState<number>(0);
  const [panelLoading, setPanelLoading] = useState(false);
  const [panelError, setPanelError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("All Regions");
  const [selectedSector, setSelectedSector] = useState("All Sectors");
  const [selectedCountry, setSelectedCountry] = useState("All Countries");
  const [selectedSubsector, setSelectedSubsector] = useState("All Subsectors");
  const [selectedStage, setSelectedStage] = useState("All Project Stages");
  const [view, setView] = useState<"map" | "list">("map");
  const [mapFocusRequest, setMapFocusRequest] = useState(0);
  const [tickerOpen, setTickerOpen] = useState(true);
  const [topHeight, setTopHeight] = useState(52);
  const isDragging = useRef(false);

  const handleMouseDown = () => {
    isDragging.current = true;
  };

  useEffect(() => {
    const loadProjects = async () => {
      const { data, error } = await supabase
        .from("projects_master")
        .select("*")
        .not("projectDescription", "is", null)
        .neq("projectDescription", "");

      if (error) {
        console.error("Failed to load projects:", error.message);
        return;
      }

      const filtered = (data ?? []).filter(isValidProject);
      const sorted = filtered.sort(
        (a, b) => getUpdateTimestamp(b) - getUpdateTimestamp(a)
      );

      setProjects(sorted);
      if (sorted.length) {
        setSelectedProject(sorted[0]);
      }
    };

    loadProjects();

    const fetchCoverageCount = async () => {
      const { count, error } = await supabase
        .from('project_sources')
        .select('*', { count: 'exact', head: true });

      if (!error) {
        setCoverageCount(count ?? 0);
      } else {
        console.error('Failed to load coverage count:', error.message);
      }
    };

    fetchCoverageCount();
  }, []);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isDragging.current) {
        return;
      }

      const container = document.getElementById("main-grid");
      if (!container) {
        return;
      }

      const rect = container.getBoundingClientRect();
      const percentage = ((event.clientY - rect.top) / rect.height) * 100;
      const clamped = Math.min(Math.max(percentage, 25), 75);
      setTopHeight(clamped);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  useEffect(() => {
    if (!selectedProject) {
      setProjectParties([]);
      setProjectSources([]);
      setPanelError(null);
      return;
    }

    const fetchDetails = async () => {
      setPanelLoading(true);
      setPanelError(null);

        const [partiesResponse, sourcesResponse, milestonesResponse] = await Promise.all([
          supabase
            .from("project_parties")
            .select("*")
            .eq("projectSlug", selectedProject.projectSlug),
          supabase
            .from("project_sources")
            .select("*")
            .eq("projectSlug", selectedProject.projectSlug),
          supabase
            .from("project_milestones")
            .select("*")
            .eq("projectSlug", selectedProject.projectSlug)
            .order('milestoneDate', { ascending: false })
        ]);

      if (partiesResponse.error || sourcesResponse.error) {
        setPanelError(
          partiesResponse.error?.message ?? sourcesResponse.error?.message ??
            "Failed to load project details."
        );
        setProjectParties([]);
        setProjectSources([]);
        setPanelLoading(false);
        return;
      }

      setProjectParties(partiesResponse.data ?? []);
      setProjectSources(sourcesResponse.data ?? []);
      setProjectMilestones(milestonesResponse.data ?? []);
      setPanelLoading(false);
    };

    fetchDetails();
  }, [selectedProject]);

  const filteredProjects = useMemo(() => {
    let result = projects;

    if (searchValue.trim()) {
      const query = searchValue.toLowerCase();
      result = result.filter(
        (project) =>
          project.projectName?.toLowerCase().includes(query) ||
          project.country?.toLowerCase().includes(query) ||
          project.sector?.toLowerCase().includes(query) ||
          project.subsector?.toLowerCase().includes(query) ||
          project.cityArea?.toLowerCase().includes(query)
      );
    }

    if (selectedRegion && selectedRegion !== "All Regions") {
      result = result.filter((project) => project.region === selectedRegion);
    }

    if (selectedCountry && selectedCountry !== "All Countries") {
      result = result.filter((project) => project.country === selectedCountry);
    }

    if (selectedSector && selectedSector !== "All Sectors") {
      result = result.filter((project) => project.sector === selectedSector);
    }

    if (selectedSubsector && selectedSubsector !== "All Subsectors") {
      result = result.filter((project) => project.subsector === selectedSubsector);
    }

    if (selectedStage && selectedStage !== "All Project Stages") {
      result = result.filter((project) => project.currentProjectStage === selectedStage);
    }

    return result.sort((a, b) => getUpdateTimestamp(b) - getUpdateTimestamp(a));
  }, [projects, searchValue, selectedRegion, selectedCountry, selectedSector, selectedSubsector, selectedStage]);

  const regions = useMemo(
    () => ["All Regions", ...new Set(projects.map((project) => project.region).filter(Boolean) as string[])],
    [projects]
  );
  const countries = useMemo(
    () =>
      ["All Countries", ...new Set(projects.map((project) => project.country).filter(Boolean) as string[])].sort(),
    [projects]
  );
  const sectors = useMemo(
    () =>
      ["All Sectors", ...new Set(projects.map((project) => project.sector).filter(Boolean) as string[])].sort(),
    [projects]
  );
  const subsectors = useMemo(
    () =>
      ["All Subsectors", ...new Set(projects.map((project) => project.subsector).filter(Boolean) as string[])].sort(),
    [projects]
  );
  const stages = useMemo(
    () => ["All Project Stages", ...new Set(projects.map((project) => project.currentProjectStage).filter(Boolean) as string[])],
    [projects]
  );

  const mapProjects = useMemo(() => {
    if (!selectedProject) {
      return filteredProjects;
    }

    const exists = filteredProjects.some(
      (project) => project.projectSlug === selectedProject.projectSlug
    );

    return exists ? filteredProjects : [selectedProject, ...filteredProjects];
  }, [filteredProjects, selectedProject]);

  const handleProjectSelect = (project: ProjectRecord | null) => {
    setSelectedProject(project);
  };

  const handleViewChange = (newView: "map" | "list") => {
    setView(newView);

    if (
      newView === "map" &&
      selectedProject?.latitude != null &&
      selectedProject.longitude != null
    ) {
      setMapFocusRequest((current) => current + 1);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "#0d1117"
      }}
    >
      <div style={{ flex: "0 0 56px" }}>
        <TopBar
          visibleCount={filteredProjects.length}
          projectCount={projects.length}
          coverageCount={coverageCount}
          searchValue={searchValue}
          selectedRegion={selectedRegion}
          selectedSector={selectedSector}
          selectedCountry={selectedCountry}
          selectedSubsector={selectedSubsector}
          selectedStage={selectedStage}
          regionOptions={regions}
          countryOptions={countries}
          sectorOptions={sectors}
          subsectorOptions={subsectors}
          stageOptions={stages}
          onSearchChange={setSearchValue}
          onRegionChange={setSelectedRegion}
          onSectorChange={setSelectedSector}
          onCountryChange={setSelectedCountry}
          onSubsectorChange={setSelectedSubsector}
          onStageChange={setSelectedStage}
        />
      </div>

      <div
        style={{
          flex: "0 0 auto",
          height: tickerOpen ? 36 : 0,
          overflow: "hidden"
        }}
      >
        <LatestUpdatesTicker
          projects={filteredProjects}
          isOpen={tickerOpen}
          onToggle={() => setTickerOpen((current) => !current)}
          onProjectSelect={handleProjectSelect}
        />
      </div>

      <div
        id="main-grid"
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "75% 25%",
          gridTemplateRows: `${topHeight}% 4px ${100 - topHeight}%`,
          overflow: "hidden",
          minHeight: 0
        }}
      >
        <div
          style={{
            gridColumn: 1,
            gridRow: 1,
            overflow: "hidden",
            borderRight: "1px solid #30363d",
            borderBottom: "1px solid #30363d",
            position: "relative",
            minHeight: 0
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              zIndex: 1000,
              display: "flex",
              backgroundColor: "rgba(13,17,23,0.9)",
              border: "1px solid #30363d",
              borderRadius: 6,
              overflow: "hidden",
              backdropFilter: "blur(4px)"
            }}
          >
            <button
              type="button"
              onClick={() => handleViewChange("map")}
              style={{
                padding: "6px 14px",
                fontSize: 12,
                fontWeight: 600,
                backgroundColor: view === "map" ? "#f0a500" : "transparent",
                color: view === "map" ? "#0d1117" : "#8b949e",
                border: "none",
                cursor: "pointer",
                borderRight: "1px solid #30363d",
                display: "flex",
                alignItems: "center",
                gap: 4
              }}
            >
              {"\u{1f5fa}"} Map
            </button>
            <button
              type="button"
              onClick={() => handleViewChange("list")}
              style={{
                padding: "6px 14px",
                fontSize: 12,
                fontWeight: 600,
                backgroundColor: view === "list" ? "#f0a500" : "transparent",
                color: view === "list" ? "#0d1117" : "#8b949e",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4
              }}
            >
              {"\u2261"} List
            </button>
          </div>
          {view === "map" ? (
            <ProjectMap
              projects={mapProjects}
              focusProject={selectedProject}
              focusRequest={mapFocusRequest}
              onProjectSelect={handleProjectSelect}
            />
          ) : (
            <ProjectListView
              projects={filteredProjects}
              selectedProject={selectedProject}
              onProjectSelect={handleProjectSelect}
            />
          )}
        </div>

        <div
          style={{
            gridColumn: 2,
            gridRow: "1 / 4",
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            overflowX: "hidden",
            backgroundColor: "#161b22",
            borderLeft: "1px solid #30363d",
            scrollbarWidth: "thin",
            scrollbarColor: "#30363d #161b22",
            minHeight: 0
          }}
          className="premium-tab-content"
        >
          {selectedProject ? (
            <ProjectPanel
              selectedProject={selectedProject}
              projectParties={projectParties}
              projectSources={projectSources}
              onClose={() => setSelectedProject(null)}
              isLoading={panelLoading}
              error={panelError}
            />
          ) : (
            <EmptyPanel />
          )}
        </div>

        <div
          style={{
            gridColumn: "1 / -1",
            gridRow: 2,
            height: 4,
            backgroundColor: "#30363d",
            cursor: "row-resize",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            zIndex: 10
          }}
          onMouseDown={handleMouseDown}
          onMouseEnter={(event) => {
            event.currentTarget.style.backgroundColor = "#f0a500";
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.backgroundColor = "#30363d";
          }}
        >
          <div
            style={{
              width: 32,
              height: 3,
              backgroundColor: "#444c56",
              borderRadius: 2
            }}
          />
        </div>

        <div
          style={{
            gridColumn: 1,
            gridRow: 3,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            borderRight: "1px solid #30363d",
            minHeight: 0
          }}
        >
          {selectedProject ? (
            <PremiumTabsShell
              project={selectedProject}
              parties={projectParties}
              sources={projectSources}
              milestones={projectMilestones}
              allProjects={projects}
              onProjectSelect={handleProjectSelect}
            />
          ) : (
            <EmptyTabsPlaceholder />
          )}
        </div>

      </div>
    </div>
  );
}
