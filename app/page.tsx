"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import TopBar from "@/components/layout/TopBar";
import FiltersBar from "@/components/layout/FiltersBar";
import LatestUpdatesTicker from "@/components/layout/LatestUpdatesTicker";
import ProjectMap from "@/components/map/ProjectMap";
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
  const { isSignedIn } = useAuth();
  const isAuthenticated = Boolean(isSignedIn);

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
  const [selectedStage, setSelectedStage] = useState("All Stages");
  const [tickerOpen, setTickerOpen] = useState(true);

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
        .select('*', { count: 'exact', head: true })
        .eq('sourceType', 'CF Article');

      if (!error) {
        setCoverageCount(count ?? 0);
      } else {
        console.error('Failed to load coverage count:', error.message);
      }
    };

    fetchCoverageCount();
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
    return projects
      .filter((project) => {
        const matchesSearch = searchValue
          ? [
              project.projectName,
              project.ownerDeveloper,
              project.leadContractor,
              project.sector,
              project.subsector
            ]
              .filter(Boolean)
              .some((value) =>
                value
                  ?.toString()
                  .toLowerCase()
                  .includes(searchValue.toLowerCase())
              )
          : true;

        const matchesRegion =
          selectedRegion === "All Regions" ||
          project.region === selectedRegion;
        const matchesSector =
          selectedSector === "All Sectors" ||
          project.sector === selectedSector;
        const matchesCountry =
          !isAuthenticated ||
          selectedCountry === "All Countries" ||
          project.country === selectedCountry;
        const matchesSubsector =
          !isAuthenticated ||
          selectedSubsector === "All Subsectors" ||
          project.subsector === selectedSubsector;
        const matchesStage =
          !isAuthenticated ||
          selectedStage === "All Stages" ||
          project.currentProjectStage === selectedStage;

        return (
          matchesSearch &&
          matchesRegion &&
          matchesSector &&
          matchesCountry &&
          matchesSubsector &&
          matchesStage
        );
      })
      .sort((a, b) => getUpdateTimestamp(b) - getUpdateTimestamp(a));
  }, [projects, searchValue, selectedRegion, selectedSector, selectedCountry, selectedSubsector, selectedStage, isAuthenticated]);

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

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        backgroundColor: "#0f172a"
      }}
    >
      <div style={{ flex: "0 0 56px" }}>
        <TopBar
          visibleCount={filteredProjects.length}
          projectCount={projects.length}
          coverageCount={coverageCount}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
        />
      </div>

      <div style={{ flex: "0 0 44px" }}>
        <FiltersBar
          selectedRegion={selectedRegion}
          selectedSector={selectedSector}
          selectedCountry={selectedCountry}
          selectedSubsector={selectedSubsector}
          selectedStage={selectedStage}
          isAuthenticated={isAuthenticated}
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
          height: tickerOpen ? 40 : 0,
          overflow: "hidden"
        }}
      >
        <LatestUpdatesTicker
          projects={filteredProjects}
          isOpen={tickerOpen}
          onToggle={() => setTickerOpen((current) => !current)}
        />
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flex: "0 0 52vh",
          height: "52vh",
          overflow: "hidden"
        }}
      >
        <div style={{ flex: 1, height: "100%", overflow: "hidden" }}>
          <ProjectMap
            projects={mapProjects}
            onProjectSelect={handleProjectSelect}
          />
        </div>

        {selectedProject ? (
          <div
              style={{
                width: 360,
                flexShrink: 0,
                height: "100%",
                overflowY: "auto",
                backgroundColor: "#1e293b",
                borderLeft: "1px solid #334155"
              }}
          >
            <ProjectPanel
              selectedProject={selectedProject}
              projectParties={projectParties}
              projectSources={projectSources}
              onClose={() => setSelectedProject(null)}
              isLoading={panelLoading}
              error={panelError}
            />
          </div>
        ) : null}
      </div>

      {selectedProject ? (
        <div style={{ flex: 1, overflow: "hidden" }}>
          <PremiumTabsShell
            project={selectedProject}
            parties={projectParties}
            sources={projectSources}
            milestones={projectMilestones}
            isAuthenticated={isAuthenticated}
          />
        </div>
      ) : null}
    </div>
  );
}
