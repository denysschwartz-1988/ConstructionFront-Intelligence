export default function EmptyPanel() {
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: 32,
        backgroundColor: "#0f2240"
      }}
    >
      <div style={{ fontSize: 40 }}>{"\u{1f5fa}"}</div>
      <div
        style={{
          color: "#e6edf3",
          fontSize: 15,
          fontWeight: 600,
          textAlign: "center"
        }}
      >
        Select a project
      </div>
      <div
        style={{
          color: "#8b949e",
          fontSize: 12,
          textAlign: "center",
          lineHeight: 1.6,
          maxWidth: 200
        }}
      >
        Click any marker on the map or a project in the ticker to view intelligence
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
          marginTop: 8,
          opacity: 0.5
        }}
      >
        <div style={{ color: "#f0a500", fontSize: 20 }}>{"\u2191"}</div>
        <div style={{ color: "#8b949e", fontSize: 11 }}>or scroll the ticker above</div>
      </div>
    </div>
  );
}
