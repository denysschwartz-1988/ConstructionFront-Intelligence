export default function EmptyTabsPlaceholder() {
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 8,
        color: "#8b949e",
        fontSize: 13
      }}
    >
      <div style={{ fontSize: 24 }}>{"\u{1f4ca}"}</div>
      <div>Select a project to view intelligence</div>
    </div>
  );
}
