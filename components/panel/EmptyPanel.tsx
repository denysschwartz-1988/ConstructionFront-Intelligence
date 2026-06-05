export default function EmptyPanel() {
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: 24,
        color: "#8b949e"
      }}
    >
      <div style={{ fontSize: 32 }}>{"\u{1f5fa}"}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#e6edf3" }}>
        Select a project
      </div>
      <div style={{ fontSize: 12, textAlign: "center", lineHeight: 1.6 }}>
        Click any marker on the map or an item in the ticker to view project details
      </div>
    </div>
  );
}
