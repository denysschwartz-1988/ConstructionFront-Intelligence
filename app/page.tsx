"use client";

import { useEffect, useState } from "react";
import ProjectMap from "@/components/map/ProjectMap";
import ProjectPanel from "@/components/panel/ProjectPanel";
import { supabase } from "@/lib/supabase/client";
import type {
  ProjectRecord,
  ProjectPartyRecord,
  ProjectSourceRecord
} from "@/types/database";

export default function Home() {
  const [selectedProject, setSelectedProject] = useState<ProjectRecord | null>(null);
  const [projectParties, setProjectParties] = useState<ProjectPartyRecord[]>([]);
  const [projectSources, setProjectSources] = useState<ProjectSourceRecord[]>([]);
  const [panelLoading, setPanelLoading] = useState(false);
  const [panelError, setPanelError] = useState<string | null>(null);

  const handleProjectSelect = (project: ProjectRecord | null) => {
    setSelectedProject(project);
    console.log("Project selected:", project?.projectName);
  };

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

      const [partiesResponse, sourcesResponse] = await Promise.all([
        supabase
          .from("project_parties")
          .select("*")
          .eq("projectSlug", selectedProject.projectSlug),
        supabase
          .from("project_sources")
          .select("*")
          .eq("projectSlug", selectedProject.projectSlug)
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
      setPanelLoading(false);
    };

    fetchDetails();
  }, [selectedProject]);

  return (
    <main className="grid h-screen min-h-screen bg-slate-950 text-slate-100">
      <div className={`grid ${selectedProject ? "grid-cols-[1fr_380px]" : "grid-cols-1"}`}>
        <div className="relative min-h-screen">
          <ProjectMap onProjectSelect={handleProjectSelect} />
        </div>
        {selectedProject ? (
          <ProjectPanel
            selectedProject={selectedProject}
            projectParties={projectParties}
            projectSources={projectSources}
            onClose={() => setSelectedProject(null)}
            isLoading={panelLoading}
            error={panelError}
          />
        ) : null}
      </div>
    </main>
  );
}
