"use client";

import { Search, Settings, UserCircle } from "lucide-react";
import MultiSelectDropdown from "@/components/ui/MultiSelectDropdown";

const systemFont =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, 'Helvetica Neue', Arial, sans-serif";

type TopBarProps = {
  visibleCount: number;
  projectCount: number;
  coverageCount: number;
  searchValue: string;
  selectedRegions: string[];
  selectedCountries: string[];
  selectedSectors: string[];
  selectedSubsectors: string[];
  selectedStages: string[];
  regionOptions: string[];
  countryOptions: string[];
  sectorOptions: string[];
  subsectorOptions: string[];
  stageOptions: string[];
  onSearchChange: (value: string) => void;
  onRegionsChange: (value: string[]) => void;
  onCountriesChange: (value: string[]) => void;
  onSectorsChange: (value: string[]) => void;
  onSubsectorsChange: (value: string[]) => void;
  onStagesChange: (value: string[]) => void;
};

export default function TopBar({
  visibleCount,
  projectCount,
  coverageCount,
  searchValue,
  selectedRegions,
  selectedCountries,
  selectedSectors,
  selectedSubsectors,
  selectedStages,
  regionOptions,
  countryOptions,
  sectorOptions,
  subsectorOptions,
  stageOptions,
  onSearchChange,
  onRegionsChange,
  onCountriesChange,
  onSectorsChange,
  onSubsectorsChange,
  onStagesChange
}: TopBarProps) {
  return (
    <div
      style={{
        fontFamily: systemFont,
        fontSize: 13,
        display: "flex",
        alignItems: "center",
        gap: 12,
        height: 56,
        minHeight: 56,
        padding: "0 12px",
        backgroundColor: "#0b1929",
        borderBottom: "1px solid #21262d",
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
        <MultiSelectDropdown
          label="All Regions"
          options={regionOptions.filter((region) => region !== "All Regions")}
          selected={selectedRegions}
          onChange={onRegionsChange}
        />
        <MultiSelectDropdown
          label="All Countries"
          options={countryOptions.filter((country) => country !== "All Countries")}
          selected={selectedCountries}
          onChange={onCountriesChange}
        />
        <MultiSelectDropdown
          label="All Sectors"
          options={sectorOptions.filter((sector) => sector !== "All Sectors")}
          selected={selectedSectors}
          onChange={onSectorsChange}
        />
        <MultiSelectDropdown
          label="All Subsectors"
          options={subsectorOptions.filter((subsector) => subsector !== "All Subsectors")}
          selected={selectedSubsectors}
          onChange={onSubsectorsChange}
        />
        <MultiSelectDropdown
          label="All Project Stages"
          options={stageOptions.filter((stage) => stage !== "All Project Stages")}
          selected={selectedStages}
          onChange={onStagesChange}
        />
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
