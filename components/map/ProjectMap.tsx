"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
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

export type ProjectMapHandle = {
  flyToProjects: (projects: ProjectRecord[]) => void;
  flyToProject: (project: ProjectRecord) => void;
  resetView: () => void;
};

const legendItems = [
  {
    label: "Under Development / FID / Procurement",
    color: "#f0a500"
  },
  {
    label: "Contract Awarded / Under Construction",
    color: "#22c55e"
  },
  {
    label: "Construction Complete / Operational",
    color: "#3b82f6"
  },
  {
    label: "Mixed / Multiple stages",
    color: "#6e7681"
  }
];

function getMarkerColor(stage: string | null | undefined): string {
  if (!stage) {
    return "#8b949e";
  }

  const s = stage.toLowerCase();

  if (
    s.includes("under development") ||
    s.includes("fid") ||
    s.includes("procurement") ||
    s.includes("financing")
  ) {
    return "#f0a500";
  }

  if (s.includes("contract awarded") || s.includes("under construction")) {
    return "#22c55e";
  }

  if (s.includes("construction complete") || s.includes("operational")) {
    return "#3b82f6";
  }

  if (s.includes("on hold") || s.includes("cancelled")) {
    return "#8b949e";
  }

  return "#f0a500";
}

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

const isRenderableMapProject = (project: ProjectRecord) => {
  const hierarchy = (project as unknown as { projectHierarchy?: string | null }).projectHierarchy;
  return project.recordType !== "Programme" && hierarchy !== "Parent";
};

