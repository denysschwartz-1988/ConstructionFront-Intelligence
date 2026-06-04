"use client";

import { useEffect, useMemo, useState } from "react";
import { getStageColor } from "@/lib/utils";
import type { ProjectRecord } from "@/types/database";

import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

export type ProjectMapProps = {
  projects: ProjectRecord[];
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

export default function ProjectMap({ projects, onProjectSelect }: ProjectMapProps) {
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

  const visibleProjects = useMemo(
    () => projects.filter(isValidProject),
    [projects]
  );

  const isReady = Boolean(leaflet && reactLeaflet);

  // Legend removed in favor of compact Project Status legend rendered below

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
    <section className="relative h-full w-full overflow-hidden rounded-3xl bg-slate-950/90 shadow-2xl shadow-slate-950/40">
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

      <div
        style={{
          position: 'absolute',
          bottom: 24,
          right: 12,
          zIndex: 30,
          background: 'rgba(13,17,23,0.9)',
          border: '1px solid #30363d',
          borderRadius: 6,
          padding: '10px 14px'
        }}
      >
        <div style={{ color: '#f0a500', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', marginBottom: 8 }}>
          PROJECT STATUS
        </div>
        <div style={{ display: 'grid', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#e6edf3', fontSize: 12 }}>
            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 999, background: '#f0a500' }} />
            <span>Under Development</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#e6edf3', fontSize: 12 }}>
            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 999, background: '#238636' }} />
            <span>Active Delivery</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#e6edf3', fontSize: 12 }}>
            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 999, background: '#1f6feb' }} />
            <span>Operational</span>
          </div>
        </div>
      </div>
    </section>
  );
}
