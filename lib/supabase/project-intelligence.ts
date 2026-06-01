import { supabase } from "@/lib/supabase/client";

export async function getProjectIntelligenceData() {
  const [projects, sources, milestones, parties] = await Promise.all([
    supabase.from("projects_master").select("*"),
    supabase.from("project_sources").select("*"),
    supabase.from("project_milestones").select("*"),
    supabase.from("project_parties").select("*")
  ]);

  const firstError =
    projects.error ?? sources.error ?? milestones.error ?? parties.error;

  if (firstError) {
    throw firstError;
  }

  return {
    projects: projects.data ?? [],
    sources: sources.data ?? [],
    milestones: milestones.data ?? [],
    parties: parties.data ?? []
  };
}