const ProjectMap = forwardRef<ProjectMapHandle, ProjectMapProps>(function ProjectMap(
  {
    projects,
    focusProject,
    focusRequest = 0,
    onProjectSelect
  },
  ref
) {
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
    () => projects.filter((project) => isValidProject(project) && isRenderableMapProject(project)),
    [projects]
  );

  const isReady = Boolean(leaflet && reactLeaflet);

  // Legend removed in favor of compact Project Status legend rendered below

  useImperativeHandle(ref, () => ({
    flyToProjects: (projectsToShow: ProjectRecord[]) => {
      if (!mapInstance.current) {
        return;
      }

      const validProjects = projectsToShow.filter(
        (project) => project.latitude != null && project.longitude != null
      );

      if (validProjects.length === 0) {
        return;
      }

      if (validProjects.length === 1) {
        mapInstance.current.flyTo(
          [validProjects[0].latitude as number, validProjects[0].longitude as number],
          8,
          { animate: true, duration: 1.0 }
        );
        return;
      }

      mapInstance.current.flyToBounds(
        validProjects.map(
          (project) => [project.latitude as number, project.longitude as number] as [number, number]
        ),
        {
          padding: [48, 48],
          maxZoom: 10,
          animate: true,
          duration: 1.0
        }
      );
    },
    flyToProject: (project: ProjectRecord) => {
      if (!mapInstance.current || project.latitude == null || project.longitude == null) {
        return;
      }

      mapInstance.current.flyTo(
        [project.latitude, project.longitude],
        8,
        { animate: true, duration: 1.0 }
      );
    },
    resetView: () => {
      if (!mapInstance.current) {
        return;
      }

      mapInstance.current.flyTo([20, 0], 2, { animate: true, duration: 1.0 });
    }
  }), []);

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
      if (!mapInstance.current) {
        return;
      }

      if (!focusProject || focusProject.latitude == null || focusProject.longitude == null) {
        return;
      }

      mapInstance.current.flyTo(
        [focusProject.latitude, focusProject.longitude],
        8,
        {
          animate: true,
          duration: 1.0
        }
      );
    }, [focusRequest]);

    return null;
  };

  const ClusterLayer = ({
    projects,
    selectedProject
  }: {
    projects: ProjectRecord[];
    selectedProject?: ProjectRecord | null;
  }) => {
    const map = useMap();

    useEffect(() => {
      if (!leaflet || !map || projects.length === 0) {
        return;
      }

      const createClusterIcon = (cluster: any) => {
        const childMarkers = cluster.getAllChildMarkers();
        const colors = childMarkers.map((marker: any) => marker.options.fillColor || "#f0a500");
        const uniqueColors = [...new Set(colors)];
        const clusterColor = uniqueColors.length === 1 ? uniqueColors[0] : "#6e7681";
        const textColor = clusterColor === "#6e7681" ? "#ffffff" : "#0a1628";
        const count = cluster.getChildCount();

        return leaflet.divIcon({
          html: `<div style="
            background-color:${clusterColor};
            width:36px;
            height:36px;
            border-radius:50%;
            display:flex;
            align-items:center;
            justify-content:center;
            color:${textColor};
            font-weight:700;
            font-size:13px;
            border:2px solid rgba(255,255,255,0.3);
            box-shadow:0 2px 8px rgba(0,0,0,0.4);
          ">${count}</div>`,
          className: "",
          iconSize: [36, 36]
        });
      };

      const clusterGroup = leaflet.markerClusterGroup({
        iconCreateFunction: createClusterIcon
      });
      const lineGroup = leaflet.layerGroup();
      const siblingGroups = new Map<string, ProjectRecord[]>();
      const parentChildCount = new Map<string, number>();

      projects.forEach((project) => {
        const parentSlug = project.parentProjectSlug?.trim();
        if (!parentSlug) {
          return;
        }

        parentChildCount.set(parentSlug, (parentChildCount.get(parentSlug) ?? 0) + 1);

        if (project.latitude != null && project.longitude != null) {
          const group = siblingGroups.get(parentSlug) ?? [];
          group.push(project);
          siblingGroups.set(parentSlug, group);
        }
      });

      siblingGroups.forEach((siblings) => {
        if (siblings.length < 2) {
          return;
        }

        const positions = siblings.map(
          (project) => [project.latitude as number, project.longitude as number] as [number, number]
        );
        const selectedSibling = siblings.some(
          (project) => project.projectSlug === selectedProject?.projectSlug
        );

        const line = leaflet.polyline(positions, {
          color: "#ffffff",
          opacity: selectedSibling ? 0.5 : 0.15,
          weight: selectedSibling ? 1.5 : 1,
          dashArray: "4 4"
        });

        lineGroup.addLayer(line);
      });

      const markers = projects.map((project) => {
        const color = getMarkerColor(project.currentProjectStage);
        const size = getMarkerSize(project.recordType ?? undefined);
        const parentSlug = project.parentProjectSlug?.trim() ?? "";
        const hasParent = Boolean(parentSlug && (parentChildCount.get(parentSlug) ?? 0) >= 2);
        const marker = leaflet.marker(
          [project.latitude as number, project.longitude as number],
          {
            color,
            fillColor: color,
            icon: leaflet.divIcon({
              className: "project-map-marker",
              html: `<span style="position:relative;display:inline-block;width:${size}px;height:${size}px;"><span style="display:inline-block;width:${size}px;height:${size}px;border-radius:50%;border:2px solid ${color};background:${color};box-shadow:0 0 0 ${Math.round(
                size * 0.8
              )}px rgba(0,0,0,0.16);"></span>${hasParent ? `<span style="position:absolute;top:-5px;right:-5px;width:10px;height:10px;border-radius:50%;background-color:#0a1628;border:1px solid #f0a500;color:#f0a500;font-size:8px;font-weight:700;line-height:10px;text-align:center;box-sizing:border-box;">P</span>` : ""}</span>`,
              iconSize: [size, size],
              iconAnchor: [size / 2, size / 2],
              popupAnchor: [0, -size / 2]
            })
          }
        );

        marker.on("click", () => {
          onProjectSelect?.(project);
        });

        marker.bindTooltip(project.projectName ?? project.projectSlug, {
          permanent: false,
          direction: "top",
          offset: [0, -10],
          className: "cf-map-tooltip"
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
      map.addLayer(lineGroup);
      lineGroup.eachLayer((line: any) => line.bringToBack?.());

      return () => {
        map.removeLayer(lineGroup);
        map.removeLayer(clusterGroup);
      };
    }, [leaflet, map, onProjectSelect, projects, selectedProject]);

    return null;
  };

  return (
    <section className="relative h-full w-full overflow-hidden rounded-3xl bg-slate-950/90 shadow-2xl shadow-slate-950/40">
      <style>{`
        .cf-map-tooltip {
          background-color: #0f2240;
          border: 1px solid #1e3a5f;
          color: #e6edf3;
          font-size: 12px;
          font-weight: 500;
          padding: 4px 8px;
          border-radius: 4px;
          box-shadow: none;
          white-space: nowrap;
        }

        .cf-map-tooltip::before {
          border-top-color: #1e3a5f;
        }
      `}</style>
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
          <ClusterLayer projects={visibleProjects} selectedProject={focusProject} />
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
          backgroundColor: "rgba(10,22,40,0.92)",
          borderTop: "1px solid #1e3a5f",
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

        <div style={{ width: 1, height: 14, backgroundColor: "#1e3a5f", flexShrink: 0 }} />

        {legendItems.map((item) => (
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
                backgroundColor: item.color,
                flexShrink: 0,
                boxShadow: `0 0 4px ${item.color}`
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
        ))}
      </div>
    </section>
  );
});

ProjectMap.displayName = "ProjectMap";

export default ProjectMap;
