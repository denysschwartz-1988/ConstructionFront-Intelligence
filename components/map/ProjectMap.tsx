"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getStageBadgeStyle } from "@/lib/utils";
import type { ProjectRecord } from "@/types/database";

import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

export type ProjectMapProps = {
  projects: ProjectRecord[];
  focusProject?: ProjectRecord | null;
  focusRequest?: number;
  onProjectSelect?: (project: ProjectRecord) => void;
};

const legendItems = [
  { label: "Under Development", stage: "Under Development" },
  { label: "FID / Procurement", stage: "FID / Procurement / Financing" },
  { label: "Contract Awarded", stage: "Contract Awarded" },
  { label: "Under Construction", stage: "Under Construction" },
  { label: "Operational", stage: "Operational" }
];

const getMapStageColor = (currentProjectStage?: string | null) => {
  const stage = currentProjectStage?.trim().toLowerCase() ?? "";

  if (
    stage.includes("under development") ||
    stage.includes("fid") ||
    stage.includes("procurement") ||
    stage.includes("financing")
  ) {
    return { bg: "#f0a500", border: "#f0a500" };
  }

  if (stage.includes("contract awarded") || stage.includes("under construction")) {
    return { bg: "#3fb950", border: "#3fb950" };
  }

  if (stage.includes("construction complete") || stage.includes("operational")) {
    return { bg: "#58a6ff", border: "#58a6ff" };
  }

  return { bg: "#8b949e", border: "#8b949e" };
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

export default function ProjectMap({
  projects,
  focusProject,
  focusRequest = 0,
  onProjectSelect
}: ProjectMapProps) {
  const [loadError, setLoadError] = useState<string | null>(null);
  const [leaflet, setLeaflet] = useState<any>(null);
  const [reactLeaflet, setReactLeaflet] = useState<any>(null);
  const mapInstance = useRef<any>(null);

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

  const FocusProjectController = ({
    focusProject,
    focusRequest
  }: {
    focusProject?: ProjectRecord | null;
    focusRequest: number;
  }) => {
    const map = useMap();

    useEffect(() => {
      mapInstance.current = map;
    }, [map]);

    useEffect(() => {
      if (focusRequest <= 0) {
        return;
      }

      if (!mapInstance.current) {
        return;
      }

      if (!focusProject) {
        return;
      }

      if (focusProject.latitude == null || focusProject.longitude == null) {
        return;
      }

      mapInstance.current.flyTo(
        [focusProject.latitude, focusProject.longitude],
        8,
        {
          animate: true,
          duration: 1.2
        }
      );
    }, [focusRequest]);

    return null;
  };

  const ClusterLayer = ({ projects }: { projects: ProjectRecord[] }) => {
    const map = useMap();

    useEffect(() => {
      if (!leaflet || !map || projects.length === 0) {
        return;
      }

      const clusterGroup = leaflet.markerClusterGroup();
      const markers = projects.map((project) => {
        const color = getMapStageColor(project.currentProjectStage ?? undefined);
        const size = getMarkerSize(project.recordType ?? undefined);
        const marker = leaflet.marker(
          [project.latitude as number, project.longitude as number],
          {
            icon: leaflet.divIcon({
              className: "project-map-marker",
              html: `<span style="display:inline-block;width:${size}px;height:${size}px;border-radius:50%;border:2px solid ${color.border ?? "white"};background:${color.bg};box-shadow:0 0 0 ${Math.round(
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
      <div className="absolute inset-0" style={{ paddingBottom: 28 }}>
        <MapContainer
          center={[20, 0]}
          zoom={2}
          minZoom={2}
          maxZoom={18}
          zoomControl
          maxBounds={[
            [-90, -180],
            [90, 180]
          ]}
          maxBoundsViscosity={1.0}
          scrollWheelZoom
          style={{ width: "100%", height: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <ClusterLayer projects={visibleProjects} />
          <FocusProjectController
            focusProject={focusProject}
            focusRequest={focusRequest}
          />
        </MapContainer>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          backgroundColor: "rgba(13,17,23,0.92)",
          borderTop: "1px solid #30363d",
          padding: "6px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
          backdropFilter: "blur(4px)"
        }}
      >
        <span
          style={{
            color: "#f0a500",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            flexShrink: 0
          }}
        >
          PROJECT STATUS
        </span>

        <div style={{ width: 1, height: 14, backgroundColor: "#30363d", flexShrink: 0 }} />

        {legendItems.map((item) => {
          const badgeStyle = getStageBadgeStyle(item.stage);
          const backgroundColor = String(badgeStyle.backgroundColor ?? "#6e7681");

          return (
            <div
              key={item.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                flexShrink: 0
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor,
                  flexShrink: 0,
                  boxShadow: `0 0 4px ${backgroundColor}`
                }}
              />
              <span
                style={{
                  color: "#e6edf3",
                  fontSize: 11,
                  whiteSpace: "nowrap"
                }}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
