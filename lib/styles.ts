import type { CSSProperties } from "react";

export const systemFont =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, 'Helvetica Neue', Arial, sans-serif";

export const tabRootStyle: CSSProperties = {
  fontFamily: systemFont,
  fontSize: 13,
  padding: 16,
  backgroundColor: "#0d1117"
};

export const cardStyle: CSSProperties = {
  backgroundColor: "#0d1f35",
  border: "1px solid #1a3a5c",
  borderRadius: 6,
  padding: 12,
  marginBottom: 10
};

export const sectionLabelStyle: CSSProperties = {
  color: "#f0a500",
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  marginBottom: 8,
  paddingBottom: 6,
  borderBottom: "1px solid #f0a500",
  display: "block"
};

export const bodyTextStyle: CSSProperties = {
  color: "#e6edf3",
  fontSize: 13,
  lineHeight: 1.6
};

export const mutedTextStyle: CSSProperties = {
  color: "#8b949e",
  fontSize: 12,
  lineHeight: 1.5
};

export const rowLabelStyle: CSSProperties = {
  color: "#8b949e",
  fontSize: 10,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  flexShrink: 0
};

export const rowValueStyle: CSSProperties = {
  color: "#e6edf3",
  fontSize: 12,
  fontWeight: 500,
  textAlign: "right"
};
