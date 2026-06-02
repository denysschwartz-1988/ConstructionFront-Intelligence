"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { getStageColor } from "@/lib/utils";
import type { ProjectRecord } from "@/types/database";

import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

export type ProjectMapProps = {
  onProjectSelect?: (project: ProjectRecord) => void;
};


const getMarkerSize = (recordType?: string) => {
  const type = recordType?.trim().toLowerCase() ?? "";
  if (type.includes("programme") || type.includes("program")) {
    return 26;
  }
  if (type.includes("package")) {
    return 10;
  }
  return 16;
};

const isValidProject = (project: ProjectRecord) => {
  return Boolean(
    project.projectDescription?.trim() &&
      project.latitude != null &&
      project.longitude != null
  );
};

export default function ProjectMap({ onProjectSelect }: ProjectMapProps) {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [leaflet, setLeaflet] = useState<any>(null);
  const [reactLeaflet, setReactLeaflet] = useState<any>(null);

  useEffect(() => {
    const loadModules = async () => {
      try {
        const [LeafletModule, ReactLeafletModule] = await Promise.all([
          import("leaflet"),
          import("react-leaflet")
        ]);

        await import("leaflet.markercluster");

        setLeaflet(LeafletModule.default ?? LeafletModule);
        setReactLeaflet(ReactLeafletModule);
      } catch (error) {
        console.error("Failed to load leaflet modules", error);
        setLoadError("Unable to load the map engine.");
      }
    };

    loadModules();
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("projects_master")
        .select("*")
        .not("projectDescription", "is", null)
        .neq("projectDescription", "");

      if (error) {
        setLoadError(error.message);
        setLoading(false);
        return;
      }

      const filtered = (data ?? []).filter(isValidProject);
      setProjects(filtered);
      setLoading(false);
    };

    fetchProjects();
  }, []);

  const visibleProjects = useMemo(
    () => projects.filter(isValidProject),
    [projects]
  );

  const isReady = Boolean(leaflet && reactLeaflet);

  const legendItems = [
    { label: "Under development / FID / Procurement / Financing", color: "#E8A020" },
    { label: "Contract Awarded / Under Construction", color: "#74c69d" },
    { label: "Construction Complete / Operational", color: "#7fb3ff" }
  ];

  if (loadError) {
    return (
      <div className="min-h-[640px] rounded-3xl border border-white/10 bg-slate-950/80 p-8 text-slate-200">
        <p className="text-base font-semibold">Map failed to load</p>
        <p className="mt-3 text-sm text-slate-400">{loadError}</p>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="min-h-[640px] rounded-3xl border border-white/10 bg-slate-950/80 p-8 text-slate-200">
        <p className="text-base font-semibold">Loading project map…</p>
      </div>
    );
  }

  const { MapContainer, TileLayer, useMap } = reactLeaflet;

  const ClusterLayer = ({ projects }: { projects: ProjectRecord[] }) => {
    const map = useMap();

    useEffect(() => {
      if (!leaflet || !map || projects.length === 0) {
        return;
      }

      const clusterGroup = leaflet.markerClusterGroup();
      const markers = projects.map((project) => {
        const color = getStageColor(project.currentProjectStage ?? undefined);
        const size = getMarkerSize(project.recordType ?? undefined);
        const marker = leaflet.marker(
          [project.latitude as number, project.longitude as number],
          {
            icon: leaflet.divIcon({
              className: "project-map-marker",
              html: `<span style="display:inline-block;width:${size}px;height:${size}px;border-radius:50%;border:2px solid white;background:${color};box-shadow:0 0 0 ${Math.round(
                size * 0.8
              )}px rgba(0,0,0,0.16);"></span>`,
              iconSize: [size, size],
              iconAnchor: [size / 2, size / 2],
              popupAnchor: [0, -size / 2]
            })
          }
        );

        marker.on("click", () => {
          onProjectSelect?.(project);
        });

        marker.bindPopup(`
          <div style="font-size:0.95rem;line-height:1.4;color:#0a1628;">
            <strong>${project.projectName ?? project.projectSlug}</strong><br />
            <span style="color:#475569;">${project.currentProjectStage ?? "Stage not available"}</span>
          </div>
        `);

        return marker;
      });

      clusterGroup.addLayers(markers);
      map.addLayer(clusterGroup);

      if (markers.length) {
        const bounds = leaflet.latLngBounds(markers.map((marker) => marker.getLatLng()));
        map.fitBounds(bounds, { padding: [40, 40] });
      }

      return () => {
        map.removeLayer(clusterGroup);
      };
    }, [leaflet, map, onProjectSelect, projects]);

    return null;
  };

  return (
    <section className="relative h-screen min-h-[720px] w-full overflow-hidden rounded-3xl bg-slate-950/90 shadow-2xl shadow-slate-950/40">
      <div className="absolute inset-0">
        <MapContainer
          center={[20, 0]}
          zoom={2}
          scrollWheelZoom
          style={{ width: "100%", height: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <ClusterLayer projects={visibleProjects} />
        </MapContainer>
      </div>

      <div className="absolute bottom-6 right-6 z-20 rounded-2xl border border-white/10 bg-slate-950/95 px-4 py-3 text-sm text-slate-200 shadow-xl shadow-slate-950/40 backdrop-blur">
        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          Project stage legend
        </div>
        <div className="grid gap-2">
          {legendItems.map((item) => (
            <div key={item.label} className="flex items-center gap-3 text-xs text-slate-200">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: item.color }}
              />
              <span>{item.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-3 text-xs text-slate-400 pt-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-slate-400/40" />
            <span>Cluster markers group nearby projects</span>
          </div>
        </div>
      </div>
    </section>
  );
}
