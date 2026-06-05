"use client";

import { Search, Settings, UserCircle } from "lucide-react";

type TopBarProps = {
  visibleCount: number;
  projectCount: number;
  coverageCount: number;
  searchValue: string;
  selectedRegion: string;
  selectedSector: string;
  selectedCountry: string;
  selectedSubsector: string;
  selectedStage: string;
  regionOptions: string[];
  countryOptions: string[];
  sectorOptions: string[];
  subsectorOptions: string[];
  stageOptions: string[];
  onSearchChange: (value: string) => void;
  onRegionChange: (value: string) => void;
  onSectorChange: (value: string) => void;
  onCountryChange: (value: string) => void;
  onSubsectorChange: (value: string) => void;
  onStageChange: (value: string) => void;
};

const selectStyle = {
  height: 28,
  minWidth: 112,
  maxWidth: 148,
  padding: "0 24px 0 8px",
  borderRadius: 4,
  border: "1px solid #223a59",
  backgroundColor: "#061322",
  color: "#e6edf3",
  fontSize: 12,
  lineHeight: "28px",
  outline: "none",
  cursor: "pointer"
} as const;

const renderSelect = (
  ariaLabel: string,
  value: string,
  onChange: (value: string) => void,
  options: string[],
  minWidth = 112
) => (
  <select
    aria-label={ariaLabel}
    value={value}
    onChange={(event) => onChange(event.target.value)}
    style={{ ...selectStyle, minWidth }}
  >
    {options.map((option) => (
      <option key={option} value={option}>
        {option}
      </option>
    ))}
  </select>
);

export default function TopBar({
  visibleCount,
  projectCount,
  coverageCount,
  searchValue,
  selectedRegion,
  selectedSector,
  selectedCountry,
  selectedSubsector,
  selectedStage,
  regionOptions,
  countryOptions,
  sectorOptions,
  subsectorOptions,
  stageOptions,
  onSearchChange,
  onRegionChange,
  onSectorChange,
  onCountryChange,
  onSubsectorChange,
  onStageChange
}: TopBarProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        height: 56,
        minHeight: 56,
        padding: "0 12px",
        backgroundColor: "#0b1a2d",
        borderBottom: "1px solid #223a59",
        overflow: "hidden",
        whiteSpace: "nowrap"
      }}
    >
      <div
        style={{
          flex: "0 0 auto",
          minWidth: 400,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          overflow: "hidden"
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 4,
            fontSize: 15,
            lineHeight: "18px",
            fontWeight: 700
          }}
        >
          <span style={{ color: "#f0a500" }}>ConstructionFront</span>
          <span style={{ color: "#ffffff" }}>Intelligence</span>
        </div>
        <div
          style={{
            display: "flex",
            gap: 16,
            alignItems: "center"
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ color: "#f0a500", fontSize: 15, fontWeight: 700 }}>
              {visibleCount}
            </span>
            <span style={{ color: "#8b949e", fontSize: 11 }}>visible projects</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ color: "#f0a500", fontSize: 15, fontWeight: 700 }}>
              {projectCount}
            </span>
            <span style={{ color: "#8b949e", fontSize: 11 }}>projects covered</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ color: "#f0a500", fontSize: 15, fontWeight: 700 }}>
              {coverageCount}
            </span>
            <span style={{ color: "#8b949e", fontSize: 11 }}>coverage updates</span>
          </div>
        </div>
      </div>

      <div
        style={{
          flex: "1 1 400px",
          maxWidth: 400,
          minWidth: 180,
          display: "flex",
          alignItems: "center"
        }}
      >
        <div style={{ position: "relative", width: "100%" }}>
          <Search
            aria-hidden="true"
            size={14}
            style={{
              position: "absolute",
              left: 9,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#8b949e"
            }}
          />
          <input
            type="text"
            aria-label="Search projects"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search projects, owners, parties, sectors..."
            style={{
              width: "100%",
              height: 28,
              padding: "4px 9px 4px 30px",
              borderRadius: 4,
              border: "1px solid #223a59",
              backgroundColor: "#061322",
              color: "#e6edf3",
              outline: "none",
              fontSize: 12
            }}
            className="placeholder:text-slate-500"
          />
        </div>
      </div>

      <div
        style={{
          flex: "0 1 auto",
          display: "flex",
          alignItems: "center",
          gap: 6,
          minWidth: 0,
          overflow: "hidden"
        }}
      >
        {renderSelect("Region", selectedRegion, onRegionChange, regionOptions)}
        {renderSelect("Country", selectedCountry, onCountryChange, countryOptions)}
        {renderSelect("Sector", selectedSector, onSectorChange, sectorOptions, 110)}
        {renderSelect("Subsector", selectedSubsector, onSubsectorChange, subsectorOptions, 126)}
        {renderSelect("Project stage", selectedStage, onStageChange, stageOptions, 138)}
      </div>

      <div
        style={{
          flex: "0 0 auto",
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginLeft: "auto"
        }}
      >
        <button
          type="button"
          style={{
            border: "none",
            backgroundColor: "transparent",
            color: "#f0a500",
            fontSize: 12,
            fontWeight: 600,
            padding: 0,
            cursor: "pointer"
          }}
        >
          More filters?
        </button>

        <button
          type="button"
          aria-label="Profile"
          title="Profile"
          style={{
            width: 28,
            height: 28,
            borderRadius: 4,
            backgroundColor: "transparent",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#8b949e",
            cursor: "pointer"
          }}
        >
          <UserCircle size={18} aria-hidden="true" />
        </button>

        <button
          type="button"
          aria-label="Settings"
          title="Settings"
          style={{
            width: 28,
            height: 28,
            borderRadius: 4,
            backgroundColor: "transparent",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#8b949e",
            cursor: "pointer"
          }}
        >
          <Settings size={17} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
