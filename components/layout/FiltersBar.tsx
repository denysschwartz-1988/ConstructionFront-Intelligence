"use client";

type FiltersBarProps = {
  selectedRegion: string;
  selectedSector: string;
  selectedCountry: string;
  selectedSubsector: string;
  selectedStage: string;
  isAuthenticated: boolean;
  onRegionChange: (value: string) => void;
  onSectorChange: (value: string) => void;
  onCountryChange: (value: string) => void;
  onSubsectorChange: (value: string) => void;
  onStageChange: (value: string) => void;
};

const dropdownStyle = {
  backgroundColor: "#061322",
  color: "#e6edf3",
  border: "1px solid #223a59",
  borderRadius: 6,
  height: 32,
  padding: "0 8px",
  fontSize: 12,
  minWidth: 120,
  appearance: "none",
  WebkitAppearance: "none",
  MozAppearance: "none"
} as const;

const premiumOptions = [
  { value: "All Countries", label: "All Countries" },
  { value: "United States", label: "United States" },
  { value: "United Kingdom", label: "United Kingdom" },
  { value: "Australia", label: "Australia" }
];

const subsectorOptions = [
  { value: "All Subsectors", label: "All Subseectors" },
  { value: "Offshore Wind", label: "Offshore Wind" },
  { value: "Data Center", label: "Data Center" },
  { value: "Highway", label: "Highway" }
];

const stageOptions = [
  { value: "All Stages", label: "All Stages" },
  { value: "Under Construction", label: "Under Construction" },
  { value: "Procurement", label: "Procurement" },
  { value: "Operational", label: "Operational" }
];

const renderSelect = (
  _label: string,
  value: string,
  onChange: (value: string) => void,
  options: { value: string; label: string }[]
) => {
  return (
    <div style={{ display: "flex", alignItems: 'center', minWidth: 0 }}>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={{ ...dropdownStyle, cursor: 'pointer' }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default function FiltersBar({
  selectedRegion,
  selectedSector,
  selectedCountry,
  selectedSubsector,
  selectedStage,
  isAuthenticated,
  onRegionChange,
  onSectorChange,
  onCountryChange,
  onSubsectorChange,
  onStageChange
}: FiltersBarProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "0 16px",
        height: 40,
        minHeight: 40,
        backgroundColor: "#0b1a2d",
        borderBottom: "1px solid #223a59"
      }}
    >
      {renderSelect(
        "Region",
        selectedRegion,
        onRegionChange,
        [
          { value: "All Regions", label: "All Regions" },
          { value: "North America", label: "North America" },
          { value: "Europe", label: "Europe" },
          { value: "Asia Pacific", label: "Asia Pacific" },
          { value: "Middle East and Africa", label: "Middle East and Africa" },
          { value: "Latin America", label: "Latin America" }
        ]
      )}

      {renderSelect(
        "Country",
        selectedCountry,
        onCountryChange,
        premiumOptions
      )}

      {renderSelect(
        "Sector",
        selectedSector,
        onSectorChange,
        [
          { value: "All Sectors", label: "All Sectors" },
          { value: "Energy", label: "Energy" },
          { value: "Transport", label: "Transport" },
          { value: "Water", label: "Water" },
          { value: "Digital Infrastructure", label: "Digital Infrastructure" },
          { value: "Mining and Resources", label: "Mining and Resources" }
        ]
      )}

      {renderSelect(
        "Subsector",
        selectedSubsector,
        onSubsectorChange,
        subsectorOptions
      )}

      {renderSelect(
        "Project Stage",
        selectedStage,
        onStageChange,
        stageOptions
      )}
    </div>
  );
}
