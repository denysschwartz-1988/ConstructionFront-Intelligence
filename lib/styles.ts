import type { CSSProperties } from "react";

export const tabRootStyle: CSSProperties = {
  fontSize: 14,
  lineHeight: 1.7,
  padding: "12px 16px",
  backgroundColor: "#0a1628",
  color: "#e6edf3",
  display: "flex",
  flexDirection: "column",
  gap: 12
};

export const cardStyle: CSSProperties = {
  backgroundColor: "#0f2240",
  border: "1px solid #1e3a5f",
  borderRadius: 8,
  padding: "12px 14px",
  marginBottom: 0
};

export const sectionLabelStyle: CSSProperties = {
  color: "#f0a500",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  marginBottom: 10,
  paddingBottom: 6,
  borderBottom: "1px solid #f0a500",
  display: "block"
};

export const bodyTextStyle: CSSProperties = {
  color: "#e6edf3",
  fontSize: 14,
  lineHeight: 1.7,
  fontWeight: 400,
  margin: 0
};

export const mutedTextStyle: CSSProperties = {
  color: "#8b949e",
  fontSize: 13,
  lineHeight: 1.6,
  fontWeight: 400
};

export const rowLabelStyle: CSSProperties = {
  color: "#8b949e",
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  flexShrink: 0,
  fontWeight: 400,
  minWidth: 140
};

export const rowValueStyle: CSSProperties = {
  color: "#e6edf3",
  fontSize: 13,
  fontWeight: 500,
  textAlign: "right",
  flex: 1
};

export const rowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  padding: "7px 0",
  borderBottom: "1px solid #162f52"
};
