"use client";

type TopBarProps = {
  visibleCount: number;
  projectCount: number;
  coverageCount: number;
  searchValue: string;
  onSearchChange: (value: string) => void;
};

export default function TopBar({
  visibleCount,
  projectCount,
  coverageCount,
  searchValue,
  onSearchChange
}: TopBarProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr auto",
        gap: 12,
        alignItems: "center",
        padding: "4px 12px",
        height: 48,
        minHeight: 48,
        backgroundColor: "#0b1a2d",
        borderBottom: "1px solid #223a59"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, whiteSpace: 'nowrap' }}>
        <div>
          <div style={{ fontSize: 16, display: 'flex', gap: 6, alignItems: 'baseline' }}>
            <span style={{ color: '#E8A020', fontWeight: 800 }}>ConstructionFront</span>
            <span style={{ color: '#e6edf3' }}>Intelligence</span>
          </div>
          <div style={{ color: "#9fb0c5", fontSize: 11, marginTop: 2, lineHeight: 1.3 }}>
            {visibleCount} visible projects · {projectCount} projects covered · {coverageCount} coverage updates
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 0 }}>
        <div style={{ position: "relative", width: '100%', maxWidth: 600 }}>
          <span
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#9fb0c5"
            }}
          >
            🔍
          </span>
          <input
            type="text"
            aria-label="Search projects"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search projects, owners, parties, sectors..."
            onFocus={(e) => (e.currentTarget.style.outline = '2px solid rgba(232,160,32,0.55)')}
            onBlur={(e) => (e.currentTarget.style.outline = 'none')}
            style={{
              width: "100%",
              height: 32,
              padding: "6px 9px 6px 34px",
              borderRadius: 6,
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

      <div style={{ display: "flex", alignItems: "center", gap: 8, justifySelf: 'end' }}>
        <button
          type="button"
          aria-label="Profile"
          onMouseEnter={(e) => (e.currentTarget.style.color = '#e6edf3')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#9fb0c5')}
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            backgroundColor: "transparent",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#9fb0c5",
            fontSize: 16,
            cursor: 'pointer'
           }}
        >
          👤
        </button>
        <button
          type="button"
          aria-label="Settings"
          onMouseEnter={(e) => (e.currentTarget.style.color = '#e6edf3')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#9fb0c5')}
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            backgroundColor: "transparent",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#9fb0c5",
            fontSize: 16,
            cursor: 'pointer'
           }}
        >
          ⚙️
        </button>
      </div>
    </div>
  );
}
