"use client";
export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import TopBar from "@/components/layout/TopBar";
import LatestUpdatesTicker from "@/components/layout/LatestUpdatesTicker";
import ProjectListView from "@/components/list/ProjectListView";
import ProjectMap from "@/components/map/ProjectMap";
import type { ProjectMapHandle } from "@/components/map/ProjectMap";
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

const isDisplayProject = (project: ProjectRecord) => {
  const hierarchy = (project as unknown as { projectHierarchy?: string | null }).projectHierarchy;
  return project.recordType !== "Programme" && hierarchy !== "Parent";
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
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [selectedSubsectors, setSelectedSubsectors] = useState<string[]>([]);
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [view, setView] = useState<"map" | "list">("map");
  const [mapFocusRequest, setMapFocusRequest] = useState(0);
  const [tickerOpen, setTickerOpen] = useState(true);
  const [topHeight, setTopHeight] = useState(52);
  const [leftWidth, setLeftWidth] = useState(75);
  const isDragging = useRef(false);
  const isDraggingVertical = useRef(false);
  const projectMapRef = useRef<ProjectMapHandle>(null);

  const handleMouseDown = () => {
    isDragging.current = true;
  };

  const handleVerticalMouseDown = () => {
    isDraggingVertical.current = true;
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
      setSelectedProject(null);
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

    const handleVerticalMouseMove = (event: MouseEvent) => {
      if (!isDraggingVertical.current) {
        return;
      }

      const container = document.getElementById("main-grid");
      if (!container) {
        return;
      }

      const rect = container.getBoundingClientRect();
      const percentage = ((event.clientX - rect.left) / rect.width) * 100;
      const clamped = Math.min(Math.max(percentage, 40), 85);
      setLeftWidth(clamped);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      isDraggingVertical.current = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousemove", handleVerticalMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousemove", handleVerticalMouseMove);
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

    if (selectedRegions.length > 0) {
      result = result.filter((project) => selectedRegions.includes(project.region ?? ""));
    }

    if (selectedCountries.length > 0) {
      result = result.filter((project) => selectedCountries.includes(project.country ?? ""));
    }

    if (selectedSectors.length > 0) {
      result = result.filter((project) => selectedSectors.includes(project.sector ?? ""));
    }

    if (selectedSubsectors.length > 0) {
      result = result.filter((project) => selectedSubsectors.includes(project.subsector ?? ""));
    }

    if (selectedStages.length > 0) {
      result = result.filter((project) => selectedStages.includes(project.currentProjectStage ?? ""));
    }

    return [...result].sort((a, b) => getUpdateTimestamp(b) - getUpdateTimestamp(a));
  }, [
    projects,
    searchValue,
    selectedRegions,
    selectedCountries,
    selectedSectors,
    selectedSubsectors,
    selectedStages
  ]);

  useEffect(() => {
    if (!projectMapRef.current) {
      return;
    }

    const allDefault =
      selectedRegions.length === 0 &&
      selectedCountries.length === 0 &&
      selectedSectors.length === 0 &&
      selectedSubsectors.length === 0 &&
      selectedStages.length === 0;

    if (allDefault) {
      projectMapRef.current.resetView();
      return;
    }

    if (filteredProjects.length > 0) {
      projectMapRef.current.flyToProjects(filteredProjects);
    }
  }, [
    selectedRegions,
    selectedCountries,
    selectedSectors,
    selectedSubsectors,
    selectedStages,
    filteredProjects
  ]);

  const regions = useMemo(
    () => ["All Regions", ...new Set(projects.map((project) => project.region).filter(Boolean) as string[])],
    [projects]
  );
  const countries = useMemo(() => {
    const base =
      selectedRegions.length === 0
        ? projects
        : projects.filter((project) => selectedRegions.includes(project.region ?? ""));

    return [...new Set(base.map((project) => project.country).filter(Boolean) as string[])].sort();
  }, [projects, selectedRegions]);
  const sectors = useMemo(() => {
    let base = projects;

    if (selectedRegions.length > 0) {
      base = base.filter((project) => selectedRegions.includes(project.region ?? ""));
    }

    if (selectedCountries.length > 0) {
      base = base.filter((project) => selectedCountries.includes(project.country ?? ""));
    }

    return [...new Set(base.map((project) => project.sector).filter(Boolean) as string[])].sort();
  }, [projects, selectedRegions, selectedCountries]);
  const subsectors = useMemo(() => {
    let base = projects;

    if (selectedRegions.length > 0) {
      base = base.filter((project) => selectedRegions.includes(project.region ?? ""));
    }

    if (selectedCountries.length > 0) {
      base = base.filter((project) => selectedCountries.includes(project.country ?? ""));
    }

    if (selectedSectors.length > 0) {
      base = base.filter((project) => selectedSectors.includes(project.sector ?? ""));
    }

    return [...new Set(base.map((project) => project.subsector).filter(Boolean) as string[])].sort();
  }, [projects, selectedRegions, selectedCountries, selectedSectors]);
  const stages = useMemo(() => {
    let base = projects;

    if (selectedRegions.length > 0) {
      base = base.filter((project) => selectedRegions.includes(project.region ?? ""));
    }

    if (selectedCountries.length > 0) {
      base = base.filter((project) => selectedCountries.includes(project.country ?? ""));
    }

    if (selectedSectors.length > 0) {
      base = base.filter((project) => selectedSectors.includes(project.sector ?? ""));
    }

    if (selectedSubsectors.length > 0) {
      base = base.filter((project) => selectedSubsectors.includes(project.subsector ?? ""));
    }

    return [...new Set(base.map((project) => project.currentProjectStage).filter(Boolean) as string[])];
  }, [projects, selectedRegions, selectedCountries, selectedSectors, selectedSubsectors]);

  useEffect(() => {
    setSelectedCountries([]);
    setSelectedSectors([]);
    setSelectedSubsectors([]);
    setSelectedStages([]);
  }, [selectedRegions]);

  useEffect(() => {
    setSelectedSectors([]);
    setSelectedSubsectors([]);
    setSelectedStages([]);
  }, [selectedCountries]);

  useEffect(() => {
    setSelectedSubsectors([]);
    setSelectedStages([]);
  }, [selectedSectors]);

  useEffect(() => {
    setSelectedStages([]);
  }, [selectedSubsectors]);

  const mapProjects = useMemo(() => {
    if (!selectedProject) {
      return filteredProjects;
    }

    const exists = filteredProjects.some(
      (project) => project.projectSlug === selectedProject.projectSlug
    );

    return exists ? filteredProjects : [selectedProject, ...filteredProjects];
  }, [filteredProjects, selectedProject]);
  const visibleProjectCount = filteredProjects.filter(isDisplayProject).length;
  const projectCount = projects.filter(isDisplayProject).length;

  const handleProjectSelect = useCallback((project: ProjectRecord | null) => {
    setSelectedProject(project);

    if (project?.latitude != null && project.longitude != null) {
      projectMapRef.current?.flyToProject(project);
    }
  }, []);

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
        fontSize: 13,
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "#0a1628"
      }}
    >
      <div style={{ flex: "0 0 56px" }}>
        <TopBar
          visibleCount={visibleProjectCount}
          projectCount={projectCount}
          coverageCount={coverageCount}
          searchValue={searchValue}
          selectedRegions={selectedRegions}
          selectedCountries={selectedCountries}
          selectedSectors={selectedSectors}
          selectedSubsectors={selectedSubsectors}
          selectedStages={selectedStages}
          regionOptions={regions}
          countryOptions={countries}
          sectorOptions={sectors}
          subsectorOptions={subsectors}
          stageOptions={stages}
          onSearchChange={setSearchValue}
          onRegionsChange={setSelectedRegions}
          onCountriesChange={setSelectedCountries}
          onSectorsChange={setSelectedSectors}
          onSubsectorsChange={setSelectedSubsectors}
          onStagesChange={setSelectedStages}
          viewMode={view}
          setViewMode={handleViewChange}
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
          gridTemplateColumns: view === "list" ? "100%" : `${leftWidth}% 4px ${100 - leftWidth}%`,
          gridTemplateRows: `${topHeight}% 4px ${100 - topHeight}%`,
          overflow: "hidden",
          minHeight: 0
        }}
      >
        <div
          style={{
            gridColumn: view === "list" ? "1 / -1" : 1,
            gridRow: 1,
            overflow: "hidden",
            borderRight: "none",
            borderBottom: "1px solid #1e3a5f",
            position: "relative",
            minHeight: 0
          }}
        >
          {view === "map" ? (
            <ProjectMap
              ref={projectMapRef}
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

        {view === "map" ? (
          <>
        <div
          style={{
            gridColumn: 2,
            gridRow: "1 / 4",
            width: 4,
            backgroundColor: "#0f2240",
            cursor: "col-resize",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
            flexDirection: "column"
          }}
          onMouseDown={handleVerticalMouseDown}
          onMouseEnter={(event) => {
            event.currentTarget.style.backgroundColor = "#f0a500";
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.backgroundColor = "#0f2240";
          }}
        >
          <div
            style={{
              width: 3,
              height: 32,
              backgroundColor: "#1e3a5f",
              borderRadius: 2
            }}
          />
        </div>

        <div
          style={{
            gridColumn: 3,
            gridRow: "1 / 4",
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            overflowX: "hidden",
            backgroundColor: "#0a1628",
            scrollbarWidth: "thin",
            scrollbarColor: "#1e3a5f #0a1628",
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
          </>
        ) : null}

        <div
          style={{
            gridColumn: view === "list" ? "1 / -1" : 1,
            gridRow: 2,
            height: 4,
            backgroundColor: "#0f2240",
            cursor: "row-resize",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10
          }}
          onMouseDown={handleMouseDown}
          onMouseEnter={(event) => {
            event.currentTarget.style.backgroundColor = "#f0a500";
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.backgroundColor = "#0f2240";
          }}
        >
          <div
            style={{
              width: 32,
              height: 3,
              backgroundColor: "#1e3a5f",
              borderRadius: 2
            }}
          />
        </div>

        <div
          style={{
            gridColumn: view === "list" ? "1 / -1" : 1,
            gridRow: 3,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            borderRight: "1px solid #1e3a5f",
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
          ) : view === "map" ? (
            <EmptyTabsPlaceholder />
          ) : null}
        </div>

      </div>
    </div>
  );
}
